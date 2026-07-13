import { createOrionSystem, ArtifactEngine, VirtualFileSystem } from '@/lib/orion';
import { NextRequest } from 'next/server';

// Mark as Edge-incompatible (uses Node APIs in OpenAI SDK)
export const runtime = 'nodejs';
// Disable Next.js body size limit for long streams
export const maxDuration = 300; // 5 minutes max for complex plans

// ─── Input validation ────────────────────────────────────────────────────────

const MIN_OBJECTIVE_LENGTH = 10;
const MAX_OBJECTIVE_LENGTH = 3000;

function validateObjective(objective: unknown): { valid: boolean; error?: string } {
  if (!objective || typeof objective !== 'string') {
    return { valid: false, error: 'objective must be a non-empty string' };
  }
  if (objective.trim().length < MIN_OBJECTIVE_LENGTH) {
    return { valid: false, error: `objective must be at least ${MIN_OBJECTIVE_LENGTH} characters` };
  }
  if (objective.length > MAX_OBJECTIVE_LENGTH) {
    return { valid: false, error: `objective must be under ${MAX_OBJECTIVE_LENGTH} characters` };
  }
  return { valid: true };
}

// ─── SSE Helpers ─────────────────────────────────────────────────────────────

function encodeSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: { objective?: unknown; priority?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { objective, priority = 'balanced' } = body;

  // Validate objective
  const validation = validateObjective(objective);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const safeObjective = (objective as string).trim();
  const safePriority = ['speed', 'quality', 'cost', 'balanced'].includes(priority as string)
    ? (priority as 'speed' | 'quality' | 'cost' | 'balanced')
    : 'balanced';

  // ─── SSE Stream ─────────────────────────────────────────────────────────────
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const write = async (event: string, data: unknown) => {
    try {
      await writer.write(encoder.encode(encodeSSE(event, data)));
    } catch {
      // Client disconnected — ignore
    }
  };

  // Run the plan in the background; stream events as they arrive
  (async () => {
    try {
      // Create a fresh Orchestrator per request (no singleton = no cross-request contamination)
      const orion = createOrionSystem();
      const artifactEngine = new ArtifactEngine();

      // Wire up SSE events from Orchestrator callbacks
      orion.onExecutionUpdate(async (status: string, data: unknown) => {
        await write(status, data);
      });

      await write('connected', { message: 'Orion AI stream connected', objective: safeObjective });

      // Execute plan — this will emit events via onExecutionUpdate
      const plan = await orion.executePlan(safeObjective, safePriority);
      const executionState = orion.getExecutionState();
      const summary = orion.getPlanSummary();
      const memory = orion.getSharedMemory();

      // Get task execution logs
      const taskLogs = (memory as any).taskExecutionLog || [];

      // Process artifacts from all task results
      const engineResults: any[] = [];
      const taskResults: Record<string, any> = {};

      for (const task of plan.tasks) {
        if (task.result) {
          const resultStr =
            typeof task.result === 'string' ? task.result : JSON.stringify(task.result);
          const engineResult = artifactEngine.process(resultStr);
          if (engineResult.vfs.size > 0) {
            engineResults.push(engineResult);
          }

          taskResults[task.id] = {
            description: task.description,
            status: task.status,
            result: resultStr.substring(0, 500),
            fullResult: task.result,
            artifacts: Array.from(engineResult.vfs.keys()),
          };
        }
      }

      let finalResult: any = null;
      if (engineResults.length > 0) {
        finalResult = artifactEngine.merge(engineResults);
      }

      // Calculate metrics
      const totalCost = taskLogs.reduce(
        (sum: number, log: any) => sum + (log.actualCost || 0),
        0,
      );
      const estimatedCost = taskLogs.reduce(
        (sum: number, log: any) => sum + (log.estimatedCost || 0),
        0,
      );
      const avgConfidence =
        taskLogs.length > 0
          ? taskLogs.reduce((sum: number, log: any) => sum + log.confidence, 0) / taskLogs.length
          : 0;
      const totalLatency = taskLogs.reduce(
        (sum: number, log: any) => sum + (log.latency || 0),
        0,
      );

      // Final result event
      await write('result', {
        success: true,
        plan,
        executionState,
        summary,
        taskResults,
        artifacts: finalResult
          ? {
              manifest: finalResult.manifest,
              vfs: VirtualFileSystem.toFlatRecord(finalResult.vfs),
              validation: finalResult.validation,
              framework: finalResult.framework.id,
              previewable: finalResult.previewable,
            }
          : null,
        metrics: {
          totalTasks: plan.tasks.length,
          completedTasks: summary.completed,
          failedTasks: summary.failed,
          totalCost: Number(totalCost.toFixed(4)),
          estimatedCost: Number(estimatedCost.toFixed(4)),
          averageConfidence: Number(avgConfidence.toFixed(2)),
          totalLatency,
          tasksPerSecond:
            totalLatency > 0
              ? Number(((plan.tasks.length / totalLatency) * 1000).toFixed(2))
              : 0,
        },
        executionLog: taskLogs,
      });
    } catch (error) {
      await write('error', {
        error: error instanceof Error ? error.message : 'Failed to execute plan',
      });
    } finally {
      try {
        await writer.close();
      } catch {
        // Already closed
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  });
}

import { z } from 'zod';
import { createOrionSystem, ArtifactEngine, VirtualFileSystem } from '@/lib/orion';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

const ExecuteBodySchema = z.object({
  objective: z
    .string()
    .trim()
    .min(10, 'objective must be at least 10 characters')
    .max(3000, 'objective must be under 3000 characters'),
  priority: z.enum(['speed', 'quality', 'cost', 'balanced']).default('balanced'),
});

function jsonError(status: number, error: string, code: string, retryAfter?: number) {
  const body: Record<string, unknown> = { error, code };
  if (retryAfter != null) body.retryAfter = retryAfter;
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(retryAfter != null ? { 'Retry-After': String(retryAfter) } : {}),
    },
  });
}

function encodeSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function looksLikePathedCode(resultStr: string): boolean {
  return (
    /```[\w+#.-]*\s+(?:path|file)\s*=/.test(resultStr) ||
    /```[\w./-]+\.[a-zA-Z0-9]+/.test(resultStr)
  );
}

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON body', 'INVALID_JSON');
  }

  const parsed = ExecuteBodySchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || 'Invalid request body';
    return jsonError(422, msg, 'VALIDATION_ERROR');
  }

  const { objective: safeObjective, priority: safePriority } = parsed.data;

  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const write = async (event: string, data: unknown) => {
    try {
      await writer.write(encoder.encode(encodeSSE(event, data)));
    } catch {
      // client disconnected
    }
  };

  (async () => {
    try {
      const orion = createOrionSystem();
      const artifactEngine = new ArtifactEngine();

      orion.onExecutionUpdate(async (status: string, data: unknown) => {
        await write(status, data);
      });

      await write('connected', { message: 'Orion AI stream connected', objective: safeObjective });

      const plan = await orion.executePlan(safeObjective, safePriority);
      const executionState = orion.getExecutionState();
      const summary = orion.getPlanSummary();
      const memory = orion.getSharedMemory();
      const taskLogs = (memory as any).taskExecutionLog || [];

      const engineResults: ReturnType<ArtifactEngine['process']>[] = [];
      const taskResults: Record<string, unknown> = {};
      const warnings: string[] = [];

      if (memory.research_degraded_note) {
        warnings.push(String(memory.research_degraded_note));
      }

      for (const task of plan.tasks) {
        if (!task.result) continue;
        const resultStr =
          typeof task.result === 'string' ? task.result : JSON.stringify(task.result);

        const shouldProcess =
          task.assignedTo === 'engineering' ||
          (task.assignedTo !== 'research' &&
            task.assignedTo !== 'marketing' &&
            looksLikePathedCode(resultStr));

        let engineResult: ReturnType<ArtifactEngine['process']> | null = null;
        if (shouldProcess && looksLikePathedCode(resultStr)) {
          engineResult = artifactEngine.process(resultStr);
          if (engineResult.vfs.size > 0) {
            if (task.assignedTo === 'engineering') engineResults.unshift(engineResult);
            else engineResults.push(engineResult);
          }
        }

        taskResults[task.id] = {
          description: task.description,
          status: task.status,
          agent: task.assignedTo,
          result: resultStr.substring(0, 500),
          fullResult: task.result,
          artifacts: engineResult ? Array.from(engineResult.vfs.keys()) : [],
        };
      }

      let finalResult: ReturnType<ArtifactEngine['merge']> | null = null;
      if (engineResults.length > 0) {
        finalResult = artifactEngine.merge(engineResults);
      } else if (plan.tasks.some((t) => t.assignedTo === 'engineering' && t.status === 'completed')) {
        warnings.push(
          'Engineering completed but no structured files were parsed. Check that the model returned path-tagged code fences.',
        );
      }

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
          ? taskLogs.reduce((sum: number, log: any) => sum + (log.confidence || 0), 0) /
            taskLogs.length
          : 0;
      const totalLatency = taskLogs.reduce(
        (sum: number, log: any) => sum + (log.latency || 0),
        0,
      );

      await write('result', {
        success: true,
        plan,
        executionState,
        summary,
        taskResults,
        warnings,
        artifacts: finalResult
          ? {
              manifest: finalResult.manifest,
              vfs: VirtualFileSystem.toFlatRecord(finalResult.vfs),
              validation: {
                ...finalResult.validation,
                warnings: [...(finalResult.validation.warnings || []), ...warnings],
              },
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
        code: 'EXECUTION_ERROR',
      });
    } finally {
      try {
        await writer.close();
      } catch {
        // already closed
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

import type { Plan, TaskMetadata } from './types';

export interface ExecutionReport {
  planId: string;
  objective: string;
  executionStartTime: string;
  executionEndTime: string;
  totalDuration: number; // ms
  summary: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    pendingTasks: number;
    successRate: number; // percentage
  };
  costs: {
    estimated: number;
    actual: number;
    difference: number;
    perTask: number;
  };
  performance: {
    totalLatency: number; // ms
    averageLatency: number; // ms per task
    tasksPerSecond: number;
    peakMemoryUsage?: number;
  };
  confidence: {
    average: number; // 0-1
    min: number;
    max: number;
  };
  models: {
    selected: string[];
    fallbacks: string[];
    distribution: Record<string, number>;
  };
  taskDetails: {
    taskId: string;
    agent: string;
    model: string;
    status: string;
    latency: number;
    cost: number;
    confidence: number;
    artifacts: string[];
  }[];
  artifacts: {
    total: number;
    byType: Record<string, number>;
    paths: string[];
  };
  errors?: {
    taskId: string;
    message: string;
    timestamp: string;
  }[];
}

export class ExecutionReportGenerator {
  generateReport(
    plan: Plan,
    taskExecutionLog: TaskMetadata[],
    artifacts: Record<string, string[]>,
  ): ExecutionReport {
    const startTime = new Date(plan.createdAt);
    const endTime = new Date();
    const totalDuration = endTime.getTime() - startTime.getTime();

    // Calculate summary
    const totalTasks = plan.tasks.length;
    const completedTasks = plan.tasks.filter((t) => t.status === 'completed').length;
    const failedTasks = plan.tasks.filter((t) => t.status === 'failed').length;
    const pendingTasks = plan.tasks.filter((t) => t.status === 'pending').length;

    // Calculate costs
    const estimatedCost = taskExecutionLog.reduce((sum, t) => sum + t.estimatedCost, 0);
    const actualCost = taskExecutionLog.reduce((sum, t) => sum + t.actualCost, 0);

    // Calculate performance metrics
    const totalLatency = taskExecutionLog.reduce((sum, t) => sum + t.latency, 0);
    const averageLatency = taskExecutionLog.length > 0 ? totalLatency / taskExecutionLog.length : 0;
    const tasksPerSecond = totalLatency > 0 ? (totalTasks / totalLatency) * 1000 : 0;

    // Calculate confidence
    const confidences = taskExecutionLog.map((t) => t.confidence);
    const averageConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b) / confidences.length : 0;
    const minConfidence = confidences.length > 0 ? Math.min(...confidences) : 0;
    const maxConfidence = confidences.length > 0 ? Math.max(...confidences) : 0;

    // Model analysis
    const selectedModels = new Set<string>();
    const fallbackModels = new Set<string>();
    const modelDistribution: Record<string, number> = {};

    taskExecutionLog.forEach((t) => {
      selectedModels.add(t.selectedModel);
      if (t.fallbackModel) {
        fallbackModels.add(t.fallbackModel);
      }
      modelDistribution[t.selectedModel] = (modelDistribution[t.selectedModel] || 0) + 1;
    });

    // Artifact analysis
    const allArtifactPaths: string[] = [];
    let codeArtifacts = 0;
    let configArtifacts = 0;
    let markdownArtifacts = 0;

    Object.values(artifacts).forEach((paths) => {
      paths.forEach((path) => {
        allArtifactPaths.push(path);
        if (path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.js')) {
          codeArtifacts++;
        } else if (path.includes('config') || path.endsWith('.json')) {
          configArtifacts++;
        } else if (path.endsWith('.md')) {
          markdownArtifacts++;
        }
      });
    });

    // Task details
    const taskDetails = taskExecutionLog.map((t) => ({
      taskId: t.taskId,
      agent: t.agent,
      model: t.selectedModel,
      status: t.status,
      latency: t.latency,
      cost: t.actualCost,
      confidence: t.confidence,
      artifacts: t.artifactPaths || [],
    }));

    // Errors
    const errors = taskExecutionLog
      .filter((t) => t.status === 'failed')
      .map((t) => ({
        taskId: t.taskId,
        message: `Task execution failed`,
        timestamp: t.executionEndTime || new Date().toISOString(),
      }));

    return {
      planId: plan.id,
      objective: plan.objective,
      executionStartTime: plan.createdAt,
      executionEndTime: endTime.toISOString(),
      totalDuration,
      summary: {
        totalTasks,
        completedTasks,
        failedTasks,
        pendingTasks,
        successRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      },
      costs: {
        estimated: Number(estimatedCost.toFixed(4)),
        actual: Number(actualCost.toFixed(4)),
        difference: Number((estimatedCost - actualCost).toFixed(4)),
        perTask: totalTasks > 0 ? Number((actualCost / totalTasks).toFixed(4)) : 0,
      },
      performance: {
        totalLatency,
        averageLatency: Number(averageLatency.toFixed(0)),
        tasksPerSecond: Number(tasksPerSecond.toFixed(2)),
      },
      confidence: {
        average: Number(averageConfidence.toFixed(2)),
        min: Number(minConfidence.toFixed(2)),
        max: Number(maxConfidence.toFixed(2)),
      },
      models: {
        selected: Array.from(selectedModels),
        fallbacks: Array.from(fallbackModels),
        distribution: modelDistribution,
      },
      taskDetails,
      artifacts: {
        total: allArtifactPaths.length,
        byType: {
          code: codeArtifacts,
          config: configArtifacts,
          markdown: markdownArtifacts,
        },
        paths: allArtifactPaths,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  serializeReport(report: ExecutionReport): string {
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════════════════════════════════');
    lines.push('                    ORION EXECUTION REPORT');
    lines.push('═══════════════════════════════════════════════════════════════════════');
    lines.push('');

    lines.push(`Objective: ${report.objective}`);
    lines.push(`Plan ID: ${report.planId}`);
    lines.push(`Duration: ${report.totalDuration}ms (${(report.totalDuration / 1000).toFixed(2)}s)`);
    lines.push('');

    // Summary
    lines.push('EXECUTION SUMMARY');
    lines.push('───────────────────────────────────────────────────────────────────────');
    lines.push(`Total Tasks:       ${report.summary.totalTasks}`);
    lines.push(`Completed:         ${report.summary.completedTasks} ✓`);
    lines.push(`Failed:            ${report.summary.failedTasks} ✗`);
    lines.push(`Pending:           ${report.summary.pendingTasks} ○`);
    lines.push(`Success Rate:      ${report.summary.successRate.toFixed(1)}%`);
    lines.push('');

    // Costs
    lines.push('COST ANALYSIS');
    lines.push('───────────────────────────────────────────────────────────────────────');
    lines.push(`Estimated Cost:    $${report.costs.estimated}`);
    lines.push(`Actual Cost:       $${report.costs.actual}`);
    lines.push(`Difference:        $${report.costs.difference}`);
    lines.push(`Cost per Task:     $${report.costs.perTask}`);
    lines.push('');

    // Performance
    lines.push('PERFORMANCE METRICS');
    lines.push('───────────────────────────────────────────────────────────────────────');
    lines.push(`Total Latency:     ${report.performance.totalLatency}ms`);
    lines.push(`Avg per Task:      ${report.performance.averageLatency}ms`);
    lines.push(`Tasks/Second:      ${report.performance.tasksPerSecond}`);
    lines.push('');

    // Confidence
    lines.push('CONFIDENCE SCORES');
    lines.push('───────────────────────────────────────────────────────────────────────');
    lines.push(`Average:           ${(report.confidence.average * 100).toFixed(1)}%`);
    lines.push(`Range:             ${(report.confidence.min * 100).toFixed(1)}% - ${(report.confidence.max * 100).toFixed(1)}%`);
    lines.push('');

    // Models
    lines.push('MODEL USAGE');
    lines.push('───────────────────────────────────────────────────────────────────────');
    lines.push('Selected Models:');
    report.models.selected.forEach((m) => {
      const count = report.models.distribution[m] || 0;
      lines.push(`  • ${m} (${count} tasks)`);
    });
    if (report.models.fallbacks.length > 0) {
      lines.push('Fallback Models:');
      report.models.fallbacks.forEach((m) => {
        lines.push(`  • ${m}`);
      });
    }
    lines.push('');

    // Artifacts
    lines.push('ARTIFACTS GENERATED');
    lines.push('───────────────────────────────────────────────────────────────────────');
    lines.push(`Total Artifacts:   ${report.artifacts.total}`);
    lines.push(`Code Files:        ${report.artifacts.byType.code}`);
    lines.push(`Config Files:      ${report.artifacts.byType.config}`);
    lines.push(`Documentation:     ${report.artifacts.byType.markdown}`);
    lines.push('');

    if (report.artifacts.paths.length > 0) {
      lines.push('Generated Files:');
      report.artifacts.paths.forEach((p) => {
        lines.push(`  📄 ${p}`);
      });
      lines.push('');
    }

    // Errors
    if (report.errors && report.errors.length > 0) {
      lines.push('ERRORS');
      lines.push('───────────────────────────────────────────────────────────────────────');
      report.errors.forEach((e) => {
        lines.push(`[${e.taskId}] ${e.message} (${e.timestamp})`);
      });
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════════════════════════════════');

    return lines.join('\n');
  }
}

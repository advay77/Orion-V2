'use client';

import { useEffect, useState } from 'react';
import { Plan, ExecutionState } from '@/lib/orion';

interface DashboardState {
  plan: Plan | null;
  state: ExecutionState;
  summary: {
    totalTasks: number;
    completed: number;
    failed: number;
    pending: number;
    inProgress: number;
  };
  memory: Record<string, unknown>;
  loading: boolean;
  error: string | null;
}

export function OrionDashboard() {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    plan: null,
    state: {
      currentPlanId: '',
      currentTaskId: '',
      runningAgents: [],
      completedTasks: [],
      failedTasks: [],
      lastUpdate: '',
    },
    summary: {
      totalTasks: 0,
      completed: 0,
      failed: 0,
      pending: 0,
      inProgress: 0,
    },
    memory: {},
    loading: false,
    error: null,
  });

  const [objective, setObjective] = useState('');

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, []);

  async function fetchState() {
    try {
      const response = await fetch('/api/orion/state');
      if (!response.ok) throw new Error('Failed to fetch state');
      const data = await response.json();
      setDashboardState((prev) => ({
        ...prev,
        plan: data.plan,
        state: data.state,
        summary: data.summary,
        memory: data.memory,
        error: null,
      }));
    } catch (error) {
      setDashboardState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }

  async function handleCreatePlan() {
    if (!objective.trim()) return;

    setDashboardState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/orion/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective }),
      });

      if (!response.ok) throw new Error('Failed to create plan');

      const data = await response.json();
      setDashboardState((prev) => ({
        ...prev,
        plan: data.plan,
        state: data.state,
        summary: data.summary,
        loading: false,
      }));

      setObjective('');
    } catch (error) {
      setDashboardState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }

  const progressPercent =
    dashboardState.summary.totalTasks > 0
      ? Math.round(
          ((dashboardState.summary.completed + dashboardState.summary.failed) /
            dashboardState.summary.totalTasks) *
            100,
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            ORION AI
          </h1>
          <p className="text-slate-400">AI Operating System Execution Dashboard</p>
        </div>

        {/* Input Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm">
          <div className="flex gap-4">
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlan()}
              placeholder="Enter an objective to plan and execute..."
              className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              disabled={dashboardState.loading}
            />
            <button
              onClick={handleCreatePlan}
              disabled={dashboardState.loading || !objective.trim()}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {dashboardState.loading ? 'Executing...' : 'Execute Plan'}
            </button>
          </div>
        </div>

        {dashboardState.error && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 text-red-200">{dashboardState.error}</div>
        )}

        {/* Stats Grid */}
        {dashboardState.plan && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Total Tasks" value={dashboardState.summary.totalTasks} color="from-slate-500" />
            <StatCard label="Completed" value={dashboardState.summary.completed} color="from-green-500" />
            <StatCard label="In Progress" value={dashboardState.summary.inProgress} color="from-cyan-500" />
            <StatCard label="Failed" value={dashboardState.summary.failed} color="from-red-500" />
            <StatCard label="Pending" value={dashboardState.summary.pending} color="from-yellow-500" />
          </div>
        )}

        {/* Progress Bar */}
        {dashboardState.plan && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Overall Progress</span>
              <span className="text-cyan-400 font-semibold">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Plan Details */}
        {dashboardState.plan && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Execution Plan</h2>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm">
              <p className="text-slate-300 mb-4">
                <strong>Objective:</strong> {dashboardState.plan.objective}
              </p>

              {/* Task Lanes */}
              <div className="space-y-6">
                {['engineering', 'research', 'marketing'].map((agentType) => {
                  const tasks = dashboardState.plan?.tasks.filter((t) => t.assignedTo === agentType) || [];
                  return (
                    <div key={agentType} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${getAgentColor(agentType)}`}
                        />
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                          {agentType} Agent
                        </h3>
                        {dashboardState.state.runningAgents.includes(agentType as any) && (
                          <span className="text-xs text-cyan-400 animate-pulse">● Active</span>
                        )}
                      </div>

                      <div className="space-y-2 ml-4">
                        {tasks.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">No tasks assigned</p>
                        ) : (
                          tasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Shared Memory */}
        {Object.keys(dashboardState.memory).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Shared Memory Context</h2>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm max-h-96 overflow-auto">
              <pre className="text-xs text-slate-400 font-mono">
                {JSON.stringify(dashboardState.memory, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm">
      <div className={`text-3xl font-bold bg-gradient-to-br ${color} to-slate-400 bg-clip-text text-transparent`}>
        {value}
      </div>
      <div className="text-xs text-slate-400 uppercase tracking-wider mt-2">{label}</div>
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  const statusColor =
    task.status === 'completed'
      ? 'bg-green-900/30 border-green-700/50 text-green-300'
      : task.status === 'failed'
        ? 'bg-red-900/30 border-red-700/50 text-red-300'
        : task.status === 'in_progress'
          ? 'bg-cyan-900/30 border-cyan-700/50 text-cyan-300'
          : 'bg-slate-900/30 border-slate-700/50 text-slate-300';

  const statusIcon =
    task.status === 'completed'
      ? '✓'
      : task.status === 'failed'
        ? '✗'
        : task.status === 'in_progress'
          ? '⟳'
          : '◯';

  return (
    <div className={`border rounded-lg p-3 ${statusColor}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg mt-1">{statusIcon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{task.description}</p>
          {task.result && (
            <p className="text-xs mt-1 opacity-75 line-clamp-2">{task.result}</p>
          )}
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded uppercase whitespace-nowrap`}>
          {task.priority}
        </span>
      </div>
    </div>
  );
}

function getAgentColor(agentType: string): string {
  switch (agentType) {
    case 'engineering':
      return 'bg-blue-500';
    case 'research':
      return 'bg-purple-500';
    case 'marketing':
      return 'bg-green-500';
    default:
      return 'bg-slate-500';
  }
}

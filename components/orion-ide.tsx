'use client';

import { useEffect, useRef, useState } from 'react';
import { Plan, ExecutionState } from '@/lib/orion';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentDashboard } from '@/components/ide/agent-dashboard';
import { ArtifactWorkspace } from '@/components/ide/artifact-workspace';
import { ErrorBoundary } from '@/components/error-boundary';
import { Rocket, BarChart2, Terminal, ChevronRight, Sparkles, Loader2, WifiOff } from 'lucide-react';

interface IDEState {
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
  taskResults?: Record<string, any>;
  artifacts?: Record<string, any>;
  metrics?: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalCost: number;
    estimatedCost: number;
    averageConfidence: number;
    totalLatency: number;
    tasksPerSecond: number;
  };
  streamStatus: string;
}

const INITIAL_STATE: IDEState = {
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
  streamStatus: '',
};

export function OrionIDE() {
  const [ideState, setIdeState] = useState<IDEState>(INITIAL_STATE);
  const [objective, setObjective] = useState('');
  const [priority] = useState<'speed' | 'quality' | 'cost' | 'balanced'>('balanced');
  // Ref to abort any in-flight request when user submits a new one
  const abortRef = useRef<AbortController | null>(null);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function handleCreatePlan(customObjective?: string) {
    const finalObjective = customObjective !== undefined ? customObjective : objective;
    if (!finalObjective.trim()) return;

    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIdeState((prev) => ({
      ...INITIAL_STATE,
      loading: true,
      error: null,
      streamStatus: 'Connecting…',
    }));

    try {
      const response = await fetch('/api/orion/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: finalObjective, priority }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to execute plan' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      if (!response.body) throw new Error('No response body');

      // ─── Consume SSE stream ─────────────────────────────────────────────────
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split('\n\n');
        buffer = messages.pop() ?? '';

        for (const message of messages) {
          if (!message.trim()) continue;

          const lines = message.split('\n');
          let eventType = 'message';
          let dataLine = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim();
            if (line.startsWith('data: ')) dataLine = line.slice(6);
          }

          if (!dataLine) continue;

          try {
            const data = JSON.parse(dataLine);
            handleStreamEvent(eventType, data);
          } catch {
            // Malformed SSE frame — skip
          }
        }
      }

      setObjective('');
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return; // User cancelled
      setIdeState((prev) => ({
        ...prev,
        loading: false,
        streamStatus: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }

  function handleStreamEvent(event: string, data: any) {
    switch (event) {
      case 'connected':
        setIdeState((prev) => ({ ...prev, streamStatus: 'Planning…' }));
        break;

      case 'planning':
        setIdeState((prev) => ({ ...prev, streamStatus: 'Creating plan…' }));
        break;

      case 'plan_created':
        setIdeState((prev) => ({
          ...prev,
          plan: data,
          streamStatus: 'Plan created — executing tasks…',
        }));
        break;

      case 'wave_start':
        setIdeState((prev) => ({
          ...prev,
          streamStatus: `Wave ${data.waveNumber}/${data.totalWaves} — ${data.tasks?.length ?? 0} tasks running…`,
        }));
        break;

      case 'task_start':
        setIdeState((prev) => ({
          ...prev,
          streamStatus: `▶ ${data.description ?? data.taskId}`,
          // Update the task status to in_progress in the local plan
          plan: prev.plan
            ? {
                ...prev.plan,
                tasks: prev.plan.tasks.map((t) =>
                  t.id === data.taskId ? { ...t, status: 'in_progress' as const } : t,
                ),
              }
            : prev.plan,
        }));
        break;

      case 'task_complete':
        setIdeState((prev) => ({
          ...prev,
          streamStatus: `✓ ${data.taskId}`,
          plan: prev.plan
            ? {
                ...prev.plan,
                tasks: prev.plan.tasks.map((t) =>
                  t.id === data.taskId
                    ? { ...t, status: 'completed' as const, result: data.result, metadata: data.metadata }
                    : t,
                ),
              }
            : prev.plan,
          summary: {
            ...prev.summary,
            completed: prev.summary.completed + 1,
            pending: Math.max(0, prev.summary.pending - 1),
          },
        }));
        break;

      case 'task_failed':
        setIdeState((prev) => ({
          ...prev,
          plan: prev.plan
            ? {
                ...prev.plan,
                tasks: prev.plan.tasks.map((t) =>
                  t.id === data.taskId ? { ...t, status: 'failed' as const, result: data.error } : t,
                ),
              }
            : prev.plan,
          summary: {
            ...prev.summary,
            failed: prev.summary.failed + 1,
            pending: Math.max(0, prev.summary.pending - 1),
          },
        }));
        break;

      case 'complete':
        setIdeState((prev) => ({ ...prev, streamStatus: 'Finalizing…' }));
        break;

      case 'result':
        setIdeState((prev) => ({
          ...prev,
          loading: false,
          streamStatus: '',
          plan: data.plan ?? prev.plan,
          state: data.executionState ?? prev.state,
          summary: data.summary ?? prev.summary,
          taskResults: data.taskResults,
          artifacts: data.artifacts,
          metrics: data.metrics,
        }));
        break;

      case 'error':
        setIdeState((prev) => ({
          ...prev,
          loading: false,
          streamStatus: '',
          error: data.error ?? 'An unknown error occurred',
        }));
        break;
    }
  }

  const suggestionTemplates = [
    {
      title: 'Build SaaS Landing Page',
      desc: 'Next.js portfolio or landing page with sleek dark mode, testimonials, and glassmorphism styling.',
      prompt:
        'Build a premium full-stack Next.js SaaS landing page with dark mode, an interactive pricing section, client testimonial carousels, and glassmorphic contact form.',
      icon: Rocket,
      color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/30',
    },
    {
      title: 'Market Research Plan',
      desc: 'Analyze top AI developer tools, outline feature gaps, and draft a product differentiation strategy.',
      prompt:
        'Perform market research on top-performing developer tools, list their core strengths and feature gaps, and write a marketing strategy to launch a competitor.',
      icon: BarChart2,
      color: 'text-green-400 bg-green-950/40 border-green-800/30',
    },
    {
      title: 'Optimized Python Scraper',
      desc: 'Build an elegant web scraper to parse stock index trends and exports cleaned CSV records.',
      prompt:
        'Write an optimized, production-grade Python script that scrapes financial market data, handles rate limits, parses HTML content, and outputs structured CSV records.',
      icon: Terminal,
      color: 'text-purple-400 bg-purple-950/40 border-purple-800/30',
    },
  ];

  const completionPct = Math.round(
    ((ideState.summary.completed + ideState.summary.failed) / (ideState.summary.totalTasks || 1)) *
      100,
  );

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col overflow-y-auto lg:overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-16 bg-[#0d1117] border-b border-[#21262d]/60 flex items-center justify-between px-6 sticky top-0 z-50 shrink-0 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-xl shadow-cyan-500/25">
            <span className="text-white font-black text-lg">O</span>
          </div>
          <h1 className="text-white font-black text-xl tracking-widest">ORION AI</h1>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-2xl mx-8">
          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreatePlan()}
            placeholder={
              ideState.loading
                ? ideState.streamStatus || 'Executing…'
                : 'Enter objective to execute…'
            }
            className="flex-1 px-5 py-3 bg-[#161b22] border border-[#21262d] rounded-xl text-white placeholder-[#6e7681] text-base focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all font-sans"
            disabled={ideState.loading}
          />
          <button
            onClick={() => handleCreatePlan()}
            disabled={ideState.loading || !objective.trim()}
            className="px-7 py-3 bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-cyan-500/25 flex items-center gap-2"
          >
            {ideState.loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="tracking-tight">Running…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span className="tracking-tight">Launch</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm text-[#8b949e] font-medium">
          {ideState.loading && ideState.streamStatus && (
            <span className="hidden md:inline text-cyan-400/80 text-xs font-mono animate-pulse max-w-[200px] truncate">
              {ideState.streamStatus}
            </span>
          )}
          <span className="hidden md:inline">
            Tasks: {ideState.summary.completed}/{ideState.summary.totalTasks}
          </span>
          <span className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950/50 to-blue-950/50 border border-cyan-700/30 text-cyan-300 font-bold">
            {completionPct}%
          </span>
        </div>
      </motion.header>

      {/* Stream Status Bar */}
      <AnimatePresence>
        {ideState.loading && ideState.streamStatus && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-cyan-950/20 border-b border-cyan-700/30 px-6 py-2 text-cyan-300 text-xs font-mono flex items-center gap-2"
          >
            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
            {ideState.streamStatus}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Banner */}
      <AnimatePresence>
        {ideState.error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-900/20 border-b border-red-700/50 px-6 py-3 text-red-200 text-base font-semibold flex items-center gap-3"
          >
            <WifiOff className="w-4 h-4 shrink-0" />
            {ideState.error}
            <button
              onClick={() => setIdeState((p) => ({ ...p, error: null }))}
              className="ml-auto text-red-400 hover:text-red-200 text-xs underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main IDE Layout */}
      <div className="flex-1 flex flex-col overflow-visible lg:overflow-hidden min-h-[calc(100vh-4rem)]">
        {!ideState.plan ? (
          // Empty State
          <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-b from-[#0d1117] via-[#161b22]/30 to-[#0d1117]">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl w-full space-y-10"
            >
              {/* Logo / Header */}
              <div className="text-center space-y-4">
                <div className="w-28 h-28 mx-auto bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full flex items-center justify-center border border-cyan-500/40 shadow-2xl shadow-cyan-500/10">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/40 animate-pulse">
                    <span className="text-white font-black text-4xl">O</span>
                  </div>
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight">ORION AI Console</h2>
                <p className="text-[#8b949e] max-w-lg mx-auto text-lg leading-relaxed">
                  Plan, engineer, analyze, and market. Enter your objective below and watch our agent workspace assemble your project.
                </p>
              </div>

              {/* Chat-style prompt console card */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-7 shadow-2xl shadow-black/50 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

                <textarea
                  rows={5}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCreatePlan();
                  }}
                  placeholder="Describe your project objective in detail (e.g., 'Build a task manager dashboard using React and Tailwindcss with local storage...')"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-5 text-white placeholder-[#6e7681] text-base focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all font-sans resize-none"
                  disabled={ideState.loading}
                />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4">
                  <p className="text-[#484f58] text-xs">
                    Press <kbd className="px-1 py-0.5 bg-[#21262d] border border-[#30363d] rounded text-[#8b949e] font-mono">Ctrl+Enter</kbd> to submit
                  </p>
                  <button
                    onClick={() => handleCreatePlan()}
                    disabled={ideState.loading || !objective.trim()}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-3 self-end"
                  >
                    {ideState.loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="tracking-tight text-lg">
                          {ideState.streamStatus || 'Initializing…'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        <span className="tracking-tight text-lg">Launch Engine</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Suggestions Templates Grid */}
              <div className="space-y-4">
                <h3 className="text-sm text-[#8b949e] font-bold uppercase tracking-[0.3em] text-center">
                  Quick Start Templates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {suggestionTemplates.map((template, idx) => {
                    const Icon = template.icon;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => setObjective(template.prompt)}
                        className="bg-[#161b22]/60 hover:bg-[#161b22] border border-[#30363d] rounded-2xl p-6 cursor-pointer hover:border-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-500/15 transition-all group flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div
                            className={`w-12 h-12 rounded-xl border flex items-center justify-center ${template.color}`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <h4 className="text-white text-sm font-bold group-hover:text-cyan-300 transition-colors">
                            {template.title}
                          </h4>
                          <p className="text-[#8b949e] leading-relaxed text-sm">{template.desc}</p>
                        </div>
                        <div className="flex items-center text-cyan-300 font-bold text-xs pt-4 group-hover:translate-x-2 transition-transform">
                          <span>Apply prompt</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          // IDE Layout with execution
          <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
            {/* Left Panel - Agent Dashboard */}
            <div className="w-full lg:w-[400px] lg:min-w-[350px] lg:max-w-[600px] border-b lg:border-b-0 lg:border-r border-[#30363d] overflow-visible lg:overflow-y-auto flex flex-col bg-[#161b22]/20">
              <ErrorBoundary>
                <AgentDashboard
                  plan={ideState.plan}
                  state={ideState.state}
                  summary={ideState.summary}
                  memory={ideState.memory}
                  taskResults={ideState.taskResults}
                  metrics={ideState.metrics}
                />
              </ErrorBoundary>
            </div>

            {/* Resize Handle (Desktop Only) */}
            <div className="hidden lg:block w-1 bg-[#30363d] hover:bg-cyan-500 cursor-col-resize transition-colors shrink-0" />

            {/* Right Panel - Artifact Workspace */}
            <div className="flex-1 overflow-visible lg:overflow-y-auto flex flex-col">
              <ErrorBoundary>
                <ArtifactWorkspace
                  plan={ideState.plan}
                  artifacts={ideState.artifacts}
                  taskResults={ideState.taskResults}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

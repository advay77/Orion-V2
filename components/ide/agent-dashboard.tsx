'use client';

import { useState } from 'react';
import { Plan, ExecutionState } from '@/lib/orion';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Clock, DollarSign, Zap, Activity, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface AgentDashboardProps {
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
  taskResults?: Record<string, any>;
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
}

interface TaskMetricDetail {
  description: string;
  status: string;
  model: string;
  latency: number;
  latencyIsEst: boolean;
  latencyFormula: string;
  tokens: number;
  tokensIsEst: boolean;
  tokensFormula: string;
  cost: number;
  costIsEst: boolean;
  costFormula: string;
  confidence: number;
  confidenceIsEst: boolean;
  confidenceFormula: string;
}

interface AgentMetrics {
  status: 'idle' | 'running' | 'completed' | 'error';
  model: string;
  tokens: number;
  latency: number;
  confidence: number;
  cost: number;
  isEstimated: boolean;
  timeline: Array<{ time: number; event: string }>;
  tasksDetail: TaskMetricDetail[];
}

const MODEL_SPECS: Record<string, { speed: number; cost: number; capability: number; promptPrice: number; completionPrice: number }> = {
  'deepseek/deepseek-chat': { speed: 7, cost: 15000, capability: 9, promptPrice: 0.14, completionPrice: 0.28 },
  'deepseek/deepseek-r1': { speed: 5, cost: 10000, capability: 10, promptPrice: 0.55, completionPrice: 2.19 },
  'qwen/qwen-3-coder-235b': { speed: 6, cost: 12000, capability: 9, promptPrice: 0.50, completionPrice: 1.00 },
  'glm-5-2': { speed: 8, cost: 18000, capability: 8, promptPrice: 0.20, completionPrice: 0.40 },
  'kimi/kimi-k2.7': { speed: 8, cost: 20000, capability: 7, promptPrice: 0.12, completionPrice: 0.12 },
  'minimax/minimax-m3': { speed: 9, cost: 25000, capability: 6, promptPrice: 0.10, completionPrice: 0.10 },
  'unknown': { speed: 7, cost: 15000, capability: 8, promptPrice: 0.15, completionPrice: 0.30 },
};

export function AgentDashboard({ plan, state, summary, memory, taskResults, metrics }: AgentDashboardProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const agents = [
    { id: 'planner', name: 'Planner', color: 'from-purple-500 to-purple-600', icon: Cpu },
    { id: 'engineering', name: 'Engineering', color: 'from-blue-500 to-blue-600', icon: Zap },
    { id: 'research', name: 'R&D', color: 'from-green-500 to-green-600', icon: Activity },
    { id: 'marketing', name: 'Marketing', color: 'from-orange-500 to-orange-600', icon: DollarSign },
  ];

  const getAgentMetrics = (agentId: string): AgentMetrics => {
    const isRunning = state.runningAgents.includes(agentId as any);
    const tasks = plan?.tasks.filter((t) => t.assignedTo === agentId) || [];
    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const failedTasks = tasks.filter((t) => t.status === 'failed');
    
    // Only show metrics if agent has tasks
    if (tasks.length === 0) {
      return {
        status: 'idle',
        model: getModelName(agentId),
        tokens: 0,
        latency: 0,
        confidence: 0,
        cost: 0,
        isEstimated: true,
        timeline: [],
        tasksDetail: [],
      };
    }

    const modelName = tasks.find(t => t.metadata)?.metadata?.selectedModel || getModelName(agentId);
    const spec = MODEL_SPECS[modelName] || MODEL_SPECS['unknown'];
    const requiredCapability = agentId === 'engineering' ? 8 : agentId === 'research' ? 9 : 7;
    
    const tasksDetail: TaskMetricDetail[] = tasks.map((task) => {
      const metadata = task.metadata;
      const taskModel = metadata?.selectedModel || modelName;
      const taskSpec = MODEL_SPECS[taskModel] || spec;
      
      let latencyValue = 0;
      let latencyIsEst = false;
      let latencyFormula = '';
      
      let tokensValue = 0;
      let tokensIsEst = false;
      let tokensFormula = '';
      
      let costValue = 0;
      let costIsEst = false;
      let costFormula = '';
      
      let confidenceValue = 0;
      let confidenceIsEst = false;
      let confidenceFormula = '';

      // 1. Latency
      if (metadata && metadata.latency > 0) {
        latencyValue = metadata.latency;
        latencyFormula = `Actual execution duration = ${metadata.latency}ms`;
      } else {
        latencyIsEst = true;
        latencyValue = Math.round((100 / taskSpec.speed) * 100);
        latencyFormula = `Est: (100 / speed:${taskSpec.speed}) * 100 = ${latencyValue}ms`;
      }

      // 2. Tokens
      if (metadata && metadata.tokens > 0) {
        tokensValue = metadata.tokens;
        tokensFormula = `Actual usage = ${metadata.tokens.toLocaleString()} tokens`;
      } else {
        tokensIsEst = true;
        tokensValue = 1000; // Est. 1000 tokens
        tokensFormula = `Est. baseline = 1,000 tokens (700 prompt, 300 completion)`;
      }

      // 3. Cost
      if (metadata && metadata.actualCost > 0) {
        costValue = metadata.actualCost;
        costFormula = `Actual: (prompt_tokens * $${taskSpec.promptPrice}/1M) + (comp_tokens * $${taskSpec.completionPrice}/1M) = $${metadata.actualCost.toFixed(6)}`;
      } else {
        costIsEst = true;
        const promptEst = 700;
        const completionEst = 300;
        costValue = (promptEst / 1_000_000) * taskSpec.promptPrice + (completionEst / 1_000_000) * taskSpec.completionPrice;
        costFormula = `Est: (700 * $${taskSpec.promptPrice}/1M) + (300 * $${taskSpec.completionPrice}/1M) = $${costValue.toFixed(6)}`;
      }

      // 4. Confidence
      if (metadata && metadata.confidence > 0) {
        confidenceValue = Math.round(metadata.confidence * 100);
        const gap = taskSpec.capability - requiredCapability;
        const gapBonus = Math.min(gap * 2.5, 40);
        confidenceFormula = `Formula: 50 + min(gap:${gap} * 2.5, 40) - ambiguity:0 = ${confidenceValue}%`;
      } else {
        confidenceIsEst = true;
        const gap = taskSpec.capability - requiredCapability;
        const gapBonus = Math.min(gap * 2.5, 40);
        const score = 50 + gapBonus;
        confidenceValue = Math.round(score);
        confidenceFormula = `Est: 50 + min(gap:${gap} * 2.5, 40) - ambiguity:0 = ${confidenceValue}%`;
      }

      return {
        description: task.description,
        status: task.status,
        model: taskModel,
        latency: latencyValue,
        latencyIsEst,
        latencyFormula,
        tokens: tokensValue,
        tokensIsEst,
        tokensFormula,
        cost: costValue,
        costIsEst,
        costFormula,
        confidence: confidenceValue,
        confidenceIsEst,
        confidenceFormula,
      };
    });

    // Aggregate values
    const hasCompletedTasks = completedTasks.length > 0;
    const aggregatedTokens = tasksDetail.reduce((sum, t) => sum + t.tokens, 0);
    const aggregatedLatency = tasksDetail.reduce((sum, t) => sum + t.latency, 0);
    const aggregatedCost = Number(tasksDetail.reduce((sum, t) => sum + t.cost, 0).toFixed(6));
    const confidenceSum = tasksDetail.reduce((sum, t) => sum + t.confidence, 0);
    const averageConfidence = tasksDetail.length > 0 ? Math.round(confidenceSum / tasksDetail.length) : 0;

    return {
      status: isRunning ? 'running' : failedTasks.length > 0 ? 'error' : completedTasks.length > 0 ? 'completed' : 'idle',
      model: modelName,
      tokens: aggregatedTokens,
      latency: aggregatedLatency,
      confidence: averageConfidence,
      cost: aggregatedCost,
      isEstimated: !hasCompletedTasks,
      timeline: generateTimeline(tasks),
      tasksDetail,
    };
  };

  const getModelName = (agentId: string): string => {
    const models: Record<string, string> = {
      planner: 'deepseek/deepseek-chat',
      engineering: 'qwen/qwen-3-coder-235b',
      research: 'glm-5-2',
      marketing: 'deepseek/deepseek-chat',
    };
    return models[agentId] || 'Unknown';
  };

  const generateTimeline = (tasks: any[]) => {
    const timeline: Array<{ time: number; event: string }> = [];
    
    tasks.forEach((task) => {
      if (task.metadata?.executionStartTime && task.metadata?.executionEndTime) {
        const startTime = new Date(task.metadata.executionStartTime).getTime();
        const endTime = new Date(task.metadata.executionEndTime).getTime();
        const duration = Math.round((endTime - startTime) / 1000);
        
        timeline.push({
          time: duration,
          event: task.description.substring(0, 40),
        });
      } else if (task.status === 'in_progress' && task.metadata?.executionStartTime) {
        const startTime = new Date(task.metadata.executionStartTime).getTime();
        const now = Date.now();
        const duration = Math.round((now - startTime) / 1000);
        
        timeline.push({
          time: duration,
          event: task.description.substring(0, 40),
        });
      }
    });
    
    return timeline;
  };

  // Don't render if no plan exists
  if (!plan) {
    return null;
  }

  return (
    <div className="h-full bg-[#161b22] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#30363d]">
        <h2 className="text-white font-semibold text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Agent Execution
        </h2>
      </div>

      {/* Agent Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {agents.map((agent) => {
          const agentMetrics = getAgentMetrics(agent.id);
          const Icon = agent.icon;
          const tasks = plan?.tasks.filter((t) => t.assignedTo === agent.id) || [];
          const hasTasks = tasks.length > 0;
          
          // Only show agent card if it has tasks or is running
          if (!hasTasks && agentMetrics.status === 'idle') {
            return null;
          }
          
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 space-y-3"
            >
              {/* Agent Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium text-sm">{agent.name}</h3>
                      {agentMetrics.isEstimated && (
                        <span className="text-[9px] px-1 bg-orange-950/50 border border-orange-500/30 text-orange-400 rounded">
                          Estimated
                        </span>
                      )}
                    </div>
                    <p className="text-[#8b949e] text-xs font-mono truncate max-w-[180px]">{agentMetrics.model}</p>
                  </div>
                </div>
                <StatusBadge status={agentMetrics.status} />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  icon={Clock}
                  label="Latency"
                  value={`${agentMetrics.latency.toLocaleString()}ms`}
                  color="text-cyan-400"
                />
                <MetricCard
                  icon={Cpu}
                  label="Tokens"
                  value={agentMetrics.tokens.toLocaleString()}
                  color="text-purple-400"
                />
                <MetricCard
                  icon={Zap}
                  label="Confidence"
                  value={`${agentMetrics.confidence}%`}
                  color="text-green-400"
                />
                <MetricCard
                  icon={DollarSign}
                  label="Cost"
                  value={`$${agentMetrics.cost.toFixed(4)}`}
                  color="text-orange-400"
                />
              </div>

              {/* Collapsible Formulas Details */}
              <div>
                <button
                  onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                  className="w-full flex items-center justify-between text-xs text-[#8b949e] hover:text-cyan-400 py-1.5 border-t border-[#21262d] mt-2 transition-colors duration-200"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Info className="w-3.5 h-3.5" />
                    {expandedAgent === agent.id ? 'Hide Calculation Formulas' : 'View Calculation Formulas'}
                  </span>
                  {expandedAgent === agent.id ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedAgent === agent.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 mt-1 border-t border-[#21262d]/50 space-y-2 text-[10px]">
                        {agentMetrics.tasksDetail.map((taskDetail, idx) => (
                          <div key={idx} className="bg-[#161b22] border border-[#30363d] rounded p-2.5 space-y-2">
                            <div className="flex items-center justify-between border-b border-[#21262d] pb-1">
                              <span className="font-medium text-white truncate max-w-[200px]" title={taskDetail.description}>
                                Task: {taskDetail.description}
                              </span>
                              <span className="text-[9px] text-cyan-400 px-1 bg-cyan-950/30 rounded border border-cyan-800/30 capitalize">
                                {taskDetail.status}
                              </span>
                            </div>
                            <div className="space-y-1.5 font-mono text-[#8b949e]">
                              <div>
                                <span className="text-cyan-400 font-semibold">⚡ Latency:</span>{' '}
                                <span className="text-white">{taskDetail.latency}ms</span>
                                {taskDetail.latencyIsEst && <span className="text-orange-400 text-[8px] ml-1">(Est.)</span>}
                                <div className="text-[9px] text-[#58a6ff] pl-2 mt-0.5">{taskDetail.latencyFormula}</div>
                              </div>
                              <div>
                                <span className="text-purple-400 font-semibold">🪙 Tokens:</span>{' '}
                                <span className="text-white">{taskDetail.tokens.toLocaleString()}</span>
                                {taskDetail.tokensIsEst && <span className="text-orange-400 text-[8px] ml-1">(Est.)</span>}
                                <div className="text-[9px] text-[#bc8cff] pl-2 mt-0.5">{taskDetail.tokensFormula}</div>
                              </div>
                              <div>
                                <span className="text-green-400 font-semibold">🎯 Confidence:</span>{' '}
                                <span className="text-white">{taskDetail.confidence}%</span>
                                {taskDetail.confidenceIsEst && <span className="text-orange-400 text-[8px] ml-1">(Est.)</span>}
                                <div className="text-[9px] text-[#3fb950] pl-2 mt-0.5">{taskDetail.confidenceFormula}</div>
                              </div>
                              <div>
                                <span className="text-orange-400 font-semibold">💵 Cost:</span>{' '}
                                <span className="text-white">${taskDetail.cost.toFixed(6)}</span>
                                {taskDetail.costIsEst && <span className="text-orange-400 text-[8px] ml-1">(Est.)</span>}
                                <div className="text-[9px] text-[#ffab70] pl-2 mt-0.5">{taskDetail.costFormula}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Task Details - Prompt, Reasoning, Output */}
              {tasks.length > 0 && (
                <div className="pt-2 border-t border-[#21262d] space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="text-xs">
                      <p className="text-[#8b949e] mb-1 font-medium">Task: {task.description}</p>
                      {task.result != null && (
                        <div className="bg-[#0d1117] rounded p-2 max-h-32 overflow-auto">
                          <pre className="text-[#8b949e] whitespace-pre-wrap">
                            {(typeof task.result === 'string' ? task.result : JSON.stringify(task.result, null, 2)) as string}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4"
        >
          <h3 className="text-white font-medium text-sm mb-3">Overall Progress</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#8b949e]">Completion</span>
              <span className="text-cyan-400">
                {Math.round(((summary.completed + summary.failed) / (summary.totalTasks || 1)) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{
                  width: `${Math.round(((summary.completed + summary.failed) / (summary.totalTasks || 1)) * 100)}%`,
                }}
              />
            </div>
            <div className="grid grid-cols-4 gap-2 pt-2">
              <StatItem label="Total" value={summary.totalTasks} color="text-white" />
              <StatItem label="Done" value={summary.completed} color="text-green-400" />
              <StatItem label="Failed" value={summary.failed} color="text-red-400" />
              <StatItem label="Pending" value={summary.pending} color="text-yellow-400" />
            </div>
          </div>
        </motion.div>

        {/* Shared Memory */}
        {Object.keys(memory).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4"
          >
            <h3 className="text-white font-medium text-sm mb-3">Shared Memory</h3>
            <pre className="text-xs text-[#8b949e] font-mono overflow-auto max-h-40">
              {JSON.stringify(memory, null, 2)}
            </pre>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AgentMetrics['status'] }) {
  const config = {
    idle: { bg: 'bg-[#21262d]', text: 'text-[#8b949e]', label: 'Idle' },
    running: { bg: 'bg-cyan-900/30', text: 'text-cyan-400', label: 'Running' },
    completed: { bg: 'bg-green-900/30', text: 'text-green-400', label: 'Done' },
    error: { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Error' },
  };

  const { bg, text, label } = config[status];

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text} flex items-center gap-1`}>
      {status === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'completed' && <CheckCircle className="w-3 h-3" />}
      {status === 'error' && <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-[#161b22] rounded p-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[#8b949e] text-xs">{label}</p>
        <p className={`text-white text-sm font-medium ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[#8b949e] text-xs">{label}</p>
    </div>
  );
}

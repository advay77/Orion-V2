// OpenRouter model IDs used by Orion.
// Keep these aligned with ModelRouter rankings in model-router.ts.

export const MODEL_CONFIG = {
  DEEPSEEK_CHAT_FREE: 'deepseek/deepseek-chat-v3.1:free',
  DEEPSEEK_R1_FREE: 'deepseek/deepseek-r1:free',
  QWEN3_CODER_FREE: 'qwen/qwen3-coder:free',
  QWEN3_PLUS_FREE: 'qwen/qwen3.6-plus:free',
  MINIMAX_FREE: 'minimax/minimax-m2.5:free',
  OPENROUTER_AUTO: 'openrouter/auto',
} as const;

/**
 * Default agent model assignments (overridable via env).
 * ModelRouter may still pick a different candidate based on priority.
 */
export const AGENT_MODELS = {
  planner: MODEL_CONFIG.DEEPSEEK_CHAT_FREE,
  engineering: MODEL_CONFIG.QWEN3_CODER_FREE,
  research: MODEL_CONFIG.DEEPSEEK_R1_FREE,
  marketing: MODEL_CONFIG.QWEN3_PLUS_FREE,
} as const;

export type AgentModelType = keyof typeof AGENT_MODELS;

export function getAgentModel(agent: AgentModelType): string {
  return AGENT_MODELS[agent];
}

export const MODEL_DESCRIPTIONS: Record<string, string> = {
  [MODEL_CONFIG.DEEPSEEK_CHAT_FREE]: 'DeepSeek Chat V3.1 (free) — general reasoning and planning',
  [MODEL_CONFIG.DEEPSEEK_R1_FREE]: 'DeepSeek R1 (free) — deeper analysis',
  [MODEL_CONFIG.QWEN3_CODER_FREE]: 'Qwen3 Coder (free) — code generation',
  [MODEL_CONFIG.QWEN3_PLUS_FREE]: 'Qwen3 Plus (free) — writing and general tasks',
  [MODEL_CONFIG.MINIMAX_FREE]: 'MiniMax M2.5 (free) — fast / cost-oriented',
  [MODEL_CONFIG.OPENROUTER_AUTO]: 'OpenRouter Auto — provider fallback',
};

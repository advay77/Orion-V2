// Open Source Model Configuration for Orion
// All models are served through OpenRouter

export const MODEL_CONFIG = {
  // DeepSeek V3 - General purpose model for coding and writing
  DEEPSEEK_V3: 'deepseek/deepseek-chat',
  
  // DeepSeek R1 - Advanced reasoning
  DEEPSEEK_R1: 'deepseek/deepseek-r1',
  
  // Qwen 3 - General purpose model for coding, reasoning, and writing
  QWEN_3: 'qwen/qwen-3',
  
  // Llama 3.3 - General purpose model for reasoning and writing
  LLAMA_3_3: 'meta-llama/llama-3.3',
  
  // Qwen 3 Coder - Specialized for code and engineering tasks
  QWEN_3_CODER: 'qwen/qwen-3-coder-235b',
  
  // GLM-5.2 - Advanced reasoning and R&D
  GLM_5_2: 'glm-5-2',
  
  // Kimi K2.7 - General purpose high-quality model
  KIMI_K2_7: 'kimi/kimi-k2.7',
  
  // MiniMax M3 - Efficient model
  MINIMAX_M3: 'minimax/minimax-m3',
} as const;

/**
 * Agent-specific model assignments
 * Optimized for each agent's specialized role
 * 
 * Model selection based on task type:
 * - Coding: deepseek-v3, qwen3, llama-3.3
 * - Reasoning: deepseek-r1, qwen3, llama-3.3
 * - Writing: qwen3, llama-3.3, deepseek-v3
 */
export const AGENT_MODELS = {
  // Planner: Uses DeepSeek R1 for advanced reasoning (primary reasoning model)
  planner: MODEL_CONFIG.DEEPSEEK_R1,
  
  // Engineering: Uses DeepSeek V3 for coding tasks (primary coding model)
  engineering: MODEL_CONFIG.DEEPSEEK_V3,
  
  // Research: Uses DeepSeek R1 for reasoning and analysis (primary reasoning model)
  research: MODEL_CONFIG.DEEPSEEK_R1,
  
  // Marketing: Uses Qwen 3 for writing tasks (primary writing model)
  marketing: MODEL_CONFIG.QWEN_3,
} as const;

export type AgentModelType = keyof typeof AGENT_MODELS;

/**
 * Get the model for a specific agent
 */
export function getAgentModel(agent: AgentModelType): string {
  return AGENT_MODELS[agent];
}

/**
 * Model descriptions for documentation
 */
export const MODEL_DESCRIPTIONS = {
  [MODEL_CONFIG.DEEPSEEK_V3]: 'DeepSeek V3 - General purpose model for coding and writing',
  [MODEL_CONFIG.DEEPSEEK_R1]: 'DeepSeek R1 - Specialized reasoning model',
  [MODEL_CONFIG.QWEN_3]: 'Qwen 3 - General purpose model for coding, reasoning, and writing',
  [MODEL_CONFIG.LLAMA_3_3]: 'Llama 3.3 - General purpose model for reasoning and writing',
  [MODEL_CONFIG.QWEN_3_CODER]: 'Qwen 3 Coder (235B) - Specialized for code and engineering',
  [MODEL_CONFIG.GLM_5_2]: 'GLM-5.2 - Advanced analysis and R&D model',
  [MODEL_CONFIG.KIMI_K2_7]: 'Kimi K2.7 - High-quality general purpose model',
  [MODEL_CONFIG.MINIMAX_M3]: 'MiniMax M3 - Efficient open source model',
};

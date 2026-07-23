export interface ModelPricing {
  prompt: number; // cost per 1M prompt tokens
  completion: number; // cost per 1M completion tokens
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export class CostEngine {
  // Model pricing (cost per 1M tokens in USD)
  private static MODEL_PRICING: Record<string, ModelPricing> = {
    'deepseek/deepseek-chat': { prompt: 0.14, completion: 0.28 },
    'deepseek/deepseek-chat-v3.1:free': { prompt: 0, completion: 0 },
    'deepseek/deepseek-r1': { prompt: 0.55, completion: 2.19 },
    'deepseek/deepseek-r1:free': { prompt: 0, completion: 0 },
    'qwen/qwen3-coder:free': { prompt: 0, completion: 0 },
    'qwen/qwen3.6-plus:free': { prompt: 0, completion: 0 },
    'minimax/minimax-m2.5:free': { prompt: 0, completion: 0 },
    'openrouter/auto': { prompt: 0.15, completion: 0.3 },
  };

  static getPricing(model: string): ModelPricing {
    return this.MODEL_PRICING[model] || { prompt: 0.10, completion: 0.10 };
  }

  static calculateActualCost(
    model: string,
    usage: TokenUsage | undefined,
    fallbackTextLength?: number
  ): number {
    const pricing = this.getPricing(model);

    // If we have real usage from OpenRouter, use it
    if (usage) {
      const promptCost = (usage.prompt_tokens / 1_000_000) * pricing.prompt;
      const completionCost = (usage.completion_tokens / 1_000_000) * pricing.completion;
      return promptCost + completionCost;
    }

    // Fallback: estimate tokens from text length (ceil(text.length/4))
    if (fallbackTextLength) {
      const estimatedTokens = Math.ceil(fallbackTextLength / 4);
      const estimatedCost = (estimatedTokens / 1_000_000) * (pricing.prompt + pricing.completion);
      return estimatedCost;
    }

    return 0;
  }

  static calculateTotalCost(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    const pricing = this.getPricing(model);
    const promptCost = (promptTokens / 1_000_000) * pricing.prompt;
    const completionCost = (completionTokens / 1_000_000) * pricing.completion;
    return promptCost + completionCost;
  }

  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

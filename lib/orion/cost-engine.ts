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
    'deepseek/deepseek-r1': { prompt: 0.55, completion: 2.19 },
    'qwen/qwen-3-coder-235b': { prompt: 0.50, completion: 1.00 },
    'glm-5-2': { prompt: 0.20, completion: 0.40 },
    'kimi/kimi-k2.7': { prompt: 0.12, completion: 0.12 },
    'minimax/minimax-m3': { prompt: 0.10, completion: 0.10 },
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

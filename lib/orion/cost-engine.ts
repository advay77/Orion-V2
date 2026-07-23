import { MODEL_CATALOG } from './model-config';

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
  private static MODEL_PRICING: Record<string, ModelPricing> = Object.fromEntries(
    MODEL_CATALOG.map((m) => [m.id, { prompt: m.promptPrice, completion: m.completionPrice }]),
  );

  static getPricing(model: string): ModelPricing {
    return this.MODEL_PRICING[model] || { prompt: 0.5, completion: 1.5 };
  }

  static calculateActualCost(
    model: string,
    usage: TokenUsage | undefined,
    fallbackTextLength?: number,
  ): number {
    const pricing = this.getPricing(model);

    if (usage) {
      const promptCost = (usage.prompt_tokens / 1_000_000) * pricing.prompt;
      const completionCost = (usage.completion_tokens / 1_000_000) * pricing.completion;
      return promptCost + completionCost;
    }

    if (fallbackTextLength) {
      const estimatedTokens = Math.ceil(fallbackTextLength / 4);
      return (estimatedTokens / 1_000_000) * (pricing.prompt + pricing.completion);
    }

    return 0;
  }

  static calculateTotalCost(
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number {
    const pricing = this.getPricing(model);
    return (
      (promptTokens / 1_000_000) * pricing.prompt +
      (completionTokens / 1_000_000) * pricing.completion
    );
  }

  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

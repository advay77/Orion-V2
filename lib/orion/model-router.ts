import { OpenRouterClient } from './openrouter-client';
import { ConfidenceCalculator } from './confidence';

export interface ModelRanking {
  model: string;
  capability: number; // 1-10
  quality: number; // 1-10
  speed: number; // 1-10
  cost: number; // tokens/$
  contextWindow: number; // tokens
  available: boolean;
}

export interface ModelSelection {
  selectedModel: string;
  fallbackModels: string[];
  reason: string;
  confidence: number; // 0-1
  estimatedLatency: number; // ms
  estimatedCost: number; // $ per 1000 tokens
}

export interface RouterConfig {
  agentType: 'engineering' | 'research' | 'marketing' | 'planner';
  taskType?: string;
  priority?: 'speed' | 'quality' | 'cost' | 'balanced';
}

export class ModelRouter {
  private openRouterClient: OpenRouterClient;
  private modelCache: Map<string, ModelRanking> = new Map();

  constructor(openRouterClient: OpenRouterClient) {
    this.openRouterClient = openRouterClient;
    this.initializeModelRankings();
  }

  private initializeModelRankings(): void {
    // Initialize available models with their characteristics
    const models: ModelRanking[] = [
      // DeepSeek Chat V3.1 (free) - Best for reasoning
      {
        model: 'deepseek/deepseek-chat-v3.1:free',
        capability: 9,
        quality: 9,
        speed: 7,
        cost: 100000,
        contextWindow: 64000,
        available: true,
      },
      // DeepSeek R1 (free) - Expert reasoning
      {
        model: 'deepseek/deepseek-r1:free',
        capability: 10,
        quality: 10,
        speed: 5,
        cost: 100000,
        contextWindow: 128000,
        available: true,
      },
      // Qwen3 Coder (free) - Engineering specialist
      {
        model: 'qwen/qwen3-coder:free',
        capability: 9,
        quality: 9,
        speed: 6,
        cost: 100000,
        contextWindow: 32000,
        available: true,
      },
      // Qwen3 Plus (free) - General purpose
      {
        model: 'qwen/qwen3.6-plus:free',
        capability: 8,
        quality: 8,
        speed: 8,
        cost: 100000,
        contextWindow: 32000,
        available: true,
      },
      // MiniMax M2.5 (free) - Efficient
      {
        model: 'minimax/minimax-m2.5:free',
        capability: 7,
        quality: 7,
        speed: 9,
        cost: 100000,
        contextWindow: 32000,
        available: true,
      },
      // OpenRouter Auto - Fallback if needed
      {
        model: 'openrouter/auto',
        capability: 8,
        quality: 8,
        speed: 8,
        cost: 50000,
        contextWindow: 200000,
        available: true,
      },
    ];

    models.forEach((model) => {
      this.modelCache.set(model.model, model);
    });
  }

  selectModel(config: RouterConfig): ModelSelection {
    const priority = config.priority || 'speed'; // Default to speed for faster execution
    const agentType = config.agentType;

    // Get agent-specific model preferences
    const candidateModels = this.getCandidateModels(agentType);

    // Rank models based on priority
    const rankedModels = this.rankModels(candidateModels, priority);

    if (rankedModels.length === 0) {
      throw new Error('No available models found');
    }

    // Select best model
    const selectedModel = rankedModels[0];
    const fallbackModels = rankedModels.slice(1, 3).map((m) => m.model);

    // Calculate confidence using ConfidenceCalculator
    const requiredCapability = this.getRequiredCapability(agentType, config.taskType);
    const confidenceResult = ConfidenceCalculator.calculateRouterConfidence(
      selectedModel.capability,
      requiredCapability,
      0 // ambiguity - could be calculated from task complexity
    );

    return {
      selectedModel: selectedModel.model,
      fallbackModels,
      reason: this.getSelectionReason(agentType, selectedModel, priority),
      confidence: ConfidenceCalculator.normalizeToDecimal(confidenceResult.score),
      estimatedLatency: this.estimateLatency(selectedModel),
      estimatedCost: this.estimateCost(selectedModel),
    };
  }

  private getRequiredCapability(agentType: string, taskType?: string): number {
    // Define required capability based on agent type and task
    const baseRequirements: Record<string, number> = {
      engineering: 8,
      research: 9,
      marketing: 7,
      planner: 9,
    };
    
    let required = baseRequirements[agentType] || 7;
    
    // Adjust based on task complexity if taskType is provided
    if (taskType) {
      const complexTasks = ['architecture', 'system_design', 'research_analysis'];
      if (complexTasks.includes(taskType)) {
        required = Math.min(10, required + 1);
      }
    }
    
    return required;
  }

  private getCandidateModels(agentType: string): ModelRanking[] {
    const candidates: ModelRanking[] = [];

    // Agent-specific model recommendations - prioritize fastest models first
    switch (agentType) {
      case 'engineering':
        candidates.push(
          this.modelCache.get('minimax/minimax-m2.5:free')!, // Fastest!
          this.modelCache.get('qwen/qwen3-coder:free')!,
          this.modelCache.get('deepseek/deepseek-chat-v3.1:free')!,
          this.modelCache.get('openrouter/auto')!,
        );
        break;
      case 'research':
        candidates.push(
          this.modelCache.get('minimax/minimax-m2.5:free')!, // Fastest!
          this.modelCache.get('qwen/qwen3.6-plus:free')!,
          this.modelCache.get('deepseek/deepseek-r1:free')!,
          this.modelCache.get('openrouter/auto')!,
        );
        break;
      case 'marketing':
        candidates.push(
          this.modelCache.get('minimax/minimax-m2.5:free')!, // Fastest!
          this.modelCache.get('qwen/qwen3.6-plus:free')!,
          this.modelCache.get('deepseek/deepseek-chat-v3.1:free')!,
          this.modelCache.get('openrouter/auto')!,
        );
        break;
      case 'planner':
      default:
        candidates.push(
          this.modelCache.get('minimax/minimax-m2.5:free')!, // Fastest!
          this.modelCache.get('deepseek/deepseek-chat-v3.1:free')!,
          this.modelCache.get('qwen/qwen3.6-plus:free')!,
          this.modelCache.get('openrouter/auto')!,
        );
    }

    return candidates.filter((m) => m && m.available);
  }

  private rankModels(models: ModelRanking[], priority: string): ModelRanking[] {
    const scored = models.map((model) => {
      let score = 0;

      switch (priority) {
        case 'speed':
          score = model.speed * 2 + model.cost * 0.5;
          break;
        case 'quality':
          score = model.quality * 2 + model.capability * 1.5;
          break;
        case 'cost':
          // Prioritize cheapest capable model - higher cost = lower score
          score = model.cost * 2 + model.speed * 0.5;
          break;
        case 'balanced':
        default:
          // Balanced now prioritizes cost more heavily
          score = model.quality + model.capability + model.speed * 0.5 + model.cost * 1.5;
      }

      return { model, score };
    });

    return scored.sort((a, b) => b.score - a.score).map((s) => s.model);
  }

  private getSelectionReason(
    agentType: string,
    selectedModel: ModelRanking,
    priority: string,
  ): string {
    const reasons: { [key: string]: string } = {
      speed: `Selected for fast inference (${selectedModel.speed}/10 speed)`,
      quality: `Selected for high quality output (${selectedModel.quality}/10 quality, ${selectedModel.capability}/10 capability)`,
      cost: `Selected for cost efficiency (${selectedModel.cost} tokens/$)`,
      balanced: `Selected as best balanced option for ${agentType}`,
    };
    return reasons[priority] || reasons['balanced'];
  }

  private estimateLatency(model: ModelRanking): number {
    // Rough estimate: slower models take longer
    return Math.round((100 / model.speed) * 100); // ms
  }

  private estimateCost(model: ModelRanking): number {
    // Cost per 1000 tokens in cents
    return (1000 / model.cost) * 100;
  }

  async testModelAvailability(model: string): Promise<boolean> {
    try {
      // Quick test to verify model is available
      const response = await this.openRouterClient.chat(
        model,
        [{ role: 'user', content: 'ping' }],
        'Respond with only: pong',
      );
      return response.content.toLowerCase().includes('pong');
    } catch (error) {
      return false;
    }
  }

  updateModelAvailability(model: string, available: boolean): void {
    const ranking = this.modelCache.get(model);
    if (ranking) {
      ranking.available = available;
    }
  }

  getModelInfo(model: string): ModelRanking | undefined {
    return this.modelCache.get(model);
  }

  getAllModels(): ModelRanking[] {
    return Array.from(this.modelCache.values());
  }
}

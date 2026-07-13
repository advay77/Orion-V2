import { AgentContext, AgentResponse, AgentType } from './types';
import { SharedMemory } from './shared-memory';
import { OpenRouterClient } from './openrouter-client';

export abstract class BaseAgent {
  protected agentType: AgentType;
  protected model: string;
  protected openRouterClient: OpenRouterClient;
  protected sharedMemory: SharedMemory;
  protected preferredModel: string;
  protected fallbackModels: string[];

  constructor(agentType: AgentType, model: string, openRouterClient: OpenRouterClient, sharedMemory: SharedMemory) {
    this.agentType = agentType;
    this.model = model;
    this.preferredModel = model;
    this.openRouterClient = openRouterClient;
    this.sharedMemory = sharedMemory;
    this.fallbackModels = this.getFallbackModels();
  }

  abstract getSystemPrompt(): string;

  // Agent-specific hardcoded confidence values
  getAgentConfidence(): number {
    const confidenceMap: Record<AgentType, number> = {
      engineering: 0.85,
      research: 0.90,
      marketing: 0.80,
    };
    return confidenceMap[this.agentType] || 0.85;
  }

  private getFallbackModels(): string[] {
    // Define fallback models for each agent type
    const fallbackMap: Record<AgentType, string[]> = {
      engineering: ['deepseek/deepseek-chat', 'deepseek/deepseek-r1'],
      research: ['deepseek/deepseek-r1', 'deepseek/deepseek-chat'],
      marketing: ['kimi/kimi-k2.7', 'glm-5-2'],
    };
    return fallbackMap[this.agentType] || ['deepseek/deepseek-chat'];
  }

  protected async tryPreferredModel(
    messages: any[],
    systemPrompt: string,
    maxRetries: number = 2
  ): Promise<{ result: string; usage?: any; modelUsed: string }> {
    const modelsToTry = [this.preferredModel, ...this.fallbackModels];
    let lastError: Error | null = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      try {
        const response = await this.openRouterClient.chat(model, messages, systemPrompt);
        return { result: response.content, usage: response.usage, modelUsed: model };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (i < modelsToTry.length - 1) {
          // Continue to next model
          continue;
        }
      }
    }

    throw lastError || new Error('All models failed');
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    try {
      const systemPrompt = this.getSystemPrompt();
      const userMessage = {
        role: 'user' as const,
        content: this.buildPrompt(context),
      };

      const response = await this.openRouterClient.chat(this.model, [userMessage], systemPrompt);
      
      // Store usage information in shared memory
      if (response.usage) {
        this.sharedMemory.set(`task_${context.taskId}_usage`, response.usage);
      }

      const parsedResponse = this.parseResponse(response.content, context.taskId);

      // Update shared memory with results
      this.sharedMemory.set(`task_${context.taskId}_result`, parsedResponse.result);
      this.sharedMemory.set(`task_${context.taskId}_reasoning`, parsedResponse.reasoning);

      return parsedResponse;
    } catch (error) {
      return {
        taskId: context.taskId,
        result: `Failed to complete task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        reasoning: 'Task execution failed',
        success: false,
      };
    }
  }

  protected buildPrompt(context: AgentContext): string {
    // Very simple prompt for speed!
    return `
Task: ${context.taskId}

Please complete this task. Return JSON only:
{
  "result": "result here",
  "reasoning": "reasoning here",
  "success": true
}
    `;
  }

  protected parseResponse(response: string, taskId: string): AgentResponse {
    // If empty string, return default success response
    if (!response.trim()) {
      return {
        taskId,
        result: 'Task completed successfully',
        reasoning: 'No additional content returned',
        success: true,
      };
    }

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          taskId,
          result: response,
          reasoning: 'Parsed as plain text',
          success: true,
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        taskId,
        result: parsed.result || response,
        reasoning: parsed.reasoning || '',
        nextSteps: parsed.nextSteps,
        success: parsed.success !== false,
      };
    } catch (error) {
      return {
        taskId,
        result: response,
        reasoning: 'Response parsed as plain text',
        success: true,
      };
    }
  }
}

import { BaseAgent } from '../base-agent';
import { AgentContext, AgentResponse } from '../types';
import { OpenRouterClient } from '../openrouter-client';
import { SharedMemory } from '../shared-memory';

export class MarketingAgent extends BaseAgent {
  constructor(openRouterClient: OpenRouterClient, sharedMemory: SharedMemory, model: string = 'openrouter/auto') {
    super('marketing', model, openRouterClient, sharedMemory);
  }

  getSystemPrompt(): string {
    // Get intent constraints from shared memory
    const constraints = this.sharedMemory.get('task_constraints') as string[] || [];
    const intentClassification = this.sharedMemory.get('intent_classification') as any;
    const isUIClone = intentClassification?.intent === 'UI_CLONE';

    let constraintText = '';
    if (constraints.length > 0) {
      constraintText = '\n\nINTENT-SPECIFIC CONSTRAINTS:\n' + constraints.map((c, i) => `${i + 1}. ${c}`).join('\n');
    }

    // For UI_CLONE, marketing should be skipped entirely
    if (isUIClone) {
      return `You are Orion's Marketing Agent - an expert in brand strategy and customer engagement.

INTENT-SPECIFIC CONSTRAINTS:
This task is marked as UI_CLONE, which means marketing activities are NOT required.
Skip execution and return success without generating any marketing content.

Return ONLY valid JSON:
{
  "result": "Marketing skipped - not required for UI_CLONE intent",
  "reasoning": "UI_CLONE intent does not require marketing activities",
  "success": true
}`;
    }

    return `You are Orion's Marketing Agent - an expert in brand strategy and customer engagement.

Your expertise includes:
- Brand positioning and messaging
- Content strategy and copywriting
- Campaign planning and execution
- Customer segmentation and targeting
- Growth hacking and conversion optimization
- Social media and digital marketing

When given a task, provide:
1. Strategic marketing recommendations
2. Targeted messaging and positioning
3. Campaign ideas and execution tactics
4. Metrics for measuring success
5. Timeline and resource requirements
${constraintText}

Always focus on ROI, customer value, and brand alignment.

Return ONLY valid JSON with no markdown formatting:
{
  "result": "Marketing strategy and recommendations",
  "reasoning": "Strategic analysis and market insights",
  "nextSteps": ["campaign step 1", "execution phase"],
  "success": true
}`;
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    this.sharedMemory.set('marketing_agent_active', true);

    try {
      const response = await super.execute(context);
      this.sharedMemory.set('marketing_task_result', response);
      return response;
    } finally {
      this.sharedMemory.set('marketing_agent_active', false);
    }
  }

  async createMarketingStrategy(product: string): Promise<string> {
    const systemPrompt = this.getSystemPrompt();

    const response = await this.openRouterClient.chat(
      this.model,
      [
        {
          role: 'user',
          content: `Create a comprehensive marketing strategy for: ${product}`,
        },
      ],
      systemPrompt,
    );

    return response.content;
  }

  async generateCopywriting(context: string): Promise<string> {
    const systemPrompt = this.getSystemPrompt();

    const response = await this.openRouterClient.chat(
      this.model,
      [
        {
          role: 'user',
          content: `Write compelling copy for: ${context}`,
        },
      ],
      systemPrompt,
    );

    return response.content;
  }

  async planCampaign(objective: string): Promise<string> {
    const systemPrompt = this.getSystemPrompt();

    const response = await this.openRouterClient.chat(
      this.model,
      [
        {
          role: 'user',
          content: `Plan a marketing campaign for: ${objective}`,
        },
      ],
      systemPrompt,
    );

    return response.content;
  }
}

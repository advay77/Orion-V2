import { BaseAgent } from '../base-agent';
import { AgentContext, AgentResponse } from '../types';
import { OpenRouterClient } from '../openrouter-client';
import { SharedMemory } from '../shared-memory';
import { fetchUrlsFromText } from '../tools/web-fetch';

export class ResearchAgent extends BaseAgent {
  constructor(
    openRouterClient: OpenRouterClient,
    sharedMemory: SharedMemory,
    model: string = 'openrouter/auto',
  ) {
    super('research', model, openRouterClient, sharedMemory);
  }

  getSystemPrompt(): string {
    const intentClassification = this.sharedMemory.get('intent_classification') as any;
    const framework = intentClassification?.framework;
    const target = intentClassification?.target;
    const goal = intentClassification?.goal;
    const lastPlan = this.sharedMemory.get('last_plan') as any;
    const objective = lastPlan?.objective || '';

    let frameworkInfo = framework ? `\n\nFRAMEWORK FOR PROJECT: ${framework}` : '';
    let targetInfo = target ? `\n\nREFERENCE TARGET TO ANALYZE: ${target}` : '';
    let goalInfo = goal ? `\n\nPROJECT OBJECTIVE: ${goal}` : '';

    return `You are Orion's Project Analysis Agent — a senior technical analyst.

${frameworkInfo}
${targetInfo}
${goalInfo}

USER OBJECTIVE: ${objective}

RULES:
1. Prefer LIVE SOURCE content when provided under "LIVE SOURCES". Cite those URLs.
2. If sources say model-only, label assumptions clearly.
3. Never invent specific page layout details that are not in sources or the objective.
4. Output structured markdown only (no JSON wrapper).
5. Keep the report concise and engineering-actionable (prefer < 1500 words).

REQUIRED SECTIONS (include as relevant):
- Project Understanding
- Functional Requirements
- UI/UX / Layout (if applicable)
- Recommended Tech Stack
- Folder Structure
- Risks & Challenges
- Engineering Recommendations
- Acceptance Criteria
- Sources (list URLs used, or "model-only")`;
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    this.sharedMemory.set('research_agent_active', true);

    try {
      const lastPlan = this.sharedMemory.get('last_plan') as any;
      const objective = lastPlan?.objective || '';
      const intentClassification = this.sharedMemory.get('intent_classification') as any;
      const target = intentClassification?.target;
      const framework = intentClassification?.framework;

      const fetchSource = [objective, target].filter(Boolean).join('\n');
      const { sourcesBlock, results } = await fetchUrlsFromText(fetchSource);
      this.sharedMemory.set('research_web_fetch', results);

      const systemPrompt = this.getSystemPrompt();
      const response = await this.chatForTask(
        [
          {
            role: 'user',
            content: `Objective: ${objective}

Task ID: ${context.taskId}
${framework ? `Framework hint: ${framework}` : ''}
${target ? `Target/reference: ${target}` : ''}

LIVE SOURCES:
${sourcesBlock}

Write the structured analysis now.`,
          },
        ],
        systemPrompt,
      );

      if (response.usage) {
        this.sharedMemory.set(`task_${context.taskId}_usage`, response.usage);
      }
      if (response.modelUsed) {
        this.sharedMemory.set(`task_${context.taskId}_model`, response.modelUsed);
      } else {
        this.sharedMemory.set(`task_${context.taskId}_model`, this.model);
      }

      this.sharedMemory.set('project_analysis', response.content);
      this.sharedMemory.set('research_ok', true);

      return {
        taskId: context.taskId,
        result: response.content,
        reasoning: 'Generated structured project analysis (with optional live sources)',
        success: true,
      };
    } catch (error) {
      this.sharedMemory.set('research_ok', false);
      this.sharedMemory.delete('project_analysis');
      return {
        taskId: context.taskId,
        result: `Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        reasoning: 'Research agent execution failed',
        success: false,
      };
    } finally {
      this.sharedMemory.set('research_agent_active', false);
    }
  }
}

import { BaseAgent } from '../base-agent';
import { AgentContext, AgentResponse } from '../types';
import { OpenRouterClient } from '../openrouter-client';
import { SharedMemory } from '../shared-memory';

export class ResearchAgent extends BaseAgent {
  constructor(openRouterClient: OpenRouterClient, sharedMemory: SharedMemory, model: string = 'openrouter/auto') {
    super('research', model, openRouterClient, sharedMemory);
  }

  getSystemPrompt(): string {
    // Get intent, framework, target, goal from shared memory
    const intentClassification = this.sharedMemory.get('intent_classification') as any;
    const isUIClone = intentClassification?.intent === 'UI_CLONE';
    const framework = intentClassification?.framework;
    const target = intentClassification?.target;
    const goal = intentClassification?.goal;
    
    // Get user's original objective
    const lastPlan = this.sharedMemory.get('last_plan') as any;
    const objective = lastPlan?.objective || '';
    
    let frameworkInfo = '';
    if (framework) {
      frameworkInfo = `\n\nFRAMEWORK FOR PROJECT: ${framework}`;
    }
    let targetInfo = '';
    if (target) {
      targetInfo = `\n\nREFERENCE TARGET TO ANALYZE: ${target}`;
    }
    let goalInfo = '';
    if (goal) {
      goalInfo = `\n\nPROJECT OBJECTIVE: ${goal}`;
    }

    return `You are Orion's Project Analysis Agent - a senior technical analyst specializing in analyzing projects and generating structured engineering context for development teams.

${frameworkInfo}
${targetInfo}
${goalInfo}

USER'S FULL OBJECTIVE: ${objective}

CRITICAL RULES:
1. NEVER return generic internet knowledge or broad best practices unless EXPLICITLY requested.
2. If the user provides a reference website, analyze ONLY that specific website's design/layout/structure.
3. If the user provides a PDF/image/document, analyze ONLY that content.
4. Generate structured, detailed markdown with clear headings and bullet points.
5. Do NOT summarize in a single paragraph.
6. Your analysis must be PROJECT-SPECIFIC and directly usable by the Engineering Agent.
7. Store all findings in structured sections that the Engineering Agent can access.

REQUIRED SECTIONS (include as many as relevant):
- Project Understanding
- Functional Requirements
- UI/UX Analysis
- Layout Breakdown
- Design System
- Color Palette
- Typography
- Components Required
- Data Flow
- Recommended Tech Stack
- Folder Structure Recommendations
- Risks & Challenges
- Engineering Recommendations
- Acceptance Criteria

Return ONLY structured markdown analysis. Do NOT include JSON.`;
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    this.sharedMemory.set('research_agent_active', true);

    try {
      // Get user's original objective
      const lastPlan = this.sharedMemory.get('last_plan') as any;
      const objective = lastPlan?.objective || '';
      
      // Get intent info
      const intentClassification = this.sharedMemory.get('intent_classification') as any;
      const target = intentClassification?.target;
      const framework = intentClassification?.framework;
      
      const systemPrompt = this.getSystemPrompt();
      
      // Execute using model
      const response = await this.openRouterClient.chat(
        this.model,
        [
          {
            role: 'user',
            content: `User's full objective: ${objective}\n\nTask ID: ${context.taskId}\n\nTask Description: ${context.taskId}\n\nPlease generate a detailed, structured project analysis using the required sections.${target ? `\n\nFocus your analysis on this reference: ${target}` : ''}${framework ? `\n\nUse this framework context: ${framework}` : ''}`,
          },
        ],
        systemPrompt,
      );
      
      // Store analysis in shared memory for Engineering Agent
      this.sharedMemory.set('project_analysis', response.content);
      
      return {
        taskId: context.taskId,
        result: response.content,
        reasoning: 'Generated structured project analysis for engineering team',
        success: true,
      };
    } finally {
      this.sharedMemory.set('research_agent_active', false);
    }
  }
}

import { BaseAgent } from '../base-agent';
import { AgentContext, AgentResponse } from '../types';
import { OpenRouterClient } from '../openrouter-client';
import { SharedMemory } from '../shared-memory';

export class EngineeringAgent extends BaseAgent {
  constructor(openRouterClient: OpenRouterClient, sharedMemory: SharedMemory, model: string = 'openrouter/auto') {
    super('engineering', model, openRouterClient, sharedMemory);
  }

  getSystemPrompt(skill?: string): string {
    // Get intent constraints from shared memory
    const constraints = this.sharedMemory.get('task_constraints') as string[] || [];
    const intentClassification = this.sharedMemory.get('intent_classification') as any;
    const isUIClone = intentClassification?.intent === 'UI_CLONE';
    const framework = intentClassification?.framework;
    const target = intentClassification?.target;
    const goal = intentClassification?.goal;

    let constraintText = '';
    if (constraints.length > 0) {
      constraintText = '\n\nINTENT-SPECIFIC CONSTRAINTS:\n' + constraints.map((c, i) => `${i + 1}. ${c}`).join('\n');
    }

    let expertiseText = `Your expertise includes:
- Frontend development (HTML, CSS, React, Vue, etc.)
- Backend services (APIs, databases, servers)
- System design and architecture
- Code quality and best practices
- Technical implementation strategies
- Performance optimization
- Infrastructure and deployment`;

    // For UI_CLONE, restrict expertise to only frontend basics
    if (isUIClone) {
      expertiseText = `Your expertise includes:
- HTML5 semantic structure
- CSS3 styling and layouts
- Responsive web design
- JavaScript for interactivity (only when needed)
- Asset management (images, icons, fonts)`;
    }

    let frameworkInfo = '';
    if (framework) {
      frameworkInfo = `\n\nFRAMEWORK TO USE: ${framework}\nYou MUST generate files for this specific framework ONLY.`;
    }
    let targetInfo = '';
    if (target) {
      targetInfo = `\n\nREFERENCE TARGET: ${target}\nYou MUST use this reference to create the design/layout.`;
    }
    let goalInfo = '';
    if (goal) {
      goalInfo = `\n\nOBJECTIVE: ${goal}`;
    }
    let projectAnalysisInfo = '';
    const projectAnalysis = this.sharedMemory.get('project_analysis');
    if (projectAnalysis) {
      projectAnalysisInfo = `\n\nPROJECT ANALYSIS FROM RESEARCH AGENT:\n${projectAnalysis}`;
    }

    return `You are Orion's Engineering Agent - an expert software architect and developer.

${skill ? `ASSIGNED SKILL: ${skill}\nYou MUST ONLY work on this skill. Do NOT generate solutions for other areas.` : ''}

${expertiseText}
${frameworkInfo}
${targetInfo}
${goalInfo}
${projectAnalysisInfo}

CRITICAL RULES:
1. Return ONLY code blocks with **EXPLICIT path="" METADATA** for EVERY file!
2. Use format: \`\`\`language path="full/file/path.ext" ... \`\`\` (e.g. \`\`\`jsx path="src/components/Navbar.jsx" ... \`\`\`)
3. NEVER return code blocks without a path attribute!
4. STRICTLY follow all Intent-Specific Constraints (NO EXCEPTIONS!
5. Generate complete, working, project-specific code
6. Include all necessary files for the solution (package.json, config files, etc.)
7. If skill is assigned, ONLY generate that skill area
8. Before generating artifacts, determine a single, consistent project structure
9. Never mix flat and nested directory layouts
10. NEVER generate generic demo apps, reusable card examples, counter apps, todo apps, or placeholder components unless explicitly requested
11. ALWAYS generate project-specific code tailored to the user's exact requirements
${constraintText}

Return structured code blocks with path notation. Example:

\`\`\`html path="index.html"
...
\`\`\`

\`\`\`css path="styles.css"
...
\`\`\`

\`\`\`javascript path="script.js"
...
\`\`\`

After code blocks, add JSON summary:

{
  "result": "Summary of what was generated",
  "reasoning": "Why this approach was chosen",
  "files": ["index.html", "styles.css", "script.js"],
  "success": true
}`;
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    this.sharedMemory.set('engineering_agent_active', true);

    try {
      // Get the assigned skill from context if available
      const taskData = this.sharedMemory.get(`task_${context.taskId}`);
      const assignedSkill = (taskData as any)?.skill;
      
      // Get the original objective
      const lastPlan = this.sharedMemory.get('last_plan') as any;
      const objective = lastPlan?.objective || '';
      
      // Use skill-specific system prompt
      const systemPrompt = this.getSystemPrompt(assignedSkill);

      // Execute using the assigned model
      const response = await this.openRouterClient.chat(
        this.model,
        [
          {
            role: 'user',
            content: `User's original objective: ${objective}\n\nTask ID: ${context.taskId}\n\nDescription: Please provide a complete, project-specific implementation tailored to the user's objective.${assignedSkill ? `\n\nAssigned Skill: ${assignedSkill}` : ''}`,
          },
        ],
        systemPrompt,
      );

      // Try to parse JSON response
      let result = response.content;
      let success = true;
      
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          result = parsed.result || response.content;
        }
      } catch (e) {
        // Response might be just code blocks, that's fine
      }

      this.sharedMemory.set('engineering_task_result', result);

      return {
        taskId: context.taskId,
        result,
        reasoning: 'Completed engineering task with proper artifact generation',
        success,
      };
    } finally {
      this.sharedMemory.set('engineering_agent_active', false);
    }
  }

  async analyzeArchitecture(objective: string): Promise<string> {
    const systemPrompt = this.getSystemPrompt();

    const response = await this.openRouterClient.chat(
      this.model,
      [
        {
          role: 'user',
          content: `Analyze the architecture needed for: ${objective}`,
        },
      ],
      systemPrompt,
    );

    return response.content;
  }

  async generateImplementationPlan(requirements: string): Promise<string> {
    const systemPrompt = this.getSystemPrompt();

    const response = await this.openRouterClient.chat(
      this.model,
      [
        {
          role: 'user',
          content: `Create a detailed implementation plan for: ${requirements}`,
        },
      ],
      systemPrompt,
    );

    return response.content;
  }
}

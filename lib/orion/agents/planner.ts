import { BaseAgent } from '../base-agent';
import { Plan, Task } from '../types';
import { OpenRouterClient } from '../openrouter-client';
import { SharedMemory } from '../shared-memory';
import { IntentClassifier } from '../intent-classifier';
import { getTasksForIntent, getConstraintsForIntent, getSkippedAgentsForIntent } from '../task-templates';

export class PlannerAgent extends BaseAgent {
  private intentClassifier: IntentClassifier;

  constructor(openRouterClient: OpenRouterClient, sharedMemory: SharedMemory, model: string = 'openrouter/auto') {
    super('planner', model, openRouterClient, sharedMemory);
    this.intentClassifier = new IntentClassifier();
  }

  getSystemPrompt(): string {
    return `You are Orion's Planner Agent - an expert at breaking down complex objectives into MINIMUM required tasks.

CRITICAL RULES:
1. Generate ONLY the minimum required tasks
2. Skip unnecessary tasks
3. Skip tasks that are not explicitly needed
4. Do NOT over-plan or create redundant tasks
5. Each task should have a specific, assigned skill
6. STRICTLY follow the intent-based task constraints provided

Your role is to:
1. Analyze the given objective
2. Determine user intent and required deliverables
3. Identify ONLY the essential required skills
4. Determine which agents are truly needed
5. Create minimum viable task breakdown
6. Assign specific skills to each task
7. Respect all constraints for the detected intent

Skip agents if not needed (even if they have skills).
Skip tasks if they are not required for the objective.
Skip dependencies if the objective can be achieved without them.
NEVER generate content outside the constraints of the detected intent.`;
  }

  async createPlan(objective: string): Promise<Plan> {
    try {
      // Classify the user's intent
      const classification = this.intentClassifier.classify(objective);

      // Get tasks based on the classified intent
      const tasks = getTasksForIntent(classification.intent);
      const constraints = getConstraintsForIntent(classification.intent);
      const skippedAgents = getSkippedAgentsForIntent(classification.intent);

      const plan: Plan = {
        id: `plan_${Date.now()}`,
        objective,
        tasks,
        status: 'planning',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store plan and classification in shared memory
      this.sharedMemory.set(`plan_${plan.id}`, plan);
      this.sharedMemory.set('last_plan', plan);
      this.sharedMemory.set('intent_classification', classification);
      this.sharedMemory.set('task_constraints', constraints);
      this.sharedMemory.set('skipped_agents', skippedAgents);

      return plan;
    } catch (error) {
      throw error;
    }
  }
}

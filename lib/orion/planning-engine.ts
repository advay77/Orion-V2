import { Plan, Task, ExecutionState, AgentType } from './types';
import { SharedMemory } from './shared-memory';
import { PlannerAgent } from './agents/planner';

export class PlanningEngine {
  private currentPlan: Plan | null = null;
  private executionState: ExecutionState;
  private sharedMemory: SharedMemory;
  private plannerAgent: PlannerAgent;

  constructor(plannerAgent: PlannerAgent, sharedMemory: SharedMemory) {
    this.plannerAgent = plannerAgent;
    this.sharedMemory = sharedMemory;
    this.executionState = {
      currentPlanId: '',
      currentTaskId: '',
      runningAgents: [],
      completedTasks: [],
      failedTasks: [],
      lastUpdate: new Date().toISOString(),
    };
  }

  async generatePlan(objective: string): Promise<Plan> {
    this.currentPlan = await this.plannerAgent.createPlan(objective);
    this.executionState.currentPlanId = this.currentPlan.id;
    this.updateExecutionState();
    return this.currentPlan;
  }

  getCurrentPlan(): Plan | null {
    return this.currentPlan;
  }

  getNextTask(): Task | null {
    if (!this.currentPlan) return null;

    // Find first pending task
    const pendingTask = this.currentPlan.tasks.find((t) => t.status === 'pending');
    if (pendingTask) {
      this.executionState.currentTaskId = pendingTask.id;
      this.updateExecutionState();
    }

    return pendingTask || null;
  }

  getTasksByAgent(agentType: AgentType): Task[] {
    if (!this.currentPlan) return [];
    return this.currentPlan.tasks.filter((t) => t.assignedTo === agentType);
  }

  markTaskComplete(taskId: string, result: string | unknown): void {
    if (!this.currentPlan) return;

    const task = this.currentPlan.tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = 'completed';
      task.result = result;
      task.updatedAt = new Date().toISOString();
      this.executionState.completedTasks.push(taskId);
      this.updateExecutionState();
    }
  }

  markTaskFailed(taskId: string, error: string): void {
    if (!this.currentPlan) return;

    const task = this.currentPlan.tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = 'failed';
      task.result = error;
      task.updatedAt = new Date().toISOString();
      this.executionState.failedTasks.push(taskId);
      this.updateExecutionState();
    }
  }

  setAgentRunning(agentType: AgentType, isRunning: boolean): void {
    if (isRunning) {
      if (!this.executionState.runningAgents.includes(agentType)) {
        this.executionState.runningAgents.push(agentType);
      }
    } else {
      this.executionState.runningAgents = this.executionState.runningAgents.filter((a) => a !== agentType);
    }
    this.updateExecutionState();
  }

  isPlanComplete(): boolean {
    if (!this.currentPlan) return false;
    return this.currentPlan.tasks.every((t) => t.status === 'completed' || t.status === 'failed');
  }

  getExecutionState(): ExecutionState {
    return { ...this.executionState };
  }

  updateExecutionState(): void {
    this.executionState.lastUpdate = new Date().toISOString();
    this.sharedMemory.set('execution_state', this.executionState);
  }

  getPlanSummary(): {
    totalTasks: number;
    completed: number;
    failed: number;
    pending: number;
    inProgress: number;
  } {
    if (!this.currentPlan) {
      return { totalTasks: 0, completed: 0, failed: 0, pending: 0, inProgress: 0 };
    }

    return {
      totalTasks: this.currentPlan.tasks.length,
      completed: this.currentPlan.tasks.filter((t) => t.status === 'completed').length,
      failed: this.currentPlan.tasks.filter((t) => t.status === 'failed').length,
      pending: this.currentPlan.tasks.filter((t) => t.status === 'pending').length,
      inProgress: this.currentPlan.tasks.filter((t) => t.status === 'in_progress').length,
    };
  }
}

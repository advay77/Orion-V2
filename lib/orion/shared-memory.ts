// Shared Memory System - Accessible to all agents
import type { TaskMetadata } from './types';

export interface MemoryEntry {
  timestamp: string;
  key: string;
  action: 'set' | 'get';
  value?: unknown;
}

export class SharedMemory {
  private memory: Map<string, unknown> = new Map();
  private history: MemoryEntry[] = [];
  private taskExecutionLog: TaskMetadata[] = [];

  set(key: string, value: unknown): void {
    this.memory.set(key, value);
    this.history.push({
      timestamp: new Date().toISOString(),
      key,
      action: 'set',
      value,
    });
  }

  get(key: string): unknown {
    const value = this.memory.get(key);
    this.history.push({
      timestamp: new Date().toISOString(),
      key,
      action: 'get',
      value,
    });
    return value;
  }

  getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    this.memory.forEach((value, key) => {
      result[key] = value;
    });
    result.taskExecutionLog = [...this.taskExecutionLog];
    return result;
  }

  update(key: string, updater: (current: unknown) => unknown): void {
    const current = this.memory.get(key);
    const updated = updater(current);
    this.set(key, updated);
  }

  delete(key: string): void {
    this.memory.delete(key);
    this.history.push({
      timestamp: new Date().toISOString(),
      key,
      action: 'set',
      value: undefined,
    });
  }

  getHistory(): MemoryEntry[] {
    return [...this.history];
  }

  // Task execution logging
  logTaskExecution(metadata: TaskMetadata): void {
    this.taskExecutionLog.push(metadata);
    this.set(`task_metadata_${metadata.taskId}`, metadata);
  }

  getTaskExecutionLog(): TaskMetadata[] {
    return [...this.taskExecutionLog];
  }

  getTaskMetadata(taskId: string): TaskMetadata | undefined {
    return this.taskExecutionLog.find((t) => t.taskId === taskId);
  }

  // Cost tracking
  getTotalCost(): number {
    return this.taskExecutionLog.reduce((sum, t) => sum + (t.actualCost || 0), 0);
  }

  getEstimatedCost(): number {
    return this.taskExecutionLog.reduce((sum, t) => sum + (t.estimatedCost || 0), 0);
  }

  // Confidence tracking
  getAverageConfidence(): number {
    if (this.taskExecutionLog.length === 0) return 0;
    const sum = this.taskExecutionLog.reduce((total, t) => total + t.confidence, 0);
    return sum / this.taskExecutionLog.length;
  }

  clear(): void {
    this.memory.clear();
    this.history = [];
    this.taskExecutionLog = [];
  }
}

export const globalSharedMemory = new SharedMemory();

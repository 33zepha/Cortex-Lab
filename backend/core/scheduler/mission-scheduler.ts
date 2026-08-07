import type { MissionPlan, MissionTask } from "../contracts/mission-plan";

export type MissionTaskState = "queued" | "running" | "completed" | "failed" | "cancelled";

export type ScheduledTask = MissionTask & {
  state: MissionTaskState;
};

export class MissionScheduler {
  private readonly order: string[];
  private readonly tasks: Map<string, MissionTask>;
  private readonly states: Map<string, MissionTaskState>;

  constructor(plan: MissionPlan) {
    this.order = plan.tasks.map((task) => task.id);
    this.tasks = new Map(plan.tasks.map((task) => [task.id, task]));
    this.states = new Map(plan.tasks.map((task) => [task.id, "queued" as const]));
  }

  nextReady(): MissionTask | null {
    for (const id of this.order) {
      if (this.states.get(id) !== "queued") continue;
      const task = this.tasks.get(id)!;
      const dependenciesReady = task.dependencies.every((dependency) => this.states.get(dependency) === "completed");
      if (dependenciesReady) return task;
    }
    return null;
  }

  markRunning(taskId: string): void {
    this.transition(taskId, ["queued"], "running");
  }

  markCompleted(taskId: string): void {
    this.transition(taskId, ["running"], "completed");
  }

  markFailed(taskId: string): void {
    this.transition(taskId, ["running"], "failed");
  }

  markCancelled(taskId: string): void {
    this.transition(taskId, ["queued", "running"], "cancelled");
  }

  cancelQueued(): void {
    for (const id of this.order) {
      if (this.states.get(id) === "queued") this.states.set(id, "cancelled");
    }
  }

  isComplete(): boolean {
    return this.order.every((id) => this.states.get(id) === "completed");
  }

  hasBlockedQueuedTasks(): boolean {
    return this.order.some((id) => this.states.get(id) === "queued") && this.nextReady() === null;
  }

  snapshot(): ScheduledTask[] {
    return this.order.map((id) => ({ ...this.tasks.get(id)!, state: this.states.get(id)! }));
  }

  private transition(taskId: string, allowed: MissionTaskState[], next: MissionTaskState): void {
    const current = this.states.get(taskId);
    if (!current) throw new Error(`Tâche inconnue: ${taskId}`);
    if (!allowed.includes(current)) throw new Error(`Transition invalide pour ${taskId}: ${current} -> ${next}`);
    this.states.set(taskId, next);
  }
}

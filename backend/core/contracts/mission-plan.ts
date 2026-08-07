import { z } from "zod";

export const MissionTaskRisk = z.enum(["low", "medium", "high"]);
export type MissionTaskRisk = z.infer<typeof MissionTaskRisk>;

export const MissionTask = z.object({
  id: z.string().min(1).regex(/^[a-z0-9][a-z0-9._-]*$/i, "task id invalide"),
  objective: z.string().min(1),
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
  dependencies: z.array(z.string().min(1)).default([]),
  risk: MissionTaskRisk,
  preferredCapabilities: z.array(z.string().min(1)).default([]),
});
export type MissionTask = z.infer<typeof MissionTask>;

export const MissionPlan = z.object({
  version: z.literal("2.0.0"),
  tasks: z.array(MissionTask).min(1).max(20),
}).superRefine((plan, ctx) => {
  const ids = new Set<string>();
  for (let index = 0; index < plan.tasks.length; index++) {
    const task = plan.tasks[index];
    if (ids.has(task.id)) {
      ctx.addIssue({ code: "custom", path: ["tasks", index, "id"], message: `task id dupliqué: ${task.id}` });
    }
    ids.add(task.id);
  }

  for (let index = 0; index < plan.tasks.length; index++) {
    const task = plan.tasks[index];
    for (const dependency of task.dependencies) {
      if (dependency === task.id) {
        ctx.addIssue({ code: "custom", path: ["tasks", index, "dependencies"], message: `auto-dépendance interdite: ${task.id}` });
      } else if (!ids.has(dependency)) {
        ctx.addIssue({ code: "custom", path: ["tasks", index, "dependencies"], message: `dépendance inconnue: ${dependency}` });
      }
    }
  }

  const byId = new Map(plan.tasks.map((task) => [task.id, task] as const));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependencies ?? []) {
      if (visit(dependency)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };

  for (const task of plan.tasks) {
    if (visit(task.id)) {
      ctx.addIssue({ code: "custom", path: ["tasks"], message: "cycle de dépendances détecté" });
      break;
    }
  }
});

export type MissionPlan = z.infer<typeof MissionPlan>;

export function parseMissionPlan(raw: unknown): MissionPlan {
  return MissionPlan.parse(raw);
}

export function planSteps(plan: MissionPlan): string[] {
  return plan.tasks.map((task) => task.objective);
}

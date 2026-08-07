import type { MissionPlan } from "./mission-plan";

/** Transforme un objectif en graphe de tâches exécutable et validable. */
export interface Planner {
  version: "2.0.0";
  plan(objective: string, constraints?: string): Promise<MissionPlan>;
}

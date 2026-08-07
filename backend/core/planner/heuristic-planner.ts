import type { Planner } from "../contracts/planner";

/** Planner de secours heuristique lorsque OPENAI_API_KEY n'est pas configuré. */
export class HeuristicPlanner implements Planner {
  version = "1.0.0" as const;

  async plan(objective: string, _constraints?: string): Promise<string[]> {
    const cleanObj = objective.trim();
    const shortObj = cleanObj.length > 50 ? `${cleanObj.slice(0, 50)}…` : cleanObj;

    return [
      `1. Analyser la demande : ${shortObj}`,
      "2. Localiser les fichiers concernés et appliquer les modifications requises",
      "3. Vérifier la cohérence du code et valider par tests",
    ];
  }
}

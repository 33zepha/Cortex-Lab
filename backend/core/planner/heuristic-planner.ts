import type { Planner } from "../contracts/planner";
import type { MissionPlan } from "../contracts/mission-plan";

/** Planner déterministe de secours lorsque OPENAI_API_KEY n'est pas configuré. */
export class HeuristicPlanner implements Planner {
  version = "2.0.0" as const;

  async plan(objective: string, _constraints?: string): Promise<MissionPlan> {
    const cleanObj = objective.trim();
    const shortObj = cleanObj.length > 80 ? `${cleanObj.slice(0, 80)}…` : cleanObj;

    return {
      version: "2.0.0",
      tasks: [
        {
          id: "inspect",
          objective: `Analyser la demande et localiser les zones concernées : ${shortObj}`,
          acceptanceCriteria: ["Les fichiers ou composants concernés sont identifiés avant toute modification."],
          dependencies: [],
          risk: "low",
          preferredCapabilities: ["code.read"],
        },
        {
          id: "implement",
          objective: "Appliquer les modifications requises de manière minimale et cohérente.",
          acceptanceCriteria: ["Les modifications répondent directement à l'objectif sans changements hors périmètre."],
          dependencies: ["inspect"],
          risk: "medium",
          preferredCapabilities: ["code.read", "code.write"],
        },
        {
          id: "verify",
          objective: "Vérifier le résultat et valider la cohérence par les contrôles disponibles.",
          acceptanceCriteria: ["Le résultat final est vérifié et toute anomalie bloquante est signalée."],
          dependencies: ["implement"],
          risk: "low",
          preferredCapabilities: ["code.read", "test.run"],
        },
      ],
    };
  }
}

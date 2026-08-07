import OpenAI from "openai";
import type { Planner } from "../contracts/planner";
import { parseMissionPlan, type MissionPlan } from "../contracts/mission-plan";

const SYSTEM_PROMPT = `Tu es le planificateur technique de Cortex.
Transforme l'objectif en un graphe de 2 à 7 tâches concrètes pour un agent de développement autonome.
Réponds uniquement en JSON strict, sans markdown ni texte hors JSON.

Format exact:
{
  "version": "2.0.0",
  "tasks": [
    {
      "id": "inspect",
      "objective": "...",
      "acceptanceCriteria": ["..."],
      "dependencies": [],
      "risk": "low",
      "preferredCapabilities": ["code.read"]
    }
  ]
}

Règles:
- id court, stable et unique, caractères alphanumériques/._- uniquement;
- dependencies contient uniquement des ids présents dans tasks et ne crée aucun cycle;
- acceptanceCriteria contient au moins un critère observable par tâche;
- risk vaut low, medium ou high;
- preferredCapabilities décrit les capacités nécessaires (ex: code.read, code.write, test.run, research);
- ne crée une dépendance que si la tâche dépend réellement du résultat d'une autre tâche.`;

/** Planner réel v2 : produit un MissionPlan validé. Aucun fallback silencieux. */
export class OpenAiPlanner implements Planner {
  version = "2.0.0" as const;
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model = process.env.OPENAI_MODEL || "gpt-4o") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async plan(objective: string, constraints?: string): Promise<MissionPlan> {
    const userContent = constraints ? `Objectif: ${objective}\nContraintes: ${constraints}` : `Objectif: ${objective}`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Réponse vide de l'API OpenAI");

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error(`Réponse OpenAI non-JSON: ${content.slice(0, 200)}`);
    }

    try {
      return parseMissionPlan(parsed);
    } catch (error) {
      throw new Error(`MissionPlan v2 invalide retourné par OpenAI: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

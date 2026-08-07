import OpenAI from "openai";
import type { Planner } from "../contracts/planner";

const SYSTEM_PROMPT =
  "Tu es un planificateur technique. Décompose l'objectif fourni en 2 à 5 étapes concrètes et " +
  "actionnables pour un agent de développement autonome. Réponds uniquement en JSON strict de la " +
  'forme {"steps": ["étape 1", "étape 2", ...]}, sans numérotation ni texte hors JSON.';

/** Seule implémentation réelle en v0.1 : OpenAI. Aucun fallback silencieux — une erreur API fait échouer le plan. */
export class OpenAiPlanner implements Planner {
  version = "1.0.0" as const;
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async plan(objective: string, constraints?: string): Promise<string[]> {
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

    const steps = (parsed as { steps?: unknown }).steps;
    if (!Array.isArray(steps) || steps.length === 0 || !steps.every((s) => typeof s === "string")) {
      throw new Error("Plan invalide retourné par OpenAI (attendu: { steps: string[] })");
    }
    return steps;
  }
}

/**
 * Formulation du plan structuré à partir de l'objectif (ARCHITECTURE.md § modules).
 * Interface justifiée par au moins une seconde implémentation crédible (DECISIONS.md #11) :
 * un planificateur basé sur un autre LLM, ou une variante déterministe pour les tests.
 */
export interface Planner {
  version: "1.0.0";
  plan(objective: string, constraints?: string): Promise<string[]>;
}

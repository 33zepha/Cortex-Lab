import type { ModelAdapter, ModelResult, RunnerTask } from "../contracts/model-adapter";

/**
 * Implémentation déterministe pour les tests uniquement (DECISIONS.md #8).
 * Jamais utilisée en production — Claude Code reste le seul moteur réel.
 */
export class FakeModelAdapter implements ModelAdapter {
  version = "1.0.0" as const;

  async execute(task: RunnerTask): Promise<ModelResult> {
    return {
      success: true,
      output: `Exécution simulée — étape "${task.step}" pour l'objectif: ${task.objective}`,
      filesModified: [`${task.workspace.root}/fake-output.ts`],
      filesRead: [`${task.workspace.root}/fake-input.ts`],
      metadata: { tokensUsed: 128, duration: 10 },
    };
  }

  estimateTokens(task: RunnerTask): number {
    return task.objective.length + task.context.length;
  }

  async health(): Promise<{ available: boolean; rateLimit?: number }> {
    return { available: true, rateLimit: 1000 };
  }
}

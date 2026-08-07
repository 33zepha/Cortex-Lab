/**
 * Interface vers les moteurs d'exécution (ARCHITECTURE.md).
 * Une seule implémentation réelle prévue : Claude Code (DECISIONS.md #8).
 * Aucun fallback silencieux si indisponible.
 */
export interface RunnerTask {
  missionId: string;
  step: string;
  objective: string;
  context: string;
  constraints: string;
  workspace: {
    root: string;
    readOnly: string[];
    gitRepo?: boolean;
  };
}

export interface ModelResult {
  success: boolean;
  output: string;
  filesModified: string[];
  filesRead: string[];
  error?: string;
  metadata: { tokensUsed: number; duration: number };
}

export interface ModelAdapter {
  version: "1.0.0";
  execute(task: RunnerTask): Promise<ModelResult>;
  estimateTokens(task: RunnerTask): number;
  health(): Promise<{ available: boolean; rateLimit?: number }>;
}

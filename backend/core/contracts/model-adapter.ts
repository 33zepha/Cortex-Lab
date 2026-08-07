/**
 * Interface vers les moteurs d'exécution (ARCHITECTURE.md).
 * Les adapters doivent respecter l'annulation du runtime et ne jamais masquer un échec.
 */
export interface RunnerTask {
  missionId: string;
  step: string;
  objective: string;
  context: string;
  constraints: string;
  signal?: AbortSignal;
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

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

export type ModelTokenUsage = {
  /** Tokens réellement traités hors mécanisme de cache. Sert au garde-fou de budget. */
  activeTokens: number;
  inputTokens: number;
  outputTokens: number;
  /** Cache observé pour la télémétrie, mais non débité à 100 % du budget mission. */
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  /** Volume total vu par le fournisseur, utile pour diagnostiquer le contexte/cache. */
  totalContextTokens: number;
};

export interface ModelResult {
  success: boolean;
  output: string;
  filesModified: string[];
  filesRead: string[];
  error?: string;
  metadata: {
    /** Budget runtime : tokens actifs, hors lecture/création de cache fournisseur. */
    tokensUsed: number;
    duration: number;
    tokenUsage?: ModelTokenUsage;
  };
}

export interface ModelAdapter {
  version: "1.0.0";
  execute(task: RunnerTask): Promise<ModelResult>;
  estimateTokens(task: RunnerTask): number;
  health(): Promise<{ available: boolean; rateLimit?: number }>;
}

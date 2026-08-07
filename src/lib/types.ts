/** Types partagés par les vues CortexLab. */

export type MissionStatus = "running" | "needs_review" | "completed" | "failed" | "cancelled";
export type MissionFilter = "all" | "active" | "needs_review" | "completed" | "failed";

export type TestsSummary = {
  status: "passing" | "failing" | "none";
  passed: number;
  failed: number;
  total: number;
};

export type EvidenceKind = "test" | "diff" | "artifact" | "log";
export type Evidence = { id: string; kind: EvidenceKind; title: string; content: string; timestamp: number };

export type MissionTaskRisk = "low" | "medium" | "high";
export type MissionTask = {
  id: string;
  objective: string;
  acceptanceCriteria: string[];
  dependencies: string[];
  risk: MissionTaskRisk;
  preferredCapabilities: string[];
};
export type MissionPlan = { version: "2.0.0"; tasks: MissionTask[] };

export type TimelineEventType = "plan" | "step" | "file_read" | "file_modified" | "test" | "decision" | "closure" | "error";
export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  ts: number;
  title: string;
  detail?: string;
  children?: string[];
  evidenceId?: string;
};

export type Mission = {
  id: string;
  objective: string;
  constraints?: string;
  status: MissionStatus;
  step: string;
  model: string;
  progress: number;
  createdAt: number;
  closedAt: number | null;
  durationMs: number;
  filesRead: string[];
  filesModified: string[];
  tests: TestsSummary;
  evidence: Evidence[];
  plan?: MissionPlan;
  patch?: string;
  summary?: string;
  error?: string | null;
  decisionRequired: boolean;
  decisionPrompt?: string;
  timeline: TimelineEvent[];
};

export type SystemHealth = {
  cortexServer: { status: "running" | "degraded" | "stopped"; uptimeSeconds: number; memoryMb: number };
  claudeCode: { status: "available" | "degraded" | "unavailable"; lastCallAt: number | null; tokensUsedToday: number };
  openai: { status: "available" | "unavailable"; lastCallAt: number | null; plansToday: number };
  ledger: { totalEvents: number; sizeKb: number; lastWriteAt: number | null };
  storage: {
    activeMissions: number;
    usedMb: number;
    quotaMb: number;
    breakdown: { label: string; valueMb: number; colorClass: string }[];
  };
  sse: { connectedClients: number; status: "connected" | "reconnecting" | "disconnected"; avgLagMs: number };
  recentErrors: { id: string; message: string; ts: number }[];
};

/** Types partagés par les vues CortexLab. */

export type MissionStatus = "running" | "needs_review" | "completed" | "failed" | "cancelled";
export type MissionFilter = "all" | "active" | "needs_review" | "completed" | "failed";

export type OperatorRunStatus =
  | "queued"
  | "planning"
  | "running"
  | "waiting_for_human"
  | "paused"
  | "cancelling"
  | "cancelled"
  | "failed"
  | "succeeded";

export type OperatorEntityStatus = "online" | "degraded" | "offline";

export type MissionControlCapabilities = {
  canPause: boolean;
  canResume: boolean;
  canCancel: boolean;
  canRetry: boolean;
  canAddInstruction: boolean;
  canApprove: boolean;
  canReject: boolean;
};

export type OperatorAgent = {
  id: string;
  name: string;
  role: string;
  status: "idle" | "working" | "waiting" | "blocked" | "offline";
};

export type OperatorRuntime = {
  id: string;
  name: string;
  adapter: string;
  location: string;
  status: OperatorEntityStatus;
};

export type OperatorModel = {
  id: string;
  name: string;
  provider: string;
};

export type OperatorStage = {
  id: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  detail?: string;
  startedAt?: number | null;
  completedAt?: number | null;
};

export type OperatorDecision = {
  id: string;
  title: string;
  question: string;
  rationale: string;
  impact: string;
  requestedAt: number;
};

export type OperatorUsage = {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  estimatedCost: number | null;
};

export type OperatorAttention = {
  kind: "decision" | "incident" | "failure" | "instruction";
  severity: "critical" | "high" | "medium";
  title: string;
  summary: string;
};

export type OperatorIncident = {
  id: string;
  title: string;
  detail: string;
  severity: "critical" | "high" | "medium";
  status: "open" | "monitoring" | "resolved";
  runtimeId?: string;
  createdAt: number;
};

export type OperatorRun = {
  id: string;
  attempt: number;
  status: OperatorRunStatus;
  startedAt: number | null;
  updatedAt: number;
  agent: OperatorAgent;
  runtime: OperatorRuntime;
  model: OperatorModel;
  stages: OperatorStage[];
  currentStageId: string | null;
  decision?: OperatorDecision | null;
  usage: OperatorUsage;
};

export type OperatorMissionData = {
  run: OperatorRun;
  capabilities: MissionControlCapabilities;
  attention?: OperatorAttention | null;
};

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
  title?: string;
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
  operator?: OperatorMissionData;
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

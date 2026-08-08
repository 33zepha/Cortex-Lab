import type {
  Mission,
  MissionControlCapabilities,
  OperatorAttention,
  OperatorDecision,
  OperatorRunStatus,
  OperatorStage,
} from "@/lib/types";

export type OperationalMission = {
  mission: Mission;
  runId: string;
  attempt: number;
  status: OperatorRunStatus;
  statusLabel: string;
  agentName: string;
  agentRole: string;
  runtimeName: string;
  runtimeDetail: string;
  runtimeStatus: "online" | "degraded" | "offline";
  modelName: string;
  modelProvider: string;
  stageLabel: string;
  stages: OperatorStage[];
  progress: number | null;
  lastEvent: Mission["timeline"][number] | null;
  decision: OperatorDecision | null;
  attention: OperatorAttention | null;
  capabilities: MissionControlCapabilities;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  estimatedCost: number | null;
};

export const OPERATOR_STATUS_LABELS: Record<OperatorRunStatus, string> = {
  queued: "En file",
  planning: "Planification",
  running: "En cours",
  waiting_for_human: "Décision requise",
  paused: "En pause",
  cancelling: "Arrêt en cours",
  cancelled: "Arrêtée",
  failed: "Échec",
  succeeded: "Terminée",
};

export function legacyStatusForOperatorStatus(status: OperatorRunStatus): Mission["status"] {
  if (status === "waiting_for_human") return "needs_review";
  if (status === "failed") return "failed";
  if (status === "cancelled") return "cancelled";
  if (status === "succeeded") return "completed";
  return "running";
}

function fallbackStatus(mission: Mission): OperatorRunStatus {
  if (mission.status === "needs_review") return "waiting_for_human";
  if (mission.status === "completed") return "succeeded";
  return mission.status;
}

function fallbackCapabilities(status: OperatorRunStatus): MissionControlCapabilities {
  return {
    canPause: false,
    canResume: false,
    canCancel: ["running", "waiting_for_human"].includes(status),
    canRetry: false,
    canAddInstruction: false,
    canApprove: status === "waiting_for_human",
    canReject: status === "waiting_for_human",
  };
}

function fallbackStages(mission: Mission, status: OperatorRunStatus): OperatorStage[] {
  if (mission.plan?.tasks.length) {
    const finished = status === "succeeded";
    const failed = status === "failed";
    return mission.plan.tasks.map((task, index) => ({
      id: task.id,
      label: task.objective,
      status: finished
        ? "completed"
        : failed && index === 0
          ? "failed"
          : index === 0
            ? "running"
            : "pending",
      detail: task.acceptanceCriteria[0],
    }));
  }

  return [{
    id: "execution",
    label: mission.step || "Exécution",
    status: status === "failed"
      ? "failed"
      : status === "succeeded"
        ? "completed"
        : status === "cancelled"
          ? "skipped"
          : status === "queued"
            ? "pending"
            : "running",
  }];
}

function deriveAttention(mission: Mission, status: OperatorRunStatus): OperatorAttention | null {
  if (status === "waiting_for_human") {
    return {
      kind: "decision",
      severity: "high",
      title: "Décision humaine requise",
      summary: mission.decisionPrompt ?? "Cortex attend une validation avant de poursuivre.",
    };
  }

  if (status === "failed") {
    return {
      kind: "failure",
      severity: "high",
      title: "Mission interrompue",
      summary: mission.error ?? "L'exécution a échoué et nécessite un diagnostic.",
    };
  }

  if (status === "paused") {
    return {
      kind: "instruction",
      severity: "medium",
      title: "Mission en pause",
      summary: "Reprenez l'exécution ou ajoutez une instruction.",
    };
  }

  return null;
}

function measuredProgress(stages: OperatorStage[], status: OperatorRunStatus): number | null {
  if (status === "succeeded") return 100;
  if (status === "cancelled" || stages.length === 0) return null;
  const completed = stages.filter((stage) => stage.status === "completed" || stage.status === "skipped").length;
  return Math.round((completed / stages.length) * 100);
}

export function getOperationalMission(mission: Mission): OperationalMission {
  const operator = mission.operator;
  const status = operator?.run.status ?? fallbackStatus(mission);
  const stages = operator?.run.stages ?? fallbackStages(mission, status);
  const currentStage = operator?.run.currentStageId
    ? stages.find((stage) => stage.id === operator.run.currentStageId)
    : stages.find((stage) => stage.status === "running" || stage.status === "failed");
  const lastEvent = [...mission.timeline].sort((a, b) => b.ts - a.ts)[0] ?? null;
  const modelName = operator?.run.model.name ?? mission.model;
  const provider = operator?.run.model.provider ?? (
    mission.model.toLowerCase().includes("claude") ? "Anthropic" : "Cortex"
  );

  return {
    mission,
    runId: operator?.run.id ?? `${mission.id}:run:1`,
    attempt: operator?.run.attempt ?? 1,
    status,
    statusLabel: OPERATOR_STATUS_LABELS[status],
    agentName: operator?.run.agent.name ?? "Agent Cortex",
    agentRole: operator?.run.agent.role ?? "Exécution",
    runtimeName: operator?.run.runtime.name ?? "Runtime Cortex",
    runtimeDetail: operator
      ? `${operator.run.runtime.adapter} · ${operator.run.runtime.location}`
      : "Adaptateur non exposé",
    runtimeStatus: operator?.run.runtime.status ?? "degraded",
    modelName,
    modelProvider: provider,
    stageLabel: currentStage?.label ?? mission.step ?? "En attente",
    stages,
    progress: operator ? measuredProgress(stages, status) : status === "succeeded" ? 100 : null,
    lastEvent,
    decision: operator?.run.decision ?? (
      mission.decisionRequired
        ? {
            id: `${mission.id}:decision`,
            title: "Décision humaine requise",
            question: mission.decisionPrompt ?? "Autoriser Cortex à poursuivre ?",
            rationale: "Le runtime a atteint une étape nécessitant une validation humaine.",
            impact: "La mission reste suspendue tant que la décision n'est pas fournie.",
            requestedAt: lastEvent?.ts ?? mission.createdAt,
          }
        : null
    ),
    attention: operator?.attention ?? deriveAttention(mission, status),
    capabilities: operator?.capabilities ?? fallbackCapabilities(status),
    inputTokens: operator?.run.usage.inputTokens ?? 0,
    outputTokens: operator?.run.usage.outputTokens ?? 0,
    cachedTokens: operator?.run.usage.cachedTokens ?? 0,
    estimatedCost: operator?.run.usage.estimatedCost ?? null,
  };
}

export function isMissionActive(mission: Mission): boolean {
  return ["queued", "planning", "running", "waiting_for_human", "paused", "cancelling"].includes(
    getOperationalMission(mission).status,
  );
}

export function missionRequiresAttention(mission: Mission): boolean {
  return Boolean(getOperationalMission(mission).attention);
}

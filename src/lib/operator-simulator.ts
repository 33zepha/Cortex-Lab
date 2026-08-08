import { legacyStatusForOperatorStatus } from "./operator-contract";
import type {
  Mission,
  MissionControlCapabilities,
  OperatorIncident,
  OperatorMissionData,
  OperatorRunStatus,
  OperatorStage,
  SystemHealth,
  TimelineEvent,
} from "./types";

const SIMULATOR_KEY = "cortex.operator.simulator";
const SIMULATOR_SCENARIO = "operator";
const minute = 60_000;

export type OperatorSimulatorSnapshot = {
  version: number;
  scenario: typeof SIMULATOR_SCENARIO;
  missions: Mission[];
  incidents: OperatorIncident[];
  updatedAt: number;
};

export type OperatorCommand =
  | "pause"
  | "resume"
  | "cancel"
  | "retry"
  | "instruction"
  | "approve"
  | "reject";

type CommandBody = {
  command?: OperatorCommand;
  instruction?: string;
  decision?: "approve" | "reject";
  reason?: string;
};

const listeners = new Set<() => void>();

function capabilitiesFor(status: OperatorRunStatus): MissionControlCapabilities {
  return {
    canPause: status === "running",
    canResume: status === "paused",
    canCancel: ["queued", "planning", "running", "waiting_for_human", "paused"].includes(status),
    canRetry: status === "failed" || status === "cancelled",
    canAddInstruction: ["running", "waiting_for_human", "paused"].includes(status),
    canApprove: status === "waiting_for_human",
    canReject: status === "waiting_for_human",
  };
}

function operatorData({
  missionId,
  status,
  attempt = 1,
  stages,
  currentStageId,
  updatedAt,
  decision = null,
  attention = null,
  agentName = "Antigravity",
  agentRole = "Lead Engineer",
  runtimeStatus = "online",
  modelName = "Claude Sonnet 4.5",
  modelProvider = "Anthropic",
  inputTokens = 0,
  outputTokens = 0,
  cachedTokens = 0,
}: {
  missionId: string;
  status: OperatorRunStatus;
  attempt?: number;
  stages: OperatorStage[];
  currentStageId: string | null;
  updatedAt: number;
  decision?: OperatorMissionData["run"]["decision"];
  attention?: OperatorMissionData["attention"];
  agentName?: string;
  agentRole?: string;
  runtimeStatus?: OperatorMissionData["run"]["runtime"]["status"];
  modelName?: string;
  modelProvider?: string;
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
}): OperatorMissionData {
  return {
    run: {
      id: `${missionId}:run:${attempt}`,
      attempt,
      status,
      startedAt: updatedAt,
      updatedAt,
      agent: {
        id: `agent:${agentName.toLowerCase().replaceAll(" ", "-")}`,
        name: agentName,
        role: agentRole,
        status: status === "waiting_for_human"
          ? "waiting"
          : status === "failed"
            ? "blocked"
            : status === "succeeded" || status === "cancelled"
              ? "idle"
              : "working",
      },
      runtime: {
        id: "runtime:cortex-vps",
        name: "Cortex VPS",
        adapter: "Claude Code",
        location: "eu-west · Tailscale",
        status: runtimeStatus,
      },
      model: {
        id: `model:${modelName.toLowerCase().replaceAll(" ", "-")}`,
        name: modelName,
        provider: modelProvider,
      },
      stages,
      currentStageId,
      decision,
      usage: {
        inputTokens,
        outputTokens,
        cachedTokens,
        estimatedCost: null,
      },
    },
    capabilities: capabilitiesFor(status),
    attention,
  };
}

function makeMission({
  id,
  objective,
  constraints,
  status,
  createdAt,
  updatedAt,
  stages,
  currentStageId,
  timeline,
  decision,
  attention,
  error = null,
  summary,
  filesRead = [],
  filesModified = [],
  tests = { status: "none" as const, passed: 0, failed: 0, total: 0 },
  evidence = [],
  runtimeStatus = "online" as const,
  inputTokens = 0,
  outputTokens = 0,
  cachedTokens = 0,
}: {
  id: string;
  objective: string;
  constraints?: string;
  status: OperatorRunStatus;
  createdAt: number;
  updatedAt: number;
  stages: OperatorStage[];
  currentStageId: string | null;
  timeline: TimelineEvent[];
  decision?: OperatorMissionData["run"]["decision"];
  attention?: OperatorMissionData["attention"];
  error?: string | null;
  summary?: string;
  filesRead?: string[];
  filesModified?: string[];
  tests?: Mission["tests"];
  evidence?: Mission["evidence"];
  runtimeStatus?: OperatorMissionData["run"]["runtime"]["status"];
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
}): Mission {
  const completedAt = status === "succeeded" || status === "failed" || status === "cancelled" ? updatedAt : null;
  return {
    id,
    objective,
    constraints,
    status: legacyStatusForOperatorStatus(status),
    step: stages.find((stage) => stage.id === currentStageId)?.label ?? "En attente",
    model: "claude-code",
    progress: status === "succeeded" ? 100 : 0,
    createdAt,
    closedAt: completedAt,
    durationMs: Math.max(0, updatedAt - createdAt),
    filesRead,
    filesModified,
    tests,
    evidence,
    summary,
    error,
    decisionRequired: status === "waiting_for_human",
    decisionPrompt: decision?.question,
    timeline,
    operator: operatorData({
      missionId: id,
      status,
      stages,
      currentStageId,
      updatedAt,
      decision,
      attention,
      runtimeStatus,
      inputTokens,
      outputTokens,
      cachedTokens,
    }),
  };
}

export function createOperatorScenario(now = Date.now()): OperatorSimulatorSnapshot {
  const longMissionId = "SIM-RUNNING-3H";
  const decisionMissionId = "SIM-DECISION";
  const failedMissionId = "SIM-FAILED";
  const pausedMissionId = "SIM-PAUSED";
  const completedMissionId = "SIM-COMPLETED";

  const missions: Mission[] = [
    makeMission({
      id: longMissionId,
      objective: "Auditer Cortex, corriger les régressions mobiles et produire les preuves de validation",
      constraints: "Préserver la direction graphite et ne modifier aucun contrat backend existant.",
      status: "running",
      createdAt: now - 3 * 60 * minute,
      updatedAt: now - 2 * minute,
      stages: [
        { id: "inventory", label: "Cartographier les parcours", status: "completed", completedAt: now - 142 * minute },
        { id: "mobile", label: "Recomposer l'expérience mobile", status: "completed", completedAt: now - 61 * minute },
        { id: "validation", label: "Valider les quatre viewports", status: "running", detail: "390×844 en cours", startedAt: now - 18 * minute },
        { id: "handoff", label: "Consolider les preuves", status: "pending" },
      ],
      currentStageId: "validation",
      filesRead: ["src/screens/MissionDetailScreen.tsx", "src/components/shell/MobileNav.tsx"],
      filesModified: ["src/styles/app-continuity.css", "src/screens/OverviewScreen.tsx"],
      tests: { status: "passing", passed: 34, failed: 0, total: 34 },
      evidence: [{
        id: "sim-evidence-mobile",
        kind: "artifact",
        title: "mobile-390x844.png",
        content: "Capture de validation du cockpit opérateur à 390×844.",
        timestamp: now - 2 * minute,
      }],
      inputTokens: 148_420,
      outputTokens: 31_280,
      cachedTokens: 84_110,
      timeline: [
        { id: "run-plan", type: "plan", ts: now - 179 * minute, title: "Plan d'exécution accepté", detail: "4 étapes · 1 agent principal" },
        { id: "run-mobile", type: "step", ts: now - 61 * minute, title: "Parcours mobile recomposé", detail: "Navigation et contrôles au pouce prêts" },
        { id: "run-tests", type: "test", ts: now - 11 * minute, title: "Suite frontend validée", detail: "34/34 tests passants" },
        { id: "run-latest", type: "file_modified", ts: now - 2 * minute, title: "Validation 390×844 enregistrée", detail: "Aucun chevauchement du dock", evidenceId: "sim-evidence-mobile" },
      ],
    }),
    makeMission({
      id: decisionMissionId,
      objective: "Déployer la nouvelle politique de reprise automatique sur le runtime principal",
      status: "waiting_for_human",
      createdAt: now - 47 * minute,
      updatedAt: now - 6 * minute,
      stages: [
        { id: "inspect", label: "Inspecter la politique actuelle", status: "completed" },
        { id: "prepare", label: "Préparer la migration", status: "completed" },
        { id: "deploy", label: "Déployer sur le runtime principal", status: "running", detail: "Validation humaine requise" },
        { id: "observe", label: "Observer la reprise", status: "pending" },
      ],
      currentStageId: "deploy",
      decision: {
        id: "decision:auto-retry",
        title: "Activation sur le runtime principal",
        question: "Autoriser une reprise automatique unique après une coupure du flux ?",
        rationale: "Le canary a repris 12 exécutions sans produire de double commande.",
        impact: "Une mission interrompue pourra reprendre une fois depuis son dernier événement durable.",
        requestedAt: now - 6 * minute,
      },
      attention: {
        kind: "decision",
        severity: "high",
        title: "Autorisation de déploiement",
        summary: "Le canary est validé. Cortex attend votre décision pour le runtime principal.",
      },
      inputTokens: 28_440,
      outputTokens: 5_820,
      cachedTokens: 16_300,
      timeline: [
        { id: "decision-plan", type: "plan", ts: now - 46 * minute, title: "Migration planifiée", detail: "Canary puis runtime principal" },
        { id: "decision-test", type: "test", ts: now - 12 * minute, title: "Canary observé", detail: "12 reprises · aucun doublon" },
        { id: "decision-request", type: "decision", ts: now - 6 * minute, title: "Décision demandée", detail: "Activer la politique sur le runtime principal" },
      ],
    }),
    makeMission({
      id: failedMissionId,
      objective: "Synchroniser les artifacts de mission vers le stockage persistant",
      status: "failed",
      createdAt: now - 38 * minute,
      updatedAt: now - 21 * minute,
      stages: [
        { id: "collect", label: "Collecter les artifacts", status: "completed" },
        { id: "upload", label: "Transférer vers le stockage", status: "failed", detail: "Écriture refusée par le runtime" },
        { id: "verify", label: "Vérifier l'intégrité", status: "pending" },
      ],
      currentStageId: "upload",
      error: "Le runtime storage-eu-1 a refusé l'écriture après expiration du jeton de service.",
      attention: {
        kind: "failure",
        severity: "high",
        title: "Échec récupérable",
        summary: "Le jeton a été renouvelé. La mission peut être relancée depuis son dernier checkpoint.",
      },
      inputTokens: 9_420,
      outputTokens: 1_890,
      cachedTokens: 4_100,
      evidence: [{
        id: "sim-storage-log",
        kind: "log",
        title: "storage-eu-1.log",
        content: "403 service_token_expired · checkpoint artifact-18 préservé",
        timestamp: now - 21 * minute,
      }],
      timeline: [
        { id: "failed-plan", type: "plan", ts: now - 37 * minute, title: "Synchronisation préparée", detail: "18 artifacts détectés" },
        { id: "failed-error", type: "error", ts: now - 21 * minute, title: "Écriture refusée", detail: "Jeton de service expiré", evidenceId: "sim-storage-log" },
      ],
    }),
    makeMission({
      id: pausedMissionId,
      objective: "Mettre à jour la documentation des contrats Mission, Run et Agent",
      status: "paused",
      createdAt: now - 29 * minute,
      updatedAt: now - 9 * minute,
      stages: [
        { id: "inventory", label: "Comparer les contrats", status: "completed" },
        { id: "write", label: "Rédiger les contrats cibles", status: "running", detail: "Pause demandée par l'opérateur" },
        { id: "review", label: "Relire les exemples", status: "pending" },
      ],
      currentStageId: "write",
      attention: {
        kind: "instruction",
        severity: "medium",
        title: "Mission en pause",
        summary: "Ajoutez une instruction ou reprenez l'exécution avec le contexte actuel.",
      },
      inputTokens: 15_840,
      outputTokens: 4_210,
      cachedTokens: 8_900,
      timeline: [
        { id: "paused-plan", type: "plan", ts: now - 28 * minute, title: "Documentation cartographiée" },
        { id: "paused-event", type: "step", ts: now - 9 * minute, title: "Exécution mise en pause", detail: "Checkpoint enregistré" },
      ],
    }),
    makeMission({
      id: completedMissionId,
      objective: "Corriger le deep link de la vue Activité sur Vercel",
      status: "succeeded",
      createdAt: now - 26 * minute,
      updatedAt: now - 13 * minute,
      stages: [
        { id: "route", label: "Ajouter la réécriture", status: "completed" },
        { id: "verify", label: "Tester le refresh direct", status: "completed" },
      ],
      currentStageId: null,
      summary: "La route /console est désormais servie par l'application au refresh direct.",
      filesRead: ["vercel.json"],
      filesModified: ["vercel.json"],
      tests: { status: "passing", passed: 3, failed: 0, total: 3 },
      inputTokens: 3_120,
      outputTokens: 840,
      cachedTokens: 1_600,
      timeline: [
        { id: "completed-route", type: "file_modified", ts: now - 17 * minute, title: "Réécriture /console ajoutée" },
        { id: "completed-close", type: "closure", ts: now - 13 * minute, title: "Mission terminée", detail: "Refresh direct validé" },
      ],
    }),
  ];

  return {
    version: 1,
    scenario: SIMULATOR_SCENARIO,
    missions,
    incidents: [{
      id: "incident:runtime-kimi",
      title: "Runtime Kimi local indisponible",
      detail: "Dernier heartbeat il y a 18 min. Les missions nouvelles restent routées vers Cortex VPS.",
      severity: "medium",
      status: "monitoring",
      runtimeId: "runtime:kimi-local",
      createdAt: now - 18 * minute,
    }],
    updatedAt: now,
  };
}

let snapshot = createOperatorScenario();

function commit(next: Omit<OperatorSimulatorSnapshot, "version">): void {
  snapshot = { ...next, version: snapshot.version + 1 };
  listeners.forEach((listener) => listener());
}

function replaceMission(nextMission: Mission): Mission {
  commit({
    ...snapshot,
    missions: snapshot.missions.map((mission) => mission.id === nextMission.id ? nextMission : mission),
    updatedAt: Date.now(),
  });
  return nextMission;
}

function readSimulatorFlag(): boolean {
  if (typeof window === "undefined") return false;
  const requestedMode = new URLSearchParams(window.location.search).get("simulate");

  try {
    if (requestedMode === SIMULATOR_SCENARIO) {
      window.sessionStorage.setItem(SIMULATOR_KEY, SIMULATOR_SCENARIO);
      return true;
    }
    if (requestedMode === "off") {
      window.sessionStorage.removeItem(SIMULATOR_KEY);
      return false;
    }
    return window.sessionStorage.getItem(SIMULATOR_KEY) === SIMULATOR_SCENARIO;
  } catch {
    return requestedMode === SIMULATOR_SCENARIO;
  }
}

export function isOperatorSimulatorEnabled(): boolean {
  return readSimulatorFlag();
}

export function leaveOperatorSimulator(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SIMULATOR_KEY);
  } catch {
    // Le rechargement suffit lorsque sessionStorage est indisponible.
  }
  const url = new URL(window.location.href);
  url.searchParams.delete("simulate");
  window.location.assign(url.toString());
}

export function resetOperatorSimulator(): void {
  const next = createOperatorScenario();
  snapshot = { ...next, version: snapshot.version + 1 };
  listeners.forEach((listener) => listener());
}

export function subscribeOperatorSimulator(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getOperatorSimulatorSnapshot(): OperatorSimulatorSnapshot {
  return snapshot;
}

function cloneWithStatus(
  mission: Mission,
  status: OperatorRunStatus,
  now: number,
  event: TimelineEvent,
  overrides: Partial<Mission> = {},
): Mission {
  if (!mission.operator) return mission;
  const operator = mission.operator;
  return {
    ...mission,
    ...overrides,
    status: legacyStatusForOperatorStatus(status),
    step: overrides.step ?? mission.step,
    closedAt: ["succeeded", "failed", "cancelled"].includes(status) ? now : null,
    durationMs: Math.max(0, now - mission.createdAt),
    decisionRequired: status === "waiting_for_human",
    timeline: [...mission.timeline, event],
    operator: {
      ...operator,
      attention: status === "paused"
        ? {
            kind: "instruction",
            severity: "medium",
            title: "Mission en pause",
            summary: "Reprenez l'exécution ou ajoutez une instruction.",
          }
        : status === "failed"
          ? operator.attention
          : null,
      capabilities: capabilitiesFor(status),
      run: {
        ...operator.run,
        status,
        updatedAt: now,
        decision: status === "waiting_for_human" ? operator.run.decision : null,
        agent: {
          ...operator.run.agent,
          status: status === "paused" || status === "waiting_for_human"
            ? "waiting"
            : status === "failed"
              ? "blocked"
              : status === "succeeded" || status === "cancelled"
                ? "idle"
                : "working",
        },
      },
    },
  };
}

export function applyOperatorCommand(
  mission: Mission,
  command: OperatorCommand,
  body: CommandBody = {},
  now = Date.now(),
): Mission {
  if (!mission.operator) return mission;
  const eventId = `${mission.id}:${command}:${now}`;

  if (command === "pause") {
    return cloneWithStatus(mission, "paused", now, {
      id: eventId,
      type: "step",
      ts: now,
      title: "Exécution mise en pause",
      detail: "Checkpoint durable enregistré",
    });
  }

  if (command === "resume") {
    return cloneWithStatus(mission, "running", now, {
      id: eventId,
      type: "step",
      ts: now,
      title: "Exécution reprise",
      detail: "Reprise depuis le dernier checkpoint",
    });
  }

  if (command === "cancel") {
    return cloneWithStatus(mission, "cancelled", now, {
      id: eventId,
      type: "closure",
      ts: now,
      title: "Mission arrêtée",
      detail: body.reason || "Arrêt demandé par l'opérateur",
    }, { error: null });
  }

  if (command === "approve") {
    return cloneWithStatus(mission, "running", now, {
      id: eventId,
      type: "decision",
      ts: now,
      title: "Décision approuvée",
      detail: "Le runtime reprend l'exécution",
    }, { decisionPrompt: undefined });
  }

  if (command === "reject") {
    return cloneWithStatus(mission, "paused", now, {
      id: eventId,
      type: "decision",
      ts: now,
      title: "Décision refusée",
      detail: "La mission reste en pause dans l'attente d'une instruction",
    }, { decisionPrompt: undefined });
  }

  if (command === "instruction") {
    const instruction = body.instruction?.trim() || "Instruction opérateur ajoutée";
    return cloneWithStatus(mission, "running", now, {
      id: eventId,
      type: "step",
      ts: now,
      title: "Instruction opérateur ajoutée",
      detail: instruction,
    });
  }

  const retryId = `${mission.id}-R${mission.operator.run.attempt + 1}`;
  const stages = mission.operator.run.stages.map((stage, index) => ({
    ...stage,
    status: index === 0 ? "running" as const : "pending" as const,
    startedAt: index === 0 ? now : null,
    completedAt: null,
  }));
  return {
    ...mission,
    id: retryId,
    status: "running",
    step: stages[0]?.label ?? "Planification",
    progress: 0,
    createdAt: now,
    closedAt: null,
    durationMs: 0,
    error: null,
    decisionRequired: false,
    decisionPrompt: undefined,
    timeline: [{
      id: eventId,
      type: "plan",
      ts: now,
      title: `Nouvelle tentative #${mission.operator.run.attempt + 1}`,
      detail: "Reprise depuis le dernier checkpoint durable",
    }],
    operator: {
      ...mission.operator,
      attention: null,
      capabilities: capabilitiesFor("running"),
      run: {
        ...mission.operator.run,
        id: `${retryId}:run:${mission.operator.run.attempt + 1}`,
        attempt: mission.operator.run.attempt + 1,
        status: "running",
        startedAt: now,
        updatedAt: now,
        stages,
        currentStageId: stages[0]?.id ?? null,
        decision: null,
        agent: { ...mission.operator.run.agent, status: "working" },
      },
    },
  };
}

function advanceCreatedMission(id: string): void {
  const planningTimer = globalThis.setTimeout(() => {
    const mission = snapshot.missions.find((item) => item.id === id);
    if (!mission?.operator || mission.operator.run.status !== "queued") return;
    replaceMission(cloneWithStatus(mission, "planning", Date.now(), {
      id: `${id}:planning`,
      type: "plan",
      ts: Date.now(),
      title: "Cortex construit le plan",
      detail: "Contraintes et capacités analysées",
    }, { step: "Planification" }));
  }, 450);

  const runningTimer = globalThis.setTimeout(() => {
    const mission = snapshot.missions.find((item) => item.id === id);
    if (!mission?.operator || !["queued", "planning"].includes(mission.operator.run.status)) return;
    const stages = mission.operator.run.stages.map((stage, index) => ({
      ...stage,
      status: index === 0 ? "running" as const : stage.status,
      startedAt: index === 0 ? Date.now() : stage.startedAt,
    }));
    const nextMission = cloneWithStatus(mission, "running", Date.now(), {
      id: `${id}:started`,
      type: "step",
      ts: Date.now(),
      title: "Premier agent lancé",
      detail: "Le run est maintenant observable et contrôlable",
    }, { step: stages[0]?.label ?? "Exécution" });
    if (nextMission.operator) {
      nextMission.operator = {
        ...nextMission.operator,
        run: {
          ...nextMission.operator.run,
          stages,
          currentStageId: stages[0]?.id ?? null,
        },
      };
    }
    replaceMission(nextMission);
  }, 1_250);

  void planningTimer;
  void runningTimer;
}

export async function simulatorFetch<T>(path: string): Promise<T> {
  if (path === "/api/missions") return snapshot.missions as T;

  const missionMatch = path.match(/^\/api\/missions\/([^/]+)$/);
  if (missionMatch) {
    const mission = snapshot.missions.find((item) => item.id === decodeURIComponent(missionMatch[1] ?? ""));
    if (!mission) throw new Error("Mission simulée introuvable");
    return mission as T;
  }

  if (path === "/api/health") {
    const health: SystemHealth = {
      cortexServer: { status: "running", uptimeSeconds: 86_420, memoryMb: 612 },
      claudeCode: { status: "available", lastCallAt: Date.now() - minute, tokensUsedToday: 252_440 },
      openai: { status: "available", lastCallAt: Date.now() - 4 * minute, plansToday: 7 },
      ledger: { totalEvents: 1_842, sizeKb: 884, lastWriteAt: snapshot.updatedAt },
      storage: {
        activeMissions: snapshot.missions.filter((mission) => mission.status === "running" || mission.status === "needs_review").length,
        usedMb: 482,
        quotaMb: 2_048,
        breakdown: [
          { label: "Missions", valueMb: 186, colorClass: "bg-text-primary" },
          { label: "Preuves", valueMb: 214, colorClass: "bg-text-secondary" },
          { label: "Ledger", valueMb: 82, colorClass: "bg-text-muted" },
        ],
      },
      sse: { connectedClients: 2, status: "connected", avgLagMs: 82 },
      recentErrors: [],
    };
    return health as T;
  }

  if (path === "/api/tokens/weekly") {
    return [
      { day: "Lun", tokens: 18420 },
      { day: "Mar", tokens: 22110 },
      { day: "Mer", tokens: 16780 },
      { day: "Jeu", tokens: 29640 },
      { day: "Ven", tokens: 24880 },
      { day: "Sam", tokens: 11240 },
      { day: "Dim", tokens: 14360 },
    ] as T;
  }

  throw new Error(`Route simulée non prise en charge : ${path}`);
}

export async function simulatorPost<T>(path: string, body: unknown): Promise<T> {
  await new Promise<void>((resolve) => globalThis.setTimeout(resolve, 120));
  const commandBody = (body ?? {}) as CommandBody & Record<string, unknown>;

  if (path === "/api/missions") {
    const now = Date.now();
    const id = `SIM-${now.toString(36).toUpperCase()}`;
    const objective = typeof commandBody.objective === "string" ? commandBody.objective.trim() : "Nouvelle mission Cortex";
    const constraints = typeof commandBody.constraints === "string" ? commandBody.constraints.trim() : undefined;
    const model = typeof commandBody.model === "string" ? commandBody.model : "claude-code";
    const agentId = typeof commandBody.agentId === "string" ? commandBody.agentId : "antigravity";
    const runtimeId = typeof commandBody.runtimeId === "string" ? commandBody.runtimeId : "auto";
    const agentProfiles: Record<string, { name: string; role: string }> = {
      antigravity: { name: "Antigravity", role: "Lead Engineer" },
      claude: { name: "Claude", role: "Research & Reasoning" },
      codex: { name: "Codex", role: "Implementation" },
      kimi: { name: "Kimi", role: "Context & Exploration" },
    };
    const runtimeProfiles: Record<string, { name: string; adapter: string; location: string }> = {
      auto: { name: "Routage Cortex", adapter: "Auto", location: "capacité disponible" },
      "cortex-vps": { name: "Cortex VPS", adapter: "Claude Code", location: "eu-west · Tailscale" },
      "local-worker": { name: "Worker local", adapter: "Kimi CLI", location: "Tailscale" },
    };
    const stages: OperatorStage[] = [
      { id: "understand", label: "Comprendre l'objectif", status: "pending" },
      { id: "execute", label: "Exécuter le plan", status: "pending" },
      { id: "validate", label: "Valider les preuves", status: "pending" },
    ];
    const mission = makeMission({
      id,
      objective,
      constraints,
      status: "queued",
      createdAt: now,
      updatedAt: now,
      stages,
      currentStageId: null,
      timeline: [{
        id: `${id}:created`,
        type: "plan",
        ts: now,
        title: "Mission créée",
        detail: "En attente d'une capacité d'exécution",
      }],
    });
    mission.model = model;
    if (mission.operator) {
      const agent = agentProfiles[agentId] ?? { name: "Antigravity", role: "Lead Engineer" };
      const runtime = runtimeProfiles[runtimeId] ?? { name: "Routage Cortex", adapter: "Auto", location: "capacité disponible" };
      mission.operator.run.agent = {
        id: `agent:${agentId}`,
        name: agent.name,
        role: agent.role,
        status: "working",
      };
      mission.operator.run.runtime = {
        id: `runtime:${runtimeId}`,
        name: runtime.name,
        adapter: runtime.adapter,
        location: runtime.location,
        status: "online",
      };
      mission.operator.run.model = {
        id: `model:${model}`,
        name: model,
        provider: model.includes("claude") ? "Anthropic" : "OpenAI",
      };
    }
    commit({
      ...snapshot,
      missions: [mission, ...snapshot.missions],
      updatedAt: now,
    });
    advanceCreatedMission(id);
    return mission as T;
  }

  const match = path.match(/^\/api\/missions\/([^/]+)\/(cancel|decision|commands)$/);
  if (!match) throw new Error(`Commande simulée non prise en charge : ${path}`);
  const missionId = decodeURIComponent(match[1] ?? "");
  const endpoint = match[2];
  const mission = snapshot.missions.find((item) => item.id === missionId);
  if (!mission) throw new Error("Mission simulée introuvable");

  const command: OperatorCommand = endpoint === "cancel"
    ? "cancel"
    : endpoint === "decision"
      ? commandBody.decision === "reject" ? "reject" : "approve"
      : commandBody.command ?? "instruction";

  const nextMission = applyOperatorCommand(mission, command, commandBody);
  if (command === "retry") {
    commit({
      ...snapshot,
      missions: [nextMission, ...snapshot.missions],
      updatedAt: Date.now(),
    });
  } else {
    replaceMission(nextMission);
  }
  return nextMission as T;
}

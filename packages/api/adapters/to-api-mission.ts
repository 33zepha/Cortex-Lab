import type { MissionEntity } from "../../core/contracts/mission";
import type { DomainEventEnvelope } from "../../core/contracts/events";
import type { Evidence as DomainEvidence } from "../../core/contracts/stores";

/**
 * DTO exposé par l'API — forme volontairement identique à `Mission` (src/lib/types.ts) pour que
 * le frontend n'ait besoin d'aucun changement de type, seulement d'un changement de source de
 * données (fixtures -> fetch). Dupliqué délibérément : le domaine ne doit rien savoir du DTO API.
 */
export type ApiEvidence = {
  id: string;
  kind: "test" | "diff" | "artifact" | "log";
  title: string;
  content: string;
  timestamp: number;
};

export type ApiTimelineEvent = {
  id: string;
  type: "plan" | "step" | "file_read" | "file_modified" | "test" | "decision" | "closure" | "error";
  ts: number;
  title: string;
  detail?: string;
  children?: string[];
  evidenceId?: string;
};

export type ApiMission = {
  id: string;
  objective: string;
  constraints?: string;
  status: MissionEntity["status"];
  step: string;
  model: string;
  progress: number;
  createdAt: number;
  closedAt: number | null;
  durationMs: number;
  filesRead: string[];
  filesModified: string[];
  tests: MissionEntity["tests"];
  evidence: ApiEvidence[];
  patch?: string;
  summary?: string;
  error?: string | null;
  decisionRequired: boolean;
  decisionPrompt?: string;
  timeline: ApiTimelineEvent[];
};

function estimateProgress(mission: MissionEntity): number {
  if (mission.status === "completed") return 100;
  if (mission.status === "failed" || mission.status === "cancelled") return mission.filesModified.length > 0 ? 60 : 20;
  if (mission.status === "needs_review") return 90;
  return mission.step === "planning" ? 10 : 50; // running, sans mesure fine de progression en v0.1
}

function titleForFile(files: string[]): string {
  return files[0] ?? "Patch";
}

function toTimeline(events: DomainEventEnvelope[]): ApiTimelineEvent[] {
  const timeline: ApiTimelineEvent[] = [];
  let pendingEvidenceId: string | undefined;

  for (const event of events) {
    switch (event.type) {
      case "plan.ready": {
        const steps = (event.payload.steps as string[]) ?? [];
        timeline.push({
          id: event.id,
          type: "plan",
          ts: event.ts,
          title: "Plan formulé",
          detail: `${steps.length} étape(s) identifiée(s)`,
          children: steps,
        });
        break;
      }
      case "step.started":
        timeline.push({ id: event.id, type: "step", ts: event.ts, title: `Étape — ${event.payload.step}` });
        break;
      case "file.read":
        timeline.push({ id: event.id, type: "file_read", ts: event.ts, title: `${event.payload.path} lu` });
        break;
      case "file.modified":
        timeline.push({
          id: event.id,
          type: "file_modified",
          ts: event.ts,
          title: `${event.payload.path} modifié`,
        });
        break;
      case "test.completed":
        timeline.push({
          id: event.id,
          type: "test",
          ts: event.ts,
          title: "Tests exécutés",
          detail: `${event.payload.passed}/${event.payload.total} passants`,
        });
        break;
      case "evidence.recorded":
        pendingEvidenceId = event.payload.evidenceId as string;
        // Rattache la preuve au dernier événement file_modified/test du timeline.
        for (let i = timeline.length - 1; i >= 0; i--) {
          if (timeline[i].type === "file_modified" || timeline[i].type === "test") {
            timeline[i].evidenceId = pendingEvidenceId;
            break;
          }
        }
        break;
      case "decision.requested":
        timeline.push({
          id: event.id,
          type: "decision",
          ts: event.ts,
          title: "Décision humaine requise",
          detail: event.payload.prompt as string,
        });
        break;
      case "decision.provided":
        timeline.push({ id: event.id, type: "decision", ts: event.ts, title: "Décision fournie" });
        break;
      case "mission.cancelled":
        timeline.push({ id: event.id, type: "closure", ts: event.ts, title: "Mission annulée", detail: event.payload.reason as string });
        break;
      case "mission.closed": {
        const status = event.payload.status as string;
        timeline.push({
          id: event.id,
          type: status === "failed" ? "error" : "closure",
          ts: event.ts,
          title: status === "completed" ? "Mission clôturée" : status === "failed" ? "Mission échouée" : "Mission annulée",
          detail: (event.payload.summary as string) ?? (event.payload.error as string),
        });
        break;
      }
      default:
        break; // mission.created : implicite, pas d'entrée timeline dédiée
    }
  }
  return timeline;
}

export function toApiMission(mission: MissionEntity, events: DomainEventEnvelope[], evidence: DomainEvidence[]): ApiMission {
  const apiEvidence: ApiEvidence[] = evidence.map((e) => ({
    id: e.id,
    kind: e.type,
    title: e.type === "diff" ? titleForFile(mission.filesModified) : `${e.type}-${e.id.slice(-6)}`,
    content: e.content,
    timestamp: e.timestamp,
  }));

  const lastDiff = [...evidence].reverse().find((e) => e.type === "diff");

  return {
    id: mission.id,
    objective: mission.objective,
    constraints: mission.constraints,
    status: mission.status,
    step: mission.step,
    model: mission.model,
    progress: estimateProgress(mission),
    createdAt: mission.createdAt,
    closedAt: mission.closedAt,
    durationMs: (mission.closedAt ?? Date.now()) - mission.createdAt,
    filesRead: mission.filesRead,
    filesModified: mission.filesModified,
    tests: mission.tests,
    evidence: apiEvidence,
    patch: lastDiff?.content,
    summary: mission.summary,
    error: mission.error,
    decisionRequired: mission.decisionRequired,
    decisionPrompt: mission.decisionPrompt,
    timeline: toTimeline(events),
  };
}

import type { DomainEventEnvelope } from "./contracts/events";
import type { MissionEntity } from "./contracts/mission";

/** Reconstruit l'état d'une mission en rejouant son flux d'événements (DECISIONS.md #3). */
export function projectMission(missionId: string, events: DomainEventEnvelope[]): MissionEntity | null {
  const sorted = [...events].sort((a, b) => a.seq - b.seq);
  const created = sorted.find((e) => e.type === "mission.created");
  if (!created) return null;

  const entity: MissionEntity = {
    id: missionId,
    objective: created.payload.objective,
    constraints: created.payload.constraints,
    status: "running",
    step: "planning",
    model: created.payload.model,
    filesRead: [],
    filesModified: [],
    tests: { status: "none", passed: 0, failed: 0, total: 0 },
    error: null,
    decisionRequired: false,
    createdAt: created.ts,
    closedAt: null,
    lastSeq: created.seq,
  };

  for (const event of sorted) {
    entity.lastSeq = event.seq;
    switch (event.type) {
      case "plan.ready":
        entity.step = "execution";
        break;
      case "step.started":
        entity.step = event.payload.step;
        break;
      case "file.read":
        if (!entity.filesRead.includes(event.payload.path)) entity.filesRead.push(event.payload.path);
        break;
      case "file.modified":
        if (!entity.filesModified.includes(event.payload.path)) entity.filesModified.push(event.payload.path);
        break;
      case "test.completed":
        entity.tests = event.payload as typeof entity.tests;
        break;
      case "decision.requested":
        entity.decisionRequired = true;
        entity.decisionPrompt = event.payload.prompt;
        entity.status = "needs_review";
        break;
      case "decision.provided":
        entity.decisionRequired = false;
        entity.decisionPrompt = undefined;
        entity.status = "running";
        break;
      case "mission.cancelled":
        entity.status = "cancelled";
        entity.closedAt = event.ts;
        break;
      case "mission.closed":
        entity.status = event.payload.status;
        entity.summary = event.payload.summary;
        entity.error = event.payload.error ?? null;
        entity.closedAt = event.ts;
        entity.tokensUsed = event.payload.tokensUsed;
        break;
    }
  }

  return entity;
}

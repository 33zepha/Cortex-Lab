import { z } from "zod";

/**
 * Enveloppe stable pour tous les événements (ARCHITECTURE.md).
 * `seq` est monotone par mission — c'est le curseur de rejeu, reprise et SSE.
 */
export const DomainEventEnvelope = z.object({
  id: z.string(), // ULID
  missionId: z.string(),
  seq: z.number().int().nonnegative(),
  type: z.string(),
  v: z.string(),
  ts: z.number().int().nonnegative(),
  actor: z.enum(["api", "runner", "policy", "system"]),
  payload: z.record(z.string(), z.any()),
});

export type DomainEventEnvelope = z.infer<typeof DomainEventEnvelope>;

// ---- Payloads par type d'événement, chacun versionné individuellement ----

export const MissionCreatedPayloadV1 = z.object({
  objective: z.string(),
  constraints: z.string().optional(),
  model: z.string(),
});

export const PlanReadyPayloadV1 = z.object({
  steps: z.array(z.string()),
});

export const StepStartedPayloadV1 = z.object({
  step: z.string(),
});

export const FileReadPayloadV1 = z.object({
  path: z.string(),
});

export const FileModifiedPayloadV1 = z.object({
  path: z.string(),
  diffSummary: z.string().optional(),
});

export const TestCompletedPayloadV1 = z.object({
  status: z.enum(["passing", "failing", "none"]),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const EvidenceRecordedPayloadV1 = z.object({
  evidenceId: z.string(),
  kind: z.enum(["test", "diff", "artifact", "log"]),
});

export const DecisionRequestedPayloadV1 = z.object({
  prompt: z.string(),
});

export const DecisionProvidedPayloadV1 = z.object({
  decision: z.string(),
});

export const MissionCancelledPayloadV1 = z.object({
  reason: z.string().optional(),
});

export const MissionClosedPayloadV1 = z.object({
  status: z.enum(["completed", "failed", "cancelled"]),
  summary: z.string().optional(),
  error: z.string().optional(),
  tokensUsed: z.number().int().nonnegative().optional(), // champ optionnel = compatible ascendant (DECISIONS.md #4)
});

/** Table de dispatch : type d'événement -> schéma de payload actif (v1). */
export const EVENT_PAYLOAD_SCHEMAS = {
  "mission.created": MissionCreatedPayloadV1,
  "plan.ready": PlanReadyPayloadV1,
  "step.started": StepStartedPayloadV1,
  "file.read": FileReadPayloadV1,
  "file.modified": FileModifiedPayloadV1,
  "test.completed": TestCompletedPayloadV1,
  "evidence.recorded": EvidenceRecordedPayloadV1,
  "decision.requested": DecisionRequestedPayloadV1,
  "decision.provided": DecisionProvidedPayloadV1,
  "mission.cancelled": MissionCancelledPayloadV1,
  "mission.closed": MissionClosedPayloadV1,
} as const;

export type EventType = keyof typeof EVENT_PAYLOAD_SCHEMAS;

/** Valide l'enveloppe ET le payload contre le schéma de son type déclaré. */
export function parseDomainEvent(raw: unknown): DomainEventEnvelope {
  const envelope = DomainEventEnvelope.parse(raw);
  const payloadSchema = EVENT_PAYLOAD_SCHEMAS[envelope.type as EventType];
  if (!payloadSchema) {
    throw new Error(`Type d'événement inconnu: ${envelope.type}`);
  }
  payloadSchema.parse(envelope.payload);
  return envelope;
}

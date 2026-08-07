import { z } from "zod";
import { MissionPlan } from "./mission-plan";

/** Enveloppe stable pour tous les événements. `seq` est monotone par mission. */
export const DomainEventEnvelope = z.object({
  id: z.string(),
  missionId: z.string(),
  seq: z.number().int().nonnegative(),
  type: z.string(),
  v: z.string(),
  ts: z.number().int().nonnegative(),
  actor: z.enum(["api", "runner", "policy", "system"]),
  payload: z.record(z.string(), z.any()),
});

export type DomainEventEnvelope = z.infer<typeof DomainEventEnvelope>;

export const MissionCreatedPayloadV1 = z.object({
  objective: z.string(),
  constraints: z.string().optional(),
  model: z.string(),
});

/** `steps` reste présent pour compatibilité UI; `plan` est la source typée v2. */
export const PlanReadyPayloadV1 = z.object({
  steps: z.array(z.string()),
  plan: MissionPlan.optional(),
});

export const StepStartedPayloadV1 = z.object({
  step: z.string(),
  taskId: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  acceptanceCriteria: z.array(z.string()).optional(),
  risk: z.enum(["low", "medium", "high"]).optional(),
  preferredCapabilities: z.array(z.string()).optional(),
  index: z.number().int().nonnegative().optional(),
  total: z.number().int().positive().optional(),
});

export const FileReadPayloadV1 = z.object({ path: z.string() });
export const FileModifiedPayloadV1 = z.object({ path: z.string(), diffSummary: z.string().optional() });
export const TestCompletedPayloadV1 = z.object({
  status: z.enum(["passing", "failing", "none"]),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export const EvidenceRecordedPayloadV1 = z.object({ evidenceId: z.string(), kind: z.enum(["test", "diff", "artifact", "log"]) });
export const DecisionRequestedPayloadV1 = z.object({ prompt: z.string() });
export const DecisionProvidedPayloadV1 = z.object({ decision: z.string() });
export const MissionCancelledPayloadV1 = z.object({ reason: z.string().optional() });
export const MissionClosedPayloadV1 = z.object({
  status: z.enum(["completed", "failed", "cancelled"]),
  summary: z.string().optional(),
  error: z.string().optional(),
  tokensUsed: z.number().int().nonnegative().optional(),
});

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

export function parseDomainEvent(raw: unknown): DomainEventEnvelope {
  const envelope = DomainEventEnvelope.parse(raw);
  const payloadSchema = EVENT_PAYLOAD_SCHEMAS[envelope.type as EventType];
  if (!payloadSchema) throw new Error(`Type d'événement inconnu: ${envelope.type}`);
  payloadSchema.parse(envelope.payload);
  return envelope;
}

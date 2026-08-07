import { z } from "zod";

export const MissionStatus = z.enum(["running", "needs_review", "completed", "failed", "cancelled"]);
export type MissionStatus = z.infer<typeof MissionStatus>;

export const TestsSummary = z.object({
  status: z.enum(["passing", "failing", "none"]),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

/** Projection de l'état de mission — dérivée du ledger, jamais écrite directement (DECISIONS.md #3). */
export const MissionEntity = z.object({
  id: z.string(), // ULID
  objective: z.string(),
  constraints: z.string().optional(),
  status: MissionStatus,
  step: z.string(),
  model: z.string(),
  filesRead: z.array(z.string()),
  filesModified: z.array(z.string()),
  tests: TestsSummary,
  patch: z.string().optional(),
  summary: z.string().optional(),
  error: z.string().nullable().default(null),
  decisionRequired: z.boolean(),
  decisionPrompt: z.string().optional(),
  createdAt: z.number().int().nonnegative(),
  closedAt: z.number().int().nonnegative().nullable(),
  tokensUsed: z.number().int().nonnegative().optional(),
  lastSeq: z.number().int().nonnegative(), // dernier seq appliqué à cette projection
});

export type MissionEntity = z.infer<typeof MissionEntity>;

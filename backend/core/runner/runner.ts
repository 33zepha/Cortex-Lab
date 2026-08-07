import path from "node:path";
import { ulid } from "ulid";
import type { EventStore, MissionRepository, EvidenceStore } from "../contracts/stores";
import type { ModelAdapter, ModelResult, RunnerTask } from "../contracts/model-adapter";
import type { Planner } from "../contracts/planner";
import type { Policy } from "../contracts/policy";
import type { DomainEventEnvelope } from "../contracts/events";
import type { MissionEntity } from "../contracts/mission";
import { WorkspaceManager, gitDiff } from "../workspace/workspace-manager";
import { projectMission } from "../mission-projection";

export type RunMissionInput = {
  missionId?: string;
  objective: string;
  constraints?: string;
  model: string;
  sourceRoot: string;
  signal?: AbortSignal;
};

export type RunnerDeps = {
  eventStore: EventStore;
  missionRepository: MissionRepository;
  evidenceStore: EvidenceStore;
  modelAdapter: ModelAdapter;
  workspaceManager: WorkspaceManager;
  planner: Planner;
  policy: Policy;
};

function makeEvent(missionId: string, type: string, payload: Record<string, unknown>): DomainEventEnvelope {
  return { id: ulid(), missionId, seq: 0, type, v: "1.0.0", ts: Date.now(), actor: "runner", payload };
}

export async function runMission(input: RunMissionInput, deps: RunnerDeps): Promise<MissionEntity> {
  const missionId = input.missionId ?? ulid();
  const { eventStore, missionRepository, evidenceStore, modelAdapter, workspaceManager, planner, policy } = deps;

  await eventStore.append(makeEvent(missionId, "mission.created", {
    objective: input.objective,
    constraints: input.constraints,
    model: input.model,
  }));
  await persistProjection(missionId, eventStore, missionRepository);

  let steps: string[];
  try {
    throwIfAborted(input.signal);
    steps = await planner.plan(input.objective, input.constraints);
    if (steps.length === 0) throw new Error("Le planificateur a retourné un plan vide");
  } catch (err) {
    const cancelled = isAbort(err, input.signal);
    await eventStore.append(makeEvent(
      missionId,
      cancelled ? "mission.cancelled" : "mission.closed",
      cancelled ? { reason: "Annulée avant exécution" } : { status: "failed", error: `Planificateur indisponible — ${messageOf(err)}` },
    ));
    return finalize(missionId, eventStore, missionRepository);
  }

  await eventStore.append(makeEvent(missionId, "plan.ready", { steps }));
  await persistProjection(missionId, eventStore, missionRepository);

  const workspace = await workspaceManager.create(missionId, input.sourceRoot);
  let totalTokens = 0;
  const outputs: string[] = [];

  try {
    const health = await modelAdapter.health();
    if (!health.available) {
      await eventStore.append(makeEvent(missionId, "mission.closed", {
        status: "failed",
        error: "Model adapter indisponible — aucun fallback silencieux",
      }));
      return finalize(missionId, eventStore, missionRepository);
    }

    for (let index = 0; index < steps.length; index++) {
      throwIfAborted(input.signal);
      const step = steps[index];
      await eventStore.append(makeEvent(missionId, "step.started", { step, index, total: steps.length }));
      await persistProjection(missionId, eventStore, missionRepository);

      const task: RunnerTask = {
        missionId,
        step,
        objective: input.objective,
        context: outputs.join("\n\n"),
        constraints: input.constraints ?? "",
        signal: input.signal,
        workspace: { root: workspace.root, readOnly: [] },
      };

      const estimated = modelAdapter.estimateTokens(task);
      const tokenBudget = policy.tokenBudgetFor(missionId);
      if (totalTokens + estimated > tokenBudget) {
        await closeFailed(missionId, eventStore, `Budget tokens dépassé avant l'étape ${index + 1}/${steps.length}`, totalTokens);
        return finalize(missionId, eventStore, missionRepository);
      }

      const result = await withTimeout(
        modelAdapter.execute(task),
        policy.timeoutSecondsFor(missionId) * 1000,
        `Timeout sur l'étape ${index + 1}/${steps.length}`,
        input.signal,
      );
      totalTokens += result.metadata.tokensUsed;

      if (input.signal?.aborted || result.error === "Mission annulée") {
        await eventStore.append(makeEvent(missionId, "mission.cancelled", { reason: "Annulée pendant l'exécution" }));
        return finalize(missionId, eventStore, missionRepository);
      }

      const unauthorized = unauthorizedFiles(result, workspace.root, policy, missionId);
      if (unauthorized.length > 0) {
        await closeFailed(missionId, eventStore, `Policy violation: modification interdite (${unauthorized.join(", ")})`, totalTokens);
        return finalize(missionId, eventStore, missionRepository);
      }

      for (const file of result.filesModified) {
        await eventStore.append(makeEvent(missionId, "file.modified", { path: relativeFile(workspace.root, file), step }));
      }

      if (!result.success) {
        await closeFailed(missionId, eventStore, result.error ?? `Échec de l'étape ${index + 1}`, totalTokens);
        return finalize(missionId, eventStore, missionRepository);
      }

      outputs.push(`Étape ${index + 1}: ${step}\n${result.output}`);
      await persistProjection(missionId, eventStore, missionRepository);
    }

    const patch = gitDiff(workspace.root);
    await evidenceStore.record(missionId, "diff", patch);
    const evidences = await evidenceStore.list(missionId);
    const lastEvidence = evidences.at(-1);
    if (lastEvidence) {
      await eventStore.append(makeEvent(missionId, "evidence.recorded", { evidenceId: lastEvidence.id, kind: "diff" }));
    }

    await eventStore.append(makeEvent(missionId, "mission.closed", {
      status: "completed",
      summary: outputs.at(-1)?.slice(0, 500) ?? "Mission terminée",
      tokensUsed: totalTokens,
    }));
  } catch (err) {
    if (isAbort(err, input.signal)) {
      await eventStore.append(makeEvent(missionId, "mission.cancelled", { reason: "Annulée par l'utilisateur" }));
    } else {
      await closeFailed(missionId, eventStore, messageOf(err), totalTokens);
    }
  } finally {
    await workspaceManager.cleanup(workspace);
  }

  return finalize(missionId, eventStore, missionRepository);
}

function unauthorizedFiles(result: ModelResult, workspaceRoot: string, policy: Policy, missionId: string): string[] {
  return result.filesModified
    .map((file) => relativeFile(workspaceRoot, file))
    .filter((target) => !policy.authorize({ actor: "mission", action: "write_file", target, missionId }));
}

function relativeFile(workspaceRoot: string, file: string): string {
  if (!path.isAbsolute(file)) return file.replaceAll("\\", "/");
  return path.relative(workspaceRoot, file).replaceAll("\\", "/");
}

async function closeFailed(missionId: string, eventStore: EventStore, error: string, tokensUsed: number): Promise<void> {
  await eventStore.append(makeEvent(missionId, "mission.closed", { status: "failed", error, tokensUsed }));
}

async function persistProjection(missionId: string, eventStore: EventStore, missionRepository: MissionRepository): Promise<MissionEntity> {
  const events = await eventStore.readAll(missionId);
  const projected = projectMission(missionId, events)!;
  const existing = await missionRepository.findById(missionId);
  if (existing) await missionRepository.update(projected);
  else await missionRepository.create(projected);
  return projected;
}

async function finalize(missionId: string, eventStore: EventStore, missionRepository: MissionRepository): Promise<MissionEntity> {
  return persistProjection(missionId, eventStore, missionRepository);
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const error = new Error("Mission annulée");
  error.name = "AbortError";
  throw error;
}

function isAbort(err: unknown, signal?: AbortSignal): boolean {
  return signal?.aborted === true || (err instanceof Error && err.name === "AbortError");
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string, signal?: AbortSignal): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  let onAbort: (() => void) | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), timeoutMs); });
  const aborted = new Promise<never>((_, reject) => {
    if (!signal) return;
    onAbort = () => {
      const error = new Error("Mission annulée");
      error.name = "AbortError";
      reject(error);
    };
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  });

  try {
    return await Promise.race([promise, timeout, aborted]);
  } finally {
    if (timer) clearTimeout(timer);
    if (signal && onAbort) signal.removeEventListener("abort", onAbort);
  }
}

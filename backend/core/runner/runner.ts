import { ulid } from "ulid";
import type { EventStore, MissionRepository, EvidenceStore } from "../contracts/stores";
import type { ModelAdapter } from "../contracts/model-adapter";
import type { Planner } from "../contracts/planner";
import type { DomainEventEnvelope } from "../contracts/events";
import type { MissionEntity } from "../contracts/mission";
import { WorkspaceManager, gitDiff } from "../workspace/workspace-manager";
import { projectMission } from "../mission-projection";

export type RunMissionInput = {
  objective: string;
  constraints?: string;
  model: string;
  sourceRoot: string;
};

export type RunnerDeps = {
  eventStore: EventStore;
  missionRepository: MissionRepository;
  evidenceStore: EvidenceStore;
  modelAdapter: ModelAdapter;
  workspaceManager: WorkspaceManager;
  planner: Planner;
};

function makeEvent(missionId: string, type: string, payload: Record<string, unknown>): DomainEventEnvelope {
  return { id: ulid(), missionId, seq: 0, type, v: "1.0.0", ts: Date.now(), actor: "runner", payload };
}

/**
 * Orchestration d'un cycle de mission complet (ARCHITECTURE.md § flux de données) :
 * mission.created -> plan.ready -> step.started -> exécution -> file.modified* ->
 * evidence.recorded -> mission.closed. Aucun fallback silencieux (DECISIONS.md #8).
 */
export async function runMission(input: RunMissionInput, deps: RunnerDeps): Promise<MissionEntity> {
  const missionId = ulid();
  const { eventStore, missionRepository, evidenceStore, modelAdapter, workspaceManager, planner } = deps;

  await eventStore.append(
    makeEvent(missionId, "mission.created", {
      objective: input.objective,
      constraints: input.constraints,
      model: input.model,
    }),
  );

  let steps: string[];
  try {
    steps = await planner.plan(input.objective, input.constraints);
  } catch (err) {
    await eventStore.append(
      makeEvent(missionId, "mission.closed", {
        status: "failed",
        error: `Planificateur indisponible — ${err instanceof Error ? err.message : String(err)}`,
      }),
    );
    return finalize(missionId, eventStore, missionRepository);
  }

  await eventStore.append(makeEvent(missionId, "plan.ready", { steps }));
  await eventStore.append(makeEvent(missionId, "step.started", { step: "execution" }));

  const workspace = await workspaceManager.create(missionId, input.sourceRoot);

  try {
    const health = await modelAdapter.health();
    if (!health.available) {
      await eventStore.append(
        makeEvent(missionId, "mission.closed", {
          status: "failed",
          error: "Model adapter indisponible — aucun fallback silencieux",
        }),
      );
      return finalize(missionId, eventStore, missionRepository);
    }

    const result = await modelAdapter.execute({
      missionId,
      step: "execution",
      objective: input.objective,
      context: "",
      constraints: input.constraints ?? "",
      workspace: { root: workspace.root, readOnly: [] },
    });

    for (const file of result.filesModified) {
      await eventStore.append(makeEvent(missionId, "file.modified", { path: file }));
    }

    if (result.success) {
      const patch = gitDiff(workspace.root);
      await evidenceStore.record(missionId, "diff", patch);
      const evidences = await evidenceStore.list(missionId);
      const lastEvidence = evidences.at(-1)!;
      await eventStore.append(
        makeEvent(missionId, "evidence.recorded", { evidenceId: lastEvidence.id, kind: "diff" }),
      );
      await eventStore.append(
        makeEvent(missionId, "mission.closed", {
          status: "completed",
          summary: result.output.slice(0, 500),
          tokensUsed: result.metadata.tokensUsed,
        }),
      );
    } else {
      await eventStore.append(
        makeEvent(missionId, "mission.closed", {
          status: "failed",
          error: result.error ?? "Échec inconnu",
          tokensUsed: result.metadata.tokensUsed,
        }),
      );
    }
  } finally {
    await workspaceManager.cleanup(workspace);
  }

  return finalize(missionId, eventStore, missionRepository);
}

async function finalize(
  missionId: string,
  eventStore: EventStore,
  missionRepository: MissionRepository,
): Promise<MissionEntity> {
  const events = await eventStore.readAll(missionId);
  const projected = projectMission(missionId, events)!;
  await missionRepository.create(projected);
  return projected;
}

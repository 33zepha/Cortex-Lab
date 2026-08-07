import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { NdjsonEventStore } from "../stores/event-store";
import { FileMissionRepository } from "../stores/mission-repository";
import { FileEvidenceStore } from "../stores/evidence-store";
import { WorkspaceManager } from "../workspace/workspace-manager";
import { SimplePolicy } from "../policy/policy";
import { runMission } from "../runner/runner";
import type { ModelAdapter, ModelResult, RunnerTask } from "../contracts/model-adapter";
import type { Planner } from "../contracts/planner";

let tmpDir: string;
let sourceRoot: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cortex-runner-test-"));
  sourceRoot = path.join(tmpDir, "source");
  await fs.mkdir(sourceRoot, { recursive: true });
  await fs.writeFile(path.join(sourceRoot, "README.md"), "# fixture\n", "utf8");
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

function deps(adapter: ModelAdapter, planner: Planner) {
  return {
    eventStore: new NdjsonEventStore(path.join(tmpDir, "ledger", "events.ndjson")),
    missionRepository: new FileMissionRepository(path.join(tmpDir, "missions")),
    evidenceStore: new FileEvidenceStore(path.join(tmpDir, "evidence")),
    workspaceManager: new WorkspaceManager(path.join(tmpDir, "workspaces")),
    modelAdapter: adapter,
    planner,
    policy: new SimplePolicy({ tokenBudget: 10_000, timeoutSeconds: 2, allowedPathPrefixes: [""], allowedCommands: [] }),
  };
}

describe("runMission", () => {
  it("exécute chaque étape du planner et transmet le contexte entre étapes", async () => {
    const calls: RunnerTask[] = [];
    const adapter: ModelAdapter = {
      version: "1.0.0",
      health: async () => ({ available: true }),
      estimateTokens: () => 10,
      execute: async (task): Promise<ModelResult> => {
        calls.push(task);
        return { success: true, output: `done:${task.step}`, filesModified: [], filesRead: [], metadata: { tokensUsed: 20, duration: 1 } };
      },
    };
    const planner: Planner = { version: "1.0.0", plan: async () => ["inspect", "implement"] };
    const d = deps(adapter, planner);

    const mission = await runMission({ objective: "Modifier proprement le projet de test", model: "fake", sourceRoot }, d);

    expect(mission.status).toBe("completed");
    expect(calls).toHaveLength(2);
    expect(calls[0].step).toBe("inspect");
    expect(calls[1].step).toBe("implement");
    expect(calls[1].context).toContain("done:inspect");
    expect(mission.tokensUsed).toBe(40);
  });

  it("annule réellement l'adapter via AbortSignal et ne clôture pas la mission deux fois", async () => {
    const controller = new AbortController();
    let adapterSawAbort = false;
    let markAdapterStarted!: () => void;
    const adapterStarted = new Promise<void>((resolve) => {
      markAdapterStarted = resolve;
    });
    const adapter: ModelAdapter = {
      version: "1.0.0",
      health: async () => ({ available: true }),
      estimateTokens: () => 10,
      execute: async (task) => new Promise<ModelResult>((resolve) => {
        const cancel = () => {
          adapterSawAbort = true;
          resolve({ success: false, output: "", filesModified: [], filesRead: [], error: "Mission annulée", metadata: { tokensUsed: 0, duration: 1 } });
        };
        if (task.signal?.aborted) {
          cancel();
          return;
        }
        task.signal?.addEventListener("abort", cancel, { once: true });
        markAdapterStarted();
      }),
    };
    const planner: Planner = { version: "1.0.0", plan: async () => ["long-step"] };
    const d = deps(adapter, planner);

    const missionPromise = runMission({ objective: "Exécuter une mission annulable de test", model: "fake", sourceRoot, signal: controller.signal }, d);
    await adapterStarted;
    controller.abort();
    const mission = await missionPromise;
    const events = await d.eventStore.readAll(mission.id);

    expect(adapterSawAbort).toBe(true);
    expect(mission.status).toBe("cancelled");
    expect(events.filter((event) => event.type === "mission.cancelled")).toHaveLength(1);
    expect(events.filter((event) => event.type === "mission.closed")).toHaveLength(0);
  });

  it("n'émet file.modified que lorsque le contenu change réellement entre deux étapes", async () => {
    const adapter: ModelAdapter = {
      version: "1.0.0",
      health: async () => ({ available: true }),
      estimateTokens: () => 10,
      execute: async (task): Promise<ModelResult> => {
        if (task.step === "write") {
          await fs.writeFile(path.join(task.workspace.root, "hello.txt"), "hello\n", "utf8");
          return {
            success: true,
            output: "written",
            filesModified: ["hello.txt"],
            filesRead: ["README.md"],
            metadata: { tokensUsed: 20, duration: 1 },
          };
        }
        return {
          success: true,
          output: "verified",
          filesModified: ["hello.txt"],
          filesRead: ["hello.txt"],
          metadata: { tokensUsed: 20, duration: 1 },
        };
      },
    };
    const planner: Planner = { version: "1.0.0", plan: async () => ["write", "verify"] };
    const d = deps(adapter, planner);

    const mission = await runMission({ objective: "Écrire puis vérifier un fichier de test", model: "fake", sourceRoot }, d);
    const events = await d.eventStore.readAll(mission.id);
    const modified = events.filter((event) => event.type === "file.modified");
    const reads = events.filter((event) => event.type === "file.read");

    expect(mission.status).toBe("completed");
    expect(modified).toHaveLength(1);
    expect(modified[0].payload.path).toBe("hello.txt");
    expect(reads).toHaveLength(2);
  });

  it("bloque une écriture sensible signalée par l'adapter", async () => {
    const adapter: ModelAdapter = {
      version: "1.0.0",
      health: async () => ({ available: true }),
      estimateTokens: () => 10,
      execute: async () => ({
        success: true,
        output: "attempted",
        filesModified: [".env"],
        filesRead: [],
        metadata: { tokensUsed: 20, duration: 1 },
      }),
    };
    const planner: Planner = { version: "1.0.0", plan: async () => ["modify"] };
    const d = deps(adapter, planner);

    const mission = await runMission({ objective: "Tester une modification interdite par policy", model: "fake", sourceRoot }, d);

    expect(mission.status).toBe("failed");
    expect(mission.error).toContain("Policy violation");
  });
});

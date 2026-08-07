import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { ulid } from "ulid";
import { NdjsonEventStore } from "../stores/event-store";
import { FileMissionRepository } from "../stores/mission-repository";
import { FileEvidenceStore } from "../stores/evidence-store";
import { SimplePolicy } from "../policy/policy";
import { FakeModelAdapter } from "../adapters/fake-model-adapter";
import { projectMission } from "../mission-projection";
import type { DomainEventEnvelope } from "../contracts/events";

let tmpDir: string;
let ledgerPath: string;
let missionsDir: string;
let evidenceDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cortex-core-test-"));
  ledgerPath = path.join(tmpDir, "ledger", "events.ndjson");
  missionsDir = path.join(tmpDir, "missions");
  evidenceDir = path.join(tmpDir, "evidence");
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

/** Fabrique un événement prêt à append — le `seq` fourni est un placeholder, le store l'assigne réellement. */
function event(missionId: string, type: string, payload: Record<string, unknown>): DomainEventEnvelope {
  return {
    id: ulid(),
    missionId,
    seq: 0,
    type,
    v: "1.0.0",
    ts: Date.now(),
    actor: "system",
    payload,
  };
}

describe("Cycle de vie complet d'une mission (fake adapter)", () => {
  it("create -> plan -> steps -> evidence -> close, seq monotone, projection correcte", async () => {
    const eventStore = new NdjsonEventStore(ledgerPath);
    const missionRepo = new FileMissionRepository(missionsDir);
    const evidenceStore = new FileEvidenceStore(evidenceDir);
    const adapter = new FakeModelAdapter();
    const missionId = ulid();

    const { seq: seq0 } = await eventStore.append(
      event(missionId, "mission.created", { objective: "Ajouter la pagination cursor-based", model: "claude-code" }),
    );
    const { seq: seq1 } = await eventStore.append(event(missionId, "plan.ready", { steps: ["lire le schéma", "implémenter"] }));
    const { seq: seq2 } = await eventStore.append(event(missionId, "step.started", { step: "execution" }));

    const health = await adapter.health();
    expect(health.available).toBe(true);

    const result = await adapter.execute({
      missionId,
      step: "execution",
      objective: "Ajouter la pagination cursor-based",
      context: "",
      constraints: "",
      workspace: { root: "/workspace", readOnly: [] },
    });
    expect(result.success).toBe(true);

    const { seq: seq3 } = await eventStore.append(event(missionId, "file.read", { path: result.filesRead[0] }));
    const { seq: seq4 } = await eventStore.append(event(missionId, "file.modified", { path: result.filesModified[0] }));
    const { seq: seq5 } = await eventStore.append(
      event(missionId, "test.completed", { status: "passing", passed: 3, failed: 0, total: 3 }),
    );

    await evidenceStore.record(missionId, "diff", { path: result.filesModified[0], patch: "+ added pagination cursor" });
    const evidences = await evidenceStore.list(missionId);
    expect(evidences).toHaveLength(1);
    expect(evidences[0].type).toBe("diff");

    const { seq: seq6 } = await eventStore.append(
      event(missionId, "evidence.recorded", { evidenceId: evidences[0].id, kind: "diff" }),
    );
    const { seq: seq7 } = await eventStore.append(
      event(missionId, "mission.closed", { status: "completed", summary: "Pagination ajoutée avec succès" }),
    );

    // seq strictement monotone, sans trou, à partir de 0
    const seqs = [seq0, seq1, seq2, seq3, seq4, seq5, seq6, seq7];
    expect(seqs).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);

    const allEvents = await eventStore.readAll(missionId);
    expect(allEvents.map((e) => e.seq)).toEqual(seqs);

    const projected = projectMission(missionId, allEvents);
    expect(projected).not.toBeNull();
    expect(projected!.status).toBe("completed");
    expect(projected!.summary).toBe("Pagination ajoutée avec succès");
    expect(projected!.filesRead).toContain(result.filesRead[0]);
    expect(projected!.filesModified).toContain(result.filesModified[0]);
    expect(projected!.tests).toEqual({ status: "passing", passed: 3, failed: 0, total: 3 });
    expect(projected!.lastSeq).toBe(7);

    await missionRepo.create(projected!);
    const fetched = await missionRepo.findById(missionId);
    expect(fetched).toEqual(projected);
  });

  it("rejeu via readSince(seq) reprend exactement où le curseur s'arrête", async () => {
    const eventStore = new NdjsonEventStore(ledgerPath);
    const missionId = ulid();
    await eventStore.append(event(missionId, "mission.created", { objective: "x", model: "claude-code" }));
    await eventStore.append(event(missionId, "plan.ready", { steps: ["a"] }));
    await eventStore.append(event(missionId, "step.started", { step: "execution" }));

    const since: DomainEventEnvelope[] = [];
    for await (const e of eventStore.readSince(missionId, 1)) since.push(e);

    expect(since.map((e) => e.seq)).toEqual([1, 2]);
  });

  it("policy applique réellement le budget et l'autorisation de chemins", () => {
    const policy = new SimplePolicy({
      tokenBudget: 50_000,
      timeoutSeconds: 600,
      allowedPathPrefixes: ["/workspace/"],
      allowedCommands: ["npm test"],
    });

    expect(policy.tokenBudgetFor("any-mission")).toBe(50_000);
    expect(policy.timeoutSecondsFor("any-mission")).toBe(600);
    expect(
      policy.authorize({ actor: "mission", action: "write_file", target: "/workspace/src/index.ts", missionId: "m1" }),
    ).toBe(true);
    expect(
      policy.authorize({ actor: "mission", action: "write_file", target: "/etc/passwd", missionId: "m1" }),
    ).toBe(false);
    expect(
      policy.authorize({ actor: "mission", action: "execute_command", target: "rm -rf /", missionId: "m1" }),
    ).toBe(false);
  });

  it("ledger résiste à une interruption simulée (ligne corrompue ignorée, pas de crash)", async () => {
    const eventStore = new NdjsonEventStore(ledgerPath);
    const missionId = ulid();
    await eventStore.append(event(missionId, "mission.created", { objective: "x", model: "claude-code" }));
    await eventStore.append(event(missionId, "plan.ready", { steps: ["a"] }));

    // Simule une écriture interrompue en fin de fichier (ligne JSON tronquée)
    await fs.appendFile(ledgerPath, '{"id":"broken", "missionId":"' + missionId + '", "seq":2, incomplete\n', "utf8");

    const freshStore = new NdjsonEventStore(ledgerPath); // seqCache vide : force une relecture disque
    const events = await freshStore.readAll(missionId);
    expect(events).toHaveLength(2); // la ligne corrompue est ignorée, pas de throw

    // Le store peut continuer à écrire après une ligne corrompue
    await freshStore.append(event(missionId, "step.started", { step: "execution" }));
    const afterRecovery = await freshStore.readAll(missionId);
    expect(afterRecovery).toHaveLength(3);
    expect(afterRecovery.at(-1)!.seq).toBe(2);
  });

  it("redaction des secrets dans l'evidence store", async () => {
    const evidenceStore = new FileEvidenceStore(evidenceDir);
    const missionId = ulid();
    await evidenceStore.record(missionId, "log", {
      message: "Appel API",
      apiKey: "sk-abcdefghijklmnopqrstuvwxyz1234567890",
    });
    const [ev] = await evidenceStore.list(missionId);
    expect(ev.content).not.toContain("sk-abcdefghijklmnopqrstuvwxyz1234567890");
    expect(ev.content).toContain("[REDACTED_KEY]");
  });
});

/**
 * Exécute une mission réelle de bout en bout, persistée dans le vrai data/ du repo.
 * Travaille sur un fixture jetable, jamais sur Cortex-Lab lui-même.
 * Usage: npm run mission:run
 */
import { config } from "dotenv";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { NdjsonEventStore } from "../core/stores/event-store";
import { FileMissionRepository } from "../core/stores/mission-repository";
import { FileEvidenceStore } from "../core/stores/evidence-store";
import { WorkspaceManager } from "../core/workspace/workspace-manager";
import { ClaudeCodeAdapter } from "../core/adapters/claude-code-adapter";
import { loadVpsConfigFromEnv } from "../core/infra/vps-config";
import { OpenAiPlanner } from "../core/planner/openai-planner";
import { SimplePolicy } from "../core/policy/policy";
import { runMission } from "../core/runner/runner";

config();

async function main() {
  const dataDir = path.join(process.cwd(), "data");
  const fixtureSource = await fs.mkdtemp(path.join(os.tmpdir(), "cortex-mission-fixture-"));

  await fs.writeFile(path.join(fixtureSource, "README.md"), "# Fixture\n\nUn petit projet jetable pour valider le Runner Cortex.\n", "utf8");

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY manquant dans .env — le Planner en a besoin.");
    process.exit(1);
  }

  const eventStore = new NdjsonEventStore(path.join(dataDir, "ledger", "events.ndjson"));
  const missionRepository = new FileMissionRepository(path.join(dataDir, "missions"));
  const evidenceStore = new FileEvidenceStore(path.join(dataDir, "evidence"));
  const workspaceManager = new WorkspaceManager(path.join(dataDir, "workspaces"));
  const modelAdapter = new ClaudeCodeAdapter({
    vps: loadVpsConfigFromEnv(),
    remoteWorkspaceBase: "/root/cortex-workspaces",
    permissionMode: "acceptEdits",
  });
  const planner = new OpenAiPlanner(process.env.OPENAI_API_KEY);
  const policy = new SimplePolicy({
    tokenBudget: Number(process.env.CORTEX_TOKEN_BUDGET ?? 120_000),
    timeoutSeconds: Number(process.env.CORTEX_STEP_TIMEOUT_SECONDS ?? 1_800),
    allowedPathPrefixes: [""],
    allowedCommands: [],
  });

  console.log("Lancement d'une mission réelle, persistée dans data/…\n");

  const mission = await runMission(
    {
      objective: "Ajoute une section 'Usage' au README.md expliquant que c'est un fixture de test pour Cortex Runner.",
      constraints: "Un seul fichier modifié : README.md.",
      model: "claude-code",
      sourceRoot: fixtureSource,
    },
    { eventStore, missionRepository, evidenceStore, modelAdapter, workspaceManager, planner, policy },
  );

  console.log("--- Mission projetée (depuis le ledger) ---");
  console.log(JSON.stringify(mission, null, 2));

  const evidences = await evidenceStore.list(mission.id);
  console.log(`\n--- Evidence enregistrée (${evidences.length}) ---`);
  for (const ev of evidences) {
    console.log(`[${ev.type}] ${ev.id}`);
    console.log(ev.content);
  }

  console.log(`\n✓ Terminé. Inspecte data/ledger/events.ndjson et data/missions/${mission.id}.json.`);
  await fs.rm(fixtureSource, { recursive: true, force: true });
}

main().catch((err) => {
  console.error("✗ Mission échouée:", err instanceof Error ? err.message : err);
  process.exit(1);
});

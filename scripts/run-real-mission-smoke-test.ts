/**
 * Smoke-test du pipeline réel (Phase 3) : WorkspaceManager -> ClaudeCodeAdapter -> diff -> cleanup.
 * Travaille sur un fixture jetable dans un dossier temporaire — ne touche JAMAIS au repo Cortex-Lab
 * lui-même (DECISIONS.md #7 : la mission ne modifie jamais le projet source).
 *
 * Usage: npm run mission:smoke-test
 */
import { config } from "dotenv";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { ulid } from "ulid";
import { WorkspaceManager, gitDiff } from "../packages/core/workspace/workspace-manager";
import { ClaudeCodeAdapter } from "../packages/core/adapters/claude-code-adapter";
import { loadVpsConfigFromEnv } from "../packages/core/infra/vps-config";

config();

async function main() {
  const missionId = ulid();
  const fixtureSource = await fs.mkdtemp(path.join(os.tmpdir(), "cortex-smoke-fixture-"));
  const localWorkspacesBase = await fs.mkdtemp(path.join(os.tmpdir(), "cortex-smoke-workspaces-"));

  await fs.writeFile(
    path.join(fixtureSource, "hello.txt"),
    "function hello() {\n  return 'hello world';\n}\n",
    "utf8",
  );

  console.log(`Mission ${missionId} — fixture: ${fixtureSource}`);

  const workspaceManager = new WorkspaceManager(localWorkspacesBase);
  const workspace = await workspaceManager.create(missionId, fixtureSource);
  console.log(`Workspace isolé créé: ${workspace.root}`);

  const adapter = new ClaudeCodeAdapter({
    vps: loadVpsConfigFromEnv(),
    remoteWorkspaceBase: "/root/cortex-smoke-test",
    permissionMode: "acceptEdits",
  });

  const health = await adapter.health();
  console.log(`Claude CLI distant disponible: ${health.available}`);
  if (!health.available) {
    console.error("✗ Claude Code indisponible sur le VPS — arrêt (aucun fallback silencieux).");
    process.exit(1);
  }

  console.log("Exécution de la mission…");
  const result = await adapter.execute({
    missionId,
    step: "execution",
    objective: "Ajoute un commentaire en haut de hello.txt qui explique ce que fait la fonction. Ne crée aucun autre fichier.",
    context: "",
    constraints: "Un seul fichier modifié : hello.txt.",
    workspace: { root: workspace.root, readOnly: [] },
  });

  console.log("\n--- Résultat ---");
  console.log("success:", result.success);
  console.log("filesModified:", result.filesModified);
  console.log("duration:", result.metadata.duration, "ms");
  if (result.error) console.log("error:", result.error);
  console.log("\n--- Sortie Claude Code (extrait) ---");
  console.log(result.output.slice(0, 1000));

  const patch = gitDiff(workspace.root);
  console.log("\n--- Patch produit ---");
  console.log(patch || "(aucun changement détecté)");

  await workspaceManager.cleanup(workspace);
  await fs.rm(fixtureSource, { recursive: true, force: true });
  await fs.rm(localWorkspacesBase, { recursive: true, force: true });
  console.log("\n✓ Nettoyage local terminé.");
}

main().catch((err) => {
  console.error("✗ Smoke-test échoué:", err instanceof Error ? err.message : err);
  process.exit(1);
});

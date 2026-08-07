/**
 * Test manuel de connectivité SSH vers le VPS Hostinger. Ne fait partie d'aucun
 * contrat du domaine (ModelAdapter réel = Phase 3) — script de vérification isolé,
 * ne touche à rien du ledger/missions.
 *
 * Usage: npm run vps:test
 * Requiert un fichier .env (voir .env.example) avec VPS_HOST, VPS_USER,
 * et VPS_PASSWORD ou VPS_SSH_KEY_PATH.
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { NodeSSH } from "node-ssh";

config();

const host = process.env.VPS_HOST;
const port = Number(process.env.VPS_PORT ?? 22);
const username = process.env.VPS_USER ?? "root";
const password = process.env.VPS_PASSWORD || undefined;
const keyPath = process.env.VPS_SSH_KEY_PATH || undefined;

if (!host) {
  console.error("VPS_HOST manquant. Copie .env.example vers .env et renseigne tes identifiants.");
  process.exit(1);
}
if (!password && !keyPath) {
  console.error("Aucune méthode d'auth : renseigne VPS_PASSWORD ou VPS_SSH_KEY_PATH dans .env.");
  process.exit(1);
}

async function main() {
  const ssh = new NodeSSH();
  console.log(`Connexion SSH à ${username}@${host}:${port}…`);

  await ssh.connect({
    host,
    port,
    username,
    password,
    privateKey: keyPath ? readFileSync(keyPath, "utf8") : undefined,
  });
  console.log("✓ Connecté.");

  const checks: { label: string; cmd: string }[] = [
    { label: "Whoami", cmd: "whoami" },
    { label: "OS", cmd: "cat /etc/os-release | grep PRETTY_NAME" },
    { label: "Node.js", cmd: "node -v || echo 'non installé'" },
    { label: "Claude CLI", cmd: "claude --version || echo 'non installé'" },
    { label: "Espace disque", cmd: "df -h / | tail -1" },
  ];

  for (const { label, cmd } of checks) {
    const result = await ssh.execCommand(cmd);
    const output = (result.stdout || result.stderr || "").trim();
    console.log(`  ${label.padEnd(14)} ${output}`);
  }

  ssh.dispose();
  console.log("\n✓ Test terminé, connexion fermée proprement.");
}

main().catch((err) => {
  console.error("✗ Échec de connexion :", err instanceof Error ? err.message : err);
  process.exit(1);
});

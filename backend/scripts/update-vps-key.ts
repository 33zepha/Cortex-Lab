import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { NodeSSH } from "node-ssh";

config();

const host = process.env.VPS_HOST;
const port = Number(process.env.VPS_PORT ?? 22);
const username = process.env.VPS_USER ?? "root";
const password = process.env.VPS_PASSWORD || undefined;
const keyPath = process.env.VPS_SSH_KEY_PATH || undefined;
const openAiKey = process.env.OPENAI_API_KEY;

if (!host || !password || !openAiKey) {
  console.error("VPS_HOST, VPS_PASSWORD ou OPENAI_API_KEY manquant dans .env");
  process.exit(1);
}

async function main() {
  const ssh = new NodeSSH();
  console.log(`Connexion SSH à ${username}@${host}:${port}…`);
  await ssh.connect({ host, port, username, password, privateKey: keyPath ? readFileSync(keyPath, "utf8") : undefined });
  console.log("✓ Connecté au VPS.");

  console.log("Mise à jour du dépôt Git sur le VPS…");
  const gitPull = await ssh.execCommand("cd /root/Cortex-Lab && git pull origin main");
  console.log(gitPull.stdout || gitPull.stderr);

  const openAiModel = process.env.OPENAI_MODEL ?? "gpt-5.6";

  console.log("Mise à jour de OPENAI_API_KEY et OPENAI_MODEL dans /root/Cortex-Lab/.env…");
  const updateEnvCmd = `
    cd /root/Cortex-Lab
    if grep -q "^OPENAI_API_KEY=" .env; then
      sed -i 's|^OPENAI_API_KEY=.*|OPENAI_API_KEY=${openAiKey}|' .env
    else
      echo "OPENAI_API_KEY=${openAiKey}" >> .env
    fi
    if grep -q "^OPENAI_MODEL=" .env; then
      sed -i 's|^OPENAI_MODEL=.*|OPENAI_MODEL=${openAiModel}|' .env
    else
      echo "OPENAI_MODEL=${openAiModel}" >> .env
    fi
  `;
  await ssh.execCommand(updateEnvCmd);
  console.log("✓ Fichier .env VPS mis à jour.");

  console.log("Redémarrage du service PM2 cortex-api…");
  const pm2Restart = await ssh.execCommand("pm2 restart cortex-api");
  console.log(pm2Restart.stdout || pm2Restart.stderr);

  ssh.dispose();
  console.log("✓ Opération terminée avec succès !");
}

main().catch((err) => {
  console.error("Erreur SSH:", err);
  process.exit(1);
});

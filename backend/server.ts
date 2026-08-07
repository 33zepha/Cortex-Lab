import path from "node:path";
import { promises as fs } from "node:fs";
import { timingSafeEqual } from "node:crypto";
import { config } from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import OpenAI from "openai";
import { NdjsonEventStore, readEntireLedger } from "./core/stores/event-store";
import { FileEvidenceStore } from "./core/stores/evidence-store";
import { listMissions } from "./core/stores/list-missions";
import { FileMissionRepository } from "./core/stores/mission-repository";
import { ClaudeCodeAdapter } from "./core/adapters/claude-code-adapter";
import { loadVpsConfigFromEnv } from "./core/infra/vps-config";
import { WorkspaceManager } from "./core/workspace/workspace-manager";
import { OpenAiPlanner } from "./core/planner/openai-planner";
import { HeuristicPlanner } from "./core/planner/heuristic-planner";
import type { Planner } from "./core/contracts/planner";
import { runMission } from "./core/runner/runner";
import { toApiMission } from "./api-adapters/to-api-mission";
import { buildApiHealth } from "./api-adapters/to-api-health";

config();

const dataDir = path.join(process.cwd(), "data");
const ledgerPath = path.join(dataDir, "ledger", "events.ndjson");
const missionsDir = path.join(dataDir, "missions");
const playgroundDir = path.join(dataDir, "playground");
const eventStore = new NdjsonEventStore(ledgerPath);
const missionRepository = new FileMissionRepository(missionsDir);
const evidenceStore = new FileEvidenceStore(path.join(dataDir, "evidence"));
const workspaceManager = new WorkspaceManager(path.join(dataDir, "workspaces"));
const modelAdapter = new ClaudeCodeAdapter({
  vps: loadVpsConfigFromEnv(),
  remoteWorkspaceBase: "/root/cortex-workspaces",
});
const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const planner: Planner = process.env.OPENAI_API_KEY ? new OpenAiPlanner(process.env.OPENAI_API_KEY) : new HeuristicPlanner();
const apiToken = process.env.CORTEX_API_TOKEN?.trim() || null;
const allowedOrigins = (process.env.CORTEX_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Cible par défaut des missions créées via l'UI — jamais le repo Cortex-Lab lui-même (DECISIONS.md #7).
await fs.mkdir(playgroundDir, { recursive: true });
const playgroundReadme = path.join(playgroundDir, "README.md");
await fs.access(playgroundReadme).catch(async () => {
  await fs.writeFile(playgroundReadme, "# Playground\n\nProjet de test pour les missions Cortex lancées depuis l'UI.\n", "utf8");
});

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
});

function hasValidApiToken(authorization: string | undefined): boolean {
  if (!apiToken) return true;
  if (!authorization) return false;

  const expected = Buffer.from(`Bearer ${apiToken}`);
  const received = Buffer.from(authorization);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

app.addHook("onRequest", async (request, reply) => {
  if (hasValidApiToken(request.headers.authorization)) return;
  return reply.code(401).send({ error: "Cortex API: non autorisé" });
});

if (!apiToken) {
  app.log.warn("CORTEX_API_TOKEN absent — API non authentifiée (acceptable uniquement en développement local)");
}

// Le health-check SSH est coûteux (connexion réseau) — mis en cache 30s pour éviter de le refaire à chaque poll UI.
let claudeHealthCache: { available: boolean; checkedAt: number } | null = null;
async function getClaudeAvailability(): Promise<boolean> {
  if (claudeHealthCache && Date.now() - claudeHealthCache.checkedAt < 30_000) {
    return claudeHealthCache.available;
  }
  const health = await modelAdapter.health().catch(() => ({ available: false }));
  claudeHealthCache = { available: health.available, checkedAt: Date.now() };
  return health.available;
}

// models.list() est un appel gratuit chez OpenAI — sert juste à valider que la clé est active.
let openaiHealthCache: { available: boolean; checkedAt: number } | null = null;
async function getOpenAiAvailability(): Promise<boolean> {
  if (!openaiClient) return false;
  if (openaiHealthCache && Date.now() - openaiHealthCache.checkedAt < 30_000) {
    return openaiHealthCache.available;
  }
  const available = await openaiClient.models
    .list()
    .then(() => true)
    .catch(() => false);
  openaiHealthCache = { available, checkedAt: Date.now() };
  return available;
}

app.get("/api/health", async () => {
  const [missions, allEvents, claudeAvailable, openaiAvailable] = await Promise.all([
    listMissions(missionsDir),
    readEntireLedger(ledgerPath),
    getClaudeAvailability(),
    getOpenAiAvailability(),
  ]);
  return buildApiHealth(dataDir, missions, allEvents, claudeAvailable, openaiAvailable);
});

app.get("/api/missions", async () => {
  const missions = await listMissions(missionsDir);
  const results = await Promise.all(
    missions.map(async (mission) => {
      const events = await eventStore.readAll(mission.id);
      const evidence = await evidenceStore.list(mission.id);
      return toApiMission(mission, events, evidence);
    }),
  );
  return results;
});

app.get("/api/tokens/weekly", async () => {
  const missions = await listMissions(missionsDir);
  const dayFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
  const days: { day: string; tokens: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayEnd = dayStart + 24 * 3600 * 1000;

    const tokens = missions
      .filter((m) => m.closedAt !== null && m.closedAt >= dayStart && m.closedAt < dayEnd)
      .reduce((sum, m) => sum + (m.tokensUsed ?? 0), 0);

    days.push({ day: dayFormatter.format(date), tokens });
  }

  return days;
});

app.post<{ Body: { objective?: string; constraints?: string; model?: string; effort?: string; sourceRoot?: string } }>(
  "/api/missions",
  async (request, reply) => {
    const { objective, constraints, model, effort, sourceRoot } = request.body ?? {};
    if (!objective || objective.trim().length < 10) {
      reply.code(400);
      return { error: "objective requis (10 caractères minimum)" };
    }

    const selectedModel = model?.trim() || process.env.OPENAI_MODEL || "gpt-5.6";
    const effortConstraint = effort ? `[Effort : ${effort}] ${constraints ?? ""}`.trim() : constraints;
    const customPlanner: Planner = process.env.OPENAI_API_KEY
      ? new OpenAiPlanner(process.env.OPENAI_API_KEY, selectedModel)
      : new HeuristicPlanner();

    const mission = await runMission(
      { objective, constraints: effortConstraint, model: selectedModel, sourceRoot: sourceRoot || playgroundDir },
      { eventStore, missionRepository, evidenceStore, modelAdapter, workspaceManager, planner: customPlanner },
    );

    const events = await eventStore.readAll(mission.id);
    const evidence = await evidenceStore.list(mission.id);
    reply.code(201);
    return toApiMission(mission, events, evidence);
  },
);

app.get<{ Params: { id: string } }>("/api/missions/:id", async (request, reply) => {
  const mission = await missionRepository.findById(request.params.id);
  if (!mission) {
    reply.code(404);
    return { error: "Mission introuvable" };
  }
  const events = await eventStore.readAll(mission.id);
  const evidence = await evidenceStore.list(mission.id);
  return toApiMission(mission, events, evidence);
});

app.post<{ Params: { id: string }; Body: { reason?: string } }>(
  "/api/missions/:id/cancel",
  async (request, reply) => {
    const mission = await missionRepository.findById(request.params.id);
    if (!mission) {
      reply.code(404);
      return { error: "Mission introuvable" };
    }
    const reason = request.body?.reason ?? "Annulée par l'utilisateur";
    const existingEvents = await eventStore.readAll(mission.id);
    await eventStore.append({
      id: `evt_${Date.now()}`,
      seq: existingEvents.length + 1,
      missionId: mission.id,
      ts: Date.now(),
      actor: "api",
      type: "mission.cancelled",
      v: "1.0.0",
      payload: { reason },
    });
    const updatedMission = await missionRepository.findById(mission.id);
    const events = await eventStore.readAll(mission.id);
    const evidenceList = await evidenceStore.list(mission.id);
    return toApiMission(updatedMission ?? mission, events, evidenceList);
  },
);

app.post<{ Params: { id: string }; Body: { decision?: "approve" | "reject"; detail?: string } }>(
  "/api/missions/:id/decision",
  async (request, reply) => {
    const mission = await missionRepository.findById(request.params.id);
    if (!mission) {
      reply.code(404);
      return { error: "Mission introuvable" };
    }
    const decision = request.body?.decision ?? "approve";
    const existingEvents = await eventStore.readAll(mission.id);
    await eventStore.append({
      id: `evt_${Date.now()}`,
      seq: existingEvents.length + 1,
      missionId: mission.id,
      ts: Date.now(),
      actor: "api",
      type: "decision.provided",
      v: "1.0.0",
      payload: { decision, detail: request.body?.detail },
    });
    const updatedMission = await missionRepository.findById(mission.id);
    const events = await eventStore.readAll(mission.id);
    const evidenceList = await evidenceStore.list(mission.id);
    return toApiMission(updatedMission ?? mission, events, evidenceList);
  },
);

const port = Number(process.env.API_PORT ?? 4000);
app
  .listen({ port, host: "0.0.0.0" })
  .then(() => console.log(`Cortex API sur http://localhost:${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });

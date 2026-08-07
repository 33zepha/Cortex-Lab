import path from "node:path";
import { promises as fs } from "node:fs";
import { timingSafeEqual } from "node:crypto";
import { config } from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import OpenAI from "openai";
import { ulid } from "ulid";
import { NdjsonEventStore, readEntireLedger } from "./core/stores/event-store";
import { FileEvidenceStore } from "./core/stores/evidence-store";
import { listMissions } from "./core/stores/list-missions";
import { FileMissionRepository } from "./core/stores/mission-repository";
import { ClaudeCodeAdapter } from "./core/adapters/claude-code-adapter";
import { loadVpsConfigFromEnv } from "./core/infra/vps-config";
import { WorkspaceManager } from "./core/workspace/workspace-manager";
import { OpenAiPlanner } from "./core/planner/openai-planner";
import { HeuristicPlanner } from "./core/planner/heuristic-planner";
import { SimplePolicy } from "./core/policy/policy";
import type { Planner } from "./core/contracts/planner";
import { runMission } from "./core/runner/runner";
import { assertPublicApiSecured, resolveCorsOrigin } from "./core/security/runtime-security";
import { toApiMission } from "./api-adapters/to-api-mission";
import { buildApiHealth } from "./api-adapters/to-api-health";

config();

const port = Number(process.env.API_PORT ?? 4000);
const host = process.env.API_HOST ?? "127.0.0.1";
const apiToken = process.env.CORTEX_API_TOKEN?.trim() || null;
const allowUnauthenticatedPublic = process.env.CORTEX_ALLOW_UNAUTHENTICATED_PUBLIC === "1";
const allowSourceRootOverride = process.env.CORTEX_ALLOW_SOURCE_ROOT_OVERRIDE === "1";
const maxActiveMissions = Math.max(1, Math.min(8, Number(process.env.CORTEX_MAX_ACTIVE_MISSIONS ?? 2) || 2));
const allowedOrigins = (process.env.CORTEX_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

assertPublicApiSecured({ host, apiToken, allowUnauthenticatedPublic });

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
const defaultPlanner: Planner = process.env.OPENAI_API_KEY ? new OpenAiPlanner(process.env.OPENAI_API_KEY) : new HeuristicPlanner();
const policy = new SimplePolicy({
  tokenBudget: Number(process.env.CORTEX_TOKEN_BUDGET ?? 120_000),
  timeoutSeconds: Number(process.env.CORTEX_STEP_TIMEOUT_SECONDS ?? 1_800),
  allowedPathPrefixes: [""],
  allowedCommands: [],
});
const activeMissionControllers = new Map<string, AbortController>();
let connectedSseClients = 0;

await fs.mkdir(playgroundDir, { recursive: true });
const playgroundReadme = path.join(playgroundDir, "README.md");
await fs.access(playgroundReadme).catch(async () => {
  await fs.writeFile(playgroundReadme, "# Playground\n\nProjet de test pour les missions Cortex lancées depuis l'UI.\n", "utf8");
});

const app = Fastify({ logger: true, bodyLimit: 256 * 1024 });
await app.register(cors, { origin: resolveCorsOrigin(host, allowedOrigins) });

function hasValidApiToken(authorization: string | undefined): boolean {
  if (!apiToken) return true;
  if (!authorization) return false;
  const expected = Buffer.from(`Bearer ${apiToken}`);
  const received = Buffer.from(authorization);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

function parseCursor(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === "") return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

app.addHook("onRequest", async (request, reply) => {
  if (hasValidApiToken(request.headers.authorization)) return;
  return reply.code(401).send({ error: "Cortex API: non autorisé" });
});

app.addHook("onSend", async (_request, reply, payload) => {
  reply.header("X-Content-Type-Options", "nosniff");
  if (!reply.hasHeader("Cache-Control")) reply.header("Cache-Control", "no-store");
  return payload;
});

if (apiToken) {
  app.log.info("CORTEX_API_TOKEN actif — API authentifiée");
} else {
  app.log.warn("CORTEX_API_TOKEN absent — mode non authentifié explicitement autorisé");
}

let claudeHealthCache: { available: boolean; checkedAt: number } | null = null;
async function getClaudeAvailability(): Promise<boolean> {
  if (claudeHealthCache && Date.now() - claudeHealthCache.checkedAt < 30_000) return claudeHealthCache.available;
  const health = await modelAdapter.health().catch(() => ({ available: false }));
  claudeHealthCache = { available: health.available, checkedAt: Date.now() };
  return health.available;
}

let openaiHealthCache: { available: boolean; checkedAt: number } | null = null;
async function getOpenAiAvailability(): Promise<boolean> {
  if (!openaiClient) return false;
  if (openaiHealthCache && Date.now() - openaiHealthCache.checkedAt < 30_000) return openaiHealthCache.available;
  const available = await openaiClient.models.list().then(() => true).catch(() => false);
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
  return buildApiHealth(dataDir, missions, allEvents, claudeAvailable, openaiAvailable, connectedSseClients);
});

app.get("/api/missions", async () => {
  const missions = await listMissions(missionsDir);
  return Promise.all(missions.map(async (mission) => {
    const events = await eventStore.readAll(mission.id);
    const evidence = await evidenceStore.list(mission.id);
    return toApiMission(mission, events, evidence);
  }));
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

app.get<{ Querystring: { cursor?: string; limit?: string } }>("/api/events", async (request) => {
  const events = await readEntireLedger(ledgerPath);
  const cursor = Math.max(0, Number(request.query.cursor ?? 0) || 0);
  const limit = Math.min(500, Math.max(1, Number(request.query.limit ?? 200) || 200));
  return { cursor, nextCursor: Math.min(events.length, cursor + limit), total: events.length, events: events.slice(cursor, cursor + limit) };
});

app.get<{ Querystring: { cursor?: string } }>("/api/stream", async (request, reply) => {
  const lastEventId = parseCursor(request.headers["last-event-id"]);
  const queryCursor = parseCursor(request.query.cursor);
  let cursor = lastEventId !== null ? lastEventId + 1 : (queryCursor ?? 0);

  reply.hijack();
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
    "X-Content-Type-Options": "nosniff",
  });
  reply.raw.write("retry: 2000\n\n");
  connectedSseClients += 1;

  let closed = false;
  const flush = async () => {
    if (closed) return;
    const events = await readEntireLedger(ledgerPath);
    if (cursor > events.length) cursor = events.length;
    while (cursor < events.length && !closed) {
      const eventIndex = cursor;
      const event = events[eventIndex];
      reply.raw.write(`id: ${eventIndex}\n`);
      reply.raw.write(`event: ${event.type}\n`);
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      cursor += 1;
    }
  };

  await flush().catch((error) => app.log.error(error));
  const poll = setInterval(() => void flush().catch((error) => app.log.error(error)), 750);
  const heartbeat = setInterval(() => { if (!closed) reply.raw.write(`: heartbeat ${Date.now()}\n\n`); }, 15_000);
  request.raw.on("close", () => {
    if (closed) return;
    closed = true;
    clearInterval(poll);
    clearInterval(heartbeat);
    connectedSseClients = Math.max(0, connectedSseClients - 1);
  });
  return reply;
});

app.post<{ Body: { title?: string; objective?: string; constraints?: string; model?: string; effort?: string; sourceRoot?: string } }>(
  "/api/missions",
  async (request, reply) => {
    const { title, objective, constraints, model, effort, sourceRoot } = request.body ?? {};
    const cleanObjective = objective?.trim() ?? "";

    if (cleanObjective.length < 10 || cleanObjective.length > 10_000) {
      reply.code(400);
      return { error: "objective requis (10 à 10000 caractères)" };
    }
    if ((title?.length ?? 0) > 200) {
      reply.code(400);
      return { error: "title trop long (200 caractères maximum)" };
    }
    if ((constraints?.length ?? 0) > 20_000) {
      reply.code(400);
      return { error: "constraints trop longues (20000 caractères maximum)" };
    }
    if ((model?.length ?? 0) > 120 || (effort?.length ?? 0) > 120) {
      reply.code(400);
      return { error: "model/effort invalide" };
    }
    if (sourceRoot && !allowSourceRootOverride) {
      reply.code(400);
      return { error: "sourceRoot n'est pas configurable via l'API publique" };
    }
    if (activeMissionControllers.size >= maxActiveMissions) {
      reply.code(429);
      return { error: `Limite de missions actives atteinte (${maxActiveMissions})` };
    }

    const selectedModel = model?.trim() || process.env.OPENAI_MODEL || "gpt-5.6";
    const effortConstraint = effort ? `[Effort : ${effort}] ${constraints ?? ""}`.trim() : constraints;
    const customPlanner: Planner = process.env.OPENAI_API_KEY ? new OpenAiPlanner(process.env.OPENAI_API_KEY, selectedModel) : defaultPlanner;
    const missionId = ulid();
    const controller = new AbortController();
    activeMissionControllers.set(missionId, controller);

    try {
      const mission = await runMission(
        {
          missionId,
          title: title?.trim(),
          objective: cleanObjective,
          constraints: effortConstraint,
          model: selectedModel,
          sourceRoot: sourceRoot && allowSourceRootOverride ? sourceRoot : playgroundDir,
          signal: controller.signal,
        },
        { eventStore, missionRepository, evidenceStore, modelAdapter, workspaceManager, planner: customPlanner, policy },
      );
      const events = await eventStore.readAll(mission.id);
      const evidence = await evidenceStore.list(mission.id);
      reply.code(201);
      return toApiMission(mission, events, evidence);
    } finally {
      activeMissionControllers.delete(missionId);
    }
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

app.post<{ Params: { id: string }; Body: { reason?: string } }>("/api/missions/:id/cancel", async (request, reply) => {
  const mission = await missionRepository.findById(request.params.id);
  const controller = activeMissionControllers.get(request.params.id);
  if (!mission && !controller) {
    reply.code(404);
    return { error: "Mission introuvable" };
  }
  if (!controller) {
    reply.code(409);
    return { error: "Mission déjà terminée ou non annulable" };
  }
  controller.abort(request.body?.reason ?? "Annulée par l'utilisateur");
  return { id: request.params.id, status: "cancelling" };
});

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

app.listen({ port, host })
  .then(() => console.log(`Cortex API sur http://${host}:${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });

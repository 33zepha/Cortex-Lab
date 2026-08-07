import { promises as fs } from "node:fs";
import path from "node:path";
import type { DomainEventEnvelope } from "../../core/contracts/events";
import type { MissionEntity } from "../../core/contracts/mission";

/** Miroir de `SystemHealth` (src/lib/types.ts) — même raisonnement que to-api-mission.ts. */
export type ApiSystemHealth = {
  cortexServer: { status: "running" | "degraded" | "stopped"; uptimeSeconds: number; memoryMb: number };
  claudeCode: { status: "available" | "degraded" | "unavailable"; lastCallAt: number | null; tokensUsedToday: number };
  openai: { status: "available" | "unavailable"; lastCallAt: number | null; plansToday: number };
  ledger: { totalEvents: number; sizeKb: number; lastWriteAt: number | null };
  storage: {
    activeMissions: number;
    usedMb: number;
    quotaMb: number;
    breakdown: { label: string; valueMb: number; colorClass: string }[];
  };
  sse: { connectedClients: number; status: "connected" | "reconnecting" | "disconnected"; avgLagMs: number };
  recentErrors: { id: string; message: string; ts: number }[];
};

async function dirSizeKb(dir: string): Promise<number> {
  let total = 0;
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = await fs.stat(full);
    if (stat.isDirectory()) total += await dirSizeKb(full);
    else total += stat.size / 1024;
  }
  return total;
}

export async function buildApiHealth(
  dataDir: string,
  missions: MissionEntity[],
  allEvents: DomainEventEnvelope[],
  claudeAvailable: boolean,
  openaiAvailable: boolean,
): Promise<ApiSystemHealth> {
  const ledgerPath = path.join(dataDir, "ledger", "events.ndjson");
  let ledgerSizeKb = 0;
  let totalEvents = 0;
  let lastWriteAt: number | null = null;
  try {
    const stat = await fs.stat(ledgerPath);
    ledgerSizeKb = stat.size / 1024;
    const raw = await fs.readFile(ledgerPath, "utf8");
    totalEvents = raw.split("\n").filter((l) => l.trim()).length;
  } catch {
    // pas encore de ledger : valeurs à zéro, honnête plutôt que simulé
  }

  const lastEvent = [...allEvents].sort((a, b) => b.ts - a.ts)[0];
  if (lastEvent) lastWriteAt = lastEvent.ts;

  const lastClaudeCall = [...allEvents]
    .filter((e) => e.type === "step.started" || e.type === "file.modified")
    .sort((a, b) => b.ts - a.ts)[0];

  const lastPlanCall = [...allEvents].filter((e) => e.type === "plan.ready").sort((a, b) => b.ts - a.ts)[0];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const plansToday = allEvents.filter((e) => e.type === "plan.ready" && e.ts >= todayStart.getTime()).length;
  const tokensUsedToday = missions
    .filter((m) => m.closedAt !== null && m.closedAt >= todayStart.getTime())
    .reduce((sum, m) => sum + (m.tokensUsed ?? 0), 0);

  const [ledgerKb, missionsKb, evidenceKb, workspacesKb] = await Promise.all([
    dirSizeKb(path.join(dataDir, "ledger")),
    dirSizeKb(path.join(dataDir, "missions")),
    dirSizeKb(path.join(dataDir, "evidence")),
    dirSizeKb(path.join(dataDir, "workspaces")),
  ]);
  const usedMb = (ledgerKb + missionsKb + evidenceKb + workspacesKb) / 1024;

  const recentErrors = missions
    .filter((m) => m.error)
    .sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0))
    .slice(0, 5)
    .map((m) => ({ id: m.id, message: m.error as string, ts: m.closedAt ?? m.createdAt }));

  return {
    cortexServer: {
      status: "running",
      uptimeSeconds: Math.floor(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
    claudeCode: {
      status: claudeAvailable ? "available" : "unavailable",
      lastCallAt: lastClaudeCall?.ts ?? null,
      tokensUsedToday,
    },
    openai: {
      status: openaiAvailable ? "available" : "unavailable",
      lastCallAt: lastPlanCall?.ts ?? null,
      plansToday,
    },
    ledger: { totalEvents, sizeKb: Math.round(ledgerSizeKb), lastWriteAt },
    storage: {
      activeMissions: missions.filter((m) => m.status === "running").length,
      usedMb: Math.round(usedMb),
      quotaMb: 5_000, // limite configurée, pas une mesure — documenté ici
      breakdown: [
        { label: "Workspaces", valueMb: Math.round(workspacesKb / 1024), colorClass: "bg-accent-indigo" },
        { label: "Ledger", valueMb: Math.round(ledgerKb / 1024), colorClass: "bg-success" },
        { label: "Evidence", valueMb: Math.round(evidenceKb / 1024), colorClass: "bg-warning" },
        { label: "Missions", valueMb: Math.round(missionsKb / 1024), colorClass: "bg-neutral-300" },
      ],
    },
    sse: { connectedClients: 0, status: "disconnected", avgLagMs: 0 }, // SSE non implémenté (Phase 4, NEXT.md)
    recentErrors,
  };
}

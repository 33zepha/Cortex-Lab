import type { SystemHealth } from "@/lib/types";

const now = Date.parse("2026-08-06T14:30:00Z");
const min = 60_000;

export const systemHealthy: SystemHealth = {
  cortexServer: { status: "running", uptimeSeconds: 3 * 24 * 3600 + 14 * 3600, memoryMb: 184 },
  claudeCode: { status: "available", lastCallAt: now - 3 * min, tokensUsedToday: 428_500 },
  openai: { status: "available", lastCallAt: now - 5 * min, plansToday: 4 },
  ledger: { totalEvents: 12_842, sizeKb: 3_120, lastWriteAt: now - 3 * min },
  storage: { 
    activeMissions: 1, 
    usedMb: 214, 
    quotaMb: 5_000,
    breakdown: [
      { label: "Modèles", valueMb: 124, colorClass: "bg-accent-indigo" },
      { label: "Ledger", valueMb: 52, colorClass: "bg-success" },
      { label: "Cache", valueMb: 28, colorClass: "bg-warning" },
      { label: "Divers", valueMb: 10, colorClass: "bg-neutral-300" }
    ]
  },
  sse: { connectedClients: 2, status: "connected", avgLagMs: 84 },
  recentErrors: [],
};

export const systemDisconnected: SystemHealth = {
  ...systemHealthy,
  claudeCode: { status: "degraded", lastCallAt: now - 22 * min, tokensUsedToday: 428_500 },
  sse: { connectedClients: 0, status: "disconnected", avgLagMs: 0 },
  recentErrors: [
    { id: "err-1", message: "SSE : connexion perdue, tentative de reconnexion...", ts: now - 2 * min },
  ],
};

/** Tokens Claude Code consommés par jour, 7 derniers jours — pour le graphique Overview. */
export const weeklyTokenUsage: { day: string; tokens: number }[] = [
  { day: "31 juil.", tokens: 312_000 },
  { day: "1 août", tokens: 289_000 },
  { day: "2 août", tokens: 401_000 },
  { day: "3 août", tokens: 198_000 },
  { day: "4 août", tokens: 356_000 },
  { day: "5 août", tokens: 372_000 },
  { day: "6 août", tokens: 428_500 },
];

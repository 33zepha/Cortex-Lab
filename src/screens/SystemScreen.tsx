import { useState } from "react";
import type { ReactNode } from "react";
import { Server, Cpu, ScrollText, HardDrive, Radio, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ServerStackIcon } from "@heroicons/react/24/solid";
import { PageHeader } from "@/components/shell/PageHeader";
import { BentoCard, StatusIndicator, EmptyState, Button } from "@/components/ui";
import { systemHealthy, systemDisconnected, weeklyTokenUsage } from "@/fixtures/system";
import { formatRelativeTime } from "@/lib/status";
import type { Tone } from "@/lib/status";
import type { SystemHealth } from "@/lib/types";

const now = Date.parse("2026-08-06T14:30:00Z");

type ClaudeStatus = SystemHealth["claudeCode"]["status"];
type SseStatus = SystemHealth["sse"]["status"];

const claudeToneMap: Record<ClaudeStatus, Tone> = { available: "success", degraded: "warning", unavailable: "error" };
const sseToneMap: Record<SseStatus, Tone> = { connected: "success", reconnecting: "warning", disconnected: "error" };
const claudeLabelMap: Record<ClaudeStatus, string> = { available: "Disponible", degraded: "Dégradé", unavailable: "Indisponible" };
const sseLabelMap: Record<SseStatus, string> = { connected: "Connecté", reconnecting: "Reconnexion…", disconnected: "Déconnecté" };

function MetricTile({
  id,
  icon,
  label,
  value,
  sub,
  children,
}: {
  id?: string;
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-6 rounded-lg border border-border bg-surface-1 px-4 py-3.5">
      <div className="flex items-center gap-2 text-text-muted">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1.5 text-metric text-text-primary">{value}</p>
      {sub && <p className="mt-0.5 text-label text-text-muted">{sub}</p>}
      {children}
    </div>
  );
}

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const w = 120;
  const h = 28;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-7 w-full" preserveAspectRatio="none" aria-hidden>
      <polyline points={points} fill="none" className="stroke-chart-line" strokeWidth={1.5} />
    </svg>
  );
}

export function SystemScreen() {
  const [simulateDisconnect, setSimulateDisconnect] = useState(false);
  const health = simulateDisconnect ? systemDisconnected : systemHealthy;
  const allHealthy = !simulateDisconnect;

  return (
    <div>
      <PageHeader
        title="System"
        icon={ServerStackIcon}
        action={
          <Button size="sm" variant="secondary" onClick={() => setSimulateDisconnect((v) => !v)}>
            {simulateDisconnect ? "Revenir à l'état connecté" : "Simuler une déconnexion SSE (démo)"}
          </Button>
        }
      />

      {/* Statut global */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-4 py-3">
        {allHealthy ? (
          <CheckCircle2 className="size-4 text-success" />
        ) : (
          <AlertTriangle className="size-4 text-warning" />
        )}
        <span className="text-body-text font-medium text-text-primary">
          {allHealthy ? "Tous les systèmes sont opérationnels" : "Un composant nécessite votre attention"}
        </span>
      </div>

      {/* Grille dense de métriques */}
      <div className="mb-4 grid grid-cols-2 gap-3 tablet:grid-cols-3 laptop:grid-cols-4">
        <MetricTile id="cortex-server" icon={<Server className="size-3.5" />} label="Uptime serveur" value={`${Math.floor(health.cortexServer.uptimeSeconds / 3600)}h`} sub="Running" />
        <MetricTile icon={<Server className="size-3.5" />} label="Mémoire" value={`${health.cortexServer.memoryMb} Mo`} />
        <MetricTile id="claude-code" icon={<Cpu className="size-3.5" />} label="Claude Code" value={claudeLabelMap[health.claudeCode.status]} sub={health.claudeCode.lastCallAt ? `Dernier appel ${formatRelativeTime(health.claudeCode.lastCallAt, now)}` : undefined} />
        <MetricTile
          icon={<Cpu className="size-3.5" />}
          label="Tokens (7j)"
          value={health.claudeCode.tokensUsedToday.toLocaleString("fr-FR")}
        >
          <MiniSparkline data={weeklyTokenUsage.map((d) => d.tokens)} />
        </MetricTile>
        <MetricTile id="ledger" icon={<ScrollText className="size-3.5" />} label="Ledger — événements" value={health.ledger.totalEvents.toLocaleString("fr-FR")} sub="Append-only, sain" />
        <MetricTile icon={<ScrollText className="size-3.5" />} label="Ledger — taille" value={`${(health.ledger.sizeKb / 1024).toFixed(1)} Mo`} />
        <MetricTile id="storage" icon={<HardDrive className="size-3.5" />} label="Stockage utilisé" value={`${health.storage.usedMb} Mo`} sub={`sur ${(health.storage.quotaMb / 1000).toFixed(0)} Go — ${health.storage.activeMissions} mission(s) active(s)`} />
        <MetricTile id="sse" icon={<Radio className="size-3.5" />} label="SSE" value={sseLabelMap[health.sse.status]} sub={health.sse.avgLagMs > 0 ? `${health.sse.connectedClients} client(s) · ${health.sse.avgLagMs} ms` : `${health.sse.connectedClients} client(s)`} />
      </div>

      {/* Indicateurs colorés discrets (cohérence avec les tons du reste de l'app) */}
      <div className="mb-4 flex flex-wrap gap-4 px-1">
        <StatusIndicator tone="success" label="Cortex server" />
        <StatusIndicator tone={claudeToneMap[health.claudeCode.status]} label="Claude Code" />
        <StatusIndicator tone={sseToneMap[health.sse.status]} label="SSE" pulse={health.sse.status === "reconnecting"} />
      </div>

      {/* Erreurs récentes — grande carte */}
      <BentoCard id="errors" eyebrow="Erreurs récentes" className="scroll-mt-6">
        {health.recentErrors.length === 0 ? (
          <EmptyState icon={<AlertTriangle className="size-5" />} title="Aucune erreur" description="Le système n'a signalé aucune erreur récente." compact />
        ) : (
          <ul className="space-y-2">
            {health.recentErrors.map((e) => (
              <li key={e.id} className="rounded-md border border-error/30 bg-error-muted px-3 py-2.5 text-body-text text-text-secondary">
                {e.message}
                <span className="mt-1 block text-label text-text-muted">{formatRelativeTime(e.ts, now)}</span>
              </li>
            ))}
          </ul>
        )}
      </BentoCard>
    </div>
  );
}

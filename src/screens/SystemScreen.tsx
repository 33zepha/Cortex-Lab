import { useState } from "react";
import { motion } from "framer-motion";
import { HardDrive, Plus, Radio, ScrollText, Server } from "lucide-react";
import { ServerIcon, ServerStackIcon } from "@heroicons/react/24/solid";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  ErrorState,
  GlassActionGroup,
  HoverExpandButton,
  Input,
  Skeleton,
} from "@/components/ui";
import { ClaudeMark } from "@/components/brand/ClaudeMark";
import { OpenAiMark } from "@/components/brand/OpenAiMark";
import { useVps } from "@/lib/VpsContext";
import { useSystemHealth } from "@/lib/useSystemHealth";
import { formatRelativeTime } from "@/lib/status";
import { EASE_SPRING_ARRAY } from "@/lib/animations";
import { cn } from "@/lib/cn";

const now = Date.now();
const ThickPlus = (props: React.ComponentProps<typeof Plus>) => <Plus strokeWidth={3.5} {...props} />;

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.floor(seconds))} s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours} h ${minutes}` : `${hours} h`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return hours > 0 ? `${days} j ${hours} h` : `${days} j`;
}

function stateClass(state: "good" | "warning" | "bad") {
  if (state === "good") return "text-success";
  if (state === "warning") return "text-warning";
  return "text-error";
}

function SectionHeading({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4 laptop:mb-4">
      <h2 className="text-[13px] font-bold tracking-[-0.015em] text-text-primary laptop:text-[14px]">{title}</h2>
      {detail && <span className="text-[10px] font-semibold text-text-muted laptop:text-[11px]">{detail}</span>}
    </div>
  );
}

function Metric({ label, value, suffix }: { label: string; value: React.ReactNode; suffix?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-[0.11em] text-text-muted">{label}</p>
      <p className="mt-1 truncate text-[22px] font-bold leading-none tracking-[-0.04em] text-text-primary laptop:text-[24px]">
        {value}
        {suffix && <span className="ml-1 text-[10px] font-semibold tracking-normal text-text-muted">{suffix}</span>}
      </p>
    </div>
  );
}

export function SystemScreen() {
  const [vpsDialogOpen, setVpsDialogOpen] = useState(false);
  const { vps, connectVps } = useVps();
  const [vpsIp, setVpsIp] = useState("187.127.70.52");
  const [vpsSshId, setVpsSshId] = useState("root");
  const [vpsSshKey, setVpsSshKey] = useState("");
  const { health, loading, error } = useSystemHealth();

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <PageHeader title="System" icon={ServerStackIcon} />
        <Skeleton className="mb-8 h-44 rounded-[18px]" />
        <Skeleton className="mb-8 h-40 rounded-[18px]" />
        <Skeleton className="h-48 rounded-[18px]" />
      </motion.div>
    );
  }

  if (error || !health) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <PageHeader title="System" icon={ServerStackIcon} />
        <ErrorState title="Impossible de joindre l'API Cortex" description={error ?? "Réponse vide."} onRetry={() => window.location.reload()} />
      </motion.div>
    );
  }

  const ramPercent = Math.min(100, (health.cortexServer.memoryMb / 4096) * 100);
  const storagePercent = health.storage.quotaMb > 0 ? Math.min(100, (health.storage.usedMb / health.storage.quotaMb) * 100) : 0;

  const coreStatus = health.cortexServer.status === "running" ? "Opérationnel" : health.cortexServer.status === "degraded" ? "Dégradé" : "Arrêté";
  const coreTone = health.cortexServer.status === "running" ? "good" : health.cortexServer.status === "degraded" ? "warning" : "bad";
  const claudeStatus = health.claudeCode.status === "available" ? "Disponible" : health.claudeCode.status === "degraded" ? "Dégradé" : "Indisponible";
  const claudeTone = health.claudeCode.status === "available" ? "good" : health.claudeCode.status === "degraded" ? "warning" : "bad";
  const openaiStatus = health.openai.status === "available" ? "Disponible" : "Indisponible";
  const openaiTone = health.openai.status === "available" ? "good" : "bad";
  const realtimeStatus = health.sse.status === "connected" ? "Connecté" : health.sse.status === "reconnecting" ? "Reconnexion" : "Déconnecté";
  const realtimeTone = health.sse.status === "connected" ? "good" : health.sse.status === "reconnecting" ? "warning" : "bad";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22, ease: EASE_SPRING_ARRAY }}>
      <PageHeader
        title="System"
        icon={ServerStackIcon}
        description="Runtime, moteurs et persistance."
        action={
          <Dialog open={vpsDialogOpen} onOpenChange={setVpsDialogOpen}>
            <DialogTrigger asChild>
              <div>
                <GlassActionGroup className="p-0.5 laptop:p-1">
                  <HoverExpandButton icon={ServerIcon} hoverIcon={ThickPlus} label={vps ? "VPS associé" : "Associer un VPS"} />
                </GlassActionGroup>
              </div>
            </DialogTrigger>
            <DialogContent title="Connecter un VPS" description="Associez un serveur au runtime Cortex.">
              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Adresse IP</span>
                  <Input placeholder="ex: 187.127.70.52" value={vpsIp} onChange={(event) => setVpsIp(event.target.value)} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Identifiant SSH</span>
                  <Input placeholder="ex: root" value={vpsSshId} onChange={(event) => setVpsSshId(event.target.value)} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Mot de passe / clé</span>
                  <Input type="password" placeholder="••••••••" value={vpsSshKey} onChange={(event) => setVpsSshKey(event.target.value)} />
                </label>
              </div>
              <div className="mt-6 grid grid-cols-[auto_1fr] gap-2.5 border-t border-black/[0.06] pt-4">
                <button type="button" onClick={() => setVpsDialogOpen(false)} className="min-h-12 rounded-[12px] px-4 text-[12px] font-bold text-text-muted hover:bg-black/[0.03] hover:text-text-primary">
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    connectVps({ ip: vpsIp, sshId: vpsSshId, sshKey: vpsSshKey });
                    setVpsDialogOpen(false);
                  }}
                  className="min-h-12 rounded-[12px] bg-text-primary px-4 text-[12px] font-bold text-white active:opacity-80"
                >
                  Connecter le VPS
                </button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-8 laptop:space-y-10">
        <section>
          <SectionHeading title="Runtime" detail={vps ? vps.ip : "local"} />
          <div className="relative border-y border-black/[0.065] py-5 laptop:py-6">
            <ServerStackIcon className="pointer-events-none absolute -right-3 -top-8 size-[120px] -rotate-6 text-text-primary opacity-[0.025]" aria-hidden />
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Server className="size-[21px] shrink-0 text-text-primary" strokeWidth={2.9} />
                <div>
                  <p className="text-[15px] font-bold tracking-[-0.02em] text-text-primary">Cortex Core</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-text-muted">Processus central</p>
                </div>
              </div>
              <span className={cn("text-[11px] font-bold", stateClass(coreTone))}>{coreStatus}</span>
            </div>

            <div className="relative z-10 mt-6 grid grid-cols-3 gap-4 laptop:max-w-2xl laptop:gap-10">
              <Metric label="Uptime" value={formatUptime(health.cortexServer.uptimeSeconds)} />
              <Metric label="Mémoire" value={health.cortexServer.memoryMb} suffix="Mo" />
              <Metric label="RAM" value={`${ramPercent.toFixed(0)}%`} />
            </div>

            <div className="relative z-10 mt-5 h-px w-full overflow-hidden bg-black/[0.06] laptop:max-w-2xl">
              <div className="h-full bg-text-primary" style={{ width: `${Math.max(ramPercent, 1)}%` }} />
            </div>
          </div>
        </section>

        <section>
          <SectionHeading title="Moteurs" detail="exécution · planification" />
          <div className="border-y border-black/[0.065] divide-y divide-black/[0.055]">
            <EngineRow
              mark={<ClaudeMark title="Claude" className="size-[21px] text-[#D97757]" />}
              name="Claude Code"
              role="Exécution"
              status={claudeStatus}
              tone={claudeTone}
              primary={health.claudeCode.lastCallAt ? formatRelativeTime(health.claudeCode.lastCallAt, now) : "Aucun appel"}
              secondary={`${health.claudeCode.tokensUsedToday.toLocaleString("fr-FR")} tk aujourd'hui`}
            />
            <EngineRow
              mark={<OpenAiMark title="OpenAI" className="size-[21px] text-text-primary" />}
              name="OpenAI"
              role="Planification"
              status={openaiStatus}
              tone={openaiTone}
              primary={health.openai.lastCallAt ? formatRelativeTime(health.openai.lastCallAt, now) : "Aucun appel"}
              secondary={`${health.openai.plansToday} plan${health.openai.plansToday > 1 ? "s" : ""} aujourd'hui`}
            />
          </div>
        </section>

        <section>
          <SectionHeading title="Données" detail="état courant" />
          <div className="border-y border-black/[0.065] divide-y divide-black/[0.055]">
            <DataRow
              icon={<ScrollText className="size-[18px]" strokeWidth={2.8} />}
              name="Ledger"
              value={`${health.ledger.totalEvents.toLocaleString("fr-FR")} événements`}
              detail={`${(health.ledger.sizeKb / 1024).toFixed(1)} Mo${health.ledger.lastWriteAt ? ` · écrit ${formatRelativeTime(health.ledger.lastWriteAt, now)}` : ""}`}
            />
            <DataRow
              icon={<Radio className="size-[18px]" strokeWidth={2.8} />}
              name="SSE"
              value={realtimeStatus}
              detail={`${health.sse.connectedClients} client${health.sse.connectedClients > 1 ? "s" : ""}${health.sse.avgLagMs > 0 ? ` · ${health.sse.avgLagMs} ms` : ""}`}
              tone={realtimeTone}
            />
            <div className="py-4 laptop:py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <HardDrive className="size-[18px] shrink-0 text-text-primary" strokeWidth={2.8} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold tracking-[-0.015em] text-text-primary">Stockage</p>
                    <p className="mt-1 text-[10px] font-semibold text-text-muted">{health.storage.activeMissions} mission{health.storage.activeMissions > 1 ? "s" : ""} active{health.storage.activeMissions > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-bold tabular-nums text-text-primary">{health.storage.usedMb} Mo</p>
                  <p className="mt-1 text-[10px] font-semibold text-text-muted">{storagePercent.toFixed(0)} % de {(health.storage.quotaMb / 1000).toFixed(0)} Go</p>
                </div>
              </div>
              <div className="mt-3 h-px w-full bg-black/[0.06]">
                <div className="h-full bg-text-primary" style={{ width: `${Math.max(storagePercent, 0.5)}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionHeading title="Incidents" detail={health.recentErrors.length === 0 ? "aucun" : `${health.recentErrors.length}`} />
          <div className="border-y border-black/[0.065]">
            {health.recentErrors.length === 0 ? (
              <div className="py-4 text-[12px] font-semibold text-text-muted">Aucun incident récent.</div>
            ) : (
              <ul className="divide-y divide-black/[0.055]">
                {health.recentErrors.map((incident) => (
                  <li key={incident.id} className="grid grid-cols-[1fr_auto] gap-4 py-4">
                    <p className="text-[12px] font-semibold leading-relaxed text-text-primary">{incident.message}</p>
                    <span className="text-[10px] font-semibold text-text-muted">{formatRelativeTime(incident.ts, now)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function EngineRow({
  mark,
  name,
  role,
  status,
  tone,
  primary,
  secondary,
}: {
  mark: React.ReactNode;
  name: string;
  role: string;
  status: string;
  tone: "good" | "warning" | "bad";
  primary: string;
  secondary: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 py-4 laptop:grid-cols-[minmax(0,1fr)_180px_170px] laptop:items-center laptop:py-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center">{mark}</div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold tracking-[-0.015em] text-text-primary">{name}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-text-muted">{role}</p>
        </div>
      </div>
      <div className="text-right laptop:text-left">
        <p className={cn("text-[11px] font-bold", stateClass(tone))}>{status}</p>
        <p className="mt-0.5 text-[10px] font-semibold text-text-muted laptop:hidden">{primary}</p>
      </div>
      <div className="col-span-2 pl-10 laptop:col-span-1 laptop:pl-0 laptop:text-right">
        <p className="hidden text-[11px] font-bold text-text-primary laptop:block">{primary}</p>
        <p className="text-[10px] font-semibold text-text-muted laptop:mt-0.5">{secondary}</p>
      </div>
    </div>
  );
}

function DataRow({
  icon,
  name,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  name: string;
  value: string;
  detail: string;
  tone?: "good" | "warning" | "bad";
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-4 laptop:py-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center text-text-primary">{icon}</div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold tracking-[-0.015em] text-text-primary">{name}</p>
          <p className="mt-0.5 truncate text-[10px] font-semibold text-text-muted">{detail}</p>
        </div>
      </div>
      <p className={cn("shrink-0 text-[12px] font-bold text-text-primary", tone && stateClass(tone))}>{value}</p>
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Server, ScrollText, HardDrive, Radio, AlertTriangle, Zap, Plus } from "lucide-react";
import { ServerStackIcon, ExclamationTriangleIcon, PowerIcon, ServerIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { PageHeader } from "@/components/shell/PageHeader";
import { BentoCard, EmptyState, ErrorState, Button, Dialog, DialogTrigger, DialogContent, Input, Skeleton, HoverExpandButton, GlassActionGroup } from "@/components/ui";
import { systemDisconnected } from "@/fixtures/system";
import { formatRelativeTime } from "@/lib/status";
import {
  EASE_SPRING_ARRAY,
  STAGGER_CONTAINER_VARIANTS,
  STAGGER_ITEM_VARIANTS,
  GLOW_DRIFT_A,
  GLOW_DRIFT_A_TRANSITION,
  GLOW_DRIFT_B,
  GLOW_DRIFT_B_TRANSITION,
} from "@/lib/animations";
import { useVps } from "@/lib/VpsContext";
import { useSystemHealth } from "@/lib/useSystemHealth";
import { ClaudeMark } from "@/components/brand/ClaudeMark";
import { OpenAiMark } from "@/components/brand/OpenAiMark";
import { cn } from "@/lib/cn";
import type { SystemHealth } from "@/lib/types";

const now = Date.now();

type SseStatus = SystemHealth["sse"]["status"];

const sseLabelMap: Record<SseStatus, string> = {
  connected: "Connecté",
  reconnecting: "Reconnexion…",
  disconnected: "Déconnecté",
};

const ThickPlus = (props: any) => <Plus strokeWidth={3.5} {...props} />;

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

function MetricTile({
  id,
  icon,
  label,
  value,
  sub,
  className,
  children,
}: {
  id?: string;
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-6 rounded-[20px] border border-white/60 bg-white/60 px-4 py-3.5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] backdrop-blur-xl laptop:rounded-[24px] laptop:px-5 laptop:py-4",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-text-muted">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.11em] laptop:text-xs laptop:tracking-widest">{label}</span>
      </div>
      <p className="mt-1.5 text-[26px] font-bold leading-none tracking-[-0.035em] text-text-primary laptop:mt-2 laptop:text-2xl laptop:font-semibold laptop:tracking-tight">
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[11px] font-medium text-text-muted laptop:mt-1">{sub}</p>}
      {children}
    </div>
  );
}

export function SystemScreen() {
  const [simulateDisconnect, setSimulateDisconnect] = useState(false);
  const [vpsDialogOpen, setVpsDialogOpen] = useState(false);

  const { vps, connectVps } = useVps();
  const [vpsIp, setVpsIp] = useState("187.127.70.52");
  const [vpsSshId, setVpsSshId] = useState("root");
  const [vpsSshKey, setVpsSshKey] = useState("");

  const { health: liveHealth, loading, error } = useSystemHealth();
  const health = simulateDisconnect ? systemDisconnected : liveHealth;

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }}>
        <PageHeader title="System" icon={ServerStackIcon} />
        <div className="mb-4 grid grid-cols-1 gap-4 tablet:grid-cols-4 laptop:mb-6 laptop:grid-cols-12 laptop:gap-6">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-[20px] tablet:col-span-4 laptop:col-span-4 laptop:h-48 laptop:rounded-[24px]" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (error || !health) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }}>
        <PageHeader title="System" icon={ServerStackIcon} />
        <ErrorState title="Impossible de joindre l'API Cortex" description={error ?? "Réponse vide."} onRetry={() => window.location.reload()} />
      </motion.div>
    );
  }

  const ramPercent = Math.min(100, (health.cortexServer.memoryMb / 4096) * 100);
  const storageDenominator = Math.max(health.storage.usedMb, 1);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }}>
      <PageHeader
        title="System"
        icon={ServerStackIcon}
        action={
          <GlassActionGroup>
            {vps && (
              <HoverExpandButton
                icon={PowerIcon}
                label={simulateDisconnect ? "Rétablir la connexion" : "Déconnexion locale"}
                onClick={() => setSimulateDisconnect((v) => !v)}
              />
            )}

            <Dialog open={vpsDialogOpen} onOpenChange={setVpsDialogOpen}>
              <DialogTrigger asChild>
                <HoverExpandButton icon={ServerIcon} hoverIcon={ThickPlus} label="Associer un VPS" />
              </DialogTrigger>
              <DialogContent title="Connecter un VPS" description="Ajoutez un serveur externe pour l'intégrer au cluster Cortex.">
                <div className="mt-2 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Adresse IP</label>
                    <Input placeholder="ex: 187.127.70.52" value={vpsIp} onChange={(e) => setVpsIp(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Identifiant SSH</label>
                    <Input placeholder="ex: root" value={vpsSshId} onChange={(e) => setVpsSshId(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Mot de passe SSH / Clé</label>
                    <Input type="password" placeholder="••••••••" value={vpsSshKey} onChange={(e) => setVpsSshKey(e.target.value)} />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <Button variant="ghost" onClick={() => setVpsDialogOpen(false)}>Annuler</Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      connectVps({ ip: vpsIp, sshId: vpsSshId, sshKey: vpsSshKey });
                      setVpsDialogOpen(false);
                    }}
                  >
                    Connecter
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <HoverExpandButton icon={SparklesIcon} hoverIcon={ThickPlus} label="Intégration Claude IA" />
          </GlassActionGroup>
        }
      />

      <motion.div variants={STAGGER_CONTAINER_VARIANTS} className="mb-4 grid grid-cols-1 gap-4 tablet:grid-cols-4 laptop:mb-6 laptop:grid-cols-12 laptop:gap-6">
        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-4">
          <BentoCard className="group relative h-full overflow-hidden">
            <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.03] laptop:block" />
            <motion.div
              animate={GLOW_DRIFT_A}
              transition={GLOW_DRIFT_A_TRANSITION}
              className={cn(
                "pointer-events-none absolute -right-20 -top-20 size-64 rounded-full blur-[64px] opacity-[0.10] transition-[opacity,filter] duration-700 group-hover:opacity-[0.24] group-hover:brightness-125 laptop:opacity-[0.15]",
                health.cortexServer.status === "running" && "bg-success",
                health.cortexServer.status === "degraded" && "bg-warning",
                health.cortexServer.status === "stopped" && "bg-error",
              )}
            />
            <motion.div
              animate={GLOW_DRIFT_B}
              transition={GLOW_DRIFT_B_TRANSITION}
              className={cn(
                "pointer-events-none absolute -bottom-20 -left-20 size-56 rounded-full blur-[64px] opacity-[0.06] transition-[opacity,filter] duration-700 group-hover:opacity-[0.18] group-hover:brightness-125 laptop:opacity-10",
                health.cortexServer.status === "running" && "bg-success",
                health.cortexServer.status === "degraded" && "bg-warning",
                health.cortexServer.status === "stopped" && "bg-error",
              )}
            />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-4 flex items-center justify-between laptop:mb-6">
                  <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] text-text-primary laptop:text-xs laptop:tracking-widest">
                    <Server className="size-4 stroke-[2.8]" />
                    {vps ? `VPS • ${vps.ip}` : "Core"}
                  </span>
                  <span className={cn("text-[10px] font-bold uppercase tracking-[0.08em]", health.cortexServer.status === "running" ? "text-success" : health.cortexServer.status === "degraded" ? "text-warning" : "text-error")}>{health.cortexServer.status === "running" ? "Opérationnel" : health.cortexServer.status === "degraded" ? "Dégradé" : "Arrêté"}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-5 laptop:mt-8 laptop:gap-6">
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted laptop:mb-1.5 laptop:tracking-widest">Uptime</span>
                    <span className="text-[30px] font-bold leading-none tracking-[-0.04em] text-text-primary laptop:text-3xl laptop:font-semibold laptop:tracking-tight">
                      {formatUptime(health.cortexServer.uptimeSeconds)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted laptop:mb-1.5 laptop:tracking-widest">Mémoire</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[30px] font-bold leading-none tracking-[-0.04em] text-text-primary laptop:text-3xl laptop:font-semibold laptop:tracking-tight">{health.cortexServer.memoryMb}</span>
                      <span className="text-[11px] font-medium text-text-muted">Mo</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 laptop:mt-6">
                <div className="mb-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-text-muted"><Zap className="size-3" strokeWidth={3} /> Charge RAM</span>
                  <span className="font-semibold text-text-primary">{ramPercent.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                  <motion.div className="h-full rounded-full bg-text-primary" initial={{ width: 0 }} animate={{ width: `${ramPercent}%` }} transition={{ duration: 1.5, ease: EASE_SPRING_ARRAY, delay: 0.2 }} />
                </div>
              </div>
            </div>
          </BentoCard>
        </motion.div>

        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-4">
          <BentoCard className="group relative h-full overflow-hidden">
            <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.03] laptop:block" />
            <motion.div animate={GLOW_DRIFT_A} transition={GLOW_DRIFT_A_TRANSITION} className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-[#D97757]/10 blur-[64px] transition-[background-color,filter] duration-700 group-hover:bg-[#D97757]/20 group-hover:brightness-125" />
            <motion.div animate={GLOW_DRIFT_B} transition={GLOW_DRIFT_B_TRANSITION} className="pointer-events-none absolute -bottom-20 -left-20 size-56 rounded-full bg-[#D97757]/7 blur-[64px] transition-[background-color,filter] duration-700 group-hover:bg-[#D97757]/15 group-hover:brightness-125" />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-4 flex items-center justify-between laptop:mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_8px_rgba(0,0,0,0.05)] laptop:rounded-[14px]">
                      <ClaudeMark title="Claude" className="size-5 text-[#D97757]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-text-primary laptop:text-xs laptop:tracking-widest">Claude Code</span>
                      <span className="text-[9px] font-semibold uppercase tracking-[0.11em] text-text-muted laptop:font-medium laptop:tracking-widest">Agent CLI</span>
                    </div>
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-[0.08em]", health.claudeCode.status === "available" ? "text-success" : "text-warning")}>{health.claudeCode.status === "available" ? "Disponible" : "Indisponible"}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-5 laptop:mt-8 laptop:gap-6">
                  <div className="flex min-w-0 flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted laptop:mb-1.5 laptop:tracking-widest">Appel</span>
                    <span className="line-clamp-1 text-[23px] font-bold leading-tight tracking-[-0.035em] text-text-primary laptop:mt-0.5 laptop:text-2xl laptop:font-semibold laptop:tracking-tight">
                      {health.claudeCode.lastCallAt ? formatRelativeTime(health.claudeCode.lastCallAt, now) : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted laptop:mb-1.5 laptop:tracking-widest">Ce jour</span>
                    <div className="flex items-baseline gap-1 laptop:mt-0.5">
                      <span className="text-[30px] font-bold leading-none tracking-[-0.04em] text-text-primary laptop:text-3xl laptop:font-semibold laptop:tracking-tight">{health.claudeCode.tokensUsedToday.toLocaleString("fr-FR")}</span>
                      <span className="text-[11px] font-medium text-text-muted">tk</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>
        </motion.div>

        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-4">
          <BentoCard className="group relative h-full overflow-hidden">
            <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.03] laptop:block" />
            <motion.div animate={GLOW_DRIFT_A} transition={GLOW_DRIFT_A_TRANSITION} className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-[#10A37F]/10 blur-[64px] transition-[background-color,filter] duration-700 group-hover:bg-[#10A37F]/20 group-hover:brightness-125" />
            <motion.div animate={GLOW_DRIFT_B} transition={GLOW_DRIFT_B_TRANSITION} className="pointer-events-none absolute -bottom-20 -left-20 size-56 rounded-full bg-[#10A37F]/7 blur-[64px] transition-[background-color,filter] duration-700 group-hover:bg-[#10A37F]/15 group-hover:brightness-125" />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-4 flex items-center justify-between laptop:mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_8px_rgba(0,0,0,0.05)] laptop:rounded-[14px]">
                      <OpenAiMark title="OpenAI" className="size-5 text-text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-text-primary laptop:text-xs laptop:tracking-widest">OpenAI</span>
                      <span className="text-[9px] font-semibold uppercase tracking-[0.11em] text-text-muted laptop:font-medium laptop:tracking-widest">Planner</span>
                    </div>
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-[0.08em]", health.openai.status === "available" ? "text-success" : "text-warning")}>{health.openai.status === "available" ? "Disponible" : "Indisponible"}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-5 laptop:mt-8 laptop:gap-6">
                  <div className="flex min-w-0 flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted laptop:mb-1.5 laptop:tracking-widest">Appel</span>
                    <span className="line-clamp-1 text-[23px] font-bold leading-tight tracking-[-0.035em] text-text-primary laptop:mt-0.5 laptop:text-2xl laptop:font-semibold laptop:tracking-tight">
                      {health.openai.lastCallAt ? formatRelativeTime(health.openai.lastCallAt, now) : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted laptop:mb-1.5 laptop:tracking-widest">Ce jour</span>
                    <div className="flex items-baseline gap-1 laptop:mt-0.5">
                      <span className="text-[30px] font-bold leading-none tracking-[-0.04em] text-text-primary laptop:text-3xl laptop:font-semibold laptop:tracking-tight">{health.openai.plansToday}</span>
                      <span className="text-[11px] font-medium text-text-muted">plans</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>
        </motion.div>
      </motion.div>

      <div className="mb-4 grid grid-cols-2 gap-3 tablet:grid-cols-4 laptop:mb-6 laptop:gap-6">
        <MetricTile
          id="ledger"
          icon={<ScrollText className="size-4 stroke-[2.7]" />}
          label="Cortex Ledger"
          value={health.ledger.totalEvents.toLocaleString("fr-FR")}
          sub={`${(health.ledger.sizeKb / 1024).toFixed(1)} Mo • ${health.ledger.totalEvents > 0 ? "Sain" : "Vide"}`}
        />
        <MetricTile
          id="storage"
          className="col-span-2"
          icon={<HardDrive className="size-4 stroke-[2.7]" />}
          label="Stockage utilisé"
          value={`${health.storage.usedMb} Mo`}
          sub={`sur ${(health.storage.quotaMb / 1000).toFixed(0)} Go`}
        >
          <div className="mt-3 laptop:mt-4">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-black/5">
              {health.storage.breakdown.map((item, i) => (
                <div key={i} className={cn("h-full", item.colorClass)} style={{ width: `${(item.valueMb / storageDenominator) * 100}%` }} title={`${item.label} : ${item.valueMb} Mo`} />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {health.storage.breakdown.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={cn("size-1.5 rounded-sm", item.colorClass)} />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.07em] text-text-muted laptop:font-medium laptop:tracking-wider">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </MetricTile>
        <MetricTile
          id="sse"
          icon={<Radio className="size-4 stroke-[2.7]" />}
          label="SSE"
          value={sseLabelMap[health.sse.status]}
          sub={health.sse.avgLagMs > 0 ? `${health.sse.connectedClients} client(s) · ${health.sse.avgLagMs} ms` : `${health.sse.connectedClients} client(s)`}
        />
      </div>

      <BentoCard id="errors" icon={<ExclamationTriangleIcon className="size-[18px] text-error" />} className="scroll-mt-6">
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
    </motion.div>
  );
}

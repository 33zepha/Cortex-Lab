import { useState } from "react";
import { motion } from "framer-motion";
import { Server, ScrollText, HardDrive, Radio, AlertTriangle, Plus } from "lucide-react";
import { ServerStackIcon, ExclamationTriangleIcon, PowerIcon, ServerIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  BentoCard,
  EmptyState,
  ErrorState,
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  Input,
  Skeleton,
  HoverExpandButton,
  GlassActionGroup,
} from "@/components/ui";
import { systemDisconnected } from "@/fixtures/system";
import { formatRelativeTime } from "@/lib/status";
import { EASE_SPRING_ARRAY, STAGGER_ITEM_VARIANTS } from "@/lib/animations";
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

function SectionTitle({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mb-2.5 flex items-end justify-between gap-4 px-1 laptop:mb-3">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.13em] text-text-primary">{title}</h2>
      <span className="text-[10px] font-semibold text-text-muted">{detail}</span>
    </div>
  );
}

function statusClass(status: "good" | "warning" | "bad") {
  return status === "good" ? "text-success" : status === "warning" ? "text-warning" : "text-error";
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
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-[22px] laptop:h-48 laptop:rounded-[28px]" />
          <Skeleton className="h-56 rounded-[22px] laptop:rounded-[28px]" />
          <Skeleton className="h-52 rounded-[22px] laptop:rounded-[28px]" />
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
  const storagePercent = health.storage.quotaMb > 0 ? Math.min(100, (health.storage.usedMb / health.storage.quotaMb) * 100) : 0;
  const storageDenominator = Math.max(health.storage.usedMb, 1);

  const coreStatus = health.cortexServer.status === "running" ? "Opérationnel" : health.cortexServer.status === "degraded" ? "Dégradé" : "Arrêté";
  const coreTone = health.cortexServer.status === "running" ? "good" : health.cortexServer.status === "degraded" ? "warning" : "bad";
  const claudeStatus = health.claudeCode.status === "available" ? "Disponible" : health.claudeCode.status === "degraded" ? "Dégradé" : "Indisponible";
  const claudeTone = health.claudeCode.status === "available" ? "good" : health.claudeCode.status === "degraded" ? "warning" : "bad";
  const openaiStatus = health.openai.status === "available" ? "Disponible" : "Indisponible";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }}>
      <PageHeader
        title="System"
        icon={ServerStackIcon}
        action={
          <GlassActionGroup className="p-0.5 laptop:p-1">
            {vps && (
              <HoverExpandButton
                icon={PowerIcon}
                label={simulateDisconnect ? "Rétablir" : "Déconnexion locale"}
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
            <HoverExpandButton icon={SparklesIcon} hoverIcon={ThickPlus} label="Intégration Claude" />
          </GlassActionGroup>
        }
      />

      <div className="space-y-5 laptop:space-y-7">
        <section>
          <SectionTitle title="Infrastructure" detail={vps ? `VPS ${vps.ip}` : "Core local"} />
          <motion.div variants={STAGGER_ITEM_VARIANTS}>
            <BentoCard className="group relative overflow-hidden border-white/70">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:14px_14px] opacity-[0.018]" />
              <div className={cn(
                "pointer-events-none absolute -right-16 -top-20 size-56 rounded-full blur-[70px] opacity-[0.11]",
                health.cortexServer.status === "running" ? "bg-success" : health.cortexServer.status === "degraded" ? "bg-warning" : "bg-error",
              )} />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-white/70 bg-white/52 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_4px_12px_-8px_rgba(0,0,0,0.25)]">
                      <Server className="size-[21px]" strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold tracking-[-0.015em] text-text-primary">Cortex Core</p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-text-muted">Runtime central</p>
                    </div>
                  </div>
                  <span className={cn("pt-1 text-[10px] font-bold uppercase tracking-[0.09em]", statusClass(coreTone))}>{coreStatus}</span>
                </div>

                <div className="mt-5 grid grid-cols-[1fr_1fr_auto] items-end gap-4 laptop:mt-7 laptop:max-w-2xl laptop:gap-10">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Uptime</p>
                    <p className="mt-1 text-[27px] font-bold leading-none tracking-[-0.045em] text-text-primary laptop:text-3xl">{formatUptime(health.cortexServer.uptimeSeconds)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Mémoire</p>
                    <p className="mt-1 text-[27px] font-bold leading-none tracking-[-0.045em] text-text-primary laptop:text-3xl">
                      {health.cortexServer.memoryMb}<span className="ml-1 text-[11px] font-semibold tracking-normal text-text-muted">Mo</span>
                    </p>
                  </div>
                  <div className="min-w-[62px] text-right">
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">RAM</p>
                    <p className="mt-1 text-[20px] font-bold leading-none tracking-[-0.03em] text-text-primary">{ramPercent.toFixed(0)}%</p>
                  </div>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/[0.05] laptop:max-w-2xl">
                  <motion.div className="h-full rounded-full bg-text-primary" initial={{ width: 0 }} animate={{ width: `${ramPercent}%` }} transition={{ duration: 1, ease: EASE_SPRING_ARRAY }} />
                </div>
              </div>
            </BentoCard>
          </motion.div>
        </section>

        <section>
          <SectionTitle title="Moteurs" detail="Exécution & planification" />
          <BentoCard className="overflow-hidden" padding="none">
            <div className="grid grid-cols-1 laptop:grid-cols-2">
              <div className="relative p-4 laptop:p-6">
                <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-[#D97757]/8 blur-[54px]" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-[13px] border border-white/70 bg-white/55 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_3px_10px_-7px_rgba(0,0,0,0.25)]">
                        <ClaudeMark title="Claude" className="size-5 text-[#D97757]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold tracking-[-0.015em] text-text-primary">Claude Code</p>
                        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-text-muted">Agent CLI</p>
                      </div>
                    </div>
                    <span className={cn("pt-1 text-[10px] font-bold uppercase tracking-[0.09em]", statusClass(claudeTone))}>{claudeStatus}</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Dernier appel</p>
                      <p className="mt-1 text-[19px] font-bold tracking-[-0.03em] text-text-primary">{health.claudeCode.lastCallAt ? formatRelativeTime(health.claudeCode.lastCallAt, now) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Aujourd'hui</p>
                      <p className="mt-1 text-[24px] font-bold leading-none tracking-[-0.04em] text-text-primary">
                        {health.claudeCode.tokensUsedToday.toLocaleString("fr-FR")}<span className="ml-1 text-[10px] font-semibold tracking-normal text-text-muted">tk</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative border-t border-black/[0.045] p-4 laptop:border-l laptop:border-t-0 laptop:p-6">
                <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-[#10A37F]/7 blur-[54px]" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-[13px] border border-white/70 bg-white/55 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_3px_10px_-7px_rgba(0,0,0,0.25)]">
                        <OpenAiMark title="OpenAI" className="size-5 text-text-primary" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold tracking-[-0.015em] text-text-primary">OpenAI</p>
                        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-text-muted">Planner</p>
                      </div>
                    </div>
                    <span className={cn("pt-1 text-[10px] font-bold uppercase tracking-[0.09em]", health.openai.status === "available" ? "text-success" : "text-error")}>{openaiStatus}</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Dernier appel</p>
                      <p className="mt-1 text-[19px] font-bold tracking-[-0.03em] text-text-primary">{health.openai.lastCallAt ? formatRelativeTime(health.openai.lastCallAt, now) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Aujourd'hui</p>
                      <p className="mt-1 text-[24px] font-bold leading-none tracking-[-0.04em] text-text-primary">
                        {health.openai.plansToday}<span className="ml-1 text-[10px] font-semibold tracking-normal text-text-muted">plans</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>
        </section>

        <section>
          <SectionTitle title="Données & transport" detail="Persistence, stockage, temps réel" />
          <BentoCard className="overflow-hidden" padding="none">
            <div className="grid grid-cols-2 laptop:grid-cols-4">
              <div className="border-b border-r border-black/[0.045] p-4 laptop:border-b-0 laptop:p-5">
                <div className="flex items-center gap-2 text-text-muted">
                  <ScrollText className="size-4" strokeWidth={2.8} />
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em]">Ledger</span>
                </div>
                <p className="mt-2 text-[27px] font-bold leading-none tracking-[-0.04em] text-text-primary">{health.ledger.totalEvents.toLocaleString("fr-FR")}</p>
                <p className="mt-1.5 text-[10px] font-semibold text-text-muted">{(health.ledger.sizeKb / 1024).toFixed(1)} Mo · {health.ledger.lastWriteAt ? formatRelativeTime(health.ledger.lastWriteAt, now) : "aucune écriture"}</p>
              </div>

              <div className="border-b border-black/[0.045] p-4 laptop:border-b-0 laptop:border-r laptop:p-5">
                <div className="flex items-center gap-2 text-text-muted">
                  <Radio className="size-4" strokeWidth={2.8} />
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em]">SSE</span>
                </div>
                <p className="mt-2 text-[20px] font-bold leading-none tracking-[-0.03em] text-text-primary">{sseLabelMap[health.sse.status]}</p>
                <p className="mt-1.5 text-[10px] font-semibold text-text-muted">{health.sse.connectedClients} client(s){health.sse.avgLagMs > 0 ? ` · ${health.sse.avgLagMs} ms` : ""}</p>
              </div>

              <div className="col-span-2 p-4 laptop:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 text-text-muted">
                    <HardDrive className="size-4" strokeWidth={2.8} />
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em]">Stockage</span>
                  </div>
                  <span className="text-[10px] font-bold text-text-primary">{storagePercent.toFixed(0)}%</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-[27px] font-bold leading-none tracking-[-0.04em] text-text-primary">{health.storage.usedMb}</span>
                  <span className="text-[10px] font-semibold text-text-muted">Mo / {(health.storage.quotaMb / 1000).toFixed(0)} Go</span>
                </div>
                <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05]">
                  {health.storage.breakdown.length > 0 ? health.storage.breakdown.map((item, i) => (
                    <div key={i} className={cn("h-full", item.colorClass)} style={{ width: `${(item.valueMb / storageDenominator) * Math.max(storagePercent, 0.8)}%` }} title={`${item.label}: ${item.valueMb} Mo`} />
                  )) : <div className="h-full bg-text-muted/20" style={{ width: `${storagePercent}%` }} />}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {health.storage.breakdown.map((item, i) => (
                    <span key={i} className="text-[9px] font-semibold text-text-muted">{item.label} {item.valueMb} Mo</span>
                  ))}
                </div>
              </div>
            </div>
          </BentoCard>
        </section>

        <section>
          <SectionTitle title="Incidents" detail={health.recentErrors.length === 0 ? "Aucun signal récent" : `${health.recentErrors.length} récent(s)`} />
          <BentoCard id="errors" icon={<ExclamationTriangleIcon className="size-[18px] text-error" />} className="scroll-mt-6">
            {health.recentErrors.length === 0 ? (
              <EmptyState icon={<AlertTriangle className="size-5" strokeWidth={2.8} />} title="Aucune erreur" description="Le système n'a signalé aucune erreur récente." compact />
            ) : (
              <ul className="space-y-2">
                {health.recentErrors.map((e) => (
                  <li key={e.id} className="rounded-[12px] border border-error/20 bg-error-muted/60 px-3 py-2.5 text-body-text text-text-secondary">
                    {e.message}
                    <span className="mt-1 block text-label font-semibold text-text-muted">{formatRelativeTime(e.ts, now)}</span>
                  </li>
                ))}
              </ul>
            )}
          </BentoCard>
        </section>
      </div>
    </motion.div>
  );
}

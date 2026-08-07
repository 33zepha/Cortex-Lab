import { useState } from "react";
import { motion } from "framer-motion";
import {
  Server,
  ScrollText,
  HardDrive,
  Radio,
  Plus,
  Cpu,
  Activity,
} from "lucide-react";
import { ServerStackIcon, ExclamationTriangleIcon, ServerIcon } from "@heroicons/react/24/solid";
import { PageHeader } from "@/components/shell/PageHeader";
import {
  BentoCard,
  ErrorState,
  Dialog,
  DialogTrigger,
  DialogContent,
  Input,
  Skeleton,
  HoverExpandButton,
  GlassActionGroup,
} from "@/components/ui";
import { formatRelativeTime } from "@/lib/status";
import { EASE_SPRING_ARRAY } from "@/lib/animations";
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

function SectionTitle({ index, title, detail }: { index: string; title: string; detail: string }) {
  return (
    <div className="mb-2.5 flex items-end justify-between gap-4 laptop:mb-3">
      <div className="flex min-w-0 items-baseline gap-2.5">
        <span className="font-mono text-[9px] font-bold text-text-muted/65">{index}</span>
        <h2 className="truncate text-[11px] font-bold uppercase tracking-[0.13em] text-text-primary">{title}</h2>
      </div>
      <span className="shrink-0 text-[10px] font-semibold text-text-muted">{detail}</span>
    </div>
  );
}

function statusClass(status: "good" | "warning" | "bad") {
  return status === "good" ? "text-success" : status === "warning" ? "text-warning" : "text-error";
}

function SystemSignal({
  icon,
  label,
  value,
  detail,
  tone = "good",
  border = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: "good" | "warning" | "bad";
  border?: boolean;
}) {
  return (
    <div className={cn("min-w-0 p-4 laptop:p-5", border && "border-t border-black/[0.05] tablet:border-l tablet:border-t-0")}>
      <div className="flex items-center gap-2 text-text-muted">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className={cn("mt-3 text-[18px] font-bold leading-none tracking-[-0.03em]", statusClass(tone))}>{value}</p>
      <p className="mt-1.5 text-[10px] font-semibold leading-relaxed text-text-muted">{detail}</p>
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        <PageHeader title="System" icon={ServerStackIcon} />
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-[22px]" />
          <Skeleton className="h-52 rounded-[22px]" />
          <Skeleton className="h-52 rounded-[22px]" />
        </div>
      </motion.div>
    );
  }

  if (error || !health) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
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
  const openaiTone = health.openai.status === "available" ? "good" : "bad";
  const realtimeTone = health.sse.status === "connected" ? "good" : health.sse.status === "reconnecting" ? "warning" : "bad";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28, ease: EASE_SPRING_ARRAY }}>
      <PageHeader
        title="System"
        icon={ServerStackIcon}
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
                  <span className="text-[10px] font-bold uppercase tracking-[0.11em] text-text-muted">Adresse IP</span>
                  <Input placeholder="ex: 187.127.70.52" value={vpsIp} onChange={(event) => setVpsIp(event.target.value)} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.11em] text-text-muted">Identifiant SSH</span>
                  <Input placeholder="ex: root" value={vpsSshId} onChange={(event) => setVpsSshId(event.target.value)} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.11em] text-text-muted">Mot de passe / clé</span>
                  <Input type="password" placeholder="••••••••" value={vpsSshKey} onChange={(event) => setVpsSshKey(event.target.value)} />
                </label>
              </div>
              <div className="mt-6 grid grid-cols-[auto_1fr] gap-2.5 border-t border-black/[0.05] pt-4">
                <button type="button" onClick={() => setVpsDialogOpen(false)} className="min-h-12 rounded-[14px] px-4 text-[12px] font-bold text-text-muted hover:bg-black/[0.035] hover:text-text-primary">
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    connectVps({ ip: vpsIp, sshId: vpsSshId, sshKey: vpsSshKey });
                    setVpsDialogOpen(false);
                  }}
                  className="min-h-12 rounded-[14px] bg-text-primary px-4 text-[12px] font-bold text-white shadow-[0_10px_26px_-14px_rgba(0,0,0,0.6)] active:opacity-80"
                >
                  Connecter le VPS
                </button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-5 laptop:space-y-7">
        <section>
          <SectionTitle index="00" title="Vue système" detail={vps ? `VPS ${vps.ip}` : "Runtime local"} />
          <BentoCard className="overflow-hidden" padding="none">
            <div className="grid grid-cols-1 tablet:grid-cols-3">
              <SystemSignal icon={<Server className="size-4" strokeWidth={2.9} />} label="Runtime" value={coreStatus} detail={`${formatUptime(health.cortexServer.uptimeSeconds)} d'uptime · ${health.cortexServer.memoryMb} Mo`} tone={coreTone} />
              <SystemSignal icon={<Cpu className="size-4" strokeWidth={2.9} />} label="Exécution" value={claudeStatus} detail={`Claude Code · ${health.claudeCode.tokensUsedToday.toLocaleString("fr-FR")} tk aujourd'hui`} tone={claudeTone} border />
              <SystemSignal icon={<Radio className="size-4" strokeWidth={2.9} />} label="Temps réel" value={sseLabelMap[health.sse.status]} detail={`${health.sse.connectedClients} client(s)${health.sse.avgLagMs > 0 ? ` · ${health.sse.avgLagMs} ms` : ""}`} tone={realtimeTone} border />
            </div>
          </BentoCard>
        </section>

        <section>
          <SectionTitle index="01" title="Infrastructure" detail="Cortex Core" />
          <BentoCard className="group relative overflow-hidden border-white/70">
            <ServerStackIcon className="pointer-events-none absolute -right-5 -top-8 size-[132px] -rotate-6 text-text-primary opacity-[0.025]" aria-hidden />
            <div className={cn("pointer-events-none absolute -right-16 -top-20 size-56 rounded-full blur-[70px] opacity-[0.10]", health.cortexServer.status === "running" ? "bg-success" : health.cortexServer.status === "degraded" ? "bg-warning" : "bg-error")} />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-white/70 bg-white/52 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_4px_12px_-8px_rgba(0,0,0,0.25)]">
                    <Server className="size-[21px]" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold tracking-[-0.02em] text-text-primary">Cortex Core</p>
                    <p className={cn("mt-0.5 text-[10px] font-bold", statusClass(coreTone))}>{coreStatus}</p>
                  </div>
                </div>
                <span className="font-mono text-[9px] font-semibold text-text-muted">runtime</span>
              </div>
              <div className="mt-5 grid grid-cols-[1fr_1fr_auto] items-end gap-4 laptop:mt-7 laptop:max-w-2xl laptop:gap-10">
                <div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Uptime</p><p className="mt-1 text-[27px] font-bold leading-none tracking-[-0.045em] text-text-primary laptop:text-3xl">{formatUptime(health.cortexServer.uptimeSeconds)}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Mémoire</p><p className="mt-1 text-[27px] font-bold leading-none tracking-[-0.045em] text-text-primary laptop:text-3xl">{health.cortexServer.memoryMb}<span className="ml-1 text-[11px] font-semibold tracking-normal text-text-muted">Mo</span></p></div>
                <div className="min-w-[62px] text-right"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">RAM</p><p className="mt-1 text-[20px] font-bold leading-none tracking-[-0.03em] text-text-primary">{ramPercent.toFixed(0)}%</p></div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/[0.05] laptop:max-w-2xl"><motion.div className="h-full rounded-full bg-text-primary" initial={{ width: 0 }} animate={{ width: `${ramPercent}%` }} transition={{ duration: 0.8, ease: EASE_SPRING_ARRAY }} /></div>
            </div>
          </BentoCard>
        </section>

        <section>
          <SectionTitle index="02" title="Moteurs" detail="Exécution & planification" />
          <BentoCard className="overflow-hidden" padding="none">
            <div className="grid grid-cols-1 laptop:grid-cols-2">
              <div className="relative p-4 laptop:p-6">
                <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-[#D97757]/8 blur-[54px]" />
                <div className="relative z-10">
                  <div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-[13px] border border-white/70 bg-white/55 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_3px_10px_-7px_rgba(0,0,0,0.25)]"><ClaudeMark title="Claude" className="size-5 text-[#D97757]" /></div><div className="min-w-0 flex-1"><p className="text-[13px] font-bold tracking-[-0.015em] text-text-primary">Claude Code</p><p className={cn("mt-0.5 text-[10px] font-bold", statusClass(claudeTone))}>{claudeStatus}</p></div><span className="font-mono text-[9px] font-semibold text-text-muted">agent cli</span></div>
                  <div className="mt-5 grid grid-cols-2 gap-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Dernier appel</p><p className="mt-1 text-[19px] font-bold tracking-[-0.03em] text-text-primary">{health.claudeCode.lastCallAt ? formatRelativeTime(health.claudeCode.lastCallAt, now) : "—"}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Aujourd'hui</p><p className="mt-1 text-[24px] font-bold leading-none tracking-[-0.04em] text-text-primary">{health.claudeCode.tokensUsedToday.toLocaleString("fr-FR")}<span className="ml-1 text-[10px] font-semibold tracking-normal text-text-muted">tk</span></p></div></div>
                </div>
              </div>
              <div className="relative border-t border-black/[0.045] p-4 laptop:border-l laptop:border-t-0 laptop:p-6">
                <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-[#10A37F]/7 blur-[54px]" />
                <div className="relative z-10">
                  <div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-[13px] border border-white/70 bg-white/55 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_3px_10px_-7px_rgba(0,0,0,0.25)]"><OpenAiMark title="OpenAI" className="size-5 text-text-primary" /></div><div className="min-w-0 flex-1"><p className="text-[13px] font-bold tracking-[-0.015em] text-text-primary">OpenAI</p><p className={cn("mt-0.5 text-[10px] font-bold", statusClass(openaiTone))}>{openaiStatus}</p></div><span className="font-mono text-[9px] font-semibold text-text-muted">planner</span></div>
                  <div className="mt-5 grid grid-cols-2 gap-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Dernier appel</p><p className="mt-1 text-[19px] font-bold tracking-[-0.03em] text-text-primary">{health.openai.lastCallAt ? formatRelativeTime(health.openai.lastCallAt, now) : "—"}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Aujourd'hui</p><p className="mt-1 text-[24px] font-bold leading-none tracking-[-0.04em] text-text-primary">{health.openai.plansToday}<span className="ml-1 text-[10px] font-semibold tracking-normal text-text-muted">plans</span></p></div></div>
                </div>
              </div>
            </div>
          </BentoCard>
        </section>

        <section>
          <SectionTitle index="03" title="Données & transport" detail="Persistance & temps réel" />
          <BentoCard className="overflow-hidden" padding="none">
            <div className="grid grid-cols-2 laptop:grid-cols-4">
              <div className="border-b border-r border-black/[0.045] p-4 laptop:border-b-0 laptop:p-5"><div className="flex items-center gap-2 text-text-muted"><ScrollText className="size-4" strokeWidth={2.8} /><span className="text-[9px] font-bold uppercase tracking-[0.12em]">Ledger</span></div><p className="mt-2 text-[27px] font-bold leading-none tracking-[-0.04em] text-text-primary">{health.ledger.totalEvents.toLocaleString("fr-FR")}</p><p className="mt-1.5 text-[10px] font-semibold text-text-muted">{(health.ledger.sizeKb / 1024).toFixed(1)} Mo · {health.ledger.lastWriteAt ? formatRelativeTime(health.ledger.lastWriteAt, now) : "aucune écriture"}</p></div>
              <div className="border-b border-black/[0.045] p-4 laptop:border-b-0 laptop:border-r laptop:p-5"><div className="flex items-center gap-2 text-text-muted"><Radio className="size-4" strokeWidth={2.8} /><span className="text-[9px] font-bold uppercase tracking-[0.12em]">SSE</span></div><p className={cn("mt-2 text-[20px] font-bold leading-none tracking-[-0.03em]", statusClass(realtimeTone))}>{sseLabelMap[health.sse.status]}</p><p className="mt-1.5 text-[10px] font-semibold text-text-muted">{health.sse.connectedClients} client(s){health.sse.avgLagMs > 0 ? ` · ${health.sse.avgLagMs} ms` : ""}</p></div>
              <div className="col-span-2 p-4 laptop:p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-2 text-text-muted"><HardDrive className="size-4" strokeWidth={2.8} /><span className="text-[9px] font-bold uppercase tracking-[0.12em]">Stockage</span></div><span className="text-[10px] font-bold text-text-primary">{storagePercent.toFixed(0)}%</span></div><div className="mt-2 flex items-baseline gap-1.5"><span className="text-[27px] font-bold leading-none tracking-[-0.04em] text-text-primary">{health.storage.usedMb}</span><span className="text-[10px] font-semibold text-text-muted">Mo / {(health.storage.quotaMb / 1000).toFixed(0)} Go</span></div><div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05]">{health.storage.breakdown.length > 0 ? health.storage.breakdown.map((item, index) => <div key={index} className={cn("h-full", item.colorClass)} style={{ width: `${(item.valueMb / storageDenominator) * Math.max(storagePercent, 0.8)}%` }} title={`${item.label}: ${item.valueMb} Mo`} />) : <div className="h-full bg-text-muted/20" style={{ width: `${storagePercent}%` }} />}</div><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{health.storage.breakdown.map((item, index) => <span key={index} className="text-[9px] font-semibold text-text-muted">{item.label} {item.valueMb} Mo</span>)}</div></div>
            </div>
          </BentoCard>
        </section>

        <section>
          <SectionTitle index="04" title="Incidents" detail={health.recentErrors.length === 0 ? "Aucun signal récent" : `${health.recentErrors.length} récent(s)`} />
          <BentoCard id="errors" className="scroll-mt-6" padding="none">
            {health.recentErrors.length === 0 ? (
              <div className="flex items-center gap-3 p-4 laptop:p-5"><div className="flex size-10 shrink-0 items-center justify-center rounded-[13px] border border-white/70 bg-white/55 text-success shadow-[inset_0_1px_1px_rgba(255,255,255,1)]"><Activity className="size-5" strokeWidth={2.8} /></div><div><p className="text-[13px] font-bold tracking-[-0.015em] text-text-primary">Aucune erreur récente</p><p className="mt-0.5 text-[10px] font-semibold text-text-muted">Le runtime n'a remonté aucun incident.</p></div></div>
            ) : (
              <div className="p-3 laptop:p-4"><div className="mb-3 flex items-center gap-2 text-error"><ExclamationTriangleIcon className="size-[18px]" /><span className="text-[10px] font-bold uppercase tracking-[0.11em]">Signaux récents</span></div><ul className="space-y-2">{health.recentErrors.map((item) => <li key={item.id} className="rounded-[13px] border border-error/18 bg-error-muted/45 px-3.5 py-3 text-[12px] font-semibold leading-relaxed text-text-secondary">{item.message}<span className="mt-1 block text-[10px] font-semibold text-text-muted">{formatRelativeTime(item.ts, now)}</span></li>)}</ul></div>
            )}
          </BentoCard>
        </section>
      </div>
    </motion.div>
  );
}

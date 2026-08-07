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

const sseLabelMap: Record<SseStatus, string> = { connected: "Connecté", reconnecting: "Reconnexion…", disconnected: "Déconnecté" };

const ThickPlus = (props: any) => <Plus strokeWidth={3.5} {...props} />;



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
    <div id={id} className={cn("scroll-mt-6 rounded-[24px] bg-white/60 backdrop-blur-xl border border-white/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] px-5 py-4", className)}>
      <div className="flex items-center gap-2 text-text-muted">
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">{value}</p>
      {sub && <p className="mt-1 text-[11px] font-medium text-text-muted">{sub}</p>}
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
        <div className="grid grid-cols-1 gap-6 tablet:grid-cols-4 laptop:grid-cols-12 mb-6">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="tablet:col-span-4 laptop:col-span-4 h-48 rounded-[24px]" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (error || !health) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }}>
        <PageHeader title="System" icon={ServerStackIcon} />
        <ErrorState
          title="Impossible de joindre l'API Cortex"
          description={error ?? "Réponse vide."}
          onRetry={() => window.location.reload()}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }}
    >
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
                <HoverExpandButton 
                  icon={ServerIcon}
                  hoverIcon={ThickPlus}
                  label="Associer un VPS"
                />
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
                  <Button variant="primary" onClick={() => {
                    connectVps({ ip: vpsIp, sshId: vpsSshId, sshKey: vpsSshKey });
                    setVpsDialogOpen(false);
                  }}>Connecter</Button>
                </div>
              </DialogContent>
            </Dialog>

            <HoverExpandButton 
              icon={SparklesIcon}
              hoverIcon={ThickPlus}
              label="Intégration Claude IA"
            />
          </GlassActionGroup>
        }
      />

      {/* Bentos principaux : VPS, Claude Code, Codex */}
      <motion.div variants={STAGGER_CONTAINER_VARIANTS} className="grid grid-cols-1 gap-6 tablet:grid-cols-4 laptop:grid-cols-12 mb-6">
        
        {/* Bento VPS / Core */}
        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-4">
          <BentoCard className="relative h-full overflow-hidden group">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.03] pointer-events-none" />
            <motion.div
              animate={GLOW_DRIFT_A}
              transition={GLOW_DRIFT_A_TRANSITION}
              className={cn(
                "absolute -right-20 -top-20 size-64 blur-[64px] rounded-full transition-[opacity,filter] duration-700 pointer-events-none opacity-[0.15] group-hover:opacity-[0.28] group-hover:brightness-125",
                health.cortexServer.status === "running" && "bg-success",
                health.cortexServer.status === "degraded" && "bg-warning",
                health.cortexServer.status === "stopped" && "bg-error"
              )}
            />
            <motion.div
              animate={GLOW_DRIFT_B}
              transition={GLOW_DRIFT_B_TRANSITION}
              className={cn(
                "absolute -left-20 -bottom-20 size-56 blur-[64px] rounded-full transition-[opacity,filter] duration-700 pointer-events-none opacity-10 group-hover:opacity-[0.22] group-hover:brightness-125",
                health.cortexServer.status === "running" && "bg-success",
                health.cortexServer.status === "degraded" && "bg-warning",
                health.cortexServer.status === "stopped" && "bg-error"
              )}
            />
            
            <div className="relative flex flex-col h-full justify-between z-10">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-text-primary flex items-center gap-2">
                    <Server className="size-4" /> 
                    {vps ? `VPS • ${vps.ip}` : "Core"}
                  </span>
                </div>
                
                <div className="mt-8 grid grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Uptime</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-3xl font-semibold tracking-tight text-text-primary">
                        {Math.floor(health.cortexServer.uptimeSeconds / 3600)}
                      </span>
                      <span className="text-[11px] font-medium text-text-muted">h</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Mémoire</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-3xl font-semibold tracking-tight text-text-primary">
                        {health.cortexServer.memoryMb}
                      </span>
                      <span className="text-[11px] font-medium text-text-muted">Mo</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5 text-text-muted"><Zap className="size-3" strokeWidth={3} /> Charge RAM</span>
                  <span className="text-text-primary font-semibold">{(health.cortexServer.memoryMb / 4096 * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-text-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(health.cortexServer.memoryMb / 4096) * 100}%` }}
                    transition={{ duration: 1.5, ease: EASE_SPRING_ARRAY, delay: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </BentoCard>
        </motion.div>

        {/* Bento Claude Code */}
        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-4">
          <BentoCard className="relative h-full overflow-hidden group">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.03] pointer-events-none" />
            <motion.div
              animate={GLOW_DRIFT_A}
              transition={GLOW_DRIFT_A_TRANSITION}
              className="absolute -right-20 -top-20 size-64 bg-[#D97757]/10 blur-[64px] rounded-full transition-[background-color,filter] duration-700 group-hover:bg-[#D97757]/20 group-hover:brightness-125 pointer-events-none"
            />
            <motion.div
              animate={GLOW_DRIFT_B}
              transition={GLOW_DRIFT_B_TRANSITION}
              className="absolute -left-20 -bottom-20 size-56 bg-[#D97757]/10 blur-[64px] rounded-full transition-[background-color,filter] duration-700 group-hover:bg-[#D97757]/15 group-hover:brightness-125 pointer-events-none"
            />

            <div className="relative flex flex-col h-full justify-between z-10">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_8px_rgba(0,0,0,0.05)]">
                      <ClaudeMark title="Claude" className="size-5 text-[#D97757]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-widest text-text-primary">Claude Code</span>
                      <span className="text-[9px] font-medium text-text-muted uppercase tracking-widest">Agent CLI</span>
                    </div>
                  </div>
                  <div className={cn(
                    "size-2 rounded-full",
                    health.claudeCode.status === "available" ? "bg-success" : "bg-warning"
                  )} />
                </div>
                <div className="mt-8 grid grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Appel</span>
                    <span className="text-2xl font-semibold tracking-tight text-text-primary mt-0.5 line-clamp-1">
                      {health.claudeCode.lastCallAt ? formatRelativeTime(health.claudeCode.lastCallAt, now) : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Ce jour</span>
                    <div className="flex items-baseline gap-0.5 mt-0.5">
                      <span className="text-3xl font-semibold tracking-tight text-text-primary">
                        {health.claudeCode.tokensUsedToday.toLocaleString("fr-FR")}
                      </span>
                      <span className="text-[11px] font-medium text-text-muted">tk</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>
        </motion.div>

        {/* Bento OpenAI (Planner) */}
        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-4">
          <BentoCard className="relative h-full overflow-hidden group">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.03] pointer-events-none" />
            <motion.div
              animate={GLOW_DRIFT_A}
              transition={GLOW_DRIFT_A_TRANSITION}
              className="absolute -right-20 -top-20 size-64 bg-[#10A37F]/10 blur-[64px] rounded-full transition-[background-color,filter] duration-700 group-hover:bg-[#10A37F]/20 group-hover:brightness-125 pointer-events-none"
            />
            <motion.div
              animate={GLOW_DRIFT_B}
              transition={GLOW_DRIFT_B_TRANSITION}
              className="absolute -left-20 -bottom-20 size-56 bg-[#10A37F]/10 blur-[64px] rounded-full transition-[background-color,filter] duration-700 group-hover:bg-[#10A37F]/15 group-hover:brightness-125 pointer-events-none"
            />

            <div className="relative flex flex-col h-full justify-between z-10">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_8px_rgba(0,0,0,0.05)]">
                      <OpenAiMark title="OpenAI" className="size-5 text-text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-widest text-text-primary">OpenAI</span>
                      <span className="text-[9px] font-medium text-text-muted uppercase tracking-widest">Planner</span>
                    </div>
                  </div>
                  <div className={cn(
                    "size-2 rounded-full",
                    health.openai.status === "available" ? "bg-success" : "bg-warning"
                  )} />
                </div>
                <div className="mt-8 grid grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Appel</span>
                    <span className="text-2xl font-semibold tracking-tight text-text-primary mt-0.5 line-clamp-1">
                      {health.openai.lastCallAt ? formatRelativeTime(health.openai.lastCallAt, now) : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Ce jour</span>
                    <div className="flex items-baseline gap-0.5 mt-0.5">
                      <span className="text-3xl font-semibold tracking-tight text-text-primary">
                        {health.openai.plansToday}
                      </span>
                      <span className="text-[11px] font-medium text-text-muted">plans</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>
        </motion.div>

      </motion.div>

      {/* Tuiles secondaires discrètes */}
      <div className="mb-6 grid grid-cols-2 gap-6 tablet:grid-cols-4">
        <MetricTile 
          id="ledger" 
          icon={<ScrollText className="size-3.5" />} 
          label="Cortex Ledger" 
          value={health.ledger.totalEvents.toLocaleString("fr-FR")} 
          sub={`${(health.ledger.sizeKb / 1024).toFixed(1)} Mo • ${health.ledger.totalEvents > 0 ? "Sain" : "Vide"}`}
        />
        <MetricTile 
          id="storage" 
          className="col-span-2"
          icon={<HardDrive className="size-3.5" />} 
          label="Stockage utilisé" 
          value={`${health.storage.usedMb} Mo`} 
          sub={`sur ${(health.storage.quotaMb / 1000).toFixed(0)} Go`}
        >
          <div className="mt-4">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-black/5">
              {health.storage.breakdown.map((item, i) => (
                <div 
                  key={i}
                  className={cn("h-full", item.colorClass)}
                  style={{ width: `${(item.valueMb / health.storage.usedMb) * 100}%` }}
                  title={`${item.label} : ${item.valueMb} Mo`}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {health.storage.breakdown.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={cn("size-2 rounded-full", item.colorClass)} />
                  <span className="text-[9px] font-medium uppercase tracking-wider text-text-muted">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </MetricTile>
        <MetricTile id="sse" icon={<Radio className="size-3.5" />} label="SSE" value={sseLabelMap[health.sse.status]} sub={health.sse.avgLagMs > 0 ? `${health.sse.connectedClients} client(s) · ${health.sse.avgLagMs} ms` : `${health.sse.connectedClients} client(s)`} />
      </div>

      {/* Erreurs récentes — grande carte */}
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

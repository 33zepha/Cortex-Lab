import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Squares2X2Icon } from "@heroicons/react/24/solid";
import { PageHeader } from "@/components/shell/PageHeader";
import { BentoCard } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  EASE_SPRING_ARRAY,
  STAGGER_CONTAINER_VARIANTS,
  STAGGER_ITEM_VARIANTS,
  GLOW_DRIFT_A,
  GLOW_DRIFT_A_TRANSITION,
  GLOW_DRIFT_B,
  GLOW_DRIFT_B_TRANSITION,
} from "@/lib/animations";
import { formatRelativeTime } from "@/lib/status";
import { useVps } from "@/lib/VpsContext";
import { useMissions } from "@/lib/useMissions";
import { useSystemHealth } from "@/lib/useSystemHealth";
import { useTokenUsage } from "@/lib/useTokenUsage";
import { ClaudeMark } from "@/components/brand/ClaudeMark";
import { KpiRow } from "@/screens/overview/KpiRow";
import { MiniKanban } from "@/screens/overview/MiniKanban";
import { TokenUsageChart, TokenPoint } from "@/screens/overview/TokenUsageChart";

const now = Date.now();

const EMPTY_HEALTH = {
  cortexServer: { status: "stopped" as const, uptimeSeconds: 0, memoryMb: 0 },
  claudeCode: { status: "unavailable" as const, lastCallAt: null, tokensUsedToday: 0 },
};

export function OverviewScreen() {
  const [hoveredPoint, setHoveredPoint] = useState<TokenPoint | null>(null);
  const { vps } = useVps();
  const { missions, error: missionsError } = useMissions();
  const { health, error: healthError } = useSystemHealth();
  const { data: weeklyTokenUsage, error: tokensError } = useTokenUsage();
  const activeMissions = missions ?? [];
  const liveHealth = health ?? EMPTY_HEALTH;

  const recentActivity = useMemo(
    () =>
      activeMissions
        .flatMap((m) => m.timeline.map((t) => ({ ...t, missionId: m.id, objective: m.objective })))
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 5),
    [activeMissions],
  );

  const totalTokens = weeklyTokenUsage.reduce((sum, d) => sum + d.tokens, 0);
  const dayOverDayChange = useMemo(() => {
    const last = weeklyTokenUsage.at(-1);
    const prev = weeklyTokenUsage.at(-2);
    if (!last || !prev || prev.tokens === 0) return null;
    return Math.round(((last.tokens - prev.tokens) / prev.tokens) * 100);
  }, [weeklyTokenUsage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }}
    >
      <PageHeader title="Overview" icon={Squares2X2Icon} />

      {(healthError || missionsError || tokensError) && (
        <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex flex-col gap-1">
          <span className="text-sm font-bold text-error">Erreur de connexion API</span>
          <span className="text-xs text-text-primary/70">
            {healthError || missionsError || tokensError}
          </span>
          <span className="text-xs text-text-primary/70 mt-2">
            Sur Vercel, assurez-vous que les variables d'environnement <code>CORTEX_API_ORIGIN</code> et <code>CORTEX_API_TOKEN</code> sont bien configurées vers un backend public.
          </span>
        </div>
      )}

      <div className="mb-10">
        <KpiRow missions={activeMissions} />
      </div>

      <motion.div
        variants={STAGGER_CONTAINER_VARIANTS}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 tablet:grid-cols-4 laptop:grid-cols-12 auto-rows-min"
      >
        {/* ROW 1: Mini Kanban & Activité */}
        <motion.div variants={STAGGER_ITEM_VARIANTS} className="laptop:col-span-8">
          <MiniKanban missions={activeMissions} />
        </motion.div>

        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-4">
          <BentoCard className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-text-primary">Journal</span>
              </div>
              <ul className="relative space-y-5 before:absolute before:inset-y-1.5 before:left-[7px] before:w-[2px] before:bg-black/[0.04]">
                {recentActivity.slice(0, 3).map((ev) => (
                  <li key={ev.id} className="relative flex gap-4">
                    <div className="mt-1 size-4 shrink-0 rounded-full bg-[#FAFAFA] border-[3px] border-black/5 shadow-sm z-10" />
                    <div className="min-w-0 flex-1 pb-1">
                      <p className="text-[12px] font-semibold leading-tight text-text-primary line-clamp-2">{ev.title}</p>
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mt-1.5">{formatRelativeTime(ev.ts, now)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </BentoCard>
        </motion.div>

        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-4">
          <BentoCard
            className="h-full flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-semibold tracking-tight text-text-primary">
                  {(hoveredPoint ? hoveredPoint.tokens : totalTokens).toLocaleString("fr-FR")}
                </span>
                {hoveredPoint ? (
                  <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-text-muted bg-black/[0.04] px-1.5 py-0.5 rounded transition-all duration-200">
                    {hoveredPoint.day}
                  </span>
                ) : dayOverDayChange !== null ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded transition-all duration-200",
                      dayOverDayChange >= 0 ? "text-success bg-success/10" : "text-error bg-error/10",
                    )}
                  >
                    <TrendingUp className={cn("size-3", dayOverDayChange < 0 && "rotate-180")} strokeWidth={3} />
                    {dayOverDayChange >= 0 ? "+" : ""}
                    {dayOverDayChange}%
                  </span>
                ) : null}
              </div>
              
              <div className="mt-5 w-full">
                <TokenUsageChart 
                  data={weeklyTokenUsage} 
                  onHoverPoint={setHoveredPoint} 
                />
              </div>
            </div>
            
            <div className="mt-5 flex justify-end w-full">
              <Link 
                to="#" 
                className="group inline-flex items-center gap-1 text-[11px] font-medium text-text-muted/50 transition-colors hover:text-text-primary"
              >
                Détails <ArrowRight className="size-3 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </BentoCard>
        </motion.div>

        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-4">
          <BentoCard className="relative h-full overflow-hidden group">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.03] pointer-events-none" />
            <motion.div
              animate={GLOW_DRIFT_A}
              transition={GLOW_DRIFT_A_TRANSITION}
              className={cn(
                "absolute -right-20 -top-20 size-64 blur-[64px] rounded-full transition-[opacity,filter] duration-700 pointer-events-none opacity-[0.15] group-hover:opacity-[0.28] group-hover:brightness-125",
                liveHealth.cortexServer.status === "running" && "bg-success",
                liveHealth.cortexServer.status === "degraded" && "bg-warning",
                liveHealth.cortexServer.status === "stopped" && "bg-error"
              )}
            />
            <motion.div
              animate={GLOW_DRIFT_B}
              transition={GLOW_DRIFT_B_TRANSITION}
              className={cn(
                "absolute -left-20 -bottom-20 size-56 blur-[64px] rounded-full transition-[opacity,filter] duration-700 pointer-events-none opacity-10 group-hover:opacity-[0.22] group-hover:brightness-125",
                liveHealth.cortexServer.status === "running" && "bg-success",
                liveHealth.cortexServer.status === "degraded" && "bg-warning",
                liveHealth.cortexServer.status === "stopped" && "bg-error"
              )}
            />
            
            <div className="relative flex flex-col h-full justify-between z-10">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-text-primary">
                    {vps ? `VPS • ${vps.ip}` : "Core"}
                  </span>
                </div>
                
                <div className="mt-8 grid grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Uptime</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-3xl font-semibold tracking-tight text-text-primary">
                        {Math.floor(liveHealth.cortexServer.uptimeSeconds / 3600)}
                      </span>
                      <span className="text-[11px] font-medium text-text-muted">h</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Mémoire</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-3xl font-semibold tracking-tight text-text-primary">
                        {liveHealth.cortexServer.memoryMb}
                      </span>
                      <span className="text-[11px] font-medium text-text-muted">Mo</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5 text-text-muted"><Zap className="size-3" strokeWidth={3} /> Charge RAM</span>
                  <span className="text-text-primary font-semibold">{(liveHealth.cortexServer.memoryMb / 4096 * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-text-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(liveHealth.cortexServer.memoryMb / 4096) * 100}%` }}
                    transition={{ duration: 1.5, ease: EASE_SPRING_ARRAY, delay: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </BentoCard>
        </motion.div>

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
                </div>
                <div className="mt-8 grid grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Appel</span>
                    <span className="text-2xl font-semibold tracking-tight text-text-primary mt-0.5 line-clamp-1">
                      {liveHealth.claudeCode.lastCallAt ? formatRelativeTime(liveHealth.claudeCode.lastCallAt, now) : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Ce jour</span>
                    <div className="flex items-baseline gap-0.5 mt-0.5">
                      <span className="text-3xl font-semibold tracking-tight text-text-primary">
                        {liveHealth.claudeCode.tokensUsedToday.toLocaleString("fr-FR")}
                      </span>
                      <span className="text-[11px] font-medium text-text-muted">tk</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

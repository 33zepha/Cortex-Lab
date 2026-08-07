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
  const ramPercent = Math.min(100, (liveHealth.cortexServer.memoryMb / 4096) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }}>
      <PageHeader title="Overview" icon={Squares2X2Icon} />

      {(healthError || missionsError || tokensError) && (
        <div className="mb-4 flex flex-col gap-1 rounded-[18px] border border-error/20 bg-error/10 p-4 laptop:mb-6 laptop:rounded-xl">
          <span className="text-sm font-bold text-error">Erreur de connexion API</span>
          <span className="text-xs text-text-primary/70">{healthError || missionsError || tokensError}</span>
          <span className="mt-2 text-xs text-text-primary/70">
            Sur Vercel, assurez-vous que les variables d'environnement <code>CORTEX_API_ORIGIN</code> et <code>CORTEX_API_TOKEN</code> sont bien configurées vers un backend public.
          </span>
        </div>
      )}

      <div className="mb-4 laptop:mb-10">
        <KpiRow missions={activeMissions} />
      </div>

      <motion.div
        variants={STAGGER_CONTAINER_VARIANTS}
        initial="hidden"
        animate="show"
        className="grid auto-rows-min grid-cols-1 gap-4 tablet:grid-cols-4 laptop:grid-cols-12 laptop:gap-6"
      >
        <motion.div variants={STAGGER_ITEM_VARIANTS} className="laptop:col-span-8">
          <MiniKanban missions={activeMissions} />
        </motion.div>

        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-4">
          <BentoCard className="flex h-full flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between laptop:mb-6">
                <span className="text-[12px] font-bold uppercase tracking-[0.11em] text-text-primary laptop:text-xs laptop:tracking-widest">Journal</span>
                <span className="text-[10px] font-semibold text-text-muted">{recentActivity.length > 0 ? `${Math.min(recentActivity.length, 3)} récents` : "Calme"}</span>
              </div>
              {recentActivity.length === 0 ? (
                <p className="text-xs font-medium leading-relaxed text-text-muted">Aucune activité récente. Lancez votre première mission pour enregistrer les événements.</p>
              ) : (
                <ul className="relative space-y-4 before:absolute before:inset-y-1 before:left-[5px] before:w-px before:bg-black/[0.05] laptop:space-y-5 laptop:before:left-[7px] laptop:before:w-[2px]">
                  {recentActivity.slice(0, 3).map((ev) => (
                    <li key={ev.id} className="relative flex gap-3 laptop:gap-4">
                      <div className="z-10 mt-1.5 size-[11px] shrink-0 rounded-[3px] border-2 border-black/[0.08] bg-[#FAFAFA] laptop:mt-1 laptop:size-4 laptop:rounded-full laptop:border-[3px]" />
                      <div className="min-w-0 flex-1 pb-0.5 laptop:pb-1">
                        <p className="line-clamp-2 text-[13px] font-bold leading-tight tracking-[-0.01em] text-text-primary laptop:text-[12px] laptop:font-semibold laptop:tracking-normal">{ev.title}</p>
                        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.08em] text-text-muted laptop:mt-1.5 laptop:tracking-wider">{formatRelativeTime(ev.ts, now)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </BentoCard>
        </motion.div>

        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-4">
          <BentoCard className="flex h-full flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-text-muted">Tokens · 7 jours</p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-[34px] font-bold leading-none tracking-[-0.045em] text-text-primary laptop:text-3xl laptop:font-semibold laptop:tracking-tight">
                      {(hoveredPoint ? hoveredPoint.tokens : totalTokens).toLocaleString("fr-FR")}
                    </span>
                    <span className="text-[11px] font-semibold text-text-muted">tk</span>
                  </div>
                </div>
                <div className="pt-0.5 text-right">
                  {hoveredPoint ? (
                    <span className="text-[11px] font-bold text-text-muted">{hoveredPoint.day}</span>
                  ) : dayOverDayChange !== null ? (
                    <span className={cn("inline-flex items-center gap-1 text-[11px] font-bold", dayOverDayChange >= 0 ? "text-success" : "text-error")}>
                      <TrendingUp className={cn("size-3.5", dayOverDayChange < 0 && "rotate-180")} strokeWidth={3} />
                      {dayOverDayChange >= 0 ? "+" : ""}{dayOverDayChange}%
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-text-muted">Cette semaine</span>
                  )}
                </div>
              </div>

              <div className="mt-3 w-full laptop:mt-5">
                <TokenUsageChart data={weeklyTokenUsage} onHoverPoint={setHoveredPoint} />
              </div>
            </div>

            <div className="mt-3 flex w-full justify-end laptop:mt-5">
              <Link to="#" className="group inline-flex min-h-10 items-center gap-1.5 text-[12px] font-bold text-text-primary/70 transition-colors hover:text-text-primary laptop:min-h-0 laptop:text-[11px] laptop:font-medium laptop:text-text-muted/50">
                Détails <ArrowRight className="size-3.5 stroke-[2.8] transition-transform duration-300 group-hover:translate-x-0.5 laptop:size-3" />
              </Link>
            </div>
          </BentoCard>
        </motion.div>

        <motion.div variants={STAGGER_ITEM_VARIANTS} className="tablet:col-span-4 laptop:col-span-4">
          <BentoCard className="group relative h-full overflow-hidden">
            <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.03] laptop:block" />
            <motion.div
              animate={GLOW_DRIFT_A}
              transition={GLOW_DRIFT_A_TRANSITION}
              className={cn(
                "pointer-events-none absolute -right-20 -top-20 size-64 rounded-full blur-[64px] opacity-[0.10] transition-[opacity,filter] duration-700 group-hover:opacity-[0.24] group-hover:brightness-125 laptop:opacity-[0.15]",
                liveHealth.cortexServer.status === "running" && "bg-success",
                liveHealth.cortexServer.status === "degraded" && "bg-warning",
                liveHealth.cortexServer.status === "stopped" && "bg-error",
              )}
            />
            <motion.div
              animate={GLOW_DRIFT_B}
              transition={GLOW_DRIFT_B_TRANSITION}
              className={cn(
                "pointer-events-none absolute -bottom-20 -left-20 size-56 rounded-full blur-[64px] opacity-[0.06] transition-[opacity,filter] duration-700 group-hover:opacity-[0.18] group-hover:brightness-125 laptop:opacity-10",
                liveHealth.cortexServer.status === "running" && "bg-success",
                liveHealth.cortexServer.status === "degraded" && "bg-warning",
                liveHealth.cortexServer.status === "stopped" && "bg-error",
              )}
            />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-4 flex items-center justify-between laptop:mb-6">
                  <span className="text-[12px] font-bold uppercase tracking-[0.11em] text-text-primary laptop:text-xs laptop:tracking-widest">{vps ? `VPS • ${vps.ip}` : "Core"}</span>
                  <span className={cn("text-[10px] font-bold uppercase tracking-[0.08em]", liveHealth.cortexServer.status === "running" ? "text-success" : liveHealth.cortexServer.status === "degraded" ? "text-warning" : "text-error")}>{liveHealth.cortexServer.status === "running" ? "Opérationnel" : liveHealth.cortexServer.status === "degraded" ? "Dégradé" : "Arrêté"}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-5 laptop:mt-8 laptop:gap-6">
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted laptop:mb-1.5 laptop:tracking-widest">Uptime</span>
                    <span className="text-[30px] font-bold leading-none tracking-[-0.04em] text-text-primary laptop:text-3xl laptop:font-semibold laptop:tracking-tight">{formatUptime(liveHealth.cortexServer.uptimeSeconds)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted laptop:mb-1.5 laptop:tracking-widest">Mémoire</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[30px] font-bold leading-none tracking-[-0.04em] text-text-primary laptop:text-3xl laptop:font-semibold laptop:tracking-tight">{liveHealth.cortexServer.memoryMb}</span>
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
                  <span className={cn("text-[10px] font-bold uppercase tracking-[0.08em]", liveHealth.claudeCode.status === "available" ? "text-success" : "text-warning")}>{liveHealth.claudeCode.status === "available" ? "Disponible" : "Indisponible"}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-5 laptop:mt-8 laptop:gap-6">
                  <div className="flex min-w-0 flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted laptop:mb-1.5 laptop:tracking-widest">Appel</span>
                    <span className="line-clamp-1 text-[23px] font-bold leading-tight tracking-[-0.035em] text-text-primary laptop:mt-0.5 laptop:text-2xl laptop:font-semibold laptop:tracking-tight">{liveHealth.claudeCode.lastCallAt ? formatRelativeTime(liveHealth.claudeCode.lastCallAt, now) : "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted laptop:mb-1.5 laptop:tracking-widest">Ce jour</span>
                    <div className="flex items-baseline gap-1 laptop:mt-0.5">
                      <span className="text-[30px] font-bold leading-none tracking-[-0.04em] text-text-primary laptop:text-3xl laptop:font-semibold laptop:tracking-tight">{liveHealth.claudeCode.tokensUsedToday.toLocaleString("fr-FR")}</span>
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

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Server, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Squares2X2Icon } from "@heroicons/react/24/solid";
import { PageHeader } from "@/components/shell/PageHeader";
import { ClaudeMark } from "@/components/brand/ClaudeMark";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/status";
import { ROUTES } from "@/lib/routes";
import { useVps } from "@/lib/VpsContext";
import { useMissions } from "@/lib/useMissions";
import { useSystemHealth } from "@/lib/useSystemHealth";
import { useTokenUsage } from "@/lib/useTokenUsage";
import { KpiRow } from "@/screens/overview/KpiRow";
import { MiniKanban } from "@/screens/overview/MiniKanban";
import { TokenUsageChart, type TokenPoint } from "@/screens/overview/TokenUsageChart";

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

function SectionHeading({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-[13px] font-bold tracking-[-0.015em] text-text-primary laptop:text-[14px]">{title}</h2>
      {detail && <span className="text-[10px] font-semibold text-text-muted laptop:text-[11px]">{detail}</span>}
    </div>
  );
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
        .flatMap((mission) => mission.timeline.map((event) => ({ ...event, missionId: mission.id })))
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 5),
    [activeMissions],
  );

  const totalTokens = weeklyTokenUsage.reduce((sum, day) => sum + day.tokens, 0);
  const dayOverDayChange = useMemo(() => {
    const last = weeklyTokenUsage.at(-1);
    const previous = weeklyTokenUsage.at(-2);
    if (!last || !previous || previous.tokens === 0) return null;
    return Math.round(((last.tokens - previous.tokens) / previous.tokens) * 100);
  }, [weeklyTokenUsage]);

  const coreStatus = liveHealth.cortexServer.status === "running" ? "Opérationnel" : liveHealth.cortexServer.status === "degraded" ? "Dégradé" : "Arrêté";
  const coreClass = liveHealth.cortexServer.status === "running" ? "text-success" : liveHealth.cortexServer.status === "degraded" ? "text-warning" : "text-error";
  const claudeStatus = liveHealth.claudeCode.status === "available" ? "Disponible" : liveHealth.claudeCode.status === "degraded" ? "Dégradé" : "Indisponible";
  const claudeClass = liveHealth.claudeCode.status === "available" ? "text-success" : liveHealth.claudeCode.status === "degraded" ? "text-warning" : "text-error";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <PageHeader title="Overview" icon={Squares2X2Icon} />

      {(healthError || missionsError || tokensError) && (
        <div className="mb-6 border-y border-error/25 py-3">
          <p className="text-[12px] font-bold text-error">Connexion API dégradée</p>
          <p className="mt-1 text-[11px] font-medium leading-relaxed text-text-secondary">{healthError || missionsError || tokensError}</p>
        </div>
      )}

      <div className="mb-8 laptop:mb-10">
        <KpiRow missions={activeMissions} />
      </div>

      <div className="grid grid-cols-1 gap-y-9 laptop:grid-cols-12 laptop:gap-x-8 laptop:gap-y-10">
        <div className="laptop:col-span-8">
          <MiniKanban missions={activeMissions} />
        </div>

        <section className="laptop:col-span-4">
          <SectionHeading title="Activité" detail={recentActivity.length ? `${recentActivity.length} récents` : "calme"} />
          <div className="border-y border-black/[0.06]">
            {recentActivity.length === 0 ? (
              <p className="py-5 text-[12px] font-semibold text-text-muted">Aucune activité récente.</p>
            ) : (
              <ul className="divide-y divide-black/[0.05]">
                {recentActivity.map((event) => (
                  <li key={event.id} className="grid grid-cols-[1fr_auto] gap-3 py-3">
                    <p className="line-clamp-2 text-[12px] font-bold leading-snug text-text-primary">{event.title}</p>
                    <span className="shrink-0 text-[9px] font-semibold text-text-muted">{formatRelativeTime(event.ts, now)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="laptop:col-span-7">
          <SectionHeading title="Usage" detail="7 jours" />
          <div className="border-y border-black/[0.06] py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[32px] font-bold leading-none tracking-[-0.045em] text-text-primary laptop:text-[36px]">
                    {(hoveredPoint ? hoveredPoint.tokens : totalTokens).toLocaleString("fr-FR")}
                  </span>
                  <span className="text-[10px] font-semibold text-text-muted">tk</span>
                </div>
                <p className="mt-1 text-[10px] font-semibold text-text-muted">{hoveredPoint ? hoveredPoint.day : "Total attribué aux missions clôturées"}</p>
              </div>
              {dayOverDayChange !== null && !hoveredPoint && (
                <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold", dayOverDayChange >= 0 ? "text-success" : "text-error")}>
                  <TrendingUp className={cn("size-3.5", dayOverDayChange < 0 && "rotate-180")} strokeWidth={3} />
                  {dayOverDayChange >= 0 ? "+" : ""}{dayOverDayChange}%
                </span>
              )}
            </div>
            <div className="mt-4">
              <TokenUsageChart data={weeklyTokenUsage} onHoverPoint={setHoveredPoint} />
            </div>
          </div>
        </section>

        <section className="laptop:col-span-5">
          <SectionHeading title="Runtime" detail={vps ? vps.ip : "local"} />
          <div className="border-y border-black/[0.06] divide-y divide-black/[0.05]">
            <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <Server className="size-[18px] shrink-0 text-text-primary" strokeWidth={2.9} />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-text-primary">Cortex Core</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-text-muted">{formatUptime(liveHealth.cortexServer.uptimeSeconds)} · {liveHealth.cortexServer.memoryMb} Mo</p>
                </div>
              </div>
              <span className={cn("text-[10px] font-bold", coreClass)}>{coreStatus}</span>
            </div>

            <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-[18px] shrink-0 items-center justify-center"><ClaudeMark title="Claude" className="size-[18px] text-[#D97757]" /></div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-text-primary">Claude Code</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-text-muted">{liveHealth.claudeCode.tokensUsedToday.toLocaleString("fr-FR")} tk aujourd'hui</p>
                </div>
              </div>
              <span className={cn("text-[10px] font-bold", claudeClass)}>{claudeStatus}</span>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Link to={ROUTES.system} className="inline-flex min-h-10 items-center gap-1.5 text-[11px] font-bold text-text-muted hover:text-text-primary laptop:min-h-0">
              Ouvrir System <ArrowRight className="size-3.5" strokeWidth={2.8} />
            </Link>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

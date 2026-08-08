import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleStop,
  Clock3,
  ListTree,
  LoaderCircle,
  Pause,
  Play,
  XCircle,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { formatDuration, formatRelativeTime } from "@/lib/status";
import { getOperationalMission } from "@/lib/operator-contract";
import type { Mission, OperatorRunStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const statusIcons: Record<OperatorRunStatus, LucideIcon> = {
  queued: Clock3,
  planning: ListTree,
  running: Play,
  waiting_for_human: AlertTriangle,
  paused: Pause,
  cancelling: LoaderCircle,
  cancelled: CircleStop,
  failed: XCircle,
  succeeded: CheckCircle2,
};

const statusClasses: Record<OperatorRunStatus, string> = {
  queued: "text-text-muted",
  planning: "text-text-secondary",
  running: "text-text-primary",
  waiting_for_human: "text-warning",
  paused: "text-text-secondary",
  cancelling: "text-text-muted",
  cancelled: "text-text-muted",
  failed: "text-error",
  succeeded: "text-success",
};

export function OperatorMissionRow({
  mission,
  compact = false,
  className,
}: {
  mission: Mission;
  compact?: boolean;
  className?: string;
}) {
  const view = getOperationalMission(mission);
  const StatusIcon = statusIcons[view.status];
  const duration = ["queued", "planning", "running", "waiting_for_human", "paused", "cancelling"].includes(view.status)
    ? Date.now() - mission.createdAt
    : mission.durationMs;
  const lastActivityAt = view.lastEvent?.ts ?? mission.createdAt;

  return (
    <Link
      to={ROUTES.missionDetail(mission.id)}
      data-status={view.status}
      data-attention={view.attention ? "true" : "false"}
      data-compact={compact ? "true" : "false"}
      className={cn(
        "cortex-mission-row group relative -mx-1.5 grid min-h-[88px] grid-cols-[30px_minmax(0,1fr)_72px] items-start gap-x-3 px-1.5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/15 focus-visible:ring-offset-2",
        "transition-[background-color,color] duration-150",
        compact
          ? "min-h-[76px] py-3 tablet:-mx-3 tablet:grid-cols-[32px_minmax(0,1fr)_88px_18px] tablet:px-3"
          : "tablet:-mx-3 tablet:grid-cols-[32px_minmax(0,1.25fr)_minmax(180px,0.46fr)_88px_18px] tablet:px-3",
        className,
      )}
    >
      <div className={cn("mt-0.5 flex size-[30px] items-center justify-center", statusClasses[view.status])}>
        <StatusIcon
          className={cn("size-[17px]", view.status === "planning" || view.status === "cancelling" ? "animate-pulse" : "")}
          strokeWidth={2.8}
          aria-hidden
        />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn("text-[9px] font-[680] uppercase tracking-[0.12em]", statusClasses[view.status])}>
            {view.statusLabel}
          </span>
          <span className="font-mono text-[8.5px] font-medium tabular-nums text-text-muted">
            Run {String(view.attempt).padStart(2, "0")}
          </span>
        </div>
        <h3 className="mt-1.5 line-clamp-2 text-[14px] font-[650] leading-[1.28] tracking-[-0.021em] text-text-primary tablet:text-[14.5px]">
          {mission.title ?? mission.objective}
        </h3>
        <p className="mt-1 truncate text-[10.5px] font-medium text-text-muted">
          {view.stageLabel}
        </p>
        {view.attention && (
          <p className={cn(
            "mt-1.5 line-clamp-1 text-[10.5px] font-[620]",
            view.attention.kind === "failure" ? "text-error" : view.attention.kind === "decision" ? "text-warning" : "text-text-secondary",
          )}>
            {view.attention.title} · {view.attention.summary}
          </p>
        )}
        {view.progress !== null && view.status === "running" && (
          <div className="mt-2 h-[3px] max-w-[360px] overflow-hidden bg-black/[0.07]" aria-label={`Progression mesurée : ${view.progress}%`}>
            <div className="h-full bg-[#242a25]" style={{ width: `${view.progress}%` }} />
          </div>
        )}
      </div>

      {!compact && (
        <div className="hidden min-w-0 pt-[22px] tablet:block">
          <p className="truncate text-[10.5px] font-[650] text-text-primary">{view.agentName}</p>
          <p className="mt-1 truncate font-mono text-[8.5px] font-medium text-text-muted">
            {view.runtimeName} · {view.modelName}
          </p>
          {view.lastEvent && (
            <p className="mt-2 line-clamp-1 text-[9.5px] font-medium text-text-secondary">
              {view.lastEvent.title}
            </p>
          )}
        </div>
      )}

      <div className="flex min-w-[64px] flex-col items-end gap-1 pt-0.5 text-right tablet:pt-[22px]">
        <span className="font-mono text-[9.5px] font-semibold tabular-nums text-text-primary">
          {formatDuration(duration)}
        </span>
        <span className="whitespace-nowrap text-[9px] font-medium text-text-muted">
          {formatRelativeTime(lastActivityAt, Date.now())}
        </span>
      </div>

      <span className="mt-[24px] hidden size-[18px] items-center justify-center text-text-muted transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-text-primary tablet:flex">
        <ArrowUpRight className="size-3.5" strokeWidth={2.6} aria-hidden />
      </span>
    </Link>
  );
}

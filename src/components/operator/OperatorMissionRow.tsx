import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
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
      className={cn(
        "group relative grid min-h-[92px] grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/15 focus-visible:ring-offset-2",
        "transition-colors hover:bg-black/[0.018]",
        compact ? "min-h-[78px] py-3" : "tablet:grid-cols-[auto_minmax(0,1fr)_minmax(180px,0.42fr)_auto]",
        className,
      )}
    >
      <div className={cn("mt-0.5 flex size-9 items-center justify-center", statusClasses[view.status])}>
        <StatusIcon
          className={cn("size-[18px]", view.status === "planning" || view.status === "cancelling" ? "animate-pulse" : "")}
          strokeWidth={2.8}
          aria-hidden
        />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn("text-[9px] font-bold uppercase tracking-[0.11em]", statusClasses[view.status])}>
            {view.statusLabel}
          </span>
          <span className="font-mono text-[9px] font-semibold text-text-muted">
            Run {view.attempt}
          </span>
        </div>
        <h3 className="mt-1.5 line-clamp-2 text-[14px] font-bold leading-[1.28] tracking-[-0.018em] text-text-primary tablet:text-[15px]">
          {mission.title ?? mission.objective}
        </h3>
        <p className="mt-1 truncate text-[10.5px] font-semibold text-text-muted">
          {view.stageLabel}
        </p>
        {view.attention && (
          <p className={cn(
            "mt-1.5 line-clamp-1 text-[10.5px] font-bold",
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
        <div className="hidden min-w-0 pt-5 tablet:block">
          <p className="truncate text-[11px] font-bold text-text-primary">{view.agentName}</p>
          <p className="mt-1 truncate font-mono text-[9.5px] font-semibold text-text-muted">
            {view.runtimeName} · {view.modelName}
          </p>
          {view.lastEvent && (
            <p className="mt-2 line-clamp-1 text-[10px] font-medium text-text-secondary">
              {view.lastEvent.title}
            </p>
          )}
        </div>
      )}

      <div className="flex min-w-[64px] flex-col items-end gap-1 pt-0.5 text-right">
        <span className="font-mono text-[10px] font-bold tabular-nums text-text-primary">
          {formatDuration(duration)}
        </span>
        <span className="whitespace-nowrap text-[9.5px] font-semibold text-text-muted">
          {formatRelativeTime(lastActivityAt, Date.now())}
        </span>
        {view.attention && (
          <span className="mt-2 text-[9px] font-bold uppercase tracking-[0.09em] text-text-primary">
            Ouvrir
          </span>
        )}
      </div>
    </Link>
  );
}

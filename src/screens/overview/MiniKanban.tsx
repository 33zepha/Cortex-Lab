import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";
import type { Mission, MissionStatus } from "@/lib/types";

const STATUS_LABELS: Record<MissionStatus, string> = {
  running: "En cours",
  needs_review: "Action",
  completed: "Terminée",
  failed: "Échec",
  cancelled: "Annulée",
};

const STATUS_CLASS: Record<MissionStatus, string> = {
  running: "text-info",
  needs_review: "text-warning",
  completed: "text-success",
  failed: "text-error",
  cancelled: "text-text-muted",
};

const PRIORITY: MissionStatus[] = ["needs_review", "running", "failed", "completed", "cancelled"];

export function MiniKanban({ missions }: { missions: Mission[] }) {
  const navigate = useNavigate();
  const visible = useMemo(
    () =>
      [...missions]
        .sort((a, b) => {
          const priorityDiff = PRIORITY.indexOf(a.status) - PRIORITY.indexOf(b.status);
          if (priorityDiff !== 0) return priorityDiff;
          return (b.closedAt ?? b.createdAt) - (a.closedAt ?? a.createdAt);
        })
        .slice(0, 6),
    [missions],
  );

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-[13px] font-bold tracking-[-0.015em] text-text-primary laptop:text-[14px]">Missions</h2>
        <span className="text-[10px] font-semibold text-text-muted">{missions.length}</span>
      </div>

      <div className="border-y border-black/[0.06]">
        {visible.length === 0 ? (
          <div className="py-5 text-[12px] font-semibold text-text-muted">Aucune mission.</div>
        ) : (
          <ul className="divide-y divide-black/[0.05]">
            {visible.map((mission) => (
              <li key={mission.id}>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.missionDetail(mission.id))}
                  className="grid min-h-[62px] w-full grid-cols-[1fr_auto] items-center gap-4 py-3 text-left hover:text-text-primary active:opacity-70"
                >
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[13px] font-bold leading-snug tracking-[-0.015em] text-text-primary">{mission.objective}</p>
                    <p className="mt-1 truncate font-mono text-[9px] font-semibold text-text-muted">{mission.model}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn("text-[10px] font-bold", STATUS_CLASS[mission.status])}>{STATUS_LABELS[mission.status]}</p>
                    {mission.status === "running" && <p className="mt-1 text-[10px] font-semibold tabular-nums text-text-muted">{mission.progress}%</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <Link to={ROUTES.missions} className="inline-flex min-h-10 items-center gap-1.5 text-[11px] font-bold text-text-muted hover:text-text-primary laptop:min-h-0">
          Toutes les missions <ArrowRight className="size-3.5" strokeWidth={2.8} />
        </Link>
      </div>
    </section>
  );
}

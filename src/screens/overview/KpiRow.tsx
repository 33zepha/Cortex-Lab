import { useMemo } from "react";
import { AlertCircle, CheckCircle2, Play, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Mission } from "@/lib/types";

export function KpiRow({ missions }: { missions: Mission[] }) {
  const items = useMemo(() => {
    const active = missions.filter((mission) => mission.status === "running").length;
    const needsReview = missions.filter((mission) => mission.decisionRequired || mission.status === "needs_review").length;
    const completed = missions.filter((mission) => mission.status === "completed").length;
    const failed = missions.filter((mission) => mission.status === "failed").length;
    const successRate = completed + failed > 0 ? Math.round((completed / (completed + failed)) * 100) : null;

    return [
      {
        label: "Actives",
        value: String(active),
        icon: Play,
        tone: "text-accent-indigo",
        bg: "bg-accent-indigo/10 border-accent-indigo/30",
      },
      {
        label: "Décisions",
        value: String(needsReview),
        icon: AlertCircle,
        tone: "text-warning",
        bg: "bg-warning/10 border-warning/35",
      },
      {
        label: "Terminées",
        value: String(completed),
        icon: CheckCircle2,
        tone: "text-success",
        bg: "bg-success/10 border-success/30",
      },
      {
        label: "Succès",
        value: successRate !== null ? `${successRate}%` : "—",
        icon: TrendingUp,
        tone: "text-success",
        bg: "bg-success/10 border-success/30",
      },
    ];
  }, [missions]);

  return (
    <div className="grid grid-cols-2 gap-3 laptop:grid-cols-4 laptop:gap-4">
      {items.map(({ label, value, icon: Icon, tone, bg }) => (
        <div
          key={label}
          className="flex items-center gap-3.5 rounded-[18px] border border-white/70 bg-white/45 p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_4px_16px_rgba(0,0,0,0.02)] backdrop-blur-2xl transition-all duration-fast hover:bg-white/60 laptop:rounded-[20px] laptop:p-4"
        >
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-[12px] border shadow-[inset_0_1px_1px_rgba(255,255,255,1)]",
              bg,
            )}
          >
            <Icon className={cn("size-5", tone)} strokeWidth={3.2} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">{label}</p>
            <p className="mt-0.5 text-[22px] font-bold leading-none tracking-[-0.04em] text-text-primary laptop:text-[24px]">
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

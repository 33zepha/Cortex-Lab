import { useMemo } from "react";
import { AlertCircle, CheckCircle2, Play, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Mission } from "@/lib/types";

export function KpiRow({ missions }: { missions: Mission[] }) {
  const items = useMemo(() => {
    const active = missions.filter((mission) => mission.status === "running").length;
    const needsReview = missions.filter((mission) => mission.decisionRequired).length;
    const completed = missions.filter((mission) => mission.status === "completed").length;
    const failed = missions.filter((mission) => mission.status === "failed").length;
    const successRate = completed + failed > 0 ? Math.round((completed / (completed + failed)) * 100) : null;

    return [
      { label: "Actives", value: String(active), icon: Play, tone: "text-accent-indigo" },
      { label: "Décisions", value: String(needsReview), icon: AlertCircle, tone: "text-warning" },
      { label: "Terminées", value: String(completed), icon: CheckCircle2, tone: "text-success" },
      { label: "Succès", value: successRate !== null ? `${successRate}%` : "—", icon: TrendingUp, tone: "text-success" },
    ];
  }, [missions]);

  return (
    <div className="grid grid-cols-2 border-y border-black/[0.06] laptop:grid-cols-4">
      {items.map(({ label, value, icon: Icon, tone }, index) => (
        <div
          key={label}
          className={cn(
            "flex min-w-0 items-center gap-2.5 py-3.5",
            index % 2 === 0 ? "pr-3" : "pl-3",
            index < 2 && "border-b border-black/[0.05] laptop:border-b-0",
            index % 2 === 0 && "border-r border-black/[0.05] laptop:border-r-0",
            "laptop:border-r laptop:border-black/[0.05] laptop:px-5 laptop:first:pl-0 laptop:last:border-r-0 laptop:last:pr-0",
          )}
        >
          <Icon className={cn("size-[18px] shrink-0", tone)} strokeWidth={3} aria-hidden />
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.09em] text-text-muted">{label}</p>
            <p className="mt-0.5 text-[21px] font-bold leading-none tracking-[-0.035em] text-text-primary">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

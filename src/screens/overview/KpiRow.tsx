import { useMemo } from "react";
import { Play, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { Mission } from "@/lib/types";

export function KpiRow({ missions }: { missions: Mission[] }) {
  const items = useMemo(() => {
    const active = missions.filter((m) => m.status === "running").length;
    const needsReview = missions.filter((m) => m.decisionRequired).length;
    const completed = missions.filter((m) => m.status === "completed").length;
    const failed = missions.filter((m) => m.status === "failed").length;
    const successRate = completed + failed > 0 ? Math.round((completed / (completed + failed)) * 100) : null;

    return [
      { label: "Missions actives", value: String(active), icon: Play, tone: "text-accent-indigo" },
      { label: "Décisions requises", value: String(needsReview), icon: AlertCircle, tone: "text-warning" },
      { label: "Terminées", value: String(completed), icon: CheckCircle2, tone: "text-success" },
      {
        label: "Taux de succès",
        value: successRate !== null ? `${successRate}%` : "—",
        icon: TrendingUp,
        tone: "text-success",
      },
    ];
  }, [missions]);

  return (
    <Card className="mb-4 overflow-hidden p-0">
      <div className="grid grid-cols-2 laptop:grid-cols-4">
        {items.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="group flex cursor-pointer items-center gap-3 px-5 py-3 transition-all duration-300 hover:bg-white/40 active:scale-[0.99] active:bg-white/50"
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-white/60 bg-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.02)] backdrop-blur-md transition-transform duration-300 group-hover:scale-110 group-active:scale-95",
                tone,
              )}
            >
              <Icon className="size-[18px]" strokeWidth={3} aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col justify-center">
              <p className="truncate text-[11px] font-medium uppercase tracking-wider text-text-muted">{label}</p>
              <p className="truncate text-lg font-semibold leading-tight tracking-tight text-text-primary/90">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

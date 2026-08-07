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
      { label: "Missions actives", mobileLabel: "Actives", value: String(active), icon: Play, tone: "text-accent-indigo" },
      { label: "Décisions requises", mobileLabel: "Décisions", value: String(needsReview), icon: AlertCircle, tone: "text-warning" },
      { label: "Terminées", mobileLabel: "Terminées", value: String(completed), icon: CheckCircle2, tone: "text-success" },
      {
        label: "Taux de succès",
        mobileLabel: "Succès",
        value: successRate !== null ? `${successRate}%` : "—",
        icon: TrendingUp,
        tone: "text-success",
      },
    ];
  }, [missions]);

  return (
    <Card className="mb-0 overflow-hidden p-0">
      <div className="grid grid-cols-2 laptop:grid-cols-4">
        {items.map(({ label, mobileLabel, value, icon: Icon, tone }, index) => (
          <div
            key={label}
            className={cn(
              "group flex min-w-0 items-center gap-3 px-4 py-3.5 laptop:px-5 laptop:py-3",
              index % 2 === 0 && "border-r border-black/[0.035] laptop:border-r-0",
              index < 2 && "border-b border-black/[0.035] laptop:border-b-0",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-white/65 bg-white/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.025)] backdrop-blur-md",
                tone,
              )}
            >
              <Icon className="size-[18px]" strokeWidth={3.1} aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col justify-center">
              <p className="text-[10px] font-bold uppercase leading-tight tracking-[0.08em] text-text-muted laptop:hidden">{mobileLabel}</p>
              <p className="hidden truncate text-[11px] font-medium uppercase tracking-wider text-text-muted laptop:block">{label}</p>
              <p className="mt-0.5 text-[22px] font-bold leading-none tracking-[-0.035em] text-text-primary/95 laptop:text-lg laptop:font-semibold laptop:leading-tight laptop:tracking-tight">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

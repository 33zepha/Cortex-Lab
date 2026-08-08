import { useMemo } from "react";
import { AlertCircle, CheckCircle2, Play, TrendingUp } from "lucide-react";
import type { Mission } from "@/lib/types";

export function KpiRow({ missions }: { missions: Mission[] }) {
  const items = useMemo(() => {
    const active = missions.filter((mission) => mission.status === "running").length;
    const needsReview = missions.filter((mission) => mission.decisionRequired || mission.status === "needs_review").length;
    const completed = missions.filter((mission) => mission.status === "completed").length;
    const failed = missions.filter((mission) => mission.status === "failed").length;
    const successRate = completed + failed > 0 ? Math.round((completed / (completed + failed)) * 100) : null;

    return [
      { label: "Actives", value: String(active), icon: Play },
      { label: "Décisions", value: String(needsReview), icon: AlertCircle },
      { label: "Terminées", value: String(completed), icon: CheckCircle2 },
      { label: "Succès", value: successRate !== null ? `${successRate}%` : "—", icon: TrendingUp },
    ];
  }, [missions]);

  return (
    <div className="grid grid-cols-2 gap-3 laptop:grid-cols-4 laptop:gap-4">
      {items.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="group flex items-center gap-3.5 rounded-[17px] border border-black/[0.055] bg-[#f7f6f1]/72 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.58),0_8px_24px_-22px_rgba(0,0,0,0.28)] transition-[background-color,border-color] duration-200 hover:border-black/[0.075] hover:bg-[#f9f8f4]/88 laptop:rounded-[19px] laptop:p-4"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[11px] border border-white/[0.07] bg-[#141815] text-[#efeee9] shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_8px_18px_-14px_rgba(0,0,0,0.72)]">
            <Icon className="size-[18px]" strokeWidth={2.6} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.11em] text-text-muted">{label}</p>
            <p className="mt-0.5 text-[22px] font-extrabold leading-none tracking-[-0.045em] text-text-primary laptop:text-[24px]">
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

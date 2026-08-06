import { Play, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { BentoCard } from "@/components/ui";
import type { Mission } from "@/lib/types";

export function KpiRow({ missions }: { missions: Mission[] }) {
  const active = missions.filter((m) => m.status === "running").length;
  const needsReview = missions.filter((m) => m.decisionRequired).length;
  const completed = missions.filter((m) => m.status === "completed").length;
  const failed = missions.filter((m) => m.status === "failed").length;
  const successRate = completed + failed > 0 ? Math.round((completed / (completed + failed)) * 100) : null;

  const items = [
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

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 laptop:grid-cols-4">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <BentoCard key={label} padding="compact">
          <div className="flex items-center gap-3">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-2 ${tone}`}>
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-label uppercase tracking-wide text-text-muted">{label}</p>
              <p className="text-metric text-text-primary">{value}</p>
            </div>
          </div>
        </BentoCard>
      ))}
    </div>
  );
}

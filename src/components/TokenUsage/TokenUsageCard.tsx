import { useMemo } from "react";
import { Activity, AlertTriangle } from "lucide-react";
import { useTokenUsage } from "@/lib/useTokenUsage";
import { cn } from "@/lib/cn";
import { TokenUsageChart } from "@/screens/overview/TokenUsageChart";

export interface TokenUsageCardProps {
  className?: string;
}

const numberFormatter = new Intl.NumberFormat("fr-FR");

export function TokenUsageCard({ className = "" }: TokenUsageCardProps) {
  const { data, loading, error } = useTokenUsage();
  const total = useMemo(() => data.reduce((sum, point) => sum + point.tokens, 0), [data]);
  const latest = data.at(-1)?.tokens ?? 0;

  return (
    <section className={cn("relative overflow-hidden rounded-[22px] border border-white/80 bg-white/55 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_4px_20px_-4px_rgba(0,0,0,0.035)] backdrop-blur-2xl laptop:rounded-[26px] laptop:p-6", className)} aria-labelledby="token-usage-title">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-text-muted" strokeWidth={2.6} aria-hidden />
          <h2 id="token-usage-title" className="text-[13px] font-semibold text-text-secondary">Tokens</h2>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.11em] text-text-muted">7 derniers jours</span>
      </div>

      <div className="my-4 flex items-end justify-between gap-5">
        <div>
          <p className="font-mono text-[30px] font-bold leading-none tabular-nums tracking-[-0.035em] text-text-primary laptop:text-[34px]">
            {loading ? "—" : numberFormatter.format(total)}
          </p>
          <p className="mt-2 text-[11px] font-medium text-text-muted">tokens comptabilisés</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[15px] font-bold tabular-nums text-text-primary">{loading ? "—" : `+${numberFormatter.format(latest)}`}</p>
          <p className="mt-1 text-[10px] font-medium text-text-muted">dernier jour disponible</p>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-[12px] border border-error/20 bg-error/[0.05] px-3 py-2.5 text-[11px] font-medium text-text-secondary" role="status">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-error" aria-hidden />
          <span>Usage indisponible : {error}</span>
        </div>
      ) : data.length > 1 ? (
        <TokenUsageChart data={data} />
      ) : (
        <div className="flex h-[72px] items-center justify-center rounded-[12px] border border-dashed border-black/[0.10] bg-black/[0.015] font-mono text-[11px] text-text-muted">
          {loading ? "Chargement de l’usage…" : "Pas encore de données"}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-black/[0.05] pt-3 text-[10px] font-medium text-text-muted">
        <span>Source : ledger Cortex</span>
        <span>{data.length ? `${data.length} points` : "En attente"}</span>
      </div>
    </section>
  );
}

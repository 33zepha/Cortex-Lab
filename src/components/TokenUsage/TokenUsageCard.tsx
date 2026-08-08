import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTokenUsage } from "@/lib/useTokenUsage";
import { TokenUsageChart } from "@/screens/overview/TokenUsageChart";

export interface TokenUsageCardProps {
  className?: string;
}

const numberFormatter = new Intl.NumberFormat("fr-FR");

export function TokenUsageCard({ className = "" }: TokenUsageCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { data, loading, error } = useTokenUsage();
  const total = data.reduce((sum, point) => sum + point.tokens, 0);
  const today = data.at(-1)?.tokens ?? 0;

  return (
    <div className={cn("relative select-none", className)}>
      <div className="group relative flex flex-col justify-between rounded-[22px] border border-white/80 bg-white/55 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_4px_20px_-4px_rgba(0,0,0,0.035)] backdrop-blur-2xl laptop:rounded-[26px] laptop:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-text-muted" strokeWidth={2.5} aria-hidden />
            <span className="text-[13px] font-semibold text-text-secondary">Tokens consommés</span>
          </div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">7 derniers jours</span>
        </div>

        <div className="my-3.5 flex items-end justify-between gap-4">
          <div className="font-mono text-[30px] font-bold leading-none tabular-nums tracking-[-0.035em] text-text-primary laptop:text-[34px]">
            {loading ? "—" : numberFormatter.format(total)}
          </div>
          <div className="text-right text-[11px] font-medium text-text-muted">
            <span className="block font-mono font-semibold tabular-nums text-text-primary">
              {loading ? "—" : numberFormatter.format(today)}
            </span>
            <span>aujourd’hui</span>
          </div>
        </div>

        {error ? (
          <div className="flex h-[72px] items-center justify-center rounded-[12px] border border-dashed border-error/25 bg-error/[0.03] px-3 text-center text-[11px] font-medium text-text-muted">
            Données de consommation indisponibles.
          </div>
        ) : loading ? (
          <div className="h-[72px] animate-pulse rounded-[12px] bg-black/[0.04]" aria-label="Chargement de la consommation" />
        ) : (
          <TokenUsageChart data={data} />
        )}

        <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-black/[0.05] pt-3">
          <span className="text-[10px] font-medium text-text-muted">
            {error ? "API Cortex" : "Source : runtime Cortex"}
          </span>
          <button
            type="button"
            onClick={() => setIsDetailOpen((previous) => !previous)}
            className="flex items-center gap-1 rounded-[6px] border border-black/[0.06] bg-white/50 px-2 py-1 font-mono text-[11px] font-bold text-text-secondary transition-all hover:border-black/15 hover:bg-white hover:text-text-primary"
            aria-expanded={isDetailOpen}
          >
            <span>{isDetailOpen ? "Masquer" : "Détails"}</span>
            {isDetailOpen ? <ChevronUp className="size-3" aria-hidden /> : <ChevronDown className="size-3" aria-hidden />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {isDetailOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-[16px] border border-white/80 bg-white/50 p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">
                  <span>Journal quotidien</span>
                  <span>Tokens</span>
                </div>
                <div className="divide-y divide-black/[0.04]">
                  {data.length === 0 && !loading ? (
                    <p className="py-3 text-[11px] font-medium text-text-muted">Aucune consommation enregistrée.</p>
                  ) : data.map((point) => <UsageRow key={`${point.day}-${point.tokens}`} point={point} />)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function UsageRow({ point }: { point: { day: string; tokens: number } }) {
  return (
    <div className="flex items-center justify-between py-2 text-[11px]">
      <span className="font-semibold text-text-secondary">{point.day}</span>
      <span className="font-mono font-bold tabular-nums text-text-primary">{numberFormatter.format(point.tokens)}</span>
    </div>
  );
}

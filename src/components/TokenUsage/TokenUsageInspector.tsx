import { motion } from "framer-motion";
import { X, Layers, Cpu } from "lucide-react";
import type { TokenUsageData, TimePeriod } from "./types";

interface TokenUsageInspectorProps {
  data: TokenUsageData;
  period: TimePeriod;
  onClose: () => void;
}

export function TokenUsageInspector({ data, period, onClose }: TokenUsageInspectorProps) {
  const periodLabel =
    period === "today" ? "Aujourd'hui" : period === "7d" ? "7 derniers jours" : "30 derniers jours";

  const total = data.total;
  const categoriesList = [
    { label: "Input", count: data.categories.input, pct: ((data.categories.input / total) * 100).toFixed(1) },
    { label: "Output", count: data.categories.output, pct: ((data.categories.output / total) * 100).toFixed(1) },
    { label: "Reasoning", count: data.categories.reasoning, pct: ((data.categories.reasoning / total) * 100).toFixed(1) },
    { label: "Cache", count: data.categories.cache, pct: ((data.categories.cache / total) * 100).toFixed(1) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed inset-y-0 right-0 z-dialog flex w-full max-w-md flex-col border-l border-black/[0.08] bg-white/95 p-6 shadow-2xl backdrop-blur-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
        <div>
          <h2 className="text-[14px] font-semibold text-text-primary">Détail de la consommation</h2>
          <p className="mt-0.5 text-[11px] text-text-muted">{periodLabel}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="flex size-7 items-center justify-center rounded-[6px] border border-black/[0.08] text-text-secondary transition-colors hover:bg-black/[0.04] hover:text-text-primary"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Résumé Principal */}
      <div className="my-6 space-y-1">
        <span className="text-[11px] font-medium text-text-muted">Total consommé</span>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[30px] font-semibold tabular-nums tracking-[-0.03em] text-text-primary">
            {data.total.toLocaleString("fr-FR")}
          </span>
          <span className="text-[12px] font-medium text-text-muted">tokens</span>
        </div>
      </div>

      {/* Répartition par Catégorie */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
          <Layers className="size-3.5" />
          <span>Composition par type</span>
        </div>

        <div className="divide-y divide-black/[0.04] rounded-[10px] border border-black/[0.06] bg-black/[0.015]">
          {categoriesList.map((cat) => (
            <div key={cat.label} className="flex items-center justify-between p-3 text-[12px]">
              <span className="font-medium text-text-secondary">{cat.label}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold tabular-nums text-text-primary">
                  {cat.count.toLocaleString("fr-FR")}
                </span>
                <span className="w-10 text-right font-mono text-[11px] text-text-muted">
                  {cat.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Répartition par Agent & Modèle */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
          <Cpu className="size-3.5" />
          <span>Activité par agent</span>
        </div>

        <div className="divide-y divide-black/[0.04] rounded-[10px] border border-black/[0.06] bg-black/[0.015]">
          {data.agents.map((agent) => (
            <div key={agent.agent} className="flex items-center justify-between p-3 text-[12px]">
              <div>
                <p className="font-semibold text-text-primary">{agent.agent}</p>
                <p className="text-[10.5px] text-text-muted">{agent.model}</p>
              </div>

              <div className="text-right">
                <p className="font-mono font-semibold tabular-nums text-text-primary">
                  {agent.tokens.toLocaleString("fr-FR")}
                </p>
                <p className="font-mono text-[10.5px] text-text-muted">{agent.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

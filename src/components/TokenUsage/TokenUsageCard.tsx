import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Layers, Cpu, ChevronUp } from "lucide-react";
import { PERIOD_DATA } from "./mockData";
import type { TimePeriod, TokenCategory } from "./types";
import { cn } from "@/lib/cn";

export interface TokenUsageCardProps {
  className?: string;
}

export function TokenUsageCard({ className = "" }: TokenUsageCardProps) {
  const [period, setPeriod] = useState<TimePeriod>("7d");
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<TokenCategory | null>(null);

  const data = PERIOD_DATA[period];
  const total = data.total;

  const inputPct = (data.categories.input / total) * 100;
  const outputPct = (data.categories.output / total) * 100;
  const reasoningPct = (data.categories.reasoning / total) * 100;
  const cachePct = (data.categories.cache / total) * 100;

  // Calcul des centres horizontaux cumulés exacts pour positionner le tooltip précisément
  let cumulative = 0;
  const segments = (
    [
      {
        id: "input" as const,
        label: "Input",
        count: data.categories.input,
        pct: inputPct,
        color: "#0077e6",
        bgClass: "bg-[#0077e6]",
        dotClass: "bg-[#0077e6]",
        textClass: "text-[#0077e6]",
      },
      {
        id: "output" as const,
        label: "Output",
        count: data.categories.output,
        pct: outputPct,
        color: "#8b5cf6",
        bgClass: "bg-[#8b5cf6]",
        dotClass: "bg-[#8b5cf6]",
        textClass: "text-[#8b5cf6]",
      },
      {
        id: "reasoning" as const,
        label: "Reasoning",
        count: data.categories.reasoning,
        pct: reasoningPct,
        color: "#f59e0b",
        bgClass: "bg-[#f59e0b]",
        dotClass: "bg-[#f59e0b]",
        textClass: "text-[#f59e0b]",
      },
      {
        id: "cache" as const,
        label: "Cache",
        count: data.categories.cache,
        pct: cachePct,
        color: "#10b981",
        bgClass: "bg-[#10b981]",
        dotClass: "bg-[#10b981]",
        textClass: "text-[#10b981]",
      },
    ] as const
  ).map((seg) => {
    const centerPct = cumulative + seg.pct / 2;
    cumulative += seg.pct;
    return {
      ...seg,
      centerPct,
    };
  });

  const activeSegment = segments.find((s) => s.id === hoveredCategory) ?? null;

  return (
    <div className={cn("relative select-none", className)}>
      {/* FRAME PRINCIPALE DES TOKENS */}
      <div className="group relative flex flex-col justify-between rounded-[22px] border border-white/80 bg-white/55 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_4px_20px_-4px_rgba(0,0,0,0.035)] backdrop-blur-2xl transition-all duration-fast laptop:rounded-[26px] laptop:p-6">
        {/* LIGNE SUPÉRIEURE : LABEL & SÉLECTEUR DE PÉRIODE DISCRET */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-text-secondary">Tokens</span>

          {/* Sélecteur de période épuré */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPeriodMenuOpen((prev) => !prev)}
              className="flex items-center gap-1 text-[11.5px] font-medium text-text-muted transition-colors hover:text-text-primary"
            >
              <span>
                {period === "today" ? "Aujourd'hui" : period === "7d" ? "Last 7 days" : "Last 30 days"}
              </span>
              <ChevronDown className="size-3 text-text-muted" />
            </button>

            {isPeriodMenuOpen && (
              <div className="absolute right-0 top-full z-popover mt-1 min-w-[120px] rounded-[8px] border border-black/[0.08] bg-white/95 p-1 shadow-lg backdrop-blur-md">
                {(
                  [
                    { id: "today", label: "Today" },
                    { id: "7d", label: "Last 7 days" },
                    { id: "30d", label: "Last 30 days" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setPeriod(opt.id);
                      setIsPeriodMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center px-2.5 py-1 text-left text-[11px] rounded-[4px] transition-colors",
                      period === opt.id
                        ? "bg-black/[0.05] font-semibold text-text-primary"
                        : "text-text-secondary hover:bg-black/[0.03] hover:text-text-primary",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* LIGNE PRINCIPALE : HERO EXACT + TODAY */}
        <div className="my-3.5 flex items-baseline justify-between">
          <div className="font-mono text-[30px] font-bold leading-none tabular-nums tracking-[-0.035em] text-text-primary laptop:text-[34px]">
            {data.total.toLocaleString("fr-FR")}
          </div>

          <div
            className="flex items-baseline gap-1 text-[12px] font-medium text-text-secondary"
            title="8.2% de plus qu'hier à la même heure"
          >
            <span className="font-semibold text-text-primary">+{data.today.toLocaleString("fr-FR")}</span>
            <span className="text-text-muted">today</span>
            <span className="text-text-muted">·</span>
            <span className="font-mono text-text-muted">↑{data.growthPercent}%</span>
          </div>
        </div>

        {/* GRANDE BARRE DE COMPOSITION HAUTE LISIBILITÉ (10PX) AVEC SÉPARATEURS NETS */}
        <div className="relative my-2.5">
          {/* Infobulle flottante fluide alignée précisément au centre du segment survolé */}
          <AnimatePresence>
            {activeSegment && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                style={{
                  left: `${Math.max(14, Math.min(86, activeSegment.centerPct))}%`,
                }}
                className="pointer-events-none absolute -top-9 z-tooltip -translate-x-1/2 flex items-center gap-1.5 whitespace-nowrap rounded-[7px] border border-black/[0.1] bg-white px-2.5 py-1 font-mono text-[11px] shadow-lg backdrop-blur-md"
              >
                <span
                  className="size-2 rounded-full shadow-sm"
                  style={{ backgroundColor: activeSegment.color }}
                />
                <span className="font-bold text-text-primary">{activeSegment.label}</span>
                <span className="text-text-muted/60">·</span>
                <span className="font-bold tabular-nums text-text-primary">
                  {activeSegment.count.toLocaleString("fr-FR")}
                </span>
                <span className="text-text-muted/60">·</span>
                <span className="font-semibold text-text-muted">{activeSegment.pct.toFixed(1)}%</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Barre de composition 10px ultra-lisible avec séparateurs blancs nets et coins adoucis */}
          <div
            className="relative flex h-[10px] w-full overflow-hidden rounded-[7px] border border-black/[0.08] bg-black/[0.05] p-[1px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]"
            onMouseLeave={() => setHoveredCategory(null)}
          >
            {segments.map((seg) => (
              <div
                key={seg.id}
                onMouseEnter={() => setHoveredCategory(seg.id)}
                style={{ width: `${seg.pct}%` }}
                className={cn(
                  "h-full border-r-[2px] border-white transition-all duration-fast last:border-r-0 cursor-pointer",
                  seg.bgClass,
                  hoveredCategory === seg.id
                    ? "brightness-110 saturate-125 scale-y-110 shadow-md"
                    : hoveredCategory
                    ? "opacity-40"
                    : "opacity-100",
                )}
              />
            ))}
          </div>
        </div>

        {/* LIGNE INFÉRIEURE : MÉTRIQUES INLINE AVEC POINTS COLORÉS, NOMBRES TABULAIRES ET POURCENTAGES */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-y-2 text-[12px]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {segments.map((seg) => (
              <div
                key={seg.id}
                onMouseEnter={() => setHoveredCategory(seg.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={cn(
                  "flex items-center gap-1.5 cursor-pointer transition-all duration-fast",
                  hoveredCategory === seg.id
                    ? "scale-[1.03] opacity-100"
                    : "opacity-85 hover:opacity-100",
                )}
              >
                <span
                  className="size-2 rounded-full shadow-xs"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="font-bold text-text-primary">{seg.label}</span>
                <span className="font-mono font-semibold tabular-nums text-text-secondary">
                  {seg.count.toLocaleString("fr-FR")}
                </span>
                <span className="font-mono text-[10.5px] text-text-muted">
                  ({seg.pct.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>

          {/* Bouton de déploiement enfant avec animation fluide */}
          <button
            type="button"
            onClick={() => setIsDetailOpen((prev) => !prev)}
            className="flex items-center gap-1 rounded-[6px] border border-black/[0.06] bg-white/50 px-2 py-0.5 font-mono text-[11px] font-bold text-text-secondary transition-all hover:border-black/15 hover:bg-white hover:text-text-primary"
          >
            <span>{isDetailOpen ? "Masquer" : "Détails"}</span>
            {isDetailOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        </div>

        {/* FRAME ENFANT DÉTAIL DE CONSO AVEC ANIMATION FLUIDE & LIQUID GLASS */}
        <AnimatePresence>
          {isDetailOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.98, y: -4 }}
              animate={{ opacity: 1, height: "auto", scale: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, scale: 0.98, y: -4 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 28,
                mass: 0.8,
              }}
              className="overflow-hidden"
            >
              <div className="mt-5 rounded-[18px] border border-white/80 bg-white/50 p-4.5 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_8px_24px_-4px_rgba(0,0,0,0.04)] backdrop-blur-2xl">
                <div className="grid grid-cols-1 gap-5 tablet:grid-cols-2">
                  {/* 1. Répartition par catégorie */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-text-secondary">
                      <Layers className="size-3.5 text-text-muted" />
                      <span>Composition des flux</span>
                    </div>

                    <div className="divide-y divide-black/[0.04] rounded-[12px] border border-black/[0.06] bg-white/70 p-1 shadow-sm">
                      {segments.map((seg) => (
                        <div
                          key={seg.id}
                          className="flex items-center justify-between px-3 py-2 text-[11.5px]"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2.5 rounded-full shadow-xs"
                              style={{ backgroundColor: seg.color }}
                            />
                            <span className="font-bold text-text-primary">{seg.label}</span>
                          </div>

                          <div className="flex items-center gap-2.5 font-mono">
                            <span className="font-bold tabular-nums text-text-primary">
                              {seg.count.toLocaleString("fr-FR")}
                            </span>
                            <span className="w-10 text-right text-[10.5px] text-text-muted">
                              {seg.pct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Répartition par agent */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-text-secondary">
                      <Cpu className="size-3.5 text-text-muted" />
                      <span>Activité par agent</span>
                    </div>

                    <div className="divide-y divide-black/[0.04] rounded-[12px] border border-black/[0.06] bg-white/70 p-1 shadow-sm">
                      {data.agents.map((agent) => (
                        <div
                          key={agent.agent}
                          className="flex items-center justify-between px-3 py-2 text-[11.5px]"
                        >
                          <div>
                            <p className="font-bold text-text-primary">{agent.agent}</p>
                            <p className="text-[10px] text-text-muted">{agent.model}</p>
                          </div>

                          <div className="text-right font-mono">
                            <span className="font-bold tabular-nums text-text-primary">
                              {agent.tokens.toLocaleString("fr-FR")}
                            </span>
                            <span className="ml-2 text-[10.5px] text-text-muted">
                              {agent.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

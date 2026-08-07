import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TokenMatterCanvas } from "./TokenMatterCanvas";
import { TokenMatterExpanded } from "./TokenMatterExpanded";
import { TokenMatterDemo } from "./TokenMatterDemo";
import { DEFAULT_TOKEN_MATTER_MOCK } from "./mockData";
import type { TokenMatterData, TokenCategory, TokenSegment } from "./types";
import { cn } from "@/lib/cn";

export interface TokenMatterProps {
  initialData?: TokenMatterData;
  className?: string;
  showDevControls?: boolean;
}

export function TokenMatter({
  initialData = DEFAULT_TOKEN_MATTER_MOCK,
  className = "",
  showDevControls = true,
}: TokenMatterProps) {
  const [data, setData] = useState<TokenMatterData>(initialData);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TokenCategory | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{
    cellIndex: number;
    tokenIndex: number;
    segment: TokenSegment | null;
    category: TokenCategory | null;
    localX: number;
    localY: number;
  } | null>(null);

  const activeSegment = hoveredInfo?.segment ?? null;

  return (
    <div className={cn("w-full select-none space-y-4", className)}>
      {/* SURFACE ÉDITORIALE UNIQUE SANS CONTENEURS IMBRIQUÉS */}
      <section className="flex flex-col rounded-[22px] border border-white/70 bg-white/45 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_8px_24px_-4px_rgba(0,0,0,0.035)] backdrop-blur-2xl transition-all duration-standard laptop:rounded-[26px] laptop:p-7">
        {/* 1. INSTRUMENTATION TYPOGRAPHIQUE SOBRE (SANS BADGES NI PILLS) */}
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-black/[0.05] pb-5">
          {/* Lecture Principale */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                TOKENS BURNED
              </span>
              <span className="h-1 w-1 rounded-full bg-text-muted/40" />
              <span className="font-mono text-[10.5px] font-medium text-text-muted">
                +{data.today.toLocaleString("fr-FR")} today
              </span>
            </div>

            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-[28px] font-bold leading-none tracking-[-0.04em] text-text-primary laptop:text-[34px]">
                {data.total.toLocaleString("fr-FR")}
              </span>
            </div>
          </div>

          {/* Instrumentation Typographique Silencieuse par Colonnes */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 tablet:grid-cols-4">
            {(
              [
                { id: "input", label: "INPUT", count: data.categories.input },
                { id: "output", label: "OUTPUT", count: data.categories.output },
                { id: "reasoning", label: "REASONING", count: data.categories.reasoning },
                { id: "cache", label: "CACHE", count: data.categories.cache },
              ] as const
            ).map(({ id, label, count }) => {
              const isSelected = selectedCategory === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? null : id)}
                  className={cn(
                    "flex flex-col text-left transition-all duration-fast focus-visible:outline-none",
                    isSelected ? "opacity-100" : "opacity-75 hover:opacity-100",
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-[9px] font-bold tracking-[0.14em]",
                      isSelected ? "text-accent-indigo" : "text-text-muted",
                    )}
                  >
                    {label}
                  </span>
                  <span className="font-mono text-[12px] font-bold tabular-nums text-text-primary">
                    {count.toLocaleString("fr-FR")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. SPÉCIMEN DE MATIÈRE EN CADRAGE AUTOMATIQUE (DANS L'ESPACE NÉGATIF NATUREL) */}
        <div
          onClick={() => setIsExpanded(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setIsExpanded(true)}
          className="group relative my-6 flex cursor-crosshair items-center justify-center focus-visible:outline-none"
        >
          <TokenMatterCanvas
            data={data}
            selectedCategory={selectedCategory}
            hoveredCellIndex={hoveredInfo?.cellIndex}
            onHoverCell={setHoveredInfo}
          />
        </div>

        {/* 3. LECTURE MICROSCOPIQUE DE PROVENANCE AU SURVOL */}
        <div className="flex min-h-[32px] items-center justify-between border-t border-black/[0.04] pt-3 font-mono text-[11px]">
          {activeSegment ? (
            <div className="flex flex-wrap items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-muted">{activeSegment.timestamp}</span>
                <span className="text-text-muted/40">·</span>
                <span className="font-bold text-text-primary">{activeSegment.mission}</span>
                <span className="text-text-muted/40">·</span>
                <span className="text-text-secondary">
                  {activeSegment.agent} ({activeSegment.model})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {activeSegment.category}
                </span>
                <span className="font-bold tabular-nums text-text-primary">
                  {(activeSegment.endToken - activeSegment.startToken).toLocaleString("fr-FR")} tokens
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full text-text-muted text-[10.5px]">
              <span>Survolez la matière pour examiner sa provenance microscopique</span>
              <span className="tabular-nums">
                Capacité dalle : {data.capacity.toLocaleString("fr-FR")} tokens
              </span>
            </div>
          )}
        </div>
      </section>

      {/* INSPECTEUR DÉVELOPPÉ MODAL AVEC ZOOM SÉMANTIQUE */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-dialog flex items-center justify-center p-4 backdrop-blur-md bg-black/25">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-4xl"
            >
              <TokenMatterExpanded data={data} onClose={() => setIsExpanded(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BANC DE CONTRÔLE DÉMO DEV */}
      {showDevControls && (
        <TokenMatterDemo
          data={data}
          onChangeData={setData}
          isActive={isActive}
          onToggleActive={() => setIsActive((prev) => !prev)}
        />
      )}
    </div>
  );
}

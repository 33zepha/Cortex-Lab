import type { TokenMatterData, TokenSegment, TokenCategory } from "./types";
import { cn } from "@/lib/cn";

interface TokenMatterInspectorProps {
  data: TokenMatterData;
  hoveredInfo: {
    cellIndex: number;
    tokenIndex: number;
    segment: TokenSegment | null;
    category: TokenCategory | null;
  } | null;
  activeCategory: TokenCategory | null;
  onSelectCategory: (category: TokenCategory | null) => void;
}

export function TokenMatterInspector({
  data,
  hoveredInfo,
  activeCategory,
  onSelectCategory,
}: TokenMatterInspectorProps) {
  const activeSegment = hoveredInfo?.segment ?? null;

  return (
    <div className="flex flex-col gap-3 font-mono text-[11px]">
      {/* 1. RÉPARTITION DES CATÉGORIES DE MATIÈRE */}
      <div className="grid grid-cols-2 gap-2 tablet:grid-cols-4">
        {(
          [
            { id: "input", label: "INPUT", value: data.categories.input, desc: "dense / solide" },
            { id: "output", label: "OUTPUT", value: data.categories.output, desc: "contraste fort" },
            { id: "reasoning", label: "REASONING", value: data.categories.reasoning, desc: "hachuré" },
            { id: "cache", label: "CACHE", value: data.categories.cache, desc: "aéré / léger" },
          ] as const
        ).map(({ id, label, value, desc }) => {
          const isSelected = activeCategory === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectCategory(isSelected ? null : id)}
              className={cn(
                "flex flex-col rounded-[8px] border p-2 text-left transition-all duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-indigo",
                isSelected
                  ? "border-accent-indigo/60 bg-accent-indigo/10 text-text-primary shadow-sm"
                  : "border-black/[0.06] bg-white/50 text-text-secondary hover:border-black/15 hover:bg-white hover:text-text-primary",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-[0.08em] text-text-muted">
                  {label}
                </span>
                <span className="text-[9px] text-text-muted">{desc}</span>
              </div>

              <span className="mt-1 font-mono text-[12px] font-bold tabular-nums text-text-primary">
                {value.toLocaleString("fr-FR")}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. DÉTAIL D'INSPECTION DE SEGMENT AU SURVOL */}
      <div className="min-h-[64px] rounded-[10px] border border-black/[0.06] bg-black/[0.02] p-2.5 backdrop-blur-md">
        {activeSegment ? (
          <div className="grid grid-cols-1 gap-2 tablet:grid-cols-4 tablet:items-center">
            <div>
              <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-text-muted">
                Horodatage
              </span>
              <p className="font-mono text-[11px] font-bold text-text-primary">
                {activeSegment.timestamp}
              </p>
            </div>

            <div>
              <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-text-muted">
                Mission
              </span>
              <p className="truncate font-mono text-[11px] font-bold text-text-primary">
                {activeSegment.mission}
              </p>
            </div>

            <div>
              <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-text-muted">
                Agent / Modèle
              </span>
              <p className="truncate font-mono text-[11px] font-bold text-text-secondary">
                {activeSegment.agent} · {activeSegment.model}
              </p>
            </div>

            <div className="tablet:text-right">
              <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-text-muted">
                Segment
              </span>
              <p className="font-mono text-[12px] font-bold tabular-nums text-accent-indigo">
                {(activeSegment.endToken - activeSegment.startToken).toLocaleString("fr-FR")} tokens
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-between text-text-muted">
            <span>Survolez la matrice de Hilbert pour inspecter un segment de calcul</span>
            <span className="text-[10px] tabular-nums">
              1 cellule = 256 tokens · Capacité dalle : 1 048 576
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

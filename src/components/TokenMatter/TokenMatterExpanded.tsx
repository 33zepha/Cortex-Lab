import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X, Layers, Bot, Tag } from "lucide-react";
import { TokenMatterCanvas } from "./TokenMatterCanvas";
import { TokenMatterInspector } from "./TokenMatterInspector";
import type { TokenMatterData, TokenSegment, TokenCategory } from "./types";
import { cn } from "@/lib/cn";

interface TokenMatterExpandedProps {
  data: TokenMatterData;
  onClose: () => void;
}

export function TokenMatterExpanded({ data, onClose }: TokenMatterExpandedProps) {
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<TokenCategory | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{
    cellIndex: number;
    tokenIndex: number;
    segment: TokenSegment | null;
    category: TokenCategory | null;
  } | null>(null);

  // Liste distincte des agents actifs
  const agents = useMemo(() => {
    const map = new Map<string, { agent: string; model: string; tokens: number }>();
    for (const seg of data.segments) {
      const count = seg.endToken - seg.startToken;
      const existing = map.get(seg.agent);
      if (existing) {
        existing.tokens += count;
      } else {
        map.set(seg.agent, { agent: seg.agent, model: seg.model, tokens: count });
      }
    }
    return Array.from(map.values());
  }, [data.segments]);

  // Démonstration Macro-unités récursives pour >1M tokens
  const macroTilesCount = Math.max(1, Math.ceil(data.total / data.capacity));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="rounded-[24px] border border-white/80 bg-white/70 p-6 shadow-2xl backdrop-blur-3xl"
    >
      {/* HEADER DE L'INSPECTEUR AVEC CONTRÔLES SÉMANTIQUES */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">
              CORTEX COMPUTATIONAL MATTER
            </span>
            <span className="rounded-full bg-accent-indigo/10 px-2 py-0.5 font-mono text-[10px] font-bold text-accent-indigo">
              Hilbert 64×64
            </span>
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-[28px] font-bold leading-none tracking-[-0.04em] text-text-primary">
              {data.total.toLocaleString("fr-FR")}
            </span>
            <span className="font-mono text-[12px] font-bold text-text-muted">tokens</span>
          </div>
        </div>

        {/* NIVEAUX DE ZOOM SÉMANTIQUE (1: Agrégat, 2: Agents, 3: Catégories) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-white/60 bg-white/60 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setActiveLevel(1);
                setSelectedAgent(null);
                setActiveCategory(null);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 font-mono text-[11px] font-bold transition-all duration-fast",
                activeLevel === 1
                  ? "bg-text-primary text-white shadow-sm"
                  : "text-text-secondary hover:bg-black/[0.04] hover:text-text-primary",
              )}
            >
              <Layers className="size-3" />
              <span>Niveau 1 · Agrégat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveLevel(2);
                setActiveCategory(null);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 font-mono text-[11px] font-bold transition-all duration-fast",
                activeLevel === 2
                  ? "bg-text-primary text-white shadow-sm"
                  : "text-text-secondary hover:bg-black/[0.04] hover:text-text-primary",
              )}
            >
              <Bot className="size-3" />
              <span>Niveau 2 · Agents</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveLevel(3);
                setSelectedAgent(null);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 font-mono text-[11px] font-bold transition-all duration-fast",
                activeLevel === 3
                  ? "bg-text-primary text-white shadow-sm"
                  : "text-text-secondary hover:bg-black/[0.04] hover:text-text-primary",
              )}
            >
              <Tag className="size-3" />
              <span>Niveau 3 · Matières</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l'inspecteur"
            className="flex size-8 items-center justify-center rounded-[8px] border border-black/[0.08] bg-white/70 text-text-secondary transition-all hover:bg-white hover:text-text-primary"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* CORPS DE L'INSPECTION : CHAMP DE MATIÈRE EN GRAND FORMAT (320px) + BLOCS SÉMANTIQUES */}
      <div className="my-6 grid grid-cols-1 items-start gap-6 laptop:grid-cols-12">
        {/* Champ de matière haute résolution Retina auto-framé */}
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-black/[0.06] bg-black/[0.02] p-5 backdrop-blur-md laptop:col-span-6">
          <TokenMatterCanvas
            data={data}
            selectedCategory={activeCategory}
            hoveredCellIndex={hoveredInfo?.cellIndex}
            onHoverCell={setHoveredInfo}
          />

          <div className="mt-3 flex items-center justify-between w-full font-mono text-[10px] text-text-muted">
            <span>Grille de Hilbert ordonnée (4 096 cellules)</span>
            <span>1 cellule = 256 tokens</span>
          </div>
        </div>

        {/* Panneau latéral des couches et filtres selon le niveau */}
        <div className="space-y-4 laptop:col-span-6">
          {activeLevel === 1 && (
            <div className="space-y-3 font-mono text-[11px]">
              <p className="font-bold text-text-primary">Capacité globale & Dalles récursives</p>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.max(4, macroTilesCount) }).map((_, i) => {
                  const isFull = i < Math.floor(data.total / data.capacity);
                  const isPartial = i === Math.floor(data.total / data.capacity);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex size-9 flex-col items-center justify-center rounded-[6px] border font-mono text-[10px] font-bold shadow-sm transition-all",
                        isFull
                          ? "border-text-primary bg-text-primary text-white"
                          : isPartial
                          ? "border-accent-indigo/60 bg-accent-indigo/15 text-accent-indigo"
                          : "border-black/[0.08] bg-white/40 text-text-muted",
                      )}
                    >
                      <span>1M</span>
                      <span className="text-[8px]">{isFull ? "■" : isPartial ? "▓" : "□"}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Chaque macro-dalle représente un bloc complet de 1 048 576 tokens. Les données sont accumulées continuellement dans l'espace de Hilbert.
              </p>
            </div>
          )}

          {activeLevel === 2 && (
            <div className="space-y-2 font-mono text-[11px]">
              <p className="font-bold text-text-primary">Segments par Agent & Modèle</p>
              <div className="space-y-1.5">
                {agents.map(({ agent, model, tokens }) => (
                  <button
                    key={agent}
                    type="button"
                    onClick={() => setSelectedAgent(selectedAgent === agent ? null : agent)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-[8px] border p-2.5 text-left transition-all duration-fast",
                      selectedAgent === agent
                        ? "border-accent-indigo/60 bg-accent-indigo/10 text-text-primary shadow-sm"
                        : "border-black/[0.06] bg-white/50 text-text-secondary hover:bg-white hover:text-text-primary",
                    )}
                  >
                    <div>
                      <span className="font-bold">{agent}</span>
                      <span className="ml-2 text-[10px] text-text-muted">({model})</span>
                    </div>

                    <span className="font-bold tabular-nums text-text-primary">
                      {tokens.toLocaleString("fr-FR")} tk
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeLevel === 3 && (
            <div className="space-y-2 font-mono text-[11px]">
              <p className="font-bold text-text-primary">Matières de Calcul</p>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Cliquez sur une catégorie pour isoler sa présence dans la matrice de Hilbert :
              </p>
            </div>
          )}

          <TokenMatterInspector
            data={data}
            hoveredInfo={hoveredInfo}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />
        </div>
      </div>
    </motion.div>
  );
}

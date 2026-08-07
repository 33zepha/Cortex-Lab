import { useState } from "react";
import { Plus, RotateCcw, Play, Pause, Sliders } from "lucide-react";
import type { TokenMatterData } from "./types";
import { cn } from "@/lib/cn";

interface TokenMatterDemoProps {
  data: TokenMatterData;
  onChangeData: (data: TokenMatterData) => void;
  isActive: boolean;
  onToggleActive: () => void;
}

export function TokenMatterDemo({
  data,
  onChangeData,
  isActive,
  onToggleActive,
}: TokenMatterDemoProps) {
  const [isOpen, setIsOpen] = useState(false);

  const addTokens = (amount: number) => {
    const newTotal = data.total + amount;
    const inputRatio = 0.65;
    const outputRatio = 0.17;
    const reasoningRatio = 0.14;
    const cacheRatio = 0.04;

    onChangeData({
      ...data,
      total: newTotal,
      today: data.today + amount,
      categories: {
        input: Math.round(newTotal * inputRatio),
        output: Math.round(newTotal * outputRatio),
        reasoning: Math.round(newTotal * reasoningRatio),
        cache: Math.round(newTotal * cacheRatio),
      },
    });
  };

  const setPreset = (tokens: number) => {
    const inputRatio = 0.65;
    const outputRatio = 0.17;
    const reasoningRatio = 0.14;
    const cacheRatio = 0.04;

    onChangeData({
      ...data,
      total: tokens,
      today: Math.min(tokens, 12841),
      categories: {
        input: Math.round(tokens * inputRatio),
        output: Math.round(tokens * outputRatio),
        reasoning: Math.round(tokens * reasoningRatio),
        cache: Math.round(tokens * cacheRatio),
      },
    });
  };

  return (
    <div className="flex flex-col gap-2 font-mono text-[11px]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 self-start rounded-[6px] border border-black/[0.08] bg-white/60 px-2.5 py-1 text-[10.5px] font-bold text-text-secondary transition-all hover:bg-white hover:text-text-primary"
      >
        <Sliders className="size-3" />
        <span>{isOpen ? "Fermer le Sandbox Démo" : "Contrôles Démo & Presets"}</span>
      </button>

      {isOpen && (
        <div className="rounded-[14px] border border-black/[0.08] bg-white/80 p-3.5 shadow-md backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-2.5">
            <span className="font-bold text-text-primary">Banc d'Essai & Presets de Vérification</span>
            <button
              type="button"
              onClick={onToggleActive}
              className={cn(
                "flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 font-bold transition-all",
                isActive
                  ? "border border-amber-500/40 bg-amber-500/15 text-amber-600"
                  : "border border-black/[0.08] bg-white/50 text-text-secondary",
              )}
            >
              {isActive ? <Pause className="size-3" /> : <Play className="size-3" />}
              <span>{isActive ? "Actif (Consommation)" : "Veille"}</span>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 tablet:grid-cols-2">
            {/* Incrémentation pas à pas */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
                Incréments Rapides
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => addTokens(1_000)}
                  className="flex items-center gap-1 rounded-[5px] border border-black/[0.08] bg-white px-2 py-1 hover:border-accent-indigo hover:text-accent-indigo"
                >
                  <Plus className="size-3" />
                  <span>+1k</span>
                </button>
                <button
                  type="button"
                  onClick={() => addTokens(10_000)}
                  className="flex items-center gap-1 rounded-[5px] border border-black/[0.08] bg-white px-2 py-1 hover:border-accent-indigo hover:text-accent-indigo"
                >
                  <Plus className="size-3" />
                  <span>+10k</span>
                </button>
                <button
                  type="button"
                  onClick={() => addTokens(100_000)}
                  className="flex items-center gap-1 rounded-[5px] border border-black/[0.08] bg-white px-2 py-1 hover:border-accent-indigo hover:text-accent-indigo"
                >
                  <Plus className="size-3" />
                  <span>+100k</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(184_392)}
                  className="flex items-center gap-1 rounded-[5px] border border-black/[0.08] bg-white px-2 py-1 text-text-muted hover:text-text-primary"
                >
                  <RotateCcw className="size-3" />
                  <span>Reset (184k)</span>
                </button>
              </div>
            </div>

            {/* Presets requis par le cahier des charges */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
                Presets de Contrôle
              </span>
              <div className="flex flex-wrap gap-1">
                {[
                  { label: "0", val: 0 },
                  { label: "72 (partiel)", val: 72 },
                  { label: "10k", val: 10_000 },
                  { label: "184 392", val: 184_392 },
                  { label: "750k", val: 750_000 },
                  { label: "1 048 575", val: 1_048_575 },
                  { label: "1 048 576 (Plein)", val: 1_048_576 },
                  { label: "1.25M (Overflow)", val: 1_250_000 },
                ].map(({ label, val }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setPreset(val)}
                    className={cn(
                      "rounded-[4px] px-1.5 py-0.5 text-[10px] transition-all",
                      data.total === val
                        ? "bg-text-primary text-white font-bold"
                        : "border border-black/[0.06] bg-white/60 text-text-secondary hover:bg-white",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

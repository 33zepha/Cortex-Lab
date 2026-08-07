import { useState } from "react";

export interface TokenPoint {
  day: string;
  tokens: number;
}

interface TokenUsageChartProps {
  data: TokenPoint[];
  onHoverPoint?: (point: TokenPoint | null) => void;
}

export function TokenUsageChart({ data, onHoverPoint }: TokenUsageChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data || data.length < 2) {
    return (
      <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-border bg-black/[0.01] text-xs text-text-muted">
        Pas de données de consommation
      </div>
    );
  }

  const maxTokens = Math.max(...data.map((u) => u.tokens), 1);

  return (
    <div className="w-full">
      <div className="relative h-[56px] w-full">
        {/* SVG arrière-plan : Courbe et zone de remplissage dégradée */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="token-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-warning, #f59e0b)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-warning, #f59e0b)" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Remplissage dégradé sous la courbe (Y maxé à 90% pour garder de l'espace en haut) */}
          <path
            d={`M 0 100 ${data.map((d, i) => `L ${(i / (data.length - 1)) * 100} ${100 - (d.tokens / maxTokens) * 85}`).join(" ")} L 100 100 Z`}
            fill="url(#token-area-grad)"
          />

          {/* Courbe principale avec épaisseur de trait constante */}
          <path
            d={data.map((d, i) => `${i === 0 ? "M" : "L"} ${(i / (data.length - 1)) * 100} ${100 - (d.tokens / maxTokens) * 85}`).join(" ")}
            fill="none"
            className="stroke-warning"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Couche HTML : Ligne de suivi et points parfaits (insensibles à la déformation d'aspect ratio) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Ligne témoin verticale */}
          {activeIndex !== null && (
            <div
              className="absolute top-0 bottom-0 w-[1.5px] border-l border-dashed border-warning/40 -translate-x-1/2"
              style={{ left: `${(activeIndex / (data.length - 1)) * 100}%` }}
            />
          )}

          {/* Cercles parfaits dessinés en HTML pur */}
          {data.map((d, i) => {
            const leftPct = (i / (data.length - 1)) * 100;
            const topPct = 100 - (d.tokens / maxTokens) * 85;

            return (
              <div
                key={i}
                className={`absolute size-2.5 rounded-full bg-white border-2 border-warning -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${
                  activeIndex === i
                    ? "scale-125 border-[3px] shadow-[0_0_8px_rgba(245,158,11,0.6)] z-10"
                    : "scale-100 z-0"
                }`}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                }}
              >
              </div>
            );
          })}
        </div>

        {/* Grille invisible pour capturer précisément le survol de la souris */}
        <div
          className="absolute inset-0 flex"
          onMouseLeave={() => {
            setActiveIndex(null);
            if (onHoverPoint) onHoverPoint(null);
          }}
        >
          {data.map((d, i) => (
            <div
              key={i}
              className="flex-1 h-full cursor-crosshair"
              onMouseEnter={() => {
                setActiveIndex(i);
                if (onHoverPoint) onHoverPoint(d);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

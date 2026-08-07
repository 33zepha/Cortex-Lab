import { useState, useId } from "react";
import { cn } from "@/lib/cn";

export interface TokenPoint {
  day: string;
  tokens: number;
}

interface TokenUsageChartProps {
  data: TokenPoint[];
  onHoverPoint?: (point: TokenPoint | null) => void;
  isRunning?: boolean;
}

export function TokenUsageChart({ data, onHoverPoint, isRunning = false }: TokenUsageChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const gradientId = useId();

  if (!data || data.length < 2) {
    return (
      <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-border bg-black/[0.01] font-mono text-[11px] text-text-muted">
        Pas de données
      </div>
    );
  }

  const maxTokens = Math.max(...data.map((u) => u.tokens), 100);
  const n = data.length;

  // Calcul des coordonnées SVG normalisées (0-100 x, 10-90 y)
  const points = data.map((d, i) => ({
    x: (i / (n - 1)) * 100,
    y: 92 - (d.tokens / maxTokens) * 78,
  }));

  // Construction de la courbe spline douce (bézier quadratique / cubique)
  let pathD = `M ${points[0]?.x ?? 0} ${points[0]?.y ?? 90}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    if (!current || !next) continue;
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    if (i === 0) {
      pathD += ` Q ${current.x} ${current.y}, ${midX} ${midY}`;
    } else {
      pathD += ` Q ${current.x} ${current.y}, ${midX} ${midY}`;
    }
  }
  const lastPoint = points[points.length - 1];
  if (lastPoint) {
    pathD += ` T ${lastPoint.x} ${lastPoint.y}`;
  }

  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  return (
    <div
      className="relative h-[72px] w-full select-none"
      onMouseLeave={() => {
        setHoveredIdx(null);
        if (onHoverPoint) onHoverPoint(null);
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.32" />
            <stop offset="70%" stopColor="#d97706" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Zone sous la courbe avec dégradé subtil */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Ligne d'onde principale fluide */}
        <path
          d={pathD}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="drop-shadow-[0_2px_8px_rgba(245,158,11,0.45)]"
        />
      </svg>

      {/* Point actif en direct (extrémité droite quand mission active) */}
      {lastPoint && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${lastPoint.x}%`, top: `${lastPoint.y}%` }}
        >
          <span className="relative flex size-2.5">
            {isRunning && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            )}
            <span
              className={cn(
                "relative inline-flex size-2.5 rounded-full border-2 border-white bg-amber-500 shadow-sm",
                isRunning && "shadow-[0_0_10px_#f59e0b]",
              )}
            />
          </span>
        </div>
      )}

      {/* Point témoin au survol interactif */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${points[hoveredIdx]?.x}%`,
            top: `${points[hoveredIdx]?.y}%`,
          }}
        >
          <div className="size-3 rounded-full border-2 border-white bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.9)]" />
        </div>
      )}

      {/* Zones de capture invisible pour le survol fluide */}
      <div className="absolute inset-0 flex">
        {data.map((point, i) => (
          <div
            key={i}
            onMouseEnter={() => {
              setHoveredIdx(i);
              if (onHoverPoint) onHoverPoint(point);
            }}
            className="h-full flex-1 cursor-pointer"
          />
        ))}
      </div>
    </div>
  );
}

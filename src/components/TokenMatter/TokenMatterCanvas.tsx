import { useEffect, useRef, useCallback, useMemo } from "react";
import {
  HILBERT_ORDER,
  TOKENS_PER_CELL,
  HILBERT_LOOKUP,
  xy2d,
} from "./hilbert";
import type { TokenMatterData, TokenSegment, TokenCategory } from "./types";

interface TokenMatterCanvasProps {
  data: TokenMatterData;
  hoveredCellIndex?: number | null;
  selectedCategory?: TokenCategory | null;
  onHoverCell?: (info: {
    cellIndex: number;
    tokenIndex: number;
    segment: TokenSegment | null;
    category: TokenCategory | null;
    localX: number;
    localY: number;
  } | null) => void;
  onClick?: () => void;
  className?: string;
}

export function TokenMatterCanvas({
  data,
  hoveredCellIndex = null,
  selectedCategory = null,
  onHoverCell,
  onClick,
  className = "",
}: TokenMatterCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Recherche du segment correspondant à un index de token
  const findSegmentForToken = useCallback(
    (tokenIndex: number): TokenSegment | null => {
      for (const seg of data.segments) {
        if (tokenIndex >= seg.startToken && tokenIndex < seg.endToken) {
          return seg;
        }
      }
      return null;
    },
    [data.segments],
  );

  // 1. Calcul de la Bounding Box de la matière réellement consommée (Auto-framing)
  const populatedCellsCount = useMemo(() => {
    const totalTokens = Math.min(data.total, data.capacity);
    return Math.max(1, Math.ceil(totalTokens / TOKENS_PER_CELL));
  }, [data.total, data.capacity]);

  const boundingBox = useMemo(() => {
    const { d2xyTable } = HILBERT_LOOKUP;
    let minX = 64;
    let minY = 64;
    let maxX = 0;
    let maxY = 0;

    const count = Math.min(populatedCellsCount, 4096);
    for (let d = 0; d < count; d++) {
      const pt = d2xyTable[d];
      if (!pt) continue;
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }

    if (minX > maxX) {
      minX = 0;
      minY = 0;
      maxX = 15;
      maxY = 15;
    }

    // Marge de respiration minimale (1 cellule)
    const pad = 1;
    const boundedMinX = Math.max(0, minX - pad);
    const boundedMinY = Math.max(0, minY - pad);
    const boundedMaxX = Math.min(63, maxX + pad);
    const boundedMaxY = Math.min(63, maxY + pad);

    const spanX = boundedMaxX - boundedMinX + 1;
    const spanY = boundedMaxY - boundedMinY + 1;

    return {
      minX: boundedMinX,
      minY: boundedMinY,
      maxX: boundedMaxX,
      maxY: boundedMaxY,
      spanX,
      spanY,
    };
  }, [populatedCellsCount]);

  // 2. Moteur de rendu Canvas haute densité pour matière continue sans quadrillage visible
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const cssWidth = Math.max(320, rect.width);
    // Aspect ratio basé sur le span naturel de la géométrie de Hilbert
    const targetAspect = Math.max(1.4, Math.min(2.8, boundingBox.spanX / boundingBox.spanY));
    const cssHeight = Math.round(cssWidth / targetAspect);

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // Échelle uniforme pour préserver la topologie exacte de Hilbert
    const scaleX = cssWidth / boundingBox.spanX;
    const scaleY = cssHeight / boundingBox.spanY;
    const unitScale = Math.min(scaleX, scaleY);

    const offsetX = (cssWidth - boundingBox.spanX * unitScale) / 2;
    const offsetY = (cssHeight - boundingBox.spanY * unitScale) / 2;

    const totalTokens = Math.min(data.total, data.capacity);
    const fullCellsCount = Math.floor(totalTokens / TOKENS_PER_CELL);
    const remainderTokens = totalTokens % TOKENS_PER_CELL;
    const partialFillFraction = remainderTokens / TOKENS_PER_CELL;

    const { d2xyTable } = HILBERT_LOOKUP;
    const isInspecting = hoveredCellIndex !== null;

    // Rendu encre continue sans bordure de cellules
    for (let d = 0; d < fullCellsCount; d++) {
      const pt = d2xyTable[d];
      if (!pt) continue;

      // Position dans le cadrage auto-framé
      const gridX = pt.x - boundingBox.minX;
      const gridY = pt.y - boundingBox.minY;
      const px = offsetX + gridX * unitScale;
      const py = offsetY + gridY * unitScale;

      const tokenIdx = d * TOKENS_PER_CELL;
      const seg = findSegmentForToken(tokenIdx);
      const cat = seg ? seg.category : "input";

      const isCategoryMatch = !selectedCategory || selectedCategory === cat;
      const isHovered = hoveredCellIndex === d;

      // Matière continue microscopique
      // Le survol atténue très légèrement (3-5%) le reste pour faire émerger la zone sous le microscope
      const baseAlpha = isInspecting ? (isHovered ? 1.0 : 0.78) : 0.88;

      if (!isCategoryMatch) {
        ctx.fillStyle = "rgba(148, 163, 184, 0.12)";
        ctx.fillRect(px, py, unitScale + 0.35, unitScale + 0.35);
        continue;
      }

      if (cat === "output") {
        // OUTPUT : Encre de carbone dense et profonde
        ctx.fillStyle = isHovered ? "#000000" : `rgba(15, 23, 42, ${baseAlpha * 1.0})`;
        ctx.fillRect(px, py, unitScale + 0.35, unitScale + 0.35);
      } else if (cat === "reasoning") {
        // REASONING : Micro-gravure hachurée / fine stippled texture
        ctx.fillStyle = isHovered ? "#1e293b" : `rgba(30, 41, 59, ${baseAlpha * 0.92})`;
        ctx.fillRect(px, py, unitScale + 0.35, unitScale + 0.35);

        // Texture interne microscopique
        if (unitScale >= 3.5) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.32)";
          ctx.fillRect(px + unitScale * 0.35, py + unitScale * 0.35, 1.2, 1.2);
        }
      } else if (cat === "cache") {
        // CACHE : Matière aérée à opacité poreuse
        ctx.fillStyle = isHovered ? "#475569" : `rgba(71, 85, 105, ${baseAlpha * 0.52})`;
        ctx.fillRect(px, py, unitScale + 0.35, unitScale + 0.35);
      } else {
        // INPUT : Encre régulière solide
        ctx.fillStyle = isHovered ? "#0f172a" : `rgba(30, 41, 59, ${baseAlpha * 0.84})`;
        ctx.fillRect(px, py, unitScale + 0.35, unitScale + 0.35);
      }

      // Résolution optique locale au microscope sur la zone sous le curseur
      if (isHovered) {
        ctx.strokeStyle = "rgba(0, 119, 230, 0.95)";
        ctx.lineWidth = 1.4;
        ctx.strokeRect(px - 0.5, py - 0.5, unitScale + 1, unitScale + 1);
      }
    }

    // Cellule active en cours de cristallisation
    if (partialFillFraction > 0 && fullCellsCount < 4096) {
      const pt = d2xyTable[fullCellsCount];
      if (pt) {
        const gridX = pt.x - boundingBox.minX;
        const gridY = pt.y - boundingBox.minY;
        const px = offsetX + gridX * unitScale;
        const py = offsetY + gridY * unitScale;
        const seg = findSegmentForToken(fullCellsCount * TOKENS_PER_CELL);
        const cat = seg ? seg.category : "input";

        const fillW = (unitScale + 0.35) * partialFillFraction;
        ctx.fillStyle = cat === "output" ? "#0f172a" : "#334155";
        ctx.fillRect(px, py, fillW, unitScale + 0.35);

        // Ligne de front de cristallisation
        ctx.fillStyle = "rgba(0, 119, 230, 0.95)";
        ctx.fillRect(px + fillW - 0.8, py, 1.4, unitScale + 0.35);
      }
    }

    ctx.restore();
  }, [
    data,
    boundingBox,
    hoveredCellIndex,
    selectedCategory,
    findSegmentForToken,
  ]);

  useEffect(() => {
    render();
    const handleResize = () => render();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [render]);

  // Détection continue au survol de la souris sur le cadrage auto-framé
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onHoverCell) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cssWidth = rect.width;
    const cssHeight = rect.height;

    const scaleX = cssWidth / boundingBox.spanX;
    const scaleY = cssHeight / boundingBox.spanY;
    const unitScale = Math.min(scaleX, scaleY);

    const offsetX = (cssWidth - boundingBox.spanX * unitScale) / 2;
    const offsetY = (cssHeight - boundingBox.spanY * unitScale) / 2;

    const relX = mouseX - offsetX;
    const relY = mouseY - offsetY;

    if (relX >= 0 && relX < boundingBox.spanX * unitScale && relY >= 0 && relY < boundingBox.spanY * unitScale) {
      const gridX = Math.floor(relX / unitScale);
      const gridY = Math.floor(relY / unitScale);
      const absX = boundingBox.minX + gridX;
      const absY = boundingBox.minY + gridY;

      if (absX >= 0 && absX < HILBERT_ORDER && absY >= 0 && absY < HILBERT_ORDER) {
        const cellIndex = xy2d(HILBERT_ORDER, absX, absY);
        const tokenIndex = cellIndex * TOKENS_PER_CELL;
        const segment = findSegmentForToken(tokenIndex);
        const category = segment ? segment.category : null;

        onHoverCell({
          cellIndex,
          tokenIndex,
          segment,
          category,
          localX: mouseX,
          localY: mouseY,
        });
        return;
      }
    }

    onHoverCell(null);
  };

  const handleMouseLeave = () => {
    if (onHoverCell) onHoverCell(null);
  };

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="block w-full cursor-crosshair select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        aria-label={`Token Matter: ${data.total.toLocaleString("fr-FR")} tokens`}
      />
    </div>
  );
}

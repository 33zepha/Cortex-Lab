import { describe, it, expect } from "vitest";
import {
  d2xy,
  xy2d,
  HILBERT_ORDER,
  TOKENS_PER_CELL,
  TILE_CAPACITY,
  createHilbertLookupTable,
} from "../../../src/components/TokenMatter/hilbert";

describe("Hilbert Curve Spatial Engine", () => {
  it("calcule la capacité exacte d'une dalle (64x64x256 = 1,048,576)", () => {
    expect(HILBERT_ORDER).toBe(64);
    expect(TOKENS_PER_CELL).toBe(256);
    expect(TILE_CAPACITY).toBe(1_048_576);
  });

  it("est une bijection exacte pour les 4 096 cellules", () => {
    const totalCells = HILBERT_ORDER * HILBERT_ORDER;
    const visited = new Set<string>();

    for (let d = 0; d < totalCells; d++) {
      const { x, y } = d2xy(HILBERT_ORDER, d);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(HILBERT_ORDER);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(HILBERT_ORDER);

      const key = `${x},${y}`;
      expect(visited.has(key)).toBe(false);
      visited.add(key);

      const recoveredD = xy2d(HILBERT_ORDER, x, y);
      expect(recoveredD).toBe(d);
    }

    expect(visited.size).toBe(totalCells);
  });

  it("génère une table de lookup cohérente et rapide", () => {
    const lookup = createHilbertLookupTable(HILBERT_ORDER);
    expect(lookup.d2xyTable.length).toBe(4096);
    expect(lookup.xy2dTable.length).toBe(4096);

    // Test sur des points arbitraires
    const sampleIndices = [0, 1, 72, 255, 256, 720, 1024, 4095];
    for (const d of sampleIndices) {
      const pt = lookup.d2xyTable[d];
      expect(pt).toBeDefined();
      if (pt) {
        const gridIndex = pt.y * HILBERT_ORDER + pt.x;
        expect(lookup.xy2dTable[gridIndex]).toBe(d);
      }
    }
  });

  it("décompose correctement le nombre de tokens en cellules complètes et fraction", () => {
    const totalTokens = 184_392;
    const fullCells = Math.floor(totalTokens / TOKENS_PER_CELL);
    const remainderTokens = totalTokens % TOKENS_PER_CELL;
    const fillFraction = remainderTokens / TOKENS_PER_CELL;

    expect(fullCells).toBe(720);
    expect(remainderTokens).toBe(72);
    expect(fillFraction).toBeCloseTo(72 / 256, 4);
  });
});

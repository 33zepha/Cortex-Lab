/**
 * Algorithme canonique de la courbe de remplissage de l'espace de Hilbert 2D.
 * Permet une bijection déterministe entre l'index linéaire de token [0..n²-1]
 * et les coordonnées spatiales cartésiennes (x, y) sur une grille n × n.
 */

export const HILBERT_ORDER = 64; // Grille 64 × 64 = 4 096 cellules
export const TOKENS_PER_CELL = 256; // 1 cellule = 256 tokens
export const TILE_CAPACITY = HILBERT_ORDER * HILBERT_ORDER * TOKENS_PER_CELL; // 1 048 576 tokens

/**
 * Convertit un index linéaire d en coordonnées spatiales (x, y) de Hilbert.
 */
export function d2xy(n: number, d: number): { x: number; y: number } {
  let rx = 0;
  let ry = 0;
  let s = 1;
  let t = Math.floor(d);
  let x = 0;
  let y = 0;

  while (s < n) {
    rx = 1 & Math.floor(t / 2);
    ry = 1 & (t ^ rx);

    if (ry === 0) {
      if (rx === 1) {
        x = s - 1 - x;
        y = s - 1 - y;
      }
      const tmp = x;
      x = y;
      y = tmp;
    }

    x += s * rx;
    y += s * ry;
    t = Math.floor(t / 4);
    s *= 2;
  }

  return { x, y };
}

/**
 * Convertit des coordonnées (x, y) de Hilbert en index linéaire d.
 */
export function xy2d(n: number, x: number, y: number): number {
  let rx = 0;
  let ry = 0;
  let d = 0;
  let s = Math.floor(n / 2);
  let currX = Math.floor(x);
  let currY = Math.floor(y);

  while (s > 0) {
    rx = (currX & s) > 0 ? 1 : 0;
    ry = (currY & s) > 0 ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);

    if (ry === 0) {
      if (rx === 1) {
        currX = s - 1 - currX;
        currY = s - 1 - currY;
      }
      const tmp = currX;
      currX = currY;
      currY = tmp;
    }

    s = Math.floor(s / 2);
  }

  return d;
}

/**
 * Précalcule la table de correspondance pour une grille 64 × 64
 * afin d'éviter tout re-calcul lors des rendus 60fps.
 */
export function createHilbertLookupTable(n: number = HILBERT_ORDER): {
  d2xyTable: Array<{ x: number; y: number }>;
  xy2dTable: Uint16Array;
} {
  const totalCells = n * n;
  const d2xyTable: Array<{ x: number; y: number }> = new Array(totalCells);
  const xy2dTable = new Uint16Array(totalCells);

  for (let d = 0; d < totalCells; d++) {
    const pt = d2xy(n, d);
    d2xyTable[d] = pt;
    const gridIndex = pt.y * n + pt.x;
    xy2dTable[gridIndex] = d;
  }

  return { d2xyTable, xy2dTable };
}

// Table singleton réutilisable pour la performance 60fps
export const HILBERT_LOOKUP = createHilbertLookupTable(HILBERT_ORDER);

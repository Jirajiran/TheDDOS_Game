import {
  L1_SIZE,
  L2_SIZE,
  L3_SIZE,
  PATH_DEBUG_COLORS,
  PATH_GRID_N,
  PATH_SIZE,
} from './config.js';

/**
 * Build Path grid world: N×N Paths of PATH_SIZE, indexed row-major 1..N²
 * (AskKeep: top-left origin; N=4 → 16 Paths). l3Size is the place cell.
 */
export function createWorld(pathGridN = PATH_GRID_N) {
  const n = Math.max(1, pathGridN | 0);
  const pathCount = n * n;
  const paths = new Array(pathCount);

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const index0 = row * n + col;
      const pathIndex = index0 + 1;
      paths[index0] = {
        index: pathIndex,
        col,
        row,
        x: col * PATH_SIZE,
        y: row * PATH_SIZE,
        w: PATH_SIZE,
        h: PATH_SIZE,
        color: PATH_DEBUG_COLORS[index0 % PATH_DEBUG_COLORS.length],
      };
    }
  }

  const worldW = n * PATH_SIZE;
  const worldH = n * PATH_SIZE;

  return {
    pathGridN: n,
    pathSize: PATH_SIZE,
    l1Size: L1_SIZE,
    l2Size: L2_SIZE,
    l3Size: L3_SIZE,
    pathCount,
    paths,
    worldW,
    worldH,
  };
}

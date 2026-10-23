import {
  L1_SIZE,
  L2_SIZE,
  L3_SIZE,
  PATH_DEBUG_COLORS,
  PATH_GRID_N,
  PATH_SIZE,
} from '../config.js';

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
      const edge = n <= 1 || col === 0 || row === 0 || col === n - 1 || row === n - 1;
      paths[index0] = {
        index: pathIndex,
        col,
        row,
        x: col * PATH_SIZE,
        y: row * PATH_SIZE,
        w: PATH_SIZE,
        h: PATH_SIZE,
        edge,
        color: PATH_DEBUG_COLORS[index0 % PATH_DEBUG_COLORS.length],
      };
    }
  }

  const edgeAreas = [];
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    if (!path.edge) continue;
    edgeAreas.push({
      id: edgeAreas.length,
      pathIndex: path.index,
      x: path.x,
      y: path.y,
      w: path.w,
      h: path.h,
      open: true,
    });
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
    edgeAreas,
    worldW,
    worldH,
  };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Recompute open flags. Closed when the area rect cuts baseChunk. Areas are never added or removed. */
export function refreshEdgeAreas(match) {
  const areas = match.world && match.world.edgeAreas;
  if (!areas) return;
  const zone = match.baseChunk;
  for (let i = 0; i < areas.length; i++) {
    const area = areas[i];
    area.open = !(zone && rectsOverlap(area, zone));
  }
}

export function footprintHitsEdgePath(world, gx, gy, fw, fh) {
  if (!world || !world.paths) return false;
  const n = world.pathGridN;
  const cells = Math.round(world.pathSize / world.l3Size);
  for (let dy = 0; dy < fh; dy++) {
    for (let dx = 0; dx < fw; dx++) {
      const col = Math.floor((gx + dx) / cells);
      const row = Math.floor((gy + dy) / cells);
      if (col < 0 || row < 0 || col >= n || row >= n) continue;
      const path = world.paths[row * n + col];
      if (path && path.edge) return true;
    }
  }
  return false;
}

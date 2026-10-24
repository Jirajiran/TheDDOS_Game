import {
  L1_SIZE,
  L2_SIZE,
  L3_SIZE,
  PATH_DEBUG_COLORS,
  PATH_GRID_N,
  PATH_SIZE,
} from '../config.js';
import { getBalancePack } from '../defs/gamePack.js';

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
    const rect = edgeAreaRect(path, n);
    edgeAreas.push({
      id: edgeAreas.length,
      pathIndex: path.index,
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
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

function areaCellCounts() {
  let cellsW = 3;
  let cellsH = 3;
  try {
    const area = getBalancePack().area;
    if (area && area.cellsW > 0) cellsW = area.cellsW | 0;
    if (area && area.cellsH > 0) cellsH = area.cellsH | 0;
  } catch (_) {
    cellsW = 3;
    cellsH = 3;
  }
  return { cellsW, cellsH };
}

function snapSpan(origin, span, size, cell) {
  if (size >= span) return origin;
  const raw = origin + (span - size) / 2;
  const steps = Math.round((raw - origin) / cell);
  let value = origin + steps * cell;
  const max = origin + Math.floor((span - size) / cell) * cell;
  if (value < origin) value = origin;
  if (value > max) value = max;
  return value;
}

/** One Area id: cellsW by cellsH on the L3 grid, flush to the outer rim. */
function edgeAreaRect(path, n) {
  const counts = areaCellCounts();
  const cell = L3_SIZE;
  const w = counts.cellsW * cell;
  const h = counts.cellsH * cell;
  const west = path.col === 0;
  const east = path.col === n - 1;
  const north = path.row === 0;
  const south = path.row === n - 1;
  let x = path.x;
  let y = path.y;
  if (north && west) {
    x = path.x;
    y = path.y;
  } else if (north && east) {
    x = path.x + path.w - w;
    y = path.y;
  } else if (south && west) {
    x = path.x;
    y = path.y + path.h - h;
  } else if (south && east) {
    x = path.x + path.w - w;
    y = path.y + path.h - h;
  } else if (north) {
    x = snapSpan(path.x, path.w, w, cell);
    y = path.y;
  } else if (south) {
    x = snapSpan(path.x, path.w, w, cell);
    y = path.y + path.h - h;
  } else if (west) {
    x = path.x;
    y = snapSpan(path.y, path.h, h, cell);
  } else {
    x = path.x + path.w - w;
    y = snapSpan(path.y, path.h, h, cell);
  }
  return { x, y, w, h };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Rewrite each Area rect from the current cell settings, then the open flag. Ids stay put. */
export function refreshEdgeAreas(match) {
  const world = match.world;
  const areas = world && world.edgeAreas;
  if (!areas) return;
  const n = world.pathGridN;
  const zone = match.baseChunk;
  for (let i = 0; i < areas.length; i++) {
    const area = areas[i];
    const path = world.paths[area.pathIndex - 1];
    if (path) {
      const rect = edgeAreaRect(path, n);
      area.x = rect.x;
      area.y = rect.y;
      area.w = rect.w;
      area.h = rect.h;
    }
    area.open = !(zone && rectsOverlap(area, zone));
  }
}

const SPAWN_INSET = 16;

/** Outer-edge midpoint. Corners use the outer corner. Inset keeps the body inside the chunk. */
export function edgeSpawnAnchor(area, world, slot) {
  const path = world && world.paths && world.paths[area.pathIndex - 1];
  const n = world && world.pathGridN ? world.pathGridN : 1;
  const col = path ? path.col : 0;
  const row = path ? path.row : 0;
  const west = col === 0;
  const east = col === n - 1;
  const north = row === 0;
  const south = row === n - 1;
  let x = area.x + area.w * 0.5;
  let y = area.y + area.h * 0.5;
  let ix = 0;
  let iy = 0;
  let tx = 1;
  let ty = 0;
  if (north && west) {
    x = area.x;
    y = area.y;
    ix = 1;
    iy = 1;
    tx = 1;
    ty = 0;
  } else if (north && east) {
    x = area.x + area.w;
    y = area.y;
    ix = -1;
    iy = 1;
    tx = 0;
    ty = 1;
  } else if (south && west) {
    x = area.x;
    y = area.y + area.h;
    ix = 1;
    iy = -1;
    tx = 0;
    ty = -1;
  } else if (south && east) {
    x = area.x + area.w;
    y = area.y + area.h;
    ix = -1;
    iy = -1;
    tx = -1;
    ty = 0;
  } else if (north) {
    x = area.x + area.w * 0.5;
    y = area.y;
    ix = 0;
    iy = 1;
    tx = 1;
    ty = 0;
  } else if (south) {
    x = area.x + area.w * 0.5;
    y = area.y + area.h;
    ix = 0;
    iy = -1;
    tx = 1;
    ty = 0;
  } else if (west) {
    x = area.x;
    y = area.y + area.h * 0.5;
    ix = 1;
    iy = 0;
    tx = 0;
    ty = 1;
  } else if (east) {
    x = area.x + area.w;
    y = area.y + area.h * 0.5;
    ix = -1;
    iy = 0;
    tx = 0;
    ty = 1;
  }
  const along = ((slot % 5) - 2) * 36;
  x += ix * SPAWN_INSET + tx * along;
  y += iy * SPAWN_INSET + ty * along;
  return {
    x: Math.max(area.x + SPAWN_INSET, Math.min(area.x + area.w - SPAWN_INSET, x)),
    y: Math.max(area.y + SPAWN_INSET, Math.min(area.y + area.h - SPAWN_INSET, y)),
  };
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

import { L3_SIZE } from './config.js';

/**
 * L3 occupancy grid for placed blocks / base footprints.
 * Flat array indexed row-major: index = gy * cols + gx.
 * Block lookup for walk/projectile flags lives on match.blocks by id.
 */
export function createOccupancy(world) {
  const cols = Math.round(world.worldW / L3_SIZE);
  const rows = Math.round(world.worldH / L3_SIZE);
  const cells = new Int32Array(cols * rows);
  for (let i = 0; i < cells.length; i++) cells[i] = -1;
  return { cols, rows, cells, nextBlockId: 1 };
}

export function worldToL3(x, y) {
  return {
    gx: Math.floor(x / L3_SIZE),
    gy: Math.floor(y / L3_SIZE),
  };
}

export function l3OriginWorld(gx, gy) {
  return { x: gx * L3_SIZE, y: gy * L3_SIZE };
}

export function snapWorldToL3Origin(x, y) {
  const { gx, gy } = worldToL3(x, y);
  return { gx, gy, ...l3OriginWorld(gx, gy) };
}

export function occupancyIndex(occ, gx, gy) {
  if (gx < 0 || gy < 0 || gx >= occ.cols || gy >= occ.rows) return -1;
  return gy * occ.cols + gx;
}

export function isCellOccupied(occ, gx, gy) {
  const i = occupancyIndex(occ, gx, gy);
  if (i < 0) return true;
  return occ.cells[i] >= 0;
}

export function getCellOwner(occ, gx, gy) {
  const i = occupancyIndex(occ, gx, gy);
  if (i < 0) return -1;
  return occ.cells[i];
}

/**
 * Footprint validity: in-bounds + no occupied cells.
 * standingCells: optional Set of "gx,gy" the placer occupies — also invalid.
 */
export function canPlaceFootprint(occ, gx, gy, fw, fh, standingCells) {
  if (gx < 0 || gy < 0 || gx + fw > occ.cols || gy + fh > occ.rows) {
    return false;
  }
  for (let dy = 0; dy < fh; dy++) {
    for (let dx = 0; dx < fw; dx++) {
      const cx = gx + dx;
      const cy = gy + dy;
      if (isCellOccupied(occ, cx, cy)) return false;
      if (standingCells && standingCells.has(`${cx},${cy}`)) return false;
    }
  }
  return true;
}

export function markFootprint(occ, gx, gy, fw, fh, blockId) {
  for (let dy = 0; dy < fh; dy++) {
    for (let dx = 0; dx < fw; dx++) {
      const i = occupancyIndex(occ, gx + dx, gy + dy);
      if (i >= 0) occ.cells[i] = blockId;
    }
  }
}

export function clearFootprint(occ, gx, gy, fw, fh) {
  for (let dy = 0; dy < fh; dy++) {
    for (let dx = 0; dx < fw; dx++) {
      const i = occupancyIndex(occ, gx + dx, gy + dy);
      if (i >= 0) occ.cells[i] = -1;
    }
  }
}

/** Cells a unit of given radius overlaps (center-based). */
export function unitStandingCells(x, y, radius) {
  const set = new Set();
  const minX = x - radius;
  const maxX = x + radius;
  const minY = y - radius;
  const maxY = y + radius;
  const g0 = worldToL3(minX, minY);
  const g1 = worldToL3(maxX, maxY);
  for (let gy = g0.gy; gy <= g1.gy; gy++) {
    for (let gx = g0.gx; gx <= g1.gx; gx++) {
      set.add(`${gx},${gy}`);
    }
  }
  return set;
}

/**
 * Resolve circle vs solid L3 occupancy — respects open doors / flags.
 * @param {object} unit
 * @param {object} occ
 * @param {(blockId:number)=>object|null} getBlock
 */
export function resolveUnitVsOccupancy(unit, occ, getBlock) {
  if (!unit || !occ) return;
  const r = unit.radius;
  const { gx, gy } = worldToL3(unit.x, unit.y);
  const pad = 2;
  const gMinX = Math.max(0, gx - pad);
  const gMaxX = Math.min(occ.cols - 1, gx + pad);
  const gMinY = Math.max(0, gy - pad);
  const gMaxY = Math.min(occ.rows - 1, gy + pad);

  for (let cy = gMinY; cy <= gMaxY; cy++) {
    for (let cx = gMinX; cx <= gMaxX; cx++) {
      const owner = getCellOwner(occ, cx, cy);
      if (owner < 0) continue;
      if (getBlock) {
        const block = getBlock(owner);
        if (block && !blockWalkSolid(block)) continue;
      }
      const rx = cx * L3_SIZE;
      const ry = cy * L3_SIZE;
      const rw = L3_SIZE;
      const rh = L3_SIZE;
      const closestX = clamp(unit.x, rx, rx + rw);
      const closestY = clamp(unit.y, ry, ry + rh);
      let dx = unit.x - closestX;
      let dy = unit.y - closestY;
      const distSq = dx * dx + dy * dy;
      if (distSq >= r * r) continue;
      if (distSq < 1e-8) {
        const left = unit.x - rx;
        const right = rx + rw - unit.x;
        const top = unit.y - ry;
        const bottom = ry + rh - unit.y;
        const m = Math.min(left, right, top, bottom);
        if (m === left) unit.x = rx - r;
        else if (m === right) unit.x = rx + rw + r;
        else if (m === top) unit.y = ry - r;
        else unit.y = ry + rh + r;
        continue;
      }
      const dist = Math.sqrt(distSq);
      const push = (r - dist) / dist;
      unit.x += dx * push;
      unit.y += dy * push;
    }
  }
}

export function blockWalkSolid(block) {
  if (!block || !block.alive) return false;
  if (block.isOpen) return false;
  if (block.walkSolid === false) return false;
  return true;
}

export function blockProjectileSolid(block) {
  if (!block || !block.alive) return false;
  if (block.allowProjectilePass || block.projectileSolid === false) return false;
  if (block.isOpen) return false;
  return true;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

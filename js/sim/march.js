/**
 * Straight march from the bot into BaseChunk.
 * One perpendicular bend around a nature block. A blocked bend walks straight
 * and reports that block so the existing melee pipe can take it.
 */

function segmentHitsRect(x0, y0, x1, y1, rect) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  let t0 = 0;
  let t1 = 1;
  const slabs = [
    { p: x0, d: dx, min: rect.x, max: rect.x + rect.w },
    { p: y0, d: dy, min: rect.y, max: rect.y + rect.h },
  ];
  for (let i = 0; i < slabs.length; i++) {
    const slab = slabs[i];
    if (Math.abs(slab.d) < 1e-8) {
      if (slab.p < slab.min || slab.p > slab.max) return false;
      continue;
    }
    let near = (slab.min - slab.p) / slab.d;
    let far = (slab.max - slab.p) / slab.d;
    if (near > far) {
      const swap = near;
      near = far;
      far = swap;
    }
    if (near > t0) t0 = near;
    if (far < t1) t1 = far;
    if (t0 > t1) return false;
  }
  return t1 >= 0 && t0 <= 1;
}

function segmentHitsHarvest(match, x0, y0, x1, y1) {
  const blocks = match.blocks;
  if (!blocks) return null;
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block || !block.alive || !block.isHarvest) continue;
    if (segmentHitsRect(x0, y0, x1, y1, block)) return block;
  }
  return null;
}

export function marchIntoBaseChunk(match, unit) {
  const zone = match.baseChunk;
  if (!zone || !unit) return null;
  const cx = zone.x + zone.w * 0.5;
  const cy = zone.y + zone.h * 0.5;
  const inside =
    unit.x >= zone.x &&
    unit.x <= zone.x + zone.w &&
    unit.y >= zone.y &&
    unit.y <= zone.y + zone.h;
  if (inside) {
    return { goal: { x: unit.x, y: unit.y, radius: 48 }, attackBlock: null };
  }
  const hit = segmentHitsHarvest(match, unit.x, unit.y, cx, cy);
  if (!hit) {
    return { goal: { x: cx, y: cy, radius: 48 }, attackBlock: null };
  }
  const dx = cx - unit.x;
  const dy = cy - unit.y;
  const len = Math.hypot(dx, dy) || 1;
  const side = unit.id % 2 === 0 ? 1 : -1;
  const bend = 192;
  const bx = unit.x + dx * 0.45 + (-dy / len) * side * bend;
  const by = unit.y + dy * 0.45 + (dx / len) * side * bend;
  if (segmentHitsHarvest(match, unit.x, unit.y, bx, by)) {
    return { goal: { x: cx, y: cy, radius: 48 }, attackBlock: hit };
  }
  return { goal: { x: bx, y: by, radius: 48 }, attackBlock: null };
}

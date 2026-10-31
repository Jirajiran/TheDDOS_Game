/**
 * SpawnPolicy — edge-of-world candidates only; baseChunk = mask (no spawn inside).
 * Systems ask policy for positions; they do not invent map-wide random spawns.
 */

import { GAME_PACK, L3_SIZE } from '../config.js';

/**
 * Point on world perimeter (outer ring), evenly spaced by index/total.
 * @returns {{ x: number, y: number }}
 */
export function perimeterPoint(world, index, total, margin = 40) {
  const peri = 2 * (world.worldW + world.worldH);
  let t = ((index + 0.5) / Math.max(1, total)) * peri;
  let x;
  let y;
  if (t < world.worldW) {
    x = t;
    y = margin;
  } else if (t < world.worldW + world.worldH) {
    x = world.worldW - margin;
    y = t - world.worldW;
  } else if (t < 2 * world.worldW + world.worldH) {
    x = world.worldW - (t - world.worldW - world.worldH);
    y = world.worldH - margin;
  } else {
    x = margin;
    y = world.worldH - (t - 2 * world.worldW - world.worldH);
  }
  return { x, y };
}

function pointInRect(x, y, rect) {
  return (
    x >= rect.x &&
    y >= rect.y &&
    x <= rect.x + rect.w &&
    y <= rect.y + rect.h
  );
}

/**
 * Push point outside exclude rect (baseChunk + pad) along dominant axis.
 */
export function pushOutsideMask(x, y, exclude) {
  if (!exclude || !pointInRect(x, y, exclude)) return { x, y };
  const cx = exclude.cx != null ? exclude.cx : exclude.x + exclude.w / 2;
  const cy = exclude.cy != null ? exclude.cy : exclude.y + exclude.h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  let nx = x;
  let ny = y;
  if (absX > absY) {
    nx = dx >= 0 ? exclude.x + exclude.w + 8 : exclude.x - 8;
  } else {
    ny = dy >= 0 ? exclude.y + exclude.h + 8 : exclude.y - 8;
  }
  return { x: nx, y: ny };
}

/**
 * Build spawn exclusion from baseChunk (mask). Pad in L3 cells from pack.
 */
export function buildBaseSpawnMask(match) {
  const pack = GAME_PACK;
  const zone =
    match.baseChunk ||
    (match.base
      ? {
          x: match.base.x,
          y: match.base.y,
          w: match.base.w,
          h: match.base.h,
          cx: match.base.x + match.base.w / 2,
          cy: match.base.y + match.base.h / 2,
        }
      : null);
  if (!zone) return null;
  const excludePad =
    ((pack.baseSpawnExclusionL3 != null ? pack.baseSpawnExclusionL3 : 4) *
      L3_SIZE) ||
    0;
  return {
    x: zone.x - excludePad,
    y: zone.y - excludePad,
    w: zone.w + excludePad * 2,
    h: zone.h + excludePad * 2,
    cx: zone.cx != null ? zone.cx : zone.x + zone.w / 2,
    cy: zone.cy != null ? zone.cy : zone.y + zone.h / 2,
  };
}

function triggerAreas() {
  const areas = GAME_PACK.areas;
  if (!Array.isArray(areas)) return [];
  const next = [];
  for (let i = 0; i < areas.length; i++) {
    const area = areas[i];
    if (area && area.condition === 'EnterArea') next.push(area);
  }
  return next;
}

/** Center of player_start, or the world center. */
export function pickPlayerSpawnPoint(world) {
  const areas = GAME_PACK.areas || [];
  for (let i = 0; i < areas.length; i++) {
    const area = areas[i];
    if (!area || area.id !== 'player_start') continue;
    return {
      x: Math.max(0, Math.min(world.worldW, area.x + area.w * 0.5)),
      y: Math.max(0, Math.min(world.worldH, area.y + area.h * 0.5)),
    };
  }
  return { x: world.worldW * 0.5, y: world.worldH * 0.5 };
}

/** A stable point inside an area rect. */
export function pointInArea(area, slot, steps) {
  const u = (slot + 0.5) / Math.max(1, steps);
  if (!area) return { x: 0, y: 0 };
  if ((area.w || 0) >= (area.h || 0)) {
    return { x: area.x + u * area.w, y: area.y + area.h * 0.5 };
  }
  return { x: area.x + area.w * 0.5, y: area.y + u * area.h };
}

/**
 * Enemy spawn inside the map's fixed team areas, then outside the base mask.
 * @param {object} match
 * @param {number} index
 * @param {number} total
 */
export function pickEdgeSpawnPosition(match, index, total) {
  const world = match.world;
  const margin = 40;
  const areas = triggerAreas();
  let x;
  let y;
  if (areas.length) {
    const area = areas[index % areas.length];
    const steps = Math.max(1, Math.ceil(total / areas.length));
    const slot = Math.floor(index / areas.length);
    const point = pointInArea(area, slot, steps);
    x = point.x;
    y = point.y;
  } else {
    const edge = perimeterPoint(world, index, total, margin);
    x = edge.x;
    y = edge.y;
  }
  const mask = buildBaseSpawnMask(match);
  if (mask) {
    const pushed = pushOutsideMask(x, y, mask);
    x = pushed.x;
    y = pushed.y;
  }
  x = Math.max(margin, Math.min(world.worldW - margin, x));
  y = Math.max(margin, Math.min(world.worldH - margin, y));
  return { x, y };
}

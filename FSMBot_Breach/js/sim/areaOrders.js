/**
 * Area commands. EnterArea + MoveTo sends a unit of that area's team toward target.
 * The player keeps input control.
 */

import { GAME_PACK } from '../config.js';

function areas() {
  return Array.isArray(GAME_PACK.areas) ? GAME_PACK.areas : [];
}

function areaById(id) {
  const list = areas();
  for (let i = 0; i < list.length; i++) {
    if (list[i] && list[i].id === id) return list[i];
  }
  return null;
}

function inside(unit, area) {
  return (
    unit.x >= area.x &&
    unit.y >= area.y &&
    unit.x <= area.x + area.w &&
    unit.y <= area.y + area.h
  );
}

/** If the unit is inside an EnterArea command and has no order yet, take it. */
export function claimAreaOrder(unit) {
  if (!unit || unit.role === 'player' || unit.areaOrder) return;
  const list = areas();
  for (let i = 0; i < list.length; i++) {
    const area = list[i];
    if (!area || area.condition !== 'EnterArea' || area.action !== 'MoveTo') {
      continue;
    }
    if (area.team == null || (unit.team | 0) !== (area.team | 0)) continue;
    if (!inside(unit, area)) continue;
    const target = areaById(area.target);
    if (!target) return;
    unit.areaOrder = {
      fromId: area.id,
      targetId: target.id,
      x: target.x + target.w * 0.5,
      y: target.y + target.h * 0.5,
    };
    return;
  }
}

/** Unit direction toward the order. Clears the order on arrival. */
export function steerAreaOrder(unit) {
  const order = unit && unit.areaOrder;
  if (!order) return null;
  const dx = order.x - unit.x;
  const dy = order.y - unit.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 48) {
    unit.areaOrder = null;
    return null;
  }
  return { dx: dx / dist, dy: dy / dist };
}

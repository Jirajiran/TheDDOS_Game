import { playSfx } from '../audio/sfx.js';
import {
  GAME_PACK,
  L3_SIZE,
  TEAM,
  WIRE_MELEE_MULT,
  getItemDef,
} from '../config.js';
import {
  getActiveSlot,
  isToolSlot,
} from '../player/inventory.js';
import {
  applyBlockRepair,
  resolveFistVsUnit,
  resolveMeleeVsBlock,
  tickMeleeSwing,
  tryBeginMeleeSwing,
} from '../combat/meleeTools.js';
import {
  applyDamageToBlock,
} from './block.js';
import {
  applyDamageToUnit,
  resolveUnitInventory,
} from './unit.js';
export function tryHarvest(match, unit, _wx, _wy) {
  const inv = resolveUnitInventory(match, unit);
  if (!inv) return;
  const slot = getActiveSlot(inv.inventory, inv.activeHotbar);
  if (!isToolSlot(slot)) return;
  const def = getItemDef(slot.itemId);
  if (!def) return;

  // Shared pipeline: open 0.1s → close → tool cooldown 0.2s (spam fails).
  tryBeginMeleeSwing(unit, {
    source: 'TOOL',
    toolId: slot.itemId,
    activeDurationSec: def.activeDurationSec != null ? def.activeDurationSec : 0.1,
    cooldownSec: def.cooldownSec != null ? def.cooldownSec : 0.2,
    damage: def.harvestDamage || def.structureDamage || 20,
    hitUnits: false,
    hitBlocks: true,
    vfxSize: Math.round(L3_SIZE * 0.9),
    color: def.color || '#c0b080',
  });
}

export function tickAllMeleeSwings(match, dt) {
  const units = match.pools && match.pools.units;
  if (!units) return;
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    if (!unit.active) continue;
    if (!tickMeleeSwing(unit, dt)) continue;
    applyMeleeSwingHits(match, unit);
  }
}

export function applyMeleeSwingHits(match, unit) {
  const sw = unit.meleeSwing;
  if (!sw) return;
  const vol = getMeleeVolume(unit, { toolId: sw.toolId });
  spawnMeleeVfx(match, unit, sw);

  const sourceTeam =
    unit.team != null
      ? unit.team
      : unit.role === 'enemy'
        ? TEAM.ENEMY
        : TEAM.PLAYER;

  if (sw.hitBlocks) {
    const toolDef = sw.toolId ? getItemDef(sw.toolId) : null;
    const targets = blocksOverlappingMeleeVolume(match, vol);
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (toolDef) {
        const resolved = resolveMeleeVsBlock(sourceTeam, toolDef, target);
        if (resolved.kind === 'repair') {
          const healed = applyBlockRepair(target, resolved.amount);
          if (healed > 0 && unit.role === 'player') {
            match.interactPrompt = `Repaired ${target.label || target.itemId} +${Math.round(healed)}`;
          }
          if (healed > 0) playSfx('combat.hit.fix');
          if (
            healed > 0 &&
            unit.blackboard &&
            unit.blackboard.repairTargetId === target.id &&
            target.hp >= target.maxHp
          ) {
            unit.blackboard.repairTargetId = -1;
            if (unit.blackboard.flags) unit.blackboard.flags.REPAIR_INTENT = false;
          }
          continue;
        }
        if (resolved.kind !== 'damage') {
          if (resolved.reason === 'wrong_tool_tier' && unit.role === 'player') {
            match.interactPrompt = 'Wrong tool tier';
          }
          continue;
        }
        applyDamageToBlock(match, target, resolved.amount, 'DEFAULT', {
          sourceTeam,
          damageKind: 'TOOL',
          impact: true,
        });
      } else if (sw.source === 'FIST') {
        // Fist damages structures / wire (WIRE_MELEE_MULT via DEFAULT type).
        applyDamageToBlock(match, target, sw.damage, 'DEFAULT', {
          sourceTeam,
          damageKind: 'TOOL',
          impact: true,
        });
      }
    }
  }

  if (sw.hitUnits || sw.source === 'FIST') {
    const unitHits = unitsOverlappingMeleeVolume(match, unit, vol);
    for (let i = 0; i < unitHits.length; i++) {
      const other = unitHits[i];
      if (sw.toolId) {
        const toolDef = getItemDef(sw.toolId);
        // Tools do not hit living units (wrench/axe matrix).
        if (toolDef) continue;
      }
      const resolved = resolveFistVsUnit(sw.damage, unit.meleeMultiplier);
      if (resolved.kind !== 'damage') continue;
      applyDamageToUnit(match, other, resolved.amount, {
        sourceTeam,
        sourceX: unit.x,
        sourceY: unit.y,
        impact: true,
      });
    }
  }
}

export function unitsOverlappingMeleeVolume(match, attacker, vol) {
  const out = [];
  const units = match.pools.units;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active || u.id === attacker.id) continue;
    if (u.team === attacker.team) continue;
    if (circleOverlapsMeleeVolume(u.x, u.y, u.radius || 12, vol)) out.push(u);
  }
  return out;
}

export function circleOverlapsMeleeVolume(cx, cy, r, vol) {
  const cos = Math.cos(vol.ang);
  const sin = Math.sin(vol.ang);
  const dx = cx - vol.ox;
  const dy = cy - vol.oy;
  const lx = dx * cos + dy * sin;
  const ly = -dx * sin + dy * cos;
  const x0 = vol.start;
  const x1 = vol.start + vol.reach;
  const y0 = -vol.halfW;
  const y1 = vol.halfW;
  const qx = Math.max(x0, Math.min(x1, lx));
  const qy = Math.max(y0, Math.min(y1, ly));
  const ex = lx - qx;
  const ey = ly - qy;
  return ex * ex + ey * ey <= r * r;
}

export function spawnMeleeVfx(match, unit, sw) {
  if (!match.meleeVfx) match.meleeVfx = [];
  const ang =
    typeof unit.aimRad === 'number' ? unit.aimRad : unit.facingRad || 0;
  const reach = (GAME_PACK.meleeReach || L3_SIZE) * 0.55;
  match.meleeVfx.push({
    x: unit.x + Math.cos(ang) * (unit.radius + reach * 0.5),
    y: unit.y + Math.sin(ang) * (unit.radius + reach * 0.5),
    ang,
    life: 0.14,
    maxLife: 0.14,
    size: Math.min(L3_SIZE, sw.vfxSize || L3_SIZE * 0.85),
    color: sw.color || '#e8dcc0',
  });
}

export function tickMeleeVfx(match, dt) {
  const list = match.meleeVfx;
  if (!list || !list.length) return;
  for (let i = list.length - 1; i >= 0; i--) {
    list[i].life -= dt;
    if (list[i].life <= 0) list.splice(i, 1);
  }
}

export function tickExplosionVfx(match, dt) {
  const list = match.explosionVfx;
  if (!list || !list.length) return;
  for (let i = list.length - 1; i >= 0; i--) {
    list[i].life -= dt;
    if (list[i].life <= 0) list.splice(i, 1);
  }
}

/** Alive harvest resources + placeables overlapping the oriented melee box. */

export function blocksOverlappingMeleeVolume(match, vol) {
  const out = [];
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (!b.alive) continue;
    if (!b.isHarvest && b.isDefeatCondition) continue;
    if (!aabbOverlapsMeleeVolume(b.x, b.y, b.w, b.h, vol)) continue;
    out.push(b);
  }
  return out;
}

/**
 * Oriented box vs AABB: any block corner in OBB, or any OBB corner in AABB.
 * Vol local X = ahead (start..start+reach), local Y = lateral ±halfW.
 */

export function aabbOverlapsMeleeVolume(bx, by, bw, bh, vol) {
  const cos = Math.cos(vol.ang);
  const sin = Math.sin(vol.ang);
  const ox = vol.ox;
  const oy = vol.oy;
  const x0 = vol.start;
  const x1 = vol.start + vol.reach;
  const y0 = -vol.halfW;
  const y1 = vol.halfW;

  function localInObb(wx, wy) {
    const dx = wx - ox;
    const dy = wy - oy;
    const lx = dx * cos + dy * sin;
    const ly = -dx * sin + dy * cos;
    return lx >= x0 && lx <= x1 && ly >= y0 && ly <= y1;
  }

  if (localInObb(bx, by)) return true;
  if (localInObb(bx + bw, by)) return true;
  if (localInObb(bx, by + bh)) return true;
  if (localInObb(bx + bw, by + bh)) return true;
  if (localInObb(bx + bw * 0.5, by + bh * 0.5)) return true;

  function worldFromLocal(lx, ly) {
    return {
      x: ox + lx * cos - ly * sin,
      y: oy + lx * sin + ly * cos,
    };
  }
  function inAabb(wx, wy) {
    return wx >= bx && wx <= bx + bw && wy >= by && wy <= by + bh;
  }
  const corners = [
    worldFromLocal(x0, y0),
    worldFromLocal(x1, y0),
    worldFromLocal(x0, y1),
    worldFromLocal(x1, y1),
    worldFromLocal((x0 + x1) * 0.5, (y0 + y1) * 0.5),
  ];
  for (let i = 0; i < corners.length; i++) {
    if (inAabb(corners[i].x, corners[i].y)) return true;
  }
  return false;
}

export function getMeleeVolume(unit, opts = {}) {
  const pack = GAME_PACK;
  const weaponId = opts.weaponId || unit.weaponId || null;
  const toolId = opts.toolId || null;
  // Optional future hook: weapon/tool-specific reach/width tables.
  // const custom = resolveMeleeVolumeDef(weaponId || toolId);
  const ang =
    typeof unit.aimRad === 'number' ? unit.aimRad : unit.facingRad || 0;
  const reach = pack.meleeReach;
  const halfW = pack.meleeHalfWidth;
  const start = unit.radius * 0.35;
  return {
    ang,
    reach,
    halfW,
    start,
    ox: unit.x,
    oy: unit.y,
    weaponId,
    toolId,
  };
}

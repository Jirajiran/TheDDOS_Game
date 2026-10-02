/**
 * Area Trigger engine — ONE_SHOT / CONTINUOUS_TICK / DURABILITY_TRAP.
 * Accumulator += dt pattern (same idea as laser beam tick).
 */

import { L3_SIZE, TEAM, getDamageMult } from './config.js';

export const AreaMode = Object.freeze({
  ONE_SHOT: 'ONE_SHOT',
  CONTINUOUS_TICK: 'CONTINUOUS_TICK',
  DURABILITY_TRAP: 'DURABILITY_TRAP',
});

/**
 * Build runtime area fields from a block def (or inline partial).
 */
export function createAreaTriggerState(partial = {}) {
  return {
    mode: partial.mode || AreaMode.CONTINUOUS_TICK,
    /** Proximity / aura radius (world units). */
    triggerRadius:
      partial.triggerRadius != null
        ? partial.triggerRadius
        : Math.round(L3_SIZE * 2.5),
    /** Explosion / value-send radius (may differ from trigger). */
    effectRadius:
      partial.effectRadius != null
        ? partial.effectRadius
        : partial.triggerRadius != null
          ? partial.triggerRadius
          : Math.round(L3_SIZE * 2.5),
    intervalSec: partial.intervalSec != null ? partial.intervalSec : 0.5,
    accumulator: 0,
    /** +HP or damage magnitude per tick / shot (sign: + heal, − damage via positive dmg flag). */
    tickValue: partial.tickValue != null ? partial.tickValue : 0,
    /** When true, tickValue heals friendlies; else damages hostiles. */
    healFriendly: !!partial.healFriendly,
    damageType: partial.damageType || 'DEFAULT',
    /** DURABILITY_TRAP: fraction of maxHp lost per trigger. */
    selfDamageRatio:
      partial.selfDamageRatio != null ? partial.selfDamageRatio : 0.25,
    team: partial.team != null ? partial.team : TEAM.PLAYER,
    armed: partial.armed !== false,
    /** ONE_SHOT: which faction trips the mine. */
    tripHostile: partial.tripHostile !== false,
  };
}

/** Attach / refresh area trigger on a placed block from registry def. */
export function attachAreaTriggerFromDef(block, blockDef) {
  if (!block || !blockDef) return;
  const mode = blockDef.areaMode || (blockDef.isHeal ? AreaMode.CONTINUOUS_TICK : null);
  if (!mode) return;
  const triggerR =
    blockDef.triggerRadius != null
      ? blockDef.triggerRadius
      : blockDef.healRadius != null
        ? blockDef.healRadius
        : Math.round(L3_SIZE * 2.5);
  const effectR =
    blockDef.effectRadius != null
      ? blockDef.effectRadius
      : blockDef.explosionRadius != null
        ? blockDef.explosionRadius
        : triggerR;
  const tickValue =
    blockDef.tickValue != null
      ? blockDef.tickValue
      : blockDef.isHeal
        ? (blockDef.healPerSec || 12) * (blockDef.tickIntervalSec || 0.5)
        : blockDef.trapDamage || 0;

  block.areaTrigger = createAreaTriggerState({
    mode,
    triggerRadius: triggerR,
    effectRadius: effectR,
    intervalSec:
      blockDef.tickIntervalSec != null
        ? blockDef.tickIntervalSec
        : blockDef.isHeal
          ? 0.5
          : 0.5,
    tickValue,
    healFriendly: !!blockDef.isHeal || !!blockDef.healFriendly,
    damageType: blockDef.damageType || 'DEFAULT',
    selfDamageRatio: blockDef.selfDamageRatio != null ? blockDef.selfDamageRatio : 0.25,
    team: block.team,
    tripHostile: blockDef.tripHostile !== false,
  });
}

function unitInRadius(unit, cx, cy, r) {
  if (!unit || !unit.active) return false;
  const dx = unit.x - cx;
  const dy = unit.y - cy;
  return dx * dx + dy * dy <= r * r;
}

/** Visual only — red AoE circle at impact; sim ticks life, render fades. */
export function spawnExplosionVfx(match, cx, cy, radius) {
  if (!match || !(radius > 0)) return;
  if (!match.explosionVfx) match.explosionVfx = [];
  match.explosionVfx.push({
    x: cx,
    y: cy,
    radius,
    life: 0.35,
    maxLife: 0.35,
    color: '#e04040',
  });
}

/**
 * Apply circular AoE (explosion / mine blast).
 * @param {function} applyDamageToUnit
 * @param {function} applyDamageToBlock
 */
export function applyExplosionAoE(
  match,
  cx,
  cy,
  radius,
  damage,
  damageType,
  opts = {}
) {
  if (!match || radius <= 0 || !damage) return;
  spawnExplosionVfx(match, cx, cy, radius);
  const applyUnit = opts.applyDamageToUnit;
  const applyBlock = opts.applyDamageToBlock;
  const sourceTeam = opts.sourceTeam;
  const r2 = radius * radius;
  const units = match.pools && match.pools.units;
  if (units && applyUnit) {
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (!u.active) continue;
      if (opts.skipTeam != null && u.team === opts.skipTeam) continue;
      if (opts.onlyTeam != null && u.team !== opts.onlyTeam) continue;
      const dx = u.x - cx;
      const dy = u.y - cy;
      if (dx * dx + dy * dy > r2) continue;
      const mult = getDamageMult(damageType, u.armorType || 'DEFAULT');
      applyUnit(match, u, damage * mult, {
        sourceTeam,
        damageKind: 'EXPLOSION',
        sourceX: cx,
        sourceY: cy,
      });
    }
  }
  if (match.blocks && applyBlock) {
    for (let i = 0; i < match.blocks.length; i++) {
      const b = match.blocks[i];
      if (!b.alive) continue;
      if (opts.skipBlockId != null && b.id === opts.skipBlockId) continue;
      const bx = b.x + b.w * 0.5;
      const by = b.y + b.h * 0.5;
      const dx = bx - cx;
      const dy = by - cy;
      if (dx * dx + dy * dy > r2) continue;
      applyBlock(match, b, damage, damageType, {
        sourceTeam,
        damageKind: 'PROJECTILE',
      });
    }
  }
}

function damageAreaOwner(match, block, ratio, applyDamageToBlock) {
  if (!block || !block.alive || !applyDamageToBlock) return;
  const selfDmg = (block.maxHp || block.hp || 1) * ratio;
  applyDamageToBlock(match, block, selfDmg, 'EXPLOSION', {
    sourceTeam: block.team,
    damageKind: 'TOOL',
  });
}

/**
 * Tick all block-attached area triggers.
 * @param {object} hooks — { applyDamageToUnit, applyDamageToBlock }
 */
export function tickAreaTriggers(match, dt, hooks = {}) {
  if (!match || !match.blocks) return;
  const applyUnit = hooks.applyDamageToUnit;
  const applyBlock = hooks.applyDamageToBlock;
  const units = match.pools && match.pools.units;

  for (let i = 0; i < match.blocks.length; i++) {
    const block = match.blocks[i];
    if (!block.alive || !block.areaTrigger || !block.areaTrigger.armed) continue;
    const at = block.areaTrigger;
    const cx = block.x + block.w * 0.5;
    const cy = block.y + block.h * 0.5;

    if (at.mode === AreaMode.ONE_SHOT) {
      if (!units) continue;
      let tripped = false;
      for (let u = 0; u < units.length; u++) {
        const unit = units[u];
        if (!unitInRadius(unit, cx, cy, at.triggerRadius)) continue;
        const hostile = unit.team !== at.team;
        if (at.tripHostile ? hostile : !hostile) {
          tripped = true;
          break;
        }
      }
      if (!tripped) continue;
      applyExplosionAoE(
        match,
        cx,
        cy,
        at.effectRadius,
        at.tickValue || 80,
        at.damageType || 'EXPLOSION',
        {
          applyDamageToUnit: applyUnit,
          applyDamageToBlock: applyBlock,
          sourceTeam: at.team,
          skipTeam: at.team,
          skipBlockId: block.id,
        }
      );
      // Self-destruct 100% maxHp.
      damageAreaOwner(match, block, 1, applyBlock);
      at.armed = false;
      continue;
    }

    // CONTINUOUS_TICK + DURABILITY_TRAP share accumulator.
    at.accumulator += dt;
    if (at.accumulator < at.intervalSec) continue;
    while (at.accumulator >= at.intervalSec) {
      at.accumulator -= at.intervalSec;
      if (!units) continue;

      let hitSomeone = false;
      for (let u = 0; u < units.length; u++) {
        const unit = units[u];
        if (!unitInRadius(unit, cx, cy, at.triggerRadius)) continue;

        if (at.healFriendly) {
          if (unit.team !== at.team) continue;
          if (!applyUnit) continue;
          // Negative damage = heal in applyDamageToUnit.
          applyUnit(match, unit, -Math.abs(at.tickValue), {
            sourceTeam: at.team,
            damageKind: 'AREA_HEAL',
          });
          hitSomeone = true;
        } else {
          if (unit.team === at.team) continue;
          if (!applyUnit) continue;
          const mult = getDamageMult(at.damageType, unit.armorType || 'DEFAULT');
          applyUnit(match, unit, Math.abs(at.tickValue) * mult, {
            sourceTeam: at.team,
            damageKind: 'AREA_TRAP',
            sourceX: cx,
            sourceY: cy,
          });
          hitSomeone = true;
        }
      }

      if (at.mode === AreaMode.DURABILITY_TRAP && hitSomeone) {
        damageAreaOwner(match, block, at.selfDamageRatio, applyBlock);
        if (!block.alive) {
          at.armed = false;
          break;
        }
      }
    }
  }
}

/**
 * When an explosive projectile stops, blast AoE at impact point.
 */
export function tryProjectileExplosion(match, projectile, hooks = {}) {
  if (!projectile || !projectile.explosionRadius) return;
  const r = projectile.explosionRadius;
  if (r <= 0) return;
  applyExplosionAoE(
    match,
    projectile.x,
    projectile.y,
    r,
    projectile.explosionDamage != null
      ? projectile.explosionDamage
      : projectile.damage,
    projectile.damageType || 'EXPLOSION',
    {
      applyDamageToUnit: hooks.applyDamageToUnit,
      applyDamageToBlock: hooks.applyDamageToBlock,
      sourceTeam: projectile.team,
      skipTeam: null,
    }
  );
}

/**
 * Raycast / projectile shield collider — durability before main unit hit.
 * Intercepts hits that would reach the unit body when shield faces the shot.
 */

import { L3_SIZE } from './config.js';

export function createShieldState(partial = {}) {
  const maxHp = partial.maxHp != null ? partial.maxHp : 120;
  return {
    enabled: partial.enabled !== false,
    maxHp,
    hp: partial.hp != null ? partial.hp : maxHp,
    /** World-unit offset ahead of unit facing / aim. */
    offset:
      partial.offset != null ? partial.offset : Math.round(L3_SIZE * 0.55),
    /** Shield disc radius. */
    radius:
      partial.radius != null ? partial.radius : Math.round(L3_SIZE * 0.45),
    /** Pierce cost when projectile hits shield (shared pierce budget). */
    pierceCost: partial.pierceCost != null ? partial.pierceCost : 2,
    /** 0..1 damage absorbed vs passed through after break attempt. */
    absorbRatio: partial.absorbRatio != null ? partial.absorbRatio : 1,
    /** Broken shield stays down until repaired / skill refresh. */
    broken: false,
    regenPerSec: partial.regenPerSec != null ? partial.regenPerSec : 0,
    regenDelaySec: partial.regenDelaySec != null ? partial.regenDelaySec : 3,
    _regenDelayLeft: 0,
    /** 'passive' archetype | 'item' inventory | null */
    source: partial.source || null,
  };
}

export function ensureUnitShield(unit, partial) {
  if (!unit) return null;
  if (!unit.shield && partial && partial.enabled !== false) {
    unit.shield = createShieldState(partial);
  }
  return unit.shield || null;
}

export function seedShieldFromArchetype(unit, archetype) {
  if (!unit || !archetype || !archetype.hasPassiveShield) return;
  // Do not clobber an equipped inventory shield (item OR passive coexistence).
  if (unit.activeShieldId) return;
  unit.shield = createShieldState({
    maxHp: archetype.shieldMaxHp != null ? archetype.shieldMaxHp : 150,
    radius:
      archetype.shieldColliderRadius != null
        ? archetype.shieldColliderRadius
        : Math.round(L3_SIZE * 0.9),
    offset:
      archetype.shieldOffset != null
        ? archetype.shieldOffset
        : Math.round(L3_SIZE * 0.7),
    pierceCost: archetype.shieldPierceCost != null ? archetype.shieldPierceCost : 2,
    absorbRatio: archetype.shieldAbsorbRatio != null ? archetype.shieldAbsorbRatio : 1,
    regenPerSec: archetype.shieldRegenPerSec != null ? archetype.shieldRegenPerSec : 8,
    source: 'passive',
  });
}

/** World-space center of the shield disc (in front of aim). */
export function getShieldWorldPos(unit) {
  if (!unit || !unit.shield || !unit.shield.enabled || unit.shield.broken) {
    return null;
  }
  const sh = unit.shield;
  if (sh.hp <= 0) return null;
  const ang =
    typeof unit.aimRad === 'number' ? unit.aimRad : unit.facingRad || 0;
  const off = sh.offset || 0;
  return {
    x: unit.x + Math.cos(ang) * off,
    y: unit.y + Math.sin(ang) * off,
    radius: sh.radius || 20,
  };
}

/**
 * Segment vs shield disc — same idea as unit body hit test.
 * @returns {{ hit: boolean, t?: number, pierceCost?: number }}
 */
export function segmentHitsShield(unit, x0, y0, x1, y1, projectileRadius = 0) {
  const pos = getShieldWorldPos(unit);
  if (!pos) return { hit: false };
  const r = pos.radius + (projectileRadius || 0);
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 1e-8) {
    t = ((pos.x - x0) * dx + (pos.y - y0) * dy) / len2;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
  }
  const cx = x0 + dx * t;
  const cy = y0 + dy * t;
  const dist = Math.hypot(cx - pos.x, cy - pos.y);
  if (dist > r) return { hit: false };
  return {
    hit: true,
    t,
    pierceCost: unit.shield.pierceCost | 0,
  };
}

/**
 * Absorb damage into shield HP. Returns leftover damage for unit body.
 * @returns {{ absorbed: number, leftover: number, broke: boolean, pierceCost: number }}
 */
export function absorbDamageWithShield(unit, damage) {
  if (!unit || !unit.shield || !unit.shield.enabled || unit.shield.broken) {
    return { absorbed: 0, leftover: damage, broke: false, pierceCost: 0 };
  }
  if (damage <= 0) {
    return { absorbed: 0, leftover: damage, broke: false, pierceCost: 0 };
  }
  const sh = unit.shield;
  if (sh.hp <= 0) {
    sh.broken = true;
    return { absorbed: 0, leftover: damage, broke: true, pierceCost: 0 };
  }

  const absorbCap = damage * (sh.absorbRatio != null ? sh.absorbRatio : 1);
  const absorbed = Math.min(sh.hp, absorbCap);
  sh.hp -= absorbed;
  sh._regenDelayLeft = sh.regenDelaySec || 0;
  const leftover = Math.max(0, damage - absorbed);
  let broke = false;
  if (sh.hp <= 0) {
    sh.hp = 0;
    sh.broken = true;
    broke = true;
  }
  return {
    absorbed,
    leftover,
    broke,
    pierceCost: sh.pierceCost | 0,
  };
}

export function tickShields(match, dt) {
  if (!match || !match.pools) return;
  const units = match.pools.units;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active || !u.shield || !u.shield.enabled) continue;
    const sh = u.shield;
    if (sh._regenDelayLeft > 0) {
      sh._regenDelayLeft -= dt;
      continue;
    }
    if (sh.broken) {
      // Broken shields only revive via skill / repair unless regen clears break.
      if (sh.regenPerSec > 0 && sh.hp < sh.maxHp) {
        sh.hp = Math.min(sh.maxHp, sh.hp + sh.regenPerSec * dt);
        if (sh.hp > 0) sh.broken = false;
      }
      continue;
    }
    if (sh.regenPerSec > 0 && sh.hp < sh.maxHp) {
      sh.hp = Math.min(sh.maxHp, sh.hp + sh.regenPerSec * dt);
    }
  }
}

/** Repair shield HP (wrench / skill). */
export function repairShield(unit, amount) {
  if (!unit || !unit.shield || amount <= 0) return 0;
  const sh = unit.shield;
  const before = sh.hp;
  sh.hp = Math.min(sh.maxHp, sh.hp + amount);
  if (sh.hp > 0) sh.broken = false;
  return sh.hp - before;
}

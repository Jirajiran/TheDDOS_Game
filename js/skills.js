/**
 * Active skill timeline — data-driven defs; CAST_SKILL via Unified Input.
 * Stages never know skill names — they emit Actions only.
 *
 * READY → CASTING → ACTIVE → COOLDOWN → READY
 */

import { getSkillDef } from './config.js';
import { emitTauntPulse } from './taunt.js';
import {
  ensureMeleeSwing,
  tryBeginMeleeSwing,
} from './meleeTools.js';

export const SkillPhase = Object.freeze({
  READY: 'READY',
  CASTING: 'CASTING',
  ACTIVE: 'ACTIVE',
  COOLDOWN: 'COOLDOWN',
});

/** Runtime skill slot on a unit (one entry per skillId). */
export function createSkillRuntime(skillId) {
  const def = getSkillDef(skillId);
  return {
    skillId,
    phase: SkillPhase.READY,
    castTimer: 0,
    activeTimer: 0,
    cooldownTimer: 0,
    targetPos: null,
    targetEntityId: null,
    interrupted: false,
    /** Scratch from last successful cast (effect params). */
    effectActive: false,
  };
}

/** Ensure FIST is always present, then seed from archetype / unit.skillIds. */
export function ensureUnitSkills(unit) {
  if (!unit) return;
  if (!unit.skills) unit.skills = Object.create(null);
  const ids = Array.isArray(unit.skillIds) ? unit.skillIds.slice() : [];
  if (ids.indexOf('FIST') < 0) ids.push('FIST');
  unit.skillIds = ids;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (!unit.skills[id]) unit.skills[id] = createSkillRuntime(id);
  }
  ensureMeleeSwing(unit);
}

/**
 * Begin cast from Unified Input CAST_SKILL action.
 * @returns {{ ok: boolean, reason?: string }}
 */
export function tryBeginCastSkill(unit, payload = {}) {
  if (!unit || !unit.active) return { ok: false, reason: 'dead' };
  ensureUnitSkills(unit);
  const skillId = payload.skillId;
  if (!skillId) return { ok: false, reason: 'no_skillId' };
  const def = getSkillDef(skillId);
  if (!def) return { ok: false, reason: 'unknown_skill' };

  let rt = unit.skills[skillId];
  if (!rt) {
    rt = createSkillRuntime(skillId);
    unit.skills[skillId] = rt;
  }
  if (rt.phase !== SkillPhase.READY) {
    return { ok: false, reason: 'not_ready' };
  }

  const effect = def.effect || {};
  if (effect.type === 'MELEE_SWING') {
    const sw = ensureMeleeSwing(unit);
    if (sw && (sw.active || sw.cooldownTimer > 0)) {
      return { ok: false, reason: 'melee_busy' };
    }
  }

  rt.phase = SkillPhase.CASTING;
  rt.castTimer = def.castTimeSec || 0;
  rt.activeTimer = 0;
  rt.cooldownTimer = 0;
  rt.interrupted = false;
  rt.effectActive = false;
  rt.targetPos =
    payload.targetPosVec2 && typeof payload.targetPosVec2.x === 'number'
      ? { x: payload.targetPosVec2.x, y: payload.targetPosVec2.y }
      : null;
  rt.targetEntityId =
    payload.targetEntityId != null ? payload.targetEntityId : null;

  // Instant cast (castTime 0) → activate same frame.
  if (rt.castTimer <= 0) {
    enterActivePhase(unit, rt, def);
  }
  return { ok: true };
}

function enterActivePhase(unit, rt, def) {
  rt.phase = SkillPhase.ACTIVE;
  rt.castTimer = 0;
  rt.activeTimer = def.activeDurationSec || 0;
  rt.effectActive = true;
  applySkillOnActivate(unit, rt, def);
  if (rt.activeTimer <= 0) {
    enterCooldownPhase(rt, def);
  }
}

function enterCooldownPhase(rt, def) {
  rt.phase = SkillPhase.COOLDOWN;
  rt.activeTimer = 0;
  rt.effectActive = false;
  rt.cooldownTimer = def.cooldownSec || 0;
  if (rt.cooldownTimer <= 0) {
    rt.phase = SkillPhase.READY;
    rt.cooldownTimer = 0;
  }
}

/** Interrupt CASTING (e.g. stun / damage cancel) — no cooldown refund by default. */
export function interruptSkillCast(unit, skillId) {
  if (!unit || !unit.skills || !unit.skills[skillId]) return;
  const rt = unit.skills[skillId];
  if (rt.phase !== SkillPhase.CASTING) return;
  rt.interrupted = true;
  rt.phase = SkillPhase.READY;
  rt.castTimer = 0;
  rt.effectActive = false;
}

function applySkillOnActivate(unit, rt, def) {
  const effect = def.effect || {};
  if (effect.type === 'TAUNT_PULSE') {
    unit._pendingTauntPulse = {
      radius: effect.radius != null ? effect.radius : 200,
      durationSec: effect.durationSec != null ? effect.durationSec : 4,
    };
  }
  if (effect.type === 'SPEED_BOOST') {
    unit.skillSpeedMult = effect.speedMult != null ? effect.speedMult : 1.3;
  }
  if (effect.type === 'SHIELD_OVERCHARGE') {
    if (unit.shield) {
      const bonus = effect.shieldBonus != null ? effect.shieldBonus : 50;
      unit.shield.hp = Math.min(
        unit.shield.maxHp,
        unit.shield.hp + bonus
      );
    }
  }
  if (effect.type === 'MELEE_SWING') {
    tryBeginMeleeSwing(unit, {
      source: 'FIST',
      activeDurationSec: def.activeDurationSec || 0.1,
      cooldownSec: def.cooldownSec || 0.3,
      damage: effect.damage != null ? effect.damage : 18,
      hitUnits: effect.hitUnits !== false,
      hitBlocks: effect.hitBlocks !== false,
      vfxSize: effect.vfxSize,
      color: effect.color || '#e8dcc0',
    });
  }
}

function clearSkillEffects(unit, rt, def) {
  const effect = (def && def.effect) || {};
  if (effect.type === 'SPEED_BOOST') {
    unit.skillSpeedMult = 1;
  }
}

/**
 * Advance all skill timelines on a unit.
 * @param {object} match — used when flushing taunt pulses
 */
export function tickUnitSkills(match, unit, dt) {
  if (!unit || !unit.active || !unit.skills) return;
  const ids = Object.keys(unit.skills);
  for (let i = 0; i < ids.length; i++) {
    const rt = unit.skills[ids[i]];
    const def = getSkillDef(rt.skillId);
    if (!def) continue;

    if (rt.phase === SkillPhase.CASTING) {
      rt.castTimer -= dt;
      if (rt.castTimer <= 0) enterActivePhase(unit, rt, def);
    } else if (rt.phase === SkillPhase.ACTIVE) {
      rt.activeTimer -= dt;
      if (rt.activeTimer <= 0) {
        clearSkillEffects(unit, rt, def);
        enterCooldownPhase(rt, def);
      }
    } else if (rt.phase === SkillPhase.COOLDOWN) {
      rt.cooldownTimer -= dt;
      if (rt.cooldownTimer <= 0) {
        rt.cooldownTimer = 0;
        rt.phase = SkillPhase.READY;
      }
    }
  }

  if (unit._pendingTauntPulse && match) {
    const pulse = unit._pendingTauntPulse;
    unit._pendingTauntPulse = null;
    emitTauntPulse(match, unit, pulse);
  }
}

export function tickAllSkills(match, dt) {
  if (!match || !match.pools || !match.pools.units) return;
  const units = match.pools.units;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active) continue;
    tickUnitSkills(match, u, dt);
  }
}

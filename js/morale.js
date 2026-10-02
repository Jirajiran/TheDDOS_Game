/**
 * Passive / morale fields — stats ready for units & future stages.
 * Conditional passives evaluated each tick (Deterministic State).
 */

import { L3_SIZE } from './config.js';

/** Default morale / passive bag attached to every unit. */
export function createMoraleState(partial = {}) {
  return {
    /** 0..1 — low morale can unlock retreat goals later. */
    morale: partial.morale != null ? partial.morale : 1,
    maxMorale: partial.maxMorale != null ? partial.maxMorale : 1,
    /** Loss rate per second under fire / pressure (stages may scale). */
    moraleLossRate: partial.moraleLossRate != null ? partial.moraleLossRate : 0.05,
    moraleRegenRate: partial.moraleRegenRate != null ? partial.moraleRegenRate : 0.02,
    /** Commander aura: lock retreat + cut loss rate. */
    lockRetreat: !!partial.lockRetreat,
    underMoraleAura: false,
    moraleAuraRadius:
      partial.moraleAuraRadius != null
        ? partial.moraleAuraRadius
        : Math.round(L3_SIZE * 4.7),
    /** Static passive multipliers (seeded from archetype). */
    moveSpeedMult: partial.moveSpeedMult != null ? partial.moveSpeedMult : 1,
    damageReduction: partial.damageReduction != null ? partial.damageReduction : 0,
    /** Conditional passive scratch (engine writes each frame). */
    speedBuff: 1,
    lowHpSpeedThreshold: partial.lowHpSpeedThreshold != null ? partial.lowHpSpeedThreshold : 0.5,
    lowHpSpeedBuff: partial.lowHpSpeedBuff != null ? partial.lowHpSpeedBuff : 1,
  };
}

export function ensureUnitMorale(unit, partial) {
  if (!unit) return;
  if (!unit.moraleState) {
    unit.moraleState = createMoraleState(partial || {});
  }
  if (typeof unit.skillSpeedMult !== 'number') unit.skillSpeedMult = 1;
}

/**
 * Apply static passives from archetype-ish partial onto unit bag.
 */
export function seedMoraleFromArchetype(unit, archetype) {
  ensureUnitMorale(unit);
  if (!archetype) return;
  const m = unit.moraleState;
  const flags = archetype.behaviorFlags || archetype.aiBehavior || {};
  if (archetype.moraleLossRate != null) m.moraleLossRate = archetype.moraleLossRate;
  if (archetype.moraleAuraRadius != null) m.moraleAuraRadius = archetype.moraleAuraRadius;
  if (archetype.moveSpeedMult != null) m.moveSpeedMult = archetype.moveSpeedMult;
  if (archetype.damageReduction != null) m.damageReduction = archetype.damageReduction;
  if (archetype.lockRetreat != null) m.lockRetreat = !!archetype.lockRetreat;
  if (archetype.lowHpSpeedThreshold != null) {
    m.lowHpSpeedThreshold = archetype.lowHpSpeedThreshold;
  }
  if (archetype.lowHpSpeedBuff != null) m.lowHpSpeedBuff = archetype.lowHpSpeedBuff;
  if (flags.lowHpSpeedThreshold != null) m.lowHpSpeedThreshold = flags.lowHpSpeedThreshold;
  if (flags.lowHpSpeedBuff != null) m.lowHpSpeedBuff = flags.lowHpSpeedBuff;
  if (flags.useMoraleSystem) {
    const init =
      typeof flags.initialMorale === 'number' ? flags.initialMorale / 100 : 1;
    m.morale = init;
    m.maxMorale = 1;
    if (typeof flags.moraleRecoverRate === 'number') {
      // Doc uses +15/s on 0–100 scale → 0.15/s on 0–1.
      m.moraleRegenRate = flags.moraleRecoverRate / 100;
    }
    if (typeof flags.moraleDropOnHit === 'number') {
      m.moraleDropOnHit = flags.moraleDropOnHit / 100;
    }
  }
  if (archetype.isLocalGeneral || flags.isGroupLeader) unit.localGeneral = true;
}

/** Effective move multiplier: static × conditional × skill. */
export function getEffectiveSpeedMult(unit) {
  if (!unit) return 1;
  const m = unit.moraleState;
  const staticM = m && m.moveSpeedMult != null ? m.moveSpeedMult : 1;
  const buff = m && m.speedBuff != null ? m.speedBuff : 1;
  const skill = typeof unit.skillSpeedMult === 'number' ? unit.skillSpeedMult : 1;
  return staticM * buff * skill;
}

/**
 * Conditional passives + light morale regen/decay.
 * Aura from localGeneral commanders on same team.
 */
export function tickMoralePassives(match, dt) {
  if (!match || !match.pools) return;
  const units = match.pools.units;

  // Reset aura flags then stamp from commanders.
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active || !u.moraleState) continue;
    u.moraleState.underMoraleAura = false;
  }

  for (let i = 0; i < units.length; i++) {
    const cmd = units[i];
    if (!cmd.active || !cmd.localGeneral || !cmd.moraleState) continue;
    const r = cmd.moraleState.moraleAuraRadius || 0;
    if (r <= 0) continue;
    const r2 = r * r;
    for (let j = 0; j < units.length; j++) {
      const ally = units[j];
      if (!ally.active || ally.team !== cmd.team || !ally.moraleState) continue;
      const dx = ally.x - cmd.x;
      const dy = ally.y - cmd.y;
      if (dx * dx + dy * dy <= r2) {
        ally.moraleState.underMoraleAura = true;
      }
    }
  }

  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active) continue;
    ensureUnitMorale(u);
    const m = u.moraleState;

    // Conditional: low-HP speed buff (skirmisher-style).
    const hpRatio = u.maxHp > 0 ? u.hp / u.maxHp : 1;
    if (m.lowHpSpeedBuff > 1 && hpRatio < m.lowHpSpeedThreshold) {
      m.speedBuff = m.lowHpSpeedBuff;
    } else {
      m.speedBuff = 1;
    }

    let loss = m.moraleLossRate;
    if (m.underMoraleAura) {
      // Commander aura: cut morale loss 50% (NextPlan) — do not force lockRetreat.
      loss *= 0.5;
    }
    if (m.lockRetreat) {
      u.lockRetreat = true;
    } else if (!m.underMoraleAura) {
      u.lockRetreat = false;
    }

    // Light pressure: damage recently → lose morale; else regen.
    if (u._moralePressureTimer > 0) {
      u._moralePressureTimer = Math.max(0, u._moralePressureTimer - dt);
      m.morale = Math.max(0, m.morale - loss * dt);
    } else {
      m.morale = Math.min(m.maxMorale, m.morale + m.moraleRegenRate * dt);
    }
  }
}

/** Call when unit takes positive damage — feeds morale pressure. */
export function noteMoralePressure(unit, durationSec = 2) {
  if (!unit) return;
  ensureUnitMorale(unit);
  unit._moralePressureTimer = Math.max(
    unit._moralePressureTimer || 0,
    durationSec
  );
  const m = unit.moraleState;
  const flags = unit.behaviorFlags || {};
  // Instant drop for coward-style archetypes (0–1 scale).
  if (flags.useMoraleSystem && typeof m.moraleDropOnHit === 'number') {
    m.morale = Math.max(0, m.morale - m.moraleDropOnHit);
  }
}

/** Damage reduction from static passive (0..1). */
export function getPassiveDamageReduction(unit) {
  if (!unit || !unit.moraleState) return 0;
  const d = unit.moraleState.damageReduction;
  return typeof d === 'number' ? Math.max(0, Math.min(0.9, d)) : 0;
}

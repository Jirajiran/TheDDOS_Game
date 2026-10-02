/**
 * Phase 3 — Unit archetypes compose Goals + Stages (data-driven).
 * Stages stay archetype-agnostic; Mediator filters by allowedGoals.
 */

import {
  getUnitArchetype,
  pickArchetypeIdForWaveSlot,
} from '../config.js';
import { Goal } from './blackboard.js';
import { createAmmoState } from '../weapons.js';
import { ensureUnitSkills } from '../skills.js';

/** Always available for General path following (even if omitted in JSON). */
const IMPLICIT_GOALS = Object.freeze([Goal.REACH_PATH_GOAL]);

/** Informal Goal aliases found in NextPlan docs → real Goal ids. */
const GOAL_ALIASES = Object.freeze({
  ENGAGE: Goal.ELIMINATE_PLAYER,
});

/**
 * Normalize allowedGoals array (aliases + unique).
 * @param {string[]|null|undefined} list
 * @returns {string[]}
 */
export function normalizeAllowedGoals(list) {
  if (!list || !list.length) return Object.keys(Goal).map((k) => Goal[k]);
  const out = [];
  const seen = Object.create(null);
  for (let i = 0; i < list.length; i++) {
    let g = list[i];
    if (GOAL_ALIASES[g]) g = GOAL_ALIASES[g];
    if (!g || seen[g]) continue;
    seen[g] = true;
    out.push(g);
  }
  for (let i = 0; i < IMPLICIT_GOALS.length; i++) {
    const g = IMPLICIT_GOALS[i];
    if (!seen[g]) {
      seen[g] = true;
      out.push(g);
    }
  }
  return out;
}

/**
 * Pick active dynamic phase by hpRatio (phases sorted high→low threshold).
 * Phase with hpRatio:0.5 is active while unit.hp/maxHp > 0.5.
 * @param {object} archetype
 * @param {number} hpRatio
 */
export function pickDynamicPhase(archetype, hpRatio) {
  if (!archetype || !archetype.isDynamicDriver || !archetype.phases) {
    return null;
  }
  const phases = archetype.phases;
  let best = phases[phases.length - 1];
  let bestThr = -1;
  for (let i = 0; i < phases.length; i++) {
    const p = phases[i];
    const thr = typeof p.hpRatio === 'number' ? p.hpRatio : 0;
    if (hpRatio > thr && thr >= bestThr) {
      best = p;
      bestThr = thr;
    }
  }
  return best;
}

/**
 * Merge base archetype + active phase into an effective runtime view.
 * Does not mutate the frozen registry entry.
 */
export function resolveEffectiveArchetype(unit, archetypeId) {
  const id = archetypeId || (unit && unit.archetypeId);
  const base = getUnitArchetype(id);
  if (!base) return null;

  const hpRatio =
    unit && unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
  const phase = pickDynamicPhase(base, hpRatio);
  if (!phase) return base;

  const flags = Object.assign(
    {},
    base.behaviorFlags || {},
    phase.behaviorFlags || {}
  );
  return {
    id: base.id,
    description: base.description,
    isBoss: base.isBoss,
    isDynamicDriver: true,
    hpRange: base.hpRange,
    defaultWeapon: phase.weaponId != null ? phase.weaponId : base.defaultWeapon,
    armorType: base.armorType,
    sizeScale: base.sizeScale,
    meleeMultiplier: base.meleeMultiplier,
    isLocalGeneral: base.isLocalGeneral,
    moraleAuraRadius: base.moraleAuraRadius,
    hasPlacementSkill: base.hasPlacementSkill,
    placeableBlockTypes: base.placeableBlockTypes,
    hasPassiveShield: base.hasPassiveShield,
    shieldColliderRadius: base.shieldColliderRadius,
    shieldMaxHp: base.shieldMaxHp,
    activeSkills:
      phase.activeSkills != null ? phase.activeSkills : base.activeSkills,
    allowedGoals:
      phase.allowedGoals != null ? phase.allowedGoals : base.allowedGoals,
    targetPriorityList:
      phase.targetPriorityList != null
        ? phase.targetPriorityList
        : base.targetPriorityList,
    behaviorFlags: flags,
    aiBehavior: flags,
    _phaseHpRatio: typeof phase.hpRatio === 'number' ? phase.hpRatio : 0,
  };
}

/**
 * Allowed Goal set for Mediator filter (Set-like object).
 * @returns {Record<string, true>|null} null = all Goals allowed
 */
export function getAllowedGoalSet(unit) {
  if (!unit) return null;
  const list =
    unit.allowedGoals ||
    (unit._effectiveArchetype && unit._effectiveArchetype.allowedGoals);
  if (!list || !list.length) return null;
  const set = Object.create(null);
  const norm = normalizeAllowedGoals(list);
  for (let i = 0; i < norm.length; i++) set[norm[i]] = true;

  const flags = unit.behaviorFlags || {};
  if (flags.canRegroup === false) {
    delete set[Goal.REGROUP_ALLIES];
  }
  return set;
}

/**
 * Sync unit runtime fields from effective archetype (spawn + boss phase ticks).
 */
export function applyEffectiveArchetypeToUnit(unit, effective, opts = {}) {
  if (!unit || !effective) return;
  unit._effectiveArchetype = effective;
  unit.allowedGoals = normalizeAllowedGoals(effective.allowedGoals);
  unit.targetPriorityList = effective.targetPriorityList
    ? effective.targetPriorityList.slice()
    : null;
  unit.behaviorFlags = Object.assign({}, effective.behaviorFlags || {});
  const flags = unit.behaviorFlags;

  if (typeof flags.retreatHpRatio === 'number') {
    unit.retreatHpRatio = flags.retreatHpRatio;
  } else if (
    effective.aiBehavior &&
    typeof effective.aiBehavior.retreatHpRatio === 'number'
  ) {
    unit.retreatHpRatio = effective.aiBehavior.retreatHpRatio;
  }

  unit.hasPlacementSkill = !!(
    effective.hasPlacementSkill || flags.hasPlacementSkill
  );
  unit.localGeneral = !!(effective.isLocalGeneral || flags.isGroupLeader);
  unit.lockRetreat = !!(flags.relentless && flags.retreatHpRatio === 0);

  if (effective.activeSkills) {
    unit.skillIds = effective.activeSkills.slice();
    ensureUnitSkills(unit);
  }

  // Live-time weapon swap (boss phase) — only when weaponId changes.
  const nextWeapon =
    effective.defaultWeapon != null ? effective.defaultWeapon : unit.weaponId;
  if (opts.syncWeapon !== false && nextWeapon !== unit.weaponId) {
    unit.weaponId = nextWeapon;
    if (nextWeapon) {
      Object.assign(unit, createAmmoState(nextWeapon));
      unit.mags = Math.max(unit.mags || 0, 2);
    } else {
      unit.ammoInMag = 0;
      unit.mags = 0;
    }
  }

  const phaseKey =
    effective._phaseHpRatio != null ? String(effective._phaseHpRatio) : 'base';
  unit._archetypePhaseKey = phaseKey;
}

/**
 * Call each AI tick for dynamic drivers — swap goals/weapon by HP phase.
 */
export function tickArchetypePhase(unit) {
  if (!unit || !unit.archetypeId) return false;
  const arch = getUnitArchetype(unit.archetypeId);
  if (!arch || !arch.isDynamicDriver) {
    // Still refresh effective view for non-boss (cheap).
    if (!unit._effectiveArchetype) {
      const eff = resolveEffectiveArchetype(unit, unit.archetypeId);
      if (eff) applyEffectiveArchetypeToUnit(unit, eff, { syncWeapon: false });
    }
    return false;
  }
  const eff = resolveEffectiveArchetype(unit, unit.archetypeId);
  if (!eff) return false;
  const prev = unit._archetypePhaseKey;
  const next =
    eff._phaseHpRatio != null ? String(eff._phaseHpRatio) : 'base';
  const changed = prev !== next;
  applyEffectiveArchetypeToUnit(unit, eff, { syncWeapon: changed });
  return changed;
}

/** Deterministic archetype id for wave slot (composition table). */
export function resolveSpawnArchetypeId(waveIndex, unitIndex) {
  return pickArchetypeIdForWaveSlot(waveIndex, unitIndex);
}

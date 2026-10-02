/**
 * AI Mediator — priority = baseWeight + eventBoost + factors → argmax Goal → Stage.
 * Stages never call each other; only the active Stage runs.
 * Phase 3: Goals filtered to unit.allowedGoals (archetype data).
 */

import { ActionType } from '../actions.js';
import {
  getPreferredStandoffPx,
  getWeaponDef,
  getWeaponMaxRangePx,
} from '../config.js';
import {
  Goal,
  STAGE_TO_LEGACY,
  StageId,
  ensureBlackboard,
  syncCombatToBlackboard,
  writePathGoal,
} from './blackboard.js';
import { DEFAULT_EVENT_BOOSTS, processUnitEvents } from './events.js';
import {
  getAllowedGoalSet,
  tickArchetypePhase,
} from './archetypes.js';
import { SkillPhase } from '../skills.js';
import { runApproach } from './stages/approach.js';
import { runEngage } from './stages/engage.js';
import { runPlace } from './stages/place.js';
import { runRegroup } from './stages/regroup.js';
import { runRetreat } from './stages/retreat.js';
import { runSeekPoint } from './stages/seek_point.js';

/** Goal baseWeight (data-driven; mirrored in config AI_GOAL_BASE_WEIGHTS). */
export const DEFAULT_GOAL_BASE_WEIGHTS = Object.freeze({
  [Goal.SURVIVE_RETREAT]: 900,
  [Goal.SEEK_HEAL_POINT]: 700,
  [Goal.PLACE_TRAP]: 620,
  [Goal.REPAIR_STRUCTURE]: 580,
  [Goal.ELIMINATE_PLAYER]: 500,
  [Goal.ELIMINATE_TARGET]: 480,
  [Goal.SUICIDE_ATTACK]: 520,
  [Goal.DESTROY_BASE]: 400,
  [Goal.PROTECT_ALLY]: 280,
  [Goal.FLANK_POSITION]: 260,
  [Goal.HOLD_SECTOR]: 150,
  [Goal.REGROUP_ALLIES]: 120,
  [Goal.REACH_PATH_GOAL]: 100,
});

/** Goal → Stage map (Mediator only). */
export const DEFAULT_GOAL_TO_STAGE = Object.freeze({
  [Goal.REACH_PATH_GOAL]: StageId.APPROACH_PATH,
  [Goal.ELIMINATE_PLAYER]: StageId.ENGAGE,
  [Goal.ELIMINATE_TARGET]: StageId.ENGAGE,
  [Goal.DESTROY_BASE]: StageId.ENGAGE,
  [Goal.SUICIDE_ATTACK]: StageId.ENGAGE,
  [Goal.SURVIVE_RETREAT]: StageId.RETREAT,
  [Goal.SEEK_HEAL_POINT]: StageId.SEEK_POINT,
  [Goal.HOLD_SECTOR]: StageId.REGROUP,
  [Goal.REGROUP_ALLIES]: StageId.REGROUP,
  [Goal.PROTECT_ALLY]: StageId.REGROUP,
  [Goal.FLANK_POSITION]: StageId.RETREAT,
  [Goal.PLACE_TRAP]: StageId.PLACE,
  [Goal.REPAIR_STRUCTURE]: StageId.PLACE,
});

const STAGE_RUNNERS = Object.freeze({
  [StageId.APPROACH_PATH]: runApproach,
  [StageId.ENGAGE]: runEngage,
  [StageId.RETREAT]: runRetreat,
  [StageId.REGROUP]: runRegroup,
  [StageId.SEEK_POINT]: runSeekPoint,
  [StageId.PLACE]: runPlace,
});

/**
 * Factors + precondition gates.
 * High catalog baseWeights only apply when Goal is "armed"; otherwise subtract
 * so REACH_PATH_GOAL remains the idle default (events can still force via boost).
 */
function factorScores(unit, combat, pack, bb, base) {
  const f = Object.create(null);
  const keys = Object.keys(Goal);
  for (let i = 0; i < keys.length; i++) f[Goal[keys[i]]] = 0;

  const flags = unit.behaviorFlags || {};
  const hpRatio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
  const retreatRatio =
    typeof unit.retreatHpRatio === 'number'
      ? unit.retreatHpRatio
      : pack.enemyRetreatHpRatio;
  const lowHp = !unit.lockRetreat && hpRatio <= retreatRatio;

  f[Goal.REACH_PATH_GOAL] += 20;

  let playerArmed = false;
  let targetArmed = false;
  let baseArmed = false;

  if (combat) {
    const engage = pack.enemyEngageRadius;
    const weapon = unit.weaponId ? getWeaponDef(unit.weaponId) : null;
    const fireR = getWeaponMaxRangePx(weapon) || pack.enemyFireRadius;
    const inEngage = combat.dist <= engage;
    const nearFire = combat.dist <= fireR * 1.15;

    if (combat.kind === 'unit') {
      if (inEngage || unit.aggroChase) {
        playerArmed = true;
        f[Goal.ELIMINATE_PLAYER] += 180;
        f[Goal.SUICIDE_ATTACK] += 160;
      }
      if (nearFire) {
        f[Goal.ELIMINATE_PLAYER] += 80;
        f[Goal.SUICIDE_ATTACK] += 60;
      }
      // Sniper fleeOnApproach: prefer retreat when player inside preferred standoff.
      const fleeDist =
        getPreferredStandoffPx(weapon, flags.preferredRange || 'LONG_RANGE') *
        0.55;
      if (flags.fleeOnApproach && combat.dist < (fleeDist || fireR * 0.4)) {
        f[Goal.SURVIVE_RETREAT] += 200;
      }
    } else if (combat.kind === 'base') {
      baseArmed = true;
      if (inEngage || nearFire) f[Goal.DESTROY_BASE] += 200;
      else f[Goal.DESTROY_BASE] += 40;
    } else if (combat.kind === 'block') {
      if (inEngage || unit.attackBlockId >= 0 || unit.aggroBlockId >= 0) {
        targetArmed = true;
        f[Goal.ELIMINATE_TARGET] += 200;
        f[Goal.SUICIDE_ATTACK] += 120;
      } else if (combat.dist <= engage * 1.25) {
        targetArmed = true;
        f[Goal.ELIMINATE_TARGET] += 60;
      }
    }
  }

  // Taunt scratch can arm ELIMINATE_TARGET without combat pick yet.
  if (bb.flags && bb.flags.TAUNT_TRIGGERED) targetArmed = true;

  if (!playerArmed) {
    f[Goal.ELIMINATE_PLAYER] -= base[Goal.ELIMINATE_PLAYER] || 0;
    f[Goal.SUICIDE_ATTACK] -= (base[Goal.SUICIDE_ATTACK] || 0) * 0.5;
  }
  if (!targetArmed) f[Goal.ELIMINATE_TARGET] -= base[Goal.ELIMINATE_TARGET] || 0;
  if (!baseArmed) f[Goal.DESTROY_BASE] -= base[Goal.DESTROY_BASE] || 0;
  if (!playerArmed && !targetArmed) {
    f[Goal.SUICIDE_ATTACK] -= base[Goal.SUICIDE_ATTACK] || 0;
  }

  if (lowHp) {
    f[Goal.SURVIVE_RETREAT] += 40;
  } else {
    f[Goal.SURVIVE_RETREAT] -= base[Goal.SURVIVE_RETREAT] || 0;
  }

  if (bb.seekKind === 'heal' && hpRatio < 0.55) {
    f[Goal.SEEK_HEAL_POINT] += 120;
  } else {
    f[Goal.SEEK_HEAL_POINT] -= base[Goal.SEEK_HEAL_POINT] || 0;
  }

  // Hold/regroup soft — mild unless allies far and no combat.
  f[Goal.HOLD_SECTOR] -= base[Goal.HOLD_SECTOR] || 0;
  if (bb.allyCount > 1) {
    const ad = Math.hypot(bb.allyCentroidX - unit.x, bb.allyCentroidY - unit.y);
    if (ad > pack.enemyEngageRadius * 1.8 && !combat) {
      f[Goal.REGROUP_ALLIES] += 80;
    } else {
      f[Goal.REGROUP_ALLIES] -= base[Goal.REGROUP_ALLIES] || 0;
    }
    // Bodyguard: stay near centroid when protect goal allowed.
    if (flags.bodyguardMode && ad > pack.enemyEngageRadius * 0.9) {
      f[Goal.PROTECT_ALLY] += 140;
    } else {
      f[Goal.PROTECT_ALLY] -= base[Goal.PROTECT_ALLY] || 0;
    }
  } else {
    f[Goal.REGROUP_ALLIES] -= base[Goal.REGROUP_ALLIES] || 0;
    f[Goal.PROTECT_ALLY] -= base[Goal.PROTECT_ALLY] || 0;
  }

  if (unit.lockRetreat) {
    f[Goal.SURVIVE_RETREAT] -= (base[Goal.SURVIVE_RETREAT] || 0) + 500;
  }

  if (bb.leftSector) {
    f[Goal.REACH_PATH_GOAL] += 100;
  }

  // Place / repair — armed only when blackboard has reserved slot / target.
  const placeArmed =
    !!(bb.flags && bb.flags.PLACE_INTENT) ||
    !!(
      bb.placeBlockTypeId &&
      bb.placeGx != null &&
      bb.placeGx >= 0 &&
      bb.placeGy != null &&
      bb.placeGy >= 0
    );
  const repairArmed =
    !!(bb.flags && bb.flags.REPAIR_INTENT) ||
    (bb.repairTargetId != null && bb.repairTargetId >= 0);
  const engineerFlag = !!(
    unit.hasPlacementSkill ||
    (bb.flags && bb.flags.hasPlacementSkill)
  );

  if (placeArmed) {
    f[Goal.PLACE_TRAP] += 220;
    if (engineerFlag) f[Goal.PLACE_TRAP] += 40;
  } else {
    f[Goal.PLACE_TRAP] -= base[Goal.PLACE_TRAP] || 0;
  }

  if (repairArmed) {
    f[Goal.REPAIR_STRUCTURE] += 200;
    if (engineerFlag) f[Goal.REPAIR_STRUCTURE] += 40;
  } else {
    f[Goal.REPAIR_STRUCTURE] -= base[Goal.REPAIR_STRUCTURE] || 0;
  }

  // Skirmisher flank — armed by BURST_COMPLETE event flag / timer.
  if (bb.flags && bb.flags.BURST_COMPLETE) {
    f[Goal.FLANK_POSITION] += 180;
  } else {
    f[Goal.FLANK_POSITION] -= base[Goal.FLANK_POSITION] || 0;
  }

  // Coward morale broken — already event-boosted; soft factor too.
  if (bb.flags && bb.flags.MORALE_BROKEN) {
    f[Goal.SURVIVE_RETREAT] += 80;
  }

  return f;
}

/**
 * Score Goals and return argmax — only among allowedGoals when set.
 */
export function selectGoal(unit, bb, combat, pack, weights) {
  const base = weights || DEFAULT_GOAL_BASE_WEIGHTS;
  const factors = factorScores(unit, combat, pack, bb, base);
  const allowed = getAllowedGoalSet(unit);
  const keys = Object.keys(Goal);
  let bestGoal = Goal.REACH_PATH_GOAL;
  let bestScore = -Infinity;
  let anyAllowed = false;

  for (let i = 0; i < keys.length; i++) {
    const g = Goal[keys[i]];
    if (allowed && !allowed[g]) {
      bb.priority[g] = -Infinity;
      continue;
    }
    anyAllowed = true;
    const score =
      (base[g] || 0) + (bb.eventBoost[g] || 0) + (factors[g] || 0);
    bb.priority[g] = score;
    if (score > bestScore) {
      bestScore = score;
      bestGoal = g;
    }
  }

  // Fallback if filter emptied everything (should not happen with REACH union).
  if (!anyAllowed) {
    bestGoal = Goal.REACH_PATH_GOAL;
    bb.priority[bestGoal] = 0;
  }

  // Deterministic tie-break: prefer REACH_PATH_GOAL on exact ties.
  for (let i = 0; i < keys.length; i++) {
    const g = Goal[keys[i]];
    if (allowed && !allowed[g]) continue;
    if (bb.priority[g] === bestScore && g === Goal.REACH_PATH_GOAL) {
      bestGoal = g;
      break;
    }
  }

  return bestGoal;
}

function mapGoalToStage(goal, goalToStage) {
  const table = goalToStage || DEFAULT_GOAL_TO_STAGE;
  return table[goal] || StageId.APPROACH_PATH;
}

/**
 * Archetype-agnostic: cast READY skills while engaging (Unified CAST_SKILL).
 * Prefer named archetype skills; FIST only when gun not viable or in melee band.
 */
function maybeEmitReadySkill(unit, combatTarget, actions, ctx) {
  if (!unit || !unit.skillIds || !unit.skillIds.length || !unit.skills) return;
  if (!combatTarget && !(unit.aggroChase || unit.tauntTimer > 0)) return;

  let fistReady = null;
  for (let i = 0; i < unit.skillIds.length; i++) {
    const id = unit.skillIds[i];
    const rt = unit.skills[id];
    if (!rt || rt.phase !== SkillPhase.READY) continue;
    if (id === 'FIST') {
      fistReady = id;
      continue;
    }
    actions.push({
      type: ActionType.CAST_SKILL,
      unitId: unit.id,
      skillId: id,
    });
    return;
  }

  if (!fistReady) return;
  const pack = ctx && ctx.pack;
  const meleeR = pack && pack.meleeReach ? pack.meleeReach * 1.25 : 90;
  const weapon = unit.weaponId && ctx && ctx.getWeaponDef
    ? ctx.getWeaponDef(unit.weaponId)
    : null;
  const canShoot =
    weapon &&
    ctx &&
    typeof ctx.canFireAmmo === 'function' &&
    ctx.canFireAmmo(unit, weapon);
  const close =
    combatTarget && typeof combatTarget.dist === 'number'
      ? combatTarget.dist <= meleeR
      : false;
  const wantFist = !unit.weaponId || !canShoot || close;
  if (!wantFist) return;
  actions.push({
    type: ActionType.CAST_SKILL,
    unitId: unit.id,
    skillId: fistReady,
  });
}

/**
 * Skirmisher burst timer → BURST_COMPLETE flag for FLANK_POSITION.
 */
function tickBurstRelocate(unit, bb, combatTarget, dt, activeStage) {
  const flags = unit.behaviorFlags || {};
  if (!flags.relocateAfterBurst) return;
  const burstSec =
    (unit._effectiveArchetype && unit._effectiveArchetype.burstDurationSec) ||
    2.0;

  if (activeStage === StageId.ENGAGE && combatTarget) {
    unit._burstTimer = (unit._burstTimer || 0) + dt;
    if (unit._burstTimer >= burstSec) {
      bb.flags.BURST_COMPLETE = true;
      unit._burstTimer = 0;
      unit._flankTimer = 1.4;
    }
  } else if (bb.flags.BURST_COMPLETE) {
    unit._flankTimer = Math.max(0, (unit._flankTimer || 0) - dt);
    if (unit._flankTimer <= 0) bb.flags.BURST_COMPLETE = false;
  } else {
    unit._burstTimer = 0;
  }
}

/**
 * Run Mediator for one enemy unit → Action list (Unified Input).
 */
export function decideUnitViaMediator(match, unit, ctx) {
  // Phase 3 — live-time boss / archetype phase before Goal score.
  tickArchetypePhase(unit);

  const bb = ensureBlackboard(unit);
  const pack = ctx.pack;
  const pathGoal = ctx.pathGoal;
  const combatTarget = ctx.combatTarget;

  writePathGoal(unit, pathGoal.x, pathGoal.y, pathGoal.radius);
  bb.allyCentroidX = ctx.allyX || 0;
  bb.allyCentroidY = ctx.allyY || 0;
  bb.allyCount = ctx.allyN || 0;
  syncCombatToBlackboard(unit);

  processUnitEvents(match, unit, {
    pack,
    combatTarget,
    pathGoal,
    leftSector: ctx.leftSector,
    eventBoostTable: ctx.eventBoostTable || DEFAULT_EVENT_BOOSTS,
  });

  // Burst accum uses previous stage; flag arms FLANK_POSITION this frame.
  tickBurstRelocate(unit, bb, combatTarget, ctx.dt || 0, bb.activeStage);

  const activeGoal = selectGoal(
    unit,
    bb,
    combatTarget,
    pack,
    ctx.goalBaseWeights || DEFAULT_GOAL_BASE_WEIGHTS
  );
  const activeStage = mapGoalToStage(
    activeGoal,
    ctx.goalToStage || DEFAULT_GOAL_TO_STAGE
  );

  bb.activeGoal = activeGoal;
  bb.activeStage = activeStage;
  unit.aiStage = STAGE_TO_LEGACY[activeStage] || 'approach';

  const runner = STAGE_RUNNERS[activeStage] || runApproach;
  const stageCtx = {
    match,
    unit,
    pack,
    dt: ctx.dt,
    pathGoal,
    combatTarget,
    allyX: ctx.allyX,
    allyY: ctx.allyY,
    allyN: ctx.allyN,
    blackboard: bb,
    canFireAmmo: ctx.canFireAmmo,
    getWeaponDef: ctx.getWeaponDef,
  };

  const actions = runner(stageCtx) || [];

  // RELOAD stays Unified Input — emit before stage movement if mag empty.
  const weapon = unit.weaponId ? ctx.getWeaponDef(unit.weaponId) : null;
  const needsReload =
    !!weapon && !weapon.infiniteAmmo && unit.ammoInMag <= 0 && unit.mags > 0;
  if (needsReload && !(unit.reloadTimer > 0)) {
    actions.unshift({ type: ActionType.RELOAD, unitId: unit.id });
  }

  // Shield / boss skills via Unified CAST_SKILL (no skill names in stages).
  if (activeStage === StageId.ENGAGE || activeStage === StageId.REGROUP) {
    maybeEmitReadySkill(unit, combatTarget, actions, ctx);
  }

  return actions;
}

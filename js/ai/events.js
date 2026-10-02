/**
 * Frame Event processing — writes Δpriority + target locks onto Blackboard.
 * Events do NOT select Stages (Mediator does).
 */

import {
  getWeaponDef,
  getWeaponMaxRangePx,
} from '../config.js';
import {
  Goal,
  addEventBoost,
  clearEventBoosts,
  ensureBlackboard,
  pushAiEvent,
  reserveCombatTarget,
} from './blackboard.js';

/** Data-driven Event → Goal Δpriority (overridable via AI_EVENT_BOOSTS in config). */
export const DEFAULT_EVENT_BOOSTS = Object.freeze({
  HIT_BY_PLAYER: Object.freeze({ [Goal.ELIMINATE_PLAYER]: 400 }),
  HIT_BY_TURRET: Object.freeze({ [Goal.ELIMINATE_TARGET]: 380 }),
  SPOTTED_PLAYER: Object.freeze({ [Goal.ELIMINATE_PLAYER]: 220 }),
  TAUNT_TRIGGERED: Object.freeze({ [Goal.ELIMINATE_TARGET]: 450 }),
  LOW_HP: Object.freeze({
    [Goal.SURVIVE_RETREAT]: 500,
    [Goal.SEEK_HEAL_POINT]: 200,
  }),
  LEFT_GENERAL_SECTOR: Object.freeze({
    [Goal.REACH_PATH_GOAL]: 350,
    [Goal.ELIMINATE_PLAYER]: -180,
    [Goal.ELIMINATE_TARGET]: -180,
    [Goal.PLACE_TRAP]: -120,
    [Goal.REPAIR_STRUCTURE]: -80,
  }),
  BASE_IN_RANGE: Object.freeze({ [Goal.DESTROY_BASE]: 280 }),
  PATH_GOAL_REACHED: Object.freeze({ [Goal.REACH_PATH_GOAL]: -40 }),
  HEAL_POINT_AVAILABLE: Object.freeze({ [Goal.SEEK_HEAL_POINT]: 260 }),
  /** Local steering exhausted on a real blocker → eliminate it. */
  PATH_BLOCKED: Object.freeze({ [Goal.ELIMINATE_TARGET]: 420 }),
  /** Blackboard place slot primed (typeId + L3 cell). */
  PLACE_SLOT_RESERVED: Object.freeze({ [Goal.PLACE_TRAP]: 480 }),
  /** Blackboard repair target primed (friendly block id). */
  REPAIR_TARGET_RESERVED: Object.freeze({ [Goal.REPAIR_STRUCTURE]: 460 }),
  BURST_COMPLETE: Object.freeze({
    [Goal.FLANK_POSITION]: 520,
    [Goal.ELIMINATE_PLAYER]: -120,
  }),
  MORALE_BROKEN: Object.freeze({
    [Goal.SURVIVE_RETREAT]: 600,
    [Goal.REGROUP_ALLIES]: -200,
  }),
});

function applyBoostMap(bb, boostMap) {
  if (!boostMap) return;
  const keys = Object.keys(boostMap);
  for (let i = 0; i < keys.length; i++) {
    addEventBoost(bb, keys[i], boostMap[keys[i]]);
  }
}

/**
 * Process queued + synthetic perception Events for one unit this frame.
 * @param {object} opts.eventBoostTable — from config AI_EVENT_BOOSTS
 */
export function processUnitEvents(match, unit, ctx) {
  const bb = ensureBlackboard(unit);
  clearEventBoosts(bb);

  const table = ctx.eventBoostTable || DEFAULT_EVENT_BOOSTS;
  const pack = ctx.pack;
  const combat = ctx.combatTarget;
  const pathGoal = ctx.pathGoal;
  const leftSector = !!ctx.leftSector;
  bb.leftSector = leftSector;

  // --- Drain named queue (taunt etc.) — once per type per frame ---
  const appliedTypes = Object.create(null);
  if (bb.events && bb.events.length) {
    for (let i = 0; i < bb.events.length; i++) {
      const ev = bb.events[i];
      if (!ev || !ev.type || appliedTypes[ev.type]) continue;
      // Fresh-ish events only (avoid re-boosting aged history every frame).
      if ((ev.t || 0) > 0.05 && ev.type !== 'TAUNT_TRIGGERED') continue;
      if (ev.type === 'TAUNT_TRIGGERED' && (ev.t || 0) > (ev.payload && ev.payload.durationSec || 4)) {
        continue;
      }
      appliedTypes[ev.type] = true;
      if (ev.type === 'TAUNT_TRIGGERED') {
        applyBoostMap(bb, table.TAUNT_TRIGGERED);
        const src = ev.payload && ev.payload.sourceEntityId;
        if (src != null) {
          reserveCombatTarget(unit, 'unit', src, ev.payload.durationSec || 4);
          bb.priorityScratch.ELIMINATE_TARGET = src;
        }
      } else if (ev.type === 'PATH_BLOCKED') {
        applyBoostMap(bb, table.PATH_BLOCKED);
        const bid = ev.payload && ev.payload.blockId;
        if (bid != null && bid >= 0) {
          reserveCombatTarget(unit, 'block', bid, 2.5);
          unit.attackBlockId = bid;
          bb.priorityScratch.ELIMINATE_TARGET = bid;
        }
      } else if (table[ev.type]) {
        applyBoostMap(bb, table[ev.type]);
      }
    }
  }

  if (unit.tauntTimer > 0 || (bb.flags && bb.flags.TAUNT_TRIGGERED)) {
    if (!appliedTypes.TAUNT_TRIGGERED) {
      applyBoostMap(bb, table.TAUNT_TRIGGERED);
      appliedTypes.TAUNT_TRIGGERED = true;
    }
  }

  // --- Synthetic perception from state (deterministic) ---
  const hpRatio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
  const retreatRatio =
    typeof unit.retreatHpRatio === 'number'
      ? unit.retreatHpRatio
      : pack.enemyRetreatHpRatio;

  if (unit.lockRetreat) {
    // Boss / forced fight — suppress retreat boost.
  } else if (hpRatio <= retreatRatio) {
    applyBoostMap(bb, table.LOW_HP);
    bb.flags.LOW_HP = true;
    if (bb.seekKind === 'heal') {
      applyBoostMap(bb, table.HEAL_POINT_AVAILABLE);
    }
  } else {
    bb.flags.LOW_HP = false;
  }

  if (leftSector) {
    applyBoostMap(bb, table.LEFT_GENERAL_SECTOR);
    bb.flags.LEFT_GENERAL_SECTOR = true;
  } else {
    bb.flags.LEFT_GENERAL_SECTOR = false;
  }

  if (unit.aggroChase) {
    if (unit.aggroBlockId >= 0) {
      applyBoostMap(bb, table.HIT_BY_TURRET);
      bb.flags.HIT_BY_TURRET = true;
    } else {
      applyBoostMap(bb, table.HIT_BY_PLAYER);
      bb.flags.HIT_BY_PLAYER = true;
    }
  }

  if (combat && combat.kind === 'unit') {
    const engage = pack.enemyEngageRadius;
    if (combat.dist <= engage * 1.25 || unit.aggroChase) {
      applyBoostMap(bb, table.SPOTTED_PLAYER);
      bb.flags.SPOTTED_PLAYER = true;
    }
  } else {
    bb.flags.SPOTTED_PLAYER = false;
  }

  if (combat && (combat.kind === 'base' || (combat.block && combat.block.isDefeatCondition))) {
    const weapon = unit.weaponId ? getWeaponDef(unit.weaponId) : null;
    const fireR = getWeaponMaxRangePx(weapon) || pack.enemyFireRadius;
    if (combat.dist <= fireR * 1.35) {
      applyBoostMap(bb, table.BASE_IN_RANGE);
      bb.flags.BASE_IN_RANGE = true;
    }
  } else {
    bb.flags.BASE_IN_RANGE = false;
  }

  if (bb.flags.STEERING_EXHAUSTED || unit.attackBlockId >= 0) {
    if (!appliedTypes.PATH_BLOCKED) {
      applyBoostMap(bb, table.PATH_BLOCKED);
      appliedTypes.PATH_BLOCKED = true;
      bb.flags.PATH_BLOCKED = true;
      if (unit.attackBlockId >= 0) {
        reserveCombatTarget(unit, 'block', unit.attackBlockId, 2.5);
        bb.priorityScratch.ELIMINATE_TARGET = unit.attackBlockId;
      }
    }
  } else {
    bb.flags.PATH_BLOCKED = false;
  }

  if (pathGoal) {
    const d = Math.hypot(pathGoal.x - unit.x, pathGoal.y - unit.y);
    const r = pathGoal.radius || bb.pathGoalRadius || 160;
    if (d <= r) {
      applyBoostMap(bb, table.PATH_GOAL_REACHED);
      bb.flags.PATH_GOAL_REACHED = true;
    } else {
      bb.flags.PATH_GOAL_REACHED = false;
    }
  }

  // Place / repair reservations on blackboard → Event boost (Mediator selects).
  const placeReady =
    !!(bb.flags && bb.flags.PLACE_INTENT) ||
    !!(
      bb.placeBlockTypeId &&
      bb.placeGx != null &&
      bb.placeGx >= 0 &&
      bb.placeGy != null &&
      bb.placeGy >= 0
    );
  if (placeReady) {
    applyBoostMap(bb, table.PLACE_SLOT_RESERVED);
    bb.flags.PLACE_INTENT = true;
  }

  const repairReady =
    !!(bb.flags && bb.flags.REPAIR_INTENT) ||
    (bb.repairTargetId != null && bb.repairTargetId >= 0);
  if (repairReady) {
    applyBoostMap(bb, table.REPAIR_TARGET_RESERVED);
    bb.flags.REPAIR_INTENT = true;
  }

  if (bb.flags && bb.flags.BURST_COMPLETE) {
    applyBoostMap(bb, table.BURST_COMPLETE);
  }

  // Coward / morale archetypes: flee when morale below threshold.
  const flags = unit.behaviorFlags || {};
  if (flags.useMoraleSystem && unit.moraleState) {
    const thr =
      typeof flags.fleeMoraleThreshold === 'number'
        ? flags.fleeMoraleThreshold / 100
        : 0.3;
    if (unit.moraleState.morale <= thr) {
      applyBoostMap(bb, table.MORALE_BROKEN);
      bb.flags.MORALE_BROKEN = true;
    } else {
      bb.flags.MORALE_BROKEN = false;
    }
  }

  return bb;
}

/** Convenience: record HIT from damage pipeline (optional call site). */
export function noteHitEvent(unit, opts = {}) {
  const type = opts.fromTurret ? 'HIT_BY_TURRET' : 'HIT_BY_PLAYER';
  pushAiEvent(unit, type, {
    sourceBlockId: opts.sourceBlockId,
    sourceX: opts.sourceX,
    sourceY: opts.sourceY,
  });
}

/**
 * Per-unit AI Blackboard — reserved targets, path/seek, event Δpriority, flags.
 * Stages read this; Mediator writes Goal/Stage; Events write boosts + locks.
 */

export const TargetKind = Object.freeze({
  PLAYER: 'PLAYER',
  ENEMY_UNIT: 'ENEMY_UNIT',
  ALLY_UNIT: 'ALLY_UNIT',
  BLOCK_BASE: 'BLOCK_BASE',
  BLOCK_TURRET: 'BLOCK_TURRET',
  BLOCK_OTHER: 'BLOCK_OTHER',
  POINT_SEEK: 'POINT_SEEK',
});

export const Goal = Object.freeze({
  DESTROY_BASE: 'DESTROY_BASE',
  ELIMINATE_PLAYER: 'ELIMINATE_PLAYER',
  ELIMINATE_TARGET: 'ELIMINATE_TARGET',
  REACH_PATH_GOAL: 'REACH_PATH_GOAL',
  SURVIVE_RETREAT: 'SURVIVE_RETREAT',
  SEEK_HEAL_POINT: 'SEEK_HEAL_POINT',
  HOLD_SECTOR: 'HOLD_SECTOR',
  REGROUP_ALLIES: 'REGROUP_ALLIES',
  /** Place turret/trap from blackboard L3 cell + block typeId (Engineer). */
  PLACE_TRAP: 'PLACE_TRAP',
  /** Repair friendly structure via wrench HARVEST path. */
  REPAIR_STRUCTURE: 'REPAIR_STRUCTURE',
  /** Bodyguard / cover allies (Shield Vanguard). */
  PROTECT_ALLY: 'PROTECT_ALLY',
  /** Hit-and-run relocate after burst (Skirmisher). */
  FLANK_POSITION: 'FLANK_POSITION',
  /** Relentless close assault (Boss phase 2 / berserker-style). */
  SUICIDE_ATTACK: 'SUICIDE_ATTACK',
});

export const StageId = Object.freeze({
  APPROACH_PATH: 'APPROACH_PATH',
  ENGAGE: 'ENGAGE',
  RETREAT: 'RETREAT',
  REGROUP: 'REGROUP',
  SEEK_POINT: 'SEEK_POINT',
  PLACE: 'PLACE',
});

/** Legacy entity.aiStage string ↔ StageId */
export const STAGE_TO_LEGACY = Object.freeze({
  APPROACH_PATH: 'approach',
  ENGAGE: 'engage',
  RETREAT: 'retreat',
  REGROUP: 'approach',
  SEEK_POINT: 'approach',
  PLACE: 'place',
});

function emptyPriorityMap() {
  const m = Object.create(null);
  const keys = Object.keys(Goal);
  for (let i = 0; i < keys.length; i++) m[Goal[keys[i]]] = 0;
  return m;
}

/**
 * Ensure entity.blackboard exists with full Phase 2a fields.
 * Compatible with taunt stub (events / priorityScratch / flags).
 */
export function ensureBlackboard(ent) {
  if (!ent) return null;
  if (!ent.blackboard) {
    ent.blackboard = createBlackboard();
  } else {
    const bb = ent.blackboard;
    if (!bb.events) bb.events = [];
    if (!bb.priorityScratch) bb.priorityScratch = Object.create(null);
    if (!bb.flags) bb.flags = Object.create(null);
    if (!bb.eventBoost) bb.eventBoost = emptyPriorityMap();
    if (!bb.priority) bb.priority = emptyPriorityMap();
    if (bb.pathGoalX == null) bb.pathGoalX = 0;
    if (bb.pathGoalY == null) bb.pathGoalY = 0;
    if (bb.pathGoalRadius == null) bb.pathGoalRadius = 160;
    if (bb.pathPivots === undefined) bb.pathPivots = null;
    if (bb.localAdjusted == null) bb.localAdjusted = false;
    if (bb.steeringBudgetLeft == null) bb.steeringBudgetLeft = 10;
    if (bb.perception == null) bb.perception = null;
    if (bb.seekX == null) bb.seekX = 0;
    if (bb.seekY == null) bb.seekY = 0;
    if (bb.seekKind == null) bb.seekKind = null;
    if (bb.combatTargetKind === undefined) bb.combatTargetKind = null;
    if (bb.combatTargetId === undefined) bb.combatTargetId = -1;
    if (bb.combatLockTimer == null) bb.combatLockTimer = 0;
    if (bb.allyCentroidX == null) bb.allyCentroidX = 0;
    if (bb.allyCentroidY == null) bb.allyCentroidY = 0;
    if (bb.allyCount == null) bb.allyCount = 0;
    if (bb.leftSector == null) bb.leftSector = false;
    if (bb.placeBlockTypeId === undefined) bb.placeBlockTypeId = null;
    if (bb.placeGx == null) bb.placeGx = -1;
    if (bb.placeGy == null) bb.placeGy = -1;
    if (bb.repairTargetId == null) bb.repairTargetId = -1;
  }
  return ent.blackboard;
}

export function createBlackboard() {
  return {
    events: [],
    flags: Object.create(null),
    /** Scratch for taunt / external writers (legacy key→id). */
    priorityScratch: Object.create(null),
    /** Per-frame Goal Δpriority from Events (cleared each decide tick). */
    eventBoost: emptyPriorityMap(),
    /** Last scored priorities (debug / memento-friendly). */
    priority: emptyPriorityMap(),
    activeGoal: Goal.REACH_PATH_GOAL,
    activeStage: StageId.APPROACH_PATH,
    pathGoalX: 0,
    pathGoalY: 0,
    pathGoalRadius: 160,
    /** Shared ref to General group pivots (read-only for Stages). */
    pathPivots: null,
    /** True when Local adjusted near-term goal this frame. */
    localAdjusted: false,
    steeringBudgetLeft: 10,
    /** Last Local raycast fan summary (debug / Events). */
    perception: null,
    pivotIndex: 0,
    groupId: -1,
    combatTargetKind: null,
    combatTargetId: -1,
    combatLockTimer: 0,
    aggroChase: false,
    aggroBlockId: -1,
    seekX: 0,
    seekY: 0,
    seekKind: null,
    allyCentroidX: 0,
    allyCentroidY: 0,
    allyCount: 0,
    leftSector: false,
    /** Place intent — typeId + L3 cell (footprint snap target). */
    placeBlockTypeId: null,
    placeGx: -1,
    placeGy: -1,
    /** Repair intent — reserved friendly block id. */
    repairTargetId: -1,
  };
}

/** Clear place slot reservation on blackboard. */
export function clearPlaceIntent(bb) {
  if (!bb) return;
  bb.placeBlockTypeId = null;
  bb.placeGx = -1;
  bb.placeGy = -1;
  if (bb.flags) bb.flags.PLACE_INTENT = false;
}

/** Clear repair target reservation. */
export function clearRepairIntent(bb) {
  if (!bb) return;
  bb.repairTargetId = -1;
  if (bb.flags) bb.flags.REPAIR_INTENT = false;
}

/**
 * Write place intent (coords/type only — no archetype story).
 * @param {object} ent
 * @param {{ blockTypeId: string, gx: number, gy: number }} opts
 */
export function writePlaceIntent(ent, opts) {
  const bb = ensureBlackboard(ent);
  bb.placeBlockTypeId = opts.blockTypeId || null;
  bb.placeGx = opts.gx != null ? opts.gx | 0 : -1;
  bb.placeGy = opts.gy != null ? opts.gy | 0 : -1;
  bb.flags.PLACE_INTENT = !!(bb.placeBlockTypeId && bb.placeGx >= 0 && bb.placeGy >= 0);
  return bb;
}

/**
 * Write repair intent (block id only).
 * @param {object} ent
 * @param {number} blockId
 */
export function writeRepairIntent(ent, blockId) {
  const bb = ensureBlackboard(ent);
  bb.repairTargetId = blockId != null ? blockId : -1;
  bb.flags.REPAIR_INTENT = bb.repairTargetId >= 0;
  return bb;
}


/** Push a named Event onto the queue (does not select Stage). */
export function pushAiEvent(ent, type, payload = {}) {
  const bb = ensureBlackboard(ent);
  bb.events.push({ type, t: 0, payload });
  bb.flags[type] = true;
  return bb;
}

/** Clear per-frame boosts before Event processing. */
export function clearEventBoosts(bb) {
  if (!bb || !bb.eventBoost) return;
  const keys = Object.keys(Goal);
  for (let i = 0; i < keys.length; i++) {
    bb.eventBoost[Goal[keys[i]]] = 0;
  }
}

/** Add Δpriority to a Goal on the blackboard. */
export function addEventBoost(bb, goalId, delta) {
  if (!bb || !goalId || !delta) return;
  if (!bb.eventBoost) bb.eventBoost = emptyPriorityMap();
  bb.eventBoost[goalId] = (bb.eventBoost[goalId] || 0) + delta;
}

/**
 * Mirror sticky combat fields entity ↔ blackboard.
 * Entity fields remain source of truth for pickStickyCombatTarget / damage.
 */
export function syncCombatToBlackboard(ent) {
  const bb = ensureBlackboard(ent);
  bb.combatTargetKind = ent.combatTargetKind || null;
  bb.combatTargetId =
    ent.combatTargetId != null ? ent.combatTargetId : -1;
  bb.combatLockTimer = ent.combatLockTimer || 0;
  bb.aggroChase = !!ent.aggroChase;
  bb.aggroBlockId = ent.aggroBlockId != null ? ent.aggroBlockId : -1;
  bb.groupId = ent.groupId != null ? ent.groupId : -1;
  bb.pivotIndex = ent.pivotIndex || 0;
  bb.pathGoalX = ent.pathGoalX || 0;
  bb.pathGoalY = ent.pathGoalY || 0;
  return bb;
}

export function writePathGoal(ent, x, y, radius) {
  const bb = ensureBlackboard(ent);
  bb.pathGoalX = x;
  bb.pathGoalY = y;
  bb.pathGoalRadius = radius != null ? radius : 160;
  ent.pathGoalX = x;
  ent.pathGoalY = y;
  return bb;
}

export function reserveCombatTarget(ent, kind, id, lockTimer) {
  const bb = ensureBlackboard(ent);
  bb.combatTargetKind = kind;
  bb.combatTargetId = id;
  if (lockTimer != null) bb.combatLockTimer = lockTimer;
  ent.combatTargetKind = kind;
  ent.combatTargetId = id;
  if (lockTimer != null) {
    ent.combatLockTimer = Math.max(ent.combatLockTimer || 0, lockTimer);
  }
  return bb;
}

/** Map legacy combat kind string → TargetKind for Goals. */
export function legacyCombatToTargetKind(kind, block) {
  if (kind === 'unit') return TargetKind.PLAYER;
  if (kind === 'base') return TargetKind.BLOCK_BASE;
  if (kind === 'block') {
    if (block && block.isDefeatCondition) return TargetKind.BLOCK_BASE;
    if (block && block.isTurret) return TargetKind.BLOCK_TURRET;
    return TargetKind.BLOCK_OTHER;
  }
  return null;
}

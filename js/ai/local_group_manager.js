/**
 * Local Group path layer — dodge real obstacles while following General pivots.
 * Raycast fan (1→3→5, ~45°) + rear Pi + steering budget.
 * Does not BFS the map; writes near-term pathGoal onto Blackboard only.
 * Stages stay single-job; Mediator still picks Stage from Goals/Events.
 */

import { L1_SIZE, L3_SIZE, TEAM } from '../config.js';
import {
  applyLocalGeneralStub,
  isUnitInsideSector,
  resolveObstacleOnPath,
} from '../general.js';
import {
  ensureBlackboard,
  pushAiEvent,
  reserveCombatTarget,
  writePathGoal,
} from './blackboard.js';

/** Default Local perception / steering (overridable via AI_LOCAL_PATH in config). */
export const DEFAULT_LOCAL_PATH = Object.freeze({
  /** Total front fan span (~45°). */
  fanSpanRad: Math.PI / 4,
  /** Progressive line counts. */
  fanStages: Object.freeze([1, 3, 5]),
  /** Ray length along approach (world units). */
  fanRange: Math.round(L3_SIZE * 5),
  /** Small rear Pi — threats behind outside the fan. */
  rearPiRadius: Math.round(L3_SIZE * 1.5),
  /** Max local dodge pivots (group or unit). */
  steeringBudgetMax: 10,
  /** Lateral offset when dodging (Path/L1-scale, not per-cell micro). */
  dodgeLateral: L1_SIZE * 0.35,
});

/**
 * Apply Local layer for one unit after General wrote pathGoal/pivots.
 * @returns {{ goal, attackBlock, perception, steeringUsed }}
 */
export function applyLocalPathLayer(match, unit, generalGoal, opts = {}) {
  const cfg = opts.config || DEFAULT_LOCAL_PATH;
  const bb = ensureBlackboard(unit);
  const baseX = opts.baseX != null ? opts.baseX : generalGoal.x;
  const baseY = opts.baseY != null ? opts.baseY : generalGoal.y;

  ensureSteeringState(match, unit, cfg);

  // Sector / off-path rejoin (Local General stub → blackboard goal).
  let goal = generalGoal;
  const leftSector = !!opts.leftSector;
  if (leftSector) {
    const localGoal = applyLocalGeneralStub(match, unit, baseX, baseY);
    if (localGoal) goal = localGoal;
  } else {
    const localGoal = applyLocalGeneralStub(match, unit, baseX, baseY);
    if (localGoal && unit.localGeneral) goal = localGoal;
  }

  const facing = Math.atan2(goal.y - unit.y, goal.x - unit.x);
  const perception = castRaycastFan(match, unit, facing, cfg);
  bb.perception = {
    fanLines: perception.lineCount,
    blocked: perception.blocked,
    rearHit: perception.rearHit,
    blockerId: perception.blocker ? perception.blocker.id : -1,
  };

  let attackBlock = null;
  const budgetLeft = getSteeringBudgetLeft(match, unit);

  if (perception.blocked && perception.blocker) {
    if (budgetLeft > 0) {
      // Spend one steering point for a deterministic lateral dodge.
      consumeSteeringBudget(match, unit, 1);
      const dodge = buildDodgeGoal(unit, goal, perception.blocker, cfg);
      goal = dodge;
      bb.flags.LOCAL_DODGE = true;
    } else {
      // Budget exhausted → eliminate blocker via Event/Blackboard (not stage hop).
      attackBlock = perception.blocker;
      unit.attackBlockId = attackBlock.id;
      bb.flags.STEERING_EXHAUSTED = true;
      pushAiEvent(unit, 'PATH_BLOCKED', {
        blockId: attackBlock.id,
        reason: 'steering_budget',
      });
      reserveCombatTarget(unit, 'block', attackBlock.id, 2.5);
      bb.priorityScratch.ELIMINATE_TARGET = attackBlock.id;
    }
  } else {
    bb.flags.LOCAL_DODGE = false;
    bb.flags.STEERING_EXHAUSTED = false;
  }

  // Fallback sample along segment if fan missed thin blockers.
  if (!attackBlock && !bb.flags.LOCAL_DODGE && !bb.flags.STEERING_EXHAUSTED) {
    const resolved = resolveObstacleOnPath(match, unit, goal);
    if (resolved.attackBlock) {
      const rem = getSteeringBudgetLeft(match, unit);
      if (rem > 0) {
        consumeSteeringBudget(match, unit, 1);
        goal = resolved.goal;
        bb.flags.LOCAL_DODGE = true;
      } else {
        attackBlock = resolved.attackBlock;
        unit.attackBlockId = attackBlock.id;
        bb.flags.STEERING_EXHAUSTED = true;
        pushAiEvent(unit, 'PATH_BLOCKED', {
          blockId: attackBlock.id,
          reason: 'steering_budget',
        });
        reserveCombatTarget(unit, 'block', attackBlock.id, 2.5);
        bb.priorityScratch.ELIMINATE_TARGET = attackBlock.id;
      }
    } else {
      goal = resolved.goal;
    }
  }

  // Rear Pi: flag threat so Events/Mediator can arm engage without stage calls.
  if (perception.rearHit) {
    bb.flags.REAR_THREAT = true;
  } else {
    bb.flags.REAR_THREAT = false;
  }

  writePathGoal(unit, goal.x, goal.y, goal.radius != null ? goal.radius : 80);
  bb.steeringBudgetLeft = getSteeringBudgetLeft(match, unit);
  bb.localAdjusted = !!(bb.flags.LOCAL_DODGE || unit.localGeneral);

  return {
    goal,
    attackBlock,
    perception,
    steeringUsed: (unit.steeringUsed | 0),
  };
}

/** Sync General pivots + current pathGoal onto unit Blackboard (no BFS). */
export function writeGeneralPathToBlackboard(unit, group, pathGoal) {
  const bb = ensureBlackboard(unit);
  if (pathGoal) {
    writePathGoal(
      unit,
      pathGoal.x,
      pathGoal.y,
      pathGoal.radius != null ? pathGoal.radius : 160
    );
  }
  if (group && group.pivots && group.pivots.length) {
    bb.pathPivots = group.pivots;
    bb.pivotIndex = unit.pivotIndex | 0;
    bb.groupId = group.id;
  } else {
    bb.pathPivots = null;
  }
  bb.localAdjusted = false;
  return bb;
}

function ensureSteeringState(match, unit, cfg) {
  const max = cfg.steeringBudgetMax || DEFAULT_LOCAL_PATH.steeringBudgetMax;
  const group = match.general && match.general.groups[unit.groupId];
  if (group) {
    if (group.steeringBudgetMax == null) group.steeringBudgetMax = max;
    if (group.steeringUsed == null) group.steeringUsed = 0;
  }
  if (unit.steeringBudgetMax == null) unit.steeringBudgetMax = max;
  if (unit.steeringUsed == null) unit.steeringUsed = 0;
}

function getSteeringBudgetLeft(match, unit) {
  const group = match.general && match.general.groups[unit.groupId];
  if (group && group.steeringBudgetMax != null) {
    return Math.max(0, (group.steeringBudgetMax | 0) - (group.steeringUsed | 0));
  }
  return Math.max(
    0,
    (unit.steeringBudgetMax | 0) - (unit.steeringUsed | 0)
  );
}

function consumeSteeringBudget(match, unit, n) {
  const cost = n || 1;
  unit.steeringUsed = (unit.steeringUsed | 0) + cost;
  const group = match.general && match.general.groups[unit.groupId];
  if (group) {
    group.steeringUsed = (group.steeringUsed | 0) + cost;
  }
}

/**
 * Progressive raycast fan: 1 → 3 → 5 lines across ~45° front.
 * Also samples small rear Pi for close threats.
 */
export function castRaycastFan(match, unit, facingRad, cfg = DEFAULT_LOCAL_PATH) {
  const span = cfg.fanSpanRad != null ? cfg.fanSpanRad : DEFAULT_LOCAL_PATH.fanSpanRad;
  const half = span * 0.5;
  const range = cfg.fanRange || DEFAULT_LOCAL_PATH.fanRange;
  const stages = cfg.fanStages || DEFAULT_LOCAL_PATH.fanStages;

  let lineCount = stages[0] || 1;
  let hits = castFanLines(match, unit.x, unit.y, facingRad, half, range, lineCount);
  let blocker = firstBlocker(hits);

  // Escalate fan detail only when center/near rays hit something solid.
  for (let s = 1; s < stages.length && blocker; s++) {
    lineCount = stages[s];
    hits = castFanLines(match, unit.x, unit.y, facingRad, half, range, lineCount);
    blocker = firstBlocker(hits);
  }

  const rearR = cfg.rearPiRadius || DEFAULT_LOCAL_PATH.rearPiRadius;
  const rearHit = findRearThreat(match, unit, facingRad, rearR);

  return {
    lineCount,
    hits,
    blocked: !!blocker,
    blocker,
    rearHit,
  };
}

function castFanLines(match, ox, oy, facing, halfSpan, range, count) {
  const out = [];
  if (count <= 1) {
    out.push(castRay(match, ox, oy, facing, range));
    return out;
  }
  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * 2 - 1; // -1..1
    const ang = facing + t * halfSpan;
    out.push(castRay(match, ox, oy, ang, range));
  }
  return out;
}

/** Sample along ray for solid walk blockers (nature + player-built). */
function castRay(match, ox, oy, ang, range) {
  const samples = 8;
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  for (let s = 1; s <= samples; s++) {
    const t = (s / samples) * range;
    const x = ox + dx * t;
    const y = oy + dy * t;
    const block = findSolidBlockAt(match, x, y);
    if (block && isLocalObstacle(block)) {
      return { hit: true, x, y, dist: t, block };
    }
  }
  return { hit: false, x: ox + dx * range, y: oy + dy * range, dist: range, block: null };
}

function firstBlocker(hits) {
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i];
    if (!h.hit || !h.block) continue;
    if (h.dist < bestD) {
      bestD = h.dist;
      best = h.block;
    }
  }
  return best;
}

function findRearThreat(match, unit, facingRad, radius) {
  const player = match.pools && match.pools.units;
  if (!player) return null;
  const back = facingRad + Math.PI;
  for (let i = 0; i < player.length; i++) {
    const u = player[i];
    if (!u.active || u.role !== 'player') continue;
    const dist = Math.hypot(u.x - unit.x, u.y - unit.y);
    if (dist > radius) continue;
    const ang = Math.atan2(u.y - unit.y, u.x - unit.x);
    let dAng = ang - back;
    while (dAng > Math.PI) dAng -= Math.PI * 2;
    while (dAng < -Math.PI) dAng += Math.PI * 2;
    if (Math.abs(dAng) <= Math.PI * 0.5) {
      return { kind: 'unit', id: u.id, dist };
    }
  }
  return null;
}

function buildDodgeGoal(unit, goal, blocker, cfg) {
  const dx = goal.x - unit.x;
  const dy = goal.y - unit.y;
  const len = Math.hypot(dx, dy) || 1;
  const ox = -dy / len;
  const oy = dx / len;
  const sign = unit.id % 2 === 0 ? 1 : -1;
  const lat = cfg.dodgeLateral != null ? cfg.dodgeLateral : DEFAULT_LOCAL_PATH.dodgeLateral;
  // Prefer side away from blocker center when possible.
  let side = sign;
  if (blocker) {
    const bx = blocker.x + blocker.w * 0.5;
    const by = blocker.y + blocker.h * 0.5;
    const cross = (bx - unit.x) * oy - (by - unit.y) * ox;
    if (cross !== 0) side = cross > 0 ? -1 : 1;
  }
  return {
    x: unit.x + dx * 0.35 + ox * lat * side,
    y: unit.y + dy * 0.35 + oy * lat * side,
    radius: 60,
  };
}

/** Real obstacles Local must respect (nature + player structures). */
function isLocalObstacle(block) {
  if (!block || !block.alive || block.isOpen) return false;
  if (block.walkSolid === false) return false;
  if (block.isHarvest) return true;
  if (block.team === TEAM.PLAYER) return true;
  return false;
}

function findSolidBlockAt(match, x, y) {
  if (!match.blocks) return null;
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (!b || !b.alive) continue;
    if (b.isOpen) continue;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
  }
  return null;
}

/** Reset group steering when a new wave deploys. */
export function resetGroupSteering(group, maxBudget = DEFAULT_LOCAL_PATH.steeringBudgetMax) {
  if (!group) return;
  group.steeringBudgetMax = maxBudget;
  group.steeringUsed = 0;
}

export { isUnitInsideSector };

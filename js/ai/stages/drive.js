/**
 * Vehicle drive stages — hull follows velocity-aware spline (Pure Pursuit).
 * Driver unit is key + Action emitter only; desire is MOVE(dx,dy) → Hybrid.
 */

import { ActionType, makeAimAction, makeMoveAction } from '../../player/actions.js';
import {
  getPreferredStandoffPx,
  getWeaponMaxRangePx,
} from '../../config.js';
import { getAiFireDecisionRangePx } from '../../view/dayCycle.js';
import { findVehicleById } from '../../sim/vehicle.js';
import { followDriveSpline } from '../../sim/vehicleDrive.js';
import { ensureBlackboard, StageId } from '../blackboard.js';

function vehicleOf(ctx) {
  const unit = ctx.unit;
  if (!unit || unit.vehicleId == null || !ctx.match) return null;
  return findVehicleById(ctx.match, unit.vehicleId);
}

function driveWeapon(ctx, vehicle) {
  const id =
    (vehicle && vehicle.weaponId) ||
    (ctx.unit && ctx.unit.weaponId) ||
    null;
  return id && ctx.getWeaponDef ? ctx.getWeaponDef(id) : null;
}

function writeGoal(unit, x, y, radius) {
  const bb = ensureBlackboard(unit);
  if (!bb) return;
  bb.pathGoalX = x;
  bb.pathGoalY = y;
  unit.pathGoalX = x;
  unit.pathGoalY = y;
  if (radius != null) bb.pathGoalRadius = radius;
  if (bb.navigation) {
    bb.navigation.pathGoalX = x;
    bb.navigation.pathGoalY = y;
    if (radius != null) bb.navigation.pathGoalRadius = radius;
  }
}

function pushSplineDrive(actions, ctx, vehicle, goalX, goalY, goalR) {
  const unit = ctx.unit;
  writeGoal(unit, goalX, goalY, goalR);
  const follow = followDriveSpline(
    vehicle,
    unit,
    ctx.dt || 1 / 60,
    ctx.match
  );
  if (follow && follow.ok) {
    const act = makeMoveAction(unit.id, follow.dx, follow.dy);
    act.curvature = follow.curvature || 0;
    if (follow.reverse) act.reverse = true;
    if (follow.pivot) act.pivot = true;
    if (follow.desireDist != null) act.desireDist = follow.desireDist;
    if (follow.speedCap != null) act.speedCap = follow.speedCap;
    actions.push(act);
  }
}

function pushAimAt(actions, unitId, fromX, fromY, toX, toY) {
  actions.push(makeAimAction(unitId, Math.atan2(toY - fromY, toX - fromX)));
}

/** Drive to pathGoal / combat point along spline — no foot strafe. */
function runDriveApproach(ctx) {
  const { unit, pathGoal, combatTarget } = ctx;
  const actions = [];
  const vehicle = vehicleOf(ctx);
  if (!vehicle) return actions;
  const x = vehicle.x;
  const y = vehicle.y;

  const chase =
    unit.aggroChase &&
    combatTarget &&
    (combatTarget.kind === 'unit' || combatTarget.kind === 'block');
  const tx = chase ? combatTarget.x : pathGoal.x;
  const ty = chase ? combatTarget.y : pathGoal.y;
  const dist = Math.hypot(tx - x, ty - y);
  const arriveR =
    pathGoal.radius != null
      ? pathGoal.radius
      : ctx.blackboard && ctx.blackboard.pathGoalRadius != null
        ? ctx.blackboard.pathGoalRadius
        : 64;

  if (chase || dist > arriveR) {
    pushSplineDrive(actions, ctx, vehicle, tx, ty, arriveR);
  }
  pushAimAt(actions, unit.id, x, y, tx, ty);
  maybeFireDrive(ctx, actions, vehicle, combatTarget);
  return actions;
}

/** Combat: radial close/back via spline goal offset. */
function runDriveEngage(ctx) {
  const { unit, combatTarget, pathGoal, match } = ctx;
  const actions = [];
  const vehicle = vehicleOf(ctx);
  if (!vehicle) return actions;
  const x = vehicle.x;
  const y = vehicle.y;

  const hasCombat = !!(
    combatTarget &&
    (combatTarget.kind === 'unit' ||
      combatTarget.kind === 'block' ||
      combatTarget.kind === 'base')
  );

  if (!hasCombat) {
    pushSplineDrive(actions, ctx, vehicle, pathGoal.x, pathGoal.y, pathGoal.radius);
    pushAimAt(actions, unit.id, x, y, pathGoal.x, pathGoal.y);
    return actions;
  }

  const tx = combatTarget.x;
  const ty = combatTarget.y;
  const targetDist = combatTarget.dist || Math.hypot(tx - x, ty - y);
  const weapon = driveWeapon(ctx, vehicle);
  const weaponRange = getWeaponMaxRangePx(weapon);
  const aiFireRange = getAiFireDecisionRangePx(weapon, match, unit);
  const flags = unit.behaviorFlags || {};
  const prefKey = flags.preferredRange || 'MEDIUM';
  let pref = getPreferredStandoffPx(weapon, prefKey, aiFireRange);
  if (pref <= 0) pref = Math.max(100, (aiFireRange || weaponRange) * 0.7);

  const fx = (tx - x) / (targetDist || 1);
  const fy = (ty - y) / (targetDist || 1);
  let goalX = tx;
  let goalY = ty;
  if (targetDist > pref * 1.15) {
    goalX = x + fx * Math.min(targetDist - pref, 220);
    goalY = y + fy * Math.min(targetDist - pref, 220);
  } else if (targetDist < pref * 0.85) {
    goalX = x - fx * 160;
    goalY = y - fy * 160;
  } else {
    goalX = x;
    goalY = y;
  }
  if (Math.hypot(goalX - x, goalY - y) > 24) {
    pushSplineDrive(actions, ctx, vehicle, goalX, goalY, 48);
  }
  pushAimAt(actions, unit.id, x, y, tx, ty);
  maybeFireDrive(ctx, actions, vehicle, combatTarget);
  return actions;
}

function runDriveRetreat(ctx) {
  const { unit, combatTarget, pathGoal } = ctx;
  const actions = [];
  const vehicle = vehicleOf(ctx);
  if (!vehicle) return actions;
  const x = vehicle.x;
  const y = vehicle.y;
  let tx = pathGoal.x;
  let ty = pathGoal.y;
  if (combatTarget && (combatTarget.kind === 'unit' || combatTarget.kind === 'block')) {
    tx = x - (combatTarget.x - x);
    ty = y - (combatTarget.y - y);
  }
  pushSplineDrive(actions, ctx, vehicle, tx, ty, pathGoal.radius);
  pushAimAt(
    actions,
    unit.id,
    x,
    y,
    combatTarget ? combatTarget.x : tx,
    combatTarget ? combatTarget.y : ty
  );
  return actions;
}

function maybeFireDrive(ctx, actions, vehicle, combatTarget) {
  const { unit, match } = ctx;
  if (!combatTarget) return;
  if (
    combatTarget.kind !== 'unit' &&
    combatTarget.kind !== 'block' &&
    combatTarget.kind !== 'base'
  ) {
    return;
  }
  const weapon = driveWeapon(ctx, vehicle);
  if (!weapon && !(vehicle && vehicle.weaponId)) return;
  const aiFireRange = getAiFireDecisionRangePx(weapon, match, unit);
  const dist =
    combatTarget.dist ||
    Math.hypot(
      combatTarget.x - (vehicle ? vehicle.x : unit.x),
      combatTarget.y - (vehicle ? vehicle.y : unit.y)
    );
  if (aiFireRange <= 0 || dist > aiFireRange) return;
  actions.push({ type: ActionType.FIRE, unitId: unit.id });
}

/**
 * @param {object} ctx stage context from mediator
 * @param {string} stageId StageId
 */
export function runDrive(ctx, stageId) {
  if (stageId === StageId.ENGAGE) return runDriveEngage(ctx);
  if (stageId === StageId.RETREAT) return runDriveRetreat(ctx);
  if (stageId === StageId.PLACE) {
    return runDriveApproach(ctx);
  }
  return runDriveApproach(ctx);
}

/**
 * Vehicle hull pathing — velocity-aware Bezier + Pure Pursuit + Hybrid steer
 * + Collision Recovery (whiskers, REVERSING / PIVOT_ALIGN).
 * Driver unit emits MOVE only; this module owns hull math (Unified Input).
 * Params: GAME_PACK.vehicleDrive (presentation.json).
 */

import { GAME_PACK } from '../defs/gamePack.js';
import { L3_SIZE } from '../config.js';
import { ensureBlackboard } from '../ai/blackboard.js';
import {
  blockWalkSolid,
  getCellOwner,
  worldToL3,
} from '../world/occupancy.js';

export const RecoveryState = Object.freeze({
  NONE: 'NONE',
  REVERSING: 'REVERSING',
  PIVOT_ALIGN: 'PIVOT_ALIGN',
});

function driveCfg() {
  const d = (GAME_PACK && GAME_PACK.vehicleDrive) || {};
  return {
    momentumFactor: d.momentumFactor != null ? d.momentumFactor : 0.28,
    minTurnSpeed: d.minTurnSpeed != null ? d.minTurnSpeed : 14,
    pivotThresholdRad: d.pivotThresholdRad != null ? d.pivotThresholdRad : 0.4,
    pivotTurnSpeed: d.pivotTurnSpeed != null ? d.pivotTurnSpeed : 2.8,
    mobilityPivotMul: d.mobilityPivotMul != null ? d.mobilityPivotMul : 0.35,
    maxSteerAngle: d.maxSteerAngle != null ? d.maxSteerAngle : 0.55,
    wheelBase: d.wheelBase != null ? d.wheelBase : 52,
    cornerBrakeFactor: d.cornerBrakeFactor != null ? d.cornerBrakeFactor : 0.7,
    lookaheadBase: d.lookaheadBase != null ? d.lookaheadBase : 72,
    lookaheadSpeedK: d.lookaheadSpeedK != null ? d.lookaheadSpeedK : 0.28,
    splineSamples: d.splineSamples != null ? d.splineSamples | 0 : 18,
    goalRebuildDist: d.goalRebuildDist != null ? d.goalRebuildDist : 96,
    maxDeviationDistance:
      d.maxDeviationDistance != null ? d.maxDeviationDistance : 88,
    stuckSpeedEps: d.stuckSpeedEps != null ? d.stuckSpeedEps : 4,
    stuckDistEps: d.stuckDistEps != null ? d.stuckDistEps : 6,
    stuckSec: d.stuckSec != null ? d.stuckSec : 1.2,
    reverseSec: d.reverseSec != null ? d.reverseSec : 0.5,
    minSafeFront: d.minSafeFront != null ? d.minSafeFront : 48,
    pivotSafeDist: d.pivotSafeDist != null ? d.pivotSafeDist : 56,
    minStopDist: d.minStopDist != null ? d.minStopDist : 28,
    safeCheckDist: d.safeCheckDist != null ? d.safeCheckDist : 120,
    reverseThreshold: d.reverseThreshold != null ? d.reverseThreshold : 110,
    reverseAngleRad: d.reverseAngleRad != null ? d.reverseAngleRad : 2.356,
    reverseSpeed: d.reverseSpeed != null ? d.reverseSpeed : 55,
    fireToleranceRad: d.fireToleranceRad != null ? d.fireToleranceRad : 0.2,
    allyBrakeDist: d.allyBrakeDist != null ? d.allyBrakeDist : 96,
    collisionWindowSec: d.collisionWindowSec != null ? d.collisionWindowSec : 3,
    collisionEscalation: d.collisionEscalation != null ? d.collisionEscalation : 3,
    biasAngleRad: d.biasAngleRad != null ? d.biasAngleRad : 0.9,
    rightHandBias: d.rightHandBias != null ? d.rightHandBias : 12,
  };
}

function normalizeAngle(a) {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function approachScalar(cur, target, step) {
  if (!(step > 0)) return target;
  if (cur < target) return Math.min(target, cur + step);
  if (cur > target) return Math.max(target, cur - step);
  return target;
}

function cubicBezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

function navOf(unit) {
  const bb = ensureBlackboard(unit);
  return bb && bb.navigation ? { bb, nav: bb.navigation } : null;
}

function ensureRecoveryFields(nav) {
  if (nav.recoveryState == null) nav.recoveryState = RecoveryState.NONE;
  if (nav.recoveryTimer == null) nav.recoveryTimer = 0;
  if (nav.collisionCount == null) nav.collisionCount = 0;
  if (nav.collisionWindowT == null) nav.collisionWindowT = 0;
}

/**
 * Build cubic Bezier samples. preferSide: -1 left / +1 right bias on P1.
 */
export function buildVelocityAwareSpline(p0, v0x, v0y, goalX, goalY, cfg, preferSide) {
  const c = cfg || driveCfg();
  const n = Math.max(8, c.splineSamples | 0);
  const spd = Math.hypot(v0x, v0y);
  const toGoalX = goalX - p0.x;
  const toGoalY = goalY - p0.y;
  const dist = Math.hypot(toGoalX, toGoalY) || 1;
  const p3 = { x: goalX, y: goalY };
  let p1;
  if (spd > c.minTurnSpeed) {
    p1 = {
      x: p0.x + v0x * c.momentumFactor,
      y: p0.y + v0y * c.momentumFactor,
    };
  } else {
    const pull = Math.min(dist * 0.35, 120);
    p1 = {
      x: p0.x + (toGoalX / dist) * pull,
      y: p0.y + (toGoalY / dist) * pull,
    };
  }
  if (preferSide) {
    const heading = Math.atan2(v0y || toGoalY, v0x || toGoalX);
    const side = preferSide > 0 ? 1 : -1;
    const bias = c.biasAngleRad * side;
    const pull = Math.min(dist * 0.4, 140);
    p1 = {
      x: p0.x + Math.cos(heading + bias) * pull,
      y: p0.y + Math.sin(heading + bias) * pull,
    };
  }
  const p2 = {
    x: goalX - (toGoalX / dist) * Math.min(dist * 0.35, 140),
    y: goalY - (toGoalY / dist) * Math.min(dist * 0.35, 140),
  };
  const points = new Array(n + 1);
  const curvature = new Array(n + 1);
  for (let i = 0; i <= n; i++) {
    points[i] = cubicBezier(p0, p1, p2, p3, i / n);
  }
  for (let i = 0; i <= n; i++) {
    if (i === 0 || i === n) {
      curvature[i] = 0;
      continue;
    }
    const ax = points[i].x - points[i - 1].x;
    const ay = points[i].y - points[i - 1].y;
    const bx = points[i + 1].x - points[i].x;
    const by = points[i + 1].y - points[i].y;
    const aLen = Math.hypot(ax, ay) || 1;
    const bLen = Math.hypot(bx, by) || 1;
    const dot = clamp((ax * bx + ay * by) / (aLen * bLen), -1, 1);
    curvature[i] = Math.acos(dot) / Math.PI;
  }
  return { points, curvature, cursor: 0, goalX, goalY };
}

function nearestSplineIndex(points, x, y) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < points.length; i++) {
    const d = Math.hypot(points[i].x - x, points[i].y - y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return { index: best, dist: bestD };
}

function lookaheadIndex(points, fromIndex, lookDist) {
  let traveled = 0;
  let i = fromIndex;
  while (i < points.length - 1 && traveled < lookDist) {
    traveled += Math.hypot(
      points[i + 1].x - points[i].x,
      points[i + 1].y - points[i].y
    );
    i += 1;
  }
  return i;
}

/** Ray vs solid L3 / blocks — returns free distance along heading. */
function raycastStatic(match, x0, y0, ang, maxDist) {
  if (!match || !match.occupancy) return maxDist;
  const steps = Math.max(6, Math.ceil(maxDist / (L3_SIZE * 0.35)));
  const occ = match.occupancy;
  const getter = (id) =>
    (match.blockById && match.blockById[id]) ||
    (match.blocks && match.blocks.find((b) => b && b.id === id)) ||
    null;
  for (let s = 1; s <= steps; s++) {
    const t = (s / steps) * maxDist;
    const x = x0 + Math.cos(ang) * t;
    const y = y0 + Math.sin(ang) * t;
    const { gx, gy } = worldToL3(x, y);
    const owner = getCellOwner(occ, gx, gy);
    if (owner < 0) continue;
    const block = getter(owner);
    if (block && !blockWalkSolid(block)) continue;
    if (!block && owner < 0) continue;
    return t;
  }
  return maxDist;
}

/** Front ally vehicle distance along heading (convoy). */
function raycastAllyVehicle(match, vehicle, ang, maxDist) {
  const list = match && match.vehicles;
  if (!list) return maxDist;
  let best = maxDist;
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  for (let i = 0; i < list.length; i++) {
    const o = list[i];
    if (!o || !o.active || o === vehicle) continue;
    if (vehicle.team != null && o.team !== vehicle.team) continue;
    const dx = o.x - vehicle.x;
    const dy = o.y - vehicle.y;
    const along = dx * cos + dy * sin;
    if (along < 8 || along > maxDist) continue;
    const lat = Math.abs(-dx * sin + dy * cos);
    if (lat > 56) continue;
    if (along < best) best = along;
  }
  return best;
}

/**
 * 8-direction whiskers relative to hull heading.
 * Call only in recovery / abnormal speed (LOD).
 */
export function checkVehicleClearance(match, vehicle) {
  const c = driveCfg();
  const heading =
    vehicle.facingRad != null ? vehicle.facingRad : Math.PI / 2;
  const dirs = [0, 30, -30, 90, -90, 150, -150, 180];
  const clearance = Object.create(null);
  const maxD = c.safeCheckDist;
  for (let i = 0; i < dirs.length; i++) {
    const deg = dirs[i];
    const rad = heading + (deg * Math.PI) / 180;
    const staticD = raycastStatic(match, vehicle.x, vehicle.y, rad, maxD);
    clearance[deg] = staticD;
  }
  const frontAlly = raycastAllyVehicle(
    match,
    vehicle,
    heading,
    c.allyBrakeDist
  );
  return {
    frontMin: Math.min(clearance[0], clearance[30], clearance[-30]),
    rearMin: Math.min(clearance[180], clearance[150], clearance[-150]),
    leftSpace: clearance[-90] + clearance[-30],
    rightSpace: clearance[90] + clearance[30] + c.rightHandBias,
    frontAlly,
    raw: clearance,
  };
}

/** Prefer side: -1 left / +1 right (right-hand when nearly tied). */
function preferSideFromSpace(space, c) {
  const left = space.leftSpace;
  const right = space.rightSpace;
  if (Math.abs(left - right) < (c.rightHandBias || 12)) return 1;
  return left > right ? -1 : 1;
}

/**
 * Invalidate spline when Mediator changes activeGoal (retreat / heal / …).
 */
export function onDriveGoalChanged(unit, vehicle) {
  const pair = navOf(unit);
  if (!pair) return;
  clearDriveSpline(unit);
  pair.nav.recoveryState = RecoveryState.NONE;
  if (vehicle) {
    // Next follow rebuilds U-turn from current v0 toward new pathGoal.
    pair.nav.forceRebuildSpline = true;
  }
}

export function clearDriveSpline(unit) {
  const pair = navOf(unit);
  if (!pair) return;
  pair.nav.driveSpline = null;
  pair.nav.driveStuckTimer = 0;
}

/**
 * Enter REVERSING after impact; escalate PATH_BLOCKED if thrashing.
 */
export function onVehicleCollisionRepath(vehicle, unit, shoved) {
  if (!vehicle || !unit || !shoved) return;
  vehicle.currentSpeed = 0;
  vehicle.vx = 0;
  vehicle.vy = 0;
  clearDriveSpline(unit);
  const pair = navOf(unit);
  if (!pair) return;
  const { bb, nav } = pair;
  const c = driveCfg();
  ensureRecoveryFields(nav);
  const now = 0; // window tracked by timer decay in follow
  if (nav.collisionWindowT > 0) {
    nav.collisionCount = (nav.collisionCount || 0) + 1;
  } else {
    nav.collisionCount = 1;
  }
  nav.collisionWindowT = c.collisionWindowSec;
  if (nav.collisionCount >= c.collisionEscalation) {
    if (!bb.flags) bb.flags = Object.create(null);
    bb.flags.PATH_BLOCKED = true;
    nav.recoveryState = RecoveryState.NONE;
    nav.collisionCount = 0;
    return;
  }
  nav.recoveryState = RecoveryState.REVERSING;
  nav.recoveryTimer = c.reverseSec;
}

function recomputeSplineWithBias(vehicle, unit, preferSide) {
  const pair = navOf(unit);
  if (!pair) return;
  const { nav } = pair;
  const c = driveCfg();
  const goalX =
    nav.pathGoalX != null
      ? nav.pathGoalX
      : pair.bb.pathGoalX != null
        ? pair.bb.pathGoalX
        : unit.pathGoalX || 0;
  const goalY =
    nav.pathGoalY != null
      ? nav.pathGoalY
      : pair.bb.pathGoalY != null
        ? pair.bb.pathGoalY
        : unit.pathGoalY || 0;
  nav.driveSpline = buildVelocityAwareSpline(
    { x: vehicle.x, y: vehicle.y },
    vehicle.vx || 0,
    vehicle.vy || 0,
    goalX,
    goalY,
    c,
    preferSide
  );
}

/**
 * Recovery sub-states. Returns desire {dx,dy,curvature,reverse,ok} or null to continue normal follow.
 */
function updateVehicleRecovery(match, vehicle, unit, dt) {
  const pair = navOf(unit);
  if (!pair) return null;
  const { bb, nav } = pair;
  ensureRecoveryFields(nav);
  const c = driveCfg();
  if (nav.collisionWindowT > 0) nav.collisionWindowT -= dt;

  if (nav.recoveryState === RecoveryState.NONE) return null;

  // Whiskers only while recovering (LOD).
  const space = checkVehicleClearance(match, vehicle);
  const heading =
    vehicle.facingRad != null ? vehicle.facingRad : Math.PI / 2;

  if (nav.recoveryState === RecoveryState.REVERSING) {
    nav.recoveryTimer -= dt;
    if (
      space.rearMin < c.minStopDist ||
      space.frontMin >= c.pivotSafeDist ||
      nav.recoveryTimer <= 0
    ) {
      vehicle.currentSpeed = 0;
      vehicle.vx = 0;
      vehicle.vy = 0;
      nav.recoveryState = RecoveryState.PIVOT_ALIGN;
      const side = preferSideFromSpace(space, c);
      recomputeSplineWithBias(vehicle, unit, side);
      return { dx: 0, dy: 0, curvature: 0, ok: true, reverse: false, pivot: true };
    }
    // Reverse desire behind hull — applyActions/Hybrid enter reverse gear.
    const steerAway = space.leftSpace > space.rightSpace ? 0.25 : -0.25;
    const ang = heading + Math.PI + steerAway * 0.4;
    return {
      dx: Math.cos(ang),
      dy: Math.sin(ang),
      curvature: 0,
      ok: true,
      reverse: true,
      desireDist: c.reverseThreshold * 0.5,
    };
  }

  if (nav.recoveryState === RecoveryState.PIVOT_ALIGN) {
    const spline = nav.driveSpline;
    if (!spline || !spline.points || !spline.points.length) {
      nav.recoveryState = RecoveryState.NONE;
      return null;
    }
    // Aim at early spline point ahead of hull.
    const target = spline.points[Math.min(3, spline.points.length - 1)];
    const dx = target.x - vehicle.x;
    const dy = target.y - vehicle.y;
    const ang = Math.atan2(dy, dx);
    const diff = Math.abs(
      normalizeAngle(ang - (vehicle.facingRad || 0))
    );
    if (diff <= c.pivotThresholdRad) {
      nav.recoveryState = RecoveryState.NONE;
      return null;
    }
    return {
      dx: dx / (Math.hypot(dx, dy) || 1),
      dy: dy / (Math.hypot(dx, dy) || 1),
      curvature: 0,
      ok: true,
      reverse: false,
      pivot: true,
      desireDist: 999,
    };
  }

  return null;
}

/**
 * Pure Pursuit + recovery + ally front brake signal.
 */
export function followDriveSpline(vehicle, unit, dt, match) {
  const c = driveCfg();
  const pair = navOf(unit);
  if (!pair) return { dx: 0, dy: 0, curvature: 0, ok: false };
  const { bb, nav } = pair;
  ensureRecoveryFields(nav);

  const recovered = updateVehicleRecovery(match, vehicle, unit, dt);
  if (recovered) return recovered;

  const goalX =
    nav.pathGoalX != null
      ? nav.pathGoalX
      : bb.pathGoalX != null
        ? bb.pathGoalX
        : unit.pathGoalX || 0;
  const goalY =
    nav.pathGoalY != null
      ? nav.pathGoalY
      : bb.pathGoalY != null
        ? bb.pathGoalY
        : unit.pathGoalY || 0;
  const spd = Math.abs(vehicle.currentSpeed || 0);
  const vx = vehicle.vx || 0;
  const vy = vehicle.vy || 0;
  let spline = nav.driveSpline;

  // Abnormal speed while throttling → enter recovery (whiskers then).
  if (
    nav.recoveryState === RecoveryState.NONE &&
    spd < c.stuckSpeedEps &&
    (nav.driveThrottleIntent || 0) > 0.15
  ) {
    nav.driveStuckTimer = (nav.driveStuckTimer || 0) + dt;
    if (nav.driveStuckTimer >= c.stuckSec) {
      nav.driveStuckTimer = 0;
      onVehicleCollisionRepath(vehicle, unit, true);
      const again = updateVehicleRecovery(match, vehicle, unit, 0);
      if (again) return again;
    }
  } else if (spd >= c.stuckSpeedEps) {
    nav.driveStuckTimer = 0;
  }

  const needBuild =
    nav.forceRebuildSpline ||
    !spline ||
    !spline.points ||
    !spline.points.length ||
    Math.hypot(goalX - spline.goalX, goalY - spline.goalY) > c.goalRebuildDist;

  if (needBuild) {
    nav.forceRebuildSpline = false;
    spline = buildVelocityAwareSpline(
      { x: vehicle.x, y: vehicle.y },
      vx,
      vy,
      goalX,
      goalY,
      c,
      0
    );
    nav.driveSpline = spline;
  }

  const near = nearestSplineIndex(spline.points, vehicle.x, vehicle.y);
  if (near.dist > c.maxDeviationDistance) {
    spline = buildVelocityAwareSpline(
      { x: vehicle.x, y: vehicle.y },
      vx,
      vy,
      goalX,
      goalY,
      c,
      0
    );
    nav.driveSpline = spline;
  } else {
    spline.cursor = Math.max(spline.cursor | 0, near.index);
  }

  nav.driveLastX = vehicle.x;
  nav.driveLastY = vehicle.y;

  const look = c.lookaheadBase + spd * c.lookaheadSpeedK;
  const li = lookaheadIndex(spline.points, spline.cursor | 0, look);
  spline.cursor = Math.min(li, spline.points.length - 1);
  let tx = spline.points[li].x;
  let ty = spline.points[li].y;
  const curv = spline.curvature[li] || 0;

  const ls = nav.localSteering;
  if (ls && ls.lateralOffset) {
    tx += ls.lateralOffset.x || 0;
    ty += ls.lateralOffset.y || 0;
  } else if (ls && ls.virtualWaypoint) {
    tx = ls.virtualWaypoint.x;
    ty = ls.virtualWaypoint.y;
  }

  let dx = tx - vehicle.x;
  let dy = ty - vehicle.y;
  const desireDist = Math.hypot(dx, dy) || 1;
  dx /= desireDist;
  dy /= desireDist;

  // Cheap front ally check while cruising (1 ray, not 8 whiskers).
  const heading =
    vehicle.facingRad != null ? vehicle.facingRad : Math.PI / 2;
  const allyDist = match
    ? raycastAllyVehicle(match, vehicle, heading, c.allyBrakeDist)
    : c.allyBrakeDist;
  let speedCap = null;
  if (allyDist < c.allyBrakeDist) {
    // Match approx ally approach — signal via curvature-like brake factor.
    speedCap = Math.max(0.15, allyDist / c.allyBrakeDist);
  }

  return {
    dx,
    dy,
    curvature: curv,
    ok: true,
    desireDist,
    speedCap,
    reverse: false,
  };
}

/**
 * Hybrid: Pivot / Reverse gear / Bicycle.
 * Reverse when desire is behind hull and close (or recovery reverse flag).
 * Immobilized (mobility kill): speed 0 but slow pivot still allowed.
 */
export function applyVehicleHybridMovement(vehicle, dx, dy, curvature, dt, opts) {
  if (!vehicle || vehicle.state === 'Broken') return;
  const c = driveCfg();
  const step = dt > 0 ? dt : 1 / 60;
  const o = opts || {};
  const mag = Math.hypot(dx, dy);

  const heading =
    vehicle.facingRad != null ? vehicle.facingRad : Math.PI / 2;
  let angleDiff = 0;
  if (mag > 0) {
    angleDiff = normalizeAngle(Math.atan2(dy, dx) - heading);
  }
  const absDiff = Math.abs(angleDiff);
  const desireDist = o.desireDist != null ? o.desireDist : 999;
  const forceReverse = !!o.reverse;
  const forcePivot = !!o.pivot;
  const behind =
    absDiff >= (c.reverseAngleRad != null ? c.reverseAngleRad : 2.356);
  const useReverse =
    forceReverse ||
    (behind && desireDist < c.reverseThreshold && !forcePivot);

  // Mobility kill: no translation, slow pivot OK (Idea gap #2).
  if (vehicle.immobilized) {
    vehicle.currentSpeed = 0;
    vehicle.vx = 0;
    vehicle.vy = 0;
    if (mag > 0 && absDiff > c.pivotThresholdRad) {
      const turnDir = Math.sign(angleDiff) || 1;
      const turnStep = c.pivotTurnSpeed * c.mobilityPivotMul * step;
      if (absDiff < turnStep) vehicle.facingRad = heading + angleDiff;
      else vehicle.facingRad = heading + turnDir * turnStep;
    }
    return;
  }

  if (!(mag > 0)) {
    vehicle.currentSpeed = approachScalar(
      vehicle.currentSpeed || 0,
      0,
      (vehicle.brake > 0 ? vehicle.brake : 280) * step
    );
    vehicle.vx = Math.cos(heading) * vehicle.currentSpeed;
    vehicle.vy = Math.sin(heading) * vehicle.currentSpeed;
    return;
  }

  const spd = vehicle.currentSpeed != null ? vehicle.currentSpeed : 0;
  const isStopped = Math.abs(spd) <= c.minTurnSpeed;

  // Far behind → pivot U-turn instead of reverse gear (Idea gap #3).
  if ((forcePivot || (behind && desireDist >= c.reverseThreshold)) && isStopped) {
    const turnDir = Math.sign(angleDiff) || 1;
    const turnStep = c.pivotTurnSpeed * step;
    if (absDiff < turnStep) vehicle.facingRad = heading + angleDiff;
    else vehicle.facingRad = heading + turnDir * turnStep;
    vehicle.currentSpeed = 0;
    vehicle.vx = 0;
    vehicle.vy = 0;
    return;
  }

  if (isStopped && absDiff > c.pivotThresholdRad && !useReverse) {
    const turnDir = Math.sign(angleDiff) || 1;
    const turnStep = c.pivotTurnSpeed * step;
    if (absDiff < turnStep) vehicle.facingRad = heading + angleDiff;
    else vehicle.facingRad = heading + turnDir * turnStep;
    vehicle.currentSpeed = 0;
    vehicle.vx = 0;
    vehicle.vy = 0;
    return;
  }

  const maxSpd =
    vehicle.speedMax > 0
      ? vehicle.speedMax
      : vehicle.speed > 0
        ? vehicle.speed
        : 220;
  const accel = vehicle.accel > 0 ? vehicle.accel : 160;
  const brake = vehicle.brake > 0 ? vehicle.brake : 280;
  const curv = curvature > 0 ? curvature : 0;
  let maxAllowed = maxSpd * (1 - curv * c.cornerBrakeFactor);
  if (o.speedCap != null) maxAllowed *= clamp(o.speedCap, 0, 1);

  if (useReverse) {
    const targetSpd = -Math.min(c.reverseSpeed, maxSpd * 0.4);
    vehicle.currentSpeed = approachScalar(spd, targetSpd, accel * step);
    const steerAngle = clamp(angleDiff - Math.PI, -c.maxSteerAngle, c.maxSteerAngle);
    // While reversing, small steer away; heading updates opposite to forward bicycle.
    const angularVelocity =
      (vehicle.currentSpeed / (c.wheelBase || 52)) * Math.sin(steerAngle);
    vehicle.facingRad = heading + angularVelocity * step;
    const face = vehicle.facingRad;
    vehicle.vx = Math.cos(face) * vehicle.currentSpeed;
    vehicle.vy = Math.sin(face) * vehicle.currentSpeed;
    return;
  }

  const wantForward = absDiff < Math.PI * 0.6;
  const targetSpd = wantForward ? Math.max(0, maxAllowed) : -maxSpd * 0.35;
  vehicle.currentSpeed = approachScalar(
    spd,
    targetSpd,
    (wantForward ? accel : brake) * step
  );

  const steerAngle = clamp(angleDiff, -c.maxSteerAngle, c.maxSteerAngle);
  const wheelBase = c.wheelBase > 0 ? c.wheelBase : 52;
  const angularVelocity =
    (vehicle.currentSpeed / wheelBase) * Math.sin(steerAngle);
  vehicle.facingRad = heading + angularVelocity * step;
  const face = vehicle.facingRad;
  vehicle.vx = Math.cos(face) * vehicle.currentSpeed;
  vehicle.vy = Math.sin(face) * vehicle.currentSpeed;
}

/** True if turret barrel is close enough to fire. */
export function turretAlignedForFire(vehicle, aimRad) {
  const c = driveCfg();
  if (typeof aimRad !== 'number') return true;
  const barrel =
    typeof vehicle.turretAimRad === 'number'
      ? vehicle.turretAimRad
      : vehicle.facingRad || 0;
  return Math.abs(normalizeAngle(aimRad - barrel)) <= c.fireToleranceRad;
}

export function getFireToleranceRad() {
  return driveCfg().fireToleranceRad;
}

export { driveCfg, normalizeAngle };

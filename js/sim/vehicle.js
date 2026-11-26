/**
 * Vehicle entities — mount/state visual phase.
 * Empty = Nature (no team fire). Driver present → team + turret may arm.
 * Actions still go through Unified Input later; this file owns state + anchors.
 */

import { GAME_PACK } from '../defs/gamePack.js';
import { L3_SIZE } from '../config.js';
import {
  blockWalkSolid,
  getCellOwner,
  worldToL3,
} from '../world/occupancy.js';
import {
  VEHICLE_STATE_GROUPS,
  getVehicleAnchors,
  getVehicleStateArt,
  pickInteractiveArea,
} from '../view/vehicleArt.js';
import {
  applyVehicleHybridMovement,
  onVehicleCollisionRepath,
} from './vehicleDrive.js';
/** Math facing that matches Editor default (nose +Y / down on screen). */
export const VEHICLE_DEFAULT_FACING_RAD = Math.PI / 2;

/**
 * Art authored facing +Y (down). Math facing 0 = +X.
 * Same offset as unitVisual / turret guns — one convention for hull, seat, pivots.
 */
export function vehicleArtFacingOffsetRad() {
  return GAME_PACK && GAME_PACK.unitVisualFacingOffsetRad != null
    ? GAME_PACK.unitVisualFacingOffsetRad
    : -Math.PI / 2;
}

export function vehicleVisualFacingRad(facingRad) {
  const math = facingRad != null ? facingRad : VEHICLE_DEFAULT_FACING_RAD;
  return math + vehicleArtFacingOffsetRad();
}

export const VehicleState = Object.freeze({
  Driven: 'Driven',
  Empty: 'Empty',
  Mobility: 'Mobility',
  Broken: 'Broken',
});

export const VehicleTurretMode = Object.freeze({
  MANUAL: 'MANUAL',
  ASSIST_BOT: 'ASSIST_BOT',
});

/** Faction when no driver — not a combat team. */
export const VEHICLE_NATURE = 'NATURE';

const DEFAULT_VEHICLE_SPEED = 220;
/** Crawl / start of throttle ramp (data-driven). */
const DEFAULT_SPEED_BASE = 40;
const DEFAULT_ACCEL = 160;
const DEFAULT_BRAKE = 280;
/** Hull turn — slower than foot facing so collider nose leads, no snap. */
const DEFAULT_TURN_RATE_RAD = 2.4;
const TWEEN_SEC = 0.35;
const DEFAULT_BROKEN_CLEAR_SEC = 60;
const DEFAULT_MOBILITY_HP_RATIO = 0.45;
const DEFAULT_MOBILITY_REPAIR_CHANCE = 0.55;
const DEFAULT_VEHICLE_WEAPON = 'AK47';
const VEHICLE_HALF_W = 40;
const VEHICLE_HALF_H = 28;
/** Ram only when |currentSpeed| reaches this (pack / vehicle). */
const DEFAULT_RAM_SPEED_MIN = 90;
const DEFAULT_RAM_DAMAGE = 35;
const DEFAULT_RAM_COOLDOWN_SEC = 0.45;

let _nextVehicleId = 1;

export function createVehicle(opts) {
  const o = opts || {};
  const artId = o.artId || 'Vehicle_ArmorCar_1';
  const maxHp = o.maxHp != null ? o.maxHp : 400;
  return {
    id: o.id != null ? o.id : _nextVehicleId++,
    active: true,
    artId: artId,
    /** @type {keyof typeof VehicleState} */
    state: o.state || VehicleState.Empty,
    x: o.x || 0,
    y: o.y || 0,
    facingRad:
      o.facingRad != null ? o.facingRad : VEHICLE_DEFAULT_FACING_RAD,
    /** Max forward speed (legacy `speed`). */
    speed: o.speed != null ? o.speed : DEFAULT_VEHICLE_SPEED,
    speedMax:
      o.speedMax != null
        ? o.speedMax
        : o.speed != null
          ? o.speed
          : DEFAULT_VEHICLE_SPEED,
    speedBase: o.speedBase != null ? o.speedBase : DEFAULT_SPEED_BASE,
    accel: o.accel != null ? o.accel : DEFAULT_ACCEL,
    brake: o.brake != null ? o.brake : DEFAULT_BRAKE,
    /** Signed speed along facing — eases base→max, coasts on release. */
    currentSpeed: o.currentSpeed != null ? o.currentSpeed : 0,
    turnRateRadPerSec:
      o.turnRateRadPerSec != null ? o.turnRateRadPerSec : DEFAULT_TURN_RATE_RAD,
    ramSpeedMin: o.ramSpeedMin != null ? o.ramSpeedMin : DEFAULT_RAM_SPEED_MIN,
    ramDamage: o.ramDamage != null ? o.ramDamage : DEFAULT_RAM_DAMAGE,
    ramCooldownSec:
      o.ramCooldownSec != null ? o.ramCooldownSec : DEFAULT_RAM_COOLDOWN_SEC,
    /** @type {Record<string, number>} targetKey → simTime until next ram hit */
    _ramCooldownUntil: Object.create(null),
    vx: 0,
    vy: 0,
    hp: o.hp != null ? o.hp : maxHp,
    maxHp: maxHp,
    /** null = Nature (empty). Set when a unit drives. */
    team: o.team != null ? o.team : null,
    driverUnitId: o.driverUnitId != null ? o.driverUnitId : null,
    turretUnitId: o.turretUnitId != null ? o.turretUnitId : null,
    /** Player turret mode when human drives: MANUAL | ASSIST_BOT */
    turretMode: o.turretMode || VehicleTurretMode.ASSIST_BOT,
    weaponId: o.weaponId || DEFAULT_VEHICLE_WEAPON,
    detectRadius: o.detectRadius != null ? o.detectRadius : 420,
    fireCooldown: 0,
    turretAimRad:
      o.turretAimRad != null
        ? o.turretAimRad
        : o.facingRad != null
          ? o.facingRad
          : VEHICLE_DEFAULT_FACING_RAD,
    turretTargetAimRad:
      o.turretTargetAimRad != null
        ? o.turretTargetAimRad
        : o.facingRad != null
          ? o.facingRad
          : VEHICLE_DEFAULT_FACING_RAD,
    /** Editor: pierce/explosion still hit driver (0–1 absorb etc.) */
    driverProtection: o.driverProtection || {
      allowPierce: true,
      explosionFactor: 1,
      absorbRatio: 0,
    },
    /** Blocks MOVE until wrench repair succeeds. */
    immobilized: !!o.immobilized,
    /** Art scar — stays after mobility is restored. */
    mobilityScar: !!o.mobilityScar,
    mobilityHpRatio:
      o.mobilityHpRatio != null ? o.mobilityHpRatio : DEFAULT_MOBILITY_HP_RATIO,
    mobilityRepairChance:
      o.mobilityRepairChance != null
        ? o.mobilityRepairChance
        : DEFAULT_MOBILITY_REPAIR_CHANCE,
    brokenClearSec:
      o.brokenClearSec != null ? o.brokenClearSec : DEFAULT_BROKEN_CLEAR_SEC,
    brokenClearAt: o.brokenClearAt != null ? o.brokenClearAt : 0,
    templateId: o.templateId || artId,
    halfW: o.halfW != null ? o.halfW : VEHICLE_HALF_W,
    halfH: o.halfH != null ? o.halfH : VEHICLE_HALF_H,
    armorType: o.armorType || 'DEFAULT',
    resistPercent: o.resistPercent
      ? Object.assign({}, o.resistPercent)
      : { DEFAULT: 0, BULLET: 0, EXPLOSION: 0, LAZER: 0 },
  };
}

export function vehicleVisualState(v) {
  if (!v) return VehicleState.Empty;
  if (v.state === VehicleState.Broken) return VehicleState.Broken;
  // Scar keeps Mobility art even after repair (Plan).
  if (v.mobilityScar || v.immobilized || v.state === VehicleState.Mobility) {
    return VehicleState.Mobility;
  }
  if (v.driverUnitId != null) return VehicleState.Driven;
  return VehicleState.Empty;
}

export function vehicleIsNature(v) {
  return !v || v.driverUnitId == null || v.team == null;
}

export function vehicleTurretArmed(v) {
  return !!(
    v &&
    v.active &&
    v.driverUnitId != null &&
    v.state !== VehicleState.Broken &&
    !v.immobilized
  );
}

export function vehicleAabb(v) {
  const hw = v.halfW || VEHICLE_HALF_W;
  const hh = v.halfH || VEHICLE_HALF_H;
  return { x: v.x - hw, y: v.y - hh, w: hw * 2, h: hh * 2 };
}

/** Deterministic roll from match clock + ids (no floating RNG). */
export function vehicleChanceRoll(match, vehicleId, unitId, salt) {
  const t = match && match.simTime != null ? match.simTime : 0;
  let h =
    ((t * 1000) | 0) ^
    ((vehicleId | 0) * 2654435761) ^
    ((unitId | 0) * 40503) ^
    ((salt | 0) * 97);
  h = (h >>> 0) % 10000;
  return h / 10000;
}

export function toggleVehicleTurretMode(vehicle) {
  if (!vehicle) return VehicleTurretMode.ASSIST_BOT;
  vehicle.turretMode =
    vehicle.turretMode === VehicleTurretMode.MANUAL
      ? VehicleTurretMode.ASSIST_BOT
      : VehicleTurretMode.MANUAL;
  return vehicle.turretMode;
}

export function ensureMatchVehicles(match) {
  if (!match.vehicles) match.vehicles = [];
  return match.vehicles;
}

/** Pull halfW/halfH from Collider_Vehicle when art anchors are ready. */
export function syncVehicleColliderExtents(v) {
  if (!v) return v;
  const anchors = getVehicleAnchors(vehicleVisualState(v));
  const box = anchors && anchors.colliderBox;
  if (box && box.w > 0 && box.h > 0) {
    v.halfW = box.w * 0.5;
    v.halfH = box.h * 0.5;
  } else if (anchors && anchors.sizeSide > 0) {
    const side = anchors.sizeSide * 0.5;
    if (!(v.halfW > 0)) v.halfW = side;
    if (!(v.halfH > 0)) v.halfH = side * 0.7;
  }
  return v;
}

export function spawnVehicle(match, opts) {
  const list = ensureMatchVehicles(match);
  const v = createVehicle(opts);
  syncVehicleColliderExtents(v);
  list.push(v);
  return v;
}

/**
 * World point for seat/turret/area.
 * Anchor SVG coords are absolute in the art group; hull draw pins SizeView
 * center on the entity — same as Editor compose (local − origin).
 */
export function vehicleAnchorWorld(v, local, facingRad) {
  if (!v || !local) return { x: v ? v.x : 0, y: v ? v.y : 0 };
  const state = vehicleVisualState(v);
  const art = getVehicleStateArt(state);
  const origin =
    (art && art.origin) ||
    (art && art.anchors && art.anchors.origin) ||
    null;
  const layout = art && art.layout;
  const ox = origin
    ? origin.x
    : layout
      ? layout.x + layout.w * 0.5
      : 0;
  const oy = origin
    ? origin.y
    : layout
      ? layout.y + layout.h * 0.5
      : 0;
  const lx = (local.x || 0) - ox;
  const ly = (local.y || 0) - oy;
  const ang = vehicleVisualFacingRad(
    facingRad != null ? facingRad : v.facingRad
  );
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return {
    x: v.x + lx * c - ly * s,
    y: v.y + lx * s + ly * c,
  };
}

export function vehicleEnterAnchor(v, facingRad, keyInt) {
  const state = vehicleVisualState(v);
  const anchors = getVehicleAnchors(state);
  if (!anchors) return { x: v.x, y: v.y, kind: 'center' };
  if (anchors.seats && anchors.seats[0]) {
    return Object.assign(vehicleAnchorWorld(v, anchors.seats[0]), {
      kind: 'seat',
    });
  }
  const area = pickInteractiveArea(
    anchors.areas,
    facingRad != null ? facingRad : v.facingRad,
    keyInt != null ? keyInt : v.id
  );
  if (area) {
    return Object.assign(vehicleAnchorWorld(v, area), { kind: 'area' });
  }
  return { x: v.x, y: v.y, kind: 'center' };
}

export function vehicleExitAnchor(v, facingRad, keyInt) {
  const state = vehicleVisualState(v);
  const anchors = getVehicleAnchors(state);
  if (!anchors || !anchors.areas || !anchors.areas.length) {
    return { x: v.x, y: v.y, kind: 'center' };
  }
  const area = pickInteractiveArea(
    anchors.areas,
    facingRad != null ? facingRad : v.facingRad,
    keyInt != null ? keyInt : v.id
  );
  return Object.assign(vehicleAnchorWorld(v, area || anchors.areas[0]), {
    kind: 'area',
  });
}

export function isVehicleTemplateId(id) {
  const s = String(id || '');
  if (!s) return false;
  if (/^Vehicle_/i.test(s)) return true;
  if (/ArmorCar/i.test(s)) return true;
  const keys = Object.keys(VEHICLE_STATE_GROUPS);
  for (let i = 0; i < keys.length; i++) {
    if (VEHICLE_STATE_GROUPS[keys[i]] === s) return true;
  }
  return false;
}

export function normalizeVehicleArtId(templateId) {
  const s = String(templateId || '');
  if (/_Driven$|_Empty$|_Mobility$|_Broken$/.test(s)) {
    return s.replace(/_(Driven|Empty|Mobility|Broken)$/, '');
  }
  if (/ArmorCar/i.test(s) || /^Vehicle_/i.test(s)) return s;
  return 'Vehicle_ArmorCar_1';
}

export function findVehicleById(match, id) {
  const list = match && match.vehicles;
  if (!list || id == null) return null;
  for (let i = 0; i < list.length; i++) {
    if (list[i] && list[i].id === id) return list[i];
  }
  return null;
}

export function unitIsDriving(unit) {
  return !!(unit && unit.vehicleId != null);
}

/** Hands locked: no Weapon / Block / place / harvest while driving. */
export function unitVehicleHandsLocked(unit) {
  return unitIsDriving(unit) && !unit.vehicleTween;
}

function vehicleReachRadius(v) {
  return 72;
}

export function findNearbyVehicle(match, unit, radius) {
  if (!match || !unit) return null;
  const list = match.vehicles;
  if (!list || !list.length) return null;
  const r = radius != null ? radius : 88;
  let best = null;
  let bestD = r;
  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    if (!v || !v.active || v.state === VehicleState.Broken) continue;
    const d = Math.hypot(unit.x - v.x, unit.y - v.y);
    const reach = Math.max(r, vehicleReachRadius(v));
    if (d > reach) continue;
    if (d > bestD && best) continue;
    best = v;
    bestD = d;
  }
  return best;
}

function beginTween(unit, toX, toY, kind) {
  unit.vehicleTween = {
    fromX: unit.x,
    fromY: unit.y,
    toX: toX,
    toY: toY,
    t: 0,
    dur: TWEEN_SEC,
    kind: kind || 'enter',
  };
  unit.vx = 0;
  unit.vy = 0;
}

/**
 * Mount: tween to Pivot_Unit, lock hands, vehicle takes team from unit.
 * Empty Nature until this succeeds.
 */
export function mountVehicle(match, unit, vehicle) {
  if (!match || !unit || !vehicle || !vehicle.active) return false;
  if (unit.vehicleId != null || unit.vehicleTween) return false;
  if (vehicle.driverUnitId != null) return false;
  if (vehicle.state === VehicleState.Broken) return false;

  const seat = vehicleEnterAnchor(vehicle, unit.facingRad || unit.aimRad, unit.id);
  beginTween(unit, seat.x, seat.y, 'enter');
  unit.vehicleId = vehicle.id;
  unit.vehicleMountPending = true;
  // Reserve seat immediately so a second unit cannot race in.
  vehicle.driverUnitId = unit.id;
  vehicle.team = unit.team != null ? unit.team : null;
  if (vehicle.state !== VehicleState.Mobility) {
    vehicle.state = VehicleState.Driven;
  }
  if (match) match.interactPrompt = 'Driving — E to exit';
  return true;
}

/** Finish enter tween: snap to seat, hide body in vehicle. */
function completeMount(unit, vehicle) {
  if (!unit || !vehicle) return;
  unit.vehicleMountPending = false;
  unit.hiddenInVehicle = true;
  const seat = vehicleEnterAnchor(vehicle, vehicle.facingRad, unit.id);
  unit.x = seat.x;
  unit.y = seat.y;
  unit.vx = 0;
  unit.vy = 0;
}

/**
 * Map / editor: seat a unit as driver immediately (Driven), no enter tween.
 * Used when Vehicle.startUnitDriven is set.
 */
export function seatUnitInVehicle(match, unit, vehicle) {
  if (!match || !unit || !vehicle || !vehicle.active) return false;
  if (vehicle.driverUnitId != null && vehicle.driverUnitId !== unit.id) return false;
  if (vehicle.state === VehicleState.Broken) return false;
  unit.vehicleTween = null;
  unit.vehicleMountPending = false;
  unit.vehicleId = vehicle.id;
  vehicle.driverUnitId = unit.id;
  vehicle.team = unit.team != null ? unit.team : null;
  if (vehicle.state !== VehicleState.Mobility) {
    vehicle.state = VehicleState.Driven;
  }
  completeMount(unit, vehicle);
  return true;
}

/**
 * Dismount: tween to Area center (modulo / facing), clear Nature again.
 */
export function dismountVehicle(match, unit) {
  if (!match || !unit || unit.vehicleId == null) return false;
  if (unit.vehicleTween) return false;
  const vehicle = findVehicleById(match, unit.vehicleId);
  if (!vehicle) {
    unit.vehicleId = null;
    unit.hiddenInVehicle = false;
    unit.vehicleMountPending = false;
    return false;
  }
  const exit = vehicleExitAnchor(vehicle, unit.facingRad || vehicle.facingRad, unit.id);
  unit.hiddenInVehicle = false;
  unit.vehicleMountPending = false;
  beginTween(unit, exit.x, exit.y, 'exit');
  vehicle.driverUnitId = null;
  vehicle.team = null; // Nature again
  if (vehicle.state !== VehicleState.Mobility && vehicle.state !== VehicleState.Broken) {
    vehicle.state = VehicleState.Empty;
  }
  // Keep unit.vehicleId until tween ends so MOVE still blocked.
  unit.vehicleDismountPending = true;
  if (match) match.interactPrompt = 'Exited vehicle';
  return true;
}

function completeDismount(unit) {
  if (!unit) return;
  unit.vehicleId = null;
  unit.vehicleDismountPending = false;
  unit.hiddenInVehicle = false;
}

/** E / INTERACT — enter if nearby empty, exit if driving. */
export function tryVehicleInteract(match, unit) {
  if (!unit || !unit.active) return false;
  if (unit.vehicleTween) return true; // busy
  if (unit.vehicleId != null && !unit.vehicleDismountPending) {
    return dismountVehicle(match, unit);
  }
  const near = findNearbyVehicle(match, unit);
  if (!near) return false;
  return mountVehicle(match, unit, near);
}

const REVERSE_SPEED_MUL = 0.45;

function approachScalar(cur, target, step) {
  if (!(step > 0)) return target;
  if (cur < target) return Math.min(target, cur + step);
  if (cur > target) return Math.max(target, cur - step);
  return target;
}

/** Same contract as unit/block turret slew — local to avoid circular import. */
function slewRad(current, target, rateRadPerSec, dt) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const maxStep = Math.max(0, rateRadPerSec) * dt;
  if (Math.abs(diff) <= maxStep) return target;
  return current + Math.sign(diff) * maxStep;
}

function vehicleTurretTurnRate(vehicle) {
  if (vehicle && vehicle.turretTurnRateRadPerSec != null) {
    return Number(vehicle.turretTurnRateRadPerSec) || 0;
  }
  if (GAME_PACK && GAME_PACK.turretTurnRateRadPerSec != null) {
    return GAME_PACK.turretTurnRateRadPerSec;
  }
  if (GAME_PACK && GAME_PACK.aimTurnRateRadPerSec != null) {
    return GAME_PACK.aimTurnRateRadPerSec;
  }
  return 7.5;
}

/** Keep hull AABB inside world bounds (same idea as clampUnitInWorld). */
export function clampVehicleInWorld(vehicle, world) {
  if (!vehicle || !world) return;
  syncVehicleColliderExtents(vehicle);
  const hw = vehicle.halfW || VEHICLE_HALF_W;
  const hh = vehicle.halfH || VEHICLE_HALF_H;
  const minX = hw;
  const maxX = Math.max(hw, (world.worldW || 0) - hw);
  const minY = hh;
  const maxY = Math.max(hh, (world.worldH || 0) - hh);
  if (vehicle.x < minX) vehicle.x = minX;
  if (vehicle.x > maxX) vehicle.x = maxX;
  if (vehicle.y < minY) vehicle.y = minY;
  if (vehicle.y > maxY) vehicle.y = maxY;
}

/** Slew turretAimRad toward turretTargetAimRad (no snap). */
export function updateVehicleTurretAim(vehicle, dt) {
  if (!vehicle) return;
  if (typeof vehicle.turretTargetAimRad !== 'number') return;
  if (typeof vehicle.turretAimRad !== 'number') {
    vehicle.turretAimRad = vehicle.turretTargetAimRad;
    return;
  }
  vehicle.turretAimRad = slewRad(
    vehicle.turretAimRad,
    vehicle.turretTargetAimRad,
    vehicleTurretTurnRate(vehicle),
    dt
  );
}

function vehicleSpeedMaxOf(vehicle) {
  if (vehicle.speedMax > 0) return vehicle.speedMax;
  if (vehicle.speed > 0) return vehicle.speed;
  return DEFAULT_VEHICLE_SPEED;
}

function vehicleSpeedBaseOf(vehicle) {
  const base = vehicle.speedBase != null ? vehicle.speedBase : DEFAULT_SPEED_BASE;
  const max = vehicleSpeedMaxOf(vehicle);
  return Math.max(0, Math.min(base, max));
}

/**
 * Tank controls: throttle along facing (−1 reverse / +1 forward), steer −1..+1.
 * Accel from speedBase→speedMax; release brakes toward 0 (no instant stop).
 */
export function applyVehicleTankControl(vehicle, throttle, steer, dt) {
  if (!vehicle || vehicle.state === VehicleState.Broken) return;
  const step = dt > 0 ? dt : 1 / 60;
  const turnRate =
    vehicle.turnRateRadPerSec != null
      ? vehicle.turnRateRadPerSec
      : DEFAULT_TURN_RATE_RAD;
  // Mobility kill: no throttle translation; slow pivot still allowed (Idea).
  const locked = !!vehicle.immobilized;
  const pivotMul = locked ? 0.35 : 1;
  const st = steer != null ? Number(steer) : 0;
  if (st !== 0) {
    vehicle.facingRad =
      (vehicle.facingRad != null ? vehicle.facingRad : VEHICLE_DEFAULT_FACING_RAD) +
      st * turnRate * pivotMul * step;
  }
  const facing =
    vehicle.facingRad != null ? vehicle.facingRad : VEHICLE_DEFAULT_FACING_RAD;
  const th = locked ? 0 : throttle != null ? Number(throttle) : 0;
  // Immobilized: force coast to 0 speed (pivot-only).
  const maxSpd = vehicleSpeedMaxOf(vehicle);
  const baseSpd = vehicleSpeedBaseOf(vehicle);
  const accel = vehicle.accel > 0 ? vehicle.accel : DEFAULT_ACCEL;
  const brake = vehicle.brake > 0 ? vehicle.brake : DEFAULT_BRAKE;
  let spd = vehicle.currentSpeed != null ? vehicle.currentSpeed : 0;

  if (th > 0) {
    const t = Math.min(1, th);
    const target = baseSpd + (maxSpd - baseSpd) * t;
    if (spd < 0) {
      spd = approachScalar(spd, 0, brake * step);
    } else {
      if (spd > 0 && spd < baseSpd) spd = baseSpd;
      spd = approachScalar(spd, target, accel * step);
    }
  } else if (th < 0) {
    const t = Math.min(1, -th);
    const target = -(baseSpd + (maxSpd * REVERSE_SPEED_MUL - baseSpd) * t);
    if (spd > 0) {
      spd = approachScalar(spd, 0, brake * step);
    } else {
      if (spd < 0 && spd > -baseSpd * REVERSE_SPEED_MUL) {
        spd = -baseSpd * REVERSE_SPEED_MUL;
      }
      spd = approachScalar(spd, target, accel * step);
    }
  } else {
    spd = approachScalar(spd, 0, brake * step);
    if (Math.abs(spd) < 1) spd = 0;
  }

  vehicle.currentSpeed = spd;
  vehicle.vx = Math.cos(facing) * spd;
  vehicle.vy = Math.sin(facing) * spd;
}

/**
 * AI / world-vector desire → Hybrid Pivot / Reverse / Bicycle.
 * Player W/A/S/D still uses applyVehicleTankControl (throttle/steer).
 * @param {number} [curvature]
 * @param {{ reverse?: boolean, pivot?: boolean, desireDist?: number, speedCap?: number }} [opts]
 */
export function applyVehicleMove(vehicle, dx, dy, dt, curvature, opts) {
  if (!vehicle || vehicle.state === VehicleState.Broken) return;
  applyVehicleHybridMovement(vehicle, dx, dy, curvature || 0, dt, opts);
}

/** Circle (unit) vs axis AABB — push unit out. */
function pushUnitFromAabb(unit, box) {
  if (!unit || !box) return;
  const r = unit.radius > 0 ? unit.radius : 12;
  const closestX = Math.max(box.x, Math.min(unit.x, box.x + box.w));
  const closestY = Math.max(box.y, Math.min(unit.y, box.y + box.h));
  let dx = unit.x - closestX;
  let dy = unit.y - closestY;
  const distSq = dx * dx + dy * dy;
  if (distSq >= r * r) return;
  if (distSq < 1e-8) {
    const left = unit.x - box.x;
    const right = box.x + box.w - unit.x;
    const top = unit.y - box.y;
    const bottom = box.y + box.h - unit.y;
    const m = Math.min(left, right, top, bottom);
    if (m === left) unit.x = box.x - r;
    else if (m === right) unit.x = box.x + box.w + r;
    else if (m === top) unit.y = box.y - r;
    else unit.y = box.y + box.h + r;
    return;
  }
  const dist = Math.sqrt(distSq);
  const push = (r - dist) / dist;
  unit.x += dx * push;
  unit.y += dy * push;
}

function unitIgnoresVehicleCollider(unit, vehicle) {
  if (!unit || !vehicle) return true;
  if (unit.vehicleId != null && unit.vehicleId === vehicle.id) return true;
  if (unit.hiddenInVehicle) return true;
  if (vehicle.driverUnitId != null && vehicle.driverUnitId === unit.id) return true;
  return false;
}

/** Foot units cannot walk through Collider_Vehicle AABB. */
export function resolveUnitVsVehicles(unit, match) {
  if (!unit || !unit.active || !match) return;
  const list = match.vehicles;
  if (!list || !list.length) return;
  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    if (!v || !v.active) continue;
    if (unitIgnoresVehicleCollider(unit, v)) continue;
    syncVehicleColliderExtents(v);
    pushUnitFromAabb(unit, vehicleAabb(v));
  }
}

function circleHitsAabb(cx, cy, r, box) {
  const closestX = Math.max(box.x, Math.min(cx, box.x + box.w));
  const closestY = Math.max(box.y, Math.min(cy, box.y + box.h));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < r * r;
}

function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function canRamHit(vehicle, key, simT) {
  if (!vehicle._ramCooldownUntil) vehicle._ramCooldownUntil = Object.create(null);
  const until = vehicle._ramCooldownUntil[key] || 0;
  if (simT < until) return false;
  const cd =
    vehicle.ramCooldownSec > 0 ? vehicle.ramCooldownSec : DEFAULT_RAM_COOLDOWN_SEC;
  vehicle._ramCooldownUntil[key] = simT + cd;
  return true;
}

/**
 * Crash damage vs units / structures when |speed| ≥ ramSpeedMin.
 * Caller supplies damage fns to avoid circular imports.
 */
export function resolveVehicleRams(match, applyDamageToUnit, applyDamageToBlock) {
  const list = match && match.vehicles;
  if (!list || !list.length) return;
  const simT = match.simTime || 0;
  const units = match.pools && match.pools.units;
  const blocks = match.blocks;
  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    if (!v || !v.active || v.state === VehicleState.Broken) continue;
    if (v.driverUnitId == null) continue;
    const spd = Math.abs(v.currentSpeed != null ? v.currentSpeed : 0);
    const minRam =
      v.ramSpeedMin != null ? v.ramSpeedMin : DEFAULT_RAM_SPEED_MIN;
    if (!(spd >= minRam)) continue;
    const dmg = v.ramDamage != null ? v.ramDamage : DEFAULT_RAM_DAMAGE;
    if (!(dmg > 0)) continue;
    syncVehicleColliderExtents(v);
    const box = vehicleAabb(v);
    const srcTeam = v.team;

    if (units && applyDamageToUnit) {
      for (let u = 0; u < units.length; u++) {
        const unit = units[u];
        if (!unit || !unit.active) continue;
        if (unitIgnoresVehicleCollider(unit, v)) continue;
        if (srcTeam != null && unit.team === srcTeam) continue;
        const r = unit.radius > 0 ? unit.radius : 12;
        if (!circleHitsAabb(unit.x, unit.y, r, box)) continue;
        const key = 'u:' + unit.id;
        if (!canRamHit(v, key, simT)) continue;
        applyDamageToUnit(match, unit, dmg, {
          sourceTeam: srcTeam,
          damageKind: 'IMPACT',
          impact: true,
          fromVehicleRam: true,
        });
      }
    }

    if (blocks && applyDamageToBlock) {
      for (let b = 0; b < blocks.length; b++) {
        const block = blocks[b];
        if (!block || !block.alive) continue;
        if (srcTeam != null && block.team === srcTeam) continue;
        const bBox = {
          x: block.x,
          y: block.y,
          w: block.w,
          h: block.h,
        };
        if (!aabbOverlap(box, bBox)) continue;
        const key = 'b:' + block.id;
        if (!canRamHit(v, key, simT)) continue;
        applyDamageToBlock(match, block, dmg, 'DEFAULT', {
          sourceTeam: srcTeam,
          fromVehicleRam: true,
        });
      }
    }
  }
}

/** Separate vehicle AABB out of a solid cell/block AABB (min penetration). */
function pushAabbOutOfAabb(mover, solid) {
  if (!aabbOverlap(mover, solid)) return false;
  const overlapL = mover.x + mover.w - solid.x;
  const overlapR = solid.x + solid.w - mover.x;
  const overlapT = mover.y + mover.h - solid.y;
  const overlapB = solid.y + solid.h - mover.y;
  const minX = Math.min(overlapL, overlapR);
  const minY = Math.min(overlapT, overlapB);
  if (minX < minY) {
    if (overlapL < overlapR) mover.x -= overlapL;
    else mover.x += overlapR;
  } else {
    if (overlapT < overlapB) mover.y -= overlapT;
    else mover.y += overlapB;
  }
  return true;
}

/**
 * Collider_Vehicle vs solid L3 / blocks — hull cannot drive through structures.
 */
export function resolveVehicleVsOccupancy(v, match) {
  if (!v || !match || !match.occupancy) return;
  syncVehicleColliderExtents(v);
  const box = vehicleAabb(v);
  const mover = { x: box.x, y: box.y, w: box.w, h: box.h };
  const ox = mover.x;
  const oy = mover.y;
  const occ = match.occupancy;
  const getter = (id) =>
    (match.blockById && match.blockById[id]) ||
    (match.blocks && match.blocks.find((b) => b && b.id === id)) ||
    null;
  let shoved = false;

  const g0 = worldToL3(mover.x, mover.y);
  const g1 = worldToL3(mover.x + mover.w, mover.y + mover.h);
  for (let gy = g0.gy; gy <= g1.gy; gy++) {
    for (let gx = g0.gx; gx <= g1.gx; gx++) {
      const owner = getCellOwner(occ, gx, gy);
      if (owner < 0) continue;
      const block = getter(owner);
      if (block && !blockWalkSolid(block)) continue;
      if (!block && owner < 0) continue;
      const cell = {
        x: gx * L3_SIZE,
        y: gy * L3_SIZE,
        w: L3_SIZE,
        h: L3_SIZE,
      };
      if (pushAabbOutOfAabb(mover, cell)) shoved = true;
    }
  }

  // Also push vs full block footprints (multi-cell Base).
  const blocks = match.blocks;
  if (blocks) {
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (!blockWalkSolid(b)) continue;
      if (
        pushAabbOutOfAabb(mover, {
          x: b.x,
          y: b.y,
          w: b.w,
          h: b.h,
        })
      ) {
        shoved = true;
      }
    }
  }

  const hw = v.halfW || VEHICLE_HALF_W;
  const hh = v.halfH || VEHICLE_HALF_H;
  v.x = mover.x + hw;
  v.y = mover.y + hh;

  // Impact → cut speed + clear drive spline (driver is key, hull replans).
  if (
    shoved &&
    Math.hypot(mover.x - ox, mover.y - oy) > 0.5 &&
    Math.abs(v.currentSpeed || 0) > 8
  ) {
    const driver =
      match.pools &&
      match.pools.units &&
      v.driverUnitId != null
        ? match.pools.units[v.driverUnitId]
        : null;
    if (driver) onVehicleCollisionRepath(v, driver, true);
    else {
      v.currentSpeed = 0;
      v.vx = 0;
      v.vy = 0;
    }
  }
}

export function integrateVehicles(match, dt) {
  const list = match && match.vehicles;
  if (!list) return;
  const simT = match.simTime || 0;
  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    if (!v || !v.active) continue;
    if (v.fireCooldown > 0) v.fireCooldown -= dt;
    if (v.state === VehicleState.Broken) {
      v.currentSpeed = 0;
      v.vx = 0;
      v.vy = 0;
      if (v.brokenClearAt > 0 && simT >= v.brokenClearAt) {
        v.active = false;
      }
      continue;
    }
    if (v.immobilized) {
      // Control locked — coast with brake, still collide with blocks.
      applyVehicleTankControl(v, 0, 0, dt);
    } else if (!(v.driverUnitId != null)) {
      // Empty hull coasts to a stop (no snap-zero when parked mid-roll).
      applyVehicleTankControl(v, 0, 0, dt);
      if (!(Math.abs(v.currentSpeed) > 0.5)) {
        v.currentSpeed = 0;
        v.vx = 0;
        v.vy = 0;
      }
    }
    if (Math.abs(v.vx) > 0 || Math.abs(v.vy) > 0 || Math.abs(v.currentSpeed) > 0) {
      v.x += (v.vx || 0) * dt;
      v.y += (v.vy || 0) * dt;
    }
    resolveVehicleVsOccupancy(v, match);
    clampVehicleInWorld(v, match.world);
    updateVehicleTurretAim(v, dt);
    // Keep foot units outside collider while hull moves.
    if (match.pools && match.pools.units) {
      const units = match.pools.units;
      for (let u = 0; u < units.length; u++) {
        const unit = units[u];
        if (!unit || !unit.active) continue;
        if (unitIgnoresVehicleCollider(unit, v)) continue;
        syncVehicleColliderExtents(v);
        pushUnitFromAabb(unit, vehicleAabb(v));
      }
    }
  }
}

/** Tick enter/exit tweens; sync driver pose to vehicle while mounted. */
export function tickVehicleOccupants(match, dt) {
  if (!match || !match.pools || !match.pools.units) return;
  const units = match.pools.units;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u || !u.active) continue;
    const tw = u.vehicleTween;
    if (tw) {
      tw.t += dt;
      const k = tw.dur > 0 ? Math.min(1, tw.t / tw.dur) : 1;
      // Smoothstep
      const s = k * k * (3 - 2 * k);
      u.x = tw.fromX + (tw.toX - tw.fromX) * s;
      u.y = tw.fromY + (tw.toY - tw.fromY) * s;
      u.vx = 0;
      u.vy = 0;
      if (k >= 1) {
        const v = findVehicleById(match, u.vehicleId);
        if (tw.kind === 'enter') {
          completeMount(u, v);
        } else {
          completeDismount(u);
        }
        u.vehicleTween = null;
      }
      continue;
    }
    if (u.vehicleId != null && u.hiddenInVehicle) {
      const v = findVehicleById(match, u.vehicleId);
      if (!v || !v.active) {
        completeDismount(u);
        continue;
      }
      const seat = vehicleEnterAnchor(v, v.facingRad, u.id);
      u.x = seat.x;
      u.y = seat.y;
      u.vx = 0;
      u.vy = 0;
      u.facingRad = v.facingRad;
      // MANUAL: target from driver aim; ASSIST: target from assist bot / hull.
      // Actual turret angle slews in updateVehicleTurretAim — no snap here.
      if (v.turretMode === VehicleTurretMode.MANUAL) {
        if (typeof u.targetAimRad === 'number') {
          v.turretTargetAimRad = u.targetAimRad;
        }
      } else if (typeof v.turretTargetAimRad !== 'number') {
        v.turretTargetAimRad = v.facingRad;
      }
      u.aimRad =
        typeof v.turretAimRad === 'number' ? v.turretAimRad : v.facingRad;
    }
  }
}

export function vehicleInteractHint(match, unit) {
  if (!unit) return '';
  if (unit.vehicleTween) return '…';
  if (unit.vehicleId != null && !unit.vehicleDismountPending) {
    const v = findVehicleById(match, unit.vehicleId);
    const mode =
      v && v.turretMode === VehicleTurretMode.MANUAL ? 'Manual' : 'Assist';
    return 'E: Exit · T: Turret ' + mode;
  }
  const near = findNearbyVehicle(match, unit);
  if (near && near.driverUnitId == null) {
    if (near.immobilized) return 'E: Enter (immobilized) · wrench to fix';
    return 'E: Enter vehicle';
  }
  if (near && near.driverUnitId != null) return 'Vehicle occupied';
  return '';
}

function killDriverOnBroken(match, vehicle) {
  if (!match || !vehicle || vehicle.driverUnitId == null) return;
  const units = match.pools && match.pools.units;
  if (!units) return;
  const u = units[vehicle.driverUnitId];
  if (!u || !u.active) {
    vehicle.driverUnitId = null;
    return;
  }
  u.hp = 0;
  u.active = false;
  u.hiddenInVehicle = false;
  u.vehicleId = null;
  u.vehicleTween = null;
  vehicle.driverUnitId = null;
  vehicle.team = null;
  if (u.role === 'player') {
    match.playerDead = true;
  }
}

/** Enter Broken: kill driver, disarm turret, wreck remains until clear timer. */
export function breakVehicle(match, vehicle) {
  if (!vehicle || vehicle.state === VehicleState.Broken) return;
  vehicle.state = VehicleState.Broken;
  vehicle.immobilized = true;
  vehicle.currentSpeed = 0;
  vehicle.vx = 0;
  vehicle.vy = 0;
  vehicle.fireCooldown = 9999;
  killDriverOnBroken(match, vehicle);
  const sec = vehicle.brokenClearSec > 0 ? vehicle.brokenClearSec : DEFAULT_BROKEN_CLEAR_SEC;
  vehicle.brokenClearAt = (match && match.simTime != null ? match.simTime : 0) + sec;
  if (match) match.interactPrompt = 'Vehicle destroyed';
}

export function applyMobilityKill(vehicle) {
  if (!vehicle || vehicle.state === VehicleState.Broken) return;
  vehicle.immobilized = true;
  vehicle.mobilityScar = true;
  vehicle.state = VehicleState.Mobility;
  // Keep currentSpeed / vx,vy — control lock only; brake coasts in tank control.
}

/**
 * Wrench vs immobilized vehicle — chance from pack/vehicle, roll deterministic.
 * Success clears immobilized; scar (art) remains.
 */
export function tryRepairVehicleMobility(match, unit, vehicle) {
  if (!vehicle || !vehicle.immobilized || vehicle.state === VehicleState.Broken) {
    return { ok: false, reason: 'not_immobilized' };
  }
  const chance =
    vehicle.mobilityRepairChance != null
      ? vehicle.mobilityRepairChance
      : DEFAULT_MOBILITY_REPAIR_CHANCE;
  const roll = vehicleChanceRoll(match, vehicle.id, unit ? unit.id : 0, 11);
  if (roll >= chance) {
    if (match && unit && unit.role === 'player') {
      match.interactPrompt = 'Repair failed — try again';
    }
    return { ok: false, reason: 'miss', roll, chance };
  }
  vehicle.immobilized = false;
  vehicle.mobilityScar = true; // art stays Mobility
  vehicle.state =
    vehicle.driverUnitId != null ? VehicleState.Driven : VehicleState.Empty;
  if (match && unit && unit.role === 'player') {
    match.interactPrompt = 'Mobility restored (scar remains)';
  }
  return { ok: true, roll, chance };
}

/**
 * Damage hull; optional bleed to driver via driverProtection.
 * @returns {{ hull: number, toDriver: number, broken: boolean }}
 */
export function applyDamageToVehicle(match, vehicle, damage, ctx) {
  const c = ctx || {};
  if (!vehicle || !vehicle.active || !(damage > 0)) {
    return { hull: 0, toDriver: 0, broken: false };
  }
  if (vehicle.state === VehicleState.Broken) {
    vehicle.hp -= damage;
    if (vehicle.hp <= 0) vehicle.active = false;
    return { hull: damage, toDriver: 0, broken: true };
  }

  const prot = vehicle.driverProtection || {};
  const absorb = Math.max(0, Math.min(1, prot.absorbRatio || 0));
  let incoming = damage;
  const dmgType = c.damageType || c.damageKind || 'DEFAULT';
  const resist =
    vehicle.resistPercent && vehicle.resistPercent[dmgType];
  if (typeof resist === 'number' && resist !== 0) {
    incoming *= Math.max(0, 1 - resist / 100);
  }
  let hull = incoming * (1 - absorb);
  let toDriver = 0;
  if (prot.allowPierce !== false && vehicle.driverUnitId != null) {
    const factor =
      c.damageKind === 'EXPLOSION'
        ? prot.explosionFactor != null
          ? prot.explosionFactor
          : 1
        : 1 - absorb;
    toDriver = damage * Math.max(0, factor) * (c.pierceToDriver != null ? c.pierceToDriver : 0.35);
  }

  vehicle.hp -= hull;
  const ratio = vehicle.maxHp > 0 ? vehicle.hp / vehicle.maxHp : 0;
  const mobRatio =
    vehicle.mobilityHpRatio != null
      ? vehicle.mobilityHpRatio
      : DEFAULT_MOBILITY_HP_RATIO;
  if (!vehicle.immobilized && ratio <= mobRatio && vehicle.hp > 0) {
    applyMobilityKill(vehicle);
  }

  if (toDriver > 0 && match && match.pools && match.pools.units) {
    const driver = match.pools.units[vehicle.driverUnitId];
    if (driver && driver.active) {
      // Lazy import avoided — caller may pass applyDamageToUnit; we set flag for sim.
      vehicle._pendingDriverDamage = (vehicle._pendingDriverDamage || 0) + toDriver;
      vehicle._pendingDriverCtx = c;
    }
  }

  if (vehicle.hp <= 0) {
    breakVehicle(match, vehicle);
    return { hull, toDriver, broken: true };
  }
  return { hull, toDriver, broken: false };
}

export function flushVehicleDriverDamage(match, applyDamageToUnit) {
  const list = match && match.vehicles;
  if (!list || !applyDamageToUnit) return;
  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    if (!v || !(v._pendingDriverDamage > 0)) continue;
    const dmg = v._pendingDriverDamage;
    const ctx = v._pendingDriverCtx || {};
    v._pendingDriverDamage = 0;
    v._pendingDriverCtx = null;
    const driver =
      match.pools && match.pools.units && match.pools.units[v.driverUnitId];
    if (driver && driver.active) {
      applyDamageToUnit(match, driver, dmg, {
        sourceTeam: ctx.sourceTeam,
        damageKind: ctx.damageKind || 'PROJECTILE',
        skipShield: false,
        impact: true,
        fromVehiclePierce: true,
      });
    }
  }
}

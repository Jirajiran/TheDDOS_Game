/**
 * ENGAGE — fight reserved combatTarget: standoff MOVE, AIM, FIRE.
 * Standoff / fire gate = weapon.maxDistancePath * PATH_SIZE (same as sim),
 * optionally scaled by archetype preferredRange mult — never a separate L3 band.
 */

import { ActionType } from '../../actions.js';
import {
  getPreferredStandoffPx,
  getWeaponMaxRangePx,
} from '../../config.js';

export function runEngage(ctx) {
  const { unit, combatTarget, pathGoal, dt, canFireAmmo, getWeaponDef } = ctx;
  const actions = [];

  let tx = pathGoal.x;
  let ty = pathGoal.y;
  let targetDist = Math.hypot(tx - unit.x, ty - unit.y);

  if (combatTarget) {
    tx = combatTarget.x;
    ty = combatTarget.y;
    targetDist = combatTarget.dist;
  }

  const weapon = unit.weaponId ? getWeaponDef(unit.weaponId) : null;
  const fireRange = getWeaponMaxRangePx(weapon);
  const flags = unit.behaviorFlags || {};
  const prefKey = flags.preferredRange || 'MEDIUM';
  let pref = getPreferredStandoffPx(weapon, prefKey);
  if (pref <= 0) pref = Math.max(80, fireRange * 0.75);

  const needsReload =
    !!weapon && !weapon.infiniteAmmo && unit.ammoInMag <= 0 && unit.mags > 0;
  const reloading = unit.reloadTimer > 0;

  unit.aiStrafeTimer -= dt;
  if (unit.aiStrafeTimer <= 0) {
    unit.aiStrafeSign *= -1;
    unit.aiStrafeTimer = 0.7 + (unit.id % 5) * 0.12;
  }

  const len = targetDist || 1;
  const fx = (tx - unit.x) / len;
  const fy = (ty - unit.y) / len;
  const sx = -fy * unit.aiStrafeSign;
  const sy = fx * unit.aiStrafeSign;

  let dx;
  let dy;
  if (unit.weaponId && fireRange > 0) {
    let hold = pref;
    if (reloading || needsReload) hold *= 0.55;
    let toward = 0;
    if (targetDist > hold * 1.12) toward = 0.55;
    else if (targetDist < hold * 0.88) toward = -0.75;
    else toward = 0;
    dx = fx * toward + sx * 0.75;
    dy = fy * toward + sy * 0.75;
  } else {
    const hold = 0.65;
    dx = fx * hold + sx * 0.55;
    dy = fy * hold + sy * 0.55;
  }
  const m = Math.hypot(dx, dy) || 1;
  dx /= m;
  dy /= m;

  actions.push({ type: ActionType.MOVE, unitId: unit.id, dx, dy });
  actions.push({
    type: ActionType.AIM,
    unitId: unit.id,
    aimRad: Math.atan2(ty - unit.y, tx - unit.x),
  });

  if (
    unit.weaponId &&
    fireRange > 0 &&
    targetDist <= fireRange &&
    canFireAmmo(unit, weapon)
  ) {
    actions.push({ type: ActionType.FIRE, unitId: unit.id });
  }

  return actions;
}

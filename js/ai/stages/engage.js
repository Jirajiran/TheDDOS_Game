/**
 * ENGAGE — fight reserved combatTarget: standoff MOVE, AIM, FIRE.
 * Standoff / fire gate = weapon.maxDistancePath * PATH_SIZE (same as sim),
 * optionally scaled by archetype preferredRange mult — never a separate L3 band.
 *
 * FIRE requires a real combatTarget (hostile unit/block). pathGoal alone
 * (Area / idle point) is walk-only — never shoot empty space.
 */

import { ActionType } from '../../player/actions.js';
import {
  getPreferredStandoffPx,
  getWeaponMaxRangePx,
} from '../../config.js';
import { getAiFireDecisionRangePx } from '../../view/dayCycle.js';

export function runEngage(ctx) {
  const {
    unit,
    combatTarget,
    pathGoal,
    dt,
    canFireAmmo,
    getWeaponDef,
    match,
  } = ctx;
  const actions = [];

  const hasCombat = !!(
    combatTarget &&
    (combatTarget.kind === 'unit' ||
      combatTarget.kind === 'block' ||
      combatTarget.kind === 'base')
  );

  // No reserved hostile → walk toward pathGoal only (no FIRE at Area/idle).
  if (!hasCombat) {
    const len =
      Math.hypot(pathGoal.x - unit.x, pathGoal.y - unit.y) || 1;
    const dx = (pathGoal.x - unit.x) / len;
    const dy = (pathGoal.y - unit.y) / len;
    actions.push({ type: ActionType.MOVE, unitId: unit.id, dx, dy });
    actions.push({
      type: ActionType.AIM,
      unitId: unit.id,
      aimRad: Math.atan2(pathGoal.y - unit.y, pathGoal.x - unit.x),
    });
    return actions;
  }

  const tx = combatTarget.x;
  const ty = combatTarget.y;
  const targetDist = combatTarget.dist;

  const weapon = unit.weaponId ? getWeaponDef(unit.weaponId) : null;
  const weaponRange = getWeaponMaxRangePx(weapon);
  const aiFireRange = getAiFireDecisionRangePx(weapon, match, unit);
  const flags = unit.behaviorFlags || {};
  const prefKey = flags.preferredRange || 'MEDIUM';
  let pref = getPreferredStandoffPx(weapon, prefKey, aiFireRange);
  if (pref <= 0) pref = Math.max(80, (aiFireRange || weaponRange) * 0.75);

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
  if (unit.weaponId && weaponRange > 0) {
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
    aiFireRange > 0 &&
    targetDist <= aiFireRange &&
    canFireAmmo(unit, weapon)
  ) {
    actions.push({ type: ActionType.FIRE, unitId: unit.id });
  }

  return actions;
}

/**
 * APPROACH_PATH — walk toward pathGoal (or sticky combat while closing if reserved).
 * Single job: MOVE (+ light AIM). No Goal selection.
 * Fire while approaching uses AI fire-decision range (night mul; bullet range unchanged).
 * When inside pathGoal.radius with no chase → hold (idle), no MOVE jitter.
 */

import { ActionType } from '../../player/actions.js';
import { getAiFireDecisionRangePx } from '../../view/dayCycle.js';

export function runApproach(ctx) {
  const { unit, pathGoal, combatTarget, dt, blackboard: bb } = ctx;
  const actions = [];
  let dx = 0;
  let dy = 0;
  let aimX = pathGoal.x;
  let aimY = pathGoal.y;

  const chaseCombat =
    unit.aggroChase &&
    combatTarget &&
    (combatTarget.kind === 'unit' || combatTarget.kind === 'block');

  if (chaseCombat) {
    aimX = combatTarget.x;
    aimY = combatTarget.y;
    unit.aiStrafeTimer -= dt;
    if (unit.aiStrafeTimer <= 0) {
      unit.aiStrafeSign *= -1;
      unit.aiStrafeTimer = 0.7 + (unit.id % 5) * 0.12;
    }
    const len = combatTarget.dist || 1;
    const fx = (combatTarget.x - unit.x) / len;
    const fy = (combatTarget.y - unit.y) / len;
    const sx = -fy * unit.aiStrafeSign;
    const sy = fx * unit.aiStrafeSign;
    dx = fx * 0.85 + sx * 0.35;
    dy = fy * 0.85 + sy * 0.35;
    const m = Math.hypot(dx, dy) || 1;
    dx /= m;
    dy /= m;
    actions.push({ type: ActionType.MOVE, unitId: unit.id, dx, dy });
  } else {
    const dist = Math.hypot(pathGoal.x - unit.x, pathGoal.y - unit.y);
    const arriveR =
      pathGoal.radius != null
        ? pathGoal.radius
        : bb && bb.pathGoalRadius != null
          ? bb.pathGoalRadius
          : 48;
    if (dist > arriveR) {
      const len = dist || 1;
      dx = (pathGoal.x - unit.x) / len;
      dy = (pathGoal.y - unit.y) / len;
      actions.push({ type: ActionType.MOVE, unitId: unit.id, dx, dy });
    }
    // else: arrived — idle hold (no MOVE)
  }

  actions.push({
    type: ActionType.AIM,
    unitId: unit.id,
    aimRad: Math.atan2(aimY - unit.y, aimX - unit.x),
  });

  // Fire while approaching: path blockers or aggro within weapon range.
  maybeFireWhileApproaching(ctx, actions);

  return actions;
}

function maybeFireWhileApproaching(ctx, actions) {
  const { unit, combatTarget, canFireAmmo, getWeaponDef, match } = ctx;
  if (!unit.weaponId || !combatTarget) return;
  const weapon = getWeaponDef(unit.weaponId);
  const aiFireRange = getAiFireDecisionRangePx(weapon, match, unit);
  if (aiFireRange <= 0) return;
  const targetDist = combatTarget.dist;
  const shootingBlocker =
    combatTarget.kind === 'block' && unit.attackBlockId >= 0;
  const aggroInRange = unit.aggroChase && targetDist <= aiFireRange;
  if (
    (shootingBlocker || aggroInRange) &&
    targetDist <= aiFireRange &&
    canFireAmmo(unit, weapon)
  ) {
    actions.push({ type: ActionType.FIRE, unitId: unit.id });
  }
}

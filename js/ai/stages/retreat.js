/**
 * RETREAT — move away from threat / toward ally centroid. No self-switch to ENGAGE.
 */

import { ActionType } from '../../actions.js';

export function runRetreat(ctx) {
  const { unit, combatTarget, pathGoal, allyX, allyY, allyN } = ctx;
  const actions = [];

  let tx = pathGoal.x;
  let ty = pathGoal.y;
  if (combatTarget) {
    tx = combatTarget.x;
    ty = combatTarget.y;
  }

  let rx = allyX - unit.x;
  let ry = allyY - unit.y;
  if (allyN <= 1) {
    rx = unit.x - tx;
    ry = unit.y - ty;
  }
  const len = Math.hypot(rx, ry) || 1;
  const dx = rx / len;
  const dy = ry / len;

  actions.push({ type: ActionType.MOVE, unitId: unit.id, dx, dy });
  actions.push({
    type: ActionType.AIM,
    unitId: unit.id,
    aimRad: Math.atan2(ty - unit.y, tx - unit.x),
  });

  return actions;
}

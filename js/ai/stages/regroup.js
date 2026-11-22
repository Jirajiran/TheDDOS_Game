/**
 * REGROUP — walk toward ally centroid / reserved rally. Does not chase player.
 */

import { ActionType } from '../../player/actions.js';

export function runRegroup(ctx) {
  const { unit, allyX, allyY, allyN, pathGoal } = ctx;
  const actions = [];

  let tx = pathGoal.x;
  let ty = pathGoal.y;
  if (allyN > 0) {
    tx = allyX;
    ty = allyY;
  }

  const dist = Math.hypot(tx - unit.x, ty - unit.y);
  const arriveR = 64;
  if (dist <= arriveR) {
    // At rally — idle hold.
    actions.push({
      type: ActionType.AIM,
      unitId: unit.id,
      aimRad: unit.aimRad || 0,
    });
    return actions;
  }

  const len = dist || 1;
  const dx = (tx - unit.x) / len;
  const dy = (ty - unit.y) / len;

  actions.push({ type: ActionType.MOVE, unitId: unit.id, dx, dy });
  actions.push({
    type: ActionType.AIM,
    unitId: unit.id,
    aimRad: Math.atan2(dy, dx),
  });

  return actions;
}

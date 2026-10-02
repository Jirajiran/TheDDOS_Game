/**
 * SEEK_POINT — walk to seekX/Y on Blackboard (heal/cover/rally coords only).
 */

import { ActionType } from '../../actions.js';
import { pushAiEvent } from '../blackboard.js';

export function runSeekPoint(ctx) {
  const { unit, blackboard: bb, pathGoal } = ctx;
  const actions = [];

  let tx = bb.seekX;
  let ty = bb.seekY;
  if (bb.seekKind == null) {
    tx = pathGoal.x;
    ty = pathGoal.y;
  }

  const dist = Math.hypot(tx - unit.x, ty - unit.y);
  const arriveR = 48;
  if (dist <= arriveR) {
    pushAiEvent(unit, 'ARRIVED_SEEK_POINT', { seekKind: bb.seekKind });
    bb.seekKind = null;
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

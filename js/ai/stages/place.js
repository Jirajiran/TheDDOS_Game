/**
 * PLACE — single job: read blackboard place/repair coords+ids → Unified Input.
 * Does not know Engineer archetype story; only typeIds / L3 cells / block ids.
 */

import {
  makeAimAction,
  makeHarvestAction,
  makeMoveAction,
  makePlaceAction,
  makeSelectHotbarAction,
} from '../../actions.js';
import { L3_SIZE, getItemDef } from '../../config.js';
import { clearPlaceIntent, clearRepairIntent } from '../blackboard.js';

const ARRIVE_PLACE = L3_SIZE * 1.35;
const TOO_CLOSE = L3_SIZE * 0.55;
const ARRIVE_REPAIR = 72;

export function runPlace(ctx) {
  const { unit, blackboard: bb, pathGoal, match } = ctx;
  const actions = [];
  const inv = unit.inventory;

  if (bb.repairTargetId != null && bb.repairTargetId >= 0) {
    return runRepair(ctx, actions, inv);
  }

  const typeId = bb.placeBlockTypeId;
  const gx = bb.placeGx;
  const gy = bb.placeGy;
  if (!typeId || gx == null || gy == null || gx < 0 || gy < 0) {
    return fallbackPathMove(unit, pathGoal, actions);
  }

  if (!inv) {
    clearPlaceIntent(bb);
    return fallbackPathMove(unit, pathGoal, actions);
  }

  const slotIdx = findSlotWithItem(inv, typeId);
  if (slotIdx < 0) {
    clearPlaceIntent(bb);
    return fallbackPathMove(unit, pathGoal, actions);
  }

  const active = unit.activeHotbar != null ? unit.activeHotbar : 0;
  if (active !== slotIdx) {
    actions.push(makeSelectHotbarAction(unit.id, slotIdx));
  }

  const tx = gx * L3_SIZE + L3_SIZE * 0.5;
  const ty = gy * L3_SIZE + L3_SIZE * 0.5;
  const dist = Math.hypot(tx - unit.x, ty - unit.y);
  const aimRad = Math.atan2(ty - unit.y, tx - unit.x);

  if (dist > ARRIVE_PLACE) {
    const len = dist || 1;
    actions.push(
      makeMoveAction(unit.id, (tx - unit.x) / len, (ty - unit.y) / len)
    );
    actions.push(makeAimAction(unit.id, aimRad));
    return actions;
  }

  if (dist < TOO_CLOSE) {
    const len = dist || 1;
    actions.push(
      makeMoveAction(unit.id, (unit.x - tx) / len, (unit.y - ty) / len)
    );
    actions.push(makeAimAction(unit.id, aimRad));
    return actions;
  }

  actions.push(makeAimAction(unit.id, aimRad));
  actions.push(makePlaceAction(unit.id, tx, ty));
  return actions;
}

function runRepair(ctx, actions, inv) {
  const { unit, blackboard: bb, pathGoal, match } = ctx;
  const blockId = bb.repairTargetId;
  const block = findAliveBlock(match, blockId);

  if (!block) {
    clearRepairIntent(bb);
    return fallbackPathMove(unit, pathGoal, actions);
  }

  if (!inv) {
    clearRepairIntent(bb);
    return fallbackPathMove(unit, pathGoal, actions);
  }

  const wrenchSlot = findWrenchSlot(inv);
  if (wrenchSlot < 0) {
    clearRepairIntent(bb);
    return fallbackPathMove(unit, pathGoal, actions);
  }

  const active = unit.activeHotbar != null ? unit.activeHotbar : 0;
  if (active !== wrenchSlot) {
    actions.push(makeSelectHotbarAction(unit.id, wrenchSlot));
  }

  const cx = block.x + block.w * 0.5;
  const cy = block.y + block.h * 0.5;
  const dist = Math.hypot(cx - unit.x, cy - unit.y);
  const aimRad = Math.atan2(cy - unit.y, cx - unit.x);

  if (dist > ARRIVE_REPAIR) {
    const len = dist || 1;
    actions.push(
      makeMoveAction(unit.id, (cx - unit.x) / len, (cy - unit.y) / len)
    );
    actions.push(makeAimAction(unit.id, aimRad));
    return actions;
  }

  if (block.hp >= block.maxHp) {
    clearRepairIntent(bb);
    return fallbackPathMove(unit, pathGoal, actions);
  }

  actions.push(makeAimAction(unit.id, aimRad));
  // Existing schema: tool swing = HARVEST (wrench repairs in tryHarvest).
  actions.push(makeHarvestAction(unit.id, cx, cy));
  return actions;
}

function findAliveBlock(match, blockId) {
  if (!match || !match.blocks || blockId == null || blockId < 0) return null;
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (b && b.alive && b.id === blockId) return b;
  }
  return null;
}

function fallbackPathMove(unit, pathGoal, actions) {
  const tx = pathGoal ? pathGoal.x : unit.x;
  const ty = pathGoal ? pathGoal.y : unit.y;
  const len = Math.hypot(tx - unit.x, ty - unit.y) || 1;
  actions.push(makeMoveAction(unit.id, (tx - unit.x) / len, (ty - unit.y) / len));
  actions.push(makeAimAction(unit.id, Math.atan2(ty - unit.y, tx - unit.x)));
  return actions;
}

function findSlotWithItem(inventory, itemId) {
  if (!inventory || !itemId) return -1;
  for (let i = 0; i < inventory.length; i++) {
    const s = inventory[i];
    if (s && s.itemId === itemId && s.count > 0) return i;
  }
  return -1;
}

function findWrenchSlot(inventory) {
  if (!inventory) return -1;
  for (let i = 0; i < inventory.length; i++) {
    const s = inventory[i];
    if (!s || !s.itemId || !(s.count > 0)) continue;
    const def = getItemDef(s.itemId);
    if (def && def.meleeRole === 'REPAIR_WRENCH') return i;
  }
  return -1;
}

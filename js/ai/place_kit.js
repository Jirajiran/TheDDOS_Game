/**
 * Minimal place/repair kit priming for Phase 2c tests / Combat Engineer flags.
 * Data-driven: stocks inventory + writes blackboard coords/ids only.
 */

import { GAME_PACK } from '../config.js';
import {
  createEmptyInventory,
  makeSlotFromItem,
} from '../inventory.js';
import {
  ensureBlackboard,
  writePlaceIntent,
  writeRepairIntent,
} from './blackboard.js';

/**
 * Ensure unit has a small inventory with a placeable (and optional wrench).
 * Does not bypass tryPlace — only primes stock + blackboard.
 *
 * @param {object} unit
 * @param {{
 *   blockTypeId: string,
 *   gx: number,
 *   gy: number,
 *   count?: number,
 *   withWrench?: boolean,
 * }} opts
 */
export function primeUnitPlaceIntent(unit, opts) {
  if (!unit || !opts || !opts.blockTypeId) return null;
  ensureUnitInventory(unit);
  const slot0 = makeSlotFromItem(opts.blockTypeId, opts.count != null ? opts.count : 1);
  unit.inventory[0] = slot0;
  unit.activeHotbar = 0;
  if (opts.withWrench) {
    unit.inventory[1] = makeSlotFromItem('TOOL_WRENCH', 1);
  }
  unit.hasPlacementSkill = true;
  return writePlaceIntent(unit, {
    blockTypeId: opts.blockTypeId,
    gx: opts.gx,
    gy: opts.gy,
  });
}

/**
 * Prime repair intent + wrench stock (friendly block id on blackboard).
 */
export function primeUnitRepairIntent(unit, blockId, opts = {}) {
  if (!unit || blockId == null || blockId < 0) return null;
  ensureUnitInventory(unit);
  const wrench = makeSlotFromItem('TOOL_WRENCH', 1);
  // Prefer slot 1 so placeables can stay in 0.
  unit.inventory[opts.slot != null ? opts.slot : 1] = wrench;
  unit.activeHotbar = opts.slot != null ? opts.slot : 1;
  unit.hasPlacementSkill = true;
  return writeRepairIntent(unit, blockId);
}

function ensureUnitInventory(unit) {
  const slots = GAME_PACK.hotbarSlots || 6;
  if (!unit.inventory || unit.inventory.length < slots) {
    unit.inventory = createEmptyInventory(slots);
  }
  if (unit.activeHotbar == null) unit.activeHotbar = 0;
  return unit.inventory;
}

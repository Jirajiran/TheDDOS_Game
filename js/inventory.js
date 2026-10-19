import {
  GAME_PACK,
  ItemKind,
  getBackpackBonusSlots,
  getBackpackTier,
  getInventoryCapacity,
  getItemDef,
  getUnitArchetype,
  getWeaponDef,
  isBackpackItemId,
} from './config.js';
import { createAmmoState } from './weapons.js';
import {
  createShieldState,
  seedShieldFromArchetype,
} from './shield.js';

/**
 * Real hotbar / inventory slots (not color stubs).
 * Weapon slots carry ammoInMag / mags / reloadTimer.
 */
export function createEmptyInventory(
  slotCount = GAME_PACK.hotbarBaseSlots || GAME_PACK.hotbarSlots
) {
  const slots = new Array(slotCount);
  for (let i = 0; i < slotCount; i++) {
    slots[i] = emptySlot();
  }
  return slots;
}

export function isBackpackSlot(slot) {
  return slot && slot.kind === ItemKind.BACKPACK && slot.count > 0 && slot.itemId;
}

/**
 * Grow/shrink inventory in place. Overflow slots returned (copies).
 * @returns {ReturnType<typeof emptySlot>[]}
 */
export function resizeInventory(inventory, newSize) {
  if (!inventory || newSize < 1) return [];
  const overflow = [];
  while (inventory.length > newSize) {
    const slot = inventory.pop();
    if (slot && slot.itemId && slot.count > 0) overflow.push(slot);
  }
  while (inventory.length < newSize) {
    inventory.push(emptySlot());
  }
  return overflow;
}

/**
 * Equip backpack itemId onto match (consumes one from inventory if present).
 * Replaces lower/equal tier; rejects worse tier.
 * @returns {{ ok: boolean, reason?: string, overflow?: object[] }}
 */
export function equipBackpack(match, itemId) {
  if (!match || !match.inventory) return { ok: false, reason: 'No inventory' };
  if (!isBackpackItemId(itemId)) return { ok: false, reason: 'Not a backpack' };
  const newTier = getBackpackTier(itemId);
  const curTier = getBackpackTier(match.equippedBackpackId);
  if (curTier && newTier < curTier) {
    return { ok: false, reason: 'Weaker backpack equipped' };
  }
  // Remove one backpack item from bag if present.
  let removed = false;
  for (let i = 0; i < match.inventory.length; i++) {
    const s = match.inventory[i];
    if (s.itemId === itemId && s.count > 0) {
      s.count -= 1;
      if (s.count <= 0) match.inventory[i] = emptySlot();
      removed = true;
      break;
    }
  }
  // Allow equip from world drop without inventory copy.
  const prevId = match.equippedBackpackId;
  match.equippedBackpackId = itemId;
  const cap = getInventoryCapacity(itemId);
  const overflow = resizeInventory(match.inventory, cap);
  match.hotbar = match.inventory;
  return { ok: true, overflow, replacedId: prevId, removed };
}

/**
 * Unequip backpack → shrink to base; overflow returned for world drops.
 * @returns {{ ok: boolean, itemId?: string|null, overflow?: object[] }}
 */
export function unequipBackpack(match) {
  if (!match || !match.equippedBackpackId) {
    return { ok: false, itemId: null, overflow: [] };
  }
  const itemId = match.equippedBackpackId;
  match.equippedBackpackId = null;
  const cap = getInventoryCapacity(null);
  const overflow = resizeInventory(match.inventory, cap);
  match.hotbar = match.inventory;
  return { ok: true, itemId, overflow };
}

export { getBackpackBonusSlots, getBackpackTier, getInventoryCapacity, isBackpackItemId };

export function emptySlot() {
  return {
    itemId: null,
    count: 0,
    kind: ItemKind.EMPTY,
    label: '',
    color: '#2a332c',
    weaponId: null,
    ammoInMag: 0,
    mags: 0,
    reloadTimer: 0,
    toolTier: null,
  };
}

export function makeSlotFromItem(itemId, count = 1) {
  const def = getItemDef(itemId);
  if (!def) return emptySlot();
  const slot = {
    itemId: def.id,
    count,
    kind: def.kind,
    label: def.label || def.id,
    color: def.color || '#888',
    weaponId: def.weaponId || (def.kind === ItemKind.WEAPON ? def.id : null),
    ammoInMag: 0,
    mags: 0,
    reloadTimer: 0,
    toolTier: def.toolTier || null,
  };
  if (slot.kind === ItemKind.WEAPON && slot.weaponId) {
    const ammo = createAmmoState(slot.weaponId);
    slot.ammoInMag = ammo.ammoInMag;
    slot.mags = ammo.mags;
  }
  return slot;
}

/** Apply starting loadout from pack into inventory. */
export function applyStartingLoadout(inventory, loadout = GAME_PACK.startingLoadout) {
  for (let i = 0; i < inventory.length; i++) {
    inventory[i] = emptySlot();
  }
  for (let i = 0; i < loadout.length && i < inventory.length; i++) {
    const entry = loadout[i];
    inventory[i] = makeSlotFromItem(entry.itemId, entry.count);
  }
  return inventory;
}

export function getActiveSlot(inventory, activeIndex) {
  if (!inventory || activeIndex < 0 || activeIndex >= inventory.length) {
    return emptySlot();
  }
  return inventory[activeIndex] || emptySlot();
}

export function isPlaceableSlot(slot) {
  return slot && slot.kind === ItemKind.PLACEABLE && slot.count > 0 && slot.itemId;
}

export function isWeaponSlot(slot) {
  return slot && slot.kind === ItemKind.WEAPON && slot.count > 0;
}

export function isToolSlot(slot) {
  return slot && slot.kind === ItemKind.TOOL && slot.count > 0;
}

export function isArmorSlot(slot) {
  return slot && slot.kind === ItemKind.ARMOR && slot.count > 0;
}

export function isShieldSlot(slot) {
  return slot && slot.kind === ItemKind.SHIELD && slot.count > 0;
}

/**
 * Single active armor slot — equipping a new armor deactivates the previous
 * in the same assignment (never two activeArmorId values).
 */
export function equipArmorOnUnit(unit, itemId) {
  if (!unit) return false;
  if (!itemId) {
    unit.activeArmorId = null;
    return true;
  }
  const def = getItemDef(itemId);
  if (!def || def.kind !== ItemKind.ARMOR) return false;
  unit.activeArmorId = def.id;
  return true;
}

export function getArmorDamageReduction(unit) {
  if (!unit || !unit.activeArmorId) return 0;
  const def = getItemDef(unit.activeArmorId);
  if (!def || typeof def.damageReduction !== 'number') return 0;
  return Math.max(0, Math.min(0.85, def.damageReduction));
}

/**
 * Single active shield slot (separate channel from armor — both can be on).
 * Equip new = deactivate old same frame; enables/refreshes unit.shield from item.
 * Unequip restores archetype hasPassiveShield if present (item OR passive).
 */
export function equipShieldOnUnit(unit, itemId) {
  if (!unit) return false;
  if (!itemId) {
    unit.activeShieldId = null;
    restorePassiveOrClearShield(unit);
    return true;
  }
  const def = getItemDef(itemId);
  if (!def || def.kind !== ItemKind.SHIELD) return false;
  unit.activeShieldId = def.id;
  unit.shield = createShieldState({
    maxHp: def.shieldMaxHp != null ? def.shieldMaxHp : 100,
    radius: def.shieldRadius != null ? def.shieldRadius : undefined,
    offset: def.shieldOffset != null ? def.shieldOffset : undefined,
    pierceCost: def.shieldPierceCost != null ? def.shieldPierceCost : 2,
    absorbRatio: def.shieldAbsorbRatio != null ? def.shieldAbsorbRatio : 1,
    regenPerSec: def.shieldRegenPerSec != null ? def.shieldRegenPerSec : 0,
    enabled: true,
    broken: false,
    source: 'item',
  });
  return true;
}

function restorePassiveOrClearShield(unit) {
  const arch = getUnitArchetype(unit.archetypeId);
  if (arch && arch.hasPassiveShield) {
    seedShieldFromArchetype(unit, arch);
    if (unit.shield) unit.shield.source = 'passive';
    return;
  }
  unit.shield = null;
}

export function consumeSlotItem(inventory, slotIndex, amount = 1) {
  const slot = inventory[slotIndex];
  if (!slot || slot.count <= 0) return false;
  slot.count -= amount;
  if (slot.count <= 0) {
    inventory[slotIndex] = emptySlot();
  }
  return true;
}

export function getWeaponFromSlot(slot) {
  if (!isWeaponSlot(slot)) return null;
  const id = slot.weaponId || slot.itemId;
  return getWeaponDef(id);
}

/** Add stacked item; returns leftover count.
 * Fill order: slot 0→end stack same itemId (if not full), then first empty slots.
 */
export function addItemToInventory(inventory, itemId, count) {
  const def = getItemDef(itemId);
  if (!def || count <= 0) return count;
  const maxStack = def.maxStack || 64;
  let left = count;

  // Stack into existing (scan 0→end)
  for (let i = 0; i < inventory.length && left > 0; i++) {
    const slot = inventory[i];
    if (slot.itemId === itemId && slot.count < maxStack) {
      const space = maxStack - slot.count;
      const take = Math.min(space, left);
      slot.count += take;
      left -= take;
    }
  }
  // Empty slots (scan 0→end)
  for (let i = 0; i < inventory.length && left > 0; i++) {
    if (inventory[i].kind !== ItemKind.EMPTY) continue;
    const take = Math.min(maxStack, left);
    inventory[i] = makeSlotFromItem(itemId, take);
    left -= take;
  }
  return left;
}

export function swapInventorySlots(inventory, a, b) {
  if (!inventory || a === b) return false;
  if (a < 0 || b < 0 || a >= inventory.length || b >= inventory.length) return false;
  const tmp = inventory[a];
  inventory[a] = inventory[b];
  inventory[b] = tmp;
  return true;
}

/** Move stack from → to empty, or swap if destination occupied. */
export function moveOrSwapInventorySlots(inventory, from, to) {
  if (!inventory || from === to) return false;
  if (from < 0 || to < 0 || from >= inventory.length || to >= inventory.length) {
    return false;
  }
  const src = inventory[from];
  const dst = inventory[to];
  if (!src || !src.itemId) return false;
  if (!dst || !dst.itemId || dst.kind === ItemKind.EMPTY) {
    inventory[to] = src;
    inventory[from] = emptySlot();
    return true;
  }
  // Same item + stackable → merge
  if (src.itemId === dst.itemId) {
    const def = getItemDef(src.itemId);
    const maxStack = (def && def.maxStack) || 64;
    if (dst.count < maxStack) {
      const space = maxStack - dst.count;
      const take = Math.min(space, src.count);
      dst.count += take;
      src.count -= take;
      if (src.count <= 0) inventory[from] = emptySlot();
      return true;
    }
  }
  return swapInventorySlots(inventory, from, to);
}

export function findWeaponSlotIndex(inventory, preferIndex) {
  if (preferIndex >= 0 && isWeaponSlot(inventory[preferIndex])) return preferIndex;
  for (let i = 0; i < inventory.length; i++) {
    if (isWeaponSlot(inventory[i])) return i;
  }
  return -1;
}

/** Total count of an itemId across all slots. */
export function countItem(inventory, itemId) {
  if (!inventory || !itemId) return 0;
  let n = 0;
  for (let i = 0; i < inventory.length; i++) {
    const slot = inventory[i];
    if (slot.itemId === itemId) n += slot.count || 0;
  }
  return n;
}

/** cost = { WOOD: 3, IRON: 1, ... } */
export function canAfford(inventory, cost) {
  if (!cost) return true;
  for (const itemId of Object.keys(cost)) {
    if (countItem(inventory, itemId) < cost[itemId]) return false;
  }
  return true;
}

/**
 * Remove cost resources from inventory. Returns false if cannot afford
 * (inventory unchanged on failure).
 */
export function deductCost(inventory, cost) {
  if (!canAfford(inventory, cost)) return false;
  for (const itemId of Object.keys(cost)) {
    let need = cost[itemId];
    for (let i = 0; i < inventory.length && need > 0; i++) {
      const slot = inventory[i];
      if (slot.itemId !== itemId || slot.count <= 0) continue;
      const take = Math.min(slot.count, need);
      slot.count -= take;
      need -= take;
      if (slot.count <= 0) inventory[i] = emptySlot();
    }
  }
  return true;
}

/**
 * Dry-run: would result fit after deducting cost?
 * Simulates deduct then add; does not mutate.
 */
export function canFitCraftResult(inventory, itemId, count) {
  const def = getItemDef(itemId);
  if (!def || count <= 0) return false;
  const maxStack = def.maxStack || 64;
  let left = count;
  // Existing stacks
  for (let i = 0; i < inventory.length && left > 0; i++) {
    const slot = inventory[i];
    if (slot.itemId === itemId && slot.count < maxStack) {
      left -= Math.min(maxStack - slot.count, left);
    }
  }
  // Empty slots
  for (let i = 0; i < inventory.length && left > 0; i++) {
    if (inventory[i].kind !== ItemKind.EMPTY) continue;
    left -= Math.min(maxStack, left);
  }
  return left <= 0;
}

/**
 * Buy/craft one recipe: check afford + bag space, deduct cost, add result.
 * @param {{ freeCraft?: boolean }} [opts] — when freeCraft, skip cost deduct.
 * @returns {{ ok: boolean, reason?: string }}
 */
export function tryCraftBuy(inventory, recipe, opts = {}) {
  if (!recipe || !recipe.itemId) {
    return { ok: false, reason: 'Invalid recipe' };
  }
  const freeCraft = !!opts.freeCraft;
  const resultCount = recipe.resultCount || 1;
  if (!freeCraft && !canAfford(inventory, recipe.cost)) {
    return { ok: false, reason: 'Not enough resources' };
  }
  // Space check: ensure result fits even after cost free-up is optimistic;
  // deduct first only if result would fit in current free space OR after free.
  // Strict: check fit as if cost not yet freed (conservative) — ADR #4.
  if (!canFitCraftResult(inventory, recipe.itemId, resultCount)) {
    return { ok: false, reason: 'Inventory full' };
  }
  if (!freeCraft) {
    if (!deductCost(inventory, recipe.cost)) {
      return { ok: false, reason: 'Not enough resources' };
    }
  }
  const leftover = addItemToInventory(inventory, recipe.itemId, resultCount);
  if (leftover > 0) {
    // Unexpected after canFit — refund cost best-effort (partial result may remain).
    if (!freeCraft) {
      for (const itemId of Object.keys(recipe.cost || {})) {
        addItemToInventory(inventory, itemId, recipe.cost[itemId]);
      }
    }
    return { ok: false, reason: 'Inventory full' };
  }
  return { ok: true };
}

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
} from '../config.js';
import { createAmmoState } from '../combat/weapons.js';
import {
  createShieldState,
  seedShieldFromArchetype,
} from '../combat/shield.js';

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

/** Worn gear from a unit loadout. active applies to armor and shield only. */
export function readLoadoutOrders(loadout, currentSlot = 0) {
  const rows = Array.isArray(loadout) ? loadout : [];
  const seen = Object.create(null);
  let armorId = null;
  let shieldId = null;
  for (let i = 0; i < rows.length; i++) {
    const entry = rows[i];
    if (!entry || !entry.active) continue;
    const def = getItemDef(entry.itemId);
    const kind = def && def.kind;
    if (kind !== ItemKind.ARMOR && kind !== ItemKind.SHIELD) continue;
    if (seen[kind]) {
      console.warn(`[loadout] ignored second active ${kind}: ${entry.itemId}`);
      continue;
    }
    seen[kind] = true;
    if (kind === ItemKind.ARMOR) armorId = def.id;
    else shieldId = def.id;
  }
  const slot = currentSlot | 0;
  let weaponId = null;
  const current = slot >= 0 && slot < rows.length ? rows[slot] : null;
  if (current) {
    const def = getItemDef(current.itemId);
    if (def && def.kind === ItemKind.WEAPON) {
      weaponId = def.weaponId || def.id;
    }
  }
  return { armorId, shieldId, weaponId, currentSlot: slot };
}

/** Apply a unit startingLoadout into inventory slots. */
export function applyStartingLoadout(
  inventory,
  loadout = GAME_PACK.startingLoadout,
  currentSlot = GAME_PACK.currentSlot || 0
) {
  for (let i = 0; i < inventory.length; i++) {
    inventory[i] = emptySlot();
  }
  const rows = Array.isArray(loadout) ? loadout : [];
  for (let i = 0; i < rows.length && i < inventory.length; i++) {
    const entry = rows[i];
    inventory[i] = makeSlotFromItem(entry.itemId, entry.count);
  }
  const orders = readLoadoutOrders(rows, currentSlot);
  let wornArmorSlot = -1;
  let wornShieldSlot = -1;
  for (let i = 0; i < rows.length && i < inventory.length; i++) {
    if (orders.armorId && rows[i].itemId === orders.armorId && wornArmorSlot < 0) {
      wornArmorSlot = i;
    }
    if (orders.shieldId && rows[i].itemId === orders.shieldId && wornShieldSlot < 0) {
      wornShieldSlot = i;
    }
  }
  return {
    wornArmorSlot,
    wornShieldSlot,
    activeHotbar: orders.currentSlot,
    activeWeaponId: orders.weaponId,
  };
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
function shiftWornIndex(idx, from, to, mode) {
  const i = typeof idx === 'number' ? idx : -1;
  if (i < 0) return -1;
  if (mode === 'move') return i === from ? to : i;
  if (i === from) return to;
  if (i === to) return from;
  return i;
}

/** Click the active armor or shield slot. The same slot again takes that piece off. */
export function tryEquipWornFromActive(match, unit) {
  if (!match || !unit) return false;
  const index = match.activeHotbar | 0;
  const slot = getActiveSlot(match.inventory, index);
  if (isArmorSlot(slot)) {
    if (match.wornArmorSlot === index) {
      match.wornArmorSlot = -1;
      return equipArmorOnUnit(unit, null);
    }
    if (!equipArmorOnUnit(unit, slot.itemId)) return false;
    match.wornArmorSlot = index;
    return true;
  }
  if (isShieldSlot(slot)) {
    if (match.wornShieldSlot === index) {
      match.wornShieldSlot = -1;
      return equipShieldOnUnit(unit, null);
    }
    if (!equipShieldOnUnit(unit, slot.itemId)) return false;
    match.wornShieldSlot = index;
    return true;
  }
  return false;
}

/** The worn piece left this slot. The other kind stays. */
export function releaseWornSlot(match, unit, slotIndex) {
  if (!match) return;
  const index = slotIndex | 0;
  if (match.wornArmorSlot === index) {
    match.wornArmorSlot = -1;
    if (unit) equipArmorOnUnit(unit, null);
  }
  if (match.wornShieldSlot === index) {
    match.wornShieldSlot = -1;
    if (unit) equipShieldOnUnit(unit, null);
  }
}

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

/** SHIELD_BASIC breaks out of the hotbar. The slot returns to the empty pool. */
export function ejectBrokenBasicShield(match, unit) {
  if (!unit || unit.activeShieldId !== 'SHIELD_BASIC') return;
  if (!unit.shield || !unit.shield.broken) return;
  if (unit.role === 'player' && match) {
    clearBasicShieldSlots(match.inventory);
    match.wornShieldSlot = -1;
  }
  clearBasicShieldSlots(unit.inventory);
  equipShieldOnUnit(unit, null);
}

function clearBasicShieldSlots(bag) {
  if (!bag) return;
  for (let i = 0; i < bag.length; i++) {
    const slot = bag[i];
    if (slot && slot.itemId === 'SHIELD_BASIC') bag[i] = emptySlot();
  }
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
export function moveOrSwapInventorySlots(inventory, from, to, match) {
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
    if (match) {
      match.wornArmorSlot = shiftWornIndex(match.wornArmorSlot, from, to, 'move');
      match.wornShieldSlot = shiftWornIndex(match.wornShieldSlot, from, to, 'move');
    }
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
      if (src.count <= 0) {
        inventory[from] = emptySlot();
        if (match) {
          match.wornArmorSlot = shiftWornIndex(match.wornArmorSlot, from, to, 'move');
          match.wornShieldSlot = shiftWornIndex(match.wornShieldSlot, from, to, 'move');
        }
      }
      return true;
    }
  }
  const swapped = swapInventorySlots(inventory, from, to);
  if (swapped && match) {
    match.wornArmorSlot = shiftWornIndex(match.wornArmorSlot, from, to, 'swap');
    match.wornShieldSlot = shiftWornIndex(match.wornShieldSlot, from, to, 'swap');
  }
  return swapped;
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
  const expandsBag =
    isBackpackItemId(recipe.itemId) &&
    getBackpackTier(recipe.itemId) > getBackpackTier(opts.equippedBackpackId);
  // A higher backpack is worn immediately, so a full bar does not block it.
  // Tier 3 already worn does not grow the bar and stays on the normal check.
  if (
    !expandsBag &&
    !canFitCraftResult(inventory, recipe.itemId, resultCount)
  ) {
    return { ok: false, reason: 'Inventory full' };
  }
  if (!freeCraft) {
    if (!deductCost(inventory, recipe.cost)) {
      return { ok: false, reason: 'Not enough resources' };
    }
  }
  if (expandsBag) {
    return { ok: true, equipNow: true };
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

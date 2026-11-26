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
import { armorSlotOf } from '../assets/closedCatalog.js';
import { createAmmoState } from '../combat/weapons.js';
import {
  createShieldState,
  seedShieldFromArchetype,
  shieldPersistsWhenBroken,
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

/** Resolve item id after Editor Title_Case remap (Lazer → LAZER). */
export function resolveItemId(itemId) {
  if (!itemId) return '';
  const raw = String(itemId);
  if (getItemDef(raw)) return raw;
  const upper = raw.toUpperCase();
  if (upper !== raw && getItemDef(upper)) return upper;
  return raw;
}

export function makeSlotFromItem(itemId, count = 1) {
  const def = getItemDef(resolveItemId(itemId));
  if (!def) return emptySlot();
  // Runtime wear kinds only — map overlay already normalized Helmet→ARMOR etc.
  let kind = def.kind;
  if (kind === 'Helmet' || kind === 'Vest') kind = ItemKind.ARMOR;
  if (kind === 'Shield' || kind === 'Shield Energy') kind = ItemKind.SHIELD;
  const slot = {
    itemId: def.id || resolveItemId(itemId),
    count,
    kind,
    label: def.label || def.id,
    color: def.color || '#888',
    weaponId: def.weaponId || (kind === ItemKind.WEAPON ? def.id : null),
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

/** Worn gear from a unit loadout. active applies to armor (TOP+VEST) and shield. */
export function readLoadoutOrders(loadout, currentSlot = 0) {
  const rows = Array.isArray(loadout) ? loadout : [];
  const seenArmor = Object.create(null);
  let armorTopId = null;
  let armorVestId = null;
  let armorId = null; // legacy = vest channel
  let shieldId = null;
  let seenShield = false;
  for (let i = 0; i < rows.length; i++) {
    const entry = rows[i];
    // Wear On only — inactive rows still fill inventory via applyStartingLoadout.
    if (!entry || entry.active !== true) continue;
    const def = getItemDef(resolveItemId(entry.itemId));
    if (!def) continue;
    const kind = def.kind;
    const itemKind = def.itemKind;
    const isShield =
      kind === ItemKind.SHIELD ||
      kind === 'Shield' ||
      itemKind === 'Shield' ||
      itemKind === 'Shield Energy';
    if (isShield) {
      if (seenShield) {
        console.warn(`[loadout] ignored second active SHIELD: ${entry.itemId}`);
        continue;
      }
      seenShield = true;
      shieldId = def.id;
      continue;
    }
    const isArmor =
      kind === ItemKind.ARMOR ||
      kind === 'Helmet' ||
      kind === 'Vest' ||
      itemKind === 'Helmet' ||
      itemKind === 'Vest';
    if (!isArmor) continue;
    const channel = armorSlotOf(def);
    if (seenArmor[channel]) {
      console.warn(`[loadout] ignored second active ARMOR ${channel}: ${entry.itemId}`);
      continue;
    }
    seenArmor[channel] = true;
    if (channel === 'TOP') armorTopId = def.id;
    else {
      armorVestId = def.id;
      armorId = def.id;
    }
  }
  const slot = currentSlot | 0;
  let weaponId = null;
  const current = slot >= 0 && slot < rows.length ? rows[slot] : null;
  if (current) {
    const def = getItemDef(resolveItemId(current.itemId));
    if (def && def.kind === ItemKind.WEAPON) {
      weaponId = def.weaponId || def.id;
    }
  }
  return {
    armorId,
    armorTopId,
    armorVestId,
    shieldId,
    weaponId,
    currentSlot: slot,
  };
}

/** Apply a unit startingLoadout into inventory slots. */
export function applyStartingLoadout(
  inventory,
  loadout = GAME_PACK.startingLoadout,
  currentSlot = GAME_PACK.currentSlot || 0
) {
  const rows = Array.isArray(loadout) ? loadout : [];
  // Grow bag so Helmet/Vest/Shield rows past hotbarBase are not dropped.
  while (inventory.length < rows.length) {
    inventory.push(emptySlot());
  }
  for (let i = 0; i < inventory.length; i++) {
    inventory[i] = emptySlot();
  }
  for (let i = 0; i < rows.length && i < inventory.length; i++) {
    const entry = rows[i];
    inventory[i] = makeSlotFromItem(
      entry && entry.itemId,
      entry && entry.count != null ? entry.count : 1
    );
  }
  const orders = readLoadoutOrders(rows, currentSlot);
  let wornArmorTopSlot = -1;
  let wornArmorVestSlot = -1;
  let wornShieldSlot = -1;
  // Match against resolved inventory ids (same as readLoadoutOrders / equip).
  // Raw row.itemId can differ in case from def.id and miss worn*Slot → no wear on spawn.
  for (let i = 0; i < inventory.length; i++) {
    const itemId = inventory[i] && inventory[i].itemId;
    if (!itemId) continue;
    if (orders.armorTopId && itemId === orders.armorTopId && wornArmorTopSlot < 0) {
      wornArmorTopSlot = i;
    }
    if (orders.armorVestId && itemId === orders.armorVestId && wornArmorVestSlot < 0) {
      wornArmorVestSlot = i;
    }
    if (orders.shieldId && itemId === orders.shieldId && wornShieldSlot < 0) {
      wornShieldSlot = i;
    }
  }
  return {
    wornArmorTopSlot,
    wornArmorVestSlot,
    /** @deprecated use wornArmorVestSlot — kept for HUD/memento */
    wornArmorSlot: wornArmorVestSlot,
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
 * TOP and VEST armor channels are independent — both may be worn.
 * Equipping a new piece replaces only the same channel.
 */
function shiftWornIndex(idx, from, to, mode) {
  const i = typeof idx === 'number' ? idx : -1;
  if (i < 0) return -1;
  if (mode === 'move') return i === from ? to : i;
  if (i === from) return to;
  if (i === to) return from;
  return i;
}

function syncLegacyWornArmor(match) {
  if (!match) return;
  match.wornArmorSlot =
    match.wornArmorVestSlot != null ? match.wornArmorVestSlot : -1;
}

function wornKeyForArmorChannel(channel) {
  return channel === 'TOP' ? 'wornArmorTopSlot' : 'wornArmorVestSlot';
}

/** Click the active armor or shield slot. The same slot again takes that piece off. */
export function tryEquipWornFromActive(match, unit) {
  if (!match || !unit) return false;
  const index = match.activeHotbar | 0;
  const slot = getActiveSlot(match.inventory, index);
  if (isArmorSlot(slot)) {
    const def = getItemDef(slot.itemId);
    const channel = armorSlotOf(def);
    const key = wornKeyForArmorChannel(channel);
    if (match[key] == null) match[key] = -1;
    if (match[key] === index) {
      match[key] = -1;
      syncLegacyWornArmor(match);
      return unequipArmorChannel(unit, channel);
    }
    if (!equipArmorOnUnit(unit, slot.itemId)) return false;
    match[key] = index;
    syncLegacyWornArmor(match);
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
  if (match.wornArmorTopSlot === index) {
    match.wornArmorTopSlot = -1;
    if (unit) unequipArmorChannel(unit, 'TOP');
  }
  if (match.wornArmorVestSlot === index || match.wornArmorSlot === index) {
    match.wornArmorVestSlot = -1;
    if (unit) unequipArmorChannel(unit, 'VEST');
  }
  syncLegacyWornArmor(match);
  if (match.wornShieldSlot === index) {
    match.wornShieldSlot = -1;
    if (unit) equipShieldOnUnit(unit, null);
  }
}

export function unequipArmorChannel(unit, channel) {
  if (!unit) return false;
  if (channel === 'TOP') {
    unit.activeArmorTopId = null;
    return true;
  }
  unit.activeArmorVestId = null;
  unit.activeArmorId = null; // legacy alias = vest
  return true;
}

/** Equip armor into TOP or VEST channel from item.armorSlot (default VEST). */
export function equipArmorOnUnit(unit, itemId) {
  if (!unit) return false;
  if (!itemId) {
    unit.activeArmorTopId = null;
    unit.activeArmorVestId = null;
    unit.activeArmorId = null;
    return true;
  }
  const def = getItemDef(itemId);
  if (!def) return false;
  const kind = def.kind;
  const itemKind = def.itemKind;
  const isArmor =
    kind === ItemKind.ARMOR ||
    kind === 'Helmet' ||
    kind === 'Vest' ||
    itemKind === 'Helmet' ||
    itemKind === 'Vest';
  if (!isArmor) return false;
  if (armorSlotOf(def) === 'TOP') {
    unit.activeArmorTopId = def.id;
  } else {
    unit.activeArmorVestId = def.id;
    unit.activeArmorId = def.id;
  }
  return true;
}

export function getArmorDamageReduction(unit) {
  if (!unit) return 0;
  let sum = 0;
  const top = unit.activeArmorTopId ? getItemDef(unit.activeArmorTopId) : null;
  const vest =
    unit.activeArmorVestId || unit.activeArmorId
      ? getItemDef(unit.activeArmorVestId || unit.activeArmorId)
      : null;
  if (top && typeof top.damageReduction === 'number') sum += top.damageReduction;
  if (vest && typeof vest.damageReduction === 'number') sum += vest.damageReduction;
  return Math.max(0, Math.min(0.85, sum));
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
  if (!def) return false;
  const kind = def.kind;
  const itemKind = def.itemKind;
  const isShield =
    kind === ItemKind.SHIELD ||
    kind === 'Shield' ||
    itemKind === 'Shield' ||
    itemKind === 'Shield Energy';
  if (!isShield) return false;
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

/**
 * When a wear shield breaks: Energy/regen stays equipped (tickShields revives);
 * consumable BASIC-style shields leave inventory + clear worn slot.
 */
export function ejectBrokenWearShield(match, unit) {
  if (!unit || !unit.shield || !unit.shield.broken) return;
  if (unit.shield.source !== 'item') return;
  const id = unit.activeShieldId;
  if (!id) return;
  const def = getItemDef(id);
  if (shieldPersistsWhenBroken(def)) return;
  if (unit.role === 'player' && match) {
    clearShieldItemSlots(match.inventory, id);
    if (
      match.wornShieldSlot >= 0 &&
      match.inventory &&
      match.inventory[match.wornShieldSlot] &&
      match.inventory[match.wornShieldSlot].itemId === id
    ) {
      match.wornShieldSlot = -1;
    }
  }
  clearShieldItemSlots(unit.inventory, id);
  equipShieldOnUnit(unit, null);
}

/** @deprecated use ejectBrokenWearShield */
export const ejectBrokenBasicShield = ejectBrokenWearShield;

function clearShieldItemSlots(bag, itemId) {
  if (!bag || !itemId) return;
  for (let i = 0; i < bag.length; i++) {
    const slot = bag[i];
    if (slot && slot.itemId === itemId) bag[i] = emptySlot();
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
      match.wornArmorTopSlot = shiftWornIndex(match.wornArmorTopSlot, from, to, 'move');
      match.wornArmorVestSlot = shiftWornIndex(match.wornArmorVestSlot, from, to, 'move');
      match.wornShieldSlot = shiftWornIndex(match.wornShieldSlot, from, to, 'move');
      syncLegacyWornArmor(match);
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
          match.wornArmorTopSlot = shiftWornIndex(match.wornArmorTopSlot, from, to, 'move');
          match.wornArmorVestSlot = shiftWornIndex(match.wornArmorVestSlot, from, to, 'move');
          match.wornShieldSlot = shiftWornIndex(match.wornShieldSlot, from, to, 'move');
          syncLegacyWornArmor(match);
        }
      }
      return true;
    }
  }
  const swapped = swapInventorySlots(inventory, from, to);
  if (swapped && match) {
    match.wornArmorTopSlot = shiftWornIndex(match.wornArmorTopSlot, from, to, 'swap');
    match.wornArmorVestSlot = shiftWornIndex(match.wornArmorVestSlot, from, to, 'swap');
    match.wornShieldSlot = shiftWornIndex(match.wornShieldSlot, from, to, 'swap');
    syncLegacyWornArmor(match);
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

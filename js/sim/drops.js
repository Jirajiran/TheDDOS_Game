import { playSfx } from '../audio/sfx.js';
import {
  GAME_PACK,
  L3_SIZE,
  getBackpackTier,
  isBackpackItemId,
} from '../config.js';
import {
  addItemToInventory,
  emptySlot,
  equipBackpack,
  unequipBackpack,
  isBackpackSlot,
} from '../player/inventory.js';
import {
  resolveUnitVsOccupancy,
} from '../world/occupancy.js';
import {
  acquireDrop,
} from '../world/pools.js';
import {
  aabbRayExitDist,
  getBlock,
} from './block.js';
import {
  getPlayerUnit,
} from './unit.js';
export function ejectDropTowardPlayer(match, fromX, fromY, itemId, count, boxHalf = null) {
  if (!match || !itemId || !(count > 0)) return false;
  const player = getPlayerUnit(match);
  const pack = GAME_PACK;
  const speed = pack.dropThrowSpeed || 220;
  const margin =
    pack.dropEjectMargin != null ? pack.dropEjectMargin : Math.round(L3_SIZE * 0.4);
  let cos = 1;
  let sin = 0;
  if (player) {
    const dx = player.x - fromX;
    const dy = player.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    cos = dx / len;
    sin = dy / len;
  }
  let off;
  if (boxHalf && boxHalf.hw > 0 && boxHalf.hh > 0) {
    off = aabbRayExitDist(boxHalf.hw, boxHalf.hh, cos, sin) + margin;
  } else {
    off = (player ? player.radius : 0) + (pack.dropThrowOffset || 28);
  }
  const x = fromX + cos * off;
  const y = fromY + sin * off;
  spawnDrop(match, x, y, itemId, count, cos * speed, sin * speed);
  return true;
}

/**
 * Take Gen stock → world drop toward player (not inventory).
 * @returns {{ taken: number, itemId: string|null, reason?: string, mode?: string }}
 */

export function spawnDrop(match, x, y, itemId, count, vx = 0, vy = 0) {
  const drop = acquireDrop(match.pools);
  if (!drop) {
    addItemToInventory(match.inventory, itemId, count);
    return;
  }
  const pack = GAME_PACK;
  drop.active = true;
  drop.x = x;
  drop.y = y;
  drop.vx = vx || 0;
  drop.vy = vy || 0;
  drop.radius = pack.dropRadius != null ? pack.dropRadius : Math.round(L3_SIZE * 0.16);
  drop.itemId = itemId;
  drop.itemTypeId = itemId;
  drop.stack = count;
  drop.age = 0;
}

/**
 * Throw entire hotbar slot contents as a world drop (drag-drop outside hotbar).
 * Spawn uses unit facing + velocity — cursor world coords are ignored for position.
 * @returns {{ ok: boolean, reason?: string }}
 */

export function throwHotbarSlot(match, slotIndex, _worldX, _worldY) {
  if (!match || !match.inventory) return { ok: false, reason: 'No inventory' };
  const slot = match.inventory[slotIndex];
  if (!slot || !slot.itemId || slot.count <= 0) {
    return { ok: false, reason: 'Empty slot' };
  }
  const itemId = slot.itemId;
  const count = slot.count;
  const player = getPlayerUnit(match);
  if (!player) return { ok: false, reason: 'No player' };
  const pack = GAME_PACK;
  const ang =
    typeof player.aimRad === 'number'
      ? player.aimRad
      : player.facingRad || 0;
  const off = player.radius + (pack.dropThrowOffset || 28);
  const speed = pack.dropThrowSpeed || 220;
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const x = player.x + cos * off;
  const y = player.y + sin * off;
  spawnDrop(match, x, y, itemId, count, cos * speed, sin * speed);
  match.inventory[slotIndex] = emptySlot();
  match.interactPrompt = `Dropped ${itemId}`;
  return { ok: true };
}

export function dropInteractRange(match, player) {
  const pack = GAME_PACK;
  const magnet =
    pack.dropMagnetRange != null ? pack.dropMagnetRange : Math.round(L3_SIZE * 0.28);
  const dropR = pack.dropRadius != null ? pack.dropRadius : Math.round(L3_SIZE * 0.16);
  return (player.radius || 0) + magnet + dropR + L3_SIZE * 0.15;
}

/** Nearest active backpack drop in interact range, or null. */

export function findNearbyBackpackDrop(match) {
  const player = getPlayerUnit(match);
  if (!player || !match.pools || !match.pools.drops) return null;
  const maxDist = dropInteractRange(match, player);
  let best = null;
  let bestD = maxDist;
  const drops = match.pools.drops;
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    if (!d.active || !isBackpackItemId(d.itemId)) continue;
    const dist = Math.hypot(d.x - player.x, d.y - player.y);
    if (dist <= bestD) {
      bestD = dist;
      best = d;
    }
  }
  return best;
}

/**
 * F near backpack drop → equip (upgrade replaces weaker).
 * Spills overflow as drops.
 */

export function tryEquipBackpackFromDrop(match, drop) {
  if (!match || !drop || !drop.active || !isBackpackItemId(drop.itemId)) {
    return { ok: false, reason: 'No backpack drop' };
  }
  const itemId = drop.itemId;
  const res = equipBackpack(match, itemId);
  if (!res.ok) return res;
  drop.active = false;
  spillOverflowAsDrops(match, res.overflow);
  if (res.replacedId && res.replacedId !== itemId) {
    const player = getPlayerUnit(match);
    if (player) {
      spawnDrop(match, player.x, player.y + 20, res.replacedId, 1, 0, 40);
    }
  }
  match.interactPrompt = `Equipped ${itemId}`;
  return { ok: true };
}

/** Equip backpack from hotbar slot (same rules as drop). */

export function tryEquipBackpackFromSlot(match, slotIndex) {
  if (!match || !match.inventory) return { ok: false, reason: 'No inventory' };
  const slot = match.inventory[slotIndex];
  if (!isBackpackSlot(slot)) return { ok: false, reason: 'Not a backpack' };
  const itemId = slot.itemId;
  const res = equipBackpack(match, itemId);
  if (!res.ok) return res;
  spillOverflowAsDrops(match, res.overflow);
  if (res.replacedId && res.replacedId !== itemId) {
    const player = getPlayerUnit(match);
    if (player) {
      spawnDrop(match, player.x, player.y + 20, res.replacedId, 1, 0, 40);
    }
  }
  match.interactPrompt = `Equipped ${itemId}`;
  return { ok: true };
}

/** Hold-F unequip → drop backpack + overflow. */

export function tryUnequipBackpackToDrop(match) {
  const res = unequipBackpack(match);
  if (!res.ok || !res.itemId) return { ok: false, reason: 'No backpack' };
  const player = getPlayerUnit(match);
  if (player) {
    spawnDrop(match, player.x, player.y + 24, res.itemId, 1, 0, 60);
  }
  spillOverflowAsDrops(match, res.overflow);
  match.interactPrompt = `Unequipped ${res.itemId}`;
  return { ok: true };
}

export function spillOverflowAsDrops(match, overflow) {
  if (!overflow || !overflow.length) return;
  const player = getPlayerUnit(match);
  if (!player) return;
  for (let i = 0; i < overflow.length; i++) {
    const s = overflow[i];
    if (!s || !s.itemId) continue;
    const ang = (i / Math.max(1, overflow.length)) * Math.PI * 2;
    spawnDrop(
      match,
      player.x + Math.cos(ang) * 36,
      player.y + Math.sin(ang) * 36,
      s.itemId,
      s.count || 1,
      Math.cos(ang) * 80,
      Math.sin(ang) * 80
    );
  }
}

export function getEquippedBackpackTier(match) {
  return getBackpackTier(match && match.equippedBackpackId);
}

export function updateDrops(match, dt) {
  const drops = match.pools.drops;
  const pack = GAME_PACK;
  const friction = pack.dropFriction != null ? pack.dropFriction : 6.5;
  const stopSpeed = pack.dropStopSpeed != null ? pack.dropStopSpeed : 8;
  const damp = Math.exp(-friction * dt);
  const getter = (id) => getBlock(match, id);
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    if (!d.active) continue;
    if (d.radius == null || !(d.radius > 0)) {
      d.radius = pack.dropRadius != null ? pack.dropRadius : Math.round(L3_SIZE * 0.16);
    }
    if (d.vx || d.vy) {
      d.x += (d.vx || 0) * dt;
      d.y += (d.vy || 0) * dt;
      d.vx = (d.vx || 0) * damp;
      d.vy = (d.vy || 0) * damp;
      if (Math.hypot(d.vx, d.vy) < stopSpeed) {
        d.vx = 0;
        d.vy = 0;
      }
    }
    // Same solid push as units — eject out of Gen/Base footprint if overlapping.
    if (match.occupancy) {
      resolveUnitVsOccupancy(d, match.occupancy, getter);
    }
    d.age = (d.age || 0) + dt;
    if (d.age >= pack.dropExpireSec) d.active = false;
  }
}

export function pickupDrops(match) {
  const player = getPlayerUnit(match);
  if (!player) return;
  const pack = GAME_PACK;
  const magnet =
    pack.dropMagnetRange != null ? pack.dropMagnetRange : Math.round(L3_SIZE * 0.28);
  const drops = match.pools.drops;
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    if (!d.active) continue;
    const dropR =
      d.radius != null && d.radius > 0
        ? d.radius
        : pack.dropRadius != null
          ? pack.dropRadius
          : Math.round(L3_SIZE * 0.16);
    const reach = player.radius + magnet + dropR;
    if (Math.hypot(d.x - player.x, d.y - player.y) > reach) continue;
    const left = addItemToInventory(match.inventory, d.itemId || d.itemTypeId, d.stack);
    if (left < d.stack) {
      match.stats.resourcesGathered += d.stack - left;
      playSfx('world.pickup');
    }
    if (left <= 0) d.active = false;
    else d.stack = left;
  }
}

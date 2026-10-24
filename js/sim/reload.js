import {
  getWeaponDef,
  ReloadType,
} from '../config.js';
import {
  countItem,
  deductCost,
  getActiveSlot,
  getWeaponFromSlot,
  isWeaponSlot,
} from '../player/inventory.js';
import {
  clearReloadVisual,
} from '../view/unitVisual.js';
import {
  playReloadSfx,
  playSfx,
} from '../audio/sfx.js';
import {
  beginReload,
  tickReload,
} from '../combat/weapons.js';
export function getUnitWeaponAmmo(match, unit) {
  if (unit.role === 'player') {
    const slot = getActiveSlot(match.inventory, match.activeHotbar);
    const weapon = getWeaponFromSlot(slot);
    return { weapon, ammo: slot, fromSlot: true };
  }
  const weapon = unit.weaponId ? getWeaponDef(unit.weaponId) : null;
  return { weapon, ammo: unit, fromSlot: false };
}

export function clearAmmoReload(ammo) {
  if (!ammo) return;
  ammo.reloadTimer = 0;
}

export function tryReload(match, unit) {
  const { weapon, ammo } = getUnitWeaponAmmo(match, unit);
  if (!weapon || !ammo) return;
  const opts = unit.role === 'player' ? playerReloadOpts(match, weapon) : null;
  if (beginReload(ammo, weapon, opts)) playReloadSfx(weapon.id);
}

export function tryCancelReload(match, unit) {
  const { ammo } = getUnitWeaponAmmo(match, unit);
  clearAmmoReload(ammo);
  clearReloadVisual(unit);
}

export function continueShellReload(ammo, weapon, opts) {
  if (!weapon || weapon.reloadType !== ReloadType.INDIVIDUAL_SHELL) return;
  if (!ammo || ammo.ammoInMag >= weapon.magCapacity) return;
  if (beginReload(ammo, weapon, opts)) playReloadSfx(weapon.id);
}

/** Deterministic pellet aim offset in [-spread/2, spread/2]. */

export function updateWeaponReloads(match, dt) {
  const inv = match.inventory;
  for (let i = 0; i < inv.length; i++) {
    const slot = inv[i];
    if (!isWeaponSlot(slot)) continue;
    const def = getWeaponDef(slot.weaponId || slot.itemId);
    const opts = playerReloadOpts(match, def);
    if (tickReload(slot, def, dt, opts)) {
      continueShellReload(slot, def, playerReloadOpts(match, def));
      if (
        def &&
        def.reloadType === ReloadType.INDIVIDUAL_SHELL &&
        slot.reloadTimer <= 0
      ) {
        playSfx('reload.SHOTGUN_DONE');
      }
    }
  }
  const units = match.pools.units;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active || u.role !== 'enemy' || !u.weaponId) continue;
    const def = getWeaponDef(u.weaponId);
    if (tickReload(u, def, dt, null)) {
      continueShellReload(u, def, null);
      if (
        def &&
        def.reloadType === ReloadType.INDIVIDUAL_SHELL &&
        u.reloadTimer <= 0
      ) {
        playSfx('reload.SHOTGUN_DONE');
      }
    }
  }
}

/** Player hotbar weapons: sync reload with inventory ammoTypeId stock. */

export function playerReloadOpts(match, weaponDef) {
  if (!match || !match.inventory || !weaponDef || !weaponDef.ammoTypeId) {
    return null;
  }
  const ammoTypeId = weaponDef.ammoTypeId;
  return {
    reserveCount: countItem(match.inventory, ammoTypeId),
    spendReserve: () => {
      if (countItem(match.inventory, ammoTypeId) <= 0) return false;
      deductCost(match.inventory, { [ammoTypeId]: 1 });
      return true;
    },
  };
}

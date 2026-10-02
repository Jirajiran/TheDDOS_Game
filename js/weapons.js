import { ReloadType, getWeaponDef } from './config.js';

/** Attach full mag + reserve mags from weapon def. */
export function initWeaponAmmo(state, weaponId) {
  const def = getWeaponDef(weaponId);
  if (!def) {
    state.ammoInMag = 0;
    state.mags = 0;
    state.reloadTimer = 0;
    state.weaponId = null;
    return state;
  }
  state.weaponId = weaponId;
  state.ammoInMag = def.magCapacity;
  state.mags = def.infiniteAmmo ? 0 : Math.max(0, def.maxMags - 1);
  state.reloadTimer = 0;
  return state;
}

export function createAmmoState(weaponId) {
  return initWeaponAmmo(
    { weaponId: null, ammoInMag: 0, mags: 0, reloadTimer: 0 },
    weaponId
  );
}

/**
 * Mag reload: remaining rounds in mag discarded; 1 reload = 1 mag.
 * Shell reload: +1 shell, spend 1 from reserve.
 * opts.reserveCount — optional inventory stock of ammoTypeId (player).
 * opts.spendReserve — optional () => bool called when finishing reload.
 */
export function beginReload(ammo, weaponDef, opts = null) {
  if (!ammo || !weaponDef) return false;
  if (weaponDef.infiniteAmmo) return false;
  if (ammo.reloadTimer > 0) return false;
  if (ammo.ammoInMag >= weaponDef.magCapacity) return false;

  const reserveCount =
    opts && typeof opts.reserveCount === 'number' ? opts.reserveCount : null;
  if (reserveCount != null) {
    if (ammo.mags <= 0 && reserveCount > 0) ammo.mags = 1;
    if (ammo.mags <= 0 && reserveCount <= 0) return false;
  } else if (ammo.mags <= 0) {
    return false;
  }

  ammo.reloadTimer = weaponDef.reloadSec || 1.4;
  return true;
}

export function tickReload(ammo, weaponDef, dt, opts = null) {
  if (!ammo || ammo.reloadTimer <= 0) return false;
  ammo.reloadTimer -= dt;
  if (ammo.reloadTimer > 0) return false;
  ammo.reloadTimer = 0;
  finishReload(ammo, weaponDef, opts);
  return true;
}

export function finishReload(ammo, weaponDef, opts = null) {
  if (!ammo || !weaponDef || weaponDef.infiniteAmmo) return;
  if (ammo.mags <= 0) return;

  if (opts && typeof opts.spendReserve === 'function') {
    if (!opts.spendReserve()) return;
  }

  if (weaponDef.reloadType === ReloadType.INDIVIDUAL_SHELL) {
    ammo.ammoInMag = Math.min(weaponDef.magCapacity, ammo.ammoInMag + 1);
    ammo.mags -= 1;
  } else {
    ammo.ammoInMag = weaponDef.magCapacity;
    ammo.mags -= 1;
  }

  if (opts && typeof opts.reserveCount === 'number' && opts.reserveCount > 0) {
    const left = opts.reserveCount - 1;
    if (left > 0) {
      ammo.mags = Math.max(ammo.mags, Math.min(weaponDef.maxMags, left));
    }
  }
}

/** Returns rounds consumed (0 if cannot fire). */
export function consumeAmmoForShot(ammo, weaponDef) {
  if (!ammo || !weaponDef) return 0;
  if (weaponDef.infiniteAmmo) return weaponDef.burstCount || 1;
  if (ammo.reloadTimer > 0) return 0;
  const need = weaponDef.burstCount || 1;
  if (ammo.ammoInMag < need) return 0;
  ammo.ammoInMag -= need;
  return need;
}

export function canFireAmmo(ammo, weaponDef) {
  if (!weaponDef) return false;
  if (weaponDef.infiniteAmmo) return true;
  if (!ammo) return false;
  if (ammo.reloadTimer > 0) return false;
  return ammo.ammoInMag >= (weaponDef.burstCount || 1);
}

/**
 * HUD: mag rounds / spare rounds (e.g. M1991 full load → 9/27).
 * reserveOverride = inventory ammoType stock (mag packs) when provided.
 */
export function formatAmmoHud(ammo, weaponDef, reserveOverride = null) {
  if (!weaponDef) return '—';
  if (weaponDef.infiniteAmmo) return '∞';
  if (!ammo) return '0/0';
  const reloading = ammo.reloadTimer > 0 ? ' RLD' : '';
  const magCap = weaponDef.magCapacity || 1;
  const shell = weaponDef.reloadType === ReloadType.INDIVIDUAL_SHELL;
  let spare;
  if (typeof reserveOverride === 'number') {
    spare = shell ? reserveOverride : reserveOverride * magCap;
  } else {
    spare = shell ? ammo.mags : ammo.mags * magCap;
  }
  return `${ammo.ammoInMag}/${spare}${reloading}`;
}

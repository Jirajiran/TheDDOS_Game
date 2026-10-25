/**
 * Central equip cosmetics — held weapon / tool / melee / armor / shield.
 * Canvas Path2D cache (BOOT preload) — show/hide + world pose only; no per-equip alloc.
 * Cosmetics mirror sim state only (active hotbar WEAPON/TOOL / armor / shield / swing).
 */

import { GAME_PACK, L3_SIZE, getItemDef, getWeaponDef } from '../config.js';
import { getActiveSlot, isToolSlot, isWeaponSlot } from '../player/inventory.js';
import {
  getWeaponBtnImage,
  getWeaponBtnLayout,
  getWeaponCoreImage,
  preloadWeaponBtnArt,
} from './weaponBtnArt.js';

/** Same local frame as Unit_Template draw (SizeView is 64 wide). */
const UNIT_LOCAL_W = 64;

/**
 * Visual map only — gameplay ids stay MEDIC_GUN / LAZER / LAZER_HEAL /
 * GRENADE_LAUNCHER / WEAPON_50CAL.
 * pose heavy = Action_hold_Gun_2, Action_Shoting_2, Action_Reload_Mag_2 (once).
 * pose standard = Action_hold_Gun, Action_Shoting, mag loop or shotgun once.
 */
export const WEAPON_BTN_ART = Object.freeze({
  M1991: Object.freeze({
    group: 'Weapon_Colt_1911',
    icon: 'Icon_Colt_1911',
    pose: 'standard',
  }),
  SMG: Object.freeze({
    group: 'Weapon_Skorpion_SMG',
    icon: 'Icon_Skorpion_SMG',
    pose: 'standard',
  }),
  AK47: Object.freeze({
    group: 'Weapon_AK_47',
    icon: 'Icon_AK_47',
    pose: 'standard',
  }),
  SHOTGUN_SHELL: Object.freeze({
    group: 'Weapon_ShotGun_shell',
    icon: 'Icon_ShotGun_Shell',
    pose: 'standard',
  }),
  SHOTGUN_BUCK: Object.freeze({
    group: 'Weapon_ShotGun_Buck',
    icon: 'Icon_ShotGun_Buck',
    pose: 'standard',
  }),
  KAR98: Object.freeze({
    group: 'Weapon_Kar98',
    icon: 'Icon_Kar98',
    pose: 'standard',
  }),
  MEDIC_GUN: Object.freeze({
    group: 'Weapon_Meso_Gun',
    icon: 'Icon_Meso_Gun',
    pose: 'standard',
  }),
  LAZER: Object.freeze({
    group: 'Weapon_Pyrotechnic_Projector',
    icon: 'Icon_Pyrotechnic_Projector',
    pose: 'standard',
    core: 'red',
  }),
  LAZER_HEAL: Object.freeze({
    group: 'Weapon_Pyrotechnic_Collagen',
    icon: 'Icon_Pyrotechnic_Collagen',
    pose: 'standard',
    core: 'green',
  }),
  GRENADE_LAUNCHER: Object.freeze({
    group: 'Weapon_Rpg',
    icon: 'Icon_Rpg',
    pose: 'heavy',
    rpg: true,
  }),
  WEAPON_50CAL: Object.freeze({
    group: 'Weapon_barret_50_cal',
    icon: 'Icon_barret_50_cal',
    pose: 'heavy',
  }),
});

/** Modified guns reuse the base art. No extra SVG ids. */
export const WEAPON_ART_ALIAS = Object.freeze({
  SMG_MODIFIED: 'SMG',
  AK47_MODIFIED: 'AK47',
  SHOTGUN_SHELL_MODIFIED: 'SHOTGUN_SHELL',
  SHOTGUN_BUCK_MODIFIED: 'SHOTGUN_BUCK',
  KAR98_MODIFIED: 'KAR98',
});

export function weaponArtSpec(weaponId) {
  const id = WEAPON_ART_ALIAS[weaponId] || weaponId;
  return WEAPON_BTN_ART[id] || null;
}

/** Action group family for hold / shot / reload playback. */
export const WEAPON_POSE_FAMILY = Object.freeze({
  standard: Object.freeze({
    hold: 'hold_Gun',
    shot: 'Shoting',
    reloadMag: 'Reload_Mag',
    reloadShell: 'Reload_Shotgun',
    reloadOnce: false,
  }),
  heavy: Object.freeze({
    hold: 'hold_Gun_2',
    shot: 'Shoting_2',
    reloadMag: 'Reload_Mag_2',
    reloadShell: 'Reload_Mag_2',
    reloadOnce: true,
  }),
});

export function weaponPoseFamily(weaponId) {
  const art = weaponArtSpec(weaponId);
  if (!art) return null;
  return WEAPON_POSE_FAMILY[art.pose] || WEAPON_POSE_FAMILY.standard;
}

export function weaponCoreKind(weaponId) {
  const art = weaponArtSpec(weaponId);
  return art && art.core ? art.core : null;
}

/** @typedef {'pistol'|'smg'|'rifle'|'shotgun'|'sniper'|'laser'|'launcher'|'default'} WeaponShape */
/** @typedef {'axe'|'pick'|'wrench'|'fist'|'default'} ToolShape */
/** @typedef {'vest'|'plate'|'default'} ArmorShape */
/** @typedef {'disc'|'kite'|'default'} ShieldShape */

/**
 * @type {Readonly<{
 *   weapons: Record<string, { shape: WeaponShape, color: string, length?: number, thickness?: number, svgHref?: string|null, bitmapSrc?: string|null }>,
 *   tools: Record<string, { shape: ToolShape, color: string, length?: number, thickness?: number, svgHref?: string|null, bitmapSrc?: string|null }>,
 *   armor: Record<string, { shape: ArmorShape, color: string, ringPad?: number, svgHref?: string|null, bitmapSrc?: string|null }>,
 *   shields: Record<string, { shape: ShieldShape, color: string, alpha?: number, svgHref?: string|null, bitmapSrc?: string|null }>,
 * }>}
 */
export const UNIT_EQUIP_ART = Object.freeze({
  weapons: Object.freeze({
    M1991: Object.freeze({
      shape: 'pistol',
      color: '#6b9fbf',
      length: 0.85,
      thickness: 3.2,
      svgHref: null,
      bitmapSrc: null,
    }),
    SMG: Object.freeze({
      shape: 'smg',
      color: '#7a9e6b',
      length: 1.05,
      thickness: 3.4,
      svgHref: null,
      bitmapSrc: null,
    }),
    SMG_MODIFIED: Object.freeze({
      shape: 'smg',
      color: '#8ab87a',
      length: 1.1,
      thickness: 3.5,
      svgHref: null,
      bitmapSrc: null,
    }),
    AK47: Object.freeze({
      shape: 'rifle',
      color: '#6b8a4a',
      length: 1.35,
      thickness: 3.6,
      svgHref: null,
      bitmapSrc: null,
    }),
    AK47_MODIFIED: Object.freeze({
      shape: 'rifle',
      color: '#7a9a55',
      length: 1.4,
      thickness: 3.7,
      svgHref: null,
      bitmapSrc: null,
    }),
    SHOTGUN_SHELL: Object.freeze({
      shape: 'shotgun',
      color: '#bf8a5a',
      length: 1.15,
      thickness: 4.5,
      svgHref: null,
      bitmapSrc: null,
    }),
    SHOTGUN_BUCK: Object.freeze({
      shape: 'shotgun',
      color: '#d4a060',
      length: 1.2,
      thickness: 4.8,
      svgHref: null,
      bitmapSrc: null,
    }),
    SHOTGUN_SHELL_MODIFIED: Object.freeze({
      shape: 'shotgun',
      color: '#c99a6a',
      length: 1.2,
      thickness: 4.6,
      svgHref: null,
      bitmapSrc: null,
    }),
    SHOTGUN_BUCK_MODIFIED: Object.freeze({
      shape: 'shotgun',
      color: '#e0b070',
      length: 1.25,
      thickness: 5,
      svgHref: null,
      bitmapSrc: null,
    }),
    KAR98: Object.freeze({
      shape: 'sniper',
      color: '#8a6b4a',
      length: 1.7,
      thickness: 2.8,
      svgHref: null,
      bitmapSrc: null,
    }),
    KAR98_MODIFIED: Object.freeze({
      shape: 'sniper',
      color: '#9a7b55',
      length: 1.75,
      thickness: 2.9,
      svgHref: null,
      bitmapSrc: null,
    }),
    MEDIC_GUN: Object.freeze({
      shape: 'pistol',
      color: '#7ec8a0',
      length: 0.9,
      thickness: 3.2,
      svgHref: null,
      bitmapSrc: null,
    }),
    LAZER_HEAL: Object.freeze({
      shape: 'laser',
      color: '#6dffb0',
      length: 1.25,
      thickness: 2.4,
      svgHref: null,
      bitmapSrc: null,
    }),
    LAZER: Object.freeze({
      shape: 'laser',
      color: '#ff6b9a',
      length: 1.3,
      thickness: 2.5,
      svgHref: null,
      bitmapSrc: null,
    }),
    WEAPON_50CAL: Object.freeze({
      shape: 'rifle',
      color: '#5a5a68',
      length: 1.55,
      thickness: 4.2,
      svgHref: null,
      bitmapSrc: null,
    }),
    GRENADE_LAUNCHER: Object.freeze({
      shape: 'launcher',
      color: '#bf6b4a',
      length: 1.1,
      thickness: 5.5,
      svgHref: null,
      bitmapSrc: null,
    }),
  }),
  tools: Object.freeze({
    TOOL_AXE: Object.freeze({
      shape: 'axe',
      color: '#a09060',
      length: 1.05,
      thickness: 3.6,
      svgHref: null,
      bitmapSrc: null,
    }),
    TOOL_PICK: Object.freeze({
      shape: 'pick',
      color: '#9090a0',
      length: 1.1,
      thickness: 3.2,
      svgHref: null,
      bitmapSrc: null,
    }),
    TOOL_WRENCH: Object.freeze({
      shape: 'wrench',
      color: '#7a8a9a',
      length: 0.95,
      thickness: 3.4,
      svgHref: null,
      bitmapSrc: null,
    }),
    FIST: Object.freeze({
      shape: 'fist',
      color: '#e8dcc0',
      length: 0.55,
      thickness: 4.2,
      svgHref: null,
      bitmapSrc: null,
    }),
  }),
  armor: Object.freeze({
    ARMOR_VEST: Object.freeze({
      shape: 'vest',
      color: '#7a9ab0',
      ringPad: 3.5,
      svgHref: null,
      bitmapSrc: null,
    }),
  }),
  shields: Object.freeze({
    SHIELD_BASIC: Object.freeze({
      shape: 'disc',
      color: '#6a9ccc',
      alpha: 0.4,
      svgHref: null,
      bitmapSrc: null,
    }),
    ENERGY_SHIELD: Object.freeze({
      shape: 'disc',
      color: '#3dffe0',
      alpha: 0.55,
      svgHref: null,
      bitmapSrc: null,
    }),
  }),
});

const DEFAULT_WEAPON = Object.freeze({
  shape: 'default',
  color: '#445',
  length: 1,
  thickness: 3.2,
  svgHref: null,
  bitmapSrc: null,
});

const DEFAULT_TOOL = Object.freeze({
  shape: 'default',
  color: '#a09070',
  length: 1,
  thickness: 3.4,
  svgHref: null,
  bitmapSrc: null,
});

const DEFAULT_ARMOR = Object.freeze({
  shape: 'default',
  color: '#7a9ab0',
  ringPad: 3,
  svgHref: null,
  bitmapSrc: null,
});

const DEFAULT_SHIELD = Object.freeze({
  shape: 'disc',
  color: '#6a9ccc',
  alpha: 0.35,
  svgHref: null,
  bitmapSrc: null,
});

/** @type {Map<string, Path2D>|null} */
let _pathCache = null;
/** @type {Map<string, HTMLImageElement>|null} */
let _imageCache = null;

export function getWeaponArt(weaponId) {
  if (!weaponId) return null;
  return UNIT_EQUIP_ART.weapons[weaponId] || DEFAULT_WEAPON;
}

export function getToolArt(toolId) {
  if (!toolId) return null;
  return UNIT_EQUIP_ART.tools[toolId] || DEFAULT_TOOL;
}

export function getArmorArt(armorId) {
  if (!armorId) return null;
  return UNIT_EQUIP_ART.armor[armorId] || DEFAULT_ARMOR;
}

export function getShieldArt(shieldId) {
  if (!shieldId) return DEFAULT_SHIELD;
  return UNIT_EQUIP_ART.shields[shieldId] || DEFAULT_SHIELD;
}

/**
 * Build Path2D silhouettes once (BOOT / MATCH LOADING). Reused per-unit via show+pose.
 * Optional bitmapSrc entries get one Image each (never recreated on equip).
 */
export function preloadEquipArtCache() {
  if (_pathCache) return preloadWeaponBtnArt(WEAPON_BTN_ART);
  _pathCache = new Map();
  _imageCache = new Map();

  const weaponShapes = ['pistol', 'smg', 'rifle', 'shotgun', 'sniper', 'laser', 'launcher', 'default'];
  for (let i = 0; i < weaponShapes.length; i++) {
    const shape = weaponShapes[i];
    _pathCache.set(`weapon:${shape}`, buildWeaponPath(shape));
  }

  const toolShapes = ['axe', 'pick', 'wrench', 'fist', 'default'];
  for (let i = 0; i < toolShapes.length; i++) {
    const shape = toolShapes[i];
    _pathCache.set(`tool:${shape}`, buildToolPath(shape));
  }

  _pathCache.set('armor:plate', buildArmorPlatePath());
  _pathCache.set('shield:disc', buildShieldDiscPath());
  _pathCache.set('shield:kite', buildShieldKitePath());

  const allArts = [
    ...Object.values(UNIT_EQUIP_ART.weapons),
    ...Object.values(UNIT_EQUIP_ART.tools),
    ...Object.values(UNIT_EQUIP_ART.armor),
    ...Object.values(UNIT_EQUIP_ART.shields),
  ];
  for (let i = 0; i < allArts.length; i++) {
    const art = allArts[i];
    const src = art && (art.bitmapSrc || art.svgHref);
    if (!src || _imageCache.has(src)) continue;
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    _imageCache.set(src, img);
  }

  return preloadWeaponBtnArt(WEAPON_BTN_ART);
}

export function getEquipPathCache() {
  if (!_pathCache) preloadEquipArtCache();
  return _pathCache;
}

export function getEquipImageCache() {
  if (!_imageCache) preloadEquipArtCache();
  return _imageCache;
}

/**
 * Resolve held visual from sim mirrors only — no gameplay rules.
 * Priority: active swing → hotbar WEAPON/TOOL → (no inv) unit.weaponId.
 * Empty / placeable / armor / shield hotbar → null (no weaponId or FIST fallback).
 * FIST only while meleeSwing / fist skill is active.
 */
export function resolveHeldVisual(unit, opts = {}) {
  if (!unit) return null;
  const sw = unit.meleeSwing;
  if (sw && sw.active) {
    if (sw.toolId) return { kind: 'tool', id: sw.toolId };
    if (sw.source === 'FIST' || !sw.source) return { kind: 'melee', id: 'FIST' };
    if (UNIT_EQUIP_ART.tools[sw.source]) return { kind: 'tool', id: sw.source };
  }

  const inv = opts.inventory != null ? opts.inventory : unit.inventory;
  const hotbar =
    opts.activeHotbar != null
      ? opts.activeHotbar
      : unit.activeHotbar != null
        ? unit.activeHotbar
        : 0;
  if (inv) {
    const slot = getActiveSlot(inv, hotbar);
    if (isToolSlot(slot)) return { kind: 'tool', id: slot.itemId };
    if (isWeaponSlot(slot)) {
      return { kind: 'weapon', id: slot.weaponId || slot.itemId };
    }
    // Empty hands — do not fall back to spawn weaponId or always-show FIST.
    return null;
  }

  // Combat AI (no inventory bag): show equipped weapon only.
  if (unit.weaponId) return { kind: 'weapon', id: unit.weaponId };
  return null;
}

/**
 * Draw held + armor + shield cosmetics for one unit (aim-oriented, front-rim anchors).
 */
export function drawUnitEquipCosmetics(ctx, unit, zoom, opts = {}) {
  if (!ctx || !unit || !unit.active) return;
  const cache = getEquipPathCache();
  // Visual facing = facingRad (same slew as skin/arms/pivots). aimRad stays sim-only (fire).
  const facing =
    typeof unit.facingRad === 'number'
      ? unit.facingRad
      : typeof unit.aimRad === 'number'
        ? unit.aimRad
        : 0;
  const r = unit.radius || 12;
  const lw = 1 / (zoom > 0 ? zoom : 1);
  const cos = Math.cos(facing);
  const sin = Math.sin(facing);
  // Front rim of unit body — all held/worn fronts start here, not body center.
  const rimX = unit.x + cos * r;
  const rimY = unit.y + sin * r;

  if (unit.activeArmorId) {
    drawArmorMarker(ctx, unit, facing, r, unit.x, unit.y, zoom, lw, cache);
  }

  const held = resolveHeldVisual(unit, opts);
  if (held) {
    if (held.kind === 'weapon') {
      // Guns stay on unit rim/muzzle (sim fire pivot unchanged).
      drawHeldWeapon(
        ctx,
        unit,
        facing,
        r,
        rimX,
        rimY,
        zoom,
        lw,
        held.id,
        opts.isPlayer,
        cache,
        opts
      );
    } else if (held.kind === 'tool' || held.kind === 'melee') {
      // Snap grip to Pivot_Arm_1; orient with same facing as skin (visual only).
      const pivot = opts.arm1Pivot;
      const hx = pivot && Number.isFinite(pivot.x) ? pivot.x : rimX;
      const hy = pivot && Number.isFinite(pivot.y) ? pivot.y : rimY;
      drawHeldTool(
        ctx,
        unit,
        facing,
        r,
        hx,
        hy,
        zoom,
        lw,
        held.id,
        opts.isPlayer,
        cache
      );
    }
  }

  if (unit.shield && unit.shield.enabled && !unit.shield.broken && unit.shield.hp > 0) {
    drawShieldMarker(ctx, unit, facing, r, zoom, lw, cache);
  }
}

/** Weapon-pivot recoil while visual Action_Shoting (arms unchanged). */
function weaponRecoilKickPx(unit) {
  const act = unit && unit.visualAction;
  if (act !== 'Shoting' && act !== 'Shoting_2') return 0;
  if (!(unit.visualActionT > 0)) return 0;
  const pack = GAME_PACK;
  const maxKick = pack.unitVisualRecoilPx != null ? pack.unitVisualRecoilPx : 7;
  const dur =
    pack.unitVisualShotingSec != null ? pack.unitVisualShotingSec : 0.12;
  const progress = 1 - Math.min(1, unit.visualActionT / Math.max(1e-4, dur));
  const fall = (1 - progress) * (1 - progress);
  return maxKick * fall;
}

function heldAmmo(unit, opts) {
  const match = opts && opts.match;
  if (unit && unit.role === 'player' && match) {
    const slot = getActiveSlot(match.inventory, match.activeHotbar);
    if (isWeaponSlot(slot)) return slot;
  }
  return unit || null;
}

/** Pyrotechnic core + RPG round variant. Other mapped guns use "base". */
function weaponBtnVariant(weaponId) {
  const spec = weaponArtSpec(weaponId);
  if (!spec) return null;
  if (spec.rpg) return 'rpg';
  if (spec.core) return 'pyro-body';
  return 'base';
}

/** 1 = that core plate fully visible. The gun's painted socket stays underneath. */
function coreTarget(unit, weaponId) {
  const def = getWeaponDef(weaponId);
  const beam = def && def.beamDurationSec ? def.beamDurationSec : 0;
  const cool = def && def.cooldownSec ? def.cooldownSec : 0;
  const cd = unit && unit.fireCooldown > 0 ? unit.fireCooldown : 0;
  if (beam > 0 && cd > cool) return { ready: 0, white: 1 };
  if (cd > 0) return { ready: 0, white: 0 };
  return { ready: 1, white: 0 };
}

const CORE_BLEND_SEC = 0.12;

export function tickWeaponCoreVisual(unit, weaponId, dt) {
  if (!unit) return;
  if (!weaponCoreKind(weaponId)) {
    unit._coreReady = 0;
    unit._coreWhite = 0;
    return;
  }
  const target = coreTarget(unit, weaponId);
  const k = 1 - Math.exp(-Math.max(0, dt) / CORE_BLEND_SEC);
  if (unit._coreReady == null) {
    unit._coreReady = target.ready;
    unit._coreWhite = target.white;
    return;
  }
  unit._coreReady += (target.ready - unit._coreReady) * k;
  unit._coreWhite += (target.white - unit._coreWhite) * k;
}

function drawHeldWeapon(ctx, unit, aim, r, rimX, rimY, zoom, lw, weaponId, isPlayer, cache, opts) {
  const art = getWeaponArt(weaponId);
  if (!art) return;
  const btn = weaponArtSpec(weaponId);
  const variant = btn ? weaponBtnVariant(weaponId) : null;
  const rpgLoaded =
    btn && btn.rpg && heldAmmo(unit, opts) && heldAmmo(unit, opts).ammoInMag > 0;
  const imgKey = btn && btn.rpg ? (rpgLoaded ? 'rpg-loaded' : 'rpg-empty') : variant;
  const img = imgKey ? getWeaponBtnImage(weaponId, imgKey) : null;
  const layout = imgKey ? getWeaponBtnLayout(weaponId, imgKey) : null;
  const kick = weaponRecoilKickPx(unit);

  if (img && layout) {
    // SizeView in the weapon group shares the unit's local space.
    // 1 SVG unit = body scale, so art past SizeView sticks out as the held gun.
    const scale = (L3_SIZE * (unit.sizeScale || 1)) / UNIT_LOCAL_W;
    const facing =
      typeof unit.facingRad === 'number'
        ? unit.facingRad
        : typeof unit.aimRad === 'number'
          ? unit.aimRad
          : aim;
    const packOff =
      GAME_PACK.unitVisualFacingOffsetRad != null
        ? GAME_PACK.unitVisualFacingOffsetRad
        : -Math.PI / 2;
    ctx.save();
    ctx.translate(unit.x, unit.y);
    ctx.rotate(facing + packOff);
    if (kick > 0) ctx.translate(0, -kick);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      img,
      layout.x * scale,
      layout.y * scale,
      layout.w * scale,
      layout.h * scale
    );
    if (btn && btn.core) drawWeaponCores(ctx, weaponId, unit, layout, scale);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(rimX, rimY);
  ctx.rotate(aim);
  if (kick > 0) ctx.translate(-kick, 0);

  const lenMult = art.length != null ? art.length : 1;
  const thick = (art.thickness != null ? art.thickness : 3.2) / (zoom > 0 ? Math.min(zoom, 2) : 1);
  const barrel = r * (0.55 + 0.55 * lenMult) * (isPlayer ? 1.15 : 1);
  const shape = art.shape || 'default';
  const path = cache.get(`weapon:${shape}`) || cache.get('weapon:default');
  ctx.scale(barrel / 20, thick / 3.2);
  ctx.fillStyle = art.color;
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = Math.max(0.6, lw) * (20 / Math.max(barrel, 1));
  if (path) {
    ctx.fill(path);
    ctx.stroke(path);
  }
  ctx.restore();
}

function drawWeaponCores(ctx, weaponId, unit, layout, scale) {
  const layers = [
    ['ready', unit._coreReady == null ? 1 : unit._coreReady],
    ['white', unit._coreWhite || 0],
  ];
  for (let i = 0; i < layers.length; i++) {
    const alpha = layers[i][1];
    if (alpha < 0.02) continue;
    const core = getWeaponCoreImage(weaponId, layers[i][0]);
    if (!core) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.drawImage(
      core,
      layout.x * scale,
      layout.y * scale,
      layout.w * scale,
      layout.h * scale
    );
    ctx.restore();
  }
}

function drawHeldTool(ctx, unit, aim, r, rimX, rimY, zoom, lw, toolId, isPlayer, cache) {
  const art = getToolArt(toolId) || DEFAULT_TOOL;
  const lenMult = art.length != null ? art.length : 1;
  const thick = (art.thickness != null ? art.thickness : 3.4) / (zoom > 0 ? Math.min(zoom, 2) : 1);
  const reach = r * (0.7 + 0.45 * lenMult) * (isPlayer ? 1.1 : 1);
  const shape = art.shape || 'default';
  const path = cache.get(`tool:${shape}`) || cache.get('tool:default');

  ctx.save();
  ctx.translate(rimX, rimY);
  ctx.rotate(aim);
  ctx.scale(reach / 18, thick / 3.4);
  ctx.fillStyle = art.color;
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = Math.max(0.6, lw) * (18 / Math.max(reach, 1));
  if (path) {
    ctx.fill(path);
    ctx.stroke(path);
  }
  ctx.restore();
}

function drawArmorMarker(ctx, unit, aim, r, rimX, rimY, zoom, lw, cache) {
  const art = getArmorArt(unit.activeArmorId);
  if (!art) return;
  const path = cache.get('armor:plate');

  ctx.save();
  ctx.translate(rimX, rimY);
  ctx.rotate(aim);
  const scale = r / 12;
  ctx.scale(scale, scale);
  const worn = getItemDef(unit.activeArmorId);
  const plate = (worn && worn.color) || art.color;
  ctx.fillStyle = plate;
  ctx.strokeStyle = plate;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = Math.max(1, lw * 2) / scale;
  if (path) {
    ctx.fill(path);
    ctx.globalAlpha = 0.9;
    ctx.stroke(path);
  }
  ctx.restore();
}

function drawShieldMarker(ctx, unit, aim, r, zoom, lw, cache) {
  const sh = unit.shield;
  if (!sh) return;
  const art = getShieldArt(unit.activeShieldId);
  // Sit clearly at / beyond front rim (unit radius), extend slightly forward.
  const off =
    sh.offset != null
      ? Math.max(sh.offset, r * 1.05)
      : r * 1.15;
  const rad = sh.radius != null ? sh.radius : r * 0.9;
  const sx = unit.x + Math.cos(aim) * off;
  const sy = unit.y + Math.sin(aim) * off;
  const hpRatio = sh.maxHp > 0 ? Math.max(0, sh.hp / sh.maxHp) : 1;
  const shape = art.shape === 'kite' ? 'kite' : 'disc';
  const path = cache.get(`shield:${shape}`) || cache.get('shield:disc');

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(aim);
  ctx.scale(rad / 12, rad / 12);
  ctx.globalAlpha = (art.alpha != null ? art.alpha : 0.35) * (0.55 + 0.45 * hpRatio);
  ctx.fillStyle = art.color;
  ctx.strokeStyle = art.color;
  ctx.lineWidth = Math.max(1.5, 2.5 / (zoom > 0 ? zoom : 1)) / (rad / 12);
  if (path) {
    ctx.fill(path);
    ctx.globalAlpha = Math.min(1, (art.alpha || 0.35) + 0.35);
    ctx.stroke(path);
  }
  ctx.restore();
}

/** Local-space weapon silhouettes — origin at grip (front rim), +X forward. */
function buildWeaponPath(shape) {
  const p = new Path2D();
  if (shape === 'pistol') {
    p.rect(0, -1.6, 11, 3.2);
    p.rect(3, 0.4, 2.4, 3.2);
  } else if (shape === 'smg') {
    p.rect(0, -1.5, 16, 3);
    p.rect(3, 0.6, 5, 2.4);
  } else if (shape === 'rifle') {
    p.rect(0, -1.4, 20, 2.8);
    p.rect(7, -2.8, 2, 1.6);
  } else if (shape === 'shotgun') {
    p.rect(0, -2, 16, 4);
    p.moveTo(16, 0);
    p.arc(16, 0, 2, 0, Math.PI * 2);
  } else if (shape === 'sniper') {
    p.rect(0, -1.2, 22, 2.4);
    p.rect(9, -3.4, 3, 2);
  } else if (shape === 'laser') {
    p.rect(0, -1.2, 18, 2.4);
    p.rect(13, -0.7, 6, 1.4);
  } else if (shape === 'launcher') {
    p.rect(0, -2.2, 14, 4.4);
    p.moveTo(5, 0);
    p.arc(5, 0, 2.6, 0, Math.PI * 2);
  } else {
    p.rect(0, -1.5, 14, 3);
  }
  return p;
}

/** Local-space tool / fist silhouettes — origin at grip, +X forward. */
function buildToolPath(shape) {
  const p = new Path2D();
  if (shape === 'axe') {
    // Handle
    p.rect(0, -0.9, 14, 1.8);
    // Blade head
    p.moveTo(12, -4.5);
    p.lineTo(18, -1.2);
    p.lineTo(18, 1.2);
    p.lineTo(12, 4.5);
    p.closePath();
  } else if (shape === 'pick') {
    p.rect(0, -0.8, 13, 1.6);
    // Pointed pick head
    p.moveTo(11, -0.6);
    p.lineTo(19, -4.5);
    p.lineTo(14, 0);
    p.lineTo(19, 4.5);
    p.lineTo(11, 0.6);
    p.closePath();
  } else if (shape === 'wrench') {
    p.rect(0, -0.85, 12, 1.7);
    // Open jaw
    p.moveTo(11, -3.2);
    p.lineTo(16, -3.2);
    p.lineTo(17.5, -1.2);
    p.lineTo(14, -1.2);
    p.lineTo(14, 1.2);
    p.lineTo(17.5, 1.2);
    p.lineTo(16, 3.2);
    p.lineTo(11, 3.2);
    p.closePath();
  } else if (shape === 'fist') {
    // Knuckle block + slight forward bump
    p.rect(0, -2.4, 7, 4.8);
    p.moveTo(6, 0);
    p.arc(7.5, 0, 2.2, -Math.PI * 0.55, Math.PI * 0.55);
    p.closePath();
  } else {
    p.rect(0, -1.2, 12, 2.4);
  }
  return p;
}

/** Plate sits just forward of rim (chest toward aim). */
function buildArmorPlatePath() {
  const p = new Path2D();
  p.moveTo(-2, -7);
  p.lineTo(8, -5);
  p.lineTo(8, 5);
  p.lineTo(-2, 7);
  p.closePath();
  return p;
}

function buildShieldDiscPath() {
  const p = new Path2D();
  p.ellipse(0, 0, 4.2, 12, 0, 0, Math.PI * 2);
  return p;
}

function buildShieldKitePath() {
  const p = new Path2D();
  p.moveTo(2, 0);
  p.lineTo(-4, -10);
  p.lineTo(-6.5, 0);
  p.lineTo(-4, 10);
  p.closePath();
  return p;
}

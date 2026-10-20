/**
 * Unit_Template.svg — visual only.
 * Z (top→bottom): Asset Top → Body → Weapon → Arm → Asset Bottom
 * Paint order: Bottom → Arm → (weapon in render) → Body → Top
 * Action tween = Arm_1 / Arm_2 matrices only · SizeView = L3 64.
 * Enemy default = Default_skin_2. Playable menu skins = Default 1–2 only.
 */

import { GAME_PACK, L3_SIZE, ReloadType, getWeaponDef } from './config.js';
import {
  resolveHeldVisual,
  WEAPON_POSE_FAMILY,
  weaponPoseFamily,
} from './cosmetics.js';
import { getActiveSlot, isWeaponSlot } from './inventory.js';
import { isMeleeSwingOpen } from './meleeTools.js';
import { getBtnActionArmPoses } from './weaponBtnArt.js';

export const UNIT_TEMPLATE_URL = 'Asset/AssetSVG/Unit/Unit_Template.svg';

/** @typedef {'idle'|'hold_Gun'|'hold_Gun_2'|'Fist'|'PlaceBlock'|'Shoting'|'Shoting_2'|'Reload_Mag'|'Reload_Mag_2'|'Reload_Shotgun'} UnitVisualAction */

export const UNIT_VISUAL_ACTIONS = Object.freeze({
  idle: 'idle',
  hold_Gun: 'hold_Gun',
  hold_Gun_2: 'hold_Gun_2',
  Fist: 'Fist',
  PlaceBlock: 'PlaceBlock',
  Shoting: 'Shoting',
  Shoting_2: 'Shoting_2',
  Reload_Mag: 'Reload_Mag',
  Reload_Mag_2: 'Reload_Mag_2',
  Reload_Shotgun: 'Reload_Shotgun',
});

/** Playable MainMenu skin slots (Asset/Custom deferred). */
export const PLAYABLE_MENU_SKINS = Object.freeze([
  'Skin_Default_1',
  'Skin_Default_2',
]);

/** Menu Skin_Default_N → template group id (runtime playable only). */
export const MENU_SKIN_TO_GROUP = Object.freeze({
  Skin_Default_1: 'Default_skin_1',
  Skin_Default_2: 'Default_skin_2',
  // Future: Skin_Default_3 → Asset_skin_3 … Custom slots
});

/** Action → Arm element ids in Unit_Template (pose keyframes). */
const ACTION_ARM_IDS = Object.freeze({
  idle: Object.freeze({ arm1: 'Arm_1_FL', arm2: 'Arm_2_FL' }),
  hold_Gun: Object.freeze({ arm1: 'Arm_1_FL_FL', arm2: 'Arm_2_FL_FL' }),
  Fist: Object.freeze({ arm1: 'Arm_1_FL_FL_FL', arm2: 'Arm_2_FL_FL_FL' }),
  PlaceBlock: Object.freeze({
    arm1: 'Arm_1_FL_FL_FL_FL',
    arm2: 'Arm_2_FL_FL_FL_FL',
  }),
  Shoting: Object.freeze({
    arm1: 'Arm_1_FL_FL_FL_FL_FL_FL',
    arm2: 'Arm_2_FL_FL_FL_FL_FL_FL',
  }),
  // Heavy guns share the same arm keyframes; Action_*_2 is the pose name.
  hold_Gun_2: Object.freeze({
    arm1: 'Arm_1_FL_FL',
    arm2: 'Arm_2_FL_FL',
  }),
  Shoting_2: Object.freeze({
    arm1: 'Arm_1_FL_FL_FL_FL_FL_FL',
    arm2: 'Arm_2_FL_FL_FL_FL_FL_FL',
  }),
  Reload_Mag: Object.freeze({
    arm1: 'Arm_1_FL_FL',
    arm2: 'Arm_2_FL_FL',
  }),
  Reload_Mag_2: Object.freeze({
    arm1: 'Arm_1_FL_FL',
    arm2: 'Arm_2_FL_FL',
  }),
  Reload_Shotgun: Object.freeze({
    arm1: 'Arm_1_FL_FL',
    arm2: 'Arm_2_FL_FL',
  }),
});

/** Action → Pivot_Arm_1 ids (grip snap for tool/melee visual). */
const ACTION_PIVOT_ARM1_IDS = Object.freeze({
  idle: 'Pivot_Arm_1_FL',
  hold_Gun: 'Pivot_Arm_1_FL_FL',
  Fist: 'Pivot_Arm_1_FL_FL_FL',
  PlaceBlock: 'Pivot_Arm_1_FL_FL_FL_FL',
  Shoting: 'Pivot_Arm_1_FL_FL_FL_FL_FL_FL',
  hold_Gun_2: 'Pivot_Arm_1_FL_FL',
  Shoting_2: 'Pivot_Arm_1_FL_FL_FL_FL_FL_FL',
  Reload_Mag: 'Pivot_Arm_1_FL_FL',
  Reload_Mag_2: 'Pivot_Arm_1_FL_FL',
  Reload_Shotgun: 'Pivot_Arm_1_FL_FL',
});

const IDLE_ARM_FALLBACK = Object.freeze({
  arm1: ['Arm_1_FL', 'Arm_1', 'Arm_1_FL_FL_FL_FL_FL'],
  arm2: ['Arm_2_FL', 'Arm_2', 'Arm_2_FL_FL_FL_FL_FL'],
});

const IDLE_PIVOT_ARM1_FALLBACK = Object.freeze([
  'Pivot_Arm_1_FL',
  'Pivot_Arm_1',
  'Pivot_Arm_1_FL_FL_FL_FL_FL',
]);

const MEASURE_PREFIXES = ['SizeView', 'ColliderBody'];
const ARM_ID_RE = /^Arm_/i;
const BODY_ID_RE = /^(Body|Outfit)/i;
const ASSET_BOTTOM_RE = /^Pivot_Asset_Bottom/i;
const ASSET_TOP_RE = /^Pivot_Asset_Top/i;

const RASTER_PX = 128;
const LOCAL_VB = Object.freeze({ x: -32, y: -36, w: 64, h: 64 });
const ARM_VB = Object.freeze({ x: -80, y: -80, w: 160, h: 160 });

let _svgText = '';
let _defsHtml = '';
/** @type {Map<string, {arm1:object,arm2:object,pivot1:object}>} */
const _armPoses = new Map();
/** @type {Map<string, HTMLImageElement|null>} */
const _layerCache = new Map();
/** @type {Map<string, HTMLImageElement|null>} */
const _armCache = new Map();
/** @type {Map<string, Promise<*>>} */
const _pending = new Map();
let _ready = false;

export function isUnitVisualReady() {
  return _ready;
}

export function menuSkinToGroupId(menuSkinId) {
  return MENU_SKIN_TO_GROUP[menuSkinId] || 'Default_skin_1';
}

export function clampPlayableMenuSkinId(menuSkinId) {
  if (PLAYABLE_MENU_SKINS.indexOf(menuSkinId) >= 0) return menuSkinId;
  return PLAYABLE_MENU_SKINS[0];
}

export function enemySkinGroupId() {
  const pack = GAME_PACK;
  return (pack && pack.enemyDefaultSkinGroupId) || 'Default_skin_2';
}

function parseMatrixAttr(el) {
  const t = (el && el.getAttribute && el.getAttribute('transform')) || '';
  const m = /matrix\s*\(\s*([^)]+)\)/i.exec(t);
  if (!m) return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const p = m[1].split(/[\s,]+/).map(Number);
  return {
    a: p[0] || 1,
    b: p[1] || 0,
    c: p[2] || 0,
    d: p[3] || 1,
    e: p[4] || 0,
    f: p[5] || 0,
  };
}

function matLerp(a, b, t) {
  const u = 1 - t;
  return {
    a: a.a * u + b.a * t,
    b: a.b * u + b.b * t,
    c: a.c * u + b.c * t,
    d: a.d * u + b.d * t,
    e: a.e * u + b.e * t,
    f: a.f * u + b.f * t,
  };
}

function findByIds(doc, ids) {
  for (let i = 0; i < ids.length; i++) {
    const el = doc.getElementById(ids[i]);
    if (el) return el;
  }
  return null;
}

function loadArmPoses(doc) {
  _armPoses.clear();
  const actions = Object.keys(ACTION_ARM_IDS);
  const idlePivotFallback = { a: 1, b: 0, c: 0, d: 1, e: -19.85, f: 16.15 };
  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    const spec = ACTION_ARM_IDS[act];
    let a1 = doc.getElementById(spec.arm1);
    let a2 = doc.getElementById(spec.arm2);
    if (!a1) a1 = findByIds(doc, IDLE_ARM_FALLBACK.arm1);
    if (!a2) a2 = findByIds(doc, IDLE_ARM_FALLBACK.arm2);
    const pivotId = ACTION_PIVOT_ARM1_IDS[act];
    let piv = pivotId ? doc.getElementById(pivotId) : null;
    if (!piv) piv = findByIds(doc, IDLE_PIVOT_ARM1_FALLBACK);
    _armPoses.set(act, {
      arm1: a1 ? parseMatrixAttr(a1) : { a: 0.37, b: 0, c: 0, d: 0.37, e: 0, f: 0 },
      arm2: a2
        ? parseMatrixAttr(a2)
        : { a: -0.37, b: 0, c: 0, d: 0.37, e: 0, f: 0 },
      pivot1: piv ? parseMatrixAttr(piv) : idlePivotFallback,
    });
  }
  applyBtnActionArmPoses();
}

/** Btn.svg Action_* arm matrices replace the Unit_Template alias once loaded. */
function applyBtnActionArmPoses() {
  const poses = getBtnActionArmPoses();
  if (!poses) return;
  const actions = Object.keys(poses);
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const src = poses[action];
    const cur = _armPoses.get(action);
    _armPoses.set(action, {
      arm1: src.arm1,
      arm2: src.arm2,
      pivot1: cur && cur.pivot1
        ? cur.pivot1
        : { a: 1, b: 0, c: 0, d: 1, e: -19.85, f: 16.15 },
    });
  }
}

function hideEl(el) {
  if (!el) return;
  el.setAttribute('display', 'none');
  el.style.display = 'none';
}

function svgToImage(markup) {
  return new Promise((resolve) => {
    if (!markup) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src =
      'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
  });
}

function wrapSvg(inner, vb, px) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${px}" height="${px}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" ` +
    `preserveAspectRatio="xMidYMid meet">` +
    `<defs>${_defsHtml}</defs>${inner}</svg>`
  );
}

/**
 * Keep only nodes matching keepRe; hide measure/arms/other layers.
 * @param {'body'|'assetTop'|'assetBottom'} kind
 */
function filterSkinClone(clone, kind) {
  const all = clone.querySelectorAll('[id]');
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const id = el.getAttribute('id') || '';
    let hide = false;
    for (let p = 0; p < MEASURE_PREFIXES.length; p++) {
      if (id.indexOf(MEASURE_PREFIXES[p]) === 0) {
        hide = true;
        break;
      }
    }
    if (hide) {
      hideEl(el);
      continue;
    }
    if (ARM_ID_RE.test(id)) {
      hideEl(el);
      continue;
    }
    if (kind === 'body') {
      if (ASSET_TOP_RE.test(id) || ASSET_BOTTOM_RE.test(id)) hideEl(el);
      else if (!BODY_ID_RE.test(id) && id.indexOf('Pivot_') === 0) hideEl(el);
      else if (
        !BODY_ID_RE.test(id) &&
        !/^Default_skin/i.test(id) &&
        !/^Asset_skin/i.test(id)
      ) {
        // Keep nested transforms under Body/Outfit; hide stray Pivot_Arm etc.
        if (/^Pivot_/i.test(id)) hideEl(el);
      }
    } else if (kind === 'assetBottom') {
      if (!ASSET_BOTTOM_RE.test(id) && id !== clone.getAttribute('id')) {
        if (BODY_ID_RE.test(id) || ASSET_TOP_RE.test(id) || /^Pivot_/i.test(id))
          hideEl(el);
      }
    } else if (kind === 'assetTop') {
      if (!ASSET_TOP_RE.test(id) && id !== clone.getAttribute('id')) {
        if (
          BODY_ID_RE.test(id) ||
          ASSET_BOTTOM_RE.test(id) ||
          /^Pivot_/i.test(id)
        )
          hideEl(el);
      }
    }
  }
}

async function ensureLayerImage(skinGroupId, kind) {
  const key = `${kind}::${skinGroupId}`;
  if (_layerCache.has(key)) return _layerCache.get(key);
  if (_pending.has(key)) return _pending.get(key);

  const p = (async () => {
    const doc = new DOMParser().parseFromString(_svgText, 'image/svg+xml');
    const src = doc.getElementById(skinGroupId);
    if (!src) {
      _layerCache.set(key, null);
      return null;
    }
    const clone = src.cloneNode(true);
    clone.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
    filterSkinClone(clone, kind);
    const markup = wrapSvg(
      new XMLSerializer().serializeToString(clone),
      LOCAL_VB,
      RASTER_PX
    );
    const img = await svgToImage(markup);
    _layerCache.set(key, img);
    return img;
  })().finally(() => _pending.delete(key));

  _pending.set(key, p);
  return p;
}

async function ensureArmImage(skinGroupId, which) {
  const key = `arm${which}::${skinGroupId}`;
  if (_armCache.has(key)) return _armCache.get(key);
  if (_pending.has(key)) return _pending.get(key);

  const p = (async () => {
    const doc = new DOMParser().parseFromString(_svgText, 'image/svg+xml');
    const skin = doc.getElementById(skinGroupId);
    let armEl = null;
    if (skin) {
      const kids = skin.querySelectorAll('[id]');
      for (let i = 0; i < kids.length; i++) {
        const id = kids[i].getAttribute('id') || '';
        if (which === 1 && /^Arm_1/i.test(id)) {
          armEl = kids[i];
          break;
        }
        if (which === 2 && /^Arm_2/i.test(id)) {
          armEl = kids[i];
          break;
        }
        if (which === 1 && /^Arm_n/i.test(id)) {
          armEl = kids[i];
          break;
        }
      }
    }
    if (!armEl) {
      armEl = findByIds(
        doc,
        which === 1 ? IDLE_ARM_FALLBACK.arm1 : IDLE_ARM_FALLBACK.arm2
      );
    }
    if (!armEl) {
      _armCache.set(key, null);
      return null;
    }
    const clone = armEl.cloneNode(true);
    clone.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
    const markup = wrapSvg(
      new XMLSerializer().serializeToString(clone),
      ARM_VB,
      RASTER_PX
    );
    const img = await svgToImage(markup);
    _armCache.set(key, img);
    return img;
  })().finally(() => _pending.delete(key));

  _pending.set(key, p);
  return p;
}

/** Idle composite for menu preview (bottom + arms + body + top). */
async function ensureIdleComposite(skinGroupId) {
  const key = `idle::${skinGroupId}`;
  if (_layerCache.has(key)) return _layerCache.get(key);
  if (_pending.has(key)) return _pending.get(key);

  const p = (async () => {
    const doc = new DOMParser().parseFromString(_svgText, 'image/svg+xml');
    const src = doc.getElementById(skinGroupId);
    if (!src) {
      _layerCache.set(key, null);
      return null;
    }
    const clone = src.cloneNode(true);
    clone.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
    const all = clone.querySelectorAll('[id]');
    for (let i = 0; i < all.length; i++) {
      const id = all[i].getAttribute('id') || '';
      for (let pfx = 0; pfx < MEASURE_PREFIXES.length; pfx++) {
        if (id.indexOf(MEASURE_PREFIXES[pfx]) === 0) hideEl(all[i]);
      }
      // Hide pivot markers (not real Asset art yet).
      if (/^Pivot_Arm/i.test(id)) hideEl(all[i]);
    }
    const markup = wrapSvg(
      new XMLSerializer().serializeToString(clone),
      LOCAL_VB,
      RASTER_PX
    );
    const img = await svgToImage(markup);
    _layerCache.set(key, img);
    return img;
  })().finally(() => _pending.delete(key));

  _pending.set(key, p);
  return p;
}

export async function initUnitVisualFromSvgText(svgText) {
  _svgText = String(svgText || '');
  _layerCache.clear();
  _armCache.clear();
  _pending.clear();
  _armPoses.clear();
  _ready = false;
  if (!_svgText) return false;

  const doc = new DOMParser().parseFromString(_svgText, 'image/svg+xml');
  const defs = doc.querySelector('defs');
  _defsHtml = defs ? defs.innerHTML : '';
  loadArmPoses(doc);

  const skins = ['Default_skin_1', 'Default_skin_2'];
  const jobs = [];
  for (let i = 0; i < skins.length; i++) {
    const s = skins[i];
    jobs.push(
      ensureLayerImage(s, 'body'),
      ensureLayerImage(s, 'assetBottom'),
      ensureLayerImage(s, 'assetTop'),
      ensureArmImage(s, 1),
      ensureArmImage(s, 2),
      ensureIdleComposite(s)
    );
  }
  await Promise.all(jobs);

  _ready = true;
  return true;
}

function getPose(action) {
  return (
    _armPoses.get(action) ||
    _armPoses.get(UNIT_VISUAL_ACTIONS.idle) || {
      arm1: { a: 0.37, b: 0, c: 0, d: 0.37, e: 0, f: 0 },
      arm2: { a: -0.37, b: 0, c: 0, d: 0.37, e: 0, f: 0 },
      pivot1: { a: 1, b: 0, c: 0, d: 1, e: -19.85, f: 16.15 },
    }
  );
}

function armTweenSec() {
  const pack = GAME_PACK;
  return pack.unitVisualArmTweenSec != null ? pack.unitVisualArmTweenSec : 0.1;
}

function placeBlockVisualSec() {
  const pack = GAME_PACK;
  return pack.unitVisualPlaceBlockSec != null
    ? pack.unitVisualPlaceBlockSec
    : 0.1;
}

function shotingVisualSec() {
  const pack = GAME_PACK;
  return pack.unitVisualShotingSec != null ? pack.unitVisualShotingSec : 0.12;
}

function heldWeaponId(unit, match) {
  const inv =
    unit.role === 'player' && match ? match.inventory : unit.inventory;
  const hotbar =
    unit.role === 'player' && match ? match.activeHotbar : unit.activeHotbar;
  const held = resolveHeldVisual(unit, {
    inventory: inv,
    activeHotbar: hotbar,
  });
  if (!held || held.kind !== 'weapon') return null;
  return held.id;
}

function heldAmmoState(unit, match) {
  if (unit.role === 'player' && match) {
    const slot = getActiveSlot(match.inventory, match.activeHotbar);
    if (isWeaponSlot(slot)) return slot;
    return null;
  }
  return unit;
}

/**
 * Reload pose while reloadTimer > 0.
 * Magazine on standard guns loops (once: false).
 * Shotgun shows once per shell. Heavy Mag_2 shows once per reload.
 */
function reloadVisualSpec(unit, match) {
  const weaponId = heldWeaponId(unit, match);
  if (!weaponId) return null;
  const family = weaponPoseFamily(weaponId) || WEAPON_POSE_FAMILY.standard;
  const ammo = heldAmmoState(unit, match);
  if (!ammo || !(ammo.reloadTimer > 0)) return null;
  const def = getWeaponDef(weaponId);
  const shell = def && def.reloadType === ReloadType.INDIVIDUAL_SHELL;
  if (family.reloadOnce) {
    return { action: family.reloadMag, once: true };
  }
  if (shell) return { action: family.reloadShell, once: true };
  return { action: family.reloadMag, once: false };
}

function resolveHeldDesired(unit, match) {
  if (isMeleeSwingOpen(unit)) return UNIT_VISUAL_ACTIONS.Fist;
  const weaponId = heldWeaponId(unit, match);
  if (!weaponId) return UNIT_VISUAL_ACTIONS.idle;
  const family = weaponPoseFamily(weaponId);
  if (family) return family.hold;
  return UNIT_VISUAL_ACTIONS.hold_Gun;
}

/** Shot pose: Action_Shoting_2 for RPG and Barrett, else Action_Shoting. */
export function shotVisualAction(unit, match) {
  const family = weaponPoseFamily(heldWeaponId(unit, match));
  if (family) return family.shot;
  return UNIT_VISUAL_ACTIONS.Shoting;
}

export function tickUnitVisualAction(unit, match, dt) {
  if (!unit || !unit.active) return;
  applyBtnActionArmPoses();

  const reload = reloadVisualSpec(unit, match);
  if (reload && reload.once) {
    if (!unit._reloadOnceLatched) {
      unit._reloadOnceLatched = true;
      cutUnitVisualAction(unit, reload.action, 0.35);
    }
  } else {
    unit._reloadOnceLatched = false;
  }

  let desired = UNIT_VISUAL_ACTIONS.idle;

  if (unit.visualActionT > 0) {
    unit.visualActionT -= dt;
    if (unit.visualActionT > 0) {
      desired = unit.visualAction || UNIT_VISUAL_ACTIONS.PlaceBlock;
    } else {
      unit.visualActionT = 0;
      desired =
        reload && !reload.once
          ? reload.action
          : resolveHeldDesired(unit, match);
    }
  } else {
    desired =
      reload && !reload.once
        ? reload.action
        : resolveHeldDesired(unit, match);
  }

  const cur = unit.visualAction || UNIT_VISUAL_ACTIONS.idle;
  if (desired !== cur) {
    unit.visualActionPrev = cur;
    unit.visualAction = desired;
    unit.armTweenT = 0;
    unit.armTweenDur = armTweenSec();
  }

  if (unit.armTweenDur > 0 && unit.armTweenT < unit.armTweenDur) {
    unit.armTweenT = Math.min(unit.armTweenDur, (unit.armTweenT || 0) + dt);
  }
}

export function cutUnitVisualAction(unit, action, durationSec) {
  if (!unit) return;
  const next = action || UNIT_VISUAL_ACTIONS.idle;
  let dur = durationSec;
  if (dur == null) {
    if (next === UNIT_VISUAL_ACTIONS.PlaceBlock) dur = placeBlockVisualSec();
    else if (
      next === UNIT_VISUAL_ACTIONS.Shoting ||
      next === UNIT_VISUAL_ACTIONS.Shoting_2
    )
      dur = shotingVisualSec();
    else dur = armTweenSec();
  }
  if (next !== unit.visualAction) {
    unit.visualActionPrev = unit.visualAction || UNIT_VISUAL_ACTIONS.idle;
    unit.armTweenT = 0;
    unit.armTweenDur = armTweenSec();
  }
  unit.visualAction = next;
  unit.visualActionT = Math.max(0, dur);
}

export function tickAllUnitVisuals(match, dt) {
  const units = match && match.pools && match.pools.units;
  if (!units) return;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active) continue;
    if (u.role === 'enemy') {
      u.skinGroupId = enemySkinGroupId();
    }
    tickUnitVisualAction(u, match, dt);
  }
}

function easeOutCubic(t) {
  const x = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - x, 3);
}

function currentArmPose(unit) {
  const to = getPose(unit.visualAction || UNIT_VISUAL_ACTIONS.idle);
  const dur = unit.armTweenDur || 0;
  const elapsed = unit.armTweenT || 0;
  if (dur <= 0 || elapsed >= dur || !unit.visualActionPrev) {
    return to;
  }
  const from = getPose(unit.visualActionPrev);
  const t = easeOutCubic(elapsed / dur);
  return {
    arm1: matLerp(from.arm1, to.arm1, t),
    arm2: matLerp(from.arm2, to.arm2, t),
    pivot1: matLerp(from.pivot1, to.pivot1, t),
  };
}

/**
 * World-space Pivot_Arm_1 for tool/melee cosmetics (visual only).
 * @returns {{ x: number, y: number, ang: number }|null}
 */
export function getUnitArm1PivotWorld(unit) {
  if (!unit || !unit.active || !_ready) return null;
  const pose = currentArmPose(unit);
  const piv = pose.pivot1 || getPose(UNIT_VISUAL_ACTIONS.idle).pivot1;
  if (!piv) return null;
  const angBody = facingOffset(unit);
  const scale = unitScaleOf(unit);
  const lx = (piv.e || 0) * scale;
  const ly = (piv.f || 0) * scale;
  const cos = Math.cos(angBody);
  const sin = Math.sin(angBody);
  // Local pivot rotation (atan2(b,a)) + body facing.
  const localRot = Math.atan2(piv.b || 0, piv.a || 1);
  return {
    x: unit.x + lx * cos - ly * sin,
    y: unit.y + lx * sin + ly * cos,
    ang: angBody + localRot,
  };
}

function resolveSkinGroup(unit) {
  return unit.role === 'enemy'
    ? enemySkinGroupId()
    : unit.skinGroupId || 'Default_skin_1';
}

function facingOffset(unit) {
  const facing =
    typeof unit.facingRad === 'number'
      ? unit.facingRad
      : typeof unit.aimRad === 'number'
        ? unit.aimRad
        : 0;
  const pack = GAME_PACK;
  const offset =
    pack.unitVisualFacingOffsetRad != null
      ? pack.unitVisualFacingOffsetRad
      : -Math.PI / 2;
  return facing + offset;
}

function unitScaleOf(unit) {
  const size = L3_SIZE * (unit.sizeScale || 1);
  return size / LOCAL_VB.w;
}

function drawLocalLayer(ctx, img, unitScale) {
  if (!img) return;
  ctx.drawImage(
    img,
    LOCAL_VB.x * unitScale,
    LOCAL_VB.y * unitScale,
    LOCAL_VB.w * unitScale,
    LOCAL_VB.h * unitScale
  );
}

function drawArm(ctx, img, mat, unitScale) {
  if (!img || !mat) return;
  ctx.save();
  ctx.transform(
    mat.a,
    mat.b,
    mat.c,
    mat.d,
    mat.e * unitScale,
    mat.f * unitScale
  );
  ctx.drawImage(
    img,
    ARM_VB.x * unitScale,
    ARM_VB.y * unitScale,
    ARM_VB.w * unitScale,
    ARM_VB.h * unitScale
  );
  ctx.restore();
}

function ensureSkinCaches(skinGroup) {
  ensureLayerImage(skinGroup, 'body');
  ensureLayerImage(skinGroup, 'assetBottom');
  ensureLayerImage(skinGroup, 'assetTop');
  ensureArmImage(skinGroup, 1);
  ensureArmImage(skinGroup, 2);
}

/**
 * Back pass: Asset Bottom → Arm_1 / Arm_2.
 * @returns {boolean} true if body cache ready (unit visuals usable)
 */
export function drawUnitVisualBack(ctx, unit, zoom) {
  if (!ctx || !unit || !unit.active || !_ready) return false;
  const skinGroup = resolveSkinGroup(unit);
  const body = _layerCache.get(`body::${skinGroup}`);
  if (!body) {
    ensureSkinCaches(skinGroup);
    return false;
  }

  const unitScale = unitScaleOf(unit);
  const pose = currentArmPose(unit);
  const bottom = _layerCache.get(`assetBottom::${skinGroup}`);
  const arm1 = _armCache.get(`arm1::${skinGroup}`);
  const arm2 = _armCache.get(`arm2::${skinGroup}`);
  if (!arm1) ensureArmImage(skinGroup, 1);
  if (!arm2) ensureArmImage(skinGroup, 2);

  ctx.save();
  ctx.translate(unit.x, unit.y);
  ctx.rotate(facingOffset(unit));
  drawLocalLayer(ctx, bottom, unitScale);
  if (arm1) drawArm(ctx, arm1, pose.arm1, unitScale);
  if (arm2) drawArm(ctx, arm2, pose.arm2, unitScale);
  ctx.restore();
  return true;
}

/**
 * Front pass: Body (+Outfit) → Asset Top.
 * @returns {boolean}
 */
export function drawUnitVisualFront(ctx, unit, zoom) {
  if (!ctx || !unit || !unit.active || !_ready) return false;
  const skinGroup = resolveSkinGroup(unit);
  const body = _layerCache.get(`body::${skinGroup}`);
  if (!body) {
    ensureSkinCaches(skinGroup);
    return false;
  }

  const unitScale = unitScaleOf(unit);
  const top = _layerCache.get(`assetTop::${skinGroup}`);

  ctx.save();
  ctx.translate(unit.x, unit.y);
  ctx.rotate(facingOffset(unit));
  drawLocalLayer(ctx, body, unitScale);
  drawLocalLayer(ctx, top, unitScale);
  ctx.restore();
  return true;
}

/** @deprecated Prefer back → cosmetics → front. Kept for callers. */
export function drawUnitSprite(ctx, unit, zoom) {
  const ok = drawUnitVisualBack(ctx, unit, zoom);
  if (!ok) return false;
  drawUnitVisualFront(ctx, unit, zoom);
  return true;
}

/**
 * Inject mini previews into playable MainMenu skin slots only.
 * @param {SVGSVGElement} menuSvg
 */
export async function injectMenuSkinPreviews(menuSvg) {
  if (!menuSvg || !_ready) return;
  for (let i = 0; i < PLAYABLE_MENU_SKINS.length; i++) {
    const menuId = PLAYABLE_MENU_SKINS[i];
    const slot = menuSvg.getElementById(menuId);
    if (!slot) continue;
    const groupId = MENU_SKIN_TO_GROUP[menuId];
    if (!groupId) continue;
    const img = await ensureIdleComposite(groupId);
    if (!img) continue;
    while (slot.firstChild) slot.removeChild(slot.firstChild);
    const ns = 'http://www.w3.org/2000/svg';
    const image = document.createElementNS(ns, 'image');
    image.setAttribute('href', img.src);
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', img.src);
    image.setAttribute('x', '-22');
    image.setAttribute('y', '-22');
    image.setAttribute('width', '44');
    image.setAttribute('height', '44');
    image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    slot.appendChild(image);
  }
}

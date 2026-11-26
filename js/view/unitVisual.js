/**
 * Unit_Template.svg — visual only.
 * Z (top→bottom): Asset Top → Body → Weapon → Arm → Asset Bottom
 * Paint order: Bottom → Arm → VestArm overlay → (weapon) → Body → Top → WornTop
 * Vest arms draw ON TOP of skin arms (same pose) — do not replace skin arms.
 * Action tween = Arm_1 / Arm_2 matrices only · SizeView = L3 64.
 * Enemy default = Default_skin_2. Playable menu skins = Default 1–2 only.
 */

import { GAME_PACK, L3_SIZE, ReloadType, getItemDef, getWeaponDef } from '../config.js';
import {
  UNIT_TEMPLATE_FILE,
  ITEM_HOLD_FILE,
  ARMOR_VEST_ART_IDS,
  ARMOR_TOP_ART_IDS,
  closedModelGroupId,
  listClosedModelGroupIds,
} from '../assets/closedCatalog.js';
import {
  resolveHeldVisual,
  tickWeaponCoreVisual,
  WEAPON_POSE_FAMILY,
  weaponPoseFamily,
} from './cosmetics.js';
import { getActiveSlot, isWeaponSlot } from '../player/inventory.js';
import { isMeleeSwingOpen } from '../combat/meleeTools.js';
import { getBtnActionArmPoses } from './weaponBtnArt.js';
import {
  ART_POOL_PIXEL,
  artPoolKeyLayer,
  ensureEntryImage,
  getGameplayArtPool,
  rasterMarkupToEntry,
  setGameplayArtPool,
  yieldPaint,
} from './artPool.js';

export const UNIT_TEMPLATE_URL = UNIT_TEMPLATE_FILE;

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

/** Slots drawn on MainMenu.svg that stay hidden until the pack grows. */
export const HIDDEN_SKIN_IDS = Object.freeze([
  'Skin_Default_3',
  'Skin_Default_4',
  'Skin_Default_5',
  'Skin_Default_6',
  'Skin_Custom_1',
  'Skin_Custom_2',
  'Skin_Custom_3',
  'Skin_Custom_4',
  'Skin_Custom_5',
  'Skin_Custom_6',
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

/** Native pool resolution per SizeView cell (lineless). Arms use same pixel density. */
const RASTER_PX = ART_POOL_PIXEL;
const ARM_RASTER_PX = ART_POOL_PIXEL * 2;
const LOCAL_VB = Object.freeze({ x: -32, y: -36, w: 64, h: 64 });
const ARM_VB = Object.freeze({ x: -80, y: -80, w: 160, h: 160 });

let _svgText = '';
let _defsHtml = '';
/** ItemHold.svg text — shield / hold overlays not in Unit_Template. */
let _itemHoldText = '';
let _itemHoldDefsHtml = '';
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
  if (pack && pack.enemyDefaultSkinGroupId) return pack.enemyDefaultSkinGroupId;
  return closedModelGroupId('model.unit.default_2') || 'Default_skin_2';
}

/**
 * Skin from unit sheet / archetype `model` (closed catalog) — not team/role hard lock.
 * @param {object|null} record unit sheet, archetype, or { model, skinGroupId }
 * @param {string} [fallbackGroupId]
 */
export function skinGroupIdFromSheet(record, fallbackGroupId) {
  if (record && record.skinGroupId) return String(record.skinGroupId);
  if (record && record.model) {
    const gid = closedModelGroupId(record.model);
    if (gid) return gid;
  }
  if (fallbackGroupId) return fallbackGroupId;
  return enemySkinGroupId();
}

function parseMatrixAttr(el) {
  const t = (el && el.getAttribute && el.getAttribute('transform')) || '';
  const m = /matrix\s*\(\s*([^)]+)\)/i.exec(t);
  if (!m) return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const p = m[1].split(/[\s,]+/).map(Number);
  return {
    a: Number.isFinite(p[0]) ? p[0] : 1,
    b: Number.isFinite(p[1]) ? p[1] : 0,
    c: Number.isFinite(p[2]) ? p[2] : 0,
    d: Number.isFinite(p[3]) ? p[3] : 1,
    e: Number.isFinite(p[4]) ? p[4] : 0,
    f: Number.isFinite(p[5]) ? p[5] : 0,
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
      pivot1:
        src.pivot1 ||
        (cur && cur.pivot1) ||
        { a: 1, b: 0, c: 0, d: 1, e: -19.85, f: 16.15 },
    });
  }
}

function hideEl(el) {
  if (!el) return;
  el.setAttribute('display', 'none');
  el.style.display = 'none';
}

async function svgMarkupToPoolImage(markup, destW, destH) {
  const entry = await rasterMarkupToEntry(markup, destW, destH);
  if (!entry) return null;
  return (await ensureEntryImage(entry)) || null;
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
    const img = await svgMarkupToPoolImage(markup, RASTER_PX, RASTER_PX);
    _layerCache.set(key, img);
    const pool = getGameplayArtPool() || setGameplayArtPool(new Map());
    if (img) {
      pool.set(artPoolKeyLayer(kind, skinGroupId), {
        cellSize: ART_POOL_PIXEL,
        frameW: RASTER_PX,
        frameH: RASTER_PX,
        anchorX: RASTER_PX / 2,
        anchorY: RASTER_PX / 2,
        pixelArt: true,
        dataUrl: img.src,
        image: img,
      });
    }
    return img;
  })().finally(() => _pending.delete(key));

  _pending.set(key, p);
  return p;
}

function findArmChild(root, which) {
  if (!root) return null;
  const kids = root.querySelectorAll('[id]');
  let armEl = null;
  for (let i = 0; i < kids.length; i++) {
    const id = kids[i].getAttribute('id') || '';
    if (which === 1 && (/^Asset_Arm_1/i.test(id) || /^Arm_1/i.test(id))) {
      armEl = kids[i];
      break;
    }
    if (which === 2 && (/^Asset_Arm_2/i.test(id) || /^Arm_2/i.test(id))) {
      armEl = kids[i];
      break;
    }
    if (which === 1 && /^Arm_n/i.test(id)) {
      armEl = kids[i];
      break;
    }
  }
  return armEl;
}

async function ensureArmImage(skinGroupId, which) {
  const key = `arm${which}::${skinGroupId}`;
  if (_armCache.has(key)) return _armCache.get(key);
  if (_pending.has(key)) return _pending.get(key);

  const p = (async () => {
    const doc = new DOMParser().parseFromString(_svgText, 'image/svg+xml');
    const skin = doc.getElementById(skinGroupId);
    let armEl = findArmChild(skin, which);
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
      ARM_RASTER_PX
    );
    const img = await svgMarkupToPoolImage(markup, ARM_RASTER_PX, ARM_RASTER_PX);
    _armCache.set(key, img);
    const pool = getGameplayArtPool() || setGameplayArtPool(new Map());
    if (img) {
      pool.set(artPoolKeyLayer('arm' + which, skinGroupId), {
        cellSize: ART_POOL_PIXEL,
        frameW: ARM_RASTER_PX,
        frameH: ARM_RASTER_PX,
        anchorX: ARM_RASTER_PX / 2,
        anchorY: ARM_RASTER_PX / 2,
        pixelArt: true,
        dataUrl: img.src,
        image: img,
      });
    }
    return img;
  })().finally(() => _pending.delete(key));

  _pending.set(key, p);
  return p;
}

/** Vest arm overlay — raster from Asset_Arm_Vest_* / Asset_Arm_1|2 (not skin). */
async function ensureVestArmImage(vestGroupId, which) {
  const key = `vestArm${which}::${vestGroupId}`;
  if (_armCache.has(key)) return _armCache.get(key);
  if (_pending.has(key)) return _pending.get(key);

  const p = (async () => {
    const doc = new DOMParser().parseFromString(_svgText, 'image/svg+xml');
    const vest = doc.getElementById(vestGroupId);
    const armEl = findArmChild(vest, which);
    if (!armEl) {
      _armCache.set(key, null);
      return null;
    }
    const clone = armEl.cloneNode(true);
    clone.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
    const markup = wrapSvg(
      new XMLSerializer().serializeToString(clone),
      ARM_VB,
      ARM_RASTER_PX
    );
    const img = await svgMarkupToPoolImage(markup, ARM_RASTER_PX, ARM_RASTER_PX);
    _armCache.set(key, img);
    return img;
  })().finally(() => _pending.delete(key));

  _pending.set(key, p);
  return p;
}

/**
 * Worn TOP hat/helmet — Asset_Top_* overlay.
 * Same bake contract as skin layers: reset shelf transform → hide SizeView →
 * LOCAL_VB + Unit_Template defs (Suit_* via <use>). Editor Map composes the
 * same group into the unit; Gameplay draws it as a front overlay.
 */
async function ensureWornTopImage(topGroupId) {
  const key = `wornTop::${topGroupId}`;
  if (_layerCache.has(key)) return _layerCache.get(key);
  if (_pending.has(key)) return _pending.get(key);

  const p = (async () => {
    if (!_svgText) {
      _layerCache.set(key, null);
      return null;
    }
    const doc = new DOMParser().parseFromString(_svgText, 'image/svg+xml');
    const src = doc.getElementById(topGroupId);
    if (!src) {
      _layerCache.set(key, null);
      return null;
    }
    const clone = src.cloneNode(true);
    // Drop shelf translate (e.g. 143,329) — same as Editor cloneArtGroup.
    clone.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
    const all = clone.querySelectorAll('[id]');
    for (let i = 0; i < all.length; i++) {
      const id = all[i].getAttribute('id') || '';
      for (let pfx = 0; pfx < MEASURE_PREFIXES.length; pfx++) {
        if (id.indexOf(MEASURE_PREFIXES[pfx]) === 0) hideEl(all[i]);
      }
    }
    const markup = wrapSvg(
      new XMLSerializer().serializeToString(clone),
      LOCAL_VB,
      RASTER_PX
    );
    const img = await svgMarkupToPoolImage(markup, RASTER_PX, RASTER_PX);
    _layerCache.set(key, img || null);
    return img || null;
  })().finally(() => _pending.delete(key));

  _pending.set(key, p);
  return p;
}

function wrapItemHoldSvg(inner, vb, px) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${px}" height="${px}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" ` +
    `preserveAspectRatio="xMidYMid meet">` +
    `<defs>${_itemHoldDefsHtml}</defs>${inner}</svg>`
  );
}

async function ensureItemHoldText() {
  if (_itemHoldText) return true;
  try {
    const res = await fetch(ITEM_HOLD_FILE + '?v=20261126a', { cache: 'no-cache' });
    if (!res.ok) return false;
    _itemHoldText = await res.text();
    const doc = new DOMParser().parseFromString(_itemHoldText, 'image/svg+xml');
    const defs = doc.querySelector('defs');
    _itemHoldDefsHtml = defs ? defs.innerHTML : '';
    return true;
  } catch (e) {
    return false;
  }
}

/** Shield item art from ItemHold (Basic / Energy). */
async function ensureWornShieldImage(shieldGroupId) {
  const key = `wornShield::${shieldGroupId}`;
  if (_layerCache.has(key)) return _layerCache.get(key);
  if (_pending.has(key)) return _pending.get(key);

  const p = (async () => {
    const ok = await ensureItemHoldText();
    if (!ok || !_itemHoldText) {
      _layerCache.set(key, null);
      return null;
    }
    const doc = new DOMParser().parseFromString(_itemHoldText, 'image/svg+xml');
    const src = doc.getElementById(shieldGroupId);
    if (!src) {
      _layerCache.set(key, null);
      return null;
    }
    const clone = src.cloneNode(true);
    clone.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
    const markup = wrapItemHoldSvg(
      new XMLSerializer().serializeToString(clone),
      LOCAL_VB,
      RASTER_PX
    );
    const entry = await rasterMarkupToEntry(markup, RASTER_PX, RASTER_PX);
    const img = entry ? await ensureEntryImage(entry) : null;
    _layerCache.set(key, img);
    return img;
  })().finally(() => _pending.delete(key));

  _pending.set(key, p);
  return p;
}

function wornVestArtId(unit) {
  const id = unit && (unit.activeArmorVestId || unit.activeArmorId);
  if (!id) return '';
  const def = getItemDef(id);
  return (def && def.artId && String(def.artId).trim()) || '';
}

function wornTopArtId(unit) {
  const id = unit && unit.activeArmorTopId;
  if (!id) return '';
  const def = getItemDef(id);
  if (def && def.artId && String(def.artId).trim()) return String(def.artId).trim();
  // Allow art group id stored directly (Editor trail / custom sheets).
  if (/^Asset_Top_/i.test(String(id))) return String(id);
  return '';
}

/**
 * Kick wear rasters. Vest path unchanged (vest arms only).
 * Helmet TOP = same equip channel model as Vest; display = Asset_Top_* overlay.
 */
export function ensureUnitWearVisuals(unit) {
  if (!unit) return;
  const vest = wornVestArtId(unit);
  if (vest) {
    ensureVestArmImage(vest, 1);
    ensureVestArmImage(vest, 2);
  }
  const top = wornTopArtId(unit);
  if (top) ensureWornTopImage(top);
  const shield = wornShieldArtId(unit);
  if (shield) ensureWornShieldImage(shield);
}

function wornShieldArtId(unit) {
  if (!unit || !unit.activeShieldId) return '';
  if (!unit.shield || !unit.shield.enabled || unit.shield.broken) return '';
  if (!(unit.shield.hp > 0)) return '';
  const def = getItemDef(unit.activeShieldId);
  return (def && def.artId && String(def.artId).trim()) || '';
}

/**
 * Hotbar icon for Helmet (TOP) — same Asset_Top_* bake Editor wear preview uses.
 * Vest must NOT use this (keeps color-pad path that already works).
 * Returns href only when raster is ready (never a half-baked URL → invisible fill:none).
 */
export function getTopWearSlotIconHref(itemId) {
  if (!itemId) return null;
  const def = getItemDef(itemId);
  if (!def || def.kind !== 'ARMOR') return null;
  const artId =
    def.artId && String(def.artId).trim()
      ? String(def.artId).trim()
      : '';
  if (!artId || !/^Asset_Top_/i.test(artId)) return null;
  const img = _layerCache.get(`wornTop::${artId}`);
  if (img && img.src) return img.src;
  ensureWornTopImage(artId);
  return null;
}

/** Hotbar icon for Shield — ItemHold art (optional; Vest untouched). */
export function getShieldWearSlotIconHref(itemId) {
  if (!itemId) return null;
  const def = getItemDef(itemId);
  if (!def || def.kind !== 'SHIELD') return null;
  const artId =
    def.artId && String(def.artId).trim() ? String(def.artId).trim() : '';
  if (!artId) return null;
  const img = _layerCache.get(`wornShield::${artId}`);
  if (img && img.src) return img.src;
  ensureWornShieldImage(artId);
  return null;
}

/** Idle composite for menu preview (bottom + arms + body + top). */
export async function ensureIdleComposite(skinGroupId) {
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
    const img = await svgMarkupToPoolImage(markup, RASTER_PX, RASTER_PX);
    _layerCache.set(key, img);
    return img;
  })().finally(() => _pending.delete(key));

  _pending.set(key, p);
  return p;
}

/**
 * Bake all closed-model layers into the gameplay art pool (lineless).
 * Arm pose matrices stay from SVG parse — only bitmaps are pooled.
 * @param {(label: string, done: number, total: number) => void} [onProgress]
 */
export async function buildGameplayLayerArtPool(onProgress) {
  if (!_svgText) return getGameplayArtPool();
  const pool = getGameplayArtPool() || setGameplayArtPool(new Map());
  const skins = listClosedModelGroupIds();
  const kinds = ['body', 'assetBottom', 'assetTop'];
  const vestIds = ARMOR_VEST_ART_IDS.slice();
  const topIds = ARMOR_TOP_ART_IDS.slice();
  const total =
    skins.length * (kinds.length + 2 + 1) +
    vestIds.length * 2 +
    topIds.length +
    1;
  let done = 0;
  const report = (label) => {
    if (onProgress) onProgress(label, done, total);
  };
  for (let i = 0; i < skins.length; i++) {
    const s = skins[i];
    report('Art pool · layers ' + s);
    for (let k = 0; k < kinds.length; k++) {
      await ensureLayerImage(s, kinds[k]);
      done += 1;
    }
    await ensureArmImage(s, 1);
    done += 1;
    await ensureArmImage(s, 2);
    done += 1;
    await ensureIdleComposite(s);
    done += 1;
    await yieldPaint();
  }
  for (let i = 0; i < vestIds.length; i++) {
    report('Art pool · vest ' + vestIds[i]);
    await ensureVestArmImage(vestIds[i], 1);
    done += 1;
    await ensureVestArmImage(vestIds[i], 2);
    done += 1;
  }
  for (let i = 0; i < topIds.length; i++) {
    report('Art pool · top ' + topIds[i]);
    await ensureWornTopImage(topIds[i]);
    done += 1;
  }
  report('Art pool · ItemHold shields');
  await ensureItemHoldText();
  done += 1;
  report('Art pool ready · ' + pool.size + ' layer sprites');
  return pool;
}

export async function initUnitVisualFromSvgText(svgText, onProgress) {
  _svgText = String(svgText || '');
  _itemHoldText = '';
  _itemHoldDefsHtml = '';
  _layerCache.clear();
  _armCache.clear();
  _pending.clear();
  _armPoses.clear();
  setGameplayArtPool(new Map());
  _ready = false;
  if (!_svgText) return false;

  const doc = new DOMParser().parseFromString(_svgText, 'image/svg+xml');
  const defs = doc.querySelector('defs');
  _defsHtml = defs ? defs.innerHTML : '';
  loadArmPoses(doc);

  await buildGameplayLayerArtPool(onProgress);

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

const RELOAD_TWEEN_SEC = 0.2;

/**
 * Reload clip while reloadTimer > 0.
 * No spare ammo never starts the timer, so no pose plays.
 * Shell and Mag_2: one tween to the hold pose.
 * Magazine: 0.2s tween, repeated until the reload timer ends.
 */
function reloadVisualSpec(unit, match) {
  const weaponId = heldWeaponId(unit, match);
  if (!weaponId) return null;
  const family = weaponPoseFamily(weaponId) || WEAPON_POSE_FAMILY.standard;
  const ammo = heldAmmoState(unit, match);
  if (!ammo || !(ammo.reloadTimer > 0)) return null;
  const def = getWeaponDef(weaponId);
  const shell = def && def.reloadType === ReloadType.INDIVIDUAL_SHELL;
  const serial = ammo.reloadSerial | 0;
  if (family.reloadOnce) {
    return {
      from: family.reloadMag,
      to: family.hold,
      loop: false,
      sec: RELOAD_TWEEN_SEC,
      serial,
    };
  }
  if (shell) {
    const sec = def.reloadSec > 0 ? def.reloadSec : 1.4;
    return { from: family.reloadShell, to: family.hold, loop: false, sec, serial };
  }
  return {
    from: family.reloadMag,
    to: family.hold,
    loop: true,
    sec: RELOAD_TWEEN_SEC,
    serial,
  };
}

function playReloadClip(unit, spec, restart) {
  // First frame is the reload pose. The tween to hold keeps that pose as its start.
  const came = unit.visualAction || spec.from;
  unit._reloadCameFrom = came;
  unit.visualActionPrev = spec.from;
  unit.visualAction = spec.to;
  unit.visualActionT = 0;
  unit.armTweenDur = spec.sec > 0 ? spec.sec : RELOAD_TWEEN_SEC;
  if (restart) unit.armTweenT = 0;
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

/** Drop a reload clip immediately. Right-click and hotbar changes use this. */
export function clearReloadVisual(unit) {
  if (!unit) return;
  unit._reloadClipKey = '';
  const prev = unit.visualActionPrev || '';
  const cur = unit.visualAction || '';
  if (prev.indexOf('Reload') !== 0 && cur.indexOf('Reload') !== 0) return;
  const hold = cur.indexOf('hold_Gun') === 0 ? cur : 'hold_Gun';
  unit.visualAction = hold;
  unit.visualActionPrev = hold;
  unit.armTweenT = 0;
  unit.armTweenDur = 0;
  unit.visualActionT = 0;
}

export function tickUnitVisualAction(unit, match, dt) {
  if (!unit || !unit.active) return;
  applyBtnActionArmPoses();
  tickWeaponCoreVisual(unit, heldWeaponId(unit, match), dt);

  const reload = reloadVisualSpec(unit, match);
  if (reload) {
    const dur = reload.sec > 0 ? reload.sec : RELOAD_TWEEN_SEC;
    const key =
      reload.from +
      '>' +
      reload.to +
      (reload.loop ? ':loop' : ':once') +
      ':' +
      (reload.serial || 0);
    if (unit._reloadClipKey !== key) {
      unit._reloadClipKey = key;
      playReloadClip(unit, reload, true);
    } else if (reload.loop) {
      unit.armTweenT = (unit.armTweenT || 0) + dt;
      if (unit.armTweenT >= dur) playReloadClip(unit, reload, true);
    } else if ((unit.armTweenT || 0) < dur) {
      unit.armTweenT = Math.min(dur, (unit.armTweenT || 0) + dt);
    }
    return;
  }
  unit._reloadClipKey = '';

  let desired = UNIT_VISUAL_ACTIONS.idle;

  if (unit.visualActionT > 0) {
    unit.visualActionT -= dt;
    if (unit.visualActionT > 0) {
      desired = unit.visualAction || UNIT_VISUAL_ACTIONS.PlaceBlock;
    } else {
      unit.visualActionT = 0;
      desired = resolveHeldDesired(unit, match);
    }
  } else {
    desired = resolveHeldDesired(unit, match);
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
    // Hidden in hull — no arm/body tween (driver is key only, not a walking sprite).
    if (u.hiddenInVehicle && !u.vehicleTween) continue;
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
  // Always prefer the instance skin from sheet/spawn — never force by team/role.
  if (unit && unit.skinGroupId) return unit.skinGroupId;
  if (unit && unit.role === 'player') {
    return (
      (GAME_PACK && GAME_PACK.playerDefaultSkinGroupId) || 'Default_skin_1'
    );
  }
  return enemySkinGroupId();
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
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    LOCAL_VB.x * unitScale,
    LOCAL_VB.y * unitScale,
    LOCAL_VB.w * unitScale,
    LOCAL_VB.h * unitScale
  );
  ctx.imageSmoothingEnabled = smooth;
}

function drawArm(ctx, img, mat, unitScale) {
  if (!img || !mat) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
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
 * Back pass: Asset Bottom → skin Arm_1/2 → vest Arm overlay (same pose).
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

  const vestId = wornVestArtId(unit);
  let vestArm1 = null;
  let vestArm2 = null;
  if (vestId) {
    vestArm1 = _armCache.get(`vestArm1::${vestId}`);
    vestArm2 = _armCache.get(`vestArm2::${vestId}`);
    if (!vestArm1) ensureVestArmImage(vestId, 1);
    if (!vestArm2) ensureVestArmImage(vestId, 2);
  }

  ctx.save();
  ctx.translate(unit.x, unit.y);
  ctx.rotate(facingOffset(unit));
  drawLocalLayer(ctx, bottom, unitScale);
  if (arm1) drawArm(ctx, arm1, pose.arm1, unitScale);
  if (arm2) drawArm(ctx, arm2, pose.arm2, unitScale);
  // Overlay: vest arms on top of skin arms — any skin keeps vest look.
  if (vestArm1) drawArm(ctx, vestArm1, pose.arm1, unitScale);
  if (vestArm2) drawArm(ctx, vestArm2, pose.arm2, unitScale);
  ctx.restore();
  return true;
}

/**
 * Front pass: Body (+Outfit) → Asset Top → worn TOP helmet/cap → shield art.
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
  const topArtId = wornTopArtId(unit);
  let wornTop = null;
  if (topArtId) {
    const topKey = `wornTop::${topArtId}`;
    if (_layerCache.has(topKey)) wornTop = _layerCache.get(topKey);
    else ensureWornTopImage(topArtId);
  }
  const shieldArtId = wornShieldArtId(unit);
  let wornShield = null;
  if (shieldArtId) {
    wornShield = _layerCache.get(`wornShield::${shieldArtId}`);
    if (!wornShield) ensureWornShieldImage(shieldArtId);
  }

  ctx.save();
  ctx.translate(unit.x, unit.y);
  ctx.rotate(facingOffset(unit));
  drawLocalLayer(ctx, body, unitScale);
  drawLocalLayer(ctx, top, unitScale);
  if (wornTop) drawLocalLayer(ctx, wornTop, unitScale);
  if (wornShield) drawLocalLayer(ctx, wornShield, unitScale);
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

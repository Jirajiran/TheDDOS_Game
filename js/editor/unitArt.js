/**
 * Shared SVG art builder for Units, Weapons, and Structures.
 * Used by both the Inspector previews (panels.js) and Map Canvas (mapView.js)
 * so map icons match preview art 1:1.
 */

import {
  artFileForGroupId,
  BLOCK_ART_FILE,
  closedModelGroupId,
  ITEM_HOLD_FILE,
  listClosedModelGroupIds,
  resolvePreviewArtGroupId,
  UNIT_TEMPLATE_FILE,
  VEHICLE_ART_FILE,
  vehicleStateArtGroupId,
} from '../assets/closedCatalog.js';
import {
  ART_POOL_CELL as SHARED_ART_POOL_CELL,
  ART_POOL_PIXEL as SHARED_ART_POOL_PIXEL,
  artPoolKeyLayer,
  artPoolKeyStructure as sharedArtPoolKeyStructure,
  artPoolKeyVehicle as sharedArtPoolKeyVehicle,
  ensureEntryImage,
  getGameplayArtPool,
  mergeIntoGameplayArtPool,
  rasterSvgXmlToEntry,
  yieldPaint as sharedYieldPaint,
} from '../view/artPool.js';
import { cssColor, shownUnitModel } from './recordForm.js';
import { shownWeaponModel, weaponPreviewSpec } from './sheetForm.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const LAYER_ARM_RE = /^Arm_/i;
const LAYER_BODY_RE = /^(Body|Outfit)/i;
const LAYER_BOTTOM_RE = /^Pivot_Asset_Bottom/i;
const LAYER_TOP_RE = /^Pivot_Asset_Top/i;

/**
 * Lineless pixel-art pool:
 * - ART_POOL_PIXEL = native sprite resolution per map cell (64×64)
 * - ART_POOL_CELL  = L3 display cell on the map (64×64) → 1× on map
 * Frame may expand past the cell if art overflows SizeView; anchor stays centered.
 * Unit gameplay layers stay separate (body/arm/top/bottom) — composites are editor thumbs only.
 */
export const ART_POOL_PIXEL = SHARED_ART_POOL_PIXEL;
export const ART_POOL_CELL = SHARED_ART_POOL_CELL;

const parsedCache = new WeakMap();
const sizeViewBoxCache = new Map();
const artPoolByPack = new WeakMap();

export function parseUnitArt(svgText) {
  if (!svgText || svgText.indexOf('<svg') < 0) return null;
  return new DOMParser().parseFromString(svgText, 'image/svg+xml');
}

export function getParsedUnitArt(pack) {
  if (!pack || !pack.unitArt) return null;
  let parsed = parsedCache.get(pack);
  if (!parsed) {
    parsed = parseUnitArt(pack.unitArt);
    if (parsed) parsedCache.set(pack, parsed);
  }
  return parsed;
}

const domainParsedCache = new WeakMap();

function domainArtText(pack, file) {
  if (!pack) return '';
  if (file === UNIT_TEMPLATE_FILE) return pack.unitArt || '';
  if (file === VEHICLE_ART_FILE) return pack.vehicleArt || '';
  if (file === BLOCK_ART_FILE) return pack.blockArt || '';
  if (file === ITEM_HOLD_FILE) return pack.itemHoldArt || '';
  return pack.unitArt || '';
}

/** Parsed SVG for the file that hosts this group id. */
export function getParsedArtForGroup(pack, groupId) {
  const file = artFileForGroupId(groupId);
  const text = domainArtText(pack, file);
  if (!text) return null;
  let byFile = domainParsedCache.get(pack);
  if (!byFile) {
    byFile = Object.create(null);
    domainParsedCache.set(pack, byFile);
  }
  if (!byFile[file]) {
    byFile[file] = parseUnitArt(text);
  }
  return byFile[file];
}

/** Single closed art group preview (Armor / Block / Vehicle / Shield / Bullet). */
export function mountArtGroupPreview(pack, groupId) {
  const resolved = resolvePreviewArtGroupId(groupId) || groupId;
  const parsed = getParsedArtForGroup(pack, resolved);
  if (!parsed) return null;
  const clone = cloneArtGroup(parsed, resolved);
  if (!clone) return null;
  hideMeasures(clone);
  const svg = mountPreviewSvg(parsed.querySelector('defs'), [clone]);
  svg.setAttribute('data-art-id', resolved);
  return svg;
}

function pivotLocalOffset(root, baseName) {
  const all = pivotLocalOffsets(root, baseName);
  return all.length ? all[0] : null;
}

/** All pivots matching base name (Base has 4× Pivot_turrent; Turret has 1). */
function pivotLocalOffsets(root, baseName) {
  const out = [];
  if (!root || !baseName) return out;
  const nodes = root.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const id = String(nodes[i].getAttribute('id') || '').replace(/(_FL)+$/g, '');
    if (id !== baseName) continue;
    const t = nodes[i].getAttribute('transform') || '';
    const m = /matrix\s*\(\s*([^)]+)\)/i.exec(t);
    if (!m) {
      out.push({ x: 0, y: 0 });
      continue;
    }
    const p = m[1].split(/[\s,]+/).map(Number);
    out.push({
      x: Number.isFinite(p[4]) ? p[4] : 0,
      y: Number.isFinite(p[5]) ? p[5] : 0,
    });
  }
  return out;
}

/** Detach Bg_light_on* groups for top overlay; hide light_off if present. */
function extractLightOverlay(root) {
  if (!root) return [];
  const lights = [];
  const nodes = root.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i];
    const id = String(el.getAttribute('id') || '').replace(/(_FL)+$/g, '');
    if (/^Bg_light_on/i.test(id) || /^light_on$/i.test(id)) {
      lights.push(el);
    } else if (/^Bg_light_off/i.test(id) || /^light_off$/i.test(id)) {
      el.setAttribute('display', 'none');
    }
  }
  for (let i = 0; i < lights.length; i++) {
    if (lights[i].parentNode) lights[i].parentNode.removeChild(lights[i]);
  }
  return lights;
}

function wrapTransformed(nodes, scale, ox, oy) {
  const g = document.createElementNS(SVG_NS, 'g');
  // scale 1 = authored SizeView; snap = translate only (no forced rescale).
  const s = scale != null ? scale : 1;
  g.setAttribute(
    'transform',
    'matrix(' + s + ',0,0,' + s + ',' + ox + ',' + oy + ')'
  );
  const serial = new XMLSerializer();
  let html = '';
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]) html += serial.serializeToString(nodes[i]);
  }
  g.innerHTML = html;
  return g;
}

/** Expand 1× SizeView cell to footprint W×H SizeViews (centered). */
function expandCellForFootprint(cell, footprint) {
  if (!cell || !(cell.w > 0) || !(cell.h > 0)) return cell;
  const fw = Math.max(1, (footprint && footprint.w != null ? footprint.w : 1) | 0);
  const fh = Math.max(1, (footprint && footprint.h != null ? footprint.h : 1) | 0);
  if (fw === 1 && fh === 1) return cell;
  const cx = cell.x + cell.w / 2;
  const cy = cell.y + cell.h / 2;
  return {
    x: cx - (cell.w * fw) / 2,
    y: cy - (cell.h * fh) / 2,
    w: cell.w * fw,
    h: cell.h * fh,
  };
}

/**
 * Gun group at Pivot_turrent — art from weapon sheet (any Weapon_* group).
 * Weapon_Turrent_* is just one name family, not a forced mount type.
 */
export function resolveMountGunGroup(weapon) {
  if (weapon && typeof weapon.mountArtId === 'string' && weapon.mountArtId.trim()) {
    const mount = weapon.mountArtId.trim();
    return resolvePreviewArtGroupId(mount) || mount;
  }
  return shownWeaponModel(weapon) || '';
}

/** Count Pivot_turrent on an art group (Base×4 / Turret×1 / Vehicle×N). */
export function countTurretPivots(pack, artId) {
  if (!pack || !artId) return 0;
  const resolved = resolvePreviewArtGroupId(artId) || artId;
  const hullId = /^Vehicle_/i.test(resolved)
    ? vehicleStateArtGroupId(resolved, 'Driven')
    : resolved;
  const parsed = getParsedArtForGroup(pack, hullId);
  const clone = cloneArtGroup(parsed, hullId);
  if (!clone) return 0;
  let pivots = pivotLocalOffsets(clone, 'Pivot_turrent');
  if (!pivots.length) pivots = pivotLocalOffsets(clone, 'Pivot_Turret');
  return pivots.length;
}

function mergeDefs(list) {
  const defs = document.createElementNS(SVG_NS, 'defs');
  for (let i = 0; i < list.length; i++) {
    const src = list[i];
    if (!src) continue;
    const kids = src.childNodes;
    for (let k = 0; k < kids.length; k++) {
      defs.appendChild(kids[k].cloneNode(true));
    }
  }
  return defs;
}

/**
 * Vehicle sheet live SVG (legacy). Prefer ensureVehiclePoolEntry for Settings.
 */
export function mountVehicleCompositePreview(pack, record, doc) {
  const composed = composeVehicleLayerNodes(pack, record, doc);
  if (!composed) return null;
  const svg = mountPreviewSvg(mergeDefs(composed.defsList), composed.layers);
  svg.setAttribute('data-art-id', composed.artId);
  svg.setAttribute('data-layers', 'vehicle unit weapon');
  return svg;
}

export function recordSwatch(record) {
  if (record && typeof record.color === 'string' && record.color) return record.color;
  if (record && record.effect && typeof record.effect.color === 'string' && record.effect.color) {
    return record.effect.color;
  }
  return '#808080';
}

export function itemFootprint(record) {
  const fp = record && record.footprint;
  // Block Size floor is 1×1 — never 0,0.
  const w = Math.max(1, (fp && fp.w != null ? fp.w : 1) | 0);
  const h = Math.max(1, (fp && fp.h != null ? fp.h : 1) | 0);
  return { w, h };
}

export function weaponRecordOf(doc, weaponId) {
  if (!weaponId) return null;
  if (doc && doc.weapons && doc.weapons[weaponId]) return doc.weapons[weaponId];
  if (doc && doc.weapons) {
    const upper = String(weaponId).toUpperCase();
    if (doc.weapons[upper]) return doc.weapons[upper];
    const ids = Object.keys(doc.weapons);
    for (let i = 0; i < ids.length; i++) {
      const row = doc.weapons[ids[i]];
      if (!row) continue;
      if (row.id === weaponId || String(row.id || '').toUpperCase() === upper) return row;
      if (String(ids[i]).toUpperCase() === upper) return row;
    }
  }
  return { id: weaponId };
}

export function heldLoadout(record) {
  const list = record && Array.isArray(record.startingLoadout) ? record.startingLoadout : [];
  const index = record && record.currentSlot != null ? record.currentSlot | 0 : 0;
  const row = index >= 0 && index < list.length ? list[index] : null;
  return { index, row, list };
}

export function heldWeaponId(doc, itemId) {
  if (!itemId || !doc) return '';
  const item = doc.items ? doc.items[itemId] : null;
  if (item && typeof item.weaponId === 'string' && item.weaponId) return item.weaponId;
  if (doc.weapons && doc.weapons[itemId]) return itemId;
  return '';
}

export function resolveUnitWeaponSpec(doc, unitRecord) {
  if (!unitRecord) return null;
  const held = heldLoadout(unitRecord);
  const itemId = held.row && held.row.itemId ? held.row.itemId : '';
  let weaponId = heldWeaponId(doc, itemId);
  if (!weaponId && typeof unitRecord.defaultWeapon === 'string' && unitRecord.defaultWeapon) {
    weaponId = unitRecord.defaultWeapon;
  }
  const weapon = weaponId ? weaponRecordOf(doc, weaponId) : null;
  return weapon ? weaponPreviewSpec(weapon) : null;
}

/**
 * Active Vest / Helmet / Shield from startingLoadout On checkboxes.
 * One art per channel (first active wins), matching readLoadoutOrders.
 */
export function resolveActiveWearSpec(doc, unitRecord) {
  const out = { vestArt: '', topArt: '', shieldArt: '' };
  const list =
    unitRecord && Array.isArray(unitRecord.startingLoadout)
      ? unitRecord.startingLoadout
      : [];
  const items = doc && doc.items;
  if (!items || !list.length) return out;
  let seenVest = false;
  let seenTop = false;
  let seenShield = false;
  for (let i = 0; i < list.length; i++) {
    const row = list[i];
    if (!row || row.active !== true || !row.itemId) continue;
    const rawId = String(row.itemId);
    const item =
      items[rawId] ||
      items[rawId.toUpperCase()] ||
      null;
    if (!item) continue;
    const art =
      resolvePreviewArtGroupId(item.artId) || String(item.artId || '').trim();
    if (!art) continue;
    const kind = String(item.kind || '');
    const itemKind = String(item.itemKind || '');
    const isShield =
      kind === 'SHIELD' ||
      kind === 'Shield' ||
      itemKind === 'Shield' ||
      itemKind === 'Shield Energy';
    if (isShield) {
      if (seenShield) continue;
      seenShield = true;
      out.shieldArt = art;
      continue;
    }
    const isArmor =
      kind === 'ARMOR' ||
      kind === 'Helmet' ||
      kind === 'Vest' ||
      itemKind === 'Helmet' ||
      itemKind === 'Vest';
    if (!isArmor) continue;
    const slot =
      itemKind === 'Helmet' ||
      kind === 'Helmet' ||
      String(item.armorSlot || '').toUpperCase() === 'TOP'
        ? 'TOP'
        : 'VEST';
    if (slot === 'TOP') {
      if (seenTop) continue;
      seenTop = true;
      out.topArt = art;
    } else {
      if (seenVest) continue;
      seenVest = true;
      out.vestArt = art;
    }
  }
  return out;
}

function isSizeViewId(id) {
  const base = String(id || '').replace(/(_FL)+$/g, '');
  return base.indexOf('SizeView') === 0;
}

/** Reference-only ids — measure then hide (not drawn art). Bg_Door_* stays visible. */
function isReferenceMarkerId(id) {
  const base = String(id || '').replace(/(_FL)+$/g, '');
  if (!base) return false;
  if (isSizeViewId(id)) return true;
  if (base.indexOf('Collider') === 0 || base.indexOf('ColliderBody') === 0) return true;
  if (base === 'Pivot_turrent' || base === 'Pivot_Turret' || base === 'Pivot_Unit') return true;
  if (base.indexOf('Area_interactive') === 0) return true;
  return false;
}

export function hideMeasures(clone, extra) {
  const nodes = clone.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].getAttribute('id') || '';
    if (isReferenceMarkerId(id) || (extra && extra(id))) {
      nodes[i].setAttribute('display', 'none');
    }
  }
}

export function cloneArtGroup(parsed, groupId) {
  if (!parsed || !groupId) return null;
  const src = parsed.getElementById(groupId);
  if (!src) return null;
  const clone = src.cloneNode(true);
  clone.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
  return clone;
}

export function weaponClone(parsed, groupName) {
  if (!groupName) return null;
  const resolved = resolvePreviewArtGroupId(groupName) || groupName;
  const clone = cloneArtGroup(parsed, resolved);
  if (!clone) return null;
  hideMeasures(clone);
  return clone;
}

/** Clone weapon group but keep SizeView for measurement (caller hides after). */
export function weaponCloneWithSizeView(parsed, groupName) {
  if (!groupName) return null;
  const resolved = resolvePreviewArtGroupId(groupName) || groupName;
  return cloneArtGroup(parsed, resolved);
}

/** Weapon / item art from the closed file that hosts the group (ItemHold, etc.). */
export function cloneWeaponFromPack(pack, groupName) {
  if (!pack || !groupName) return null;
  const resolved = resolvePreviewArtGroupId(groupName) || groupName;
  const parsed = getParsedArtForGroup(pack, resolved);
  return weaponClone(parsed, resolved);
}

/** Defs document for a closed art group (needed when compositing across SVG files). */
export function defsForArtGroup(pack, groupName) {
  if (!pack || !groupName) return null;
  const resolved = resolvePreviewArtGroupId(groupName) || groupName;
  const parsed = getParsedArtForGroup(pack, resolved);
  return parsed ? parsed.querySelector('defs') : null;
}

/** Art group from record only — no silent invent when artId empty. */
export function resolveBlockArtId(record) {
  if (record && typeof record.artId === 'string' && record.artId.trim()) {
    return record.artId.trim();
  }
  return '';
}

export function isTurretWeaponArtId(artId) {
  return /^Weapon_Turrent_[123]$/i.test(String(artId || ''));
}

function hideNode(el) {
  el.setAttribute('display', 'none');
  el.style.display = 'none';
}

function filterSkinLayer(clone, kind) {
  const rootId = clone.getAttribute('id') || '';
  const nodes = clone.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i];
    const id = el.getAttribute('id') || '';
    const arm = LAYER_ARM_RE.test(id);
    const measure = id.indexOf('SizeView') === 0 || id.indexOf('ColliderBody') === 0;
    if (measure || arm) {
      if (!(kind === 'arms' && arm)) hideNode(el);
      continue;
    }
    if (kind === 'arms') {
      if (id !== rootId) hideNode(el);
      continue;
    }
    if (kind === 'body') {
      if (LAYER_TOP_RE.test(id) || LAYER_BOTTOM_RE.test(id)) hideNode(el);
      else if (!LAYER_BODY_RE.test(id) && /^Pivot_/i.test(id)) hideNode(el);
    } else if (kind === 'assetBottom') {
      if (!LAYER_BOTTOM_RE.test(id) && id !== rootId) {
        if (LAYER_BODY_RE.test(id) || LAYER_TOP_RE.test(id) || /^Pivot_/i.test(id)) hideNode(el);
      }
    } else if (kind === 'assetTop') {
      if (!LAYER_TOP_RE.test(id) && id !== rootId) {
        if (LAYER_BODY_RE.test(id) || LAYER_BOTTOM_RE.test(id) || /^Pivot_/i.test(id)) hideNode(el);
      }
    }
  }
}

function armPoseTransform(parsed, hold, which) {
  const name = hold === 'hold_Gun_2' ? 'Action_hold_Gun_2' : 'Action_hold_Gun';
  const group = parsed.getElementById(name);
  if (!group) return '';
  const re = which === 1 ? /^Arm_1/i : /^Arm_2/i;
  const nodes = group.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].getAttribute('id') || '';
    if (!re.test(id)) continue;
    return nodes[i].getAttribute('transform') || '';
  }
  return '';
}

function applyModelArmPose(clone, parsed, hold) {
  const nodes = clone.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].getAttribute('id') || '';
    const base = id.replace(/(_FL)+$/g, '');
    let which = 0;
    if (/^Arm_1/i.test(base) || /^Asset_Arm_1$/i.test(base)) which = 1;
    else if (/^Arm_2/i.test(base) || /^Asset_Arm_2$/i.test(base)) which = 2;
    if (!which) continue;
    const transform = armPoseTransform(parsed, hold, which);
    if (transform) nodes[i].setAttribute('transform', transform);
  }
}

/**
 * Unit layers + optional held weapon + active wear (vest over arms, helmet, shield).
 * @param {Document} parsed Unit_Template doc
 * @param {string} groupId skin group
 * @param {{ hold?: string, group?: string }|null} spec
 * @param {object} [pack] when set, weapon/wear clones from domain files
 * @param {{ vestArt?: string, topArt?: string, shieldArt?: string }|null} [wear]
 */
export function modelHoldNodes(parsed, groupId, spec, pack, wear) {
  const bottom = cloneArtGroup(parsed, groupId);
  const arms = cloneArtGroup(parsed, groupId);
  const body = cloneArtGroup(parsed, groupId);
  const top = cloneArtGroup(parsed, groupId);
  if (!bottom && !arms && !body && !top) return [];
  if (bottom) filterSkinLayer(bottom, 'assetBottom');
  if (arms) {
    filterSkinLayer(arms, 'arms');
    if (spec && spec.hold) applyModelArmPose(arms, parsed, spec.hold);
  }
  if (body) filterSkinLayer(body, 'body');
  if (top) filterSkinLayer(top, 'assetTop');
  const nodes = [];
  if (bottom) nodes.push(bottom);
  if (arms) nodes.push(arms);
  if (wear && wear.vestArt && pack) {
    const vest = cloneWearArt(pack, wear.vestArt);
    if (vest.node) {
      if (arms) applyVestArmTransformsFrom(vest.node, arms);
      else applyVestArmIdleFromSkin(vest.node, parsed, groupId);
      nodes.push(vest.node);
    }
  }
  if (spec && spec.group) {
    const gun = pack
      ? cloneWeaponFromPack(pack, spec.group)
      : weaponClone(parsed, spec.group);
    if (gun) nodes.push(gun);
  }
  if (body) nodes.push(body);
  if (top) nodes.push(top);
  if (wear && wear.topArt && pack) {
    const helm = cloneWearArt(pack, wear.topArt);
    if (helm.node) nodes.push(helm.node);
  }
  if (wear && wear.shieldArt && pack) {
    const shield = cloneWearArt(pack, wear.shieldArt);
    if (shield.node) nodes.push(shield.node);
  }
  return nodes;
}

/** Extra <defs> when a hold gun lives outside Unit_Template. */
export function extraDefsForWeaponSpec(pack, spec) {
  if (!pack || !spec || !spec.group) return [];
  const defs = defsForArtGroup(pack, spec.group);
  return defs ? [defs] : [];
}

/** Weapon + wear art defs for unit composite bake. */
export function extraDefsForUnitCompose(pack, spec, wear) {
  const list = extraDefsForWeaponSpec(pack, spec).slice();
  if (!pack || !wear) return list;
  const arts = [wear.vestArt, wear.topArt, wear.shieldArt];
  for (let i = 0; i < arts.length; i++) {
    if (!arts[i]) continue;
    const defs = defsForArtGroup(pack, arts[i]);
    if (defs) list.push(defs);
  }
  return list;
}

export function mountPreviewSvg(defs, nodes) {
  const serial = new XMLSerializer();
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  if (defs) svg.appendChild(defs.cloneNode(true));
  const host = document.createElementNS(SVG_NS, 'g');
  let html = '';
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]) html += serial.serializeToString(nodes[i]);
  }
  host.innerHTML = html;
  svg.appendChild(host);
  return svg;
}

export function mountModelPreview(parsed, groupId, spec) {
  const nodes = modelHoldNodes(parsed, groupId, spec);
  if (!nodes.length) return null;
  const svg = mountPreviewSvg(parsed.querySelector('defs'), nodes);
  svg.setAttribute('data-skin', groupId);
  svg.setAttribute('data-layers', spec && spec.group ? 'bottom arm weapon body top' : 'bottom arm body top');
  return svg;
}

function boxInSpace(el, space, svg) {
  let bb = null;
  try {
    bb = el.getBBox();
  } catch (err) {
    bb = null;
  }
  if (!bb || !(bb.width > 0) || !(bb.height > 0)) return null;
  const from = el.getScreenCTM();
  const to = space.getScreenCTM();
  if (!from || !to) return { x: bb.x, y: bb.y, w: bb.width, h: bb.height };
  const into = to.inverse();
  const corners = [
    [bb.x, bb.y],
    [bb.x + bb.width, bb.y],
    [bb.x, bb.y + bb.height],
    [bb.x + bb.width, bb.y + bb.height],
  ];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < corners.length; i++) {
    const point = svg.createSVGPoint();
    point.x = corners[i][0];
    point.y = corners[i][1];
    const placed = point.matrixTransform(from).matrixTransform(into);
    if (placed.x < minX) minX = placed.x;
    if (placed.y < minY) minY = placed.y;
    if (placed.x > maxX) maxX = placed.x;
    if (placed.y > maxY) maxY = placed.y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function unionSpace(a, b) {
  if (!a) return b;
  if (!b) return a;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const right = Math.max(a.x + a.w, b.x + b.w);
  const bottom = Math.max(a.y + a.h, b.y + b.h);
  return { x, y, w: right - x, h: bottom - y };
}

export function cellSnapSvg(parsed, groupName, fill, drawGun) {
  if (!groupName) return null;
  const gun = cloneArtGroup(parsed, groupName);
  if (!gun) return null;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '8');
  svg.setAttribute('height', '8');
  svg.style.position = 'absolute';
  svg.style.left = '-10000px';
  svg.style.top = '0';
  const defs = parsed.querySelector('defs');
  if (defs) svg.appendChild(defs.cloneNode(true));
  const host = document.createElementNS(SVG_NS, 'g');
  host.appendChild(gun);
  svg.appendChild(host);
  document.body.appendChild(svg);
  let cell = null;
  const nodes = gun.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].getAttribute('id') || '';
    if (id.indexOf('SizeView') !== 0) continue;
    cell = unionSpace(cell, boxInSpace(nodes[i], host, svg));
  }
  const gunBox = boxInSpace(gun, host, svg);
  hideMeasures(gun);
  if (!drawGun) gun.remove();
  if (cell) {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(cell.x));
    rect.setAttribute('y', String(cell.y));
    rect.setAttribute('width', String(cell.w));
    rect.setAttribute('height', String(cell.h));
    rect.setAttribute('fill', fill || '#1c2128');
    rect.setAttribute('stroke', '#2a2010');
    rect.setAttribute('stroke-width', '1');
    host.insertBefore(rect, host.firstChild);
  }
  const frame = unionSpace(cell, drawGun ? gunBox : null) || cell || gunBox;
  const pad = 4;
  if (frame && frame.w > 0 && frame.h > 0) {
    svg.setAttribute('viewBox', (frame.x - pad) + ' ' + (frame.y - pad) + ' ' + (frame.w + pad * 2) + ' ' + (frame.h + pad * 2));
  }
  svg.setAttribute('data-snap', 'kept');
  svg.classList.add('is-snap');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.position = '';
  svg.style.left = '';
  svg.style.top = '';
  svg.remove();
  return svg;
}

export function measureSizeViewBox(parsed, groupId) {
  // v2 = union SizeView / SizeView_1..N (Base 3×3 true footprint).
  const key = `sv2:${groupId}`;
  if (sizeViewBoxCache.has(key)) return sizeViewBoxCache.get(key);
  let vb = '-32 -32 64 64';
  const group = parsed ? cloneArtGroup(parsed, groupId) : null;
  if (group) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '128');
    svg.setAttribute('height', '128');
    svg.style.position = 'fixed';
    svg.style.left = '-10000px';
    svg.style.top = '-10000px';
    svg.style.pointerEvents = 'none';
    const defs = parsed.querySelector('defs');
    if (defs) svg.appendChild(defs.cloneNode(true));
    const host = document.createElementNS(SVG_NS, 'g');
    host.appendChild(group);
    svg.appendChild(host);
    document.body.appendChild(svg);
    const probed = probeSizeViews(group, host, svg);
    svg.remove();
    const cell = probed.union;
    if (cell && cell.w > 0 && cell.h > 0) {
      // Keep fabric aspect (W×H); square pad only when nearly square.
      const cx = cell.x + cell.w / 2;
      const cy = cell.y + cell.h / 2;
      vb = `${cell.x} ${cell.y} ${cell.w} ${cell.h}`;
      if (Math.abs(cell.w - cell.h) < 1) {
        const side = Math.max(cell.w, cell.h);
        vb = `${cx - side / 2} ${cy - side / 2} ${side} ${side}`;
      }
    }
  }
  sizeViewBoxCache.set(key, vb);
  return vb;
}

/**
 * Ensures Unit_Template <defs> are mounted once inside the map SVG.
 */
export function ensureMapArtDefs(mapSvg, parsed) {
  if (!parsed) return null;
  const defs = parsed.querySelector('defs');
  if (!defs) return null;
  const clone = document.importNode(defs, true);
  clone.setAttribute('data-unit-art-defs', '1');
  return clone;
}

const pendingPoolBakes = new Set();

function ensurePackPool(pack) {
  if (!pack) return null;
  let pool = getArtPool(pack);
  if (!pool) {
    pool = new Map();
    pack.artPool = pool;
    artPoolByPack.set(pack, pool);
  }
  return pool;
}

/** Lazy-bake missing unit sprite into pool (no SVG draw path). */
export function ensureUnitPoolEntry(pack, doc, unitRecord, onReady) {
  const pool = ensurePackPool(pack);
  if (!pool || !unitRecord) return null;
  const groupId = closedModelGroupId(shownUnitModel(unitRecord)) || 'Default_skin_1';
  const spec = resolveUnitWeaponSpec(doc, unitRecord);
  const wear = resolveActiveWearSpec(doc, unitRecord);
  const key = artPoolKeyUnit(groupId, spec, wear);
  if (pool.has(key)) return pool.get(key);
  if (pendingPoolBakes.has(key)) return null;
  pendingPoolBakes.add(key);
  const parsed = getParsedUnitArt(pack);
  (async () => {
    try {
      if (!parsed) return;
      const nodes = modelHoldNodes(parsed, groupId, spec, pack, wear);
      if (!nodes.length) return;
      const entry = await rasterNodesToEntry(parsed, nodes, groupId, {
        extraDefs: extraDefsForUnitCompose(pack, spec, wear),
      });
      if (entry) pool.set(key, entry);
    } finally {
      pendingPoolBakes.delete(key);
      if (onReady) onReady();
    }
  })();
  return null;
}

/** Lazy-bake missing weapon-only sprite into pool (no SVG draw path). */
export function ensureWeaponPoolEntry(pack, weaponRecord, onReady) {
  const pool = ensurePackPool(pack);
  if (!pool || !weaponRecord) return null;
  const spec = weaponPreviewSpec(weaponRecord);
  if (!spec || !spec.group) return null;
  const key = artPoolKeyWeapon(spec.group);
  if (pool.has(key)) return pool.get(key);
  if (pendingPoolBakes.has(key)) return null;
  pendingPoolBakes.add(key);
  (async () => {
    try {
      const resolved = resolvePreviewArtGroupId(spec.group) || spec.group;
      const gunParsed = getParsedArtForGroup(pack, resolved);
      const gun = cloneWeaponFromPack(pack, resolved);
      if (!gun || !gunParsed) return;
      const entry = await rasterNodesToEntry(gunParsed, [gun], resolved);
      if (entry) pool.set(key, entry);
    } finally {
      pendingPoolBakes.delete(key);
      if (onReady) onReady();
    }
  })();
  return null;
}

/**
 * Weapons tab preview: unit+gun or gun-only (previewHost: unit | empty).
 */
export function ensureWeaponHeldPoolEntry(pack, weaponRecord, onReady) {
  const pool = ensurePackPool(pack);
  if (!pool || !weaponRecord) return null;
  const spec = weaponPreviewSpec(weaponRecord);
  if (!spec || !spec.group) return null;
  const host =
    weaponRecord.previewHost === 'empty' || weaponRecord.previewHost === 'EMPTY'
      ? 'empty'
      : 'unit';
  if (host === 'empty') {
    return ensureWeaponPoolEntry(pack, weaponRecord, onReady);
  }
  const groupId = 'Default_skin_1';
  const key = artPoolKeyUnit(groupId, spec) + '|host:' + host;
  if (pool.has(key)) return pool.get(key);
  if (pendingPoolBakes.has(key)) return null;
  pendingPoolBakes.add(key);
  const parsed = getParsedUnitArt(pack);
  (async () => {
    try {
      if (!parsed) return;
      const nodes = modelHoldNodes(parsed, groupId, spec, pack);
      if (!nodes.length) return;
      const entry = await rasterNodesToEntry(parsed, nodes, groupId, {
        extraDefs: extraDefsForWeaponSpec(pack, spec),
      });
      if (entry) pool.set(key, entry);
    } finally {
      pendingPoolBakes.delete(key);
      if (onReady) onReady();
    }
  })();
  return null;
}

/**
 * Map / tool unit icon — pixel pool only (never draws live SVG).
 */
export function buildUnitMapIcon(parsed, doc, unitRecord, x, y, width, height, pack, onPoolReady) {
  const entry = ensureUnitPoolEntry(pack, doc, unitRecord, onPoolReady);
  if (!entry) return null;
  return poolSpriteImage(entry, x, y, width, height);
}

/**
 * Map / tool structure icon — SAME pool entry as Settings preview (no live SVG).
 */
export function buildStructureMapIcon(parsed, doc, itemRecord, x, y, width, height, pack, onPoolReady) {
  const entry = ensureStructurePoolEntry(pack, doc, itemRecord, onPoolReady);
  if (!entry) {
    const wrap = document.createElementNS(SVG_NS, 'g');
    wrap.setAttribute('class', 'map-structure-icon');
    const swatch = cssColor(recordSwatch(itemRecord));
    const pad = 2;
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', String(x + pad));
    bg.setAttribute('y', String(y + pad));
    bg.setAttribute('width', String(Math.max(8, width - pad * 2)));
    bg.setAttribute('height', String(Math.max(8, height - pad * 2)));
    bg.setAttribute('rx', '3');
    bg.setAttribute('fill', swatch);
    bg.setAttribute('stroke', '#2a2010');
    bg.setAttribute('stroke-width', '2');
    wrap.appendChild(bg);
    return wrap;
  }
  return poolSpriteImage(entry, x, y, width, height);
}

/**
 * Map / tool vehicle icon — SAME pool entry as Settings vehicle composite.
 */
export function buildVehicleMapIcon(parsed, doc, itemRecord, x, y, width, height, pack, onPoolReady) {
  const entry = ensureVehiclePoolEntry(pack, itemRecord, doc, onPoolReady);
  if (!entry) return null;
  return poolSpriteImage(entry, x, y, width, height);
}

function tagPoolEntry(entry, meta) {
  if (!entry || !meta) return entry;
  if (meta.footW != null) entry.footW = meta.footW;
  if (meta.footH != null) entry.footH = meta.footH;
  if (meta.pivots) entry.pivots = meta.pivots;
  if (meta.sizeSide != null) entry.sizeSide = meta.sizeSide;
  if (meta.kind) entry.kind = meta.kind;
  ensureEntryImage(entry);
  return entry;
}

function schedulePoolBake(pool, key, onReady, bakeFn) {
  if (pool.has(key)) return pool.get(key);
  if (pendingPoolBakes.has(key)) return null;
  pendingPoolBakes.add(key);
  (async () => {
    try {
      const entry = await bakeFn();
      if (entry) {
        pool.set(key, entry);
        // Keep gameplay pool in sync — same sprite Settings just composed.
        const game = getGameplayArtPool();
        if (game) game.set(key, entry);
        else mergeIntoGameplayArtPool(new Map([[key, entry]]));
      }
    } finally {
      pendingPoolBakes.delete(key);
      if (onReady) onReady();
    }
  })();
  return null;
}

/** Single closed art group → pixel (Block / Shield / Vest piece alone). */
export function ensureArtGroupPoolEntry(pack, artId, onReady) {
  const pool = ensurePackPool(pack);
  const groupId = resolvePreviewArtGroupId(artId) || artId;
  if (!pool || !groupId) return null;
  const key = artPoolKeyArtGroup(groupId);
  return schedulePoolBake(pool, key, onReady, async () => {
    const parsed = getParsedArtForGroup(pack, groupId);
    const clone = cloneArtGroup(parsed, groupId);
    if (!clone || !parsed) return null;
    hideMeasures(clone);
    return rasterNodesToEntry(parsed, [clone], groupId);
  });
}

/**
 * Block / Turret: Layer1 BlockArt (+ optional Layer2 weapon snapped to Pivot_turrent).
 * Gun keeps authored SizeView scale; one shared weaponId clones to every pivot.
 * Frame expands to footprint W×H SizeViews so Base 3×3 is not a 1-cell box.
 */
export function ensureStructurePoolEntry(pack, doc, itemRecord, onReady) {
  const pool = ensurePackPool(pack);
  if (!pool || !itemRecord) return null;
  const artId = resolveBlockArtId(itemRecord);
  const weapon =
    itemRecord.weaponId ? weaponRecordOf(doc, itemRecord.weaponId) : null;
  const gunGroup = weapon ? resolveMountGunGroup(weapon) : '';
  const fp = itemFootprint(itemRecord);
  const swatchKey = artId || recordSwatch(itemRecord);
  // Gameplay prefers hull-only + live guns (SizeView origin). Settings keeps with-gun.
  const bodyKey = artPoolKeyStructure(swatchKey, '', fp.w, fp.h);
  const key = artPoolKeyStructure(swatchKey, gunGroup, fp.w, fp.h);

  async function bakeStructure(includeGuns) {
    const nodes = [];
    const defsList = [];
    let measureParsed = null;
    let sizeViewId = '';
    let pivots = [];
    let sizeSide = 64;
    let lightLayers = [];
    if (artId) {
      const resolved = resolvePreviewArtGroupId(artId) || artId;
      const blockParsed = getParsedArtForGroup(pack, resolved);
      const block = cloneArtGroup(blockParsed, resolved);
      if (block && blockParsed) {
        pivots = pivotLocalOffsets(block, 'Pivot_turrent');
        if (!pivots.length) pivots = pivotLocalOffsets(block, 'Pivot_Turret');
        const sv = measureSizeViewBox(blockParsed, resolved);
        if (sv && typeof sv === 'string') {
          const parts = sv.split(/\s+/).map(Number);
          if (parts.length >= 4) {
            // Union may be SizeView_1..9 — one cell ≈ union / footprint.
            const uw = Math.max(parts[2], 1);
            const uh = Math.max(parts[3], 1);
            sizeSide = Math.max(uw / fp.w, uh / fp.h, 1);
          }
        }
        lightLayers = extractLightOverlay(block);
        hideMeasures(block);
        nodes.push(block);
        defsList.push(blockParsed.querySelector('defs'));
        measureParsed = blockParsed;
        sizeViewId = resolved;
      }
    }
    if (includeGuns && gunGroup) {
      const gunDefs = defsForArtGroup(pack, gunGroup);
      const spots = pivots.length ? pivots : [{ x: 0, y: 0 }];
      for (let p = 0; p < spots.length; p++) {
        const gun = cloneWeaponFromPack(pack, gunGroup);
        if (!gun) break;
        // scale 1 = authored SizeView; same weaponId at every Pivot_turrent.
        nodes.push(wrapTransformed([gun], 1, spots[p].x, spots[p].y));
      }
      if (gunDefs) defsList.push(gunDefs);
      if (!measureParsed) {
        measureParsed = getParsedArtForGroup(pack, gunGroup);
        sizeViewId = resolvePreviewArtGroupId(gunGroup) || gunGroup;
      }
    }
    // Light on = top overlay play layer.
    for (let i = 0; i < lightLayers.length; i++) {
      nodes.push(lightLayers[i]);
    }
    let entry = null;
    if (!nodes.length) {
      // No artId → color foot only (data-driven; no invented Block_*).
      const host = document.createElementNS(SVG_NS, 'g');
      const bg = document.createElementNS(SVG_NS, 'rect');
      bg.setAttribute('x', '0');
      bg.setAttribute('y', '0');
      bg.setAttribute('width', String(64 * fp.w));
      bg.setAttribute('height', String(64 * fp.h));
      bg.setAttribute('fill', cssColor(recordSwatch(itemRecord)));
      host.appendChild(bg);
      const unitParsed = getParsedUnitArt(pack);
      if (!unitParsed) return null;
      entry = await rasterNodesToEntry(unitParsed, [host], '', { footprint: fp });
    } else {
      entry = await rasterNodesToEntry(measureParsed, nodes, sizeViewId, {
        extraDefs: defsList.filter((d) => d && d !== measureParsed.querySelector('defs')),
        footprint: fp,
      });
    }
    return tagPoolEntry(entry, {
      footW: fp.w,
      footH: fp.h,
      pivots: pivots.slice(),
      sizeSide: sizeSide,
      kind: 'structure',
      bakedGuns: !!includeGuns && !!gunGroup,
    });
  }

  // Always ensure hull-only sprite for live Pivot_turrent layering.
  if (gunGroup && bodyKey !== key) {
    schedulePoolBake(pool, bodyKey, null, () => bakeStructure(false));
  }

  return schedulePoolBake(pool, key, onReady, () => bakeStructure(!!gunGroup));
}

/** Copy Arm_1 / Arm_2 transforms from a source group onto Vest arm nodes. */
function applyVestArmTransformsFrom(wear, sourceRoot) {
  if (!wear || !sourceRoot) return;
  const pose = { 1: '', 2: '' };
  const srcNodes = sourceRoot.querySelectorAll('[id]');
  for (let i = 0; i < srcNodes.length; i++) {
    const id = String(srcNodes[i].getAttribute('id') || '').replace(/(_FL)+$/g, '');
    if (/^Arm_1$/i.test(id) || /^Asset_Arm_1$/i.test(id)) {
      pose[1] = srcNodes[i].getAttribute('transform') || '';
    } else if (/^Arm_2$/i.test(id) || /^Asset_Arm_2$/i.test(id)) {
      pose[2] = srcNodes[i].getAttribute('transform') || '';
    }
  }
  const wearNodes = wear.querySelectorAll('[id]');
  for (let i = 0; i < wearNodes.length; i++) {
    const id = String(wearNodes[i].getAttribute('id') || '').replace(/(_FL)+$/g, '');
    let which = 0;
    if (/^Arm_1/i.test(id) || /^Asset_Arm_1/i.test(id)) which = 1;
    else if (/^Arm_2/i.test(id) || /^Asset_Arm_2/i.test(id)) which = 2;
    if (!which || !pose[which]) continue;
    wearNodes[i].setAttribute('transform', pose[which]);
  }
}

/** Copy idle Arm_1 / Arm_2 transforms from skin onto Vest arm nodes. */
function applyVestArmIdleFromSkin(wear, unitParsed, skinId) {
  if (!wear || !unitParsed) return;
  const skin = cloneArtGroup(unitParsed, skinId);
  if (!skin) return;
  applyVestArmTransformsFrom(wear, skin);
}

function cloneWearArt(pack, artId) {
  if (!pack || !artId) return { node: null, defs: null };
  const wearParsed = getParsedArtForGroup(pack, artId);
  const node = cloneArtGroup(wearParsed, artId);
  if (node) hideMeasures(node);
  return {
    node,
    defs: wearParsed ? wearParsed.querySelector('defs') : null,
  };
}

/**
 * Wear composite: Vest follows arm pose; Helmet/Top on top layer; Shield overlays unit.
 */
export function composeWearHoldNodes(pack, itemRecord) {
  const artId = resolvePreviewArtGroupId(itemRecord.artId) || itemRecord.artId || '';
  if (!artId) return null;
  const skinId = 'Default_skin_1';
  const unitParsed = getParsedUnitArt(pack);
  if (!unitParsed) return null;
  const wearParsed = getParsedArtForGroup(pack, artId);
  const wear = cloneArtGroup(wearParsed, artId);
  const defsList = [];
  if (wearParsed) defsList.push(wearParsed.querySelector('defs'));

  const isVest = /^Asset_Arm_Vest/i.test(artId);
  const isTop = /^Asset_Top_/i.test(artId);

  if (isVest && wear) {
    // Wear = equip over arms (do not replace skin arms). Vest follows idle Arm transforms.
    hideMeasures(wear);
    applyVestArmIdleFromSkin(wear, unitParsed, skinId);
    const bottom = cloneArtGroup(unitParsed, skinId);
    const arms = cloneArtGroup(unitParsed, skinId);
    const body = cloneArtGroup(unitParsed, skinId);
    const top = cloneArtGroup(unitParsed, skinId);
    if (bottom) filterSkinLayer(bottom, 'assetBottom');
    if (arms) filterSkinLayer(arms, 'arms');
    if (body) filterSkinLayer(body, 'body');
    if (top) filterSkinLayer(top, 'assetTop');
    const nodes = [];
    if (bottom) nodes.push(bottom);
    if (arms) nodes.push(arms);
    nodes.push(wear);
    if (body) nodes.push(body);
    if (top) nodes.push(top);
    return { nodes, defsList, skinId, unitParsed };
  }

  const nodes = modelHoldNodes(unitParsed, skinId, null, pack);
  if (wear) {
    hideMeasures(wear);
    if (isTop) nodes.push(wear);
    else nodes.push(wear);
  }
  return { nodes, defsList, skinId, unitParsed };
}

/**
 * Item wear: Layer1 Unit skin + Layer2 vest/helmet/shield art.
 */
export function ensureWearPoolEntry(pack, itemRecord, onReady) {
  const pool = ensurePackPool(pack);
  if (!pool || !itemRecord) return null;
  const artId = resolvePreviewArtGroupId(itemRecord.artId) || itemRecord.artId || '';
  if (!artId) return null;
  const skinId = 'Default_skin_1';
  const key = artPoolKeyWear(skinId, artId);
  return schedulePoolBake(pool, key, onReady, async () => {
    const composed = composeWearHoldNodes(pack, itemRecord);
    if (!composed || !composed.nodes.length) return null;
    return rasterNodesToEntry(composed.unitParsed, composed.nodes, composed.skinId, {
      extraDefs: composed.defsList,
    });
  });
}

/**
 * Build vehicle layer nodes for Settings bake.
 * Seat = snap of startUnitDriven only when set (with active wear) — not a hardcoded ghost.
 * Turrets parented at Pivot_turrent local (same +Y art space as hull).
 */
export function composeVehicleLayerNodes(pack, record, doc) {
  const artId = record && typeof record.artId === 'string' ? record.artId.trim() : '';
  if (!artId) return null;
  const drivenId =
    record && typeof record.startUnitDriven === 'string'
      ? record.startUnitDriven.trim()
      : '';
  const hullId = vehicleStateArtGroupId(artId, 'Driven');
  const vehicleParsed = getParsedArtForGroup(pack, hullId);
  if (!vehicleParsed) return null;
  const hull = cloneArtGroup(vehicleParsed, hullId);
  if (!hull) return null;

  const seat = pivotLocalOffset(hull, 'Pivot_Unit') || { x: 0, y: 0 };
  let turrets = pivotLocalOffsets(hull, 'Pivot_turrent');
  if (!turrets.length) turrets = pivotLocalOffsets(hull, 'Pivot_Turret');
  if (!turrets.length) turrets = [{ x: 0, y: 0 }];
  const lightLayers = extractLightOverlay(hull);
  hideMeasures(hull);

  const layers = [hull];
  const defsList = [vehicleParsed.querySelector('defs')];

  let skinId = '-';
  let wearKey = '-';
  const unitRecord =
    drivenId && doc && doc.units ? doc.units[drivenId] : null;
  if (unitRecord) {
    skinId = closedModelGroupId(shownUnitModel(unitRecord)) || 'Default_skin_1';
    const wear = resolveActiveWearSpec(doc, unitRecord);
    wearKey =
      (wear.vestArt || '-') +
      '/' +
      (wear.topArt || '-') +
      '/' +
      (wear.shieldArt || '-');
    const unitParsed = getParsedUnitArt(pack);
    if (unitParsed) {
      const unitNodes = modelHoldNodes(unitParsed, skinId, null, pack, wear);
      if (unitNodes.length) {
        layers.push(wrapTransformed(unitNodes, 1, seat.x, seat.y));
        defsList.push(unitParsed.querySelector('defs'));
        const wearDefs = extraDefsForUnitCompose(pack, null, wear);
        for (let d = 0; d < wearDefs.length; d++) {
          if (wearDefs[d]) defsList.push(wearDefs[d]);
        }
      }
    }
  }

  const weapon =
    record && record.weaponId ? weaponRecordOf(doc, record.weaponId) : null;
  const gunGroup = weapon ? resolveMountGunGroup(weapon) : '';
  if (gunGroup) {
    // Parent guns to each Pivot_turrent in hull local space (authored +Y).
    for (let t = 0; t < turrets.length; t++) {
      const gun = cloneWeaponFromPack(pack, gunGroup);
      if (!gun) break;
      layers.push(wrapTransformed([gun], 1, turrets[t].x, turrets[t].y));
    }
    const gunDefs = defsForArtGroup(pack, gunGroup);
    if (gunDefs) defsList.push(gunDefs);
  }

  for (let i = 0; i < lightLayers.length; i++) {
    layers.push(lightLayers[i]);
  }

  return {
    artId,
    hullId,
    skinId,
    wearKey,
    gunGroup,
    layers,
    defsList,
    vehicleParsed,
    turretPivots: turrets.slice(),
  };
}

/**
 * Vehicle: hull + unit + weapon → one pixel sprite (fixes live-SVG scale blowup).
 */
export function ensureVehiclePoolEntry(pack, record, doc, onReady) {
  const pool = ensurePackPool(pack);
  if (!pool || !record) return null;
  const composed = composeVehicleLayerNodes(pack, record, doc);
  if (!composed) return null;
  const key = artPoolKeyVehicle(
    composed.artId,
    composed.skinId + '|' + (composed.wearKey || '-'),
    composed.gunGroup
  );
  return schedulePoolBake(pool, key, onReady, async () => {
    const again = composeVehicleLayerNodes(pack, record, doc);
    if (!again || !again.layers.length) return null;
    const entry = await rasterNodesToEntry(again.vehicleParsed, again.layers, again.hullId, {
      extraDefs: again.defsList.filter(
        (d) => d && d !== again.vehicleParsed.querySelector('defs')
      ),
    });
    return tagPoolEntry(entry, {
      footW: 1,
      footH: 1,
      pivots: again.turretPivots || [],
      kind: 'vehicle',
    });
  });
}

/**
 * One compose for Map / Trail / Settings: Layer1 SizeView footprint + Layer2 gun.
 * Measures sync (offscreen). Gun keeps authored scale; overflow expands the frame.
 * @returns {{ host: SVGGElement, cell: {x:number,y:number,w:number,h:number}, content: {x:number,y:number,w:number,h:number}|null, defs: Element|null } | null}
 */
export function composeStructureLayers(parsed, doc, itemRecord, pack) {
  const swatch = cssColor(recordSwatch(itemRecord));
  const fp = itemFootprint(itemRecord);
  const artId = resolveBlockArtId(itemRecord);
  const weapon =
    itemRecord && itemRecord.weaponId ? weaponRecordOf(doc, itemRecord.weaponId) : null;
  const gunGroup = weapon ? resolveMountGunGroup(weapon) : '';

  const host = document.createElementNS(SVG_NS, 'g');
  host.setAttribute('class', 'structure-layers');

  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('class', 'structure-foot');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', String(64 * fp.w));
  bg.setAttribute('height', String(64 * fp.h));
  bg.setAttribute('rx', '3');
  bg.setAttribute('fill', swatch);
  bg.setAttribute('stroke', '#2a2010');
  bg.setAttribute('stroke-width', '2');
  host.appendChild(bg);

  let defs = null;
  let measureDoc = parsed || null;
  let pivots = [];
  let lightLayers = [];

  if (artId && pack) {
    const resolved = resolvePreviewArtGroupId(artId) || artId;
    const blockParsed = getParsedArtForGroup(pack, resolved);
    const block = cloneArtGroup(blockParsed, resolved);
    if (block && blockParsed) {
      pivots = pivotLocalOffsets(block, 'Pivot_turrent');
      if (!pivots.length) pivots = pivotLocalOffsets(block, 'Pivot_Turret');
      lightLayers = extractLightOverlay(block);
      hideMeasures(block);
      host.appendChild(block);
      const srcDefs = blockParsed.querySelector('defs');
      if (srcDefs) defs = srcDefs.cloneNode(true);
      measureDoc = blockParsed;
    }
  }

  if (gunGroup && pack) {
    const spots = pivots.length ? pivots : [{ x: 0, y: 0 }];
    for (let p = 0; p < spots.length; p++) {
      const gun = cloneWeaponFromPack(pack, gunGroup);
      if (!gun) break;
      gun.setAttribute('class', 'structure-gun');
      host.appendChild(wrapTransformed([gun], 1, spots[p].x, spots[p].y));
    }
    const gunDefs = defsForArtGroup(pack, gunGroup);
    if (gunDefs) {
      if (!defs) defs = gunDefs.cloneNode(true);
      else {
        const kids = gunDefs.childNodes;
        for (let k = 0; k < kids.length; k++) defs.appendChild(kids[k].cloneNode(true));
      }
    }
  } else if (gunGroup && measureDoc) {
    const gun = weaponCloneWithSizeView(measureDoc, gunGroup);
    if (gun) {
      gun.setAttribute('class', 'structure-gun');
      host.appendChild(gun);
    }
  }

  for (let i = 0; i < lightLayers.length; i++) {
    host.appendChild(lightLayers[i]);
  }

  const metrics = measureStructureHost(measureDoc, host, defs);
  let cell = metrics.cell || { x: 0, y: 0, w: 64, h: 64 };
  // Multi SizeView_1..N (Base 3×3) = authored true size; don't multiply footprint again.
  if ((metrics.sizeCount || 0) <= 1) {
    cell = expandCellForFootprint(cell, fp) || cell;
  }
  bg.setAttribute('x', String(cell.x));
  bg.setAttribute('y', String(cell.y));
  bg.setAttribute('width', String(cell.w));
  bg.setAttribute('height', String(cell.h));
  hideMeasures(host);

  const content = metrics.content || cell;
  return { host, cell, content, defs };
}

function measureStructureHost(artDoc, host, defsClone) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '256');
  svg.setAttribute('height', '256');
  svg.style.position = 'fixed';
  svg.style.left = '-10000px';
  svg.style.top = '-10000px';
  svg.style.pointerEvents = 'none';
  if (defsClone) svg.appendChild(defsClone.cloneNode(true));
  else if (artDoc) {
    const defs = artDoc.querySelector('defs');
    if (defs) svg.appendChild(defs.cloneNode(true));
  }
  svg.appendChild(host);
  document.body.appendChild(svg);

  const probed = probeSizeViews(host, host, svg);
  // Probe content while SizeView still visible so bbox is stable; caller hides after.
  let content = null;
  try {
    content = boxInSpace(host, host, svg);
  } catch (_) {
    content = null;
  }
  svg.remove();
  // host was moved into temp svg — re-attach responsibility is caller's (still referenced).
  return { cell: probed.union, content, sizeCount: probed.count, oneSide: probed.oneSide };
}

/**
 * Inspector structure preview — same compose as map icons.
 */
export function mountStructurePreviewSvg(pack, doc, itemRecord) {
  const artDoc = pack ? getParsedUnitArt(pack) : null;
  const composed = composeStructureLayers(artDoc, doc, itemRecord, pack);
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('overflow', 'visible');
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.classList.add('editor-preview-structure');

  if (!composed) {
    svg.setAttribute('viewBox', '0 0 64 64');
    return svg;
  }
  if (composed.defs) svg.appendChild(composed.defs);
  svg.appendChild(composed.host);

  // Frame = union of SizeView foot + gun overflow (Unit-style expand, no gun rescale).
  const cell = composed.cell;
  const content = composed.content;
  let frame = cell;
  if (content && content.w > 0 && content.h > 0) {
    frame = unionSpace(cell, content) || cell;
  }
  // After hideMeasures, re-measure content once attached for accurate gun overflow.
  const pad = 4;
  svg.setAttribute(
    'viewBox',
    frame.x - pad + ' ' + (frame.y - pad) + ' ' + (frame.w + pad * 2) + ' ' + (frame.h + pad * 2)
  );
  requestAnimationFrame(() => {
    if (!svg.isConnected) return;
    let box = null;
    try {
      box = composed.host.getBBox();
    } catch (_) {
      box = null;
    }
    if (box && box.width > 0 && box.height > 0) {
      svg.setAttribute(
        'viewBox',
        box.x - pad + ' ' + (box.y - pad) + ' ' + (box.width + pad * 2) + ' ' + (box.height + pad * 2)
      );
    }
  });
  return svg;
}

/**
 * Bottom-tray tool thumb — pixel pool only (same entry as Settings).
 */
export function renderTemplateThumb(container, doc, pack, kind, templateId, onPoolReady) {
  if (!container) return;
  container.replaceChildren();
  if (!doc || !templateId) return;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('overflow', 'visible');
  svg.setAttribute('shape-rendering', 'crispEdges');
  const refresh = () => {
    if (onPoolReady) onPoolReady();
    else renderTemplateThumb(container, doc, pack, kind, templateId);
  };
  const itemDef = doc.items && doc.items[templateId];
  const vehicleAsUnit =
    kind === 'unit' &&
    itemDef &&
    (itemDef.kind === 'VEHICLE' ||
      itemDef.isVehicle ||
      /^Vehicle_/i.test(String(itemDef.artId || '')));
  if (kind === 'unit' && !vehicleAsUnit) {
    const unitDef = (doc.units && doc.units[templateId]) || { id: templateId };
    const icon = buildUnitMapIcon(null, doc, unitDef, 12, 12, 40, 40, pack, refresh);
    if (icon) svg.appendChild(icon);
  } else {
    const def = itemDef || { id: templateId };
    const isVehicle =
      def &&
      (def.kind === 'VEHICLE' ||
        def.isVehicle ||
        /^Vehicle_/i.test(String(def.artId || '')));
    const fp = itemFootprint(def);
    const maxDim = Math.max(1, fp.w, fp.h);
    const box = 48;
    const w = (fp.w / maxDim) * box;
    const h = (fp.h / maxDim) * box;
    const ox = (64 - w) / 2;
    const oy = (64 - h) / 2;
    const icon = isVehicle
      ? buildVehicleMapIcon(null, doc, def, ox, oy, w, h, pack, refresh)
      : buildStructureMapIcon(null, doc, def, ox, oy, w, h, pack, refresh);
    if (icon) svg.appendChild(icon);
  }
  container.appendChild(svg);
}

export function artPoolKeyUnit(groupId, spec, wear) {
  const hold = (spec && spec.hold) || '-';
  const gun = (spec && spec.group) || '-';
  const vest = (wear && wear.vestArt) || '-';
  const top = (wear && wear.topArt) || '-';
  const shield = (wear && wear.shieldArt) || '-';
  // u3 = unit + ItemHold weapon + active loadout wear (vest/helmet/shield).
  return (
    'u3:' +
    (groupId || '') +
    '|' +
    hold +
    '|' +
    gun +
    '|V:' +
    vest +
    '|T:' +
    top +
    '|S:' +
    shield
  );
}

export function artPoolKeyWeapon(groupName) {
  return 'w2:' + (groupName || '');
}

export function artPoolKeyArtGroup(groupId) {
  return 'g:' + (groupId || '');
}

export function artPoolKeyStructure(artId, weaponGroup, footW, footH) {
  return sharedArtPoolKeyStructure(artId, weaponGroup, footW, footH);
}

export function artPoolKeyWear(skinId, artId) {
  // wear4 = vest worn over skin arms
  return 'wear4:' + (skinId || 'Default_skin_1') + '|' + (artId || '');
}

export function artPoolKeyVehicle(artId, skinId, weaponGroup) {
  return sharedArtPoolKeyVehicle(artId, skinId, weaponGroup);
}

export function getArtPool(pack) {
  if (!pack) return null;
  if (pack.artPool) return pack.artPool;
  return artPoolByPack.get(pack) || null;
}

/**
 * Draw pool sprite as pixel rects (not <image>) so map viewBox zoom stays blocky.
 * Footprint-aware: one SizeView (cellSize) maps to width/footW world units.
 */
export function poolSpriteImage(entry, x, y, width, height) {
  if (!entry) return null;
  const pixels = entry.pixels;
  const fw = entry.frameW | 0;
  const fh = entry.frameH | 0;
  if (!pixels || !fw || !fh) return null;

  const cell = entry.cellSize || ART_POOL_PIXEL;
  const footW = Math.max(1, entry.footW != null ? entry.footW | 0 : 1);
  const footH = Math.max(1, entry.footH != null ? entry.footH | 0 : 1);
  const cellWorld = Math.min(width / footW, height / footH);
  const scale = cellWorld / cell;
  const drawW = fw * scale;
  const drawH = fh * scale;
  const ox = x + width / 2 - drawW / 2;
  const oy = y + height / 2 - drawH / 2;

  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', 'map-art-pool');
  g.setAttribute('shape-rendering', 'crispEdges');

  for (let py = 0; py < fh; py++) {
    let runX = -1;
    let runR = 0;
    let runG = 0;
    let runB = 0;
    const flush = (endX) => {
      if (runX < 0) return;
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(ox + runX * scale));
      rect.setAttribute('y', String(oy + py * scale));
      rect.setAttribute('width', String((endX - runX) * scale));
      rect.setAttribute('height', String(scale));
      rect.setAttribute('fill', 'rgb(' + runR + ',' + runG + ',' + runB + ')');
      g.appendChild(rect);
      runX = -1;
    };
    for (let px = 0; px < fw; px++) {
      const i = (py * fw + px) * 4;
      const a = pixels[i + 3];
      if (a < 128) {
        flush(px);
        continue;
      }
      const r = pixels[i];
      const gre = pixels[i + 1];
      const b = pixels[i + 2];
      if (runX < 0) {
        runX = px;
        runR = r;
        runG = gre;
        runB = b;
      } else if (r !== runR || gre !== runG || b !== runB) {
        flush(px);
        runX = px;
        runR = r;
        runG = gre;
        runB = b;
      }
    }
    flush(fw);
  }
  return g.childNodes.length ? g : null;
}

/** HTML img for inspector Trail / settings preview — fills the preview box. */
export function mountPoolPreview(entry) {
  if (!entry || !entry.dataUrl) return null;
  const img = document.createElement('img');
  img.src = entry.dataUrl;
  img.alt = '';
  img.className = 'editor-pool-sprite';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'contain';
  img.style.display = 'block';
  img.style.margin = '0 auto';
  return img;
}

export function lookupUnitPoolEntry(pack, doc, unitRecord) {
  const pool = getArtPool(pack);
  if (!pool || !unitRecord) return null;
  const groupId = closedModelGroupId(shownUnitModel(unitRecord)) || 'Default_skin_1';
  const spec = resolveUnitWeaponSpec(doc, unitRecord);
  const wear = resolveActiveWearSpec(doc, unitRecord);
  return pool.get(artPoolKeyUnit(groupId, spec, wear)) || null;
}

export function lookupWeaponPoolEntry(pack, weaponRecord) {
  const pool = getArtPool(pack);
  if (!pool || !weaponRecord) return null;
  const spec = weaponPreviewSpec(weaponRecord);
  return (spec && spec.group && pool.get(artPoolKeyWeapon(spec.group))) || null;
}

function yieldPaint() {
  return sharedYieldPaint();
}

/**
 * Probe SizeView / SizeView_1..N inside a group.
 * @returns {{ union: object|null, oneSide: number, count: number }}
 */
function probeSizeViews(measureRoot, host, svg) {
  let union = null;
  let oneSide = 0;
  let count = 0;
  if (!measureRoot) return { union, oneSide, count };
  const nodes = measureRoot.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].getAttribute('id') || '';
    if (!isSizeViewId(id)) continue;
    const box = boxInSpace(nodes[i], host, svg);
    if (!box || !(box.w > 0) || !(box.h > 0)) continue;
    count += 1;
    union = unionSpace(union, box);
    // One cell = max side of a single SizeView glyph (not the multi-cell union).
    oneSide = Math.max(oneSide, box.w, box.h);
  }
  return { union, oneSide, count };
}

function measureMountedArt(parsed, nodes, sizeViewGroupId, extraDefs, footprint) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '256');
  svg.setAttribute('height', '256');
  svg.style.position = 'fixed';
  svg.style.left = '-10000px';
  svg.style.top = '-10000px';
  svg.style.pointerEvents = 'none';
  const defsList = [(parsed && parsed.querySelector('defs'))].concat(extraDefs || []);
  svg.appendChild(mergeDefs(defsList));
  const host = document.createElementNS(SVG_NS, 'g');
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]) host.appendChild(nodes[i]);
  }
  svg.appendChild(host);
  document.body.appendChild(svg);

  // SizeView lives on the raw group; layered clones hide it — probe separately.
  let probe = { union: null, oneSide: 0, count: 0 };
  if (sizeViewGroupId) {
    const measureRoot = cloneArtGroup(parsed, sizeViewGroupId);
    if (measureRoot) {
      const wrap = document.createElementNS(SVG_NS, 'g');
      wrap.setAttribute('opacity', '0');
      wrap.appendChild(measureRoot);
      host.appendChild(wrap);
      probe = probeSizeViews(measureRoot, host, svg);
      wrap.remove();
    }
  }

  hideMeasures(host);
  const content = boxInSpace(host, host, svg);
  svg.remove();

  const fallbackSide = 64;
  let cx = 0;
  let cy = 0;
  // cellSide = ONE SizeView (guns stay 1:1).
  let cellSide = probe.oneSide > 0 ? probe.oneSide : fallbackSide;
  let footCell = probe.union;

  if (footCell && footCell.w > 0 && footCell.h > 0) {
    cx = footCell.x + footCell.w / 2;
    cy = footCell.y + footCell.h / 2;
    // Base SizeView_1..9 already authored as true W×H — do not multiply footprint again.
    // Only invent expansion when art has a single SizeView but pack footprint is larger.
    if (probe.count <= 1 && footprint) {
      const one = {
        x: cx - cellSide / 2,
        y: cy - cellSide / 2,
        w: cellSide,
        h: cellSide,
      };
      footCell = expandCellForFootprint(one, footprint) || footCell;
      cx = footCell.x + footCell.w / 2;
      cy = footCell.y + footCell.h / 2;
    }
  } else if (content && content.w > 0 && content.h > 0) {
    cx = content.x + content.w / 2;
    cy = content.y + content.h / 2;
    if (footprint) {
      footCell = expandCellForFootprint(
        { x: cx - cellSide / 2, y: cy - cellSide / 2, w: cellSide, h: cellSide },
        footprint
      );
      if (footCell) {
        cx = footCell.x + footCell.w / 2;
        cy = footCell.y + footCell.h / 2;
      }
    }
  }

  // Frame may be rectangular (fabric footprint); bake uses max side as square pad.
  let frameSide = cellSide;
  if (footCell && footCell.w > 0 && footCell.h > 0) {
    frameSide = Math.max(frameSide, footCell.w, footCell.h);
  }
  if (content && content.w > 0 && content.h > 0) {
    const left = cx - content.x;
    const right = content.x + content.w - cx;
    const top = cy - content.y;
    const bottom = content.y + content.h - cy;
    const need = Math.max(left, right, top, bottom) * 2;
    if (need > frameSide) frameSide = need;
  }
  frameSide += Math.max(2, cellSide * 0.04);

  return { cx, cy, cellSide, frameSide, footCell };
}

async function rasterNodesToEntry(parsed, nodes, sizeViewGroupId, opts) {
  if (!nodes || !nodes.length) return null;
  const extraDefs = (opts && opts.extraDefs) || [];
  const footprint = (opts && opts.footprint) || null;
  // Fresh clones — measureMountedArt consumes/moves nodes into temp SVG.
  const fresh = [];
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]) fresh.push(nodes[i].cloneNode(true));
  }
  const metrics = measureMountedArt(
    parsed,
    fresh,
    sizeViewGroupId,
    extraDefs,
    footprint
  );
  if (!metrics || !(metrics.frameSide > 0) || !(metrics.cellSide > 0)) return null;

  const framePx = Math.max(
    ART_POOL_PIXEL,
    Math.ceil((metrics.frameSide / metrics.cellSide) * ART_POOL_PIXEL)
  );
  const hiPx = framePx * 2;
  const viewBox =
    metrics.cx -
    metrics.frameSide / 2 +
    ' ' +
    (metrics.cy - metrics.frameSide / 2) +
    ' ' +
    metrics.frameSide +
    ' ' +
    metrics.frameSide;

  const drawNodes = [];
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]) drawNodes.push(nodes[i].cloneNode(true));
  }
  const defsList = [(parsed && parsed.querySelector('defs'))].concat(extraDefs);
  const svg = mountPreviewSvg(mergeDefs(defsList), drawNodes);
  hideMeasures(svg);
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('width', String(hiPx));
  svg.setAttribute('height', String(hiPx));
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('shape-rendering', 'crispEdges');

  const xml = new XMLSerializer().serializeToString(svg);
  return rasterSvgXmlToEntry(xml, framePx);
}

function packSheetMap(pack, key) {
  const raw = pack && pack[key];
  if (!raw || typeof raw !== 'object') return {};
  if (raw[key] && typeof raw[key] === 'object') return raw[key];
  return raw;
}

function collectWeaponGroups(pack) {
  const seen = {};
  const out = [];
  const add = (name) => {
    if (!name || seen[name]) return;
    seen[name] = true;
    out.push(name);
  };
  const weapons = packSheetMap(pack, 'weapons');
  const wids = Object.keys(weapons);
  for (let i = 0; i < wids.length; i++) {
    if (weapons[wids[i]] && weapons[wids[i]].pending) continue;
    add(shownWeaponModel(weapons[wids[i]]));
  }
  if (!out.length) add('Weapon_Colt_1911');
  return out;
}

function collectUnitJobs(pack, skins, weaponGroups) {
  const jobs = [];
  const seen = {};
  const add = (groupId, spec, wear) => {
    const key = artPoolKeyUnit(groupId, spec, wear);
    if (seen[key]) return;
    seen[key] = true;
    jobs.push({ key, groupId, spec, wear: wear || null });
  };
  const holds = ['hold_Gun', 'hold_Gun_2'];
  for (let s = 0; s < skins.length; s++) {
    const groupId = skins[s];
    add(groupId, null, null);
    for (let h = 0; h < holds.length; h++) {
      for (let g = 0; g < weaponGroups.length; g++) {
        add(groupId, { hold: holds[h], group: weaponGroups[g] }, null);
      }
    }
  }
  const docLite = {
    weapons: packSheetMap(pack, 'weapons'),
    items: packSheetMap(pack, 'items'),
    units: packSheetMap(pack, 'units'),
  };
  const units = docLite.units;
  const uids = Object.keys(units);
  for (let i = 0; i < uids.length; i++) {
    const record = units[uids[i]];
    if (!record || record.pending) continue;
    const groupId = closedModelGroupId(shownUnitModel(record)) || 'Default_skin_1';
    add(
      groupId,
      resolveUnitWeaponSpec(docLite, record),
      resolveActiveWearSpec(docLite, record)
    );
  }
  return jobs;
}

/**
 * Bake SVG → lineless pixel-art pool during the loading screen.
 * - Weapons / unit composites: single entry (editor map + Trail thumbs)
 * - Unit layers (body/arm/top/bottom): separate keys so gameplay can animate with matrices
 */
export async function buildArtPool(pack, onProgress) {
  const parsed = getParsedUnitArt(pack);
  const pool = new Map();
  // Bind early so ensure*PoolEntry bakes into THIS map (Settings = one source).
  pack.artPool = pool;
  artPoolByPack.set(pack, pool);
  if (!parsed) {
    mergeIntoGameplayArtPool(pool);
    return pool;
  }

  const skins = listClosedModelGroupIds();
  const weaponGroups = collectWeaponGroups(pack);
  const unitJobs = collectUnitJobs(pack, skins, weaponGroups);
  const layerKinds = ['assetBottom', 'arms', 'body', 'assetTop'];
  const total = unitJobs.length + weaponGroups.length + skins.length * layerKinds.length;
  let done = 0;

  const report = (label) => {
    if (onProgress) onProgress(label, done, total);
  };

  for (let i = 0; i < weaponGroups.length; i++) {
    const group = weaponGroups[i];
    report('Building art pool · weapons ' + (i + 1) + '/' + weaponGroups.length);
    const resolved = resolvePreviewArtGroupId(group) || group;
    const gunParsed = getParsedArtForGroup(pack, resolved) || parsed;
    const gun = cloneWeaponFromPack(pack, resolved) || weaponClone(parsed, resolved);
    if (gun && gunParsed) {
      const entry = await rasterNodesToEntry(gunParsed, [gun], resolved);
      if (entry) pool.set(artPoolKeyWeapon(group), entry);
    }
    done += 1;
    if (i % 2 === 1) await yieldPaint();
  }

  for (let s = 0; s < skins.length; s++) {
    const groupId = skins[s];
    report('Building art pool · layers ' + groupId);
    for (let k = 0; k < layerKinds.length; k++) {
      const kind = layerKinds[k];
      const clone = cloneArtGroup(parsed, groupId);
      if (clone) {
        filterSkinLayer(clone, kind);
        const layerKey =
          kind === 'arms'
            ? artPoolKeyLayer('armComposite', groupId)
            : artPoolKeyLayer(kind, groupId);
        const entry = await rasterNodesToEntry(parsed, [clone], groupId);
        if (entry) pool.set(layerKey, entry);
      }
      done += 1;
    }
    await yieldPaint();
  }

  for (let i = 0; i < unitJobs.length; i++) {
    const job = unitJobs[i];
    report('Building art pool · units ' + (i + 1) + '/' + unitJobs.length);
    if (pool.has(job.key)) {
      done += 1;
      continue;
    }
    const nodes = modelHoldNodes(parsed, job.groupId, job.spec, pack, job.wear);
    if (nodes.length) {
      const entry = await rasterNodesToEntry(parsed, nodes, job.groupId, {
        extraDefs: extraDefsForUnitCompose(pack, job.spec, job.wear),
      });
      if (entry) pool.set(job.key, entry);
    }
    done += 1;
    if (i % 2 === 1) await yieldPaint();
  }

  // Placeable composites — same entries Settings / Trail / Tools / map / gameplay use.
  const items = packSheetMap(pack, 'items');
  const itemIds = Object.keys(items);
  const docLite = {
    weapons: packSheetMap(pack, 'weapons'),
    items: items,
    units: packSheetMap(pack, 'units'),
  };
  function waitBake(getHit) {
    return new Promise((resolve) => {
      const hit = getHit(resolve);
      if (hit) resolve(hit);
    });
  }
  function isWearArtId(artId) {
    return /^Asset_Arm_Vest|^Asset_Top_|^Item_shiled/i.test(String(artId || ''));
  }
  function isWearItem(record) {
    if (!record) return false;
    // ARMOR (Vest/Helmet) + SHIELD are wear — never structure/placeable bake.
    if (record.kind === 'ARMOR' || record.kind === 'SHIELD') return true;
    return isWearArtId(record.artId);
  }

  for (let i = 0; i < itemIds.length; i++) {
    const record = items[itemIds[i]];
    if (!record || record.pending) continue;
    const isVehicle =
      record.kind === 'VEHICLE' ||
      record.isVehicle ||
      /^Vehicle_/i.test(String(record.artId || ''));
    report(
      'Building art pool · placeables ' + (i + 1) + '/' + itemIds.length
    );
    if (isVehicle) {
      await waitBake((done) => ensureVehiclePoolEntry(pack, record, docLite, done));
    } else if (isWearItem(record) && record.artId) {
      // Wear BEFORE structure — artId alone used to send Helmet/Vest into empty foot bake.
      await waitBake((done) => ensureWearPoolEntry(pack, record, done));
    } else if (
      record.kind === 'PLACEABLE' ||
      record.weaponId ||
      record.isTurret ||
      record.isDefeatCondition ||
      (record.artId && !isWearItem(record))
    ) {
      await waitBake((done) => ensureStructurePoolEntry(pack, docLite, record, done));
    }
    if (i % 2 === 1) await yieldPaint();
  }

  // Gameplay draws the same sprites Settings baked.
  mergeIntoGameplayArtPool(pool);
  report('Art pool ready · ' + pool.size + ' sprites');
  return pool;
}

export { artPoolKeyLayer };

/** Lookup structure composite (Settings key) from pack or gameplay pool. */
export function lookupStructurePoolEntry(pack, doc, itemRecord) {
  const artId = resolveBlockArtId(itemRecord);
  const weapon =
    itemRecord && itemRecord.weaponId
      ? weaponRecordOf(doc, itemRecord.weaponId)
      : null;
  const gunGroup = weapon ? resolveMountGunGroup(weapon) : '';
  const fp = itemFootprint(itemRecord);
  const key = artPoolKeyStructure(
    artId || recordSwatch(itemRecord),
    gunGroup,
    fp.w,
    fp.h
  );
  const local = getArtPool(pack);
  if (local && local.has(key)) return local.get(key);
  const game = getGameplayArtPool();
  return (game && game.get(key)) || null;
}

export function lookupVehiclePoolEntry(pack, doc, record) {
  if (!record) return null;
  const composed = composeVehicleLayerNodes(pack, record, doc);
  if (!composed) return null;
  const key = artPoolKeyVehicle(
    composed.artId,
    composed.skinId + '|' + (composed.wearKey || '-'),
    composed.gunGroup
  );
  const local = getArtPool(pack);
  if (local && local.has(key)) return local.get(key);
  const game = getGameplayArtPool();
  return (game && game.get(key)) || null;
}

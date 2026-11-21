/**
 * Shared SVG art builder for Units, Weapons, and Structures.
 * Used by both the Inspector previews (panels.js) and Map Canvas (mapView.js)
 * so map icons match preview art 1:1.
 */

import { closedModelGroupId, listClosedModelGroupIds } from '../assets/closedCatalog.js';
import {
  ART_POOL_CELL as SHARED_ART_POOL_CELL,
  ART_POOL_PIXEL as SHARED_ART_POOL_PIXEL,
  artPoolKeyLayer,
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
    const ids = Object.keys(doc.weapons);
    for (let i = 0; i < ids.length; i++) {
      const row = doc.weapons[ids[i]];
      if (row && row.id === weaponId) return row;
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

export function hideMeasures(clone, extra) {
  const nodes = clone.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].getAttribute('id') || '';
    if (id.indexOf('SizeView') === 0 || (extra && extra(id))) nodes[i].setAttribute('display', 'none');
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
  let clone = cloneArtGroup(parsed, groupName);
  if (!clone && groupName !== 'Weapon_Colt_1911') clone = cloneArtGroup(parsed, 'Weapon_Colt_1911');
  if (!clone) return null;
  hideMeasures(clone);
  return clone;
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
    let which = 0;
    if (/^Arm_1/i.test(id)) which = 1;
    else if (/^Arm_2/i.test(id)) which = 2;
    if (!which) continue;
    const transform = armPoseTransform(parsed, hold, which);
    if (transform) nodes[i].setAttribute('transform', transform);
  }
}

export function modelHoldNodes(parsed, groupId, spec) {
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
  if (spec && spec.group) {
    const gun = weaponClone(parsed, spec.group);
    if (gun) nodes.push(gun);
  }
  if (body) nodes.push(body);
  if (top) nodes.push(top);
  return nodes;
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
  let gun = cloneArtGroup(parsed, groupName);
  if (!gun && groupName !== 'Weapon_Colt_1911') gun = cloneArtGroup(parsed, 'Weapon_Colt_1911');
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
  const key = `sv:${groupId}`;
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
    let cell = null;
    const nodes = group.querySelectorAll('[id]');
    for (let i = 0; i < nodes.length; i++) {
      const id = nodes[i].getAttribute('id') || '';
      if (id.indexOf('SizeView') !== 0) continue;
      cell = unionSpace(cell, boxInSpace(nodes[i], host, svg));
    }
    svg.remove();
    if (cell && cell.w > 0 && cell.h > 0) {
      const side = Math.max(cell.w, cell.h);
      const cx = cell.x + cell.w / 2;
      const cy = cell.y + cell.h / 2;
      vb = `${cx - side / 2} ${cy - side / 2} ${side} ${side}`;
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
  const key = artPoolKeyUnit(groupId, spec);
  if (pool.has(key)) return pool.get(key);
  if (pendingPoolBakes.has(key)) return null;
  pendingPoolBakes.add(key);
  const parsed = getParsedUnitArt(pack);
  (async () => {
    try {
      if (!parsed) return;
      const nodes = modelHoldNodes(parsed, groupId, spec);
      if (!nodes.length) return;
      const entry = await rasterNodesToEntry(parsed, nodes, groupId);
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
  const parsed = getParsedUnitArt(pack);
  (async () => {
    try {
      if (!parsed) return;
      const gun = weaponClone(parsed, spec.group);
      if (!gun) return;
      const entry = await rasterNodesToEntry(parsed, [gun], spec.group);
      if (entry) pool.set(key, entry);
    } finally {
      pendingPoolBakes.delete(key);
      if (onReady) onReady();
    }
  })();
  return null;
}

/**
 * Weapons tab preview: unit skin + hold pose + gun (same layers as old mountModelPreview).
 */
export function ensureWeaponHeldPoolEntry(pack, weaponRecord, onReady) {
  const pool = ensurePackPool(pack);
  if (!pool || !weaponRecord) return null;
  const spec = weaponPreviewSpec(weaponRecord);
  if (!spec || !spec.group) return null;
  const groupId = 'Default_skin_1';
  const key = artPoolKeyUnit(groupId, spec);
  if (pool.has(key)) return pool.get(key);
  if (pendingPoolBakes.has(key)) return null;
  pendingPoolBakes.add(key);
  const parsed = getParsedUnitArt(pack);
  (async () => {
    try {
      if (!parsed) return;
      const nodes = modelHoldNodes(parsed, groupId, spec);
      if (!nodes.length) return;
      const entry = await rasterNodesToEntry(parsed, nodes, groupId);
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
 * Structure footprint + optional weapon from pixel pool only (no live SVG gun).
 */
export function buildStructureMapIcon(parsed, doc, itemRecord, x, y, width, height, pack, onPoolReady) {
  const g = document.createElementNS(SVG_NS, 'g');
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
  g.appendChild(bg);

  const weapon = itemRecord && itemRecord.weaponId ? weaponRecordOf(doc, itemRecord.weaponId) : null;
  if (weapon) {
    const entry = ensureWeaponPoolEntry(pack, weapon, onPoolReady);
    if (entry) {
      const gun = poolSpriteImage(entry, x, y, width, height);
      if (gun) g.appendChild(gun);
    }
  }

  return g;
}

/**
 * Bottom-tray tool thumb — pixel pool only.
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
  if (kind === 'unit') {
    const unitDef = (doc.units && doc.units[templateId]) || { id: templateId };
    const icon = buildUnitMapIcon(null, doc, unitDef, 12, 12, 40, 40, pack, refresh);
    if (icon) svg.appendChild(icon);
  } else {
    const itemDef = (doc.items && doc.items[templateId]) || { id: templateId };
    const fp = itemFootprint(itemDef);
    const maxDim = Math.max(1, fp.w, fp.h);
    const box = 48;
    const w = (fp.w / maxDim) * box;
    const h = (fp.h / maxDim) * box;
    const ox = (64 - w) / 2;
    const oy = (64 - h) / 2;
    svg.appendChild(buildStructureMapIcon(null, doc, itemDef, ox, oy, w, h, pack, refresh));
  }
  container.appendChild(svg);
}

export function artPoolKeyUnit(groupId, spec) {
  const hold = (spec && spec.hold) || '-';
  const gun = (spec && spec.group) || '-';
  return 'u:' + (groupId || '') + '|' + hold + '|' + gun;
}

export function artPoolKeyWeapon(groupName) {
  return 'w:' + (groupName || '');
}

export function getArtPool(pack) {
  if (!pack) return null;
  if (pack.artPool) return pack.artPool;
  return artPoolByPack.get(pack) || null;
}

/**
 * Draw pool sprite as 1-cell rects (not <image>) so map viewBox zoom stays blocky
 * like classic pixel art — SVG <image> often gets bilinear-smoothed when zoomed.
 */
export function poolSpriteImage(entry, x, y, width, height) {
  if (!entry) return null;
  const pixels = entry.pixels;
  const fw = entry.frameW | 0;
  const fh = entry.frameH | 0;
  if (!pixels || !fw || !fh) return null;

  const side = Math.min(width, height);
  const cell = entry.cellSize || ART_POOL_PIXEL;
  const scale = side / cell;
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
  return pool.get(artPoolKeyUnit(groupId, spec)) || null;
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

function measureMountedArt(parsed, nodes, sizeViewGroupId) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '256');
  svg.setAttribute('height', '256');
  svg.style.position = 'fixed';
  svg.style.left = '-10000px';
  svg.style.top = '-10000px';
  svg.style.pointerEvents = 'none';
  const defs = parsed.querySelector('defs');
  if (defs) svg.appendChild(defs.cloneNode(true));
  const host = document.createElementNS(SVG_NS, 'g');
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]) host.appendChild(nodes[i]);
  }
  svg.appendChild(host);
  document.body.appendChild(svg);

  // SizeView lives on the raw group; layered clones hide it — probe separately.
  let cell = null;
  if (sizeViewGroupId) {
    const measureRoot = cloneArtGroup(parsed, sizeViewGroupId);
    if (measureRoot) {
      const probe = document.createElementNS(SVG_NS, 'g');
      probe.setAttribute('opacity', '0');
      probe.appendChild(measureRoot);
      host.appendChild(probe);
      const nodes2 = measureRoot.querySelectorAll('[id]');
      for (let i = 0; i < nodes2.length; i++) {
        const id = nodes2[i].getAttribute('id') || '';
        if (id.indexOf('SizeView') !== 0) continue;
        cell = unionSpace(cell, boxInSpace(nodes2[i], host, svg));
      }
      probe.remove();
    }
  }

  hideMeasures(host);
  const content = boxInSpace(host, host, svg);
  svg.remove();

  const fallbackSide = 64;
  let cx = 0;
  let cy = 0;
  let cellSide = fallbackSide;
  if (cell && cell.w > 0 && cell.h > 0) {
    cellSide = Math.max(cell.w, cell.h);
    cx = cell.x + cell.w / 2;
    cy = cell.y + cell.h / 2;
  } else if (content && content.w > 0 && content.h > 0) {
    cellSide = Math.max(content.w, content.h, fallbackSide);
    cx = content.x + content.w / 2;
    cy = content.y + content.h / 2;
  }

  let frameSide = cellSide;
  if (content && content.w > 0 && content.h > 0) {
    const left = cx - content.x;
    const right = content.x + content.w - cx;
    const top = cy - content.y;
    const bottom = content.y + content.h - cy;
    const need = Math.max(left, right, top, bottom) * 2;
    if (need > frameSide) frameSide = need;
  }
  frameSide += Math.max(2, cellSide * 0.04);

  return { cx, cy, cellSide, frameSide };
}

async function rasterNodesToEntry(parsed, nodes, sizeViewGroupId) {
  if (!nodes || !nodes.length) return null;
  // Fresh clones — measureMountedArt consumes/moves nodes into temp SVG.
  const fresh = [];
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]) fresh.push(nodes[i].cloneNode(true));
  }
  const metrics = measureMountedArt(parsed, fresh, sizeViewGroupId);
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
  const svg = mountPreviewSvg(parsed.querySelector('defs'), drawNodes);
  hideMeasures(svg);
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('width', String(hiPx));
  svg.setAttribute('height', String(hiPx));
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('shape-rendering', 'crispEdges');

  const xml = new XMLSerializer().serializeToString(svg);
  return rasterSvgXmlToEntry(xml, framePx);
}

function collectWeaponGroups(pack) {
  const seen = {};
  const out = [];
  const add = (name) => {
    if (!name || seen[name]) return;
    seen[name] = true;
    out.push(name);
  };
  const weapons = (pack && pack.weapons) || {};
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
  const add = (groupId, spec) => {
    const key = artPoolKeyUnit(groupId, spec);
    if (seen[key]) return;
    seen[key] = true;
    jobs.push({ key, groupId, spec });
  };
  const holds = ['hold_Gun', 'hold_Gun_2'];
  for (let s = 0; s < skins.length; s++) {
    const groupId = skins[s];
    add(groupId, null);
    for (let h = 0; h < holds.length; h++) {
      for (let g = 0; g < weaponGroups.length; g++) {
        add(groupId, { hold: holds[h], group: weaponGroups[g] });
      }
    }
  }
  const docLite = { weapons: pack.weapons, items: pack.items, units: pack.units };
  const units = (pack && pack.units) || {};
  const uids = Object.keys(units);
  for (let i = 0; i < uids.length; i++) {
    const record = units[uids[i]];
    if (!record || record.pending) continue;
    const groupId = closedModelGroupId(shownUnitModel(record)) || 'Default_skin_1';
    add(groupId, resolveUnitWeaponSpec(docLite, record));
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
  if (!parsed) {
    pack.artPool = pool;
    artPoolByPack.set(pack, pool);
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
    const gun = weaponClone(parsed, group);
    if (gun) {
      const entry = await rasterNodesToEntry(parsed, [gun], group);
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
    const nodes = modelHoldNodes(parsed, job.groupId, job.spec);
    if (nodes.length) {
      const entry = await rasterNodesToEntry(parsed, nodes, job.groupId);
      if (entry) pool.set(job.key, entry);
    }
    done += 1;
    if (i % 2 === 1) await yieldPaint();
  }

  pack.artPool = pool;
  artPoolByPack.set(pack, pool);
  report('Art pool ready · ' + pool.size + ' sprites');
  return pool;
}

export { artPoolKeyLayer };

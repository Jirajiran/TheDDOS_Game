/**
 * VehicleArt.svg — visual + named anchors (receive-side).
 * SizeView = size reference. Ignore trailing _FL… when matching base names.
 */

import { VEHICLE_ART_FILE } from '../assets/closedCatalog.js';
import { GAME_PACK } from '../defs/gamePack.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VEHICLE_SVG_URL = VEHICLE_ART_FILE + '?v=20261126a';

/** Art state → group id in VehicleArt.svg */
export const VEHICLE_STATE_GROUPS = Object.freeze({
  Driven: 'Vehicle_ArmorCar_1_Driven',
  Empty: 'Vehicle_ArmorCar_1_Empty',
  Mobility: 'Vehicle_ArmorCar_1_Mobility',
  Broken: 'Vehicle_ArmorCar_1_Broken',
});

export const VEHICLE_STATES = Object.freeze(Object.keys(VEHICLE_STATE_GROUPS));

/** @type {Map<string, { img: HTMLImageElement, layout: {x:number,y:number,w:number,h:number}, anchors: object }>} */
const _stateArt = new Map();
/** @type {Promise<void>|null} */
let _load = null;

/** Strip export noise: trailing (_FL)+ only. */
export function stripFlSuffix(id) {
  return String(id || '').replace(/(_FL)+$/g, '');
}

/**
 * True when element's id matches base name ignoring _FL suffixes.
 * "Pivot_Unit", "Pivot_Unit_FL_FL" → base Pivot_Unit
 * "Area_interactive_1_FL" → Area_interactive_1
 */
export function idMatchesBase(id, base) {
  if (!id || !base) return false;
  return stripFlSuffix(id) === base;
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

/** Local translation of a node (matrix e,f) relative to its group. */
function localOffset(el) {
  const m = parseMatrixAttr(el);
  return { x: m.e, y: m.f };
}

function measureBox(el) {
  if (!el) return null;
  try {
    const bb = el.getBBox();
    if (!bb || !(bb.width > 0) || !(bb.height > 0)) return null;
    return { x: bb.x, y: bb.y, w: bb.width, h: bb.height };
  } catch (e) {
    return null;
  }
}

function unionBox(a, b) {
  if (!a) return b;
  if (!b) return a;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const r = Math.max(a.x + a.w, b.x + b.w);
  const btm = Math.max(a.y + a.h, b.y + b.h);
  return { x: x, y: y, w: r - x, h: btm - y };
}

function hideEl(el) {
  if (!el) return;
  el.setAttribute('display', 'none');
}

function findAllByBase(root, base) {
  const out = [];
  if (!root || !base) return out;
  const nodes = root.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].getAttribute('id') || '';
    if (idMatchesBase(id, base)) out.push(nodes[i]);
  }
  return out;
}

function findFirstByBase(root, base) {
  const list = findAllByBase(root, base);
  return list[0] || null;
}

function sizeViewBox(root) {
  const nodes = findAllByBase(root, 'SizeView');
  // Also accept SizeView_FL… as SizeView base after strip — stripFl leaves SizeView.
  let box = null;
  for (let i = 0; i < nodes.length; i++) {
    box = unionBox(box, measureBox(nodes[i]));
  }
  if (box) return box;
  // Fallback: any id starting with SizeView (including FL chain before strip edge cases)
  const all = root.querySelectorAll('[id]');
  for (let i = 0; i < all.length; i++) {
    const id = all[i].getAttribute('id') || '';
    if (stripFlSuffix(id).indexOf('SizeView') !== 0) continue;
    box = unionBox(box, measureBox(all[i]));
  }
  return box;
}

function collectAnchors(clone) {
  const seat = findAllByBase(clone, 'Pivot_Unit').map(localOffset);
  const doors = findAllByBase(clone, 'Bg_Door').map(localOffset);
  const areas = [];
  for (let n = 1; n <= 8; n++) {
    const hits = findAllByBase(clone, 'Area_interactive_' + n);
    for (let i = 0; i < hits.length; i++) {
      areas.push(Object.assign({ index: n }, localOffset(hits[i])));
    }
  }
  // Bare Area_interactive (no index)
  const bare = findAllByBase(clone, 'Area_interactive');
  for (let i = 0; i < bare.length; i++) {
    areas.push(Object.assign({ index: 0 }, localOffset(bare[i])));
  }
  let turrets = findAllByBase(clone, 'Pivot_turrent').map(localOffset);
  if (!turrets.length) turrets = findAllByBase(clone, 'Pivot_Turret').map(localOffset);
  const turret = turrets[0] || null;
  const blockTurret = findFirstByBase(clone, 'Block_Turrent_1') || findFirstByBase(clone, 'Block_Turret_1');
  const collider = findFirstByBase(clone, 'Collider_Vehicle');
  const sizeEl = findFirstByBase(clone, 'SizeView');
  const sizeBox = sizeViewBox(clone);
  const colliderBox = collider ? measureBox(collider) : null;
  const origin = sizeBox
    ? { x: sizeBox.x + sizeBox.w * 0.5, y: sizeBox.y + sizeBox.h * 0.5 }
    : null;
  return {
    sizeView: sizeEl ? localOffset(sizeEl) : { x: 0, y: 0 },
    sizeBox: sizeBox,
    /** SizeView center — entity / pivot origin (matches Editor place). */
    origin: origin,
    sizeSide: sizeBox ? Math.max(sizeBox.w, sizeBox.h) : 64,
    seats: seat,
    doors: doors,
    areas: areas,
    /** All Pivot_turrent locals — one shared weaponId applies to every entry. */
    turrets: turrets,
    /** First pivot (compat). */
    turret: turret,
    blockTurret: blockTurret ? localOffset(blockTurret) : null,
    collider: collider ? localOffset(collider) : null,
    /** Local AABB of Collider_Vehicle — drive / hit extents. */
    colliderBox: colliderBox,
  };
}

function svgToImage(markup) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
  });
}

function mountHost(defsClone) {
  const host = document.createElementNS(SVG_NS, 'svg');
  host.setAttribute('xmlns', SVG_NS);
  host.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  host.setAttribute('width', '8');
  host.setAttribute('height', '8');
  host.style.position = 'absolute';
  host.style.left = '-9999px';
  host.style.top = '0';
  host.style.visibility = 'hidden';
  if (defsClone) host.appendChild(defsClone);
  document.body.appendChild(host);
  return host;
}

async function rasterState(sourceDoc, defs, groupId) {
  const src = sourceDoc.getElementById(groupId);
  if (!src) return null;
  const clone = src.cloneNode(true);
  clone.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
  const host = mountHost(defs.cloneNode(true));
  host.appendChild(clone);

  const anchors = collectAnchors(clone);
  const frame = measureBox(clone);
  const sizeView = sizeViewBox(clone);

  // Hide SizeView for paint (keep as measure reference only).
  const sizeNodes = clone.querySelectorAll('[id]');
  for (let i = 0; i < sizeNodes.length; i++) {
    const id = sizeNodes[i].getAttribute('id') || '';
    if (stripFlSuffix(id).indexOf('SizeView') === 0) hideEl(sizeNodes[i]);
  }

  const box = unionBox(frame, sizeView);
  host.remove();
  if (!box || !(box.w > 1) || !(box.h > 1)) return null;

  const pad = 2;
  const vb = {
    x: box.x - pad,
    y: box.y - pad,
    w: box.w + pad * 2,
    h: box.h + pad * 2,
  };
  // Prefer SizeView center as entity origin (not full paint bbox mid).
  const origin = sizeView
    ? { x: sizeView.x + sizeView.w * 0.5, y: sizeView.y + sizeView.h * 0.5 }
    : { x: vb.x + vb.w * 0.5, y: vb.y + vb.h * 0.5 };
  if (anchors && !anchors.origin) anchors.origin = origin;
  const ppm = 3;
  const pw = Math.max(48, Math.min(768, Math.ceil(vb.w * ppm)));
  const ph = Math.max(48, Math.min(768, Math.ceil(vb.h * ppm)));
  const painted = src.cloneNode(true);
  painted.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
  const hideList = painted.querySelectorAll('[id]');
  for (let i = 0; i < hideList.length; i++) {
    const id = hideList[i].getAttribute('id') || '';
    if (stripFlSuffix(id).indexOf('SizeView') === 0) hideEl(hideList[i]);
  }
  const markup =
    `<svg xmlns="${SVG_NS}" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${pw}" height="${ph}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}">` +
    new XMLSerializer().serializeToString(defs) +
    new XMLSerializer().serializeToString(painted) +
    `</svg>`;
  const img = await svgToImage(markup);
  if (!img) return null;
  return { img: img, layout: vb, origin: origin, anchors: anchors };
}

export function preloadVehicleArt() {
  if (_load) return _load;
  _load = (async () => {
    let text = '';
    try {
      const res = await fetch(VEHICLE_SVG_URL);
      if (!res.ok) return;
      text = await res.text();
    } catch (e) {
      return;
    }
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (doc.querySelector('parsererror')) return;
    const defs = doc.querySelector('defs');
    const defsNode = defs ? defs.cloneNode(true) : document.createElementNS(SVG_NS, 'defs');
    const states = VEHICLE_STATES;
    for (let i = 0; i < states.length; i++) {
      const state = states[i];
      const groupId = VEHICLE_STATE_GROUPS[state];
      const art = await rasterState(doc, defsNode, groupId);
      if (art) _stateArt.set(state, art);
    }
  })();
  return _load;
}

export function isVehicleArtReady() {
  return _stateArt.size > 0;
}

export function getVehicleStateArt(state) {
  return _stateArt.get(state) || null;
}

/** Anchors for a state (seats, areas, …) or null. */
export function getVehicleAnchors(state) {
  const art = _stateArt.get(state);
  return art ? art.anchors : null;
}

/**
 * Pick exit/enter area index: prefer facing, else deterministic modulo.
 * @param {{ x:number, y:number, index?:number }[]} areas
 * @param {number} facingRad
 * @param {number} keyInt unit/vehicle id for modulo
 */
export function pickInteractiveArea(areas, facingRad, keyInt) {
  if (!areas || !areas.length) return null;
  if (areas.length === 1) return areas[0];
  const fx = Math.cos(facingRad || 0);
  const fy = Math.sin(facingRad || 0);
  let best = null;
  let bestDot = -Infinity;
  for (let i = 0; i < areas.length; i++) {
    const a = areas[i];
    const len = Math.hypot(a.x, a.y) || 1;
    const dot = (a.x / len) * fx + (a.y / len) * fy;
    if (dot > bestDot) {
      bestDot = dot;
      best = a;
    }
  }
  if (bestDot > 0.15) return best;
  const n = areas.length;
  return areas[((keyInt | 0) % n + n) % n];
}

/**
 * Draw vehicle hull centered at world (x,y).
 * facingRad = math aim (0=+X); art faces +Y — same offset as units/guns.
 */
export function drawVehicleArt(ctx, state, x, y, facingRad, zoom) {
  const art = _stateArt.get(state);
  if (!art || !art.img) return false;
  const img = art.img;
  const layout = art.layout;
  const packOff =
    GAME_PACK && GAME_PACK.unitVisualFacingOffsetRad != null
      ? GAME_PACK.unitVisualFacingOffsetRad
      : -Math.PI / 2;
  const visual = (facingRad || 0) + packOff;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(visual);
  // Pin SizeView center on entity (same origin as pivots / Editor).
  const ox =
    art.origin && Number.isFinite(art.origin.x)
      ? art.origin.x
      : layout.x + layout.w * 0.5;
  const oy =
    art.origin && Number.isFinite(art.origin.y)
      ? art.origin.y
      : layout.y + layout.h * 0.5;
  const scale = 1;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    (layout.x - ox) * scale,
    (layout.y - oy) * scale,
    layout.w * scale,
    layout.h * scale
  );
  ctx.restore();
  return true;
}

/**
 * BlockArt.svg — SizeView + Pivot_turrent + hull rasters for Base / Turret / walls.
 * Local offsets use SizeView center as origin (same contract as vehicle hull).
 */

import { BLOCK_ART_FILE, BLOCK_ART_IDS } from '../assets/closedCatalog.js';
import { L3_SIZE } from '../config.js';
import { idMatchesBase, stripFlSuffix } from './vehicleArt.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const BLOCK_SVG_URL = BLOCK_ART_FILE + '?v=20261126e';

/** @type {Map<string, { pivots: {x:number,y:number}[], sizeSide: number, sizeBox: object|null, origin: object|null, img: HTMLImageElement|null, layout: object|null }>} */
const _anchors = new Map();
/** @type {Promise<void>|null} */
let _load = null;

function parseMatrixAttr(el) {
  const t = (el && el.getAttribute && el.getAttribute('transform')) || '';
  const m = /matrix\s*\(\s*([^)]+)\)/i.exec(t);
  if (!m) return { e: 0, f: 0 };
  const p = m[1].split(/[\s,]+/).map(Number);
  return {
    e: Number.isFinite(p[4]) ? p[4] : 0,
    f: Number.isFinite(p[5]) ? p[5] : 0,
  };
}

function localOffset(el) {
  const m = parseMatrixAttr(el);
  return { x: m.e, y: m.f };
}

function isSizeViewId(id) {
  return stripFlSuffix(id || '').indexOf('SizeView') === 0;
}

function unionBox(a, b) {
  if (!a) return b;
  if (!b) return a;
  const x0 = Math.min(a.x, b.x);
  const y0 = Math.min(a.y, b.y);
  const x1 = Math.max(a.x + a.w, b.x + b.w);
  const y1 = Math.max(a.y + a.h, b.y + b.h);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * getBBox alone ignores the element's own transform — SizeView_2..9
 * at +64/+128 would collapse to one cell and Base would stretch ~2×.
 * Same contract as Editor unitArt.boxInSpace (getScreenCTM).
 */
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
  if (!from || !to) {
    return { x: bb.x, y: bb.y, w: bb.width, h: bb.height };
  }
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
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function findAllByBase(root, base) {
  const out = [];
  if (!root || !base) return out;
  const nodes = root.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    if (idMatchesBase(nodes[i].getAttribute('id') || '', base)) out.push(nodes[i]);
  }
  return out;
}

function hideEl(el) {
  if (!el) return;
  el.setAttribute('display', 'none');
  el.style.display = 'none';
}

/**
 * Union SizeView / SizeView_1..N in parent space (Base 3×3 true footprint).
 * oneSide = single cell for gun scale fallback (not the multi-cell union).
 */
function probeSizeViews(root, space, svg) {
  let union = null;
  let oneSide = 0;
  let count = 0;
  if (!root) return { union, oneSide, count };
  const nodes = root.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].getAttribute('id') || '';
    if (!isSizeViewId(id)) continue;
    const box = boxInSpace(nodes[i], space, svg);
    if (!box || !(box.w > 0) || !(box.h > 0)) continue;
    count += 1;
    union = unionBox(union, box);
    oneSide = Math.max(oneSide, box.w, box.h);
  }
  return { union, oneSide, count };
}

function mountHost(defsClone) {
  const host = document.createElementNS(SVG_NS, 'svg');
  host.setAttribute('xmlns', SVG_NS);
  host.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  // Real pixel size so getScreenCTM is stable (8×8 broke multi-cell measure).
  host.setAttribute('width', '256');
  host.setAttribute('height', '256');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '-10000px';
  host.style.visibility = 'hidden';
  host.style.pointerEvents = 'none';
  if (defsClone) host.appendChild(defsClone);
  document.body.appendChild(host);
  return host;
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

async function collectGroupArt(sourceDoc, defs, groupId) {
  const src = sourceDoc.getElementById(groupId);
  if (!src) return null;
  const clone = src.cloneNode(true);
  clone.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
  const svg = mountHost(defs.cloneNode(true));
  const space = document.createElementNS(SVG_NS, 'g');
  space.appendChild(clone);
  svg.appendChild(space);

  // Measure SizeViews while still visible (CTM needs laid-out nodes).
  const probed = probeSizeViews(clone, space, svg);
  const sizeBox = probed.union;
  const oneSide = probed.oneSide > 0 ? probed.oneSide : 64;
  const frame = boxInSpace(clone, space, svg);
  let pivots = findAllByBase(clone, 'Pivot_turrent').map(localOffset);
  if (!pivots.length) pivots = findAllByBase(clone, 'Pivot_Turret').map(localOffset);

  const hideList = clone.querySelectorAll('[id]');
  for (let i = 0; i < hideList.length; i++) {
    const id = hideList[i].getAttribute('id') || '';
    if (isSizeViewId(id)) hideEl(hideList[i]);
    if (idMatchesBase(id, 'Pivot_turrent') || idMatchesBase(id, 'Pivot_Turret')) {
      hideEl(hideList[i]);
    }
  }
  // After hide, re-measure paint bounds in the same parent space.
  const paintContent = boxInSpace(clone, space, svg);
  const paintBox = unionBox(paintContent || frame, sizeBox);
  svg.remove();
  if (!paintBox || !(paintBox.w > 1) || !(paintBox.h > 1)) {
    return {
      pivots,
      sizeSide: oneSide,
      sizeBox,
      origin: sizeBox
        ? { x: sizeBox.x + sizeBox.w * 0.5, y: sizeBox.y + sizeBox.h * 0.5 }
        : null,
      img: null,
      layout: null,
    };
  }
  const pad = 2;
  const vb = {
    x: paintBox.x - pad,
    y: paintBox.y - pad,
    w: paintBox.w + pad * 2,
    h: paintBox.h + pad * 2,
  };
  const origin = sizeBox
    ? { x: sizeBox.x + sizeBox.w * 0.5, y: sizeBox.y + sizeBox.h * 0.5 }
    : { x: vb.x + vb.w * 0.5, y: vb.y + vb.h * 0.5 };
  const ppm = 2;
  const pw = Math.max(48, Math.min(1024, Math.ceil(vb.w * ppm)));
  const ph = Math.max(48, Math.min(1024, Math.ceil(vb.h * ppm)));
  const painted = src.cloneNode(true);
  painted.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
  const hidePaint = painted.querySelectorAll('[id]');
  for (let i = 0; i < hidePaint.length; i++) {
    const id = hidePaint[i].getAttribute('id') || '';
    if (isSizeViewId(id)) hideEl(hidePaint[i]);
    if (idMatchesBase(id, 'Pivot_turrent') || idMatchesBase(id, 'Pivot_Turret')) {
      hideEl(hidePaint[i]);
    }
  }
  const markup =
    `<svg xmlns="${SVG_NS}" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${pw}" height="${ph}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}">` +
    new XMLSerializer().serializeToString(defs) +
    new XMLSerializer().serializeToString(painted) +
    `</svg>`;
  const img = await svgToImage(markup);
  return {
    pivots,
    // one cell — guns stay 1:1; sizeBox carries full W×H footprint
    sizeSide: oneSide,
    sizeBox,
    origin,
    img,
    layout: vb,
  };
}

export function preloadBlockArt() {
  if (_load) return _load;
  _load = (async () => {
    _anchors.clear();
    let text = '';
    try {
      const res = await fetch(BLOCK_SVG_URL);
      if (!res.ok) return;
      text = await res.text();
    } catch (e) {
      return;
    }
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (doc.querySelector('parsererror')) return;
    const defs = doc.querySelector('defs');
    const defsNode = defs
      ? defs.cloneNode(true)
      : document.createElementNS(SVG_NS, 'defs');
    for (let i = 0; i < BLOCK_ART_IDS.length; i++) {
      const id = BLOCK_ART_IDS[i];
      const art = await collectGroupArt(doc, defsNode, id);
      if (art) _anchors.set(id, art);
    }
  })();
  return _load;
}

export function getBlockTurretAnchors(artId) {
  if (!artId) return null;
  return _anchors.get(artId) || null;
}

export function getBlockHullArt(artId) {
  if (!artId) return null;
  return _anchors.get(artId) || null;
}

/**
 * Draw BlockArt hull into footprint. Returns true when real art painted
 * (no empty color rect).
 */
export function drawBlockHull(ctx, artId, x, y, w, h) {
  const art = getBlockHullArt(artId);
  if (!art || !art.img || !art.layout || !(art.layout.w > 0)) return false;
  const sizeBox = art.sizeBox;
  const boxW = sizeBox && sizeBox.w > 0 ? sizeBox.w : art.layout.w;
  const boxH = sizeBox && sizeBox.h > 0 ? sizeBox.h : art.layout.h;
  const origin = art.origin || {
    x: art.layout.x + art.layout.w * 0.5,
    y: art.layout.y + art.layout.h * 0.5,
  };
  const scaleX = w > 0 ? w / boxW : 1;
  const scaleY = h > 0 ? h / boxH : scaleX;
  const cx = x + w * 0.5;
  const cy = y + h * 0.5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    art.img,
    (art.layout.x - origin.x) * scaleX,
    (art.layout.y - origin.y) * scaleY,
    art.layout.w * scaleX,
    art.layout.h * scaleY
  );
  ctx.restore();
  return true;
}

/**
 * World-space muzzle points for a placed block (shared weapon at every pivot).
 * Pivot SVG coords − SizeView origin, then map onto footprint (like vehicle).
 */
export function blockTurretWorldPoints(block) {
  if (!block) return [];
  const cx = block.x + block.w / 2;
  const cy = block.y + block.h / 2;
  const artId = block.artId || '';
  const anchors = getBlockTurretAnchors(artId);
  if (!anchors || !anchors.pivots || !anchors.pivots.length) {
    return [{ x: cx, y: cy }];
  }
  const sizeBox = anchors.sizeBox;
  const origin =
    anchors.origin ||
    (sizeBox
      ? { x: sizeBox.x + sizeBox.w * 0.5, y: sizeBox.y + sizeBox.h * 0.5 }
      : { x: 0, y: 0 });
  const boxW = sizeBox && sizeBox.w > 0 ? sizeBox.w : anchors.sizeSide || 64;
  const boxH = sizeBox && sizeBox.h > 0 ? sizeBox.h : anchors.sizeSide || 64;
  const scaleX = block.w > 0 ? block.w / boxW : L3_SIZE / (anchors.sizeSide || 64);
  const scaleY = block.h > 0 ? block.h / boxH : scaleX;
  const out = [];
  for (let i = 0; i < anchors.pivots.length; i++) {
    const p = anchors.pivots[i];
    const lx = ((p.x || 0) - origin.x) * scaleX;
    const ly = ((p.y || 0) - origin.y) * scaleY;
    out.push({ x: cx + lx, y: cy + ly });
  }
  return out.length ? out : [{ x: cx, y: cy }];
}

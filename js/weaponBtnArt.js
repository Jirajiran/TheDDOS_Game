/**
 * Raster Weapon_* groups from Btn.svg onto the gun mount.
 * Gameplay ids stay; this file is visual only.
 */

const BTN_SVG_URL = 'Asset/AssetSVG/Ui/Btn.svg?v=20261021b';
const SVG_NS = 'http://www.w3.org/2000/svg';

/** @type {Map<string, HTMLImageElement|null>} */
const _images = new Map();
/** @type {Promise<void>|null} */
let _load = null;
/** @type {Record<string, {arm1:object, arm2:object}>|null} */
let _armPoses = null;

const ACTION_GROUPS = Object.freeze({
  hold_Gun: 'Action_hold_Gun',
  Shoting: 'Action_Shoting',
  Reload_Shotgun: 'Action_Reload_Shotgun',
  Reload_Mag: 'Action_Reload_Mag',
  hold_Gun_2: 'Action_hold_Gun_2',
  Shoting_2: 'Action_Shoting_2',
  Reload_Mag_2: 'Action_Reload_Mag_2',
});

function parseMatrixAttr(el) {
  const t = (el && el.getAttribute && el.getAttribute('transform')) || '';
  const m = /matrix\s*\(\s*([^)]+)\)/i.exec(t);
  if (!m) return null;
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

function firstArm(group, prefix) {
  const nodes = group.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].getAttribute('id') || '';
    if (id.indexOf(prefix) === 0) return nodes[i];
  }
  return null;
}

const ART_ALIAS = Object.freeze({
  SMG_MODIFIED: 'SMG',
  AK47_MODIFIED: 'AK47',
  SHOTGUN_SHELL_MODIFIED: 'SHOTGUN_SHELL',
  SHOTGUN_BUCK_MODIFIED: 'SHOTGUN_BUCK',
  KAR98_MODIFIED: 'KAR98',
});

function artKey(weaponId) {
  return ART_ALIAS[weaponId] || weaponId;
}

function readActionArmPoses(doc) {
  const out = {};
  const actions = Object.keys(ACTION_GROUPS);
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const group = doc.getElementById(ACTION_GROUPS[action]);
    if (!group) continue;
    const a1 = parseMatrixAttr(firstArm(group, 'Arm_1'));
    const a2 = parseMatrixAttr(firstArm(group, 'Arm_2'));
    const piv = parseMatrixAttr(firstArm(group, 'Pivot_Arm_1'));
    if (!a1 || !a2) continue;
    out[action] = { arm1: a1, arm2: a2, pivot1: piv };
  }
  return out;
}

/** Arm matrices from Btn.svg Action_* groups, or null until the file loads. */
export function getBtnActionArmPoses() {
  return _armPoses;
}

const CORE_IDS = ['Core_Red_1', 'Core_Red_2', 'Core_Green', 'Core_Black', 'Core_white'];

function hideEl(el) {
  if (!el) return;
  el.setAttribute('display', 'none');
}

function hideId(root, id) {
  const nodes = root.querySelectorAll('[id="' + id + '"]');
  for (let i = 0; i < nodes.length; i++) hideEl(nodes[i]);
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

/**
 * Clone Core_Black / Core_white onto each existing core slot transform.
 * Ready state leaves the gun's own Core_Red_* or Core_Green.
 * @param {'empty'|'ready'|'beam'} state
 * @param {'red'|'green'} kind
 */
function applyCoreState(weaponClone, sourceDoc, state, kind) {
  const slots =
    kind === 'green'
      ? ['Core_Green_1']
      : ['Core_Red_1', 'Core_Red_2'];
  if (state === 'ready') return;
  const srcId = state === 'beam' ? 'Core_white' : 'Core_Black';
  const src = sourceDoc.getElementById(srcId);
  if (!src) return;
  for (let i = 0; i < slots.length; i++) {
    const slot = weaponClone.querySelector('[id="' + slots[i] + '"]');
    if (!slot || !slot.parentNode) continue;
    const core = src.cloneNode(true);
    const t = slot.getAttribute('transform');
    if (t) core.setAttribute('transform', t);
    else core.removeAttribute('transform');
    slot.parentNode.insertBefore(core, slot);
    hideEl(slot);
  }
}

function prepareClone(sourceDoc, groupId, variant) {
  const src = sourceDoc.getElementById(groupId);
  if (!src) return null;
  const clone = src.cloneNode(true);
  clone.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
  const measures = clone.querySelectorAll('[id]');
  for (let i = 0; i < measures.length; i++) {
    const id = measures[i].getAttribute('id') || '';
    if (id.indexOf('SizeView') === 0) hideEl(measures[i]);
  }
  if (variant === 'rpg-empty') hideId(clone, 'Bullet_Rpg_onGun');
  if (variant === 'pyro-body') {
    hideId(clone, 'Core_Red_1');
    hideId(clone, 'Core_Red_2');
    hideId(clone, 'Core_Green_1');
  }
  if (variant === 'pyro-empty' || variant === 'pyro-beam') {
    const kind = groupId.indexOf('Collagen') >= 0 ? 'green' : 'red';
    applyCoreState(
      clone,
      sourceDoc,
      variant === 'pyro-beam' ? 'beam' : 'empty',
      kind
    );
  }
  return clone;
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

function sizeViewBox(root) {
  const nodes = root.querySelectorAll('[id]');
  let box = null;
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].getAttribute('id') || '';
    if (id.indexOf('SizeView') !== 0) continue;
    box = unionBox(box, measureBox(nodes[i]));
  }
  return box;
}

/**
 * Raster in the group's local SVG units.
 * SizeView stays in the coordinate frame (hidden, so it does not paint).
 * The viewBox is the union, so gun art past SizeView is kept.
 * @returns {Promise<HTMLImageElement|null>}
 */
async function rasterLocal(defs, clone, box, pad) {
  if (!box || !(box.w > 1) || !(box.h > 1)) return null;
  const edge = pad == null ? 1 : pad;
  const vb = {
    x: box.x - edge,
    y: box.y - edge,
    w: box.w + edge * 2,
    h: box.h + edge * 2,
  };
  const ppm = 4;
  const pw = Math.max(32, Math.min(640, Math.ceil(vb.w * ppm)));
  const ph = Math.max(32, Math.min(640, Math.ceil(vb.h * ppm)));
  const markup =
    `<svg xmlns="${SVG_NS}" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${pw}" height="${ph}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}">` +
    new XMLSerializer().serializeToString(defs) +
    new XMLSerializer().serializeToString(clone) +
    `</svg>`;
  const img = await svgToImage(markup);
  if (img) img._layout = vb;
  return img;
}

async function rasterGroup(sourceDoc, defs, groupId, variant) {
  const src = sourceDoc.getElementById(groupId);
  if (!src) return null;
  const clone = src.cloneNode(true);
  clone.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
  const host = mountHost(defs.cloneNode(true));
  host.appendChild(clone);
  const frame = measureBox(clone);
  const sizeView = sizeViewBox(clone);
  host.remove();
  const painted = prepareClone(sourceDoc, groupId, variant);
  if (!painted) return null;
  return rasterLocal(defs, painted, unionBox(frame, sizeView));
}

function isolateCores(clone, sourceDoc, state, kind) {
  const kids = clone.children;
  for (let i = 0; i < kids.length; i++) {
    const id = kids[i].getAttribute('id') || '';
    if (id.indexOf('Core_') !== 0) hideEl(kids[i]);
  }
  if (state !== 'ready') {
    applyCoreState(clone, sourceDoc, state === 'white' ? 'beam' : 'empty', kind);
  }
}

async function rasterFixed(defs, clone, vb) {
  if (!vb || !(vb.w > 1) || !(vb.h > 1)) return null;
  const ppm = 4;
  const pw = Math.max(32, Math.min(640, Math.ceil(vb.w * ppm)));
  const ph = Math.max(32, Math.min(640, Math.ceil(vb.h * ppm)));
  const markup =
    `<svg xmlns="${SVG_NS}" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${pw}" height="${ph}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}">` +
    new XMLSerializer().serializeToString(defs) +
    new XMLSerializer().serializeToString(clone) +
    `</svg>`;
  const img = await svgToImage(markup);
  if (img) img._layout = vb;
  return img;
}

async function rasterCoreLayer(sourceDoc, defs, groupId, state, kind, frame) {
  const painted = prepareClone(sourceDoc, groupId, 'base');
  if (!painted || !frame) return null;
  isolateCores(painted, sourceDoc, state, kind);
  return rasterFixed(defs, painted, frame);
}

/** Placed mask window, including the shift inside the icon. mask itself has no getBBox. */
function iconPlateBox(clone) {
  const mask = clone.querySelector('mask');
  if (!mask) return null;
  const probe = document.createElementNS(SVG_NS, 'g');
  const kids = mask.childNodes;
  for (let i = 0; i < kids.length; i++) probe.appendChild(kids[i].cloneNode(true));
  clone.appendChild(probe);
  const box = measureBox(probe);
  clone.removeChild(probe);
  return box;
}

/** Flying rocket only. SizeView is the body reference and stays out of the shot. */
async function rasterProjectile(sourceDoc, defs, groupId) {
  const src = sourceDoc.getElementById(groupId);
  if (!src) return null;
  const clone = src.cloneNode(true);
  clone.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
  const host = mountHost(defs.cloneNode(true));
  host.appendChild(clone);
  const nodes = clone.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].getAttribute('id') || '';
    if (id.indexOf('SizeView') === 0) hideEl(nodes[i]);
  }
  const box = measureBox(clone);
  host.remove();
  return rasterLocal(defs, clone, box);
}

async function rasterIcon(sourceDoc, defs, groupId) {
  const src = sourceDoc.getElementById(groupId);
  if (!src) return null;
  const clone = src.cloneNode(true);
  clone.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
  const host = mountHost(defs.cloneNode(true));
  host.appendChild(clone);
  const plate = iconPlateBox(clone);
  const box = plate || measureBox(clone);
  host.remove();
  return rasterLocal(defs, clone, box, 0);
}

/**
 * @param {Record<string, { group: string, core?: string|null, rpg?: boolean }>} table
 */
export function preloadWeaponBtnArt(table) {
  if (_load) return _load;
  _load = (async () => {
    let text = '';
    try {
      const res = await fetch(BTN_SVG_URL);
      if (!res.ok) return;
      text = await res.text();
    } catch (e) {
      return;
    }
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    _armPoses = readActionArmPoses(doc);
    const defs = doc.querySelector('defs');
    if (!defs) return;
    const ids = Object.keys(table);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const spec = table[id];
      if (!spec || !spec.group) continue;
      const variants = spec.rpg
        ? ['rpg-loaded', 'rpg-empty']
        : spec.core
          ? ['pyro-body']
          : ['base'];
      let frame = null;
      for (let v = 0; v < variants.length; v++) {
        const key = id + ':' + variants[v];
        const img = await rasterGroup(doc, defs, spec.group, variants[v]);
        _images.set(key, img);
        if (img && img._layout) frame = img._layout;
      }
      if (spec.core && frame) {
        const states = ['ready', 'white'];
        for (let s = 0; s < states.length; s++) {
          const core = await rasterCoreLayer(
            doc,
            defs,
            spec.group,
            states[s],
            spec.core,
            frame
          );
          _images.set(id + ':core:' + states[s], core);
        }
      }
      if (spec.icon) {
        const icon = await rasterIcon(doc, defs, spec.icon);
        _images.set('icon:' + id, icon);
      }
    }
    const rocket = await rasterProjectile(doc, defs, 'Bullet_Rpg');
    _images.set('proj:Bullet_Rpg', rocket);
  })();
  return _load;
}

export function getWeaponBtnImage(weaponId, variant) {
  return _images.get(artKey(weaponId) + ':' + variant) || null;
}

/** Local SVG viewBox the weapon raster uses. SizeView sits inside this frame. */
export function getWeaponBtnLayout(weaponId, variant) {
  const img = getWeaponBtnImage(weaponId, variant);
  return (img && img._layout) || null;
}

export function getWeaponCoreImage(weaponId, state) {
  return _images.get(artKey(weaponId) + ':core:' + state) || null;
}

export function getProjectileArt(artId) {
  return _images.get('proj:' + artId) || null;
}

/** Data URL for a mapped Icon_* group, or null. */
export function getWeaponIconHref(weaponOrItemId) {
  const img = _images.get('icon:' + artKey(weaponOrItemId));
  return img && img.src ? img.src : null;
}

/** Authored icon box in SVG units. Null until the icon has rastered. */
export function getWeaponIconLayout(weaponOrItemId) {
  const img = _images.get('icon:' + artKey(weaponOrItemId));
  return (img && img._layout) || null;
}

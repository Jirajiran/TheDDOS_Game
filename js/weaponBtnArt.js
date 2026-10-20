/**
 * Raster Weapon_* groups from Btn.svg onto the gun mount.
 * Gameplay ids stay; this file is visual only.
 */

const BTN_SVG_URL = 'Asset/AssetSVG/Ui/Btn.svg?v=20261020b';
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
    a: p[0] || 1,
    b: p[1] || 0,
    c: p[2] || 0,
    d: p[3] || 1,
    e: p[4] || 0,
    f: p[5] || 0,
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

function readActionArmPoses(doc) {
  const out = {};
  const actions = Object.keys(ACTION_GROUPS);
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const group = doc.getElementById(ACTION_GROUPS[action]);
    if (!group) continue;
    const a1 = parseMatrixAttr(firstArm(group, 'Arm_1'));
    const a2 = parseMatrixAttr(firstArm(group, 'Arm_2'));
    if (!a1 || !a2) continue;
    out[action] = { arm1: a1, arm2: a2 };
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
      ? ['Core_Green']
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
async function rasterLocal(defs, clone, box) {
  if (!box || !(box.w > 1) || !(box.h > 1)) return null;
  const pad = 1;
  const vb = {
    x: box.x - pad,
    y: box.y - pad,
    w: box.w + pad * 2,
    h: box.h + pad * 2,
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

async function rasterIcon(sourceDoc, defs, groupId) {
  const src = sourceDoc.getElementById(groupId);
  if (!src) return null;
  const clone = src.cloneNode(true);
  clone.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
  const host = mountHost(defs.cloneNode(true));
  host.appendChild(clone);
  const box = measureBox(clone);
  host.remove();
  return rasterLocal(defs, clone, box);
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
          ? ['pyro-ready', 'pyro-empty', 'pyro-beam']
          : ['base'];
      for (let v = 0; v < variants.length; v++) {
        const key = id + ':' + variants[v];
        const img = await rasterGroup(doc, defs, spec.group, variants[v]);
        _images.set(key, img);
      }
      if (spec.icon) {
        const icon = await rasterIcon(doc, defs, spec.icon);
        _images.set('icon:' + id, icon);
      }
    }
  })();
  return _load;
}

export function getWeaponBtnImage(weaponId, variant) {
  return _images.get(weaponId + ':' + variant) || null;
}

/** Local SVG viewBox the weapon raster uses. SizeView sits inside this frame. */
export function getWeaponBtnLayout(weaponId, variant) {
  const img = getWeaponBtnImage(weaponId, variant);
  return (img && img._layout) || null;
}

/** Data URL for a mapped Icon_* group, or null. */
export function getWeaponIconHref(weaponOrItemId) {
  const img = _images.get('icon:' + weaponOrItemId);
  return img && img.src ? img.src : null;
}

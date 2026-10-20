/**
 * Raster Weapon_* groups from Btn.svg onto the gun mount.
 * Gameplay ids stay; this file is visual only.
 */

const BTN_SVG_URL = 'Asset/AssetSVG/Ui/Btn.svg?v=20261020a';
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

async function rasterGroup(sourceDoc, defs, groupId, variant) {
  const clone = prepareClone(sourceDoc, groupId, variant);
  if (!clone) return null;
  const host = mountHost(defs.cloneNode(true));
  host.appendChild(clone);
  let bb;
  try {
    bb = clone.getBBox();
  } catch (e) {
    bb = null;
  }
  host.remove();
  if (!bb || !(bb.width > 1) || !(bb.height > 1)) return null;
  const pad = 2;
  const vb =
    bb.x -
    pad +
    ' ' +
    (bb.y - pad) +
    ' ' +
    (bb.width + pad * 2) +
    ' ' +
    (bb.height + pad * 2);
  const px = 160;
  const markup =
    `<svg xmlns="${SVG_NS}" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${px}" height="${px}" viewBox="${vb}">` +
    new XMLSerializer().serializeToString(defs) +
    new XMLSerializer().serializeToString(clone) +
    `</svg>`;
  return svgToImage(markup);
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
    }
  })();
  return _load;
}

export function getWeaponBtnImage(weaponId, variant) {
  return _images.get(weaponId + ':' + variant) || null;
}

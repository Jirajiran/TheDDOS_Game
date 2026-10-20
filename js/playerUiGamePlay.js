/**
 * PlayerUIGamePlay.svg — PLAYING HUD (visual only; see DOC_PlayerUI.md).
 * Press = idle ↔ flash → idle (never sticky). Catalog Yellow / mute False = state idle.
 */

import { getItemDef } from './config.js';
import { formatClockFromSim, getDayBarPhase } from './dayCycle.js';
import { getWeaponIconHref, getWeaponIconLayout } from './weaponBtnArt.js';

const ART_W = 1280;
const BTN_SVG_URL = 'Asset/AssetSVG/Ui/Btn.svg';
const SVG_NS = 'http://www.w3.org/2000/svg';

const RESOURCE_COLORS = Object.freeze({
  WOOD: '#8b6914',
  STONE: '#8a8a8a',
  IRON: '#5a6a8a',
});
const FIST_ICON_COLOR = '#e8c070';
const HEAL_ICON_COLOR = '#5ecf8a';
/** Art slot body is ~72×72 centered at 0 (Ui_Ui_1_5); number sits outside. */
const SLOT_BODY = 72;
const SLOT_ICON = 60;
/** Faint inner pad so empty hotbar frames stay easy to click. */
const EMPTY_SLOT_PAD = 'rgba(80, 96, 112, 0.55)';
const CURRENT_SLOT_ICON = 56;
const REQUEST_SLOT_IDS = Object.freeze([
  'Request_item_Wood',
  'Request_item_Stone',
  'Request_item_Iron',
]);
const REQUEST_PACK_ORDER = Object.freeze(['WOOD', 'STONE', 'IRON']);
const ART_H = 720;

/** Load_Day dual bars (art bbox of Ui_Ui_1_12). */
const LOAD_DAY_X = -181.45;
const LOAD_DAY_Y = -18.35;
const LOAD_DAY_W = 361.5;
const LOAD_DAY_H = 35.9;
const DAY_CYAN = '#B6F7FF';
const DAY_PURPLE = '#55008C';

const CHAT_CAP = 12;
const CHAT_LINE_H = 36;
const CHAT_VISIBLE = 9;

const TEXT_COL_MIDDLE = Object.freeze([
  'Referee_Text',
  'Objective_Text',
  'Detail_Item',
  'Name_Item',
  'NameGen',
  'HpGen',
]);
const TEXT_COL_END = Object.freeze([
  'Number_Wave',
  'SceTime',
  'SceTime_FL',
  'SceTime_FL_FL',
  'SceTime_FL_FL_FL',
]);
const TEXT_COL_START = Object.freeze([
  'GunDetail',
  'ChatShow',
  'ObjectiveDetail',
  'Detail_Text',
]);
const ART_CX = ART_W / 2;
const ART_CY = ART_H / 2;

const ANCHOR_PRESETS = Object.freeze({
  Anchor_Right_Top: Object.freeze({
    kind: 'corner',
    artE: -ART_CX,
    artF: -ART_CY,
  }),
  Anchor_Center_Top: Object.freeze({ kind: 'center', artE: 0, artF: -ART_CY }),
  Anchor_Top_Left: Object.freeze({
    kind: 'corner',
    artE: ART_CX,
    artF: -ART_CY,
  }),
  Anchor_Top_Left_2: Object.freeze({
    kind: 'corner',
    artE: ART_CX,
    artF: -ART_CY,
  }),
  Anchor_Center_1: Object.freeze({ kind: 'center', artE: 0, artF: 0 }),
  Anchor_Center_2: Object.freeze({ kind: 'center', artE: 0, artF: 0 }),
  Anchor_Center_3: Object.freeze({ kind: 'center', artE: 0, artF: 0 }),
  Anchor_Center_Bottom: Object.freeze({
    kind: 'center',
    artE: 0,
    artF: ART_CY,
  }),
  Anchor_Left_Bottom: Object.freeze({
    kind: 'corner',
    artE: -ART_CX,
    artF: ART_CY,
  }),
  Anchor_Left_Bottom_FL: Object.freeze({
    kind: 'corner',
    artE: ART_CX,
    artF: ART_CY,
  }),
  Anchor_Left_Bottom_2: Object.freeze({
    kind: 'corner',
    artE: ART_CX,
    artF: ART_CY,
  }),
});

export const CATALOG_TO_CATEGORY = Object.freeze({
  Btn_Catalog_weapon: 'Gun',
  Btn_Catalog_Block: 'Block',
  Btn_Catalog_Turrent: 'Turret',
  Btn_Catalog_Ammo: 'Ammo',
  Btn_Catalog_Gen: 'Gen',
  Btn_Catalog_Other: 'Other',
});

const CATEGORY_TO_CATALOG = Object.freeze({
  Gun: 'Btn_Catalog_weapon',
  Block: 'Btn_Catalog_Block',
  Turret: 'Btn_Catalog_Turrent',
  Ammo: 'Btn_Catalog_Ammo',
  Gen: 'Btn_Catalog_Gen',
  Other: 'Btn_Catalog_Other',
});

export const PLAYER_UI_SVG_URL = 'Asset/AssetSVG/Ui/PlayerUIGamePlay.svg';

const CRAFT_SLOT_COUNT = 20;
const HOTBAR_MAIN = 6;
const GRAY_FILL = 'Ui_Btn_Color_0_Layer1_0_FILL';
const YELLOW_FILL = 'Ui_Btn_Color_6_Layer1_0_FILL';
const EFFECT_IDS = ['Effect_Show_1', 'Effect_Show_2', 'Effect_Show_3', 'Effect_Show_4'];
const SKILL_IDS = ['Skill_Show_1', 'Skill_Show_2', 'Skill_Show_3'];

/**
 * @param {object} opts
 */
export function createPlayerUiGamePlay(opts) {
  const mount = opts.mount;
  const state = {
    ready: false,
    svgRoot: null,
    layoutBound: false,
    anchorBase: null,
    craftOpen: false,
    settingOpen: false,
    genOpen: false,
    endOpen: false,
    objectiveOpen: true,
    chatOpen: false,
    audioMuted: false,
    backpackTier: 0,
    catalogCategory: 'Gun',
    selectedCraftIndex: -1,
    hpFillBase: null,
    hpBgBase: null,
    hpDisplayRatio: 1,
    hpTargetRatio: 1,
    hpShakeT: 0,
    craftRecipes: [],
    chatLines: [],
    chatScroll: 0,
    dayBarsReady: false,
    interactiveVisible: false,
    genCtx: null,
  };

  /** @type {HTMLInputElement|null} */
  let chatInput = null;

  function $(id) {
    if (!state.svgRoot) return null;
    return state.svgRoot.getElementById
      ? state.svgRoot.getElementById(id)
      : state.svgRoot.querySelector(`#${CSS.escape(id)}`);
  }

  function setVisible(el, on) {
    if (!el) return;
    el.style.display = on ? '' : 'none';
    el.style.pointerEvents = on ? 'auto' : 'none';
  }

  function makeHitTarget(el) {
    if (!el) return;
    el.style.cursor = 'pointer';
    el.style.pointerEvents = 'auto';
    try {
      el.setAttribute('pointer-events', 'bounding-box');
    } catch (_) {
      /* ignore */
    }
  }

  function parseMatrix(el) {
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

  function setMatrix(el, mat) {
    el.setAttribute(
      'transform',
      `matrix( ${mat.a}, ${mat.b}, ${mat.c}, ${mat.d}, ${mat.e},${mat.f}) `
    );
  }

  function firstTspan(el) {
    return el ? el.querySelector('tspan') : null;
  }

  function allTspans(el) {
    return el ? Array.from(el.querySelectorAll('tspan')) : [];
  }

  function setTspans(el, lines) {
    const spans = allTspans(el);
    for (let i = 0; i < spans.length; i++) {
      spans[i].textContent = lines[i] != null ? String(lines[i]) : '';
    }
  }

  function findNumberHost(root) {
    if (!root) return null;
    const byId = root.querySelector('[id^="NumberItem"]');
    if (byId) return byId;
    const spans = root.querySelectorAll('tspan');
    for (let i = 0; i < spans.length; i++) {
      const t = (spans[i].textContent || '').trim();
      if (/^N+$/i.test(t) || /^\d+$/.test(t)) {
        return spans[i].closest('[id^="NumberItem"]') || spans[i].closest('g') || spans[i];
      }
    }
    return null;
  }

  function setCountOnHost(host, count, show) {
    if (!host) return;
    setVisible(host, !!show);
    if (!show) return;
    const sp = firstTspan(host) || host;
    if (sp && sp.textContent !== undefined) {
      sp.textContent = String(Math.max(0, Math.floor(count)));
      if (host.id && String(host.id).indexOf('NumberItem') === 0) {
        applyTextColumn(host, 'end');
      }
    }
  }

  /**
   * Plan columns: middle / end (right) / start (left).
   * @param {Element|null} el
   * @param {'middle'|'end'|'start'} anchor
   */
  function applyTextColumn(el, anchor) {
    if (!el) return;
    const texts = el.querySelectorAll ? el.querySelectorAll('text') : [];
    const list = texts.length ? Array.from(texts) : el.tagName === 'text' ? [el] : [];
    for (let t = 0; t < list.length; t++) {
      list[t].setAttribute('text-anchor', anchor);
    }
    const spans = allTspans(el);
    const clip =
      el.querySelector &&
      (el.querySelector('clipPath rect') || el.querySelector('rect'));
    let xMid = null;
    let xEnd = null;
    let xStart = null;
    if (clip) {
      const x = parseFloat(clip.getAttribute('x') || '0');
      const w = parseFloat(clip.getAttribute('width') || '0');
      if (w > 0) {
        xStart = x + 2;
        xMid = x + w / 2;
        xEnd = x + w - 2;
      }
    }
    for (let i = 0; i < spans.length; i++) {
      spans[i].setAttribute('text-anchor', anchor);
      if (anchor === 'end' && xEnd != null) spans[i].setAttribute('x', String(xEnd));
      else if (anchor === 'middle' && xMid != null) {
        spans[i].setAttribute('x', String(xMid));
      } else if (anchor === 'start' && xStart != null) {
        spans[i].setAttribute('x', String(xStart));
      }
    }
  }

  function applyAllTextColumns() {
    for (let i = 0; i < TEXT_COL_MIDDLE.length; i++) {
      applyTextColumn($(TEXT_COL_MIDDLE[i]), 'middle');
    }
    for (let i = 0; i < TEXT_COL_END.length; i++) {
      applyTextColumn($(TEXT_COL_END[i]), 'end');
    }
    for (let i = 0; i < TEXT_COL_START.length; i++) {
      applyTextColumn($(TEXT_COL_START[i]), 'start');
    }
    // All NumberItem* hosts under SVG
    if (!state.svgRoot) return;
    const nums = state.svgRoot.querySelectorAll('[id^="NumberItem"]');
    for (let i = 0; i < nums.length; i++) applyTextColumn(nums[i], 'end');
  }

  function stripIds(node) {
    if (!node) return;
    if (node.removeAttribute) node.removeAttribute('id');
    const kids = node.querySelectorAll ? node.querySelectorAll('[id]') : [];
    for (let i = 0; i < kids.length; i++) kids[i].removeAttribute('id');
  }

  /**
   * Icon snapped to slot-body center (0,0), not NumberItem / text.
   * @param {boolean} [hitPad] when true, pad captures clicks (empty slots).
   */
  function ensureIconOverlay(panel, color, show, iconSize, hitPad, imageHref, iconLayout) {
    if (!panel) return;
    const size = iconSize > 0 ? iconSize : SLOT_ICON;
    const half = size / 2;
    let g = panel.querySelector('[data-icon-overlay]');
    if (!g) {
      g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('data-icon-overlay', '1');
      g.setAttribute('pointer-events', 'none');
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('rx', '3');
      rect.setAttribute('stroke', '#101820');
      rect.setAttribute('stroke-width', '1.5');
      g.appendChild(rect);
      const image = document.createElementNS(SVG_NS, 'image');
      image.setAttribute('data-icon-image', '1');
      image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      g.appendChild(image);
      // Under number/mask layers so digits stay readable
      const numHost = findNumberHost(panel);
      const numAnc =
        numHost &&
        (numHost.closest('[id^="NumberItem"]') ||
          numHost.closest('g[mask]') ||
          numHost);
      if (numAnc && numAnc.parentNode === panel) {
        panel.insertBefore(g, numAnc);
      } else if (panel.firstChild) {
        panel.insertBefore(g, panel.firstChild);
      } else {
        panel.appendChild(g);
      }
    }
    const rect = g.querySelector('rect');
    let image = g.querySelector('[data-icon-image]');
    if (!image) {
      image = document.createElementNS(SVG_NS, 'image');
      image.setAttribute('data-icon-image', '1');
      image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      g.appendChild(image);
    }
    if (rect) {
      rect.setAttribute('x', String(-half));
      rect.setAttribute('y', String(-half));
      rect.setAttribute('width', String(size));
      rect.setAttribute('height', String(size));
      rect.setAttribute('fill', imageHref ? 'none' : color || '#4a5a6a');
      rect.setAttribute('stroke', imageHref ? 'none' : '#101820');
      rect.setAttribute('pointer-events', imageHref ? 'none' : 'auto');
    }
    if (image) {
      const box = imageHref && iconLayout && iconLayout.w > 0 ? iconLayout : null;
      const iw = box ? box.w : size;
      const ih = box ? box.h : size;
      image.setAttribute('x', String(-iw / 2));
      image.setAttribute('y', String(-ih / 2));
      image.setAttribute('width', String(iw));
      image.setAttribute('height', String(ih));
      if (imageHref) {
        image.setAttribute('href', imageHref);
        image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageHref);
        image.style.display = '';
        image.style.pointerEvents = 'all';
        image.style.cursor = 'pointer';
      } else {
        image.removeAttribute('href');
        image.style.display = 'none';
        image.style.pointerEvents = 'none';
      }
    }
    g.setAttribute('pointer-events', imageHref || hitPad ? 'all' : 'none');
    setVisible(g, !!show);
  }

  /** Select frame = slot body only (does not expand over NumberItem). */
  function ensureSelectFrame(panel, selected) {
    if (!panel) return;
    panel.style.outline = 'none';
    let g = panel.querySelector('[data-slot-select]');
    if (!g) {
      g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('data-slot-select', '1');
      g.setAttribute('pointer-events', 'none');
      const rect = document.createElementNS(SVG_NS, 'rect');
      const half = SLOT_BODY / 2;
      rect.setAttribute('x', String(-half));
      rect.setAttribute('y', String(-half));
      rect.setAttribute('width', String(SLOT_BODY));
      rect.setAttribute('height', String(SLOT_BODY));
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', '#ffe08a');
      rect.setAttribute('stroke-width', '3');
      g.appendChild(rect);
      panel.appendChild(g);
    }
    setVisible(g, !!selected);
  }

  function ensureDefs() {
    let defs = state.svgRoot && state.svgRoot.querySelector('defs');
    if (!defs && state.svgRoot) {
      defs = document.createElementNS(SVG_NS, 'defs');
      state.svgRoot.insertBefore(defs, state.svgRoot.firstChild);
    }
    return defs;
  }

  /** Import Btn.svg into <defs> only — never paint at SVG root (no floating red). */
  async function ensureBtnCatalogArt() {
    if (state._btnArtReady || !state.svgRoot) return;
    state._btnArtReady = true;
    try {
      const res = await fetch(`${BTN_SVG_URL}?v=20261020d`);
      if (!res.ok) return;
      const doc = new DOMParser().parseFromString(await res.text(), 'image/svg+xml');
      const defs = ensureDefs();
      if (!defs) return;
      const needIds = [
        'Ui_Btn_Color_2_2_Layer0_0_FILL',
        'Ui_Btn_Color_2_2_Layer0_0_1_STROKES',
        'Ui_IconUi_3_Layer1_0_FILL',
      ];
      for (let i = 0; i < needIds.length; i++) {
        const id = needIds[i];
        if ($(id)) continue;
        const src = doc.getElementById(id);
        if (!src) continue;
        const clone = src.cloneNode(true);
        clone.setAttribute('id', id);
        defs.appendChild(clone);
      }
      const onPress = doc.getElementById('Btn_Press_onPress');
      if (onPress && !state.pressOnTpl) {
        const tpl = onPress.cloneNode(true);
        stripIds(tpl);
        tpl.setAttribute('id', 'Tpl_Btn_Press_onPress');
        tpl.setAttribute('data-press-tpl', '1');
        defs.appendChild(tpl);
        state.pressOnTpl = tpl;
      }
      const iconClose = doc.getElementById('Icon_Audio_Close');
      if (iconClose) {
        const tpl = iconClose.cloneNode(true);
        stripIds(tpl);
        tpl.setAttribute('id', 'Tpl_Icon_Audio_Close');
        defs.appendChild(tpl);
        state.iconAudioCloseTpl = tpl;
      }
    } catch (_) {
      /* offline / missing — fallbacks still work */
    }
  }

  function bindExitPressArt(exitEl) {
    if (!exitEl || exitEl.dataset.exitPressBound) return;
    exitEl.dataset.exitPressBound = '1';
    let press = exitEl.querySelector('[data-press="on"]');
    if (!press && state.pressOnTpl) {
      press = state.pressOnTpl.cloneNode(true);
      stripIds(press);
      press.setAttribute('data-press', 'on');
      press.setAttribute('transform', 'matrix( 1, 0, 0, 1, 0,0) ');
      exitEl.appendChild(press);
    }
    const showPress = (on) => {
      if (press) {
        setVisible(press, on);
        const kids = exitEl.children;
        for (let i = 0; i < kids.length; i++) {
          if (kids[i] === press) continue;
          kids[i].style.opacity = on ? '0' : '1';
        }
      } else {
        exitEl.style.filter = on ? 'brightness(0.55)' : '';
      }
    };
    if (press) setVisible(press, false);
    exitEl.addEventListener('pointerdown', () => showPress(true));
    exitEl.addEventListener('pointerup', () => showPress(false));
    exitEl.addEventListener('pointerleave', () => showPress(false));
    exitEl.addEventListener('pointercancel', () => showPress(false));
  }

  /** Press flash: brightness dip then restore (never sticky). */
  function bindPressFlash(el) {
    if (!el || el.dataset.pressBound) return;
    el.dataset.pressBound = '1';
    const down = () => {
      el.style.filter = 'brightness(0.65)';
    };
    const up = () => {
      el.style.filter = '';
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
  }

  function setBtnFillSelected(btnEl, selected) {
    if (!btnEl) return;
    const uses = btnEl.querySelectorAll('use');
    const target = selected ? YELLOW_FILL : GRAY_FILL;
    for (let i = 0; i < uses.length; i++) {
      const href =
        uses[i].getAttribute('xlink:href') || uses[i].getAttribute('href') || '';
      if (href.indexOf('Ui_Btn_Color_') >= 0 && href.indexOf('Layer1_0_FILL') >= 0) {
        const next = href.replace(/Ui_Btn_Color_\d+_Layer1_0_FILL/, target);
        uses[i].setAttribute('xlink:href', next.startsWith('#') ? next : `#${target}`);
        uses[i].setAttribute('href', next.startsWith('#') ? next : `#${target}`);
      }
    }
  }

  function syncCatalogVisual(category) {
    state.catalogCategory = category || state.catalogCategory || 'Gun';
    const ids = Object.keys(CATALOG_TO_CATEGORY);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const el = $(id);
      const cat = CATALOG_TO_CATEGORY[id];
      setBtnFillSelected(el, cat === state.catalogCategory);
    }
  }

  function applyViewBox() {
    const svg = state.svgRoot;
    if (!svg || !mount) return null;
    const rect = mount.getBoundingClientRect();
    const mw = rect.width || 1;
    const mh = rect.height || 1;
    const aspect = mw / mh;
    const artAspect = ART_W / ART_H;
    let vbW;
    let vbH;
    let vbX;
    let vbY;
    if (aspect > artAspect) {
      vbH = ART_H;
      vbW = ART_H * aspect;
      vbX = (ART_W - vbW) / 2;
      vbY = 0;
    } else {
      vbW = ART_W;
      vbH = ART_W / aspect;
      vbX = 0;
      vbY = (ART_H - vbH) / 2;
    }
    svg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
    return { x: vbX, y: vbY, w: vbW, h: vbH };
  }

  function captureAnchorBases() {
    if (state.anchorBase) return;
    state.anchorBase = new Map();
    const ids = Object.keys(ANCHOR_PRESETS);
    for (let i = 0; i < ids.length; i++) {
      const el = $(ids[i]);
      if (el) state.anchorBase.set(ids[i], parseMatrix(el));
    }
  }

  function layoutAnchors() {
    if (!state.ready || !state.svgRoot) return;
    captureAnchorBases();
    const vb = applyViewBox();
    if (!vb || !state.anchorBase) return;

    const left = vb.x - ART_CX;
    const right = vb.x + vb.w - ART_CX;
    const top = vb.y - ART_CY;
    const bottom = vb.y + vb.h - ART_CY;

    const artCorners = [
      { e: -ART_CX, f: -ART_CY, ve: left, vf: top },
      { e: ART_CX, f: -ART_CY, ve: right, vf: top },
      { e: -ART_CX, f: ART_CY, ve: left, vf: bottom },
      { e: ART_CX, f: ART_CY, ve: right, vf: bottom },
    ];

    state.anchorBase.forEach((base, id) => {
      const el = $(id);
      if (!el || !base) return;
      const preset = ANCHOR_PRESETS[id];
      if (preset && preset.kind === 'center') {
        if (id === 'Anchor_Center_Top' || id === 'Anchor_Center_Bottom') {
          const artF = preset.artF;
          const vf = artF < 0 ? top : artF > 0 ? bottom : 0;
          setMatrix(el, { ...base, e: 0, f: vf + (base.f - artF) });
          return;
        }
        setMatrix(el, { ...base, e: 0, f: 0 });
        return;
      }
      let bestD = Infinity;
      let chosen = null;
      for (let i = 0; i < artCorners.length; i++) {
        const c = artCorners[i];
        const d =
          (base.e - c.e) * (base.e - c.e) + (base.f - c.f) * (base.f - c.f);
        if (d < bestD) {
          bestD = d;
          chosen = c;
        }
      }
      if (!chosen) return;
      setMatrix(el, {
        ...base,
        e: chosen.ve + (base.e - chosen.e),
        f: chosen.vf + (base.f - chosen.f),
      });
    });
  }

  function layout() {
    layoutAnchors();
    layoutChatInput();
  }

  function bindLayoutListeners() {
    if (state.layoutBound) return;
    state.layoutBound = true;
    window.addEventListener('resize', layout);
    if (typeof ResizeObserver !== 'undefined' && mount) {
      const ro = new ResizeObserver(() => layout());
      ro.observe(mount);
    }
  }

  function syncModals() {
    setVisible($('Anchor_Center_1'), state.craftOpen);
    setVisible($('Anchor_Center_2'), state.settingOpen);
    setVisible($('Anchor_Top_Left_2'), state.genOpen);
    setVisible($('Anchor_Center_3'), state.endOpen);
    setVisible($('Panel_objective'), state.objectiveOpen);
    setVisible($('btn_interactive'), state.interactiveVisible);
    // ChatShow always on; InputChat hit zone always visible (click opens). HTML field only when typing.
    setVisible($('ChatShow'), true);
    setVisible($('InputChat'), true);
    if (chatInput) {
      chatInput.hidden = !state.chatOpen;
      if (state.chatOpen) chatInput.focus();
    }
  }

  function setCraftOpen(on) {
    state.craftOpen = !!on;
    if (state.craftOpen) {
      state.settingOpen = false;
      state.genOpen = false;
    }
    syncModals();
  }

  function setSettingOpen(on) {
    state.settingOpen = !!on;
    if (state.settingOpen) {
      state.craftOpen = false;
      state.genOpen = false;
    }
    syncModals();
  }

  function setGenOpen(on, ctx) {
    state.genOpen = !!on;
    state.genCtx = on ? ctx || state.genCtx : null;
    if (state.genOpen) {
      state.craftOpen = false;
      state.settingOpen = false;
    }
    syncModals();
  }

  function setEndOpen(on, title, payload) {
    state.endOpen = !!on;
    if (state.endOpen) {
      const ref = $('Referee_Text');
      if (ref) {
        setTspans(ref, [title || (payload && payload.title) || '']);
        applyTextColumn(ref, 'middle');
      }
      const obj = $('Objective_Text');
      if (obj) {
        setTspans(obj, [(payload && payload.detail) || '']);
        applyTextColumn(obj, 'middle');
      }
      const det = $('Detail_Text');
      if (det) {
        setTspans(det, (payload && payload.lines) || []);
        applyTextColumn(det, 'start');
      }
    }
    syncModals();
  }

  function setBackpackTier(tier) {
    const t = tier === 1 || tier === 2 || tier === 3 ? tier : 0;
    state.backpackTier = t;
    // Skill_Show lives under FL in art — never hide whole anchor for backpack.
    const fl = $('Anchor_Left_Bottom_FL');
    if (fl) setVisible(fl, true);
    for (let i = 1; i <= 3; i++) setVisible($(`BackPack_tyle_${i}`), t === i);
    for (let i = 7; i <= 12; i++) {
      const showBag = t > 0;
      if (!showBag) {
        setVisible($(`Panel_item_${i}`), false);
        setVisible($(`Panel_item_${i}_FL`), false);
        setVisible($(`Panel_item_${i}_FL_FL`), false);
      }
    }
    // Fist skills always on
    setVisible($('Skill_Show_1'), true);
    ensureIconOverlay($('Skill_Show_1'), FIST_ICON_COLOR, true);
  }

  function setInteractiveVisible(on) {
    state.interactiveVisible = !!on;
    setVisible($('btn_interactive'), state.interactiveVisible);
  }

  function syncAudioIcon() {
    const btn = $('Btn_Audio') || $('btn_Audio');
    if (!btn) return;
    let iconOn = btn.querySelector('[data-audio-icon="on"]') || $('Icon_Audio');
    let iconOff = btn.querySelector('[data-audio-icon="off"]');
    if (iconOn && !iconOn.getAttribute('data-audio-icon')) {
      iconOn.setAttribute('data-audio-icon', 'on');
    }
    if (!iconOff) {
      const tpl = state.iconAudioCloseTpl;
      if (tpl) {
        iconOff = tpl.cloneNode(true);
        stripIds(iconOff);
        iconOff.setAttribute('data-audio-icon', 'off');
        iconOff.setAttribute('transform', 'matrix( 1, 0, 0, 1, 0,0) ');
        btn.appendChild(iconOff);
      }
    }
    // True = gray + speaker; False = red fill + muted icon (state idle, not press)
    const uses = btn.querySelectorAll('use');
    for (let i = 0; i < uses.length; i++) {
      const href =
        uses[i].getAttribute('xlink:href') || uses[i].getAttribute('href') || '';
      if (href.indexOf('Ui_Btn_Color_') >= 0 && href.indexOf('Layer1_0_FILL') >= 0) {
        const target = state.audioMuted
          ? 'Ui_Btn_Color_4_Layer1_0_FILL'
          : 'Ui_Btn_Color_0_Layer1_0_FILL';
        const next = `#${target}`;
        uses[i].setAttribute('xlink:href', next);
        uses[i].setAttribute('href', next);
      }
      if (href.indexOf('Ui_Btn_Color_') >= 0 && href.indexOf('Layer0_0_1_STROKES') >= 0) {
        const target = state.audioMuted
          ? 'Ui_Btn_Color_4_Layer0_0_1_STROKES'
          : 'Ui_Btn_Color_0_Layer0_0_1_STROKES';
        if ($(target)) {
          const next = `#${target}`;
          uses[i].setAttribute('xlink:href', next);
          uses[i].setAttribute('href', next);
        }
      }
    }
    if (iconOn) setVisible(iconOn, !state.audioMuted);
    if (iconOff) setVisible(iconOff, state.audioMuted);
    // Mark True/False state for DOC contract (btn_Audio_True / False semantics)
    btn.setAttribute(
      'data-audio-state',
      state.audioMuted ? 'btn_Audio_False' : 'btn_Audio_True'
    );
  }

  function styleChatShowText(el) {
    if (!el) return;
    const texts = el.querySelectorAll('text');
    for (let i = 0; i < texts.length; i++) {
      texts[i].setAttribute('paint-order', 'stroke fill');
      texts[i].setAttribute('stroke', '#000000');
      texts[i].setAttribute('stroke-width', '2.5');
      texts[i].setAttribute('text-anchor', 'start');
    }
    const spans = allTspans(el);
    for (let i = 0; i < spans.length; i++) {
      spans[i].setAttribute('font-size', '32');
      spans[i].setAttribute('fill', '#FFFFFF');
      spans[i].setAttribute('stroke', '#000000');
      spans[i].setAttribute('stroke-width', '2.5');
      spans[i].setAttribute('paint-order', 'stroke fill');
      spans[i].setAttribute('text-anchor', 'start');
    }
  }

  function renderChatShow() {
    const show = $('ChatShow');
    if (!show) return;
    const text = show.querySelector('text');
    if (!text) return;
    const lines = state.chatLines.map((l) => `You: ${l}`);
    const maxScroll = Math.max(0, lines.length - CHAT_VISIBLE);
    if (state.chatScroll > maxScroll) state.chatScroll = maxScroll;
    if (state.chatScroll < 0) state.chatScroll = 0;
    const slice = lines.slice(state.chatScroll, state.chatScroll + CHAT_VISIBLE);

    let spans = allTspans(show);
    const base = spans[0];
    const baseX = base ? base.getAttribute('x') || '-13.05' : '-13.05';
    const baseY = base ? Number(base.getAttribute('y') || -332.95) : -332.95;

    while (spans.length < Math.max(1, slice.length)) {
      const sp = document.createElementNS(SVG_NS, 'tspan');
      sp.setAttribute('x', baseX);
      text.appendChild(sp);
      spans = allTspans(show);
    }
    for (let i = 0; i < spans.length; i++) {
      if (i < slice.length) {
        spans[i].textContent = slice[i];
        spans[i].setAttribute('x', baseX);
        spans[i].setAttribute('y', String(baseY + i * CHAT_LINE_H));
        spans[i].style.display = '';
      } else {
        spans[i].textContent = '';
        spans[i].style.display = 'none';
      }
    }
    styleChatShowText(show);
    applyTextColumn(show, 'start');
  }

  function clearChat() {
    state.chatLines.length = 0;
    state.chatScroll = 0;
    closeChat();
    const show = $('ChatShow');
    if (show) {
      const spans = allTspans(show);
      for (let i = 0; i < spans.length; i++) {
        spans[i].textContent = '';
        if (i > 0) spans[i].style.display = 'none';
      }
    }
  }

  function bindChatScroll() {
    const show = $('ChatShow');
    if (!show || show.dataset.chatWheel === '1') return;
    show.dataset.chatWheel = '1';
    show.style.pointerEvents = 'auto';
    show.addEventListener(
      'wheel',
      (e) => {
        if (state.chatLines.length <= CHAT_VISIBLE) return;
        e.preventDefault();
        e.stopPropagation();
        state.chatScroll += e.deltaY > 0 ? 1 : -1;
        renderChatShow();
      },
      { passive: false }
    );
  }

  function setInputChatPlaceholderVisible(showPlaceholder) {
    const el = $('InputChat');
    const sp = firstTspan(el);
    if (!sp) return;
    if (state._inputChatPlaceholder == null) {
      state._inputChatPlaceholder = sp.textContent || '';
    }
    sp.textContent = showPlaceholder ? state._inputChatPlaceholder : '';
  }

  function ensureChatInput() {
    if (chatInput || !mount) return;
    chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.className = 'player-ui-chat-input';
    chatInput.maxLength = 80;
    chatInput.autocomplete = 'off';
    chatInput.hidden = true;
    chatInput.addEventListener('keydown', (e) => {
      if (e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        submitChat();
      }
      if (e.code === 'Escape') {
        e.preventDefault();
        closeChat();
      }
    });
    // Clicks on the HTML field stay in chat; do not bubble to canvas.
    chatInput.addEventListener('mousedown', (e) => e.stopPropagation());
    const parent = mount.parentElement || mount;
    parent.appendChild(chatInput);
  }

  function layoutChatInput() {
    if (!chatInput || !state.chatOpen) return;
    const slot = $('InputChat');
    if (!slot || !mount) return;
    const r = slot.getBoundingClientRect();
    chatInput.style.position = 'fixed';
    chatInput.style.left = `${r.left}px`;
    chatInput.style.top = `${r.top}px`;
    chatInput.style.width = `${Math.max(120, r.width)}px`;
    chatInput.style.height = `${Math.max(24, r.height)}px`;
    chatInput.style.zIndex = '6';
  }

  function openChat() {
    ensureChatInput();
    state.chatOpen = true;
    setInputChatPlaceholderVisible(false);
    syncModals();
    layoutChatInput();
    if (opts.onChatOpen) opts.onChatOpen(true);
  }

  function closeChat() {
    state.chatOpen = false;
    if (chatInput) {
      chatInput.value = '';
      chatInput.hidden = true;
      chatInput.blur();
    }
    setInputChatPlaceholderVisible(true);
    syncModals();
    if (opts.onChatOpen) opts.onChatOpen(false);
  }

  function submitChat() {
    const text = chatInput ? chatInput.value.trim() : '';
    if (text) {
      state.chatLines.push(text);
      while (state.chatLines.length > CHAT_CAP) state.chatLines.shift();
      // Stick to latest lines
      state.chatScroll = Math.max(0, state.chatLines.length - CHAT_VISIBLE);
      renderChatShow();
      if (opts.onChatSend) opts.onChatSend(text);
    }
    closeChat();
  }

  function toggleChat() {
    if (state.chatOpen) submitChat();
    else openChat();
  }

  function isChatOpen() {
    return state.chatOpen;
  }

  function wireClicks() {
    const pressIds = [
      'btn_Craft',
      'Btn_Closted_Panel',
      'Btn_Closted_Setting',
      'Btn_confirm_Craft',
      'Btn_Setting',
      'Btn_Audio',
      'Btn_Panel_objective',
      'btn_interactive',
      'Btn_Press_false_TakeWood',
      'Btn_Press_false_TakeStone',
      'Btn_Press_false_TakeIron',
      'Btn_Press_false_Exit',
      'Btn_Panel_objective_FL',
    ];
    for (let i = 0; i < pressIds.length; i++) {
      const el = $(pressIds[i]);
      if (el) bindPressFlash(el);
    }

    const hits = [
      ['btn_Craft', () => opts.onCraftToggle && opts.onCraftToggle()],
      ['Btn_Closted_Panel', () => opts.onCraftClose && opts.onCraftClose()],
      ['Btn_confirm_Craft', () => opts.onConfirmCraft && opts.onConfirmCraft()],
      ['Btn_Setting', () => opts.onSettingOpen && opts.onSettingOpen()],
      ['Btn_Closted_Setting', () => opts.onSettingClose && opts.onSettingClose()],
      [
        'Btn_Audio',
        () => {
          state.audioMuted = !state.audioMuted;
          try {
            localStorage.setItem('theddos_mute', state.audioMuted ? '1' : '0');
          } catch (_) {
            /* ignore */
          }
          syncAudioIcon();
          if (opts.onAudioToggle) opts.onAudioToggle(state.audioMuted);
        },
      ],
      [
        'Btn_Panel_objective',
        () => {
          state.objectiveOpen = !state.objectiveOpen;
          syncModals();
        },
      ],
      [
        'btn_interactive',
        () => opts.onInteractive && opts.onInteractive(),
      ],
      [
        'Btn_Press_false_TakeWood',
        () => opts.onGenTake && opts.onGenTake('WOOD'),
      ],
      [
        'Btn_Press_false_TakeStone',
        () => opts.onGenTake && opts.onGenTake('STONE'),
      ],
      [
        'Btn_Press_false_TakeIron',
        () => opts.onGenTake && opts.onGenTake('IRON'),
      ],
      [
        'Btn_Panel_objective_FL',
        () => {
          setGenOpen(false);
          if (opts.onGenClose) opts.onGenClose();
        },
      ],
      [
        'Btn_Press_false_Exit',
        () => opts.onLeaveGame && opts.onLeaveGame(),
      ],
    ];

    for (let i = 0; i < hits.length; i++) {
      const el = $(hits[i][0]);
      if (!el) continue;
      makeHitTarget(el);
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hits[i][1]();
      });
    }

    const leaveHint = $('Anchor_Center_2');
    if (leaveHint) {
      const tspans = leaveHint.querySelectorAll('tspan');
      for (let i = 0; i < tspans.length; i++) {
        const t = (tspans[i].textContent || '').trim().toLowerCase();
        if (t.indexOf('not thing') >= 0 || t === 'leave' || t === 'exit') {
          const textEl = tspans[i].closest('text') || tspans[i];
          makeHitTarget(textEl);
          bindPressFlash(textEl);
          textEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (opts.onLeaveGame) opts.onLeaveGame();
          });
          tspans[i].textContent = 'Leave Game';
        }
      }
    }

    const catalogIds = Object.keys(CATALOG_TO_CATEGORY);
    for (let i = 0; i < catalogIds.length; i++) {
      const id = catalogIds[i];
      const el = $(id);
      if (!el) continue;
      makeHitTarget(el);
      bindPressFlash(el);
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cat = CATALOG_TO_CATEGORY[id];
        syncCatalogVisual(cat);
        if (opts.onCatalog) opts.onCatalog(cat);
      });
    }

    for (let s = 1; s <= CRAFT_SLOT_COUNT; s++) {
      const slot = $(`Slot_${s}`);
      if (!slot) continue;
      makeHitTarget(slot);
      slot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.selectedCraftIndex = s - 1;
        if (opts.onCraftSlotSelect) opts.onCraftSlotSelect(s - 1);
        syncCraftSelection();
        syncCraftDetail();
      });
    }

    for (let i = 1; i <= HOTBAR_MAIN; i++) {
      wireHotbarPanel($(`Panel_item_${i}`), i - 1);
    }
    for (let i = 7; i <= 12; i++) {
      wireHotbarPanel($(`Panel_item_${i}`), i - 1);
      wireHotbarPanel($(`Panel_item_${i}_FL`), i - 1);
      wireHotbarPanel($(`Panel_item_${i}_FL_FL`), i - 1);
    }

    const skill1 = $('Skill_Show_1');
    if (skill1) {
      makeHitTarget(skill1);
      bindPressFlash(skill1);
      skill1.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (opts.onCastFist) opts.onCastFist();
        else if (opts.onCastSkill) opts.onCastSkill('FIST');
      });
    }
    const skill2 = $('Skill_Show_2');
    if (skill2) {
      makeHitTarget(skill2);
      bindPressFlash(skill2);
      skill2.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (opts.onCastHeal) opts.onCastHeal();
        else if (opts.onCastSkill) opts.onCastSkill('SELF_HEAL');
      });
    }

    const inputChat = $('InputChat');
    if (inputChat) {
      makeHitTarget(inputChat);
      inputChat.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!state.chatOpen) openChat();
      });
    }
  }

  function wireHotbarPanel(el, slotIndex) {
    if (!el) return;
    makeHitTarget(el);
    el.dataset.slotIndex = String(slotIndex);
    el.setAttribute('data-slot-index', String(slotIndex));
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      if (opts.onHotbarDown) opts.onHotbarDown(slotIndex, e);
      else if (opts.onHotbarSelect) opts.onHotbarSelect(slotIndex);
    });
  }

  function syncCraftSlots(recipes, selectedIndex) {
    state.craftRecipes = recipes || [];
    if (selectedIndex !== undefined) {
      state.selectedCraftIndex =
        selectedIndex == null ? -1 : selectedIndex | 0;
    }
    if (state.selectedCraftIndex >= state.craftRecipes.length) {
      state.selectedCraftIndex = -1;
    }
    for (let s = 1; s <= CRAFT_SLOT_COUNT; s++) {
      const slot = $(`Slot_${s}`);
      if (!slot) continue;
      const recipe = state.craftRecipes[s - 1];
      const on = !!recipe;
      setVisible(slot, on);
      if (!on) {
        ensureIconOverlay(slot, null, false);
        ensureSelectFrame(slot, false);
        continue;
      }
      const num = findNumberHost(slot);
      const count = recipe.resultCount || 1;
      const isWeapon = (recipe.category || '') === 'Gun';
      // Weapon single: hide NN; stacks show digits
      setCountOnHost(num, count, !isWeapon && count > 0);
      const def = getItemDef(recipe.itemId);
      ensureIconOverlay(
        slot,
        (def && def.color) || '#6a7a8a',
        true,
        SLOT_ICON,
        false,
        getWeaponIconHref(recipe.itemId),
        getWeaponIconLayout(recipe.itemId)
      );
    }
    syncCraftSelection();
    syncCraftDetail();
    syncCatalogVisual(state.catalogCategory);
  }

  function syncCraftSelection() {
    for (let s = 1; s <= CRAFT_SLOT_COUNT; s++) {
      const slot = $(`Slot_${s}`);
      if (!slot) continue;
      const sel =
        state.selectedCraftIndex >= 0 &&
        s - 1 === state.selectedCraftIndex &&
        !!state.craftRecipes[s - 1];
      ensureSelectFrame(slot, sel);
    }
  }

  function syncIconCurrentSlot() {
    const el = $('Icon_Current_slot');
    if (!el) return;
    const recipe =
      state.selectedCraftIndex >= 0
        ? state.craftRecipes[state.selectedCraftIndex]
        : null;
    if (!recipe) {
      setVisible(el, false);
      ensureIconOverlay(el, null, false, CURRENT_SLOT_ICON);
      return;
    }
    setVisible(el, true);
    const def = getItemDef(recipe.itemId);
    ensureIconOverlay(
      el,
      (def && def.color) || '#6a7a8a',
      true,
      CURRENT_SLOT_ICON,
      false,
      getWeaponIconHref(recipe.itemId),
      getWeaponIconLayout(recipe.itemId)
    );
    const num = findNumberHost(el);
    const count = recipe.resultCount || 1;
    const isWeapon = (recipe.category || '') === 'Gun';
    setCountOnHost(num, count, !isWeapon && count > 1);
  }

  function syncRequestItems(recipe) {
    const cost = (recipe && recipe.cost) || null;
    const active = [];
    if (cost) {
      for (let i = 0; i < REQUEST_PACK_ORDER.length; i++) {
        const id = REQUEST_PACK_ORDER[i];
        const need = cost[id] | 0;
        if (need > 0) active.push({ id, need });
      }
      for (const id of Object.keys(cost)) {
        if (REQUEST_PACK_ORDER.indexOf(id) >= 0) continue;
        const need = cost[id] | 0;
        if (need > 0) active.push({ id, need });
      }
    }
    // Capture baked bases once for pack reposition
    if (!state._requestBaseMat) {
      state._requestBaseMat = [];
      for (let i = 0; i < REQUEST_SLOT_IDS.length; i++) {
        const el = $(REQUEST_SLOT_IDS[i]);
        state._requestBaseMat.push(el ? parseMatrix(el) : null);
      }
    }
    const bases = state._requestBaseMat.filter(Boolean);
    const n = Math.min(active.length, REQUEST_SLOT_IDS.length);
    // Pack into first N slot nodes; shift e from leftmost baked bases
    const start = 0;
    for (let i = 0; i < REQUEST_SLOT_IDS.length; i++) {
      const el = $(REQUEST_SLOT_IDS[i]);
      if (!el) continue;
      const base = state._requestBaseMat[i];
      if (i < n && active[i] && base) {
        const targetBase = bases[start + i] || base;
        setMatrix(el, { ...base, e: targetBase.e, f: targetBase.f });
        setVisible(el, true);
        const num = findNumberHost(el);
        setCountOnHost(num, active[i].need, true);
        ensureIconOverlay(
          el,
          RESOURCE_COLORS[active[i].id] || '#888',
          true
        );
      } else {
        if (base) setMatrix(el, base);
        setVisible(el, false);
        ensureIconOverlay(el, null, false);
      }
    }
  }

  function syncCraftDetail() {
    const recipe =
      state.selectedCraftIndex >= 0
        ? state.craftRecipes[state.selectedCraftIndex]
        : null;
    const nameEl = $('Name_Item');
    const detailEl = $('Detail_Item');
    if (!recipe) {
      if (nameEl) setTspans(nameEl, ['']);
      if (detailEl) setTspans(detailEl, ['', '']);
      syncRequestItems(null);
      syncIconCurrentSlot();
      return;
    }
    if (nameEl) {
      setTspans(nameEl, [recipe._label || recipe.itemId || '']);
      applyTextColumn(nameEl, 'middle');
    }
    if (detailEl) {
      const lore = recipe._lore || recipe._detail || '';
      const line2 =
        recipe.resultCount && recipe.resultCount > 1
          ? `×${recipe.resultCount}`
          : '';
      setTspans(detailEl, [lore, line2]);
      applyTextColumn(detailEl, 'middle');
    }
    syncRequestItems(recipe);
    syncIconCurrentSlot();
  }

  function getSelectedCraftIndex() {
    return state.selectedCraftIndex;
  }

  function syncHud(hud) {
    if (!state.ready || !hud) return;

    const waveEl = $('Number_Wave');
    if (waveEl) {
      const sp = firstTspan(waveEl);
      if (sp) {
        sp.textContent = String(hud.waveIndex != null ? hud.waveIndex : 0);
        sp.setAttribute('fill', hud.waveActive ? 'rgb(255, 0, 0)' : '#FFFFFF');
      }
    }

    const detail = $('ObjectiveDetail');
    if (detail) {
      const hp = Math.ceil(Math.max(0, hud.baseHp || 0));
      const max = Math.ceil(Math.max(0, hud.baseMaxHp || 0));
      const line2 =
        hud.baseAlive === false && hud.baseMaxHp
          ? 'Base destroyed'
          : `Base Hp ${hp}/${max || hp}`;
      setTspans(detail, ['Do not lose your', line2]);
    }

    const gun = $('GunDetail');
    if (gun) {
      setTspans(gun, [
        `(${hud.gunName || 'EMPTY'})`,
        hud.ammoLine || 'AMMO : —',
      ]);
    }

    syncHpFill(hud.playerHp, hud.playerMaxHp, hud.dt || 0.016);
    syncDay(hud.simTimeSec || 0, !!hud.enemiesPresent);
    syncHotbarSlots(hud.slots || [], hud.activeHotbar || 0);
    if (hud.backpackTier != null) setBackpackTier(hud.backpackTier);
    syncEffects(hud.effects || []);
    syncSkills(hud.skills || []);
    if (hud.interactiveVisible != null) {
      setInteractiveVisible(!!hud.interactiveVisible);
    }
    applyTextColumn($('Number_Wave'), 'end');
    applyTextColumn($('ObjectiveDetail'), 'start');
    applyTextColumn($('GunDetail'), 'start');
  }

  function syncHpFill(hp, maxHp, dt) {
    const el = $('Hp_Fill');
    const bg = $('Hp_Bg');
    if (!el) return;
    if (!state.hpFillBase) state.hpFillBase = parseMatrix(el);
    if (bg && !state.hpBgBase) state.hpBgBase = parseMatrix(bg);
    const ratio = maxHp > 0 ? Math.max(0, Math.min(1, (hp || 0) / maxHp)) : 0;
    if (ratio < state.hpTargetRatio - 0.001) {
      state.hpShakeT = 0.22;
    }
    state.hpTargetRatio = ratio;
    // Tween display toward target (right→left via scale a)
    const k = 1 - Math.exp(-12 * (dt || 0.016));
    state.hpDisplayRatio += (state.hpTargetRatio - state.hpDisplayRatio) * k;
    const base = state.hpFillBase;
    // Anchor right: shift e as a shrinks so bar empties leftward visually
    const fullA = base.a;
    const a = fullA * state.hpDisplayRatio;
    const shrink = fullA - a;
    setMatrix(el, { ...base, a, e: base.e + shrink });

    if (bg && state.hpBgBase) {
      if (state.hpShakeT > 0) {
        state.hpShakeT -= dt || 0.016;
        const s = Math.sin(state.hpShakeT * 60) * 2.5;
        setMatrix(bg, {
          ...state.hpBgBase,
          e: state.hpBgBase.e + s,
          f: state.hpBgBase.f + s * 0.4,
        });
      } else {
        setMatrix(bg, state.hpBgBase);
      }
    }
  }

  function makeDayBarGroup(id, trackColor, fillColor, transform) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('id', id);
    if (transform) g.setAttribute('transform', transform);
    const track = document.createElementNS(SVG_NS, 'rect');
    track.setAttribute('x', String(LOAD_DAY_X));
    track.setAttribute('y', String(LOAD_DAY_Y));
    track.setAttribute('width', String(LOAD_DAY_W));
    track.setAttribute('height', String(LOAD_DAY_H));
    track.setAttribute('fill', trackColor);
    track.setAttribute('data-day-track', '1');
    const fill = document.createElementNS(SVG_NS, 'rect');
    fill.setAttribute('x', String(LOAD_DAY_X));
    fill.setAttribute('y', String(LOAD_DAY_Y));
    fill.setAttribute('width', '0');
    fill.setAttribute('height', String(LOAD_DAY_H));
    fill.setAttribute('fill', fillColor);
    fill.setAttribute('data-day-fill', '1');
    g.appendChild(track);
    g.appendChild(fill);
    return g;
  }

  function ensureDayBars() {
    if (state.dayBarsReady) return;
    const load = $('Load_Day');
    if (!load || !load.parentNode) return;
    const parent = load.parentNode;
    const xf = load.getAttribute('transform') || 'matrix( 1, 0, 0, 1, 0.1,31.3) ';
    setVisible(load, false);

    let morning = $('Load_Day_Morning');
    let night = $('Load_Day_Night');
    if (!morning) {
      morning = makeDayBarGroup(
        'Load_Day_Morning',
        DAY_PURPLE,
        DAY_CYAN,
        xf
      );
      parent.insertBefore(morning, load.nextSibling);
    }
    if (!night) {
      night = makeDayBarGroup('Load_Day_Night', DAY_CYAN, DAY_PURPLE, xf);
      parent.insertBefore(night, morning.nextSibling);
    }
    state.dayBarsReady = true;
  }

  function syncDay(simTimeSec, enemiesPresent) {
    const timeEl = $('NumberTime');
    if (timeEl) {
      const sp = firstTspan(timeEl);
      if (sp) {
        sp.textContent = formatClockFromSim(simTimeSec);
        sp.setAttribute('fill', enemiesPresent ? 'rgb(255, 0, 0)' : '#FFFFFF');
      }
    }
    ensureDayBars();
    const morning = $('Load_Day_Morning');
    const night = $('Load_Day_Night');
    if (!morning || !night) return;

    const { isMorning, progress } = getDayBarPhase(simTimeSec);
    const fillW = Math.max(0, Math.min(1, progress)) * LOAD_DAY_W;

    setVisible(morning, isMorning);
    setVisible(night, !isMorning);
    const active = isMorning ? morning : night;
    const fill = active.querySelector('[data-day-fill]');
    if (fill) fill.setAttribute('width', String(fillW));
  }

  function syncInventoryBar(slots, activeHotbar, backpackTier) {
    syncHotbarSlots(slots || [], activeHotbar || 0);
    if (backpackTier != null) setBackpackTier(backpackTier);
  }

  function syncHotbarSlots(slots, activeHotbar) {
    for (let i = 0; i < 12; i++) {
      const slot = slots[i];
      const filled = !!(slot && slot.itemId);
      const panels = [];
      // Main hotbar 1–6: always show frames (empty = empty frame)
      if (i < HOTBAR_MAIN) panels.push($(`Panel_item_${i + 1}`));
      if (i >= 6) {
        panels.push($(`Panel_item_${i + 1}`));
        panels.push($(`Panel_item_${i + 1}_FL`));
      }
      for (let p = 0; p < panels.length; p++) {
        const el = panels[p];
        if (!el) continue;
        if (i < HOTBAR_MAIN) {
          setVisible(el, true);
        } else {
          // Backpack slots: only when filled (tier gate elsewhere)
          setVisible(el, filled);
          if (!filled) {
            ensureIconOverlay(el, null, false);
            continue;
          }
        }
        el.style.opacity = '1';
        ensureSelectFrame(el, i === activeHotbar);
        const num = findNumberHost(el);
        if (!filled) {
          setCountOnHost(num, 0, false);
          // Empty main slots keep a faint pad for a reliable click target.
          if (i < HOTBAR_MAIN) {
            ensureIconOverlay(el, EMPTY_SLOT_PAD, true, SLOT_ICON, true);
          } else {
            ensureIconOverlay(el, null, false);
          }
          continue;
        }
        const kind = slot.kind || '';
        const isWeapon = kind === 'WEAPON';
        const count = slot.count || 0;
        setCountOnHost(num, count, !isWeapon && count > 0);
        ensureIconOverlay(
          el,
          slot.color || '#6a7a8a',
          true,
          SLOT_ICON,
          false,
          getWeaponIconHref(slot.weaponId || slot.itemId),
          getWeaponIconLayout(slot.weaponId || slot.itemId)
        );
      }
    }
  }

  /** Center N effect boxes among Effect_Show_1..4 */
  function syncEffects(effects) {
    const list = Array.isArray(effects) ? effects.slice(0, 4) : [];
    const n = list.length;
    for (let i = 0; i < EFFECT_IDS.length; i++) {
      const el = $(EFFECT_IDS[i]);
      if (!el) continue;
      if (!state._effectBase) state._effectBase = {};
      if (!state._effectBase[EFFECT_IDS[i]]) {
        state._effectBase[EFFECT_IDS[i]] = parseMatrix(el);
      }
      if (n === 0) {
        setVisible(el, false);
        ensureIconOverlay(el, null, false);
        continue;
      }
      // Show first n effects; reposition toward center when n=1
      const show = i < n;
      setVisible(el, show);
      if (!show) {
        ensureIconOverlay(el, null, false);
        continue;
      }
      const base = state._effectBase[EFFECT_IDS[i]];
      if (n === 1) {
        setMatrix(el, { ...base, e: 0 });
      } else {
        setMatrix(el, base);
      }
      const sp = firstTspan(el);
      if (sp && list[i]) {
        sp.textContent = String(list[i].label || list[i].id || '').slice(0, 4);
      }
      ensureIconOverlay(el, (list[i] && list[i].color) || '#6b9fbf', true);
    }
  }

  function syncSkills(skills) {
    // skills: [{ id, cooldownSec }] — slot0 FIST · slot1 SELF_HEAL · hide unused
    for (let i = 0; i < SKILL_IDS.length; i++) {
      const el = $(SKILL_IDS[i]);
      if (!el) continue;
      const sk = skills[i];
      if (i === 0) {
        setVisible(el, true);
        const num = findNumberHost(el);
        const cd = sk ? sk.cooldownSec || 0 : 0;
        setCountOnHost(num, Math.ceil(cd), cd > 0.05);
        ensureIconOverlay(el, FIST_ICON_COLOR, true);
        continue;
      }
      if (sk && (sk.id === 'SELF_HEAL' || i === 1)) {
        setVisible(el, true);
        const num = findNumberHost(el);
        const cd = sk.cooldownSec || 0;
        setCountOnHost(num, Math.ceil(cd), cd > 0.05);
        ensureIconOverlay(el, HEAL_ICON_COLOR, true);
        continue;
      }
      if (!sk) {
        setVisible(el, false);
        ensureIconOverlay(el, null, false);
        continue;
      }
      setVisible(el, true);
      const num = findNumberHost(el);
      const cd = sk.cooldownSec || 0;
      setCountOnHost(num, Math.ceil(cd), cd > 0.05);
      ensureIconOverlay(el, '#7a8a9a', true);
    }
  }

  function syncGenPanel(info) {
    if (!info) return;
    const name = $('NameGen');
    if (name) {
      setTspans(name, [info.label || 'Gen']);
      applyTextColumn(name, 'middle');
    }
    const hp = $('HpGen');
    if (hp) {
      setTspans(hp, [
        `${Math.ceil(info.hp || 0)}/${Math.ceil(info.maxHp || 0)}`,
      ]);
      applyTextColumn(hp, 'middle');
    }
    const counts = info.counts || { WOOD: 0, STONE: 0, IRON: 0 };
    const map = [
      ['Slot_gen_Wood', 'WOOD', counts.WOOD || 0],
      ['Slot_gen_Stone', 'STONE', counts.STONE || 0],
      ['Slot_gen_Iron', 'IRON', counts.IRON || 0],
    ];
    for (let i = 0; i < map.length; i++) {
      const slot = $(map[i][0]);
      if (!slot) continue;
      const resId = map[i][1];
      const c = map[i][2];
      const num = findNumberHost(slot);
      setVisible(slot, true);
      setCountOnHost(num, c, c > 0);
      ensureIconOverlay(slot, RESOURCE_COLORS[resId] || '#888', true);
    }
  }

  async function mountSvg() {
    if (!mount) return false;
    const res = await fetch(`${PLAYER_UI_SVG_URL}?v=20261020d`);
    if (!res.ok) throw new Error(`PlayerUI SVG ${res.status}`);
    mount.innerHTML = await res.text();
    state.svgRoot =
      mount.querySelector('svg') ||
      (mount.firstElementChild && mount.firstElementChild.tagName === 'svg'
        ? mount.firstElementChild
        : null);
    if (!state.svgRoot) throw new Error('PlayerUI svg root missing');
    state.svgRoot.setAttribute('width', '100%');
    state.svgRoot.setAttribute('height', '100%');
    state.svgRoot.style.display = 'block';
    state.svgRoot.style.width = '100%';
    state.svgRoot.style.height = '100%';
    state.svgRoot.style.pointerEvents = 'none';

    // Hide modal anchors immediately so inject never flashes open panels.
    const earlyHide = [
      'Anchor_Center_1',
      'Anchor_Center_2',
      'Anchor_Center_3',
      'Anchor_Top_Left_2',
      'btn_interactive',
      'Icon_Current_slot',
    ];
    for (let i = 0; i < earlyHide.length; i++) {
      setVisible($(earlyHide[i]), false);
    }
    for (let i = 0; i < EFFECT_IDS.length; i++) setVisible($(EFFECT_IDS[i]), false);
    for (let i = 1; i < SKILL_IDS.length; i++) setVisible($(SKILL_IDS[i]), false);

    const hitRoots = [
      'Anchor_Right_Top',
      'Anchor_Center_1',
      'Anchor_Center_2',
      'Anchor_Center_3',
      'Anchor_Center_Bottom',
      'Anchor_Left_Bottom',
      'Anchor_Left_Bottom_FL',
      'Anchor_Left_Bottom_2',
      'Anchor_Top_Left_2',
      'btn_Craft',
      'Btn_Setting',
      'Btn_Audio',
      'btn_interactive',
    ];
    for (let i = 0; i < hitRoots.length; i++) {
      const el = $(hitRoots[i]);
      if (el) el.style.pointerEvents = 'auto';
    }

    try {
      state.audioMuted = localStorage.getItem('theddos_mute') === '1';
    } catch (_) {
      state.audioMuted = false;
    }

    state.ready = true;
    state._btnArtReady = false;
    state.pressOnTpl = null;
    state.iconAudioCloseTpl = null;
    state.anchorBase = null;
    state.hpFillBase = null;
    state.hpBgBase = null;
    state.hpDisplayRatio = 1;
    state.hpTargetRatio = 1;
    state.craftOpen = false;
    state.settingOpen = false;
    state.genOpen = false;
    state.endOpen = false;
    state.chatOpen = false;
    state.objectiveOpen = true;
    state.catalogCategory = 'Gun';
    state.selectedCraftIndex = -1;
    await ensureBtnCatalogArt();
    setBackpackTier(0);
    setInteractiveVisible(false);
    for (let i = 0; i < EFFECT_IDS.length; i++) setVisible($(EFFECT_IDS[i]), false);
    for (let i = 1; i < SKILL_IDS.length; i++) setVisible($(SKILL_IDS[i]), false);
    setVisible($('Skill_Show_1'), true);
    ensureIconOverlay($('Skill_Show_1'), FIST_ICON_COLOR, true);
    setVisible($('Icon_Current_slot'), false);
    syncRequestItems(null);
    syncIconCurrentSlot();
    // Hotbar frames 1–6 visible with empty hit pads at start
    for (let i = 1; i <= HOTBAR_MAIN; i++) {
      const el = $(`Panel_item_${i}`);
      if (el) {
        setVisible(el, true);
        setCountOnHost(findNumberHost(el), 0, false);
        ensureIconOverlay(el, EMPTY_SLOT_PAD, true, SLOT_ICON, true);
      }
    }
    ensureChatInput();
    state.dayBarsReady = false;
    ensureDayBars();
    bindChatScroll();
    clearChat();
    styleChatShowText($('ChatShow'));
    setInputChatPlaceholderVisible(true);
    applyAllTextColumns();
    syncModals();
    syncAudioIcon();
    syncCatalogVisual('Gun');
    wireClicks();
    bindExitPressArt($('Btn_Press_false_Exit'));
    bindLayoutListeners();
    layout();
    return true;
  }

  return {
    state,
    mountSvg,
    layout,
    syncHud,
    syncInventoryBar,
    syncCraftSlots,
    syncCatalogVisual,
    syncGenPanel,
    setCraftOpen,
    setSettingOpen,
    setGenOpen,
    setEndOpen,
    setBackpackTier,
    setInteractiveVisible,
    getSelectedCraftIndex,
    toggleChat,
    openChat,
    closeChat,
    clearChat,
    isChatOpen,
    isReady: () => state.ready,
    isCraftOpen: () => state.craftOpen,
    isSettingOpen: () => state.settingOpen,
    isGenOpen: () => state.genOpen,
    isEndOpen: () => state.endOpen,
  };
}

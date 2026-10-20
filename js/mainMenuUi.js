/**
 * MainMenu.svg UI — aspect-safe mount, placeholder inputs, Btn press states, HandleBar scroll.
 * Anchor snap (Unity-like): expand viewBox to viewport aspect, then pin
 * Anchor_Center / Anchor_Top_Left / Anchor_Top_Right / Anchor_Bottom_Right
 * to screen edges (geometric art corner + inset). MainMeun at art center.
 */

const MENU_ART_W = 1280;
const MENU_ART_H = 720;
const MENU_ART_CX = MENU_ART_W / 2;
const MENU_ART_CY = MENU_ART_H / 2;

/** Preset id → art-corner in MainMeun local (design 1280×720, origin = center). */
const ANCHOR_PRESETS = Object.freeze({
  Anchor_Center: Object.freeze({ kind: 'center', artE: 0, artF: 0 }),
  Anchor_Top_Left: Object.freeze({
    kind: 'corner',
    artE: -MENU_ART_CX,
    artF: -MENU_ART_CY,
  }),
  Anchor_Top_Right: Object.freeze({
    kind: 'corner',
    artE: MENU_ART_CX,
    artF: -MENU_ART_CY,
  }),
  Anchor_Bottom_Right: Object.freeze({
    kind: 'corner',
    artE: MENU_ART_CX,
    artF: MENU_ART_CY,
  }),
  Anchor_Bottom_Left: Object.freeze({
    kind: 'corner',
    artE: -MENU_ART_CX,
    artF: MENU_ART_CY,
  }),
});

import { GameMode } from './config.js';
import {
  PLAYABLE_MENU_SKINS,
  clampPlayableMenuSkinId,
} from './unitVisual.js';

export const MAIN_MENU_SVG_URL = 'Asset/AssetSVG/Ui/MainMenu.svg';
export const BTN_SVG_URL = 'Asset/AssetSVG/Ui/Btn.svg';
const SVG_NS = 'http://www.w3.org/2000/svg';

/** @typedef {'alone'|'join'} PlaySessionMode */
/** @typedef {'flat'|'resource'|'loadFile'} WorldPick */

/** Roster row ids in GroupJoinRoom (7 slots). Placeholder text was "n# PLAYER NAME". */
export const ROSTER_SLOTS = Object.freeze([
  { row: 'Player_n', kick: 'KickPlayer_n' },
  { row: 'Player_n_FL', kick: 'KickPlayer_n_FL' },
  { row: 'Player_n_FL_FL', kick: 'KickPlayer_n_FL_FL' },
  { row: 'Player_n_FL_FL_FL', kick: 'KickPlayer_n_FL_FL_FL' },
  { row: 'Player_n_FL_FL_FL_FL', kick: 'KickPlayer_n_FL_FL_FL_FL' },
  { row: 'Player_n_FL_FL_FL_FL_FL', kick: 'KickPlayer_n_FL_FL_FL_FL_FL' },
  { row: 'Player_n_FL_FL_FL_FL_FL_FL', kick: 'KickPlayer_n_FL_FL_FL_FL_FL_FL' },
]);

/**
 * @param {object} opts
 * @param {HTMLElement} opts.mount
 * @param {HTMLInputElement} [opts.nameInput]
 * @param {HTMLInputElement} [opts.roomInput] — overlay for art placeholder "1234567" (Host code)
 * @param {HTMLInputElement} [opts.joinInput] — overlay for art placeholder "Input" (code to Join)
 * @param {HTMLInputElement} [opts.saveFileInput]
 * @param {() => void} opts.onPlay
 * @param {() => void} [opts.onJoinStub]
 * @param {() => void} [opts.onLoadFile]
 * @param {(muted: boolean) => void} [opts.onAudioToggle]
 * @param {() => void} [opts.onLink]
 * @param {(name: string) => void} [opts.onNameChange]
 * @param {(slot: number) => void} [opts.onKick]
 * @param {() => object[]} [opts.getPlayers]
 * @param {() => boolean} [opts.isHost]
 */
export function createMainMenuUi(opts) {
  const mount = opts.mount;
  const state = {
    ready: false,
    svgRoot: null,
    playSession: /** @type {PlaySessionMode} */ ('alone'),
    worldPick: /** @type {WorldPick} */ ('flat'),
    playerName: 'Player',
    roomCode: '',
    joinText: '',
    skinId: 'Skin_Default_1',
    audioMuted: false,
    /** @type {Map<string, { trueEl: Element, falseEl: Element }>} */
    pressPairs: new Map(),
    /** @type {Element | null} */
    pressTrueTpl: null,
    /** @type {Element | null} */
    pressFalseTpl: null,
    layoutBound: false,
    kicksWired: false,
    /** First MENU visit this session — rise-up tween once. */
    enterTweenPlayed: false,
    /** How-to panel — off until Btn_Red_LabelShow_on. */
    labelShowOpen: false,
    /** @type {Map<string, { a: number, b: number, c: number, d: number, e: number, f: number }>|null} */
    anchorBase: null,
  };

  /**
   * @type {Array<{
   *   input: HTMLInputElement,
   *   placeholderText: string,
   *   hideWhenAlone?: boolean,
   *   readOnlyInJoin?: boolean,
   *   slotEl?: Element | null,
   * }>}
   */
  const inputBindings = [];

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

  function findTspanByText(exact) {
    if (!state.svgRoot) return null;
    const spans = state.svgRoot.querySelectorAll('tspan');
    for (let i = 0; i < spans.length; i++) {
      if ((spans[i].textContent || '').trim() === exact) return spans[i];
    }
    return null;
  }

  function stripIds(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.removeAttribute) root.removeAttribute('id');
    const all = root.querySelectorAll('[id]');
    for (let i = 0; i < all.length; i++) all[i].removeAttribute('id');
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

  /** Ensure each Select_* has both Btn_Press True + False (from Btn.svg pattern already in MainMenu). */
  function ensurePressPair(selectId) {
    if (state.pressPairs.has(selectId)) return state.pressPairs.get(selectId);
    const selectEl = $(selectId);
    if (!selectEl) return null;

    const trueSrc =
      state.pressTrueTpl ||
      $('Btn_Press_True') ||
      $('Btn_Press_True_FL');
    const falseSrc =
      state.pressFalseTpl ||
      $('Btn_Press_false') ||
      $('Btn_Press_false_FL') ||
      $('Btn_Press_False');
    if (!trueSrc || !falseSrc) return null;

    const originals = [];
    for (let i = 0; i < selectEl.children.length; i++) {
      const c = selectEl.children[i];
      if (c.id && String(c.id).indexOf('Btn_Press_') === 0) originals.push(c);
    }

    const trueEl = trueSrc.cloneNode(true);
    const falseEl = falseSrc.cloneNode(true);
    stripIds(trueEl);
    stripIds(falseEl);
    trueEl.setAttribute('data-press', 'true');
    falseEl.setAttribute('data-press', 'false');
    trueEl.setAttribute('transform', 'matrix( 1, 0, 0, 1, 0,3) ');
    falseEl.setAttribute('transform', 'matrix( 1, 0, 0, 1, 0,3) ');

    const insertBefore = originals[0] || selectEl.firstChild;
    selectEl.insertBefore(trueEl, insertBefore);
    selectEl.insertBefore(falseEl, insertBefore);
    for (let i = 0; i < originals.length; i++) {
      originals[i].style.display = 'none';
      originals[i].setAttribute('aria-hidden', 'true');
    }

    const pair = { trueEl, falseEl };
    state.pressPairs.set(selectId, pair);
    return pair;
  }

  function setSelectPressed(selectId, pressed) {
    const pair = ensurePressPair(selectId);
    if (!pair) {
      const el = $(selectId);
      if (el) {
        el.style.opacity = pressed ? '1' : '0.55';
        el.style.cursor = 'pointer';
      }
      return;
    }
    setVisible(pair.trueEl, pressed);
    setVisible(pair.falseEl, !pressed);
    const el = $(selectId);
    if (el) {
      el.style.opacity = '1';
      el.style.filter = 'none';
      el.style.cursor = 'pointer';
      makeHitTarget(el);
    }
  }

  function syncLabelShow() {
    // Panel id LabelShow (legacy) or decorative siblings under Anchor_Top_Right.
    const panel = $('LabelShow');
    if (panel) {
      setVisible(panel, state.labelShowOpen);
    } else {
      const anchor = $('Anchor_Top_Right');
      if (anchor) {
        for (let i = 0; i < anchor.children.length; i++) {
          const c = anchor.children[i];
          if (c && c.id === 'Btn_Red_LabelShow_on') continue;
          setVisible(c, state.labelShowOpen);
        }
      }
    }
    const btn = $('Btn_Red_LabelShow_on');
    if (btn) {
      makeHitTarget(btn);
      btn.style.opacity = state.labelShowOpen ? '1' : '0.85';
    }
  }

  function syncAudioIcon() {
    const btn = $('btn_Audio');
    if (!btn) return;
    const artTrue = btn.querySelector('[data-audio-art="true"]');
    const artFalse = btn.querySelector('[data-audio-art="false"]');
    if (artTrue && artFalse) {
      setVisible(artTrue, !state.audioMuted);
      setVisible(artFalse, state.audioMuted);
    } else {
      // Fallback: baked Icon_Audio / Icon_Audio_Close
      let iconOn = btn.querySelector('[data-audio-icon="on"]');
      let iconOff = btn.querySelector('[data-audio-icon="off"]');
      const baked = $('Icon_Audio');
      if (!iconOn && baked) {
        iconOn = baked;
        iconOn.setAttribute('data-audio-icon', 'on');
      }
      if (iconOn) setVisible(iconOn, !state.audioMuted);
      if (iconOff) setVisible(iconOff, state.audioMuted);
    }
    // Contract: unmuted = btn_Audio_True · muted = btn_Audio_False (state idle)
    btn.setAttribute(
      'data-audio-state',
      state.audioMuted ? 'btn_Audio_False' : 'btn_Audio_True'
    );
  }

  function syncPlaySessionUi() {
    const alone = state.playSession === 'alone';
    setSelectPressed('Select_Alone_player', alone);
    setSelectPressed('Select_JoinRoom_player', !alone);
    setVisible($('GroupJoinRoom'), !alone);
    setVisible($('Join_or_Crate'), !alone);
    setVisible($('NumberHushing'), !alone);

    for (let i = 0; i < inputBindings.length; i++) {
      const b = inputBindings[i];
      if (!b.hideWhenAlone) continue;
      b.input.hidden = alone;
      b.input.style.display = alone ? 'none' : 'block';
      if (!alone && b.readOnlyInJoin) {
        b.input.readOnly = true;
        b.input.value = state.roomCode;
      } else if (!b.readOnlyInJoin) {
        b.input.readOnly = false;
      }
    }
    syncRoster();
    layoutInputs();
  }

  /**
   * Replace "n# PLAYER NAME" samples with players[] · hide empty rows · Kick non-host.
   */
  function syncRoster() {
    if (!state.svgRoot) return;
    const players =
      typeof opts.getPlayers === 'function' ? opts.getPlayers() || [] : [];
    const amHost =
      typeof opts.isHost === 'function' ? !!opts.isHost() : true;

    for (let i = 0; i < ROSTER_SLOTS.length; i++) {
      const spec = ROSTER_SLOTS[i];
      const row = $(spec.row);
      const kick = $(spec.kick);
      const p = players[i];
      if (!row) continue;

      if (!p || p.connected === false) {
        setVisible(row, false);
        continue;
      }

      setVisible(row, true);
      const tspan = row.querySelector('tspan');
      if (tspan) {
        const label = `${i + 1}# ${p.name || 'Player'}`;
        tspan.textContent = label;
        tspan.style.visibility = '';
        const textEl = tspan.closest('text');
        if (textEl) textEl.style.visibility = '';
      }

      if (kick) {
        const canKick = amHost && !p.isHost && i > 0;
        setVisible(kick, canKick);
        if (canKick) makeHitTarget(kick);
      }
    }
  }

  function wireKickButtons() {
    if (state.kicksWired) return;
    state.kicksWired = true;
    for (let i = 0; i < ROSTER_SLOTS.length; i++) {
      const slot = i;
      const kick = $(ROSTER_SLOTS[i].kick);
      if (!kick) continue;
      makeHitTarget(kick);
      kick.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof opts.onKick === 'function') opts.onKick(slot);
      });
    }
  }

  function syncWorldPickUi() {
    setSelectPressed('Select_FlatLand_Mode', state.worldPick === 'flat');
    setSelectPressed('Select_Resource', state.worldPick === 'resource');
    setSelectPressed('Select_Resource_FL', state.worldPick === 'loadFile');
  }

  const HIDDEN_SKIN_IDS = Object.freeze([
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

  function syncSkinUi() {
    state.skinId = clampPlayableMenuSkinId(state.skinId);
    for (let i = 0; i < PLAYABLE_MENU_SKINS.length; i++) {
      const id = PLAYABLE_MENU_SKINS[i];
      const el = $(id);
      if (!el) continue;
      el.style.display = '';
      el.style.opacity = id === state.skinId ? '1' : '0.4';
      el.style.filter = id === state.skinId ? 'none' : 'grayscale(0.25)';
      makeHitTarget(el);
    }
    // Asset / Custom slots — deferred; hide until pack expands.
    for (let i = 0; i < HIDDEN_SKIN_IDS.length; i++) {
      const el = $(HIDDEN_SKIN_IDS[i]);
      if (!el) continue;
      el.style.display = 'none';
      el.style.pointerEvents = 'none';
    }
  }

  function applyAll() {
    syncPlaySessionUi();
    syncWorldPickUi();
    syncSkinUi();
    syncAudioIcon();
    syncLabelShow();
    syncRoster();
    layoutInputs();
  }

  function gameModeFromPick() {
    if (state.worldPick === 'resource') return GameMode.WORLD_TYPE;
    return GameMode.FLAT_SURVIVAL;
  }

  /** Placeholder <text> — YOUR NAME / 1234567 / Input (position only). */
  function resolvePlaceholderText(binding) {
    const tspan = findTspanByText(binding.placeholderText);
    if (!tspan) return null;
    return tspan.closest('text') || tspan;
  }

  function resolveSlotElement(binding) {
    binding.slotEl = null;
    const textEl = resolvePlaceholderText(binding);
    if (textEl) {
      binding.slotEl = textEl;
      return textEl;
    }
    return null;
  }

  /**
   * Map SVG element → overlay CSS box using getScreenCTM.
   * @returns {{ left: number, top: number, width: number, height: number } | null}
   */
  function svgElToOverlayBox(el, overlayRoot) {
    if (!el || !state.svgRoot || !overlayRoot) return null;
    const or = overlayRoot.getBoundingClientRect();
    try {
      const svg = state.svgRoot;
      const bb = el.getBBox();
      const ctm = el.getScreenCTM && el.getScreenCTM();
      if (ctm && typeof svg.createSVGPoint === 'function') {
        const pt = svg.createSVGPoint();
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
          pt.x = corners[i][0];
          pt.y = corners[i][1];
          const p = pt.matrixTransform(ctm);
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        }
        return {
          left: minX - or.left,
          top: minY - or.top,
          width: maxX - minX,
          height: maxY - minY,
        };
      }
    } catch (_) {
      /* fall through */
    }
    const r = el.getBoundingClientRect();
    if (!r || r.width < 1) return null;
    return {
      left: r.left - or.left,
      top: r.top - or.top,
      width: r.width,
      height: r.height,
    };
  }

  /** Measure text width with the input's computed font (canvas). */
  function measureInputTextWidth(input, sample) {
    try {
      const cs = window.getComputedStyle(input);
      const canvas = measureInputTextWidth._c || document.createElement('canvas');
      measureInputTextWidth._c = canvas;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      return Math.ceil(ctx.measureText(sample || '').width);
    } catch (_) {
      return 0;
    }
  }

  /**
   * Free-size overlay: art text gives anchor only — widen so HTML font is never clipped.
   * Centered name grows both sides; room/join grow to the right.
   */
  function expandOverlayBoxFree(box, input) {
    if (!box || !input) return box;
    const sample =
      String(input.value || '').trim() ||
      String(input.placeholder || bindingPlaceholder(input) || 'W');
    const pad = 28;
    let need = measureInputTextWidth(input, sample) + pad;
    // Room for typing beyond placeholder (name up to ~16 glyphs visible).
    if (input.classList.contains('menu-name-input')) {
      need = Math.max(need, measureInputTextWidth(input, 'W'.repeat(14)) + pad);
    } else {
      need = Math.max(need, measureInputTextWidth(input, 'W'.repeat(10)) + pad);
    }
    need = Math.max(need, Math.ceil(box.width * 1.25) + pad);
    const grow = Math.max(0, need - box.width);
    const hPad = 6;
    const centered = input.classList.contains('menu-name-input');
    return {
      left: centered ? box.left - grow / 2 : box.left,
      top: box.top - hPad / 2,
      width: box.width + grow,
      height: Math.max(box.height + hPad, 28),
    };
  }

  function bindingPlaceholder(input) {
    for (let i = 0; i < inputBindings.length; i++) {
      if (inputBindings[i].input === input) {
        return inputBindings[i].placeholderText;
      }
    }
    return '';
  }

  /**
   * Expand viewBox so user-space matches mount aspect (design 1280×720 stays centered).
   * Extra margin = real screen edges for corner anchors.
   */
  function applyMenuViewBox() {
    const svg = state.svgRoot;
    if (!svg || !mount) return null;
    const rect = mount.getBoundingClientRect();
    const mw = rect.width || 1;
    const mh = rect.height || 1;
    const aspect = mw / mh;
    const artAspect = MENU_ART_W / MENU_ART_H;
    let vbW;
    let vbH;
    let vbX;
    let vbY;
    if (aspect > artAspect) {
      vbH = MENU_ART_H;
      vbW = MENU_ART_H * aspect;
      vbX = (MENU_ART_W - vbW) / 2;
      vbY = 0;
    } else {
      vbW = MENU_ART_W;
      vbH = MENU_ART_W / aspect;
      vbX = 0;
      vbY = (MENU_ART_H - vbH) / 2;
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

  /**
   * Pin Anchor_* groups to viewport edges/center using design inset from art corners.
   * Geometric: use nearest art corner to baked matrix when id corner mismatches export.
   */
  function layoutAnchors() {
    if (!state.ready || !state.svgRoot) return;
    captureAnchorBases();
    const vb = applyMenuViewBox();
    if (!vb || !state.anchorBase) return;

    const left = vb.x - MENU_ART_CX;
    const right = vb.x + vb.w - MENU_ART_CX;
    const top = vb.y - MENU_ART_CY;
    const bottom = vb.y + vb.h - MENU_ART_CY;

    const artCorners = [
      { e: -MENU_ART_CX, f: -MENU_ART_CY, ve: left, vf: top },
      { e: MENU_ART_CX, f: -MENU_ART_CY, ve: right, vf: top },
      { e: -MENU_ART_CX, f: MENU_ART_CY, ve: left, vf: bottom },
      { e: MENU_ART_CX, f: MENU_ART_CY, ve: right, vf: bottom },
    ];

    state.anchorBase.forEach((base, id) => {
      const el = $(id);
      if (!el || !base) return;
      const preset = ANCHOR_PRESETS[id];
      if (preset && preset.kind === 'center') {
        setMatrix(el, { ...base, e: 0, f: 0 });
        return;
      }

      // Prefer preset art corner from id; if baked pivot is clearly nearer another
      // corner (export naming quirk), snap that geometric corner instead.
      let artE = preset ? preset.artE : 0;
      let artF = preset ? preset.artF : 0;
      let ve = 0;
      let vf = 0;
      let bestD = Infinity;
      let chosen = null;
      for (let i = 0; i < artCorners.length; i++) {
        const c = artCorners[i];
        const d = (base.e - c.e) * (base.e - c.e) + (base.f - c.f) * (base.f - c.f);
        if (d < bestD) {
          bestD = d;
          chosen = c;
        }
      }
      if (chosen) {
        artE = chosen.e;
        artF = chosen.f;
        ve = chosen.ve;
        vf = chosen.vf;
      } else if (preset) {
        // Fallback map preset → viewport edge
        ve = preset.artE < 0 ? left : preset.artE > 0 ? right : 0;
        vf = preset.artF < 0 ? top : preset.artF > 0 ? bottom : 0;
      }

      const insetE = base.e - artE;
      const insetF = base.f - artF;
      setMatrix(el, {
        ...base,
        e: ve + insetE,
        f: vf + insetF,
      });
    });
  }

  function layoutInputs() {
    if (!state.ready || !state.svgRoot) return;
    layoutAnchors();
    const overlayRoot =
      (opts.nameInput && opts.nameInput.parentElement) ||
      document.querySelector('.main-menu-overlays');
    if (!overlayRoot) return;

    for (let i = 0; i < inputBindings.length; i++) {
      const b = inputBindings[i];
      if (b.input.hidden || b.input.style.display === 'none') continue;
      const slot = resolveSlotElement(b);
      if (!slot) continue;
      let box = svgElToOverlayBox(slot, overlayRoot);
      if (!box || box.width < 2 || box.height < 2) continue;
      box = expandOverlayBoxFree(box, b.input);

      // Hide SVG placeholder — HTML input draws free (no mask width).
      const textEl = resolvePlaceholderText(b);
      if (textEl) textEl.style.visibility = 'hidden';

      b.input.style.position = 'absolute';
      b.input.style.left = `${Math.round(box.left)}px`;
      b.input.style.top = `${Math.round(box.top)}px`;
      b.input.style.width = `${Math.round(box.width)}px`;
      b.input.style.height = `${Math.round(box.height)}px`;
      b.input.style.transform = 'none';
      b.input.style.minWidth = '0';
      b.input.style.maxWidth = 'none';
      b.input.style.boxSizing = 'border-box';
      b.input.style.overflow = 'visible';
    }
  }

  function bindPlaceholderInput(input, placeholderText, bindOpts) {
    if (!input) return;
    inputBindings.push({
      input,
      placeholderText,
      hideWhenAlone: !!(bindOpts && bindOpts.hideWhenAlone),
      readOnlyInJoin: !!(bindOpts && bindOpts.readOnlyInJoin),
      slotEl: null,
    });
    // Relayout while typing so long names stay unclipped.
    input.addEventListener('input', () => {
      if (state.ready) layoutInputs();
    });
  }

  /**
   * Drag HandleBar → scroll masked content in SVG user units.
   * @param {{ handleId: string, contentIds: string[], maxScroll?: number }} cfg
   */
  function wireScrollbar(cfg) {
    const handle = $(cfg.handleId);
    if (!handle || !cfg.contentIds || !cfg.contentIds.length) return;

    const nodes = [];
    for (let i = 0; i < cfg.contentIds.length; i++) {
      const n = $(cfg.contentIds[i]);
      if (n) nodes.push({ el: n, base: parseMatrix(n) });
    }
    if (!nodes.length) return;

    const handleBase = parseMatrix(handle);
    const maxScroll = cfg.maxScroll != null ? cfg.maxScroll : 120;
    const handleTravel = cfg.handleTravel != null ? cfg.handleTravel : 90;
    let scroll = 0;
    let dragging = false;
    let startClientY = 0;
    let startScroll = 0;

    function applyScroll() {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        setMatrix(n.el, {
          ...n.base,
          f: n.base.f - scroll,
        });
      }
      const t = maxScroll <= 0 ? 0 : scroll / maxScroll;
      setMatrix(handle, {
        ...handleBase,
        f: handleBase.f + t * handleTravel,
      });
    }

    makeHitTarget(handle);

    const onMove = (e) => {
      if (!dragging) return;
      const dy = e.clientY - startClientY;
      // Rough screen→SVG: viewBox 720 tall letterboxed in mount.
      const svg = state.svgRoot;
      const vb = svg.viewBox && svg.viewBox.baseVal;
      const rect = svg.getBoundingClientRect();
      const scale = vb && rect.height ? vb.height / rect.height : 1;
      scroll = Math.max(0, Math.min(maxScroll, startScroll + dy * scale));
      applyScroll();
    };

    const onUp = () => {
      dragging = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      startClientY = e.clientY;
      startScroll = scroll;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    // Wheel over content also scrolls.
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].el.addEventListener(
        'wheel',
        (e) => {
          e.preventDefault();
          scroll = Math.max(0, Math.min(maxScroll, scroll + e.deltaY * 0.35));
          applyScroll();
        },
        { passive: false }
      );
    }
  }

  function wireAllScrollbars() {
    wireScrollbar({
      handleId: 'HandleBar',
      contentIds: [
        'Player_n',
        'Player_n_FL',
        'Player_n_FL_FL',
        'Player_n_FL_FL_FL',
        'Player_n_FL_FL_FL_FL',
        'Player_n_FL_FL_FL_FL_FL',
        'Player_n_FL_FL_FL_FL_FL_FL',
      ],
      maxScroll: 140,
      handleTravel: 100,
    });
    wireScrollbar({
      handleId: 'HandleBar_Default_skin',
      contentIds: PLAYABLE_MENU_SKINS.slice(),
      maxScroll: 0,
      handleTravel: 0,
    });
    // Custom / extra default slots deferred — hide their scroll handles.
    const hideBars = ['HandleBar_Custom_skin'];
    for (let i = 0; i < hideBars.length; i++) {
      const bar = $(hideBars[i]);
      if (bar) {
        bar.style.display = 'none';
        bar.style.pointerEvents = 'none';
      }
    }
  }

  /** Swap menu mute art from Btn.svg btn_Audio_True / btn_Audio_False. */
  async function injectMuteIconFromBtn() {
    const btn = $('btn_Audio');
    if (!btn || !state.svgRoot || btn.dataset.audioArtReady === '1') return;
    try {
      const res = await fetch(`${BTN_SVG_URL}?v=20261020b`, { cache: 'no-cache' });
      if (!res.ok) return;
      const doc = new DOMParser().parseFromString(await res.text(), 'image/svg+xml');
      const trueSrc = doc.getElementById('btn_Audio_True');
      const falseSrc = doc.getElementById('btn_Audio_False');
      if (!trueSrc || !falseSrc) return;

      let defs = state.svgRoot.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS(SVG_NS, 'defs');
        state.svgRoot.insertBefore(defs, state.svgRoot.firstChild);
      }
      const needIds = [
        'Ui_Btn_Color_0_Layer1_0_FILL',
        'Ui_Btn_Color_0_Layer0_0_1_STROKES',
        'Ui_Btn_Color_4_Layer1_0_FILL',
        'Ui_Btn_Color_4_Layer0_0_1_STROKES',
        'Ui_IconUi_2_Layer1_0_FILL',
        'Ui_IconUi_3_Layer1_0_FILL',
        'IconUi_3_Layer1_0_FILL',
      ];
      for (let i = 0; i < needIds.length; i++) {
        const id = needIds[i];
        if (state.svgRoot.getElementById(id)) continue;
        const src = doc.getElementById(id);
        if (!src) continue;
        const clone = src.cloneNode(true);
        clone.setAttribute('id', id);
        defs.appendChild(clone);
      }

      // Hide baked MainMenu art under the hit target.
      const kids = Array.from(btn.children);
      for (let i = 0; i < kids.length; i++) {
        if (kids[i].getAttribute('data-audio-art')) continue;
        kids[i].style.display = 'none';
        kids[i].setAttribute('aria-hidden', 'true');
      }

      const mountArt = (src, key) => {
        const g = src.cloneNode(true);
        stripIds(g);
        g.setAttribute('data-audio-art', key);
        g.setAttribute('transform', 'matrix( 1, 0, 0, 1, 0,0) ');
        btn.appendChild(g);
        return g;
      };
      mountArt(trueSrc, 'true');
      mountArt(falseSrc, 'false');
      btn.dataset.audioArtReady = '1';
    } catch (_) {
      /* optional — syncAudioIcon falls back to baked icons */
    }
  }

  function wireClicks() {
    const map = [
      [
        'Select_Alone_player',
        () => {
          state.playSession = 'alone';
          syncPlaySessionUi();
        },
      ],
      [
        'Select_JoinRoom_player',
        () => {
          state.playSession = 'join';
          syncPlaySessionUi();
        },
      ],
      [
        'Select_FlatLand_Mode',
        () => {
          state.worldPick = 'flat';
          syncWorldPickUi();
        },
      ],
      [
        'Select_Resource',
        () => {
          state.worldPick = 'resource';
          syncWorldPickUi();
        },
      ],
      [
        'Select_Resource_FL',
        () => {
          state.worldPick = 'loadFile';
          syncWorldPickUi();
          if (typeof opts.onLoadFile === 'function') opts.onLoadFile();
        },
      ],
      [
        'PlayNow',
        () => {
          if (typeof opts.onPlay === 'function') opts.onPlay();
        },
      ],
      [
        'Join_or_Crate',
        () => {
          if (typeof opts.onJoinStub === 'function') opts.onJoinStub();
        },
      ],
      [
        'btn_Audio',
        () => {
          state.audioMuted = !state.audioMuted;
          try {
            localStorage.setItem('theddos_mute', state.audioMuted ? '1' : '0');
          } catch (_) {
            /* ignore */
          }
          syncAudioIcon();
          if (typeof opts.onAudioToggle === 'function') {
            opts.onAudioToggle(state.audioMuted);
          }
        },
      ],
      [
        'btn_Link',
        () => {
          if (typeof opts.onLink === 'function') opts.onLink();
        },
      ],
      [
        'Btn_Red_LabelShow_on',
        () => {
          state.labelShowOpen = !state.labelShowOpen;
          syncLabelShow();
        },
      ],
    ];

    for (let i = 0; i < map.length; i++) {
      const id = map[i][0];
      const fn = map[i][1];
      const el = $(id);
      if (!el) continue;
      makeHitTarget(el);
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fn();
      });
    }

    // Default: How-to panel hidden until red button.
    state.labelShowOpen = false;
    syncLabelShow();

    // PlayNow: brief onPress flash from Btn.svg language (raised → pressed yellow).
    const play = $('PlayNow');
    if (play) {
      const falseBtn = play.querySelector('[id^="Btn_Press_"]');
      const trueSrc = $('Btn_Press_True');
      if (falseBtn && trueSrc) {
        const press = trueSrc.cloneNode(true);
        stripIds(press);
        press.setAttribute('data-press', 'true');
        press.setAttribute('transform', 'matrix( 1, 0, 0, 1, 0,3) ');
        play.insertBefore(press, falseBtn);
        setVisible(press, false);
        play.addEventListener('pointerdown', () => {
          setVisible(press, true);
          setVisible(falseBtn, false);
        });
        play.addEventListener('pointerup', () => {
          setVisible(press, false);
          setVisible(falseBtn, true);
        });
        play.addEventListener('pointerleave', () => {
          setVisible(press, false);
          setVisible(falseBtn, true);
        });
      }
    }

    for (let i = 0; i < PLAYABLE_MENU_SKINS.length; i++) {
      const id = PLAYABLE_MENU_SKINS[i];
      const el = $(id);
      if (!el) continue;
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.skinId = clampPlayableMenuSkinId(id);
        syncSkinUi();
      });
    }
  }

  function wireInputFields() {
    // Art text = position only; overlay width free (no Mask_* sizing).
    bindPlaceholderInput(opts.nameInput, 'YOUR NAME', {
      hideWhenAlone: false,
    });
    bindPlaceholderInput(opts.roomInput, '1234567', {
      hideWhenAlone: true,
      readOnlyInJoin: true,
    });
    bindPlaceholderInput(opts.joinInput, 'Input', {
      hideWhenAlone: true,
    });

    if (opts.nameInput) {
      opts.nameInput.value = state.playerName;
      opts.nameInput.addEventListener('input', () => {
        state.playerName = String(opts.nameInput.value || 'Player').slice(0, 24);
        if (typeof opts.onNameChange === 'function') {
          opts.onNameChange(state.playerName);
        }
        syncRoster();
      });
    }
    if (opts.roomInput) {
      // Host code display (art sample was 1234567) — not free-typed when hosting.
      opts.roomInput.readOnly = true;
    }
    if (opts.joinInput) {
      opts.joinInput.addEventListener('input', () => {
        state.joinText = String(opts.joinInput.value || '')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 8);
        opts.joinInput.value = state.joinText;
      });
    }
  }

  function bindLayoutListeners() {
    if (state.layoutBound) return;
    state.layoutBound = true;
    window.addEventListener('resize', layoutInputs);
    if (typeof ResizeObserver !== 'undefined' && mount) {
      const ro = new ResizeObserver(() => layoutInputs());
      ro.observe(mount);
    }
  }

  function overlayRootEl() {
    return (
      (opts.nameInput && opts.nameInput.parentElement) ||
      document.querySelector('.main-menu-overlays')
    );
  }

  /**
   * First MENU visit: MainMeun (+ overlays) tween up into place.
   * Color is CSS full-bleed (not tweened). Overlays rise with UI so inputs stay locked.
   */
  function playEnterTween(optsTween = {}) {
    const force = !!optsTween.force;
    if (state.enterTweenPlayed && !force) return false;
    if (!state.ready || !state.svgRoot) return false;

    const main = $('MainMeun');
    const overlays = overlayRootEl();
    if (!main) return false;

    // Rest layout first (clip slots match final art / re-exported positions).
    layoutInputs();

    const reduce =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      state.enterTweenPlayed = true;
      main.style.opacity = '1';
      main.style.transform = '';
      if (overlays) {
        overlays.style.opacity = '1';
        overlays.style.transform = '';
      }
      return true;
    }

    const risePx = optsTween.risePx != null ? optsTween.risePx : 64;
    const ms = optsTween.ms != null ? optsTween.ms : 700;
    const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

    const prep = (el) => {
      if (!el) return;
      el.style.transition = 'none';
      el.style.opacity = '0';
      el.style.transform = `translateY(${risePx}px)`;
      el.classList && el.classList.add('menu-tween-prep');
    };
    prep(main);
    prep(overlays);
    // Color letterbox bg on mount stays put (outside MainMeun).

    // Reflow then animate in.
    void (mount && mount.offsetWidth);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const play = (el) => {
          if (!el) return;
          el.style.transition = `opacity ${ms}ms ease-out, transform ${ms}ms ${ease}`;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          el.classList && el.classList.remove('menu-tween-prep');
          el.classList && el.classList.add('menu-tween-in');
        };
        play(main);
        play(overlays);
      });
    });

    const clear = () => {
      state.enterTweenPlayed = true;
      if (main) {
        main.style.transition = '';
        main.classList && main.classList.remove('menu-tween-in');
      }
      if (overlays) {
        overlays.style.transition = '';
        overlays.classList && overlays.classList.remove('menu-tween-in');
      }
      layoutInputs();
      syncRoster();
    };
    window.setTimeout(clear, ms + 40);
    return true;
  }

  async function mountSvg() {
    if (!mount) throw new Error('mainMenuUi: missing mount');
    const res = await fetch(MAIN_MENU_SVG_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`MainMenu.svg ${res.status}`);
    const text = await res.text();
    mount.innerHTML = text;
    const svg = mount.querySelector('svg');
    if (!svg) throw new Error('MainMenu.svg: no <svg> root');

    // Fill mount; viewBox expands on layoutAnchors so corners track real edges.
    // Color is CSS full-bleed on mount (not this SVG).
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute(
      'viewBox',
      `0 0 ${MENU_ART_W} ${MENU_ART_H}`
    );
    svg.style.display = 'block';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.maxWidth = '100%';
    svg.style.maxHeight = '100%';
    svg.style.background = 'transparent';

    // Hide SVG #Color — mount CSS paints full-web background independently.
    const colorLayer = svg.getElementById
      ? svg.getElementById('Color')
      : svg.querySelector('#Color');
    if (colorLayer) {
      colorLayer.style.display = 'none';
      colorLayer.setAttribute('aria-hidden', 'true');
    }
    if (mount) mount.classList.add('has-menu-color');

    state.svgRoot = svg;
    state.ready = true;
    state.anchorBase = null;

    state.playSession = 'alone';
    state.worldPick = 'flat';
    state.skinId = 'Skin_Default_1';
    try {
      state.audioMuted = localStorage.getItem('theddos_mute') === '1';
    } catch (_) {
      state.audioMuted = false;
    }

    // Snapshot Btn_Press True/False templates before cloning mutates groups.
    state.pressTrueTpl = $('Btn_Press_True') || $('Btn_Press_True_FL');
    state.pressFalseTpl =
      $('Btn_Press_false') ||
      $('Btn_Press_false_FL') ||
      $('Btn_Press_False');
    ensurePressPair('Select_Alone_player');
    ensurePressPair('Select_JoinRoom_player');
    ensurePressPair('Select_FlatLand_Mode');
    ensurePressPair('Select_Resource');
    ensurePressPair('Select_Resource_FL');

    await injectMuteIconFromBtn();
    wireInputFields();
    wireClicks();
    wireKickButtons();
    wireAllScrollbars();
    bindLayoutListeners();
    applyAll();

    // Layout after paint (letterbox + fonts + clip CTM).
    requestAnimationFrame(() => {
      layoutInputs();
      requestAnimationFrame(() => {
        layoutInputs();
        syncRoster();
      });
    });
  }

  return {
    state,
    mountSvg,
    applyAll,
    layoutInputs,
    syncRoster,
    playEnterTween,
    gameModeFromPick,
    getPlayerName: () => state.playerName,
    getPlaySession: () => state.playSession,
    getWorldPick: () => state.worldPick,
    getSkinId: () => clampPlayableMenuSkinId(state.skinId),
    getJoinText: () => state.joinText,
    setRoomCode(code) {
      state.roomCode = String(code || '');
      if (opts.roomInput) opts.roomInput.value = state.roomCode;
      layoutInputs();
    },
    setPlayerName(name) {
      state.playerName = String(name || 'Player').slice(0, 24);
      if (opts.nameInput) opts.nameInput.value = state.playerName;
      syncRoster();
    },
    isReady: () => state.ready,
  };
}

/**
 * HTML loading panels (art reference: Loading_main.svg / Loading_GamePlay.svg).
 * No SVG fetch — DOM is already in index.html.
 */

import { LOADING_SCREEN } from './config.js';

/**
 * @param {{
 *   mainEl: HTMLElement | null,
 *   gameplayEl: HTMLElement | null,
 *   mainFill: HTMLElement | null,
 *   gpFill: HTMLElement | null,
 *   gpMap: HTMLElement | null,
 *   gpMode: HTMLElement | null,
 *   gpPlayers: HTMLElement | null,
 *   gpEnemies: HTMLElement | null,
 *   gpReady: HTMLElement | null,
 * }} opts
 */
export function createLoadingUi(opts) {
  const mainEl = opts.mainEl;
  const gameplayEl = opts.gameplayEl;
  const mainFill = opts.mainFill;
  const gpFill = opts.gpFill;
  const gpMap = opts.gpMap;
  const gpMode = opts.gpMode;
  const gpPlayers = opts.gpPlayers;
  const gpEnemies = opts.gpEnemies;
  const gpReady = opts.gpReady;

  const state = {
    ready: true,
    /** @type {'main' | 'gameplay' | null} */
    variant: null,
    progress: 0,
    playerScroll: 0,
    /** @type {string[]} */
    playerNames: [],
    worldPick: 'flat',
  };

  function mapMeta() {
    const maps = LOADING_SCREEN.maps;
    return maps[state.worldPick] || maps.flat;
  }

  function setFill(el, pct) {
    if (!el) return;
    const p = Math.max(0, Math.min(100, Number(pct) || 0));
    el.style.width = `${p}%`;
  }

  function setProgress(pct) {
    state.progress = Math.max(0, Math.min(100, Number(pct) || 0));
    if (state.variant === 'gameplay') setFill(gpFill, state.progress);
    else setFill(mainFill, state.progress);
  }

  function syncPlayers() {
    if (!gpPlayers) return;
    const names = state.playerNames;
    const max = LOADING_SCREEN.maxPlayerRows || 7;
    const start = Math.max(0, Math.min(state.playerScroll, Math.max(0, names.length - max)));
    state.playerScroll = start;
    const end = Math.min(names.length, start + max);
    let html = '';
    for (let i = start; i < end; i++) {
      html += `<li>${i + 1}# ${escapeHtml(names[i] || 'Player')}</li>`;
    }
    gpPlayers.innerHTML = html;
  }

  function syncEnemies() {
    if (!gpEnemies) return;
    const names = LOADING_SCREEN.enemyNames || [];
    let html = '';
    for (let i = 0; i < names.length; i++) {
      html += `<li>${i + 1}# ${escapeHtml(names[i])}</li>`;
    }
    gpEnemies.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * @param {{
   *   worldPick?: string,
   *   playerNames?: string[],
   *   progress?: number,
   * }} meta
   */
  function setMeta(meta) {
    if (!meta) return;
    if (meta.worldPick) state.worldPick = meta.worldPick;
    if (Array.isArray(meta.playerNames)) {
      state.playerNames = meta.playerNames.map((n) => String(n || 'Player').slice(0, 24));
      state.playerScroll = 0;
    }
    const m = mapMeta();
    if (gpMap) gpMap.textContent = m.nameMap;
    if (gpMode) gpMode.textContent = m.modeLabel;
    syncPlayers();
    syncEnemies();
    if (meta.progress != null) setProgress(meta.progress);
  }

  function showMain() {
    state.variant = 'main';
    if (gameplayEl) gameplayEl.hidden = true;
    if (mainEl) mainEl.hidden = false;
    setProgress(state.progress);
  }

  function showGameplay() {
    state.variant = 'gameplay';
    if (mainEl) mainEl.hidden = true;
    if (gameplayEl) gameplayEl.hidden = false;
    hideReadyHint();
    setMeta({
      worldPick: state.worldPick,
      playerNames: state.playerNames,
      progress: state.progress,
    });
  }

  function hideReadyHint() {
    if (!gpReady) return;
    gpReady.hidden = true;
    gpReady.classList.remove('is-visible');
  }

  function showReadyHint() {
    if (!gpReady) return;
    gpReady.hidden = false;
    gpReady.classList.add('is-visible');
  }

  /**
   * After load 100%: keep overlay until host clicks/taps/presses a key anywhere.
   * @returns {Promise<void>}
   */
  function waitForHostConfirm() {
    showReadyHint();
    const target = gameplayEl || document.body;
    return new Promise((resolve) => {
      const done = () => {
        window.removeEventListener('pointerdown', onPtr, true);
        window.removeEventListener('keydown', onKey, true);
        hideReadyHint();
        resolve();
      };
      const onPtr = (e) => {
        e.preventDefault();
        done();
      };
      const onKey = (e) => {
        if (e.code === 'Tab') return;
        e.preventDefault();
        done();
      };
      window.addEventListener('pointerdown', onPtr, true);
      window.addEventListener('keydown', onKey, true);
      // Ensure overlay receives hits even if something else is above briefly.
      if (target) target.style.cursor = 'pointer';
    });
  }

  function hide() {
    state.variant = null;
    hideReadyHint();
    if (mainEl) mainEl.hidden = true;
    if (gameplayEl) {
      gameplayEl.hidden = true;
      gameplayEl.style.cursor = '';
    }
  }

  function isReady() {
    return !!(mainEl || gameplayEl);
  }

  function getVariant() {
    return state.variant;
  }

  // Player list scroll when many names
  if (gpPlayers) {
    gpPlayers.addEventListener(
      'wheel',
      (e) => {
        if (state.variant !== 'gameplay') return;
        const max = LOADING_SCREEN.maxPlayerRows || 7;
        if (state.playerNames.length <= max) return;
        e.preventDefault();
        state.playerScroll += e.deltaY > 0 ? 1 : -1;
        syncPlayers();
      },
      { passive: false }
    );
  }

  return {
    state,
    showMain,
    showGameplay,
    /** aliases for older call sites */
    mountMain: async () => {
      showMain();
      return true;
    },
    mountGameplay: async () => {
      showGameplay();
      return true;
    },
    setMeta,
    setProgress,
    waitForHostConfirm,
    hide,
    isReady,
    getVariant,
  };
}

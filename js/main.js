/**
 * Entry — HTML loading-main is already in the page (no SVG fetch).
 * Heavy graph loads via dynamic import().
 */

const CACHE_BUST = '20261021c';

function setBootUi(pct, _label) {
  const fill = document.getElementById('loading-main-fill');
  if (fill) {
    fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  }
  // Keep legacy stubs in sync for fail path
  const legacy = document.getElementById('progress-fill');
  if (legacy) legacy.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  const text = document.getElementById('progress-label');
  if (text && _label) text.textContent = _label;
}

function showMainLoading() {
  const main = document.getElementById('loading-main');
  const gp = document.getElementById('loading-gameplay');
  const fail = document.getElementById('loading-boot-panel');
  if (main) main.hidden = false;
  if (gp) gp.hidden = true;
  if (fail) fail.hidden = true;
}

function failBootUi(err) {
  window.__theDdosPhase = 'failed';
  const main = document.getElementById('loading-main');
  const gp = document.getElementById('loading-gameplay');
  if (main) main.hidden = true;
  if (gp) gp.hidden = true;
  const fail = document.getElementById('loading-boot-panel');
  if (fail) fail.hidden = false;
  const title = document.getElementById('loading-title');
  const text = document.getElementById('progress-label');
  if (title) {
    title.textContent = 'Boot failed';
    title.dataset.locked = '1';
  }
  const msg = err && err.message ? err.message : String(err);
  if (text) text.textContent = `${msg} — Ctrl+Shift+R / check Console`;
  console.error('[TheDDOS] boot failed', err);
}

function collectDom() {
  return {
    screens: {
      menu: document.getElementById('screen-menu'),
      loading: document.getElementById('screen-loading'),
      playing: document.getElementById('screen-playing'),
    },
    progressFill: document.getElementById('progress-fill'),
    progressLabel: document.getElementById('progress-label'),
    loadingTitle: document.getElementById('loading-title'),
    loadingBootPanel: document.getElementById('loading-boot-panel'),
    loadingMain: document.getElementById('loading-main'),
    loadingGameplay: document.getElementById('loading-gameplay'),
    loadingMainFill: document.getElementById('loading-main-fill'),
    loadingGpFill: document.getElementById('loading-gp-fill'),
    loadingGpMap: document.getElementById('loading-gp-map'),
    loadingGpMode: document.getElementById('loading-gp-mode'),
    loadingGpPlayers: document.getElementById('loading-gp-players'),
    loadingGpEnemies: document.getElementById('loading-gp-enemies'),
    loadingGpReady: document.getElementById('loading-gp-ready'),
    canvas: document.getElementById('game-canvas'),
    playerUiMount: document.getElementById('player-ui-mount'),
    mainMenuMount: document.getElementById('main-menu-mount'),
    menuNameInput: document.getElementById('menu-name-input'),
    menuRoomInput: document.getElementById('menu-room-input'),
    menuJoinInput: document.getElementById('menu-join-input'),
    btnStart: document.getElementById('btn-start'),
    btnRestore: document.getElementById('btn-restore'),
    btnClearSnap: document.getElementById('btn-clear-snap'),
    snapStatus: document.getElementById('snap-status'),
    saveDropZone: document.getElementById('save-drop-zone'),
    saveFileInput: document.getElementById('save-file-input'),
    saveFileStatus: document.getElementById('save-file-status'),
    btnForceWin: document.getElementById('btn-force-win'),
    btnForceLose: document.getElementById('btn-force-lose'),
    btnFreeCraft: document.getElementById('btn-free-craft'),
    btnManualSave: document.getElementById('btn-manual-save'),
    btnCheat: document.getElementById('btn-cheat'),
    cheatPanel: document.getElementById('panel-cheat'),
    cheatClose: document.getElementById('cheat-close'),
    cheatZoomRange: document.getElementById('cheat-zoom-range'),
    cheatZoomIn: document.getElementById('cheat-zoom-in'),
    cheatZoomOut: document.getElementById('cheat-zoom-out'),
    cheatZoomValue: document.getElementById('cheat-zoom-value'),
    btnJoin: document.getElementById('btn-join'),
    selMode: document.getElementById('sel-mode'),
    roomCodeEl: document.getElementById('room-code'),
    joinStubEl: document.getElementById('join-stub'),
  };
}

window.__theDdosPhase = 'main-ready';
showMainLoading();
setBootUi(2, '2% — Importing app modules…');

(async function startTheDdos() {
  try {
    window.__theDdosPhase = 'import-app';
    setBootUi(4, '4% — Loading app.js (+ sim/config)…');

    const mod = await import(`./app.js?v=${CACHE_BUST}`);
    if (!mod || typeof mod.createApp !== 'function') {
      throw new Error('app.js loaded but createApp missing');
    }

    window.__theDdosPhase = 'create-app';
    setBootUi(12, '12% — Creating Local Host…');
    const app = mod.createApp(collectDom());

    window.__theDdos = app;
    window.__wantToPlay = app;
    window.__theDdosPhase = 'boot';

    setBootUi(18, '18% — Boot preload…');
    const ok = await app.boot();
    if (!ok) {
      window.__theDdosPhase = 'failed';
      return;
    }
    window.__theDdosPhase = 'ready';
  } catch (err) {
    failBootUi(err);
  }
})();

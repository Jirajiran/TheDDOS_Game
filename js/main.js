/**
 * Entry — no static imports so this file can paint UI + catch module-graph errors.
 * Heavy graph (app → sim/…) loads via dynamic import().
 */

const CACHE_BUST = '20261001o';

function setBootUi(pct, label) {
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-label');
  const title = document.getElementById('loading-title');
  if (fill) fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  if (text) text.textContent = label;
  if (title && !title.dataset.locked) title.textContent = 'Booting TheDDOS';
}

function failBootUi(err) {
  window.__theDdosPhase = 'failed';
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
      result: document.getElementById('screen-result'),
    },
    progressFill: document.getElementById('progress-fill'),
    progressLabel: document.getElementById('progress-label'),
    loadingTitle: document.getElementById('loading-title'),
    canvas: document.getElementById('game-canvas'),
    waveHud: document.getElementById('wave-hud'),
    hpHud: document.getElementById('hp-hud'),
    baseHud: document.getElementById('base-hud'),
    ammoHud: document.getElementById('ammo-hud'),
    promptHud: document.getElementById('prompt-hud'),
    hotbarEl: document.getElementById('hotbar'),
    resultTitle: document.getElementById('result-title'),
    resultDetail: document.getElementById('result-detail'),
    resultStats: document.getElementById('result-stats'),
    btnStart: document.getElementById('btn-start'),
    btnRestore: document.getElementById('btn-restore'),
    btnClearSnap: document.getElementById('btn-clear-snap'),
    snapStatus: document.getElementById('snap-status'),
    saveDropZone: document.getElementById('save-drop-zone'),
    saveFileInput: document.getElementById('save-file-input'),
    saveFileStatus: document.getElementById('save-file-status'),
    btnResultMenu: document.getElementById('btn-result-menu'),
    btnForceWin: document.getElementById('btn-force-win'),
    btnForceLose: document.getElementById('btn-force-lose'),
    btnFreeCraft: document.getElementById('btn-free-craft'),
    btnManualSave: document.getElementById('btn-manual-save'),
    btnMeleeVol: document.getElementById('btn-melee-vol'),
    btnFist: document.getElementById('btn-fist'),
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
    btnCraft: document.getElementById('btn-craft'),
    craftPanel: document.getElementById('panel-craft'),
    craftTabs: document.getElementById('craft-tabs'),
    craftList: document.getElementById('craft-list'),
    craftStatus: document.getElementById('craft-status'),
    craftClose: document.getElementById('craft-close'),
    receivePanel: document.getElementById('panel-receive'),
    receiveTitle: document.getElementById('receive-title'),
    receiveBody: document.getElementById('receive-body'),
    receiveStatus: document.getElementById('receive-status'),
    receiveClose: document.getElementById('receive-close'),
  };
}

window.__theDdosPhase = 'main-ready';
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
    window.__wantToPlay = app; // legacy alias
    window.__theDdosPhase = 'boot';

    setBootUi(18, '18% — Boot preload…');
    const ok = await app.boot();
    if (!ok) {
      // boot() already painted failure UI when false
      window.__theDdosPhase = 'failed';
      return;
    }
    window.__theDdosPhase = 'ready';
  } catch (err) {
    failBootUi(err);
  }
})();

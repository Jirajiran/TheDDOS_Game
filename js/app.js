import {
  makeCastSkillAction,
  makeSelectHotbarAction,
  makeTakeBaseAction,
  makeTakeGenAction,
} from './actions.js';
import {
  AppState,
  AUTOSAVE_INTERVAL_SEC,
  FEATURE_SNAPSHOT,
  GAME_PACK,
  GameMode,
  PATH_SIZE,
  getWeaponDef,
} from './config.js';
import { createCamera, followPoint, panCamera, snapCameraTo, clampZoom } from './camera.js';
import {
  createHostSession,
  generateRoomCode,
  hostIngestActions,
  tryJoinRoom,
} from './host.js';
import { createInput } from './input.js';
import {
  countItem,
  getActiveSlot,
  isWeaponSlot,
  moveOrSwapInventorySlots,
} from './inventory.js';
import { runBootPreload } from './boot.js';
import { runLoading } from './loading.js';
import {
  clearLocalSnapshot,
  exportMatchSnapshotFile,
  hasLocalSnapshot,
  importSnapshotIntoAutosave,
  loadLocalSnapshotRaw,
  parseSnapshotFileText,
  sanitizeLocalSnapshot,
  writeAutosave,
} from './memento.js';
import { createPanels } from './panels.js';
import { resetPools } from './pools.js';
import { clearCanvas, renderWorld } from './render.js';
import {
  getPlayerUnit,
  initMatchGameplay,
  restoreMatchFromSnapshot,
  throwHotbarSlot,
  tickMatch,
  updatePlaceGhost,
} from './sim.js';
import { formatAmmoHud } from './weapons.js';

export function createApp(dom) {
  const state = {
    appState: AppState.BOOT,
    match: null,
    result: null,
    camera: createCamera(),
    rafId: 0,
    lastTs: 0,
    loadingLocked: false,
    /** false until runBootPreload finishes — Start/Restore gated. */
    bootReady: false,
    boot: null,
    input: null,
    host: createHostSession({ gameMode: GameMode.FLAT_SURVIVAL }),
    panels: null,
    /** Elapsed since last throttled autosave while PLAYING. */
    autosaveAcc: 0,
    /** Hub click → SELECT_HOTBAR applied next tick (Unified Input). */
    pendingHotbarSelect: -1,
    /** Fist (Q / button) → CAST_SKILL FIST next tick. */
    pendingFistCast: false,
    /** Hub Take → TAKE_GEN / TAKE_BASE applied next tick (Unified Input). */
    pendingTake: null,
  };

  const {
    screens,
    progressFill,
    progressLabel,
    loadingTitle,
    canvas,
    waveHud,
    hpHud,
    baseHud,
    ammoHud,
    promptHud,
    hotbarEl,
    resultTitle,
    resultDetail,
    resultStats,
    btnStart,
    btnRestore,
    btnClearSnap,
    snapStatus,
    saveDropZone,
    saveFileInput,
    saveFileStatus,
    btnResultMenu,
    btnForceWin,
    btnForceLose,
    btnFreeCraft,
    btnManualSave,
    btnMeleeVol,
    btnFist,
    btnCheat,
    cheatPanel,
    cheatClose,
    cheatZoomRange,
    cheatZoomIn,
    cheatZoomOut,
    cheatZoomValue,
    btnJoin,
    selMode,
    roomCodeEl,
    joinStubEl,
    btnCraft,
    craftPanel,
    craftTabs,
    craftList,
    craftStatus,
    craftClose,
    receivePanel,
    receiveTitle,
    receiveBody,
    receiveStatus,
    receiveClose,
  } = dom;

  if (!canvas) {
    throw new Error('Missing #game-canvas — open via play-local.bat (HTTP), not file://');
  }
  if (!screens || !screens.menu || !screens.loading || !screens.playing || !screens.result) {
    throw new Error('Missing screen elements — hard refresh (Ctrl+Shift+R)');
  }
  if (!progressFill || !progressLabel) {
    throw new Error('Missing loading progress elements');
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }
  state.input = createInput(canvas);

  /** Hotbar drag: mousedown starts, mouseup ends (swap / throw). */
  const hotbarDrag = {
    active: false,
    dragging: false,
    fromIndex: -1,
    startX: 0,
    startY: 0,
  };

  const HOTBAR_DRAG_PX = 8;

  function endHotbarDrag(clientX, clientY) {
    if (!hotbarDrag.active) return;
    const from = hotbarDrag.fromIndex;
    const wasDragging = hotbarDrag.dragging;
    hotbarDrag.active = false;
    hotbarDrag.dragging = false;
    hotbarDrag.fromIndex = -1;
    if (state.input) state.input.setActionBusy(false);
    if (hotbarEl) hotbarEl.classList.remove('is-dragging');

    const match = state.match;
    if (!match || from < 0) {
      refreshHotbar();
      return;
    }

    // Click without drag — selection already queued as pendingHotbarSelect.
    if (!wasDragging) {
      refreshHotbar();
      return;
    }

    const slotEl = document.elementFromPoint(clientX, clientY);
    const overSlot = slotEl && slotEl.closest ? slotEl.closest('.hotbar-slot') : null;
    if (overSlot && hotbarEl && hotbarEl.contains(overSlot)) {
      const to = Number(overSlot.dataset.slotIndex);
      if (Number.isFinite(to) && to !== from) {
        moveOrSwapInventorySlots(match.inventory, from, to);
        state.pendingHotbarSelect = to;
      }
      refreshHotbar();
      return;
    }

    // Drop outside hotbar onto world view → throw as world drop.
    const canvasRect = canvas.getBoundingClientRect();
    const overCanvas =
      clientX >= canvasRect.left &&
      clientX <= canvasRect.right &&
      clientY >= canvasRect.top &&
      clientY <= canvasRect.bottom;
    const overHotbar =
      hotbarEl &&
      (() => {
        const r = hotbarEl.getBoundingClientRect();
        return (
          clientX >= r.left &&
          clientX <= r.right &&
          clientY >= r.top &&
          clientY <= r.bottom
        );
      })();

    if (overCanvas && !overHotbar) {
      // Spawn uses unit facing + velocity inside sim — ignore cursor world pos.
      throwHotbarSlot(match, from);
    }
    refreshHotbar();
  }

  window.addEventListener('mouseup', (e) => {
    if (hotbarDrag.active) endHotbarDrag(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    if (!hotbarDrag.active || hotbarDrag.dragging) return;
    const dx = e.clientX - hotbarDrag.startX;
    const dy = e.clientY - hotbarDrag.startY;
    if (dx * dx + dy * dy < HOTBAR_DRAG_PX * HOTBAR_DRAG_PX) return;
    hotbarDrag.dragging = true;
    if (state.input) state.input.setActionBusy(true);
    if (hotbarEl) hotbarEl.classList.add('is-dragging');
  });

  state.panels = createPanels(
    {
      craftPanel,
      craftTabs,
      craftList,
      craftStatus,
      craftClose,
      receivePanel,
      receiveTitle,
      receiveBody,
      receiveStatus,
      receiveClose,
      btnCraftHud: btnCraft,
    },
    {
      getMatch: () => state.match,
      canOpen: () => state.appState === AppState.PLAYING && !!state.match,
      onOpen: () => {
        closeCheat();
        state.input.setUiBlocked(true);
      },
      onClose: () => {
        state.input.setUiBlocked(false);
      },
      onInventoryChanged: () => {
        refreshHotbar();
      },
      onTakeGen: (blockId) => {
        state.pendingTake = { kind: 'gen', blockId };
      },
      onTakeBase: (itemId) => {
        state.pendingTake = { kind: 'base', itemId };
      },
    }
  );

  function refreshLobbyUi() {
    if (roomCodeEl) roomCodeEl.textContent = state.host.roomCode;
    if (selMode) selMode.value = state.host.gameMode;
    if (joinStubEl) joinStubEl.textContent = state.host.joinStubMessage;
    if (btnJoin) {
      btnJoin.disabled = !state.host.joinEnabled;
      btnJoin.title = state.host.joinStubMessage;
    }

    // FEATURE_SNAPSHOT deferred — hide restore / import UI entirely.
    const snapUi = FEATURE_SNAPSHOT;
    if (btnRestore) btnRestore.hidden = !snapUi || !hasLocalSnapshot();
    if (btnClearSnap) btnClearSnap.hidden = !snapUi || !hasLocalSnapshot();
    if (btnManualSave) btnManualSave.hidden = !snapUi;
    const saveOpt = document.querySelector('.save-file-opt');
    if (saveOpt) saveOpt.hidden = !snapUi;

    if (snapStatus) {
      if (snapUi && hasLocalSnapshot()) {
        const raw = loadLocalSnapshotRaw();
        const when = raw && raw.savedAt ? new Date(raw.savedAt).toLocaleString() : '';
        const wave = raw ? raw.waveIndex : '?';
        snapStatus.hidden = false;
        snapStatus.textContent = `Snapshot ready — wave ${wave}${when ? ` · ${when}` : ''}`;
      } else if (!snapUi) {
        snapStatus.hidden = false;
        snapStatus.textContent = 'Snapshot / autosave deferred (FEATURE_SNAPSHOT=false)';
      } else {
        snapStatus.hidden = true;
        snapStatus.textContent = '';
      }
    }
  }

  function tryAutosave(force) {
    if (!FEATURE_SNAPSHOT) return false;
    if (state.appState !== AppState.PLAYING || !state.match) return false;
    if (!force && state.autosaveAcc < AUTOSAVE_INTERVAL_SEC) return false;
    const ok = writeAutosave(state.match);
    if (ok) state.autosaveAcc = 0;
    return ok;
  }

  function enterMenu() {
    stopLoop();
    // Autosave is primary while PLAYING; Result already cleared autosave on win/lose.
    // Do not re-persist finished matches when returning to menu.
    if (state.match && state.match.pools) resetPools(state.match.pools);
    state.match = null;
    state.result = null;
    state.autosaveAcc = 0;
    if (state.panels) state.panels.close();
    state.host.roomCode = generateRoomCode();
    refreshLobbyUi();
    setMenuInteractable(state.bootReady);
    setAppState(AppState.MENU);
  }

  /**
   * First gate after page open. Must finish before MENU controls work.
   * Separate from match LOADING (pools/world).
   */
  async function boot() {
    if (state.bootReady) {
      enterMenu();
      return true;
    }
    if (state.loadingLocked) return false;
    state.loadingLocked = true;
    setMenuInteractable(false);
    setAppState(AppState.BOOT);
    setLoadingTitle('Booting TheDDOS');
    progressFill.style.width = '0%';
    progressLabel.textContent = '0% — Starting…';

    try {
      const payload = await runBootPreload((pct, label) => {
        progressFill.style.width = `${pct}%`;
        progressLabel.textContent = `${Math.round(pct)}% — ${label}`;
      });
      if (!payload || !payload.ready) {
        throw new Error('Boot incomplete');
      }
      // Legacy WantToPlay / corrupt autosave — skipped while FEATURE_SNAPSHOT is off.
      if (FEATURE_SNAPSHOT) {
        const snapCheck = sanitizeLocalSnapshot();
        if (snapCheck.cleared) {
          console.warn('[boot] cleared corrupt autosave:', snapCheck.reason);
        }
      } else {
        console.info('[boot] FEATURE_SNAPSHOT=false — autosave/restore deferred');
      }
      state.boot = payload;
      state.bootReady = true;
      setMenuInteractable(true);
      enterMenu();
      return true;
    } catch (err) {
      console.error(err);
      setLoadingTitle('Boot failed');
      progressLabel.textContent =
        (err && err.message ? err.message : 'Boot failed') + ' — reload the page';
      state.bootReady = false;
      setMenuInteractable(false);
      return false;
    } finally {
      state.loadingLocked = false;
    }
  }

  function setLoadingTitle(text) {
    if (loadingTitle) loadingTitle.textContent = text;
  }

  function setMenuInteractable(enabled) {
    if (btnStart) btnStart.disabled = !enabled;
    if (btnRestore) btnRestore.disabled = !enabled;
    if (btnClearSnap) btnClearSnap.disabled = !enabled;
    if (selMode) selMode.disabled = !enabled;
    if (saveFileInput) saveFileInput.disabled = !enabled;
  }

  function showScreen(appState) {
    const showMenu = appState === AppState.MENU;
    const showLoading =
      appState === AppState.BOOT || appState === AppState.LOADING;
    const showPlaying =
      appState === AppState.PLAYING || appState === AppState.RESULT;
    const showResult = appState === AppState.RESULT;

    screens.menu.classList.toggle('is-active', showMenu);
    screens.menu.hidden = !showMenu;
    screens.loading.classList.toggle('is-active', showLoading);
    screens.loading.hidden = !showLoading;
    screens.playing.classList.toggle('is-active', showPlaying);
    screens.playing.hidden = !showPlaying;
    screens.result.classList.toggle('is-active', showResult);
    screens.result.hidden = !showResult;
  }

  function setAppState(next) {
    const prev = state.appState;
    state.appState = next;
    showScreen(next);
    if (next !== AppState.PLAYING && state.panels) {
      state.panels.close();
    }
    if (next !== AppState.PLAYING) {
      closeCheat();
    }
    setPlayTrayLock(next === AppState.PLAYING);
    // If user entered browser fullscreen manually, leave it when exiting play.
    if (prev === AppState.PLAYING && next !== AppState.PLAYING) {
      releasePlayFullscreen();
    }
  }

  /** Block browser overscroll / edge-swipe trays while PLAYING; craft panel still scrolls. */
  function setPlayTrayLock(enabled) {
    document.documentElement.classList.toggle('is-playing-lock', enabled);
    document.body.classList.toggle('is-playing-lock', enabled);
  }

  function onPlayTouchMove(e) {
    if (state.appState !== AppState.PLAYING) return;
    const el = e.target;
    if (el && el.closest && el.closest('.game-panel-card')) return;
    e.preventDefault();
  }

  function onPlayGesture(e) {
    if (state.appState !== AppState.PLAYING) return;
    e.preventDefault();
  }

  /** Optional only — never auto-enter; used when leaving play if user pressed F11. */
  function releasePlayFullscreen() {
    const active =
      document.fullscreenElement || document.webkitFullscreenElement;
    if (!active) return;
    const exit =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.webkitCancelFullScreen ||
      document.msExitFullscreen;
    if (typeof exit !== 'function') return;
    try {
      const p = exit.call(document);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (_) {
      /* ignore */
    }
  }

  function resizeCanvas() {
    const parent = canvas.parentElement;
    let w = parent ? parent.clientWidth : 0;
    let h = parent ? parent.clientHeight : 0;
    // Layout may not be ready the frame PLAYING becomes visible.
    if (w < 2 || h < 2) {
      w = Math.max(w, window.innerWidth || 800);
      h = Math.max(h, window.innerHeight || 600);
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.max(1, Math.floor(w * dpr));
    const bh = Math.max(1, Math.floor(h * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { cssW: w, cssH: h, dpr };
  }

  /** Keep backing-store in sync every frame (fixes black screen after menu→play). */
  function ensureCanvasSize() {
    const parent = canvas.parentElement;
    const w = parent ? parent.clientWidth : 0;
    const h = parent ? parent.clientHeight : 0;
    if (w < 2 || h < 2) return resizeCanvas();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.max(1, Math.floor(w * dpr));
    const bh = Math.max(1, Math.floor(h * dpr));
    if (
      canvas.width !== bw ||
      canvas.height !== bh ||
      canvas.clientWidth !== w ||
      canvas.clientHeight !== h
    ) {
      return resizeCanvas();
    }
    return {
      cssW: w,
      cssH: h,
      dpr: canvas.width / Math.max(1, w),
    };
  }

  async function startMatch(opts = {}) {
    if (!state.bootReady) return;
    if (state.loadingLocked) return;
    state.loadingLocked = true;
    state.result = null;
    const wantRestore = !!(FEATURE_SNAPSHOT && opts.restore);
    const restoreSnap = wantRestore ? loadLocalSnapshotRaw() : null;

    // Fresh Start: clear lingering mid-game autosave (no-op if FEATURE_SNAPSHOT off).
    if (!wantRestore) {
      clearLocalSnapshot();
    }

    if (selMode) {
      state.host.gameMode = selMode.value;
    }
    if (restoreSnap && restoreSnap.gameMode) {
      state.host.gameMode = restoreSnap.gameMode;
      if (selMode) selMode.value = restoreSnap.gameMode;
    }

    setAppState(AppState.LOADING);
    setLoadingTitle('Loading match');
    progressFill.style.width = '0%';
    progressLabel.textContent = '0% — Starting…';

    try {
      const match = await runLoading((pct, label) => {
        progressFill.style.width = `${pct}%`;
        progressLabel.textContent = `${Math.round(pct)}% — ${label}`;
      });

      if (!match || !match.pools || !match.world) {
        throw new Error('Loading incomplete');
      }

      if (restoreSnap) {
        restoreMatchFromSnapshot(match, restoreSnap);
        match.host = state.host;
      } else {
        initMatchGameplay(match, {
          gameMode: state.host.gameMode,
          host: state.host,
        });
      }
      state.match = match;
      state.camera.zoom = getMatchZoom(match);
      state.autosaveAcc = 0;

      // Gate 2b: resource load passed — still require first world paint before hide loading.
      progressLabel.textContent = '96% — First world paint…';
      await warmFirstWorldPaint(match);

      setAppState(AppState.PLAYING);
      screens.playing.classList.remove('is-warming');
      resizeCanvas();
      refreshHotbar();
      syncDebugHudButtons(match);
      startLoop();
    } catch (err) {
      console.error(err);
      screens.playing.classList.remove('is-warming');
      progressLabel.textContent = `Load failed: ${
        err && err.message ? err.message : err
      } — back to menu`;
      await new Promise((r) => setTimeout(r, 1200));
      enterMenu();
    } finally {
      state.loadingLocked = false;
    }
  }

  /**
   * First-paint readiness (สถาปัตยกรรมระบบเว็บเกมโฮสต์ §5):
   * Keep LOADING on top, reveal PLAYING underneath for real layout, then
   * resize + draw ≥2 frames. Fail closed if canvas/world/player/paint broken.
   */
  function frame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  async function warmFirstWorldPaint(match) {
    if (!match || !match.world) {
      throw new Error('First paint: match/world missing');
    }
    if (!match.world.paths || !match.world.paths.length) {
      throw new Error('First paint: world paths empty');
    }
    if (match.playerUnitId < 0 || !getPlayerUnit(match)) {
      throw new Error('First paint: player not spawned');
    }

    // Layout under loading overlay (loading z-index higher in CSS).
    screens.menu.hidden = true;
    screens.menu.classList.remove('is-active');
    screens.playing.hidden = false;
    screens.playing.classList.add('is-active', 'is-warming');
    screens.loading.hidden = false;
    screens.loading.classList.add('is-active');

    await frame();
    let size = resizeCanvas();
    if (size.cssW < 2 || size.cssH < 2 || canvas.width < 2 || canvas.height < 2) {
      await frame();
      size = resizeCanvas();
    }
    if (canvas.width < 2 || canvas.height < 2) {
      throw new Error(
        `First paint: canvas buffer ${canvas.width}×${canvas.height} (layout 0×0)`
      );
    }

    match.cameraSnapPending = true;
    let ok = false;
    try {
      ok = drawPlaying({ throwOnError: true });
    } catch (e) {
      throw new Error(`First paint: draw failed — ${e.message || e}`);
    }
    await frame();
    try {
      ok = drawPlaying({ throwOnError: true }) && ok;
    } catch (e) {
      throw new Error(`First paint: draw failed — ${e.message || e}`);
    }
    if (!ok) {
      throw new Error('First paint: draw returned empty (no match/world)');
    }

    // Sample several pixels — cleared buffer is #121416; painted world is brighter/tinted.
    const probes = [
      [0.5, 0.5],
      [0.35, 0.35],
      [0.65, 0.65],
      [0.5, 0.4],
    ];
    let painted = false;
    let lastRgb = 'n/a';
    try {
      for (let i = 0; i < probes.length; i++) {
        const px = Math.min(
          canvas.width - 1,
          Math.max(0, Math.floor(canvas.width * probes[i][0]))
        );
        const py = Math.min(
          canvas.height - 1,
          Math.max(0, Math.floor(canvas.height * probes[i][1]))
        );
        const sample = ctx.getImageData(px, py, 1, 1).data;
        const r = sample[0];
        const g = sample[1];
        const b = sample[2];
        lastRgb = `${r},${g},${b}`;
        // Clear fill ≈ 18,20,22 — anything clearly above that counts as painted.
        if (r > 24 || g > 26 || b > 28) {
          painted = true;
          break;
        }
      }
    } catch (e) {
      throw new Error(`First paint: getImageData failed — ${e.message || e}`);
    }
    if (!painted) {
      throw new Error(
        `First paint: canvas still clear-color (last rgb(${lastRgb})) — world not drawn`
      );
    }

    progressLabel.textContent = '100% — World paint OK';
    await frame();
  }

  function endMatch(outcome) {
    if (state.appState !== AppState.PLAYING) return;
    if (state.panels) state.panels.close();
    stopLoop();
    const match = state.match;
    // Win/Lose: CLEAR autosave — no Restore after finished match.
    clearLocalSnapshot();
    const waveReached = match ? match.waveIndex : 0;
    const stats = match && match.stats ? match.stats : {};
    state.result = {
      outcome,
      waveReached,
      mode: match ? match.gameMode : state.host.gameMode,
      stats,
    };
    resultTitle.textContent = outcome === 'win' ? 'Victory' : 'Defeat';
    resultDetail.textContent =
      outcome === 'win'
        ? `Cleared wave ${GAME_PACK.targetWaveToWin}. Reached wave ${waveReached}.`
        : `Base destroyed. Reached wave ${waveReached}.`;

    if (resultStats) {
      resultStats.innerHTML = '';
      const rows = [
        `Mode: ${state.result.mode}`,
        `Kills: ${stats.kills || 0}`,
        `Shots: ${stats.shotsFired || 0}`,
        `Blocks placed: ${stats.blocksPlaced || 0}`,
        `Resources: ${stats.resourcesGathered || 0}`,
        `Damage dealt: ${Math.round(stats.damageDealt || 0)}`,
        `Room: ${state.host.roomCode}`,
      ];
      for (let i = 0; i < rows.length; i++) {
        const li = document.createElement('li');
        li.textContent = rows[i];
        resultStats.appendChild(li);
      }
    }
    setAppState(AppState.RESULT);
  }

  function forceResult(outcome) {
    if (state.appState !== AppState.PLAYING) return;
    if (state.match) state.match.outcome = outcome;
    endMatch(outcome);
  }

  function startLoop() {
    stopLoop();
    state.lastTs = 0;
    const tick = (ts) => {
      if (state.appState !== AppState.PLAYING) return;
      if (!state.lastTs) state.lastTs = ts;
      const dt = Math.min(0.05, (ts - state.lastTs) / 1000);
      state.lastTs = ts;
      try {
        updatePlaying(dt);
      } catch (err) {
        console.error('[TheDDOS] updatePlaying failed (loop kept alive)', err);
      }
      try {
        drawPlaying();
      } catch (err) {
        console.error('[TheDDOS] drawPlaying failed (loop kept alive)', err);
      }
      state.rafId = requestAnimationFrame(tick);
    };
    state.rafId = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
  }

  function updatePlaying(dt) {
    const match = state.match;
    if (!match) return;

    try {
      state.autosaveAcc += dt;
      tryAutosave(false);

      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      const playerId = match.playerUnitId >= 0 ? match.playerUnitId : 0;
      const polled = state.input.poll(
        playerId,
        state.camera,
        cssW,
        cssH,
        match.activeHotbar,
        match.inventory
      );

      if (polled.escapePressed) {
        if (isCheatOpen()) closeCheat();
        else if (state.panels && state.panels.isOpen()) state.panels.close();
      }

      if (polled.craftTogglePressed && state.panels) {
        state.panels.toggleCraft();
      }
      if (polled.meleeVolumeTogglePressed) {
        match.showMeleeVolume = !match.showMeleeVolume;
        syncDebugHudButtons(match);
      }
      if (
        polled.interactTogglePressed &&
        state.panels &&
        state.panels.isReceiveOpen()
      ) {
        state.panels.close();
      }

      if (match.playerDead || match.cameraFreeFly) {
        ensureFreeFlyCamera(match, cssW, cssH);
        const speed = GAME_PACK.cameraFreeFlySpeed || 520;
        panCamera(
          state.camera,
          (polled.moveDx || 0) * speed * dt,
          (polled.moveDy || 0) * speed * dt,
          match.world.worldW,
          match.world.worldH,
          cssW,
          cssH
        );
        const outcome = tickMatch(match, [], polled.mouseWorld, dt);
        if (state.panels) {
          state.panels.consumePendingUi(match);
          state.panels.tick(dt);
        }
        if (outcome === 'win' || outcome === 'lose') {
          endMatch(outcome);
        }
        return;
      }

      const prevHotbar = match.activeHotbar;
      const invFingerprint = inventoryFingerprint(match.inventory);
      let actions = hostIngestActions(state.host, polled.actions, null) || [];
      if (state.pendingHotbarSelect >= 0) {
        const slot = state.pendingHotbarSelect;
        state.pendingHotbarSelect = -1;
        actions = [
          makeSelectHotbarAction(playerId, slot),
          ...actions.filter((a) => a.type !== 'SELECT_HOTBAR'),
        ];
      }
      if (state.pendingFistCast) {
        state.pendingFistCast = false;
        actions = actions.concat([makeCastSkillAction(playerId, 'FIST')]);
      }
      if (state.pendingTake) {
        const pend = state.pendingTake;
        state.pendingTake = null;
        if (pend.kind === 'gen') {
          actions = actions.concat([
            makeTakeGenAction(playerId, pend.blockId),
          ]);
        } else if (pend.kind === 'base') {
          actions = actions.concat([
            makeTakeBaseAction(playerId, pend.itemId),
          ]);
        }
      }
      // Align ghost + place with SELECT before tick (session state stays one source).
      for (let i = 0; i < actions.length; i++) {
        if (actions[i].type === 'SELECT_HOTBAR') {
          match.activeHotbar = actions[i].slot | 0;
        }
      }
      updatePlaceGhost(match, polled.mouseWorld);
      const outcome = tickMatch(match, actions, polled.mouseWorld, dt);

      if (state.panels) {
        state.panels.consumePendingUi(match);
        state.panels.tick(dt);
      }

      if (
        match.activeHotbar !== prevHotbar ||
        inventoryFingerprint(match.inventory) !== invFingerprint
      ) {
        refreshHotbar();
        if (state.panels) state.panels.refreshCraftIfOpen();
      }

      if (outcome === 'win' || outcome === 'lose') {
        endMatch(outcome);
      }
    } finally {
      // Always sync Hub to match state — even if tick threw mid-frame.
      updateHud(match);
    }
  }

  function inventoryFingerprint(inv) {
    if (!inv) return '';
    let s = '';
    for (let i = 0; i < inv.length; i++) {
      const slot = inv[i];
      s += `${slot.itemId || ''}:${slot.count}:${slot.ammoInMag || 0}:${slot.mags || 0}|`;
    }
    return s;
  }

  function updateHud(match) {
    const pack = GAME_PACK;
    let waveText;
    if (!match.basePlaced) {
      waveText = 'Place Base (slot 1) · green ghost';
    } else if (match.waveIndex === 0) {
      waveText = `Setup · wave 1 in ${Math.ceil(Math.max(0, match.waveCountdown))}s`;
    } else if (match.waveIndex >= pack.targetWaveToWin) {
      waveText = `Wave ${match.waveIndex} · ${match.enemiesAlive} left · clear to win`;
    } else {
      waveText = `Wave ${match.waveIndex} · ${match.enemiesAlive} alive · next in ${Math.ceil(
        Math.max(0, match.waveCountdown)
      )}s · win @ ${pack.targetWaveToWin}`;
    }
    waveHud.textContent = waveText;

    const player = getPlayerUnit(match);
    if (player) {
      hpHud.textContent = `HP ${Math.ceil(player.hp)}/${player.maxHp}`;
    } else if (match.playerDead) {
      hpHud.textContent = `Respawn ${Math.ceil(Math.max(0, match.respawnTimer))}s`;
    } else {
      hpHud.textContent = 'HP —';
    }

    if (match.base && match.base.alive) {
      baseHud.textContent = `Base ${Math.ceil(Math.max(0, match.base.hp))}/${match.base.maxHp}`;
    } else if (match.basePlaced) {
      baseHud.textContent = 'Base destroyed';
    } else {
      baseHud.textContent = 'Base — not placed';
    }

    if (ammoHud) {
      const slot = getActiveSlot(match.inventory, match.activeHotbar);
      if (isWeaponSlot(slot)) {
        const wdef = getWeaponDef(slot.weaponId || slot.itemId);
        const reserve =
          wdef && wdef.ammoTypeId
            ? countItem(match.inventory, wdef.ammoTypeId)
            : null;
        ammoHud.textContent = `${slot.label}: ${formatAmmoHud(slot, wdef, reserve)}`;
      } else if (slot.itemId) {
        ammoHud.textContent = `${slot.label} ×${slot.count}`;
      } else {
        ammoHud.textContent = 'Empty slot';
      }
    }

    if (promptHud) {
      promptHud.textContent = match.interactPrompt || '';
    }
    syncDebugHudButtons(match);
  }

  function refreshHotbar() {
    if (!hotbarEl || !state.match) return;
    const match = state.match;
    hotbarEl.innerHTML = '';
    const inv = match.inventory || match.hotbar || [];
    for (let i = 0; i < inv.length; i++) {
      const slot = inv[i];
      const el = document.createElement('div');
      el.className =
        'hotbar-slot' + (i === match.activeHotbar ? ' is-active' : '');
      el.dataset.slotIndex = String(i);
      el.style.background = slot.color || '#2a332c';
      const key = i === 9 ? '0' : String(i + 1);
      if (slot.itemId) {
        const ammo =
          isWeaponSlot(slot) && slot.ammoInMag != null
            ? ` ${slot.ammoInMag}`
            : slot.count > 1
              ? `×${slot.count}`
              : '';
        el.innerHTML = `<span class="slot-key">${key}</span><span class="slot-name">${slot.label || slot.itemId}${ammo}</span>`;
        el.title = `${slot.label || slot.itemId} (${slot.kind}) · drag to move / drop to throw`;
      } else {
        el.innerHTML = `<span class="slot-key">${key}</span>`;
        el.style.opacity = '0.4';
        el.title = 'Empty';
      }
      el.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        // Queue SELECT through gameplay session (do not bypass Action pipeline).
        state.pendingHotbarSelect = i;
        match.activeHotbar = i;
        refreshHotbar();
        if (!slot.itemId) return;
        hotbarDrag.active = true;
        hotbarDrag.dragging = false;
        hotbarDrag.fromIndex = i;
        hotbarDrag.startX = e.clientX;
        hotbarDrag.startY = e.clientY;
      });
      if (hotbarDrag.active && hotbarDrag.fromIndex === i) {
        el.classList.add('is-drag-source');
      }
      hotbarEl.appendChild(el);
    }
  }

  function syncDebugHudButtons(match) {
    if (btnFreeCraft) {
      btnFreeCraft.classList.toggle('is-on', !!(match && match.freeCraft));
      btnFreeCraft.textContent = match && match.freeCraft ? 'FreeCraft ON' : 'FreeCraft';
    }
    if (btnMeleeVol) {
      btnMeleeVol.classList.toggle('is-on', !!(match && match.showMeleeVolume));
      btnMeleeVol.textContent =
        match && match.showMeleeVolume ? 'MeleeVol ON (V)' : 'MeleeVol (V)';
    }
    if (btnCheat) {
      btnCheat.classList.toggle('is-on', isCheatOpen());
    }
    syncCheatZoomUi(match);
  }

  function isCheatOpen() {
    return !!(cheatPanel && !cheatPanel.hidden);
  }

  function openCheat() {
    if (!cheatPanel) return;
    if (state.panels) state.panels.close();
    cheatPanel.hidden = false;
    cheatPanel.classList.add('is-open');
    if (state.input) state.input.setUiBlocked(true);
    syncCheatZoomUi(state.match);
    if (btnCheat) btnCheat.classList.add('is-on');
  }

  function closeCheat() {
    if (!cheatPanel) return;
    cheatPanel.hidden = true;
    cheatPanel.classList.remove('is-open');
    if (state.input) state.input.setUiBlocked(false);
    if (btnCheat) btnCheat.classList.remove('is-on');
  }

  function toggleCheat() {
    if (isCheatOpen()) closeCheat();
    else openCheat();
  }

  function getMatchZoom(match) {
    const pack = GAME_PACK;
    const z =
      match && typeof match.cameraZoom === 'number'
        ? match.cameraZoom
        : pack.cameraFollowZoom;
    return clampZoom(z, pack.cameraZoomMin, pack.cameraZoomMax);
  }

  function setMatchZoom(z) {
    const pack = GAME_PACK;
    const next = clampZoom(
      Math.round(z / pack.cameraZoomStep) * pack.cameraZoomStep,
      pack.cameraZoomMin,
      pack.cameraZoomMax
    );
    if (state.match) state.match.cameraZoom = next;
    state.camera.zoom = next;
    syncCheatZoomUi(state.match);
    return next;
  }

  function syncCheatZoomUi(match) {
    const z = getMatchZoom(match);
    if (cheatZoomRange) cheatZoomRange.value = String(z);
    if (cheatZoomValue) cheatZoomValue.textContent = z.toFixed(1);
  }

  function ensureFreeFlyCamera(match, cssW, cssH) {
    if (!match.cameraFreeFly) return;
    // First frame after death: center on death point once.
    if (match._freeFlyBooted) return;
    match._freeFlyBooted = true;
    const tx =
      typeof match.deathX === 'number'
        ? match.deathX
        : match.world.worldW * 0.5;
    const ty =
      typeof match.deathY === 'number'
        ? match.deathY
        : match.world.worldH * 0.5;
    snapCameraTo(
      state.camera,
      tx,
      ty,
      match.world.worldW,
      match.world.worldH,
      cssW,
      cssH
    );
  }

  function drawPlaying(opts = {}) {
    try {
      const size = ensureCanvasSize();
      const cssW = size.cssW;
      const cssH = size.cssH;
      const dpr = size.dpr > 0 ? size.dpr : 1;

      clearCanvas(ctx, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!state.match) return false;
      const match = state.match;
      if (!match.world) return false;

      state.camera.zoom = getMatchZoom(match);
      if (!Number.isFinite(state.camera.zoom) || state.camera.zoom <= 0) {
        state.camera.zoom = 1;
      }

      if (match.cameraFreeFly || match.playerDead) {
        ensureFreeFlyCamera(match, cssW, cssH);
        panCamera(state.camera, 0, 0, match.world.worldW, match.world.worldH, cssW, cssH);
      } else {
        const player = getPlayerUnit(match);
        if (match.cameraSnapPending && player) {
          snapCameraTo(
            state.camera,
            player.x,
            player.y,
            match.world.worldW,
            match.world.worldH,
            cssW,
            cssH
          );
          match.cameraSnapPending = false;
          match._freeFlyBooted = false;
        } else {
          const followX = player
            ? player.x
            : match.base
              ? match.base.x + match.base.w / 2
              : match.world.worldW / 2;
          const followY = player
            ? player.y
            : match.base
              ? match.base.y + match.base.h / 2
              : match.world.worldH / 2;
          followPoint(
            state.camera,
            followX,
            followY,
            match.world.worldW,
            match.world.worldH,
            cssW,
            cssH
          );
        }
      }

      if (!Number.isFinite(state.camera.x)) state.camera.x = 0;
      if (!Number.isFinite(state.camera.y)) state.camera.y = 0;

      renderWorld(ctx, match.world, state.camera, match, dpr);
      return true;
    } catch (err) {
      console.error('[TheDDOS] drawPlaying failed', err);
      if (opts.throwOnError) throw err;
      return false;
    }
  }

  btnStart.addEventListener('click', () => {
    startMatch({ restore: false });
  });
  if (btnRestore) {
    btnRestore.addEventListener('click', () => {
      if (!FEATURE_SNAPSHOT || !hasLocalSnapshot()) {
        refreshLobbyUi();
        return;
      }
      startMatch({ restore: true });
    });
  }
  if (btnClearSnap) {
    btnClearSnap.addEventListener('click', () => {
      if (!FEATURE_SNAPSHOT) return;
      clearLocalSnapshot();
      refreshLobbyUi();
    });
  }

  btnResultMenu.addEventListener('click', () => {
    enterMenu();
  });

  if (btnCheat) {
    btnCheat.addEventListener('click', () => toggleCheat());
  }
  if (cheatClose) {
    cheatClose.addEventListener('click', () => closeCheat());
  }
  if (btnForceWin) {
    btnForceWin.addEventListener('click', () => forceResult('win'));
  }
  if (btnForceLose) {
    btnForceLose.addEventListener('click', () => forceResult('lose'));
  }

  if (btnFreeCraft) {
    btnFreeCraft.addEventListener('click', () => {
      if (!state.match) return;
      state.match.freeCraft = !state.match.freeCraft;
      syncDebugHudButtons(state.match);
    });
  }

  function manualExportSave() {
    if (!FEATURE_SNAPSHOT) return;
    if (state.appState !== AppState.PLAYING || !state.match) return;
    exportMatchSnapshotFile(state.match);
  }

  if (btnManualSave) {
    btnManualSave.addEventListener('click', () => manualExportSave());
  }

  function applyImportedSaveFile(file) {
    if (!FEATURE_SNAPSHOT || !file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const snap = parseSnapshotFileText(String(reader.result || ''));
      if (!snap) {
        if (saveFileStatus) {
          saveFileStatus.hidden = false;
          saveFileStatus.textContent = 'Invalid save file.';
        }
        return;
      }
      importSnapshotIntoAutosave(snap);
      refreshLobbyUi();
      if (saveFileStatus) {
        saveFileStatus.hidden = false;
        saveFileStatus.textContent = 'Loaded into Local Host — click Restore.';
      }
    };
    reader.onerror = () => {
      if (saveFileStatus) {
        saveFileStatus.hidden = false;
        saveFileStatus.textContent = 'Could not read file.';
      }
    };
    reader.readAsText(file);
  }

  if (saveFileInput) {
    saveFileInput.addEventListener('change', () => {
      const f = saveFileInput.files && saveFileInput.files[0];
      applyImportedSaveFile(f);
      saveFileInput.value = '';
    });
  }

  if (saveDropZone) {
    const stop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    saveDropZone.addEventListener('dragenter', (e) => {
      stop(e);
      saveDropZone.classList.add('is-dragover');
    });
    saveDropZone.addEventListener('dragover', (e) => {
      stop(e);
      saveDropZone.classList.add('is-dragover');
    });
    saveDropZone.addEventListener('dragleave', (e) => {
      stop(e);
      saveDropZone.classList.remove('is-dragover');
    });
    saveDropZone.addEventListener('drop', (e) => {
      stop(e);
      saveDropZone.classList.remove('is-dragover');
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      applyImportedSaveFile(f);
    });
  }

  if (btnMeleeVol) {
    btnMeleeVol.addEventListener('click', () => {
      if (!state.match) return;
      state.match.showMeleeVolume = !state.match.showMeleeVolume;
      syncDebugHudButtons(state.match);
    });
  }

  if (btnFist) {
    btnFist.addEventListener('click', () => {
      if (!state.match || state.match.playerDead) return;
      state.pendingFistCast = true;
    });
  }

  function nudgeZoom(dir) {
    const pack = GAME_PACK;
    const cur = getMatchZoom(state.match);
    setMatchZoom(cur + dir * pack.cameraZoomStep);
  }

  if (cheatZoomIn) {
    cheatZoomIn.addEventListener('click', () => nudgeZoom(1));
  }
  if (cheatZoomOut) {
    cheatZoomOut.addEventListener('click', () => nudgeZoom(-1));
  }
  if (cheatZoomRange) {
    cheatZoomRange.addEventListener('input', () => {
      setMatchZoom(Number(cheatZoomRange.value));
    });
    cheatZoomRange.addEventListener('wheel', (e) => {
      e.preventDefault();
      nudgeZoom(e.deltaY < 0 ? 1 : -1);
    }, { passive: false });
  }

  if (btnJoin) {
    btnJoin.addEventListener('click', () => {
      const res = tryJoinRoom(state.host.roomCode);
      if (joinStubEl) joinStubEl.textContent = res.message;
    });
  }

  if (selMode) {
    selMode.addEventListener('change', () => {
      state.host.gameMode = selMode.value;
    });
  }

  window.addEventListener('keydown', (e) => {
    if (state.appState !== AppState.PLAYING) return;
    if (e.key === 'F9') forceResult('win');
    if (e.key === 'F10') forceResult('lose');
  });

  window.addEventListener('resize', () => {
    if (
      state.appState === AppState.PLAYING ||
      state.appState === AppState.RESULT
    ) {
      resizeCanvas();
    }
  });

  function onFullscreenChange() {
    if (
      state.appState === AppState.PLAYING ||
      state.appState === AppState.BOOT ||
      state.appState === AppState.LOADING ||
      state.appState === AppState.RESULT
    ) {
      resizeCanvas();
    }
  }
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);

  document.addEventListener('touchmove', onPlayTouchMove, { passive: false });
  document.addEventListener('gesturestart', onPlayGesture, { passive: false });
  document.addEventListener('gesturechange', onPlayGesture, { passive: false });

  // Best-effort autosave on leave / hide while PLAYING (throttled path is primary).
  function onPageLifecycleSave() {
    tryAutosave(true);
  }
  window.addEventListener('pagehide', onPageLifecycleSave);
  window.addEventListener('beforeunload', onPageLifecycleSave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onPageLifecycleSave();
  });

  // Stay on BOOT until main.js calls boot() — do not enterMenu early.
  setMenuInteractable(false);
  setAppState(AppState.BOOT);
  setLoadingTitle('Booting TheDDOS');

  return {
    state,
    boot,
    startMatch,
    forceResult,
    enterMenu,
    PATH_SIZE,
  };
}

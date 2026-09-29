import {
  AppState,
  AUTOSAVE_INTERVAL_SEC,
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
import { runLoading } from './loading.js';
import {
  clearLocalSnapshot,
  exportMatchSnapshotFile,
  hasLocalSnapshot,
  importSnapshotIntoAutosave,
  loadLocalSnapshotRaw,
  parseSnapshotFileText,
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
    appState: AppState.MENU,
    match: null,
    result: null,
    camera: createCamera(),
    rafId: 0,
    lastTs: 0,
    loadingLocked: false,
    input: null,
    host: createHostSession({ gameMode: GameMode.FLAT_SURVIVAL }),
    panels: null,
    /** Elapsed since last throttled autosave while PLAYING. */
    autosaveAcc: 0,
  };

  const {
    screens,
    progressFill,
    progressLabel,
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

  const ctx = canvas.getContext('2d');
  state.input = createInput(canvas);

  /** Hotbar drag: mousedown starts, mouseup ends (swap / throw). */
  const hotbarDrag = {
    active: false,
    fromIndex: -1,
  };

  function endHotbarDrag(clientX, clientY) {
    if (!hotbarDrag.active) return;
    const from = hotbarDrag.fromIndex;
    hotbarDrag.active = false;
    hotbarDrag.fromIndex = -1;
    if (state.input) state.input.setActionBusy(false);
    if (hotbarEl) hotbarEl.classList.remove('is-dragging');

    const match = state.match;
    if (!match || from < 0) {
      refreshHotbar();
      return;
    }

    const slotEl = document.elementFromPoint(clientX, clientY);
    const overSlot = slotEl && slotEl.closest ? slotEl.closest('.hotbar-slot') : null;
    if (overSlot && hotbarEl && hotbarEl.contains(overSlot)) {
      const to = Number(overSlot.dataset.slotIndex);
      if (Number.isFinite(to) && to !== from) {
        moveOrSwapInventorySlots(match.inventory, from, to);
        match.activeHotbar = to;
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
      const zoom = state.camera.zoom > 0 ? state.camera.zoom : 1;
      const wx = state.camera.x + (clientX - canvasRect.left) / zoom;
      const wy = state.camera.y + (clientY - canvasRect.top) / zoom;
      throwHotbarSlot(match, from, wx, wy);
    }
    refreshHotbar();
  }

  window.addEventListener('mouseup', (e) => {
    if (hotbarDrag.active) endHotbarDrag(e.clientX, e.clientY);
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
    const hasSnap = hasLocalSnapshot();
    if (btnRestore) {
      btnRestore.hidden = !hasSnap;
    }
    if (btnClearSnap) {
      btnClearSnap.hidden = !hasSnap;
    }
    if (snapStatus) {
      if (hasSnap) {
        const raw = loadLocalSnapshotRaw();
        const when = raw && raw.savedAt ? new Date(raw.savedAt).toLocaleString() : '';
        const wave = raw ? raw.waveIndex : '?';
        snapStatus.hidden = false;
        snapStatus.textContent = `Snapshot ready — wave ${wave}${when ? ` · ${when}` : ''}`;
      } else {
        snapStatus.hidden = true;
        snapStatus.textContent = '';
      }
    }
  }

  function tryAutosave(force) {
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
    setAppState(AppState.MENU);
  }

  function showScreen(appState) {
    const showMenu = appState === AppState.MENU;
    const showLoading = appState === AppState.LOADING;
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
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  async function startMatch(opts = {}) {
    if (state.loadingLocked) return;
    state.loadingLocked = true;
    state.result = null;
    const restoreSnap = opts.restore ? loadLocalSnapshotRaw() : null;

    // Fresh Start: clear lingering mid-game autosave so Restore won't revive old snap
    // until the next throttled autosave during this match.
    if (!opts.restore) {
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

      setAppState(AppState.PLAYING);
      resizeCanvas();
      refreshHotbar();
      syncDebugHudButtons(match);
      startLoop();
    } catch (err) {
      console.error(err);
      progressLabel.textContent = 'Load failed — back to menu';
      await new Promise((r) => setTimeout(r, 800));
      enterMenu();
    } finally {
      state.loadingLocked = false;
    }
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
      updatePlaying(dt);
      drawPlaying();
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

    // F = toggle craft; E while receive panel open = toggle close.
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

    // Free-fly while dead: WASD pans camera (faster); no player actions.
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
      updateHud(match);
      // Respawn may clear free-fly this frame — snap on next draw.
      if (outcome === 'win' || outcome === 'lose') {
        endMatch(outcome);
      }
      return;
    }

    updatePlaceGhost(match, polled.mouseWorld);

    const prevHotbar = match.activeHotbar;
    const invFingerprint = inventoryFingerprint(match.inventory);
    const actions = hostIngestActions(state.host, polled.actions, null);
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

    updateHud(match);

    if (outcome === 'win' || outcome === 'lose') {
      endMatch(outcome);
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
        match.activeHotbar = i;
        if (!slot.itemId) {
          refreshHotbar();
          return;
        }
        hotbarDrag.active = true;
        hotbarDrag.fromIndex = i;
        if (state.input) state.input.setActionBusy(true);
        if (hotbarEl) hotbarEl.classList.add('is-dragging');
        el.classList.add('is-drag-source');
        refreshHotbar();
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

  function drawPlaying() {
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    clearCanvas(ctx, canvas.width, canvas.height);
    const dpr = canvas.width / Math.max(1, cssW);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!state.match) return;
    const match = state.match;
    state.camera.zoom = getMatchZoom(match);

    if (match.cameraFreeFly || match.playerDead) {
      ensureFreeFlyCamera(match, cssW, cssH);
      // Keep pan clamp if zoom changed while free-flying.
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
    renderWorld(ctx, match.world, state.camera, match);
  }

  btnStart.addEventListener('click', () => {
    startMatch({ restore: false });
  });
  if (btnRestore) {
    btnRestore.addEventListener('click', () => {
      if (!hasLocalSnapshot()) {
        refreshLobbyUi();
        return;
      }
      startMatch({ restore: true });
    });
  }
  if (btnClearSnap) {
    btnClearSnap.addEventListener('click', () => {
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
    if (state.appState !== AppState.PLAYING || !state.match) return;
    exportMatchSnapshotFile(state.match);
  }

  if (btnManualSave) {
    btnManualSave.addEventListener('click', () => manualExportSave());
  }

  function applyImportedSaveFile(file) {
    if (!file) return;
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

  enterMenu();

  return {
    state,
    startMatch,
    forceResult,
    enterMenu,
    PATH_SIZE,
  };
}

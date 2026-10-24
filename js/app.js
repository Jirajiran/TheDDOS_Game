import {
  AppState,
  AUTOSAVE_INTERVAL_SEC,
  FEATURE_SNAPSHOT,
  GAME_PACK,
  GameMode,
  PATH_SIZE,
  getItemDef,
} from './config.js';
import { createCamera, easeLookToward, followPoint, panCamera, snapCameraTo, clampZoom } from './view/camera.js';
import { getWeaponIconHref } from './view/weaponBtnArt.js';
import { getNightCameraZoomMul } from './view/dayCycle.js';
import {
  createHostSession,
  generateRoomCode,
  hostKickPlayer,
  hostSetLocalName,
  tryJoinRoom,
} from './session/host.js';
import { createMatchEnd } from './app/matchEnd.js';
import { createPlaySession } from './app/playSession.js';
import { createInput } from './player/input.js';
import {
  getActiveSlot,
  isWeaponSlot,
  moveOrSwapInventorySlots,
} from './player/inventory.js';
import { stopAmbience } from './audio/sfx.js';
import { runBootPreload } from './session/boot.js';
import { runLoading } from './session/loading.js';
import { createLoadingUi } from './session/loadingUi.js';
import { createMainMenuUi } from './mainMenuUi.js';
import { createPlayerUiGamePlay } from './playerUiGamePlay.js';
import { injectMenuSkinPreviews, isUnitVisualReady } from './view/unitVisual.js';
import {
  clearLocalSnapshot,
  exportMatchSnapshotFile,
  hasLocalSnapshot,
  importSnapshotIntoAutosave,
  loadLocalSnapshotRaw,
  parseSnapshotFileText,
  sanitizeLocalSnapshot,
  writeAutosave,
} from './session/memento.js';
import { createPanels } from './ui/panels.js';
import { resetPools } from './world/pools.js';
import { clearCanvas, renderWorld } from './view/render.js';
import {
  findInteractTarget,
  getEquippedBackpackTier,
  getGenReceiveState,
  getPlayerUnit,
  initMatchGameplay,
  restoreMatchFromSnapshot,
  throwHotbarSlot,
} from './sim.js';

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
    /** SELF_HEAL (C / Skill_Show_2) → CAST_SKILL next tick. */
    pendingHealCast: false,
    /** Hub Take → TAKE_GEN / TAKE_BASE applied next tick (Unified Input). */
    pendingTake: null,
    /** Hold-F unequip backpack accumulator (sec). */
    fHoldAcc: 0,
  };

  const {
    screens,
    progressFill,
    progressLabel,
    loadingTitle,
    loadingBootPanel,
    loadingMain,
    loadingGameplay,
    loadingMainFill,
    loadingGpFill,
    loadingGpMap,
    loadingGpMode,
    loadingGpPlayers,
    loadingGpEnemies,
    loadingGpReady,
    canvas,
    btnStart,
    btnRestore,
    btnClearSnap,
    snapStatus,
    saveDropZone,
    saveFileInput,
    saveFileStatus,
    btnForceWin,
    btnForceLose,
    btnFreeCraft,
    btnManualSave,
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
    mainMenuMount,
    menuNameInput,
    menuRoomInput,
    menuJoinInput,
    playerUiMount,
  } = dom;

  if (!canvas) {
    throw new Error('Missing #game-canvas — open via play-local.bat (HTTP), not file://');
  }
  if (!screens || !screens.menu || !screens.loading || !screens.playing) {
    throw new Error('Missing screen elements — hard refresh (Ctrl+Shift+R)');
  }
  if (!progressFill || !progressLabel) {
    throw new Error('Missing loading progress elements');
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }
  state.input = createInput(canvas, {
    onChatPointerDismiss: () => {
      if (playerUi && playerUi.isChatOpen && playerUi.isChatOpen()) {
        playerUi.closeChat();
      }
    },
  });

  /** MainMenu.svg controller — mounted during boot once mount node exists. */
  let mainMenuUi = null;
  if (mainMenuMount) {
    mainMenuUi = createMainMenuUi({
      mount: mainMenuMount,
      nameInput: menuNameInput || undefined,
      roomInput: menuRoomInput || undefined,
      joinInput: menuJoinInput || undefined,
      saveFileInput: saveFileInput || undefined,
      getPlayers: () => (state.host && state.host.players) || [],
      isHost: () => !!(state.host && state.host.isHost),
      onNameChange: (name) => {
        hostSetLocalName(state.host, name);
        if (mainMenuUi) mainMenuUi.syncRoster();
      },
      onKick: (slot) => {
        const res = hostKickPlayer(state.host, slot);
        if (joinStubEl) joinStubEl.textContent = res.message;
        if (mainMenuUi) mainMenuUi.syncRoster();
        refreshLobbyUi();
      },
      onPlay: () => {
        if (!state.bootReady || state.loadingLocked) return;
        if (mainMenuUi) {
          state.host.gameMode = mainMenuUi.gameModeFromPick();
          if (selMode) selMode.value = state.host.gameMode;
          hostSetLocalName(state.host, mainMenuUi.getPlayerName());
        }
        const pick = mainMenuUi ? mainMenuUi.getWorldPick() : 'flat';
        if (pick === 'loadFile' && FEATURE_SNAPSHOT) {
          if (hasLocalSnapshot()) {
            startMatch({ restore: true });
            return;
          }
          if (saveFileInput) {
            saveFileInput.click();
            return;
          }
        }
        startMatch({ restore: false });
      },
      onJoinStub: () => {
        // Input slot = code to join; Host Hashing validates against host.roomCode.
        const typed =
          (mainMenuUi && mainMenuUi.getJoinText()) ||
          (menuJoinInput && menuJoinInput.value) ||
          '';
        const name = mainMenuUi ? mainMenuUi.getPlayerName() : 'Guest';
        const res = tryJoinRoom(state.host, typed, name);
        if (joinStubEl) {
          joinStubEl.dataset.locked = '1';
          joinStubEl.textContent = res.message;
        }
        if (mainMenuUi) mainMenuUi.syncRoster();
        refreshLobbyUi();
      },
      onLoadFile: () => {
        if (!FEATURE_SNAPSHOT) return;
        if (saveFileInput) saveFileInput.click();
      },
      onAudioToggle: () => {
        /* mute flag stored in mainMenuUi; Audio layer hooks later */
      },
      onLink: () => {
        /* util link stub */
      },
    });
  }

  /** Hotbar drag: mousedown starts, mouseup ends (swap / throw). */
  const hotbarDrag = {
    active: false,
    dragging: false,
    fromIndex: -1,
    startX: 0,
    startY: 0,
    color: '#6a7a8a',
    /** @type {HTMLElement | null} */
    ghostEl: null,
  };

  const HOTBAR_DRAG_PX = 8;

  /** @type {ReturnType<typeof createPlayerUiGamePlay>|null} */
  let playerUi = null;

  /** HTML loading panels (Loading_main / Loading_GamePlay art as reference). */
  let loadingUi = createLoadingUi({
    mainEl: loadingMain,
    gameplayEl: loadingGameplay,
    mainFill: loadingMainFill,
    gpFill: loadingGpFill,
    gpMap: loadingGpMap,
    gpMode: loadingGpMode,
    gpPlayers: loadingGpPlayers,
    gpEnemies: loadingGpEnemies,
    gpReady: loadingGpReady,
    mainStatus: document.getElementById('loading-main-status'),
    gpStatus: document.getElementById('loading-gp-status'),
  });

  function showFailPanel(message) {
    if (loadingBootPanel) loadingBootPanel.hidden = true;
    if (loadingUi) {
      if (!loadingUi.getVariant()) loadingUi.showMain();
      loadingUi.setStatus(message);
      return;
    }
    const status = document.getElementById('loading-main-status');
    if (loadingMain) loadingMain.hidden = false;
    if (status) {
      status.hidden = false;
      status.textContent = message;
    }
  }

  function reportLoadProgress(pct, label) {
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressLabel) {
      progressLabel.textContent = `${Math.round(pct)}% — ${label}`;
    }
    if (loadingUi) loadingUi.setProgress(pct);
  }

  function clearHotbarDragGhost() {
    if (hotbarDrag.ghostEl && hotbarDrag.ghostEl.parentNode) {
      hotbarDrag.ghostEl.parentNode.removeChild(hotbarDrag.ghostEl);
    }
    hotbarDrag.ghostEl = null;
  }

  function moveHotbarDragGhost(clientX, clientY) {
    const g = hotbarDrag.ghostEl;
    if (!g) return;
    g.style.left = `${clientX - 30}px`;
    g.style.top = `${clientY - 30}px`;
  }

  function ensureHotbarDragGhost(clientX, clientY) {
    if (hotbarDrag.ghostEl) {
      moveHotbarDragGhost(clientX, clientY);
      return;
    }
    const g = document.createElement('div');
    g.className = 'player-ui-drag-ghost';
    const dragSlot =
      state.match &&
      state.match.inventory &&
      state.match.inventory[hotbarDrag.fromIndex];
    const iconHref = getWeaponIconHref(
      (dragSlot && (dragSlot.weaponId || dragSlot.itemId)) || ''
    );
    g.style.background = iconHref
      ? 'center / contain no-repeat url("' + iconHref + '")'
      : hotbarDrag.color || '#6a7a8a';
    g.setAttribute('aria-hidden', 'true');
    document.body.appendChild(g);
    hotbarDrag.ghostEl = g;
    moveHotbarDragGhost(clientX, clientY);
  }

  function resetHotbarDragState() {
    hotbarDrag.active = false;
    hotbarDrag.dragging = false;
    hotbarDrag.fromIndex = -1;
    hotbarDrag.color = '#6a7a8a';
    clearHotbarDragGhost();
    if (state.input) state.input.setActionBusy(false);
  }

  function beginHotbarDrag(slotIndex, e) {
    state.pendingHotbarSelect = slotIndex;
    refreshHotbar();
    const match = state.match;
    const slot = match && match.inventory && match.inventory[slotIndex];
    if (!slot || !slot.itemId) return;
    const def = getItemDef(slot.itemId);
    hotbarDrag.active = true;
    hotbarDrag.dragging = false;
    hotbarDrag.fromIndex = slotIndex;
    hotbarDrag.startX = e.clientX;
    hotbarDrag.startY = e.clientY;
    hotbarDrag.color =
      (slot.color && String(slot.color)) ||
      (def && def.color) ||
      '#6a7a8a';
  }

  /** Climb DOM/SVG parents; never re-seed from the original hit (avoids freeze). */
  function slotIndexFromPoint(clientX, clientY) {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return -1;
    let node = el;
    while (node && node !== document) {
      if (node.getAttribute) {
        const attr = node.getAttribute('data-slot-index');
        if (attr != null && attr !== '') {
          const n = Number(attr);
          if (Number.isFinite(n)) return n;
        }
      }
      if (node.dataset && node.dataset.slotIndex != null) {
        const n = Number(node.dataset.slotIndex);
        if (Number.isFinite(n)) return n;
      }
      if (node.classList && node.classList.contains('hotbar-slot')) {
        const n = Number(
          (node.dataset && node.dataset.slotIndex) ||
            (node.getAttribute && node.getAttribute('data-slot-index'))
        );
        if (Number.isFinite(n)) return n;
      }
      const next =
        node.parentElement ||
        (node.parentNode && node.parentNode.host) ||
        node.parentNode;
      if (!next || next === node) break;
      node = next;
    }
    return -1;
  }

  function endHotbarDrag(clientX, clientY) {
    if (!hotbarDrag.active) return;
    const from = hotbarDrag.fromIndex;
    const wasDragging = hotbarDrag.dragging;
    resetHotbarDragState();

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

    const to = slotIndexFromPoint(clientX, clientY);
    if (to >= 0 && to !== from && match.inventory && to < match.inventory.length) {
      moveOrSwapInventorySlots(match.inventory, from, to);
      state.pendingHotbarSelect = to;
      refreshHotbar();
      return;
    }

    // Throw only when the topmost hit is the world canvas (not UI chrome).
    // Over UI without a slot → cancel, keep item.
    if (to < 0) {
      const hit = document.elementFromPoint(clientX, clientY);
      const overWorld =
        hit === canvas || !!(hit && canvas.contains && canvas.contains(hit));
      if (overWorld) throwHotbarSlot(match, from);
    }
    refreshHotbar();
  }

  window.addEventListener('mouseup', (e) => {
    if (hotbarDrag.active) endHotbarDrag(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    if (!hotbarDrag.active) return;
    if (hotbarDrag.dragging) {
      moveHotbarDragGhost(e.clientX, e.clientY);
      return;
    }
    const dx = e.clientX - hotbarDrag.startX;
    const dy = e.clientY - hotbarDrag.startY;
    if (dx * dx + dy * dy < HOTBAR_DRAG_PX * HOTBAR_DRAG_PX) return;
    hotbarDrag.dragging = true;
    if (state.input) state.input.setActionBusy(true);
    ensureHotbarDragGhost(e.clientX, e.clientY);
  });

  window.addEventListener('blur', () => {
    if (hotbarDrag.active) resetHotbarDragState();
  });

  /**
   * Unified UI intent pipe — SVG buttons and keyboard share handlers.
   * @param {string} intent
   * @param {*} [payload]
   */
  function dispatchUi(intent, payload) {
    switch (intent) {
      case 'craftToggle':
        if (state.panels) state.panels.toggleCraft();
        break;
      case 'craftClose':
        if (state.panels) state.panels.close();
        break;
      case 'craftConfirm':
        if (state.panels) state.panels.confirmSelectedCraft();
        break;
      case 'craftCatalog':
        if (state.panels) state.panels.setCraftCategory(payload);
        break;
      case 'craftSlot':
        if (state.panels) state.panels.selectCraftSlot(payload | 0);
        break;
      case 'interact':
        openNearbyInteract();
        break;
      case 'castFist':
        state.pendingFistCast = true;
        break;
      case 'castHeal':
        state.pendingHealCast = true;
        break;
      case 'settingOpen':
        if (state.panels && state.panels.isOpen()) state.panels.close();
        closeCheat();
        if (playerUi) playerUi.setSettingOpen(true);
        if (state.input) state.input.setUiBlocked(true);
        break;
      case 'settingClose':
        if (playerUi) playerUi.setSettingOpen(false);
        if (state.input) state.input.setUiBlocked(false);
        break;
      case 'leaveGame':
        if (playerUi) {
          playerUi.setSettingOpen(false);
          playerUi.setEndOpen(false);
        }
        if (state.input) {
          state.input.setUiBlocked(false);
          if (state.input.setChatMode) state.input.setChatMode(false);
        }
        enterMenu();
        break;
      case 'audioToggle':
        /* mute flag in localStorage — Audio layer hooks later */
        break;
      case 'genTake':
        handleSvgGenTake(payload);
        break;
      case 'genClose':
        if (state.panels) state.panels.close();
        break;
      case 'chatToggle':
        if (playerUi && playerUi.toggleChat) playerUi.toggleChat();
        break;
      default:
        break;
    }
  }

  if (playerUiMount) {
    playerUi = createPlayerUiGamePlay({
      mount: playerUiMount,
      onCraftToggle: () => dispatchUi('craftToggle'),
      onCraftClose: () => dispatchUi('craftClose'),
      onConfirmCraft: () => dispatchUi('craftConfirm'),
      onCatalog: (cat) => dispatchUi('craftCatalog', cat),
      onCraftSlotSelect: (idx) => dispatchUi('craftSlot', idx),
      onHotbarSelect: (i) => {
        state.pendingHotbarSelect = i;
        refreshHotbar();
      },
      onHotbarDown: (i, e) => beginHotbarDrag(i, e),
      onSettingOpen: () => dispatchUi('settingOpen'),
      onSettingClose: () => dispatchUi('settingClose'),
      onLeaveGame: () => dispatchUi('leaveGame'),
      onAudioToggle: () => dispatchUi('audioToggle'),
      onInteractive: () => {
        const match = state.match;
        const slot = match && getActiveSlot(match.inventory, match.activeHotbar);
        if (isWeaponSlot(slot) && state.input && state.input.requestReload) {
          state.input.requestReload();
          return;
        }
        dispatchUi('interact');
      },
      onGenTake: (resId) => dispatchUi('genTake', resId),
      onGenClose: () => dispatchUi('genClose'),
      onCastFist: () => dispatchUi('castFist'),
      onCastHeal: () => dispatchUi('castHeal'),
      onCastSkill: (skillId) => {
        if (skillId === 'SELF_HEAL') dispatchUi('castHeal');
        else if (skillId === 'FIST') dispatchUi('castFist');
      },
      onChatOpen: (open) => {
        if (state.input && state.input.setChatMode) {
          state.input.setChatMode(!!open);
        }
      },
      onChatSend: (text) => {
        if (text === '-FreeAll' && state.match) {
          state.match.freeCraft = true;
          syncDebugHudButtons(state.match);
        }
      },
    });
    if (state.input && state.input.setStickSource) {
      state.input.setStickSource(() => (playerUi ? playerUi.getStickPose() : null));
    }
  }

  function openNearbyInteract() {
    const match = state.match;
    if (!match || !playerUi) return;
    const player = getPlayerUnit(match);
    if (!player) return;
    const best = findInteractTarget(match, player);
    if (!best) return;
    if (best.isGen && best.genRate) {
      const pending = { type: 'receive-gen', blockId: best.id };
      if (state.panels) state.panels.openReceive(pending);
      return;
    }
    if (best.isDefeatCondition) {
      const pending = { type: 'receive-base', blockId: best.id };
      if (state.panels) state.panels.openReceive(pending);
    }
  }

  function handleSvgGenTake(resId) {
    const match = state.match;
    if (!match || !state.panels) return;
    const ctx = state.panels.getReceiveCtx && state.panels.getReceiveCtx();
    if (!ctx) return;
    if (ctx.type === 'receive-gen') {
      const st = getGenReceiveState(match, ctx.blockId);
      if (!st || st.itemId !== resId) return;
      state.pendingTake = { kind: 'gen', blockId: ctx.blockId };
    } else if (ctx.type === 'receive-base') {
      state.pendingTake = { kind: 'base', itemId: resId };
    }
    if (state.panels.refreshSvgGenIfOpen) state.panels.refreshSvgGenIfOpen();
  }

  state.panels = createPanels(
    {},
    {
      getMatch: () => state.match,
      canOpen: () => state.appState === AppState.PLAYING && !!state.match,
      playerUi: {
        isReady: () => !!(playerUi && playerUi.isReady()),
        setCraftOpen: (on) => playerUi && playerUi.setCraftOpen(on),
        setGenOpen: (on, ctx) => playerUi && playerUi.setGenOpen(on, ctx),
        isGenOpen: () => !!(playerUi && playerUi.isGenOpen && playerUi.isGenOpen()),
        syncCraftSlots: (recipes, idx) =>
          playerUi && playerUi.syncCraftSlots(recipes, idx),
        syncCatalogVisual: (cat) =>
          playerUi && playerUi.syncCatalogVisual && playerUi.syncCatalogVisual(cat),
        syncGenPanel: (info) =>
          playerUi && playerUi.syncGenPanel && playerUi.syncGenPanel(info),
      },
      onOpen: () => {
        closeCheat();
        if (playerUi) playerUi.setSettingOpen(false);
        state.input.setUiBlocked(true);
      },
      onClose: () => {
        if (playerUi && !playerUi.isSettingOpen()) {
          state.input.setUiBlocked(false);
        }
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
    if (joinStubEl && state.host.joinStubMessage) {
      // Keep last join result if present; otherwise show Hashing hint.
      if (!joinStubEl.dataset.locked) {
        joinStubEl.textContent = state.host.joinStubMessage;
      }
    }
    if (btnJoin) {
      btnJoin.disabled = !state.host.joinEnabled;
      btnJoin.title = state.host.joinStubMessage;
    }
    if (mainMenuUi && mainMenuUi.isReady()) {
      mainMenuUi.setRoomCode(state.host.roomCode);
      hostSetLocalName(state.host, mainMenuUi.getPlayerName());
      mainMenuUi.applyAll();
      requestAnimationFrame(() => {
        mainMenuUi.layoutInputs();
        mainMenuUi.syncRoster();
      });
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
    if (playerUi) {
      playerUi.setEndOpen(false);
      playerUi.setGenOpen(false);
      playerUi.setSettingOpen(false);
      playerUi.setCraftOpen(false);
      if (playerUi.clearChat) playerUi.clearChat();
      else if (playerUi.closeChat) playerUi.closeChat();
    }
    if (state.input && state.input.setChatMode) state.input.setChatMode(false);
    if (state.panels) state.panels.close();
    state.host.roomCode = generateRoomCode();
    // Fresh lobby roster — Host only; guests re-join via Hashing code.
    const hostName =
      (mainMenuUi && mainMenuUi.getPlayerName()) ||
      (state.host.players[0] && state.host.players[0].name) ||
      'Player';
    state.host.players = [
      {
        slot: 0,
        name: hostName,
        isLocal: true,
        isHost: true,
        connected: true,
      },
    ];
    if (joinStubEl) {
      delete joinStubEl.dataset.locked;
      joinStubEl.textContent = state.host.joinStubMessage;
    }
    refreshLobbyUi();
    setMenuInteractable(state.bootReady);
    setAppState(AppState.MENU);
    // First MENU this session: MainMeun rises in (new art positions + tween).
    if (mainMenuUi && mainMenuUi.isReady()) {
      requestAnimationFrame(() => mainMenuUi.playEnterTween());
    }
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
      if (loadingBootPanel) loadingBootPanel.hidden = true;
      loadingUi.showMain();

      const payload = await runBootPreload((pct, label) => {
        reportLoadProgress(pct, label);
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
      if (mainMenuUi && !mainMenuUi.isReady()) {
        reportLoadProgress(98, 'Main menu…');
        await mainMenuUi.mountSvg();
      }
      if (mainMenuUi && mainMenuUi.isReady() && isUnitVisualReady()) {
        try {
          await injectMenuSkinPreviews(mainMenuUi.state.svgRoot);
        } catch (_) {
          /* preview optional */
        }
      }
      reportLoadProgress(100, 'Ready');
      loadingUi.hide();
      setMenuInteractable(true);
      enterMenu();
      return true;
    } catch (err) {
      console.error(err);
      showFailPanel(
        (err && err.message ? err.message : 'Boot failed') + ' — reload the page'
      );
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
    if (menuNameInput) menuNameInput.disabled = !enabled;
    if (menuRoomInput) menuRoomInput.disabled = !enabled;
    if (menuJoinInput) menuJoinInput.disabled = !enabled;
    if (mainMenuMount) {
      mainMenuMount.style.pointerEvents = enabled ? 'auto' : 'none';
      mainMenuMount.style.opacity = enabled ? '1' : '0.65';
    }
  }

  function showScreen(appState) {
    const showMenu = appState === AppState.MENU;
    const showLoading =
      appState === AppState.BOOT || appState === AppState.LOADING;
    // RESULT keeps playing shell — SVG Anchor_Center_3 is the end screen.
    const showPlaying =
      appState === AppState.PLAYING || appState === AppState.RESULT;

    screens.menu.classList.toggle('is-active', showMenu);
    screens.menu.hidden = !showMenu;
    screens.loading.classList.toggle('is-active', showLoading);
    screens.loading.hidden = !showLoading;
    screens.playing.classList.toggle('is-active', showPlaying);
    screens.playing.hidden = !showPlaying;
  }

  function setAppState(next) {
    const prev = state.appState;
    state.appState = next;
    showScreen(next);
    if (next !== AppState.PLAYING && next !== AppState.RESULT && state.panels) {
      state.panels.close();
    }
    if (next !== AppState.PLAYING && next !== AppState.RESULT) {
      closeCheat();
      if (playerUi) {
        playerUi.setCraftOpen(false);
        playerUi.setSettingOpen(false);
        playerUi.setEndOpen(false);
      }
      state.fHoldAcc = 0;
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

    if (mainMenuUi && mainMenuUi.isReady()) {
      state.host.gameMode = mainMenuUi.gameModeFromPick();
      if (selMode) selMode.value = state.host.gameMode;
    } else if (selMode) {
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
    // Fresh room chat — never carry lines from prior match.
    if (playerUi && playerUi.clearChat) playerUi.clearChat();

    const worldPick = mainMenuUi ? mainMenuUi.getWorldPick() : 'flat';
    const playerNames = ((state.host && state.host.players) || []).map(
      (p) => (p && p.name) || 'Player'
    );

    const MATCH_LOADING_MIN_MS = 1100;
    const loadUiStartedAt = performance.now();

    try {
      if (loadingBootPanel) loadingBootPanel.hidden = true;

      // 1) HTML match loading first — must see rhythm, not gameplay.
      screens.menu.hidden = true;
      screens.menu.classList.remove('is-active');
      screens.playing.hidden = true;
      screens.playing.classList.remove('is-active');
      screens.loading.hidden = false;
      screens.loading.classList.add('is-active');

      loadingUi.showGameplay();
      loadingUi.setMeta({
        worldPick,
        playerNames,
        progress: 0,
      });
      await new Promise((r) => requestAnimationFrame(() => r()));

      // 2) Warm playing under overlay (paused — no startLoop yet).
      screens.playing.hidden = false;
      screens.playing.classList.add('is-active', 'is-warming');

      const match = await runLoading((pct, label) => {
        reportLoadProgress(pct * 0.9, label);
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
          menuSkinId: mainMenuUi ? mainMenuUi.getSkinId() : 'Skin_Default_1',
        });
      }
      state.match = match;
      state.camera.zoom = getMatchZoom(match);
      state.autosaveAcc = 0;

      reportLoadProgress(92, 'First world paint…');
      await warmFirstWorldPaint(match);

      reportLoadProgress(96, 'Player UI…');
      if (playerUi && playerUiMount) {
        if (!playerUi.isReady()) await playerUi.mountSvg();
        else playerUi.layout();
        resizeCanvas();
        if (playerUi.isReady()) playerUi.layout();
        refreshHotbar();
      } else {
        throw new Error('PlayerUI mount missing — SVG HUD required');
      }

      reportLoadProgress(100, 'Ready');
      const held = performance.now() - loadUiStartedAt;
      if (held < MATCH_LOADING_MIN_MS) {
        await new Promise((r) => setTimeout(r, MATCH_LOADING_MIN_MS - held));
      }

      // Host must click/tap (or press a key) to enter — do not auto-start.
      await loadingUi.waitForHostConfirm();

      loadingUi.hide();
      setAppState(AppState.PLAYING);
      screens.playing.classList.remove('is-warming');
      syncDebugHudButtons(match);
      startLoop();
    } catch (err) {
      console.error(err);
      screens.playing.classList.remove('is-warming');
      showFailPanel(
        `Load failed: ${err && err.message ? err.message : err} — back to menu`
      );
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

  const hub = {
    state,
    canvas,
    get playerUi() {
      return playerUi;
    },
    tryAutosave,
    dispatchUi,
    isCheatOpen,
    closeCheat,
    ensureFreeFlyCamera,
    refreshHotbar,
    syncDebugHudButtons,
    stopLoop,
    setAppState,
  };
  const matchEnd = createMatchEnd(hub);
  hub.endMatch = matchEnd.endMatch;
  const { forceResult } = matchEnd;
  const playSession = createPlaySession(hub);

  function startLoop() {
    stopLoop();
    state.lastTs = 0;
    const tick = (ts) => {
      if (state.appState !== AppState.PLAYING) {
        stopAmbience();
        return;
      }
      if (!state.lastTs) state.lastTs = ts;
      const dt = Math.min(0.05, (ts - state.lastTs) / 1000);
      state.lastTs = ts;
      try {
        playSession.updatePlaying(dt);
      } catch (err) {
        console.error('[TheDDOS] updatePlaying failed (loop kept alive)', err);
      }
      try {
        drawPlaying({ dt });
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

  function refreshHotbar() {
    const match = state.match;
    if (!match) return;
    const inv = match.inventory || match.hotbar || [];
    if (playerUi && playerUi.isReady()) {
      playerUi.syncInventoryBar(
        inv,
        match.activeHotbar || 0,
        getEquippedBackpackTier(match)
      );
    }
  }

  function syncDebugHudButtons(match) {
    if (btnFreeCraft) {
      btnFreeCraft.classList.toggle('is-on', !!(match && match.freeCraft));
      btnFreeCraft.textContent = match && match.freeCraft ? 'FreeCraft ON' : 'FreeCraft';
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

      const baseZoom = getMatchZoom(match);
      const nightMul = getNightCameraZoomMul(match.nightBlend || 0);
      state.camera.zoom = baseZoom * nightMul;
      if (!Number.isFinite(state.camera.zoom) || state.camera.zoom <= 0) {
        state.camera.zoom = 1;
      }

      if (match.cameraFreeFly || match.playerDead) {
        ensureFreeFlyCamera(match, cssW, cssH);
        panCamera(state.camera, 0, 0, match.world.worldW, match.world.worldH, cssW, cssH);
      } else {
        const player = getPlayerUnit(match);
        const anchorX = player
          ? player.x
          : match.base
            ? match.base.x + match.base.w / 2
            : match.world.worldW / 2;
        const anchorY = player
          ? player.y
          : match.base
            ? match.base.y + match.base.h / 2
            : match.world.worldH / 2;
        if (match.cameraSnapPending && player) {
          state.camera.lookX = anchorX;
          state.camera.lookY = anchorY;
          snapCameraTo(
            state.camera,
            anchorX,
            anchorY,
            match.world.worldW,
            match.world.worldH,
            cssW,
            cssH
          );
          match.cameraSnapPending = false;
          match._freeFlyBooted = false;
        } else {
          const dt = opts.dt > 0 ? opts.dt : 0;
          easeLookToward(
            state.camera,
            anchorX,
            anchorY,
            state.mouseScreenX || 0,
            state.mouseScreenY || 0,
            cssW,
            cssH,
            dt,
            GAME_PACK.cameraLeadFrac,
            GAME_PACK.cameraLeadTweenSec
          );
          followPoint(
            state.camera,
            state.camera.lookX,
            state.camera.lookY,
            match.world.worldW,
            match.world.worldH,
            cssW,
            cssH
          );
        }
      }

      if (!Number.isFinite(state.camera.x)) state.camera.x = 0;
      if (!Number.isFinite(state.camera.y)) state.camera.y = 0;

      renderWorld(ctx, match.world, state.camera, match, dpr, cssW, cssH);
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
        saveFileStatus.textContent = 'Loaded — starting…';
      }
      // Load File path: import then enter match from snapshot.
      if (mainMenuUi && mainMenuUi.getWorldPick() === 'loadFile') {
        startMatch({ restore: true });
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
      const typed =
        (mainMenuUi && mainMenuUi.getJoinText()) ||
        (menuJoinInput && menuJoinInput.value) ||
        '';
      const name = mainMenuUi ? mainMenuUi.getPlayerName() : 'Guest';
      const res = tryJoinRoom(state.host, typed, name);
      if (joinStubEl) {
        joinStubEl.dataset.locked = '1';
        joinStubEl.textContent = res.message;
      }
      if (mainMenuUi) mainMenuUi.syncRoster();
      refreshLobbyUi();
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

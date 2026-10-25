/**
 * App composer. Screen, drag, save, cheat, and the paint loop live in js/app/*.
 * This file builds the hub and wires intents. Match rules stay in sim.
 */
import {
  AppState,
  FEATURE_SNAPSHOT,
  GameMode,
  PATH_SIZE,
} from './config.js';
import { createCamera } from './view/camera.js';
import {
  createHostSession,
  hostKickPlayer,
  hostSetLocalName,
  tryJoinRoom,
} from './session/host.js';
import { createMatchEnd } from './app/matchEnd.js';
import { createPlaySession } from './app/playSession.js';
import { createHotbarDrag } from './app/hotbarDrag.js';
import { createSaveFlow } from './app/saveFlow.js';
import { createCheatView } from './app/cheatView.js';
import { createScreen } from './app/screen.js';
import { createPlayLoop } from './app/playLoop.js';
import { createInput } from './player/input.js';
import { runBootPreload } from './session/boot.js';
import { runLoading } from './session/loading.js';
import { createLoadingUi } from './session/loadingUi.js';
import { createMainMenuUi } from './mainMenuUi.js';
import { createPlayerUiGamePlay } from './playerUiGamePlay.js';
import { injectMenuSkinPreviews, isUnitVisualReady } from './view/unitVisual.js';
import {
  clearLocalSnapshot,
  hasLocalSnapshot,
  loadLocalSnapshotRaw,
  sanitizeLocalSnapshot,
} from './session/memento.js';
import { createPanels } from './ui/panels.js';
import {
  getGenReceiveState,
  initMatchGameplay,
  restoreMatchFromSnapshot,
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
    /** E / btn_interactive → INTERACT applied next tick. */
    pendingInteract: false,
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
      const playerUi = hub.playerUi;
      if (playerUi && playerUi.isChatOpen && playerUi.isChatOpen()) {
        playerUi.closeChat();
      }
    },
  });

  /** @type {ReturnType<typeof createMainMenuUi>|null} */
  let mainMenuUi = null;
  /** @type {ReturnType<typeof createPlayerUiGamePlay>|null} */
  let playerUi = null;
  let loadingUi = null;

  const hub = {
    state,
    canvas,
    ctx,
    dom,
    get playerUi() {
      return playerUi;
    },
    get mainMenuUi() {
      return mainMenuUi;
    },
    get loadingUi() {
      return loadingUi;
    },
    queueFactoryTake(slotIndex, role) {
      const match = state.match;
      const blockId =
        playerUi && playerUi.getUpgradeBlockId ? playerUi.getUpgradeBlockId() : null;
      if (!match || blockId == null) return;
      const slot = slotIndex == null ? match.activeHotbar || 0 : slotIndex;
      state.pendingTake = {
        kind: 'factory',
        blockId,
        slotIndex: slot,
        role: role || 'take',
      };
    },
  };

  loadingUi = createLoadingUi({
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

  const hotbar = createHotbarDrag(hub);
  const saveFlow = createSaveFlow(hub);
  const cheat = createCheatView(hub);
  const playLoop = createPlayLoop(hub);
  const screen = createScreen(hub);
  Object.assign(hub, hotbar, saveFlow, cheat, playLoop, screen);

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
        if (state.panels && state.panels.isReceiveOpen()) state.panels.close();
        else state.pendingInteract = true;
        break;
      case 'castFist':
        state.pendingFistCast = true;
        break;
      case 'castHeal':
        state.pendingHealCast = true;
        break;
      case 'settingOpen':
        if (state.panels && state.panels.isOpen()) state.panels.close();
        hub.closeCheat();
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
        hub.enterMenu();
        break;
      case 'audioToggle':
        break;
      case 'genTake':
        handleSvgGenTake(payload);
        break;
      case 'factoryTake':
        hub.queueFactoryTake();
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
  hub.dispatchUi = dispatchUi;

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
        hub.refreshLobbyUi();
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
        hub.refreshLobbyUi();
      },
      onLoadFile: () => {
        if (!FEATURE_SNAPSHOT) return;
        if (saveFileInput) saveFileInput.click();
      },
      onAudioToggle: () => {},
      onLink: () => {},
    });
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
        hub.refreshHotbar();
      },
      onHotbarDown: (i, e) => hub.beginHotbarDrag(i, e),
      onHotbarDouble: (i) => hub.queueFactoryTake(i, 'deposit'),
      onFactoryTake: (role) => {
        if (role) hub.queueFactoryTake(undefined, role);
        else dispatchUi('factoryTake');
      },
      onUpgradeClose: () => {
        if (state.panels) state.panels.close();
      },
      onSettingOpen: () => dispatchUi('settingOpen'),
      onSettingClose: () => dispatchUi('settingClose'),
      onLeaveGame: () => dispatchUi('leaveGame'),
      onAudioToggle: () => dispatchUi('audioToggle'),
      onInteractive: () => dispatchUi('interact'),
      onGenTake: (resId) => dispatchUi('genTake', resId),
      onGenClose: () => dispatchUi('genClose'),
      onCastFist: () => dispatchUi('castFist'),
      onCastSkill: (skillId) => {
        if (skillId === 'FIST') dispatchUi('castFist');
      },
      onChatOpen: (open) => {
        if (state.input && state.input.setChatMode) {
          state.input.setChatMode(!!open);
        }
      },
      onChatSend: (text) => {
        if (text === '-FreeAll' && state.match) {
          state.match.freeCraft = true;
          hub.syncDebugHudButtons(state.match);
        }
      },
    });
    if (state.input && state.input.setStickSource) {
      state.input.setStickSource(() => (playerUi ? playerUi.getStickPose() : null));
    }
  }

  function handleSvgGenTake(resId) {
    const match = state.match;
    if (!match || !state.panels) return;
    const receiveCtx = state.panels.getReceiveCtx && state.panels.getReceiveCtx();
    if (!receiveCtx) return;
    if (receiveCtx.type === 'receive-gen') {
      const st = getGenReceiveState(match, receiveCtx.blockId);
      if (!st || st.itemId !== resId) return;
      state.pendingTake = { kind: 'gen', blockId: receiveCtx.blockId };
    } else if (receiveCtx.type === 'receive-base') {
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
        setGenOpen: (on, genCtx) => playerUi && playerUi.setGenOpen(on, genCtx),
        isGenOpen: () => !!(playerUi && playerUi.isGenOpen && playerUi.isGenOpen()),
        setUpgradeOpen: (on, upCtx) => playerUi && playerUi.setUpgradeOpen(on, upCtx),
        syncCraftSlots: (recipes, idx) =>
          playerUi && playerUi.syncCraftSlots(recipes, idx),
        syncCatalogVisual: (cat) =>
          playerUi && playerUi.syncCatalogVisual && playerUi.syncCatalogVisual(cat),
        syncGenPanel: (info) =>
          playerUi && playerUi.syncGenPanel && playerUi.syncGenPanel(info),
      },
      onOpen: () => {
        hub.closeCheat();
        if (playerUi) playerUi.setSettingOpen(false);
        state.input.setUiBlocked(true);
      },
      onClose: () => {
        if (playerUi && !playerUi.isSettingOpen()) {
          state.input.setUiBlocked(false);
        }
      },
      onInventoryChanged: () => {
        hub.refreshHotbar();
      },
      onTakeGen: (blockId) => {
        state.pendingTake = { kind: 'gen', blockId };
      },
      onTakeBase: (itemId) => {
        state.pendingTake = { kind: 'base', itemId };
      },
    }
  );

  const matchEnd = createMatchEnd(hub);
  hub.endMatch = matchEnd.endMatch;
  const { forceResult } = matchEnd;
  const playSession = createPlaySession(hub);
  hub.updatePlaying = playSession.updatePlaying;

  async function boot() {
    if (state.bootReady) {
      hub.enterMenu();
      return true;
    }
    if (state.loadingLocked) return false;
    state.loadingLocked = true;
    hub.setMenuInteractable(false);
    hub.setAppState(AppState.BOOT);
    hub.setLoadingTitle('Booting TheDDOS');
    progressFill.style.width = '0%';
    progressLabel.textContent = '0% — Starting…';

    try {
      if (loadingBootPanel) loadingBootPanel.hidden = true;
      loadingUi.showMain();

      const payload = await runBootPreload((pct, label) => {
        hub.reportLoadProgress(pct, label);
      });
      if (!payload || !payload.ready) {
        throw new Error('Boot incomplete');
      }
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
        hub.reportLoadProgress(98, 'Main menu…');
        await mainMenuUi.mountSvg();
      }
      if (mainMenuUi && mainMenuUi.isReady() && isUnitVisualReady()) {
        try {
          await injectMenuSkinPreviews(mainMenuUi.state.svgRoot);
        } catch (_) {
          /* preview optional */
        }
      }
      hub.reportLoadProgress(100, 'Ready');
      loadingUi.hide();
      hub.setMenuInteractable(true);
      hub.enterMenu();
      return true;
    } catch (err) {
      console.error(err);
      hub.showFailPanel(
        (err && err.message ? err.message : 'Boot failed') + ' — reload the page'
      );
      state.bootReady = false;
      hub.setMenuInteractable(false);
      return false;
    } finally {
      state.loadingLocked = false;
    }
  }

  async function startMatch(opts = {}) {
    if (!state.bootReady) return;
    if (state.loadingLocked) return;
    state.loadingLocked = true;
    state.result = null;
    const wantRestore = !!(FEATURE_SNAPSHOT && opts.restore);
    const restoreSnap = wantRestore ? loadLocalSnapshotRaw() : null;

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

    hub.setAppState(AppState.LOADING);
    hub.setLoadingTitle('Loading match');
    progressFill.style.width = '0%';
    progressLabel.textContent = '0% — Starting…';
    if (playerUi && playerUi.clearChat) playerUi.clearChat();

    const worldPick = mainMenuUi ? mainMenuUi.getWorldPick() : 'flat';
    const playerNames = ((state.host && state.host.players) || []).map(
      (p) => (p && p.name) || 'Player'
    );

    const MATCH_LOADING_MIN_MS = 1100;
    const loadUiStartedAt = performance.now();

    try {
      if (loadingBootPanel) loadingBootPanel.hidden = true;

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

      screens.playing.hidden = false;
      screens.playing.classList.add('is-active', 'is-warming');

      const match = await runLoading((pct, label) => {
        hub.reportLoadProgress(pct * 0.9, label);
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
      state.camera.zoom = hub.getMatchZoom(match);
      state.autosaveAcc = 0;

      hub.reportLoadProgress(92, 'First world paint…');
      await hub.warmFirstWorldPaint(match);

      hub.reportLoadProgress(96, 'Player UI…');
      if (playerUi && playerUiMount) {
        if (!playerUi.isReady()) await playerUi.mountSvg();
        else playerUi.layout();
        hub.resizeCanvas();
        if (playerUi.isReady()) playerUi.layout();
        hub.refreshHotbar();
      } else {
        throw new Error('PlayerUI mount missing — SVG HUD required');
      }

      hub.reportLoadProgress(100, 'Ready');
      const held = performance.now() - loadUiStartedAt;
      if (held < MATCH_LOADING_MIN_MS) {
        await new Promise((r) => setTimeout(r, MATCH_LOADING_MIN_MS - held));
      }

      await loadingUi.waitForHostConfirm();

      loadingUi.hide();
      hub.setAppState(AppState.PLAYING);
      screens.playing.classList.remove('is-warming');
      hub.syncDebugHudButtons(match);
      hub.startLoop();
    } catch (err) {
      console.error(err);
      screens.playing.classList.remove('is-warming');
      hub.showFailPanel(
        `Load failed: ${err && err.message ? err.message : err} — back to menu`
      );
      await new Promise((r) => setTimeout(r, 1200));
      hub.enterMenu();
    } finally {
      state.loadingLocked = false;
    }
  }
  hub.startMatch = startMatch;

  btnStart.addEventListener('click', () => {
    startMatch({ restore: false });
  });
  if (btnRestore) {
    btnRestore.addEventListener('click', () => {
      if (!FEATURE_SNAPSHOT || !hasLocalSnapshot()) {
        hub.refreshLobbyUi();
        return;
      }
      startMatch({ restore: true });
    });
  }
  if (btnClearSnap) {
    btnClearSnap.addEventListener('click', () => {
      if (!FEATURE_SNAPSHOT) return;
      clearLocalSnapshot();
      hub.refreshLobbyUi();
    });
  }
  if (btnForceWin) btnForceWin.addEventListener('click', () => forceResult('win'));
  if (btnForceLose) btnForceLose.addEventListener('click', () => forceResult('lose'));
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
      hub.refreshLobbyUi();
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

  saveFlow.bind();
  cheat.bind();
  playLoop.bind();

  hub.setMenuInteractable(false);
  hub.setAppState(AppState.BOOT);
  hub.setLoadingTitle('Booting TheDDOS');

  return {
    state,
    boot,
    startMatch,
    forceResult,
    enterMenu: hub.enterMenu,
    PATH_SIZE,
  };
}

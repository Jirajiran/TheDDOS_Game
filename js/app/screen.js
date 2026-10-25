/**
 * Menu, loading chrome, and app-state screen switches.
 * Does not decide match rules.
 */
import { AppState, FEATURE_SNAPSHOT } from '../config.js';
import { stopAmbience } from '../audio/sfx.js';
import { generateRoomCode, hostSetLocalName } from '../session/host.js';
import { hasLocalSnapshot, loadLocalSnapshotRaw } from '../session/memento.js';
import { resetPools } from '../world/pools.js';

export function createScreen(hub) {
  const { state } = hub;

  function showFailPanel(message) {
    const { loadingBootPanel, loadingMain } = hub.dom;
    const loadingUi = hub.loadingUi;
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
    const { progressFill, progressLabel } = hub.dom;
    const loadingUi = hub.loadingUi;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressLabel) {
      progressLabel.textContent = `${Math.round(pct)}% — ${label}`;
    }
    if (loadingUi) loadingUi.setProgress(pct);
  }

  function setLoadingTitle(text) {
    const { loadingTitle } = hub.dom;
    if (loadingTitle) loadingTitle.textContent = text;
  }

  function setMenuInteractable(enabled) {
    const {
      btnStart,
      btnRestore,
      btnClearSnap,
      selMode,
      saveFileInput,
      menuNameInput,
      menuRoomInput,
      menuJoinInput,
      mainMenuMount,
    } = hub.dom;
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
    const { screens } = hub.dom;
    const showMenu = appState === AppState.MENU;
    const showLoading =
      appState === AppState.BOOT || appState === AppState.LOADING;
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
      hub.closeCheat();
      const playerUi = hub.playerUi;
      if (playerUi) {
        playerUi.setCraftOpen(false);
        playerUi.setSettingOpen(false);
        playerUi.setEndOpen(false);
      }
      state.fHoldAcc = 0;
    }
    hub.setPlayTrayLock(next === AppState.PLAYING);
    if (prev === AppState.PLAYING && next !== AppState.PLAYING) {
      hub.releasePlayFullscreen();
    }
  }

  function refreshLobbyUi() {
    const { roomCodeEl, selMode, joinStubEl, btnJoin, btnRestore, btnClearSnap, btnManualSave, snapStatus } =
      hub.dom;
    const mainMenuUi = hub.mainMenuUi;
    if (roomCodeEl) roomCodeEl.textContent = state.host.roomCode;
    if (selMode) selMode.value = state.host.gameMode;
    if (joinStubEl && state.host.joinStubMessage) {
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

  function enterMenu() {
    stopAmbience();
    hub.stopLoop();
    if (state.match && state.match.pools) resetPools(state.match.pools);
    state.match = null;
    state.result = null;
    state.autosaveAcc = 0;
    const playerUi = hub.playerUi;
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
    const mainMenuUi = hub.mainMenuUi;
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
    const { joinStubEl } = hub.dom;
    if (joinStubEl) {
      delete joinStubEl.dataset.locked;
      joinStubEl.textContent = state.host.joinStubMessage;
    }
    refreshLobbyUi();
    setMenuInteractable(state.bootReady);
    setAppState(AppState.MENU);
    if (mainMenuUi && mainMenuUi.isReady()) {
      requestAnimationFrame(() => mainMenuUi.playEnterTween());
    }
  }

  return {
    showFailPanel,
    reportLoadProgress,
    setLoadingTitle,
    setMenuInteractable,
    showScreen,
    setAppState,
    refreshLobbyUi,
    enterMenu,
  };
}

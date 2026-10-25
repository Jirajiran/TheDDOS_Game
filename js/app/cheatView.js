/**
 * Debug cheat panel: open/close, zoom, and the free-fly camera after death.
 */
import { GAME_PACK } from '../config.js';
import { clampZoom, snapCameraTo } from '../view/camera.js';

export function createCheatView(hub) {
  const { state } = hub;

  function isCheatOpen() {
    const { cheatPanel } = hub.dom;
    return !!(cheatPanel && !cheatPanel.hidden);
  }

  function getMatchZoom(match) {
    const pack = GAME_PACK;
    const z =
      match && typeof match.cameraZoom === 'number'
        ? match.cameraZoom
        : pack.cameraFollowZoom;
    return clampZoom(z, pack.cameraZoomMin, pack.cameraZoomMax);
  }

  function syncCheatZoomUi(match) {
    const { cheatZoomRange, cheatZoomValue } = hub.dom;
    const z = getMatchZoom(match);
    if (cheatZoomRange) cheatZoomRange.value = String(z);
    if (cheatZoomValue) cheatZoomValue.textContent = z.toFixed(1);
  }

  function syncDebugHudButtons(match) {
    const { btnFreeCraft, btnCheat } = hub.dom;
    if (btnFreeCraft) {
      btnFreeCraft.classList.toggle('is-on', !!(match && match.freeCraft));
      btnFreeCraft.textContent = match && match.freeCraft ? 'FreeCraft ON' : 'FreeCraft';
    }
    if (btnCheat) {
      btnCheat.classList.toggle('is-on', isCheatOpen());
    }
    syncCheatZoomUi(match);
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

  function nudgeZoom(dir) {
    const pack = GAME_PACK;
    const cur = getMatchZoom(state.match);
    setMatchZoom(cur + dir * pack.cameraZoomStep);
  }

  function openCheat() {
    const { cheatPanel, btnCheat } = hub.dom;
    if (!cheatPanel) return;
    if (state.panels) state.panels.close();
    cheatPanel.hidden = false;
    cheatPanel.classList.add('is-open');
    if (state.input) state.input.setUiBlocked(true);
    syncCheatZoomUi(state.match);
    if (btnCheat) btnCheat.classList.add('is-on');
  }

  function closeCheat() {
    const { cheatPanel, btnCheat } = hub.dom;
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

  function ensureFreeFlyCamera(match, cssW, cssH) {
    if (!match.cameraFreeFly) return;
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

  function bind() {
    const { btnCheat, cheatClose, btnFreeCraft, cheatZoomIn, cheatZoomOut, cheatZoomRange } =
      hub.dom;
    if (btnCheat) btnCheat.addEventListener('click', () => toggleCheat());
    if (cheatClose) cheatClose.addEventListener('click', () => closeCheat());
    if (btnFreeCraft) {
      btnFreeCraft.addEventListener('click', () => {
        if (!state.match) return;
        state.match.freeCraft = !state.match.freeCraft;
        syncDebugHudButtons(state.match);
      });
    }
    if (cheatZoomIn) cheatZoomIn.addEventListener('click', () => nudgeZoom(1));
    if (cheatZoomOut) cheatZoomOut.addEventListener('click', () => nudgeZoom(-1));
    if (cheatZoomRange) {
      cheatZoomRange.addEventListener('input', () => {
        setMatchZoom(Number(cheatZoomRange.value));
      });
      cheatZoomRange.addEventListener(
        'wheel',
        (e) => {
          e.preventDefault();
          nudgeZoom(e.deltaY < 0 ? 1 : -1);
        },
        { passive: false }
      );
    }
  }

  return {
    isCheatOpen,
    openCheat,
    closeCheat,
    toggleCheat,
    getMatchZoom,
    ensureFreeFlyCamera,
    syncDebugHudButtons,
    bind,
  };
}

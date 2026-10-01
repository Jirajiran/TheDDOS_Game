import {
  makeAimAction,
  makeFireAction,
  makeHarvestAction,
  makeInteractAction,
  makeMoveAction,
  makePlaceAction,
  makeReloadAction,
  makeSelectHotbarAction,
} from './actions.js';
import { GAME_PACK } from './config.js';
import {
  getActiveSlot,
  isPlaceableSlot,
  isToolSlot,
  isWeaponSlot,
} from './inventory.js';

/**
 * Local human input → Action objects each frame.
 * WASD · AIM · FIRE/PLACE/HARVEST LMB · R reload · E interact/toggle panel · F craft toggle · 1-0 hotbar
 * When uiBlocked (panel open), suppress gameplay actions but still allow F/E/Esc toggle.
 * Hotbar drag sets actionBusy — suppress fire/place/harvest while held.
 */
export function createInput(canvas) {
  const keys = Object.create(null);
  let mouseScreenX = 0;
  let mouseScreenY = 0;
  let fireHeld = false;
  let firePressed = false;
  let interactPressed = false;
  let craftTogglePressed = false;
  let reloadPressed = false;
  let meleeVolumeTogglePressed = false;
  let wheelDelta = 0;
  const digitPress = [];
  let uiBlocked = false;
  let actionBusy = false;
  let escapePressed = false;

  function setUiBlocked(blocked) {
    uiBlocked = !!blocked;
    if (uiBlocked) {
      fireHeld = false;
      firePressed = false;
      reloadPressed = false;
      wheelDelta = 0;
      digitPress.length = 0;
      // Keep interactPressed / craftTogglePressed so E/F can close panels.
    }
  }

  function setActionBusy(busy) {
    actionBusy = !!busy;
    if (actionBusy) {
      fireHeld = false;
      firePressed = false;
    }
  }

  function onKeyDown(e) {
    if (e.code === 'Escape') {
      escapePressed = true;
      if (uiBlocked) e.preventDefault();
      return;
    }
    // Panel toggles work even while UI blocks gameplay.
    if (e.code === 'KeyF') {
      craftTogglePressed = true;
      e.preventDefault();
      return;
    }
    if (e.code === 'KeyV') {
      meleeVolumeTogglePressed = true;
      e.preventDefault();
      return;
    }
    if (e.code === 'KeyE') {
      interactPressed = true;
      if (uiBlocked) return;
    }
    if (uiBlocked) {
      keys[e.code] = true;
      return;
    }
    keys[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      firePressed = true;
      fireHeld = true;
    }
    if (e.code === 'KeyR') reloadPressed = true;
    const digit = digitFromCode(e.code);
    if (digit !== -1) digitPress.push(digit);
  }

  function onKeyUp(e) {
    keys[e.code] = false;
    if (e.code === 'Space') fireHeld = false;
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseScreenX = e.clientX - rect.left;
    mouseScreenY = e.clientY - rect.top;
  }

  function onMouseDown(e) {
    if (uiBlocked || actionBusy) return;
    if (e.button === 0) {
      firePressed = true;
      fireHeld = true;
    }
  }

  function onMouseUp(e) {
    if (e.button === 0) fireHeld = false;
  }

  function onWheel(e) {
    if (uiBlocked) return;
    e.preventDefault();
    wheelDelta += e.deltaY;
  }

  function onBlur() {
    for (const k of Object.keys(keys)) keys[k] = false;
    fireHeld = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  function moveAxis() {
    let dx = 0;
    let dy = 0;
    if (keys.KeyW || keys.ArrowUp) dy -= 1;
    if (keys.KeyS || keys.ArrowDown) dy += 1;
    if (keys.KeyA || keys.ArrowLeft) dx -= 1;
    if (keys.KeyD || keys.ArrowRight) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }
    return { dx, dy };
  }

  function poll(playerUnitId, camera, _viewW, _viewH, activeHotbar, inventory) {
    const escaped = escapePressed;
    escapePressed = false;
    const craftToggle = craftTogglePressed;
    craftTogglePressed = false;
    const meleeVolToggle = meleeVolumeTogglePressed;
    meleeVolumeTogglePressed = false;

    if (uiBlocked) {
      // Crafting state: MOVE only — no fire, hotbar swap, interact, place.
      const { dx, dy } = moveAxis();
      const actions = [];
      if (dx !== 0 || dy !== 0) {
        actions.push(makeMoveAction(playerUnitId, dx, dy));
      }
      const interactToggle = interactPressed;
      interactPressed = false;
      firePressed = false;
      reloadPressed = false;
      wheelDelta = 0;
      digitPress.length = 0;
      const zoom = camera.zoom > 0 ? camera.zoom : 1;
      return {
        actions,
        mouseWorld: {
          x: camera.x + mouseScreenX / zoom,
          y: camera.y + mouseScreenY / zoom,
        },
        mouseScreenX,
        mouseScreenY,
        escapePressed: escaped,
        craftTogglePressed: craftToggle,
        interactTogglePressed: interactToggle,
        meleeVolumeTogglePressed: meleeVolToggle,
        moveDx: dx,
        moveDy: dy,
        uiBlocked: true,
        actionBusy,
        craftingState: true,
      };
    }

  const actions = [];
  const { dx, dy } = moveAxis();

  // Hotbar select first in the list (sim also applies SELECT in pass-1).
  let hotbarDelta = 0;
  if (wheelDelta !== 0) {
    hotbarDelta = wheelDelta > 0 ? 1 : -1;
    wheelDelta = 0;
  }
  while (digitPress.length) {
    const digit = digitPress.shift();
    if (digit >= 0 && digit < GAME_PACK.hotbarSlots) {
      actions.push(makeSelectHotbarAction(playerUnitId, digit));
    }
  }
  let effectiveHotbar = activeHotbar;
  if (hotbarDelta !== 0) {
    const slots = GAME_PACK.hotbarSlots;
    effectiveHotbar = (activeHotbar + hotbarDelta + slots * 8) % slots;
    actions.push(makeSelectHotbarAction(playerUnitId, effectiveHotbar));
  }
  // Also honor digit selects in effectiveHotbar for this frame's place/fire.
  for (let i = actions.length - 1; i >= 0; i--) {
    if (actions[i].type === 'SELECT_HOTBAR') {
      effectiveHotbar = actions[i].slot;
      break;
    }
  }

  actions.push(makeMoveAction(playerUnitId, dx, dy));

  const zoom = camera.zoom > 0 ? camera.zoom : 1;
  const worldX = camera.x + mouseScreenX / zoom;
  const worldY = camera.y + mouseScreenY / zoom;
  const mouseWorld = { x: worldX, y: worldY };

  actions.push(makeAimAction(playerUnitId, 0));

  const slot = inventory ? getActiveSlot(inventory, effectiveHotbar) : null;

  if (!actionBusy) {
    if (isPlaceableSlot(slot)) {
      if (firePressed) {
        actions.push(makePlaceAction(playerUnitId, worldX, worldY));
      }
    } else if (isToolSlot(slot)) {
      if (firePressed) {
        actions.push(makeHarvestAction(playerUnitId, worldX, worldY));
      }
    } else if (isWeaponSlot(slot)) {
      if (firePressed || fireHeld) {
        actions.push(makeFireAction(playerUnitId));
      }
    }
  }
  firePressed = false;

  if (reloadPressed) {
    actions.push(makeReloadAction(playerUnitId));
    reloadPressed = false;
  }
  if (interactPressed) {
    actions.push(makeInteractAction(playerUnitId));
    interactPressed = false;
  }

  return {
    actions,
    mouseWorld,
    mouseScreenX,
    mouseScreenY,
    escapePressed: escaped,
    craftTogglePressed: craftToggle,
    interactTogglePressed: false,
    meleeVolumeTogglePressed: meleeVolToggle,
    moveDx: dx,
    moveDy: dy,
    uiBlocked: false,
    actionBusy,
  };
}

  function destroy() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('wheel', onWheel);
  }

  return { poll, destroy, keys, setUiBlocked, setActionBusy };
}

function digitFromCode(code) {
  if (code.startsWith('Digit')) {
    const n = Number(code.slice(5));
    // 1-9 → slots 0-8 · 0 → slot 9
    if (n >= 1 && n <= 9) return n - 1;
    if (n === 0) return 9;
  }
  if (code.startsWith('Numpad')) {
    const n = Number(code.slice(6));
    if (n >= 1 && n <= 9) return n - 1;
    if (n === 0) return 9;
  }
  return -1;
}

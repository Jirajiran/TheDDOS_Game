import {
  makeAimAction,
  makeFireAction,
  makeHarvestAction,
  makeMoveAction,
  makePlaceAction,
  makeCancelReloadAction,
  makeReloadAction,
  makeSelectHotbarAction,
} from './actions.js';
import { GAME_PACK, L3_SIZE } from './config.js';
import {
  getActiveSlot,
  isArmorSlot,
  isPlaceableSlot,
  isToolSlot,
  isWeaponSlot,
} from './inventory.js';

/**
 * Local human input → Action objects each frame.
 * WASD · AIM · FIRE/PLACE/HARVEST LMB · R reload · RMB cancel reload · Q Fist · E interact · F craft · 1-0 hotbar
 * When uiBlocked (panel open), suppress gameplay actions but still allow F/E/Esc toggle.
 * Hotbar drag sets actionBusy — suppress fire/place/harvest while held.
 * Chat mode: keys type into input; canvas mousedown dismisses chat then fires (enemy interrupt).
 * @param {HTMLCanvasElement} canvas
 * @param {{ onChatPointerDismiss?: () => void }} [hooks]
 */
export function createInput(canvas, hooks = {}) {
  const keys = Object.create(null);
  let mouseScreenX = 0;
  let mouseScreenY = 0;
  let fireHeld = false;
  let firePressed = false;
  let interactPressed = false;
  let craftTogglePressed = false;
  let reloadPressed = false;
  let cancelReloadPressed = false;
  let fistPressed = false;
  /** Skill slot 2 (SELF_HEAL) — KeyC (E is interact). */
  let healSkillPressed = false;
  let meleeVolumeTogglePressed = false;
  let chatTogglePressed = false;
  let wheelDelta = 0;
  const digitPress = [];
  let uiBlocked = false;
  let actionBusy = false;
  let escapePressed = false;
  let chatMode = false;
  let stickSource = null;
  let anchorX = 0;
  let anchorY = 0;

  function stickPose() {
    return stickSource ? stickSource() : null;
  }

  function setUiBlocked(blocked) {
    uiBlocked = !!blocked;
    if (uiBlocked) {
      fireHeld = false;
      firePressed = false;
      reloadPressed = false;
      cancelReloadPressed = false;
      fistPressed = false;
      healSkillPressed = false;
      wheelDelta = 0;
      digitPress.length = 0;
      // Keep interactPressed / craftTogglePressed so E/F can close panels.
    }
  }

  function setChatMode(on) {
    chatMode = !!on;
    if (chatMode) {
      fireHeld = false;
      firePressed = false;
      reloadPressed = false;
      cancelReloadPressed = false;
      fistPressed = false;
      healSkillPressed = false;
      wheelDelta = 0;
      digitPress.length = 0;
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
      if (uiBlocked || chatMode) e.preventDefault();
      return;
    }
    // Enter: chat open/send (app handles); ignore gameplay while chatMode
    if (e.code === 'Enter') {
      if (!chatMode) {
        chatTogglePressed = true;
        e.preventDefault();
      }
      return;
    }
    if (chatMode) {
      // Typing — do not bind WASD/fire; let input element receive keys.
      return;
    }
    // Panel toggles work even while UI blocks gameplay.
    if (e.code === 'KeyF') {
      craftTogglePressed = true;
      keys[e.code] = true;
      e.preventDefault();
      return;
    }
    // KeyV MeleeVol debug removed from normal play.
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
    if (e.code === 'KeyQ') {
      fistPressed = true;
      e.preventDefault();
    }
    if (e.code === 'KeyC') {
      healSkillPressed = true;
      e.preventDefault();
    }
    const digit = digitFromCode(e.code);
    if (digit !== -1) digitPress.push(digit);
  }

  function onKeyUp(e) {
    keys[e.code] = false;
    if (e.code === 'Space') fireHeld = false;
  }

  function onMouseMove(e) {
    const stick = stickPose();
    if (stick && stick.shown) return;
    const rect = canvas.getBoundingClientRect();
    mouseScreenX = e.clientX - rect.left;
    mouseScreenY = e.clientY - rect.top;
  }

  function onMouseDown(e) {
    const stick = stickPose();
    if (stick && stick.shown) return;
    if (e.button === 2) {
      if (!uiBlocked && !actionBusy && !chatMode) cancelReloadPressed = true;
      return;
    }
    if (e.button !== 0) return;
    // Typing in chat + enemy: click world cancels chat and uses this click to fire.
    if (chatMode) {
      if (typeof hooks.onChatPointerDismiss === 'function') {
        hooks.onChatPointerDismiss();
      }
      firePressed = true;
      fireHeld = true;
      return;
    }
    if (uiBlocked || actionBusy) return;
    firePressed = true;
    fireHeld = true;
  }

  function onMouseUp(e) {
    if (e.button === 0) fireHeld = false;
  }

  function onWheel(e) {
    if (uiBlocked) return;
    e.preventDefault();
    wheelDelta += e.deltaY;
  }

  function onContextMenu(e) {
    e.preventDefault();
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
  canvas.addEventListener('contextmenu', onContextMenu);
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

  function applyStickLook(viewW, viewH) {
    const stick = stickPose();
    if (!stick || !stick.shown) return stick;
    const lead = GAME_PACK.cameraLeadFrac > 0 ? GAME_PACK.cameraLeadFrac : 0;
    if (stick.aimHeld && stick.aimAmount > 0) {
      mouseScreenX = viewW * 0.5 + stick.aimX * stick.aimAmount * (viewW * 0.5) * lead;
      mouseScreenY = viewH * 0.5 + stick.aimY * stick.aimAmount * (viewH * 0.5) * lead;
    } else {
      mouseScreenX = viewW * 0.5;
      mouseScreenY = viewH * 0.5;
    }
    return stick;
  }

  function currentMove(stick) {
    if (stick && stick.shown) {
      return { dx: stick.moveX || 0, dy: stick.moveY || 0 };
    }
    return moveAxis();
  }

  function stickPlaceWorld(stick) {
    const maxR = (GAME_PACK.placeMaxCells > 0 ? GAME_PACK.placeMaxCells : 3) * L3_SIZE;
    const useRelease = !!stick.placeRelease;
    const amount = useRelease ? stick.placeAmount : stick.aimAmount;
    const px = useRelease ? stick.placeX : stick.aimX;
    const py = useRelease ? stick.placeY : stick.aimY;
    return {
      x: anchorX + px * amount * maxR,
      y: anchorY + py * amount * maxR,
    };
  }

  function poll(playerUnitId, camera, _viewW, _viewH, activeHotbar, inventory) {
    const stick = applyStickLook(_viewW, _viewH);
    const escaped = escapePressed;
    escapePressed = false;
    const craftToggle = craftTogglePressed;
    craftTogglePressed = false;
    const meleeVolToggle = meleeVolumeTogglePressed;
    meleeVolumeTogglePressed = false;
    const chatToggle = chatTogglePressed;
    chatTogglePressed = false;

    if (chatMode) {
      interactPressed = false;
      firePressed = false;
      reloadPressed = false;
      cancelReloadPressed = false;
      fistPressed = false;
      healSkillPressed = false;
      wheelDelta = 0;
      digitPress.length = 0;
      if (stick) {
        stick.placeRelease = false;
        stick.reload = false;
        stick.atRim = false;
      }
      const zoom = camera.zoom > 0 ? camera.zoom : 1;
      return {
        actions: [],
        mouseWorld: {
          x: camera.x + mouseScreenX / zoom,
          y: camera.y + mouseScreenY / zoom,
        },
        mouseScreenX,
        mouseScreenY,
        escapePressed: escaped,
        craftTogglePressed: false,
        chatTogglePressed: chatToggle,
        interactTogglePressed: false,
        fistTogglePressed: false,
        healSkillTogglePressed: false,
        meleeVolumeTogglePressed: false,
        moveDx: 0,
        moveDy: 0,
        uiBlocked: true,
        actionBusy,
        craftingState: false,
        chatMode: true,
      };
    }

    if (uiBlocked) {
      // Panel open: MOVE + AIM (mouse facing). No fire / hotbar / place.
      // Gen must keep mouse aim — AIM after MOVE so facing is not WASD-only.
      const { dx, dy } = currentMove(stick);
      const actions = [];
      if (dx !== 0 || dy !== 0) {
        actions.push(makeMoveAction(playerUnitId, dx, dy));
      }
      const aim = makeAimAction(
        playerUnitId,
        stick && stick.aimHeld ? Math.atan2(stick.aimY, stick.aimX) : 0
      );
      if (stick && stick.aimHeld && stick.aimAmount > 0) aim.stickAim = true;
      actions.push(aim);
      const interactToggle = interactPressed;
      interactPressed = false;
      firePressed = false;
      reloadPressed = false;
      cancelReloadPressed = false;
      fistPressed = false;
      healSkillPressed = false;
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
        chatTogglePressed: chatToggle,
        interactTogglePressed: interactToggle,
        fistTogglePressed: false,
        healSkillTogglePressed: false,
        meleeVolumeTogglePressed: meleeVolToggle,
        moveDx: dx,
        moveDy: dy,
        uiBlocked: true,
        actionBusy,
        craftingState: true,
      };
    }

  const actions = [];
  const { dx, dy } = currentMove(stick);

  // Hotbar select first in the list (sim also applies SELECT in pass-1).
  let hotbarDelta = 0;
  if (wheelDelta !== 0) {
    hotbarDelta = wheelDelta > 0 ? 1 : -1;
    wheelDelta = 0;
  }
  while (digitPress.length) {
    const digit = digitPress.shift();
    const slotCount =
      (inventory && inventory.length) ||
      GAME_PACK.hotbarBaseSlots ||
      GAME_PACK.hotbarSlots ||
      6;
    if (digit >= 0 && digit < slotCount) {
      actions.push(makeSelectHotbarAction(playerUnitId, digit));
    }
  }
  let effectiveHotbar = activeHotbar;
  if (hotbarDelta !== 0 && inventory && inventory.length) {
    // Wheel: step ±1 across all hotbar slots (delay while holding weapon is sim-side)
    const n = inventory.length;
    const next = (activeHotbar + hotbarDelta + n * 8) % n;
    effectiveHotbar = next;
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
  let worldX = camera.x + mouseScreenX / zoom;
  let worldY = camera.y + mouseScreenY / zoom;
  if (stick && stick.shown && (stick.aimHeld || stick.placeRelease)) {
    const placed = stickPlaceWorld(stick);
    worldX = placed.x;
    worldY = placed.y;
  }
  const mouseWorld = { x: worldX, y: worldY };

  const aim = makeAimAction(
    playerUnitId,
    stick && stick.aimHeld ? Math.atan2(stick.aimY, stick.aimX) : 0
  );
  if (stick && stick.aimHeld && stick.aimAmount > 0) aim.stickAim = true;
  actions.push(aim);

  const slot = inventory ? getActiveSlot(inventory, effectiveHotbar) : null;

  if (stick && stick.shown) {
    fireHeld = false;
    firePressed = false;
    if (stick.atRim && !isPlaceableSlot(slot)) {
      fireHeld = true;
      if (!stick.rimLatched) {
        firePressed = true;
        stick.rimLatched = true;
      }
    } else {
      stick.rimLatched = false;
    }
    if (stick.reload) {
      reloadPressed = true;
      stick.reload = false;
    }
  }

  if (!actionBusy) {
    if (isPlaceableSlot(slot)) {
      if ((stick && stick.placeRelease) || (!stick || !stick.shown) && firePressed) {
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
    } else if (isArmorSlot(slot)) {
      if (firePressed) {
        actions.push(makeSelectHotbarAction(playerUnitId, effectiveHotbar));
      }
    }
  }
  firePressed = false;
  if (stick && stick.placeRelease) stick.placeRelease = false;

  // Fist / Heal / Interact: UI intent flags only — app dispatchUi (same pipe as SVG buttons).
  const fistToggle = fistPressed;
  fistPressed = false;
  const healToggle = healSkillPressed;
  healSkillPressed = false;
  const interactToggle = interactPressed;
  interactPressed = false;

  if (reloadPressed) {
    actions.push(makeReloadAction(playerUnitId));
    reloadPressed = false;
  }
  if (cancelReloadPressed) {
    actions.push(makeCancelReloadAction(playerUnitId));
    cancelReloadPressed = false;
  }

  return {
    actions,
    mouseWorld,
    mouseScreenX,
    mouseScreenY,
    escapePressed: escaped,
    craftTogglePressed: craftToggle,
    chatTogglePressed: chatToggle,
    interactTogglePressed: interactToggle,
    fistTogglePressed: fistToggle,
    healSkillTogglePressed: healToggle,
    meleeVolumeTogglePressed: meleeVolToggle,
    moveDx: dx,
    moveDy: dy,
    uiBlocked: false,
    actionBusy,
    chatMode: false,
  };
}

  function setStickSource(fn) {
    stickSource = typeof fn === 'function' ? fn : null;
  }

  function setAimAnchor(x, y) {
    anchorX = x;
    anchorY = y;
  }

  function requestReload() {
    reloadPressed = true;
  }

  function destroy() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('wheel', onWheel);
  }

  return { poll, destroy, keys, setUiBlocked, setActionBusy, setChatMode, setStickSource, setAimAnchor, requestReload };
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

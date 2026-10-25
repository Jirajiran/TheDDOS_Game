/**
 * Hotbar pointer drag: select, swap, throw, or drop a weapon on the factory slot.
 * Rules stay in sim. This head only reads the pointer and sends the slot change.
 */
import { getItemDef } from '../config.js';
import { moveOrSwapInventorySlots } from '../player/inventory.js';
import { getWeaponIconHref } from '../view/weaponBtnArt.js';
import {
  getEquippedBackpackTier,
  throwHotbarSlot,
} from '../sim.js';

const HOTBAR_DRAG_PX = 8;

export function createHotbarDrag(hub) {
  const { state, canvas } = hub;
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

  function refreshHotbar() {
    const match = state.match;
    if (!match) return;
    const inv = match.inventory || match.hotbar || [];
    const playerUi = hub.playerUi;
    if (playerUi && playerUi.isReady()) {
      playerUi.syncInventoryBar(
        inv,
        match.activeHotbar || 0,
        getEquippedBackpackTier(match)
      );
    }
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

  function queueFactoryTake(slotIndex, role) {
    if (hub.queueFactoryTake) hub.queueFactoryTake(slotIndex, role);
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

    const playerUi = hub.playerUi;
    const dropRole =
      playerUi && playerUi.hitUpgradeSlot && playerUi.hitUpgradeSlot(clientX, clientY);
    if (dropRole) {
      queueFactoryTake(from, dropRole);
      refreshHotbar();
      return;
    }

    const to = slotIndexFromPoint(clientX, clientY);
    if (to >= 0 && to !== from && match.inventory && to < match.inventory.length) {
      moveOrSwapInventorySlots(match.inventory, from, to, match);
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

  return {
    refreshHotbar,
    beginHotbarDrag,
  };
}

/**
 * Craft + Gen/Base receive — SVG PlayerUI only (no HTML panel markup).
 */
import {
  CRAFT_CATEGORIES,
  CRAFT_RECIPES,
  getCraftRecipe,
  getBackpackTier,
  getItemDef,
  isBackpackItemId,
} from '../config.js';
import { countItem, tryCraftBuy } from '../player/inventory.js';
import {
  equipCraftedBackpack,
  getBaseReceiveState,
  getGenReceiveState,
  tryEquipBackpackFromSlot,
} from '../sim.js';

export function createPanels(_dom, hooks) {
  let openKind = null; // 'craft' | 'receive-gen' | 'receive-base' | null
  let craftCategory = 'Gun';
  /** -1 = no slot selected yet */
  let craftSelectedIndex = -1;
  let receiveCtx = null; // { type, blockId }
  let lastStatus = '';
  let statusTimer = 0;

  function uiReady() {
    return !!(hooks.playerUi && hooks.playerUi.isReady && hooks.playerUi.isReady());
  }

  function syncSvgCraft() {
    if (!uiReady()) return;
    const match = hooks.getMatch();
    const inv = match && match.inventory;
    const recipes = CRAFT_RECIPES.filter((r) => r.category === craftCategory).map(
      (r) => {
        const def = getItemDef(r.itemId);
        const costBits = [];
        if (r.cost) {
          for (const id of Object.keys(r.cost)) {
            const have = inv ? countItem(inv, id) : 0;
            costBits.push(`${have}/${r.cost[id]} ${id}`);
          }
        }
        return {
          ...r,
          _label: def ? def.label : r.itemId,
          _costText: costBits.join(' · ') || '—',
          _status: lastStatus,
        };
      }
    );
    if (craftSelectedIndex >= recipes.length) craftSelectedIndex = -1;
    hooks.playerUi.syncCraftSlots(recipes, craftSelectedIndex);
    if (hooks.playerUi.syncCatalogVisual) {
      hooks.playerUi.syncCatalogVisual(craftCategory);
    }
  }

  function isOpen() {
    return openKind != null;
  }

  function setStatus(msg, _ok) {
    lastStatus = msg || '';
    statusTimer = 0;
    syncSvgCraft();
  }

  function close() {
    openKind = null;
    receiveCtx = null;
    lastStatus = '';
    if (uiReady()) {
      hooks.playerUi.setCraftOpen(false);
      if (hooks.playerUi.setGenOpen) hooks.playerUi.setGenOpen(false);
      if (hooks.playerUi.setUpgradeOpen) hooks.playerUi.setUpgradeOpen(false);
    }
    if (hooks.onClose) hooks.onClose();
  }

  function openCraft() {
    if (!uiReady()) return;
    openKind = 'craft';
    receiveCtx = null;
    if (hooks.playerUi.setGenOpen) hooks.playerUi.setGenOpen(false);
    hooks.playerUi.setCraftOpen(true);
    syncSvgCraft();
    if (hooks.onOpen) hooks.onOpen('craft');
  }

  function setCraftCategory(cat) {
    if (!CRAFT_CATEGORIES.includes(cat)) return;
    craftCategory = cat;
    craftSelectedIndex = -1;
    lastStatus = '';
    syncSvgCraft();
  }

  function selectCraftSlot(index) {
    lastStatus = '';
    craftSelectedIndex = Math.max(0, index | 0);
    syncSvgCraft();
  }

  function confirmSelectedCraft() {
    if (craftSelectedIndex < 0) {
      setStatus('Select a recipe', false);
      return;
    }
    const recipes = CRAFT_RECIPES.filter((r) => r.category === craftCategory);
    const recipe = recipes[craftSelectedIndex];
    if (!recipe) {
      setStatus('Select a recipe', false);
      return;
    }
    buyRecipe(recipe);
  }

  function buyRecipe(recipe) {
    const m = hooks.getMatch();
    if (!m || !m.inventory) return;
    const def = getItemDef(recipe.itemId);
    const full = getCraftRecipe(recipe.id) || recipe;
    const mFree = !!m.freeCraft;
    const res = tryCraftBuy(m.inventory, full, {
      freeCraft: mFree,
      equippedBackpackId: m.equippedBackpackId,
    });
    if (res.ok && res.equipNow) {
      const worn = equipCraftedBackpack(m, recipe.itemId);
      if (!worn.ok) {
        setStatus(worn.reason || 'Cannot equip backpack', false);
        return;
      }
      setStatus(`Equipped ${def ? def.label : recipe.itemId}`, true);
      if (hooks.onInventoryChanged) hooks.onInventoryChanged();
      return;
    }
    if (res.ok) {
      if (isBackpackItemId(recipe.itemId) && getBackpackTier(recipe.itemId) >= getBackpackTier(m.equippedBackpackId)) {
        for (let i = 0; i < m.inventory.length; i++) {
          if (m.inventory[i] && m.inventory[i].itemId === recipe.itemId) {
            tryEquipBackpackFromSlot(m, i);
            break;
          }
        }
      }
      setStatus(
        mFree
          ? `Bought ${def ? def.label : recipe.itemId} (free)`
          : `Bought ${def ? def.label : recipe.itemId}`,
        true
      );
      if (hooks.onInventoryChanged) hooks.onInventoryChanged();
      syncSvgCraft();
    } else {
      setStatus(res.reason || 'Cannot buy', false);
    }
  }

  function buildSvgGenInfo(match, pending) {
    if (!match || !pending) return null;
    const counts = { WOOD: 0, STONE: 0, IRON: 0 };
    if (pending.type === 'receive-gen') {
      const st = getGenReceiveState(match, pending.blockId);
      if (!st) return null;
      if (st.itemId && counts[st.itemId] != null) counts[st.itemId] = st.stock || 0;
      else if (st.itemId) counts[st.itemId] = st.stock || 0;
      return {
        label: st.label,
        hp: st.hp,
        maxHp: st.maxHp,
        counts,
        kind: 'gen',
        blockId: pending.blockId,
      };
    }
    const st = getBaseReceiveState(match);
    if (!st) return null;
    const bags = st.bags || [];
    for (let i = 0; i < bags.length; i++) {
      const id = bags[i].itemId;
      if (counts[id] != null) counts[id] = bags[i].count || 0;
    }
    return {
      label: st.label || 'Base',
      hp: st.hp,
      maxHp: st.maxHp,
      counts,
      kind: 'base',
      blockId: pending.blockId,
    };
  }

  function openReceive(pending) {
    if (!pending || !uiReady()) return;
    openKind = pending.type;
    receiveCtx = { type: pending.type, blockId: pending.blockId };
    hooks.playerUi.setCraftOpen(false);
    const match = hooks.getMatch();
    const info = buildSvgGenInfo(match, pending);
    hooks.playerUi.setGenOpen(true, pending);
    if (hooks.playerUi.syncGenPanel) hooks.playerUi.syncGenPanel(info);
    if (hooks.onOpen) hooks.onOpen(pending.type);
  }

  function refreshSvgGenIfOpen() {
    if (!uiReady() || !hooks.playerUi.isGenOpen || !hooks.playerUi.isGenOpen()) {
      return;
    }
    if (!receiveCtx) return;
    const match = hooks.getMatch();
    const info = buildSvgGenInfo(match, receiveCtx);
    if (hooks.playerUi.syncGenPanel) hooks.playerUi.syncGenPanel(info);
  }

  function tick(_dt) {
    const match = hooks.getMatch && hooks.getMatch();
    if (match && match.lastTakeResult) {
      const r = match.lastTakeResult;
      match.lastTakeResult = null;
      if (r.taken > 0) {
        if (hooks.onInventoryChanged) hooks.onInventoryChanged();
      }
      refreshSvgGenIfOpen();
    }
    if (openKind === 'receive-gen' || openKind === 'receive-base') {
      refreshSvgGenIfOpen();
    }
  }

  function consumePendingUi(match) {
    if (!match || !match.pendingUi) return;
    const pending = match.pendingUi;
    match.pendingUi = null;
    if (pending.type === 'upgrade') {
      if (!uiReady() || !hooks.playerUi.setUpgradeOpen) return;
      openKind = 'upgrade';
      receiveCtx = { type: 'upgrade', blockId: pending.blockId };
      hooks.playerUi.setCraftOpen(false);
      hooks.playerUi.setUpgradeOpen(true, pending);
      if (hooks.onOpen) hooks.onOpen('upgrade');
      return;
    }
    openReceive(pending);
  }

  function refreshCraftIfOpen() {
    if (openKind === 'craft') syncSvgCraft();
  }

  function toggleCraft() {
    if (!hooks.canOpen || !hooks.canOpen()) return;
    if (openKind === 'craft') close();
    else openCraft();
  }

  function isReceiveOpen() {
    return (
      openKind === 'receive-gen' ||
      openKind === 'receive-base' ||
      openKind === 'upgrade'
    );
  }

  function getOpenKind() {
    return openKind;
  }

  close();

  return {
    isOpen,
    isReceiveOpen,
    getOpenKind,
    openCraft,
    toggleCraft,
    openReceive,
    close,
    tick,
    consumePendingUi,
    refreshCraftIfOpen,
    setCraftCategory,
    selectCraftSlot,
    confirmSelectedCraft,
    refreshSvgGenIfOpen,
    buildSvgGenInfo,
    getReceiveCtx: () => receiveCtx,
  };
}

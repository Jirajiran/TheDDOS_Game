/**
 * Craft + Gen/Base receive panels (plain HTML overlay).
 * Opens during PLAYING; Esc / close button dismisses.
 */
import {
  CRAFT_CATEGORIES,
  CRAFT_RECIPES,
  getCraftRecipe,
  getItemDef,
} from './config.js';
import { countItem, tryCraftBuy } from './inventory.js';
import {
  getBaseReceiveState,
  getGenReceiveState,
  takeBaseResources,
  takeGenResources,
} from './sim.js';

export function createPanels(dom, hooks) {
  const {
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
    btnCraftHud,
  } = dom;

  let openKind = null; // 'craft' | 'receive-gen' | 'receive-base' | null
  let craftCategory = CRAFT_CATEGORIES[0];
  let receiveCtx = null; // { type, blockId }
  let statusTimer = 0;

  function isOpen() {
    return openKind != null;
  }

  function setStatus(el, msg, ok) {
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-ok', !!ok);
    el.classList.toggle('is-err', !!msg && !ok);
    statusTimer = 2.5;
  }

  function close() {
    openKind = null;
    receiveCtx = null;
    if (craftPanel) {
      craftPanel.hidden = true;
      craftPanel.classList.remove('is-open');
    }
    if (receivePanel) {
      receivePanel.hidden = true;
      receivePanel.classList.remove('is-open');
    }
    if (hooks.onClose) hooks.onClose();
  }

  function openCraft() {
    openKind = 'craft';
    receiveCtx = null;
    if (receivePanel) {
      receivePanel.hidden = true;
      receivePanel.classList.remove('is-open');
    }
    if (craftPanel) {
      craftPanel.hidden = false;
      craftPanel.classList.add('is-open');
    }
    renderCraftTabs();
    renderCraftList();
    if (hooks.onOpen) hooks.onOpen('craft');
  }

  function openReceive(pending) {
    if (!pending) return;
    openKind = pending.type;
    receiveCtx = { type: pending.type, blockId: pending.blockId };
    if (craftPanel) {
      craftPanel.hidden = true;
      craftPanel.classList.remove('is-open');
    }
    if (receivePanel) {
      receivePanel.hidden = false;
      receivePanel.classList.add('is-open');
    }
    renderReceive();
    if (hooks.onOpen) hooks.onOpen(pending.type);
  }

  function formatCost(cost) {
    if (!cost) return '—';
    const parts = [];
    for (const id of Object.keys(cost)) {
      const def = getItemDef(id);
      parts.push(`${cost[id]} ${def ? def.label : id}`);
    }
    return parts.join(' + ');
  }

  function renderCraftTabs() {
    if (!craftTabs) return;
    craftTabs.innerHTML = '';
    for (let i = 0; i < CRAFT_CATEGORIES.length; i++) {
      const cat = CRAFT_CATEGORIES[i];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'panel-tab' + (cat === craftCategory ? ' is-active' : '');
      btn.textContent = cat;
      btn.dataset.category = cat;
      btn.addEventListener('click', () => {
        craftCategory = cat;
        renderCraftTabs();
        renderCraftList();
      });
      craftTabs.appendChild(btn);
    }
  }

  function renderCraftList() {
    if (!craftList) return;
    const match = hooks.getMatch();
    const inv = match && match.inventory;
    craftList.innerHTML = '';
    const recipes = CRAFT_RECIPES.filter((r) => r.category === craftCategory);
    if (!recipes.length) {
      const empty = document.createElement('p');
      empty.className = 'panel-empty';
      empty.textContent = 'No recipes in this category.';
      craftList.appendChild(empty);
      return;
    }
    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      const def = getItemDef(recipe.itemId);
      const row = document.createElement('div');
      row.className = 'panel-row';
      const title = document.createElement('div');
      title.className = 'panel-row-main';
      const name = document.createElement('strong');
      name.textContent = def ? def.label : recipe.itemId;
      const meta = document.createElement('span');
      meta.className = 'panel-row-meta';
      meta.textContent = `×${recipe.resultCount || 1} · ${formatCost(recipe.cost)}`;
      title.appendChild(name);
      title.appendChild(meta);

      const bagHint = document.createElement('span');
      bagHint.className = 'panel-row-bag';
      if (inv && recipe.cost) {
        const bits = [];
        for (const id of Object.keys(recipe.cost)) {
          bits.push(`${countItem(inv, id)}/${recipe.cost[id]}`);
        }
        bagHint.textContent = bits.join(' · ');
      }

      const buy = document.createElement('button');
      buy.type = 'button';
      buy.className = 'btn btn-ghost panel-buy';
      buy.textContent = 'Buy';
      buy.addEventListener('click', () => {
        const m = hooks.getMatch();
        if (!m || !m.inventory) return;
        const full = getCraftRecipe(recipe.id) || recipe;
        const mFree = !!(m.freeCraft);
        const res = tryCraftBuy(m.inventory, full, { freeCraft: mFree });
        if (res.ok) {
          setStatus(
            craftStatus,
            mFree
              ? `Bought ${def ? def.label : recipe.itemId} (free)`
              : `Bought ${def ? def.label : recipe.itemId}`,
            true
          );
          if (hooks.onInventoryChanged) hooks.onInventoryChanged();
          renderCraftList();
        } else {
          setStatus(craftStatus, res.reason || 'Cannot buy', false);
        }
      });

      row.appendChild(title);
      row.appendChild(bagHint);
      row.appendChild(buy);
      craftList.appendChild(row);
    }
  }

  function renderReceive() {
    if (!receiveBody || !receiveCtx) return;
    const match = hooks.getMatch();
    receiveBody.innerHTML = '';
    if (!match) {
      receiveBody.textContent = 'No match.';
      return;
    }

    if (receiveCtx.type === 'receive-gen') {
      const st = getGenReceiveState(match, receiveCtx.blockId);
      if (!st) {
        receiveTitle.textContent = 'Generator';
        receiveBody.textContent = 'Generator gone.';
        return;
      }
      receiveTitle.textContent = st.label;
      const hp = document.createElement('p');
      hp.className = 'panel-stat';
      hp.textContent = `HP ${Math.ceil(st.hp)}/${st.maxHp}`;
      const stock = document.createElement('p');
      stock.className = 'panel-stat';
      stock.textContent = `Stock: ${st.stock}/${st.stockMax} ${st.itemId || ''}`;
      const timer = document.createElement('p');
      timer.className = 'panel-muted';
      timer.textContent = st.stock >= st.stockMax
        ? 'Storage full'
        : `Next +${st.amountPerTick} in ${Math.ceil(st.timerSec)}s`;
      const takeBtn = document.createElement('button');
      takeBtn.type = 'button';
      takeBtn.className = 'btn';
      takeBtn.textContent = st.stock > 0 ? `Take all (${st.stock})` : 'Empty';
      takeBtn.disabled = st.stock <= 0;
      takeBtn.addEventListener('click', () => {
        const m = hooks.getMatch();
        if (!m) return;
        const res = takeGenResources(m, receiveCtx.blockId);
        if (res.taken > 0) {
          setStatus(receiveStatus, `Took ${res.taken} ${res.itemId}`, true);
          if (hooks.onInventoryChanged) hooks.onInventoryChanged();
        } else {
          setStatus(receiveStatus, res.reason || 'Nothing to take', false);
        }
        renderReceive();
      });
      receiveBody.appendChild(hp);
      receiveBody.appendChild(stock);
      receiveBody.appendChild(timer);
      receiveBody.appendChild(takeBtn);
      return;
    }

    if (receiveCtx.type === 'receive-base') {
      const st = getBaseReceiveState(match);
      if (!st) {
        receiveTitle.textContent = 'Base';
        receiveBody.textContent = 'Base not available.';
        return;
      }
      receiveTitle.textContent = st.label;
      const hp = document.createElement('p');
      hp.className = 'panel-stat';
      hp.textContent = `HP ${Math.ceil(st.hp)}/${st.maxHp}`;
      receiveBody.appendChild(hp);

      if (!st.hasStorageApi) {
        const todo = document.createElement('p');
        todo.className = 'panel-muted';
        todo.textContent =
          st.note ||
          'TODO: base inherent storage/gen — panel hooks takeBaseResources when sim adds base.storage';
        const placeholder = document.createElement('div');
        placeholder.className = 'panel-row';
        placeholder.innerHTML =
          '<div class="panel-row-main"><strong>Storage</strong><span class="panel-row-meta">— empty (waiting on sim)</span></div>';
        receiveBody.appendChild(todo);
        receiveBody.appendChild(placeholder);
        return;
      }

      if (!st.bags.length) {
        const empty = document.createElement('p');
        empty.className = 'panel-empty';
        empty.textContent = 'Base storage empty.';
        receiveBody.appendChild(empty);
        return;
      }
      for (let i = 0; i < st.bags.length; i++) {
        const bag = st.bags[i];
        const def = getItemDef(bag.itemId);
        const row = document.createElement('div');
        row.className = 'panel-row';
        const main = document.createElement('div');
        main.className = 'panel-row-main';
        main.innerHTML = `<strong>${def ? def.label : bag.itemId}</strong><span class="panel-row-meta">×${bag.count}</span>`;
        const takeBtn = document.createElement('button');
        takeBtn.type = 'button';
        takeBtn.className = 'btn btn-ghost panel-buy';
        takeBtn.textContent = bag.count > 0 ? 'Take' : 'Empty';
        takeBtn.disabled = bag.count <= 0;
        takeBtn.addEventListener('click', () => {
          const m = hooks.getMatch();
          if (!m) return;
          const res = takeBaseResources(m, bag.itemId);
          if (res.taken > 0) {
            setStatus(receiveStatus, `Took ${res.taken} ${res.itemId}`, true);
            if (hooks.onInventoryChanged) hooks.onInventoryChanged();
          } else {
            setStatus(receiveStatus, res.reason || 'Cannot take', false);
          }
          renderReceive();
        });
        row.appendChild(main);
        row.appendChild(takeBtn);
        receiveBody.appendChild(row);
      }
    }
  }

  /** Call each frame while PLAYING when a panel may be open. */
  function tick(dt) {
    if (statusTimer > 0) {
      statusTimer -= dt;
      if (statusTimer <= 0) {
        if (craftStatus) craftStatus.textContent = '';
        if (receiveStatus) receiveStatus.textContent = '';
      }
    }
    if (openKind === 'receive-gen' || openKind === 'receive-base') {
      renderReceive();
    }
  }

  /** Consume match.pendingUi from sim interact. */
  function consumePendingUi(match) {
    if (!match || !match.pendingUi) return;
    const pending = match.pendingUi;
    match.pendingUi = null;
    openReceive(pending);
  }

  function refreshCraftIfOpen() {
    if (openKind === 'craft') renderCraftList();
  }

  if (craftClose) craftClose.addEventListener('click', () => close());
  if (receiveClose) receiveClose.addEventListener('click', () => close());
  function toggleCraft() {
    if (!hooks.canOpen || !hooks.canOpen()) return;
    if (openKind === 'craft') close();
    else openCraft();
  }

  function isReceiveOpen() {
    return openKind === 'receive-gen' || openKind === 'receive-base';
  }

  function getOpenKind() {
    return openKind;
  }

  if (btnCraftHud) {
    btnCraftHud.addEventListener('click', () => toggleCraft());
  }

  // Start hidden
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
  };
}

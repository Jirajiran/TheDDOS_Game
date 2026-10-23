import {
  BTN_SVG_URL,
  SVG_NS,
  RESOURCE_COLORS,
  FIST_ICON_COLOR,
  HEAL_ICON_COLOR,
  SLOT_BODY,
  SLOT_ICON,
  EMPTY_SLOT_PAD,
  CURRENT_SLOT_ICON,
  REQUEST_SLOT_IDS,
  REQUEST_PACK_ORDER,
  LOAD_DAY_X,
  LOAD_DAY_Y,
  LOAD_DAY_W,
  LOAD_DAY_H,
  DAY_CYAN,
  DAY_PURPLE,
  TEXT_COL_MIDDLE,
  TEXT_COL_END,
  TEXT_COL_START,
  CATALOG_TO_CATEGORY,
  CRAFT_SLOT_COUNT,
  HOTBAR_MAIN,
  EFFECT_IDS,
  SKILL_IDS,
} from './constants.js';
import {
  getItemDef,
} from '../../config.js';
import {
  formatClockFromSim,
  getDayBarPhase,
} from '../../view/dayCycle.js';
import {
  getWeaponIconHref,
  getWeaponIconLayout,
} from '../../view/weaponBtnArt.js';

export function installPlayPanels(api) {
  api.firstTspan = function firstTspan(el) {
    return el ? el.querySelector('tspan') : null;
  }
  
  api.allTspans = function allTspans(el) {
    return el ? Array.from(el.querySelectorAll('tspan')) : [];
  }
  
  api.setTspans = function setTspans(el, lines) {
    const spans = api.allTspans(el);
    for (let i = 0; i < spans.length; i++) {
      spans[i].textContent = lines[i] != null ? String(lines[i]) : '';
    }
  }
  
  api.findNumberHost = function findNumberHost(root) {
    if (!root) return null;
    const byId = root.querySelector('[id^="NumberItem"]');
    if (byId) return byId;
    const spans = root.querySelectorAll('tspan');
    for (let i = 0; i < spans.length; i++) {
      const t = (spans[i].textContent || '').trim();
      if (/^N+$/i.test(t) || /^\d+$/.test(t)) {
        return spans[i].closest('[id^="NumberItem"]') || spans[i].closest('g') || spans[i];
      }
    }
    return null;
  }
  
  api.setCountOnHost = function setCountOnHost(host, count, show) {
    if (!host) return;
    api.setVisible(host, !!show);
    if (!show) return;
    const sp = api.firstTspan(host) || host;
    if (sp && sp.textContent !== undefined) {
      sp.textContent = String(Math.max(0, Math.floor(count)));
      if (host.id && String(host.id).indexOf('NumberItem') === 0) {
        api.applyTextColumn(host, 'end');
      }
    }
  }
  
  api.applyTextColumn = function applyTextColumn(el, anchor) {
    if (!el) return;
    const texts = el.querySelectorAll ? el.querySelectorAll('text') : [];
    const list = texts.length ? Array.from(texts) : el.tagName === 'text' ? [el] : [];
    for (let t = 0; t < list.length; t++) {
      list[t].setAttribute('text-anchor', anchor);
    }
    const spans = api.allTspans(el);
    const clip =
      el.querySelector &&
      (el.querySelector('clipPath rect') || el.querySelector('rect'));
    let xMid = null;
    let xEnd = null;
    let xStart = null;
    if (clip) {
      const x = parseFloat(clip.getAttribute('x') || '0');
      const w = parseFloat(clip.getAttribute('width') || '0');
      if (w > 0) {
        xStart = x + 2;
        xMid = x + w / 2;
        xEnd = x + w - 2;
      }
    }
    for (let i = 0; i < spans.length; i++) {
      spans[i].setAttribute('text-anchor', anchor);
      if (anchor === 'end' && xEnd != null) spans[i].setAttribute('x', String(xEnd));
      else if (anchor === 'middle' && xMid != null) {
        spans[i].setAttribute('x', String(xMid));
      } else if (anchor === 'start' && xStart != null) {
        spans[i].setAttribute('x', String(xStart));
      }
    }
  }
  
  api.applyAllTextColumns = function applyAllTextColumns() {
    for (let i = 0; i < TEXT_COL_MIDDLE.length; i++) {
      api.applyTextColumn(api.$(TEXT_COL_MIDDLE[i]), 'middle');
    }
    for (let i = 0; i < TEXT_COL_END.length; i++) {
      api.applyTextColumn(api.$(TEXT_COL_END[i]), 'end');
    }
    for (let i = 0; i < TEXT_COL_START.length; i++) {
      api.applyTextColumn(api.$(TEXT_COL_START[i]), 'start');
    }
    // All NumberItem* hosts under SVG
    if (!api.state.svgRoot) return;
    const nums = api.state.svgRoot.querySelectorAll('[id^="NumberItem"]');
    for (let i = 0; i < nums.length; i++) api.applyTextColumn(nums[i], 'end');
  }
  
  api.stripIds = function stripIds(node) {
    if (!node) return;
    if (node.removeAttribute) node.removeAttribute('id');
    const kids = node.querySelectorAll ? node.querySelectorAll('[id]') : [];
    for (let i = 0; i < kids.length; i++) kids[i].removeAttribute('id');
  }
  
  api.ensureIconOverlay = function ensureIconOverlay(panel, color, show, iconSize, hitPad, imageHref, iconLayout) {
    if (!panel) return;
    const size = iconSize > 0 ? iconSize : SLOT_ICON;
    const half = size / 2;
    let g = panel.querySelector('[data-icon-overlay]');
    if (!g) {
      g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('data-icon-overlay', '1');
      g.setAttribute('pointer-events', 'none');
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('rx', '3');
      rect.setAttribute('stroke', '#101820');
      rect.setAttribute('stroke-width', '1.5');
      g.appendChild(rect);
      const image = document.createElementNS(SVG_NS, 'image');
      image.setAttribute('data-icon-image', '1');
      image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      g.appendChild(image);
      // Under number/mask layers so digits stay readable
      const numHost = api.findNumberHost(panel);
      const numAnc =
        numHost &&
        (numHost.closest('[id^="NumberItem"]') ||
          numHost.closest('g[mask]') ||
          numHost);
      if (numAnc && numAnc.parentNode === panel) {
        panel.insertBefore(g, numAnc);
      } else if (panel.firstChild) {
        panel.insertBefore(g, panel.firstChild);
      } else {
        panel.appendChild(g);
      }
    }
    const rect = g.querySelector('rect');
    let image = g.querySelector('[data-icon-image]');
    if (!image) {
      image = document.createElementNS(SVG_NS, 'image');
      image.setAttribute('data-icon-image', '1');
      image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      g.appendChild(image);
    }
    if (rect) {
      rect.setAttribute('x', String(-half));
      rect.setAttribute('y', String(-half));
      rect.setAttribute('width', String(size));
      rect.setAttribute('height', String(size));
      rect.setAttribute('fill', imageHref ? 'none' : color || '#4a5a6a');
      rect.setAttribute('stroke', imageHref ? 'none' : '#101820');
      rect.setAttribute('pointer-events', imageHref ? 'none' : 'auto');
    }
    if (image) {
      const box = imageHref && iconLayout && iconLayout.w > 0 ? iconLayout : null;
      const iw = box ? box.w : size;
      const ih = box ? box.h : size;
      image.setAttribute('x', String(-iw / 2));
      image.setAttribute('y', String(-ih / 2));
      image.setAttribute('width', String(iw));
      image.setAttribute('height', String(ih));
      if (imageHref) {
        image.setAttribute('href', imageHref);
        image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageHref);
        image.style.display = '';
        image.style.pointerEvents = 'all';
        image.style.cursor = 'pointer';
      } else {
        image.removeAttribute('href');
        image.style.display = 'none';
        image.style.pointerEvents = 'none';
      }
    }
    g.setAttribute('pointer-events', imageHref || hitPad ? 'all' : 'none');
    api.setVisible(g, !!show);
  }
  
  api.ensureSelectFrame = function ensureSelectFrame(panel, selected) {
    if (!panel) return;
    panel.style.outline = 'none';
    let g = panel.querySelector('[data-slot-select]');
    if (!g) {
      g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('data-slot-select', '1');
      g.setAttribute('pointer-events', 'none');
      const rect = document.createElementNS(SVG_NS, 'rect');
      const half = SLOT_BODY / 2;
      rect.setAttribute('x', String(-half));
      rect.setAttribute('y', String(-half));
      rect.setAttribute('width', String(SLOT_BODY));
      rect.setAttribute('height', String(SLOT_BODY));
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', '#ffe08a');
      rect.setAttribute('stroke-width', '3');
      g.appendChild(rect);
      panel.appendChild(g);
    }
    api.setVisible(g, !!selected);
  }
  
  api.ensureDefs = function ensureDefs() {
    let defs = api.state.svgRoot && api.state.svgRoot.querySelector('defs');
    if (!defs && api.state.svgRoot) {
      defs = document.createElementNS(SVG_NS, 'defs');
      api.state.svgRoot.insertBefore(defs, api.state.svgRoot.firstChild);
    }
    return defs;
  }
  
  api.ensureBtnCatalogArt = async function ensureBtnCatalogArt() {
    if (api.state._btnArtReady || !api.state.svgRoot) return;
    api.state._btnArtReady = true;
    try {
      const res = await fetch(`${BTN_SVG_URL}?v=20261021b`);
      if (!res.ok) return;
      const doc = new DOMParser().parseFromString(await res.text(), 'image/svg+xml');
      const defs = api.ensureDefs();
      if (!defs) return;
      const needIds = [
        'Ui_Btn_Color_2_2_Layer0_0_FILL',
        'Ui_Btn_Color_2_2_Layer0_0_1_STROKES',
        'Ui_IconUi_3_Layer1_0_FILL',
      ];
      for (let i = 0; i < needIds.length; i++) {
        const id = needIds[i];
        if (api.$(id)) continue;
        const src = doc.getElementById(id);
        if (!src) continue;
        const clone = src.cloneNode(true);
        clone.setAttribute('id', id);
        defs.appendChild(clone);
      }
      const onPress = doc.getElementById('Btn_Press_onPress');
      if (onPress && !api.state.pressOnTpl) {
        const tpl = onPress.cloneNode(true);
        api.stripIds(tpl);
        tpl.setAttribute('id', 'Tpl_Btn_Press_onPress');
        tpl.setAttribute('data-press-tpl', '1');
        defs.appendChild(tpl);
        api.state.pressOnTpl = tpl;
      }
      const iconClose = doc.getElementById('Icon_Audio_Close');
      if (iconClose) {
        const tpl = iconClose.cloneNode(true);
        api.stripIds(tpl);
        tpl.setAttribute('id', 'Tpl_Icon_Audio_Close');
        defs.appendChild(tpl);
        api.state.iconAudioCloseTpl = tpl;
      }
    } catch (_) {
      /* offline / missing — fallbacks still work */
    }
  }
  
  api.syncCatalogVisual = function syncCatalogVisual(category) {
    api.state.catalogCategory = category || api.state.catalogCategory || 'Gun';
    const ids = Object.keys(CATALOG_TO_CATEGORY);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const el = api.$(id);
      const cat = CATALOG_TO_CATEGORY[id];
      api.setBtnFillSelected(el, cat === api.state.catalogCategory);
    }
  }
  
  api.syncModals = function syncModals() {
    api.setVisible(api.$('Anchor_Center_1'), api.state.craftOpen);
    api.setVisible(api.$('Anchor_Center_2'), api.state.settingOpen);
    api.setVisible(api.$('Anchor_Top_Left_2'), api.state.genOpen);
    api.setVisible(api.$('Anchor_Center_3'), api.state.endOpen);
    api.setVisible(api.$('Panel_objective'), api.state.objectiveOpen);
    api.setVisible(api.$('btn_interactive'), api.state.interactiveVisible);
    // ChatShow always on; InputChat hit zone always visible (click opens). HTML field only when typing.
    api.setVisible(api.$('ChatShow'), true);
    api.setVisible(api.$('InputChat'), true);
    if (api.chatInput) {
      api.chatInput.hidden = !api.state.chatOpen;
      if (api.state.chatOpen) api.chatInput.focus();
    }
  }
  
  api.setCraftOpen = function setCraftOpen(on) {
    api.state.craftOpen = !!on;
    if (api.state.craftOpen) {
      api.state.settingOpen = false;
      api.state.genOpen = false;
    }
    api.syncModals();
  }
  
  api.setSettingOpen = function setSettingOpen(on) {
    api.state.settingOpen = !!on;
    if (api.state.settingOpen) {
      api.state.craftOpen = false;
      api.state.genOpen = false;
    }
    api.syncModals();
  }
  
  api.setGenOpen = function setGenOpen(on, ctx) {
    api.state.genOpen = !!on;
    api.state.genCtx = on ? ctx || api.state.genCtx : null;
    if (api.state.genOpen) {
      api.state.craftOpen = false;
      api.state.settingOpen = false;
    }
    api.syncModals();
  }
  
  api.setEndOpen = function setEndOpen(on, title, payload) {
    api.state.endOpen = !!on;
    if (api.state.endOpen) {
      const ref = api.$('Referee_Text');
      if (ref) {
        api.setTspans(ref, [title || (payload && payload.title) || '']);
        api.applyTextColumn(ref, 'middle');
      }
      const obj = api.$('Objective_Text');
      if (obj) {
        api.setTspans(obj, [(payload && payload.detail) || '']);
        api.applyTextColumn(obj, 'middle');
      }
      const det = api.$('Detail_Text');
      if (det) {
        api.setTspans(det, (payload && payload.lines) || []);
        api.applyTextColumn(det, 'start');
      }
    }
    api.syncModals();
  }
  
  api.setBackpackTier = function setBackpackTier(tier) {
    const t = tier === 1 || tier === 2 || tier === 3 ? tier : 0;
    api.state.backpackTier = t;
    // Skill_Show lives under FL in art — never hide whole anchor for backpack.
    const fl = api.$('Anchor_Left_Bottom_FL');
    if (fl) api.setVisible(fl, true);
    for (let i = 1; i <= 3; i++) api.setVisible(api.$(`BackPack_tyle_${i}`), t === i);
    for (let i = 7; i <= 12; i++) {
      const showBag = t > 0;
      if (!showBag) {
        api.setVisible(api.$(`Panel_item_${i}`), false);
        api.setVisible(api.$(`Panel_item_${i}_FL`), false);
        api.setVisible(api.$(`Panel_item_${i}_FL_FL`), false);
      }
    }
    // Fist skills always on
    api.setVisible(api.$('Skill_Show_1'), true);
    api.ensureIconOverlay(api.$('Skill_Show_1'), FIST_ICON_COLOR, true);
  }
  
  api.setInteractiveVisible = function setInteractiveVisible(on) {
    api.state.interactiveVisible = !!on;
    api.setVisible(api.$('btn_interactive'), api.state.interactiveVisible);
  }
  
  api.syncAudioIcon = function syncAudioIcon() {
    const btn = api.$('Btn_Audio') || api.$('btn_Audio');
    if (!btn) return;
    let iconOn = btn.querySelector('[data-audio-icon="on"]') || api.$('Icon_Audio');
    let iconOff = btn.querySelector('[data-audio-icon="off"]');
    if (iconOn && !iconOn.getAttribute('data-audio-icon')) {
      iconOn.setAttribute('data-audio-icon', 'on');
    }
    if (!iconOff) {
      const tpl = api.state.iconAudioCloseTpl;
      if (tpl) {
        iconOff = tpl.cloneNode(true);
        api.stripIds(iconOff);
        iconOff.setAttribute('data-audio-icon', 'off');
        iconOff.setAttribute('transform', 'matrix( 1, 0, 0, 1, 0,0) ');
        btn.appendChild(iconOff);
      }
    }
    // True = gray + speaker; False = red fill + muted icon (api.state idle, not press)
    const uses = btn.querySelectorAll('use');
    for (let i = 0; i < uses.length; i++) {
      const href =
        uses[i].getAttribute('xlink:href') || uses[i].getAttribute('href') || '';
      if (href.indexOf('Ui_Btn_Color_') >= 0 && href.indexOf('Layer1_0_FILL') >= 0) {
        const target = api.state.audioMuted
          ? 'Ui_Btn_Color_4_Layer1_0_FILL'
          : 'Ui_Btn_Color_0_Layer1_0_FILL';
        const next = `#${target}`;
        uses[i].setAttribute('xlink:href', next);
        uses[i].setAttribute('href', next);
      }
      if (href.indexOf('Ui_Btn_Color_') >= 0 && href.indexOf('Layer0_0_1_STROKES') >= 0) {
        const target = api.state.audioMuted
          ? 'Ui_Btn_Color_4_Layer0_0_1_STROKES'
          : 'Ui_Btn_Color_0_Layer0_0_1_STROKES';
        if (api.$(target)) {
          const next = `#${target}`;
          uses[i].setAttribute('xlink:href', next);
          uses[i].setAttribute('href', next);
        }
      }
    }
    if (iconOn) api.setVisible(iconOn, !api.state.audioMuted);
    if (iconOff) api.setVisible(iconOff, api.state.audioMuted);
    // Mark True/False api.state for DOC contract (btn_Audio_True / False semantics)
    btn.setAttribute(
      'data-audio-state',
      api.state.audioMuted ? 'btn_Audio_False' : 'btn_Audio_True'
    );
  }
  
  api.syncCraftSlots = function syncCraftSlots(recipes, selectedIndex) {
    api.state.craftRecipes = recipes || [];
    if (selectedIndex !== undefined) {
      api.state.selectedCraftIndex =
        selectedIndex == null ? -1 : selectedIndex | 0;
    }
    if (api.state.selectedCraftIndex >= api.state.craftRecipes.length) {
      api.state.selectedCraftIndex = -1;
    }
    for (let s = 1; s <= CRAFT_SLOT_COUNT; s++) {
      const slot = api.$(`Slot_${s}`);
      if (!slot) continue;
      const recipe = api.state.craftRecipes[s - 1];
      const on = !!recipe;
      api.setVisible(slot, on);
      if (!on) {
        api.ensureIconOverlay(slot, null, false);
        api.ensureSelectFrame(slot, false);
        continue;
      }
      const num = api.findNumberHost(slot);
      const count = recipe.resultCount || 1;
      const isWeapon = (recipe.category || '') === 'Gun';
      // Weapon single: hide NN; stacks show digits
      api.setCountOnHost(num, count, !isWeapon && count > 0);
      const def = getItemDef(recipe.itemId);
      api.ensureIconOverlay(
        slot,
        (def && def.color) || '#6a7a8a',
        true,
        SLOT_ICON,
        false,
        getWeaponIconHref(recipe.itemId),
        getWeaponIconLayout(recipe.itemId)
      );
    }
    api.syncCraftSelection();
    api.syncCraftDetail();
    api.syncCatalogVisual(api.state.catalogCategory);
  }
  
  api.syncCraftSelection = function syncCraftSelection() {
    for (let s = 1; s <= CRAFT_SLOT_COUNT; s++) {
      const slot = api.$(`Slot_${s}`);
      if (!slot) continue;
      const sel =
        api.state.selectedCraftIndex >= 0 &&
        s - 1 === api.state.selectedCraftIndex &&
        !!api.state.craftRecipes[s - 1];
      api.ensureSelectFrame(slot, sel);
    }
  }
  
  api.syncIconCurrentSlot = function syncIconCurrentSlot() {
    const el = api.$('Icon_Current_slot');
    if (!el) return;
    const recipe =
      api.state.selectedCraftIndex >= 0
        ? api.state.craftRecipes[api.state.selectedCraftIndex]
        : null;
    if (!recipe) {
      api.setVisible(el, false);
      api.ensureIconOverlay(el, null, false, CURRENT_SLOT_ICON);
      return;
    }
    api.setVisible(el, true);
    const def = getItemDef(recipe.itemId);
    api.ensureIconOverlay(
      el,
      (def && def.color) || '#6a7a8a',
      true,
      CURRENT_SLOT_ICON,
      false,
      getWeaponIconHref(recipe.itemId),
      getWeaponIconLayout(recipe.itemId)
    );
    const num = api.findNumberHost(el);
    const count = recipe.resultCount || 1;
    const isWeapon = (recipe.category || '') === 'Gun';
    api.setCountOnHost(num, count, !isWeapon && count > 1);
  }
  
  api.syncRequestItems = function syncRequestItems(recipe) {
    const cost = (recipe && recipe.cost) || null;
    const active = [];
    if (cost) {
      for (let i = 0; i < REQUEST_PACK_ORDER.length; i++) {
        const id = REQUEST_PACK_ORDER[i];
        const need = cost[id] | 0;
        if (need > 0) active.push({ id, need });
      }
      for (const id of Object.keys(cost)) {
        if (REQUEST_PACK_ORDER.indexOf(id) >= 0) continue;
        const need = cost[id] | 0;
        if (need > 0) active.push({ id, need });
      }
    }
    // Capture baked bases once for pack reposition
    if (!api.state._requestBaseMat) {
      api.state._requestBaseMat = [];
      for (let i = 0; i < REQUEST_SLOT_IDS.length; i++) {
        const el = api.$(REQUEST_SLOT_IDS[i]);
        api.state._requestBaseMat.push(el ? api.parseMatrix(el) : null);
      }
    }
    const bases = api.state._requestBaseMat.filter(Boolean);
    const n = Math.min(active.length, REQUEST_SLOT_IDS.length);
    // Pack into first N slot nodes; shift e from leftmost baked bases
    const start = 0;
    for (let i = 0; i < REQUEST_SLOT_IDS.length; i++) {
      const el = api.$(REQUEST_SLOT_IDS[i]);
      if (!el) continue;
      const base = api.state._requestBaseMat[i];
      if (i < n && active[i] && base) {
        const targetBase = bases[start + i] || base;
        api.setMatrix(el, { ...base, e: targetBase.e, f: targetBase.f });
        api.setVisible(el, true);
        const num = api.findNumberHost(el);
        api.setCountOnHost(num, active[i].need, true);
        api.ensureIconOverlay(
          el,
          RESOURCE_COLORS[active[i].id] || '#888',
          true
        );
      } else {
        if (base) api.setMatrix(el, base);
        api.setVisible(el, false);
        api.ensureIconOverlay(el, null, false);
      }
    }
  }
  
  api.syncCraftDetail = function syncCraftDetail() {
    const recipe =
      api.state.selectedCraftIndex >= 0
        ? api.state.craftRecipes[api.state.selectedCraftIndex]
        : null;
    const nameEl = api.$('Name_Item');
    const detailEl = api.$('Detail_Item');
    if (!recipe) {
      if (nameEl) api.setTspans(nameEl, ['']);
      if (detailEl) api.setTspans(detailEl, ['', '']);
      api.syncRequestItems(null);
      api.syncIconCurrentSlot();
      return;
    }
    if (nameEl) {
      api.setTspans(nameEl, [recipe._label || recipe.itemId || '']);
      api.applyTextColumn(nameEl, 'middle');
    }
    if (detailEl) {
      const lore = recipe._lore || recipe._detail || '';
      const line2 =
        recipe.resultCount && recipe.resultCount > 1
          ? `×${recipe.resultCount}`
          : '';
      api.setTspans(detailEl, [lore, line2]);
      api.applyTextColumn(detailEl, 'middle');
    }
    api.syncRequestItems(recipe);
    api.syncIconCurrentSlot();
  }
  
  api.getSelectedCraftIndex = function getSelectedCraftIndex() {
    return api.state.selectedCraftIndex;
  }
  
  api.syncHud = function syncHud(hud) {
    if (!api.state.ready || !hud) return;
  
    const waveEl = api.$('Number_Wave');
    if (waveEl) {
      const sp = api.firstTspan(waveEl);
      if (sp) {
        sp.textContent = String(hud.waveIndex != null ? hud.waveIndex : 0);
        sp.setAttribute('fill', hud.waveActive ? 'rgb(255, 0, 0)' : '#FFFFFF');
      }
    }
  
    const detail = api.$('ObjectiveDetail');
    if (detail) {
      const hp = Math.ceil(Math.max(0, hud.baseHp || 0));
      const max = Math.ceil(Math.max(0, hud.baseMaxHp || 0));
      const line2 =
        hud.baseAlive === false && hud.baseMaxHp
          ? 'Base destroyed'
          : `Base Hp ${hp}/${max || hp}`;
      api.setTspans(detail, ['Do not lose your', line2]);
    }
  
    const gun = api.$('GunDetail');
    if (gun) {
      api.setTspans(gun, [
        `(${hud.gunName || 'EMPTY'})`,
        hud.ammoLine || 'AMMO : —',
      ]);
    }
  
    api.syncHpFill(hud.playerHp, hud.playerMaxHp, hud.dt || 0.016);
    api.syncDay(hud.simTimeSec || 0, !!hud.enemiesPresent);
    api.syncHotbarSlots(hud.slots || [], hud.activeHotbar || 0);
    if (hud.backpackTier != null) api.setBackpackTier(hud.backpackTier);
    api.syncEffects(hud.effects || []);
    api.syncSkills(hud.skills || []);
    if (hud.interactiveVisible != null) {
      api.setInteractiveVisible(!!hud.interactiveVisible);
    }
    api.applyTextColumn(api.$('Number_Wave'), 'end');
    api.applyTextColumn(api.$('ObjectiveDetail'), 'start');
    api.applyTextColumn(api.$('GunDetail'), 'start');
  }
  
  api.syncHpFill = function syncHpFill(hp, maxHp, dt) {
    const el = api.$('Hp_Fill');
    const bg = api.$('Hp_Bg');
    if (!el) return;
    if (!api.state.hpFillBase) api.state.hpFillBase = api.parseMatrix(el);
    if (bg && !api.state.hpBgBase) api.state.hpBgBase = api.parseMatrix(bg);
    const ratio = maxHp > 0 ? Math.max(0, Math.min(1, (hp || 0) / maxHp)) : 0;
    if (ratio < api.state.hpTargetRatio - 0.001) {
      api.state.hpShakeT = 0.22;
    }
    api.state.hpTargetRatio = ratio;
    // Tween display toward target (right→left via scale a)
    const k = 1 - Math.exp(-12 * (dt || 0.016));
    api.state.hpDisplayRatio += (api.state.hpTargetRatio - api.state.hpDisplayRatio) * k;
    const base = api.state.hpFillBase;
    // Anchor right: shift e as a shrinks so bar empties leftward visually
    const fullA = base.a;
    const a = fullA * api.state.hpDisplayRatio;
    const shrink = fullA - a;
    api.setMatrix(el, { ...base, a, e: base.e + shrink });
  
    if (bg && api.state.hpBgBase) {
      if (api.state.hpShakeT > 0) {
        api.state.hpShakeT -= dt || 0.016;
        const s = Math.sin(api.state.hpShakeT * 60) * 2.5;
        api.setMatrix(bg, {
          ...state.hpBgBase,
          e: api.state.hpBgBase.e + s,
          f: api.state.hpBgBase.f + s * 0.4,
        });
      } else {
        api.setMatrix(bg, api.state.hpBgBase);
      }
    }
  }
  
  api.makeDayBarGroup = function makeDayBarGroup(id, trackColor, fillColor, transform) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('id', id);
    if (transform) g.setAttribute('transform', transform);
    const track = document.createElementNS(SVG_NS, 'rect');
    track.setAttribute('x', String(LOAD_DAY_X));
    track.setAttribute('y', String(LOAD_DAY_Y));
    track.setAttribute('width', String(LOAD_DAY_W));
    track.setAttribute('height', String(LOAD_DAY_H));
    track.setAttribute('fill', trackColor);
    track.setAttribute('data-day-track', '1');
    const fill = document.createElementNS(SVG_NS, 'rect');
    fill.setAttribute('x', String(LOAD_DAY_X));
    fill.setAttribute('y', String(LOAD_DAY_Y));
    fill.setAttribute('width', '0');
    fill.setAttribute('height', String(LOAD_DAY_H));
    fill.setAttribute('fill', fillColor);
    fill.setAttribute('data-day-fill', '1');
    g.appendChild(track);
    g.appendChild(fill);
    return g;
  }
  
  api.ensureDayBars = function ensureDayBars() {
    if (api.state.dayBarsReady) return;
    const load = api.$('Load_Day');
    if (!load || !load.parentNode) return;
    const parent = load.parentNode;
    const xf = load.getAttribute('transform') || 'matrix( 1, 0, 0, 1, 0.1,31.3) ';
    api.setVisible(load, false);
  
    let morning = api.$('Load_Day_Morning');
    let night = api.$('Load_Day_Night');
    if (!morning) {
      morning = api.makeDayBarGroup(
        'Load_Day_Morning',
        DAY_PURPLE,
        DAY_CYAN,
        xf
      );
      parent.insertBefore(morning, load.nextSibling);
    }
    if (!night) {
      night = api.makeDayBarGroup('Load_Day_Night', DAY_CYAN, DAY_PURPLE, xf);
      parent.insertBefore(night, morning.nextSibling);
    }
    api.state.dayBarsReady = true;
  }
  
  api.syncDay = function syncDay(simTimeSec, enemiesPresent) {
    const timeEl = api.$('NumberTime');
    if (timeEl) {
      const sp = api.firstTspan(timeEl);
      if (sp) {
        sp.textContent = formatClockFromSim(simTimeSec);
        sp.setAttribute('fill', enemiesPresent ? 'rgb(255, 0, 0)' : '#FFFFFF');
      }
    }
    api.ensureDayBars();
    const morning = api.$('Load_Day_Morning');
    const night = api.$('Load_Day_Night');
    if (!morning || !night) return;
  
    const { isMorning, progress } = getDayBarPhase(simTimeSec);
    const fillW = Math.max(0, Math.min(1, progress)) * LOAD_DAY_W;
  
    api.setVisible(morning, isMorning);
    api.setVisible(night, !isMorning);
    const active = isMorning ? morning : night;
    const fill = active.querySelector('[data-day-fill]');
    if (fill) fill.setAttribute('width', String(fillW));
  }
  
  api.syncInventoryBar = function syncInventoryBar(slots, activeHotbar, backpackTier) {
    api.syncHotbarSlots(slots || [], activeHotbar || 0);
    if (backpackTier != null) api.setBackpackTier(backpackTier);
  }
  
  api.syncHotbarSlots = function syncHotbarSlots(slots, activeHotbar) {
    for (let i = 0; i < 12; i++) {
      const slot = slots[i];
      const filled = !!(slot && slot.itemId);
      const panels = [];
      // Main hotbar 1–6: always show frames (empty = empty frame)
      if (i < HOTBAR_MAIN) panels.push(api.$(`Panel_item_${i + 1}`));
      if (i >= 6) {
        panels.push(api.$(`Panel_item_${i + 1}`));
        panels.push(api.$(`Panel_item_${i + 1}_FL`));
      }
      for (let p = 0; p < panels.length; p++) {
        const el = panels[p];
        if (!el) continue;
        if (i < HOTBAR_MAIN) {
          api.setVisible(el, true);
        } else {
          // Backpack slots: only when filled (tier gate elsewhere)
          api.setVisible(el, filled);
          if (!filled) {
            api.ensureIconOverlay(el, null, false);
            continue;
          }
        }
        el.style.opacity = '1';
        api.ensureSelectFrame(el, i === activeHotbar);
        const num = api.findNumberHost(el);
        if (!filled) {
          api.setCountOnHost(num, 0, false);
          // Empty main slots keep a faint pad for a reliable click target.
          if (i < HOTBAR_MAIN) {
            api.ensureIconOverlay(el, EMPTY_SLOT_PAD, true, SLOT_ICON, true);
          } else {
            api.ensureIconOverlay(el, null, false);
          }
          continue;
        }
        const kind = slot.kind || '';
        const isWeapon = kind === 'WEAPON';
        const count = slot.count || 0;
        api.setCountOnHost(num, count, !isWeapon && count > 0);
        api.ensureIconOverlay(
          el,
          slot.color || '#6a7a8a',
          true,
          SLOT_ICON,
          false,
          getWeaponIconHref(slot.weaponId || slot.itemId),
          getWeaponIconLayout(slot.weaponId || slot.itemId)
        );
      }
    }
  }
  
  api.syncEffects = function syncEffects(effects) {
    const list = Array.isArray(effects) ? effects.slice(0, 4) : [];
    const n = list.length;
    for (let i = 0; i < EFFECT_IDS.length; i++) {
      const el = api.$(EFFECT_IDS[i]);
      if (!el) continue;
      if (!api.state._effectBase) api.state._effectBase = {};
      if (!api.state._effectBase[EFFECT_IDS[i]]) {
        api.state._effectBase[EFFECT_IDS[i]] = api.parseMatrix(el);
      }
      if (n === 0) {
        api.setVisible(el, false);
        api.ensureIconOverlay(el, null, false);
        continue;
      }
      // Show first n effects; reposition toward center when n=1
      const show = i < n;
      api.setVisible(el, show);
      if (!show) {
        api.ensureIconOverlay(el, null, false);
        continue;
      }
      const base = api.state._effectBase[EFFECT_IDS[i]];
      if (n === 1) {
        api.setMatrix(el, { ...base, e: 0 });
      } else {
        api.setMatrix(el, base);
      }
      const sp = api.firstTspan(el);
      if (sp && list[i]) {
        sp.textContent = String(list[i].label || list[i].id || '').slice(0, 4);
      }
      api.ensureIconOverlay(el, (list[i] && list[i].color) || '#6b9fbf', true);
    }
  }
  
  api.syncSkills = function syncSkills(skills) {
    // skills: [{ id, cooldownSec }] — slot0 FIST · slot1 SELF_HEAL · hide unused
    for (let i = 0; i < SKILL_IDS.length; i++) {
      const el = api.$(SKILL_IDS[i]);
      if (!el) continue;
      const sk = skills[i];
      if (i === 0) {
        api.setVisible(el, true);
        const num = api.findNumberHost(el);
        const cd = sk ? sk.cooldownSec || 0 : 0;
        api.setCountOnHost(num, Math.ceil(cd), cd > 0.05);
        api.ensureIconOverlay(el, FIST_ICON_COLOR, true);
        continue;
      }
      if (sk && (sk.id === 'SELF_HEAL' || i === 1)) {
        api.setVisible(el, true);
        const num = api.findNumberHost(el);
        const cd = sk.cooldownSec || 0;
        api.setCountOnHost(num, Math.ceil(cd), cd > 0.05);
        api.ensureIconOverlay(el, HEAL_ICON_COLOR, true);
        continue;
      }
      if (!sk) {
        api.setVisible(el, false);
        api.ensureIconOverlay(el, null, false);
        continue;
      }
      api.setVisible(el, true);
      const num = api.findNumberHost(el);
      const cd = sk.cooldownSec || 0;
      api.setCountOnHost(num, Math.ceil(cd), cd > 0.05);
      api.ensureIconOverlay(el, '#7a8a9a', true);
    }
  }
  
  api.syncGenPanel = function syncGenPanel(info) {
    if (!info) return;
    const name = api.$('NameGen');
    if (name) {
      api.setTspans(name, [info.label || 'Gen']);
      api.applyTextColumn(name, 'middle');
    }
    const hp = api.$('HpGen');
    if (hp) {
      api.setTspans(hp, [
        `${Math.ceil(info.hp || 0)}/${Math.ceil(info.maxHp || 0)}`,
      ]);
      api.applyTextColumn(hp, 'middle');
    }
    const counts = info.counts || { WOOD: 0, STONE: 0, IRON: 0 };
    const map = [
      ['Slot_gen_Wood', 'WOOD', counts.WOOD || 0],
      ['Slot_gen_Stone', 'STONE', counts.STONE || 0],
      ['Slot_gen_Iron', 'IRON', counts.IRON || 0],
    ];
    for (let i = 0; i < map.length; i++) {
      const slot = api.$(map[i][0]);
      if (!slot) continue;
      const resId = map[i][1];
      const c = map[i][2];
      const num = api.findNumberHost(slot);
      api.setVisible(slot, true);
      api.setCountOnHost(num, c, c > 0);
      api.ensureIconOverlay(slot, RESOURCE_COLORS[resId] || '#888', true);
    }
  }
}

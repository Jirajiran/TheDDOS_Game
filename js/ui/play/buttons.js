import { playSfx } from '../../audio/sfx.js';
import {
  CATALOG_TO_CATEGORY,
  CRAFT_SLOT_COUNT,
  HOTBAR_MAIN,
  GRAY_FILL,
  YELLOW_FILL,
} from './constants.js';

export function installPlayButtons(api) {
  api.makeHitTarget = function makeHitTarget(el) {
    if (!el) return;
    el.style.cursor = 'pointer';
    el.style.pointerEvents = 'auto';
    try {
      el.setAttribute('pointer-events', 'bounding-box');
    } catch (_) {
      /* ignore */
    }
  }
  
  api.bindExitPressArt = function bindExitPressArt(exitEl) {
    if (!exitEl || exitEl.dataset.exitPressBound) return;
    exitEl.dataset.exitPressBound = '1';
    let press = exitEl.querySelector('[data-press="on"]');
    if (!press && api.state.pressOnTpl) {
      press = api.state.pressOnTpl.cloneNode(true);
      api.stripIds(press);
      press.setAttribute('data-press', 'on');
      press.setAttribute('transform', 'matrix( 1, 0, 0, 1, 0,0) ');
      exitEl.appendChild(press);
    }
    const showPress = (on) => {
      if (press) {
        api.setVisible(press, on);
        const kids = exitEl.children;
        for (let i = 0; i < kids.length; i++) {
          if (kids[i] === press) continue;
          kids[i].style.opacity = on ? '0' : '1';
        }
      } else {
        exitEl.style.filter = on ? 'brightness(0.55)' : '';
      }
    };
    if (press) api.setVisible(press, false);
    exitEl.addEventListener('pointerdown', () => showPress(true));
    exitEl.addEventListener('pointerup', () => showPress(false));
    exitEl.addEventListener('pointerleave', () => showPress(false));
    exitEl.addEventListener('pointercancel', () => showPress(false));
  }
  
  api.bindPressFlash = function bindPressFlash(el) {
    if (!el || el.dataset.pressBound) return;
    el.dataset.pressBound = '1';
    const down = () => {
      el.style.filter = 'brightness(0.65)';
    };
    const up = () => {
      el.style.filter = '';
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
  }
  
  api.setBtnFillSelected = function setBtnFillSelected(btnEl, selected) {
    if (!btnEl) return;
    const uses = btnEl.querySelectorAll('use');
    const target = selected ? YELLOW_FILL : GRAY_FILL;
    for (let i = 0; i < uses.length; i++) {
      const href =
        uses[i].getAttribute('xlink:href') || uses[i].getAttribute('href') || '';
      if (href.indexOf('Ui_Btn_Color_') >= 0 && href.indexOf('Layer1_0_FILL') >= 0) {
        const next = href.replace(/Ui_Btn_Color_\d+_Layer1_0_FILL/, target);
        uses[i].setAttribute('xlink:href', next.startsWith('#') ? next : `#${target}`);
        uses[i].setAttribute('href', next.startsWith('#') ? next : `#${target}`);
      }
    }
  }
  
  api.wireClicks = function wireClicks() {
    const pressIds = [
      'btn_Craft',
      'Btn_Closted_Panel',
      'Btn_Closted_Setting',
      'Btn_confirm_Craft',
      'Btn_Setting',
      'Btn_Audio',
      'Btn_Panel_objective',
      'btn_interactive',
      'Btn_Press_false_Exit',
      'Btn_Panel_objective_FL',
    ];
    for (let i = 0; i < pressIds.length; i++) {
      const el = api.$(pressIds[i]);
      if (el) api.bindPressFlash(el);
    }
  
    const hits = [
      ['btn_Craft', () => api.opts.onCraftToggle && api.opts.onCraftToggle()],
      ['Btn_Closted_Panel', () => api.opts.onCraftClose && api.opts.onCraftClose()],
      ['Btn_confirm_Craft', () => api.opts.onConfirmCraft && api.opts.onConfirmCraft()],
      ['Btn_Setting', () => api.opts.onSettingOpen && api.opts.onSettingOpen()],
      ['Btn_Closted_Setting', () => api.opts.onSettingClose && api.opts.onSettingClose()],
      [
        'Btn_Audio',
        () => {
          api.state.audioMuted = !api.state.audioMuted;
          try {
            localStorage.setItem('theddos_mute', api.state.audioMuted ? '1' : '0');
          } catch (_) {
            /* ignore */
          }
          api.syncAudioIcon();
          if (api.opts.onAudioToggle) api.opts.onAudioToggle(api.state.audioMuted);
        },
      ],
      [
        'Btn_Panel_objective',
        () => {
          api.state.objectiveOpen = !api.state.objectiveOpen;
          api.syncModals();
        },
      ],
      [
        'btn_interactive',
        () => api.opts.onInteractive && api.opts.onInteractive(),
      ],
      [
        'Btn_Press_false_TakeWood',
        () => api.opts.onGenTake && api.opts.onGenTake('WOOD'),
      ],
      [
        'Btn_Press_false_TakeStone',
        () => api.opts.onGenTake && api.opts.onGenTake('STONE'),
      ],
      [
        'Btn_Press_false_TakeIron',
        () => api.opts.onGenTake && api.opts.onGenTake('IRON'),
      ],
      [
        'Btn_Press_false_TakeWeapon',
        () => api.opts.onFactoryTake && api.opts.onFactoryTake(),
      ],
      [
        'Btn_Panel_objective_FL',
        () => {
          api.setGenOpen(false);
          if (api.opts.onGenClose) api.opts.onGenClose();
        },
      ],
      [
        'Btn_Press_false_Exit',
        () => api.opts.onLeaveGame && api.opts.onLeaveGame(),
      ],
    ];
  
    for (let i = 0; i < hits.length; i++) {
      const el = api.$(hits[i][0]);
      if (!el) continue;
      api.makeHitTarget(el);
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        playSfx('ui.click');
        hits[i][1]();
      });
    }
  
    const leaveHint = api.$('Anchor_Center_2');
    if (leaveHint) {
      const tspans = leaveHint.querySelectorAll('tspan');
      for (let i = 0; i < tspans.length; i++) {
        const t = (tspans[i].textContent || '').trim().toLowerCase();
        if (t.indexOf('not thing') >= 0 || t === 'leave' || t === 'exit') {
          const textEl = tspans[i].closest('text') || tspans[i];
          api.makeHitTarget(textEl);
          api.bindPressFlash(textEl);
          textEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
        playSfx('ui.click');
            if (api.opts.onLeaveGame) api.opts.onLeaveGame();
          });
          tspans[i].textContent = 'Leave Game';
        }
      }
    }
  
    const catalogIds = Object.keys(CATALOG_TO_CATEGORY);
    for (let i = 0; i < catalogIds.length; i++) {
      const id = catalogIds[i];
      const el = api.$(id);
      if (!el) continue;
      api.makeHitTarget(el);
      api.bindPressFlash(el);
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        playSfx('ui.click');
        const cat = CATALOG_TO_CATEGORY[id];
        api.syncCatalogVisual(cat);
        if (api.opts.onCatalog) api.opts.onCatalog(cat);
      });
    }
  
    for (let s = 1; s <= CRAFT_SLOT_COUNT; s++) {
      const slot = api.$(`Slot_${s}`);
      if (!slot) continue;
      api.makeHitTarget(slot);
      slot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        playSfx('ui.click');
        api.state.selectedCraftIndex = s - 1;
        if (api.opts.onCraftSlotSelect) api.opts.onCraftSlotSelect(s - 1);
        api.syncCraftSelection();
        api.syncCraftDetail();
      });
    }
  
    for (let i = 1; i <= HOTBAR_MAIN; i++) {
      api.wireHotbarPanel(api.$(`Panel_item_${i}`), i - 1);
    }
    for (let i = 7; i <= 12; i++) {
      api.wireHotbarPanel(api.$(`Panel_item_${i}`), i - 1);
      api.wireHotbarPanel(api.$(`Panel_item_${i}_FL`), i - 1);
      api.wireHotbarPanel(api.$(`Panel_item_${i}_FL_FL`), i - 1);
    }
    api.wireHotbarPanel(api.$('Mask_Item_7'), 6);

    const closeUpgrade = api.$('Btn_Panel_objective_FL_FL');
    if (closeUpgrade) {
      api.makeHitTarget(closeUpgrade);
      closeUpgrade.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        playSfx('ui.click');
        if (api.opts.onUpgradeClose) api.opts.onUpgradeClose();
        else api.setUpgradeOpen(false);
      });
    }
    const upgradeSlot = api.$('Slot_CurrentWeapon');
    const doneSlot = api.$('Slot_Done_Upgrate');
    const takeSlot = (el, role) => {
      if (!el) return;
      api.makeHitTarget(el);
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        playSfx('ui.click');
        if (api.opts.onFactoryTake) api.opts.onFactoryTake(role);
      });
    };
    takeSlot(upgradeSlot, 'deposit');
    takeSlot(doneSlot, 'collect');
  
    const skill1 = api.$('Skill_Show_1');
    if (skill1) {
      api.makeHitTarget(skill1);
      api.bindPressFlash(skill1);
      skill1.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        playSfx('ui.click');
        if (api.opts.onCastFist) api.opts.onCastFist();
        else if (api.opts.onCastSkill) api.opts.onCastSkill('FIST');
      });
    }
    const skill2 = api.$('Skill_Show_2');
    if (skill2) {
      api.makeHitTarget(skill2);
      api.bindPressFlash(skill2);
      skill2.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    }
  
    const inputChat = api.$('InputChat');
    if (inputChat) {
      api.makeHitTarget(inputChat);
      inputChat.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        playSfx('ui.click');
        if (!api.state.chatOpen) api.openChat();
      });
    }
  }
  
  api.wireHotbarPanel = function wireHotbarPanel(el, slotIndex) {
    if (!el) return;
    api.makeHitTarget(el);
    el.dataset.slotIndex = String(slotIndex);
    el.setAttribute('data-slot-index', String(slotIndex));
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
        playSfx('ui.click');
      if (api.opts.onHotbarDown) api.opts.onHotbarDown(slotIndex, e);
      else if (api.opts.onHotbarSelect) api.opts.onHotbarSelect(slotIndex);
    });
    el.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (api.opts.onHotbarDouble) api.opts.onHotbarDouble(slotIndex);
    });
  }
}

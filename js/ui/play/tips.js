import { GAME_PACK, getItemDef, getSkillDef, getWeaponDef } from '../../config.js';

/** Named HUD pieces. One short fact, not a how-to. */
const BUTTON_TIPS = {
  btn_Craft: ['Craft', 'Recipes'],
  Btn_Closted_Panel: ['Close'],
  Btn_confirm_Craft: ['Craft'],
  Btn_Setting: ['Settings'],
  Btn_Closted_Setting: ['Close'],
  Btn_Audio: ['Sound'],
  Btn_Panel_objective: ['Objective'],
  btn_interactive: ['Use'],
  Btn_Press_false_TakeWood: ['Wood'],
  Btn_Press_false_TakeStone: ['Stone'],
  Btn_Press_false_TakeIron: ['Iron'],
  Btn_Panel_objective_FL: ['Close'],
  Btn_Panel_objective_FL_FL: ['Close'],
  Btn_Press_false_Exit: ['Leave'],
  Btn_Press_false_TakeWeapon: ['Weapon'],
  InputChat: ['Chat'],
};

function skillLore(id) {
  const sk = getSkillDef(id);
  const effect = sk && sk.effect;
  if (!effect) return '';
  if (effect.damage != null) return `${effect.damage} damage`;
  if (effect.amount != null) return `${effect.amount} health`;
  return '';
}

function itemLore(def, item) {
  if (!def) return '';
  const kind = def.kind || (item && item.kind) || '';
  if (kind === 'WEAPON') {
    const w = getWeaponDef(def.weaponId || (item && item.itemId));
    if (!w || w.baseDamage == null) return '';
    return w.magCapacity ? `${w.baseDamage} damage, ${w.magCapacity} rounds` : `${w.baseDamage} damage`;
  }
  if (kind === 'ARMOR' && def.damageReduction != null) {
    return `${Math.round(def.damageReduction * 100)}% less damage`;
  }
  if (kind === 'SHIELD' && def.shieldMaxHp != null) return `${def.shieldMaxHp} shield`;
  if (kind === 'BACKPACK' && def.backpackBonusSlots != null) {
    return `${def.backpackBonusSlots} extra slots`;
  }
  if (kind === 'TOOL') {
    if (def.repairAmount) return `Repairs ${def.repairAmount}`;
    if (def.harvestDamage) return `Harvest ${def.harvestDamage}`;
  }
  return '';
}

const SLOT_INDEX = {
  Mask_Item_7: 6,
};

export function installPlayTips(api) {
  const root = api.state.svgRoot;
  if (!root || api.state.tipBound) return;
  api.state.tipBound = true;
  api.state.hoverDetail = null;

  const dwellMs =
    ((GAME_PACK.gunDetailDwellSec != null ? GAME_PACK.gunDetailDwellSec : 0.9) * 1000) | 0;
  let timer = 0;
  let key = '';
  let ax = 0;
  let ay = 0;

  function clearHover() {
    api.state.hoverDetail = null;
    key = '';
    if (timer) clearTimeout(timer);
    timer = 0;
  }

  function resolve(node) {
    let el = node;
    while (el && el !== root) {
      const id = el.id || '';
      if (SLOT_INDEX[id] != null) {
        return slotTip(id, SLOT_INDEX[id]);
      }
      const slot = /^Panel_item_(\d+)/.exec(id);
      if (slot) return slotTip(id, Number(slot[1]) - 1);
      if (id === 'Skill_Show_1') return { key: id, lines: ['Fist', skillLore('FIST')] };
      if (id === 'Skill_Show_2') return { key: id, lines: ['Self Heal', skillLore('SELF_HEAL')] };
      if (BUTTON_TIPS[id]) return { key: id, lines: BUTTON_TIPS[id] };
      el = el.parentNode;
    }
    return null;
  }

  function slotTip(id, index) {
    const item = (api.state.hotbarSlots || [])[index];
    if (!item || !item.itemId) return null;
    const def = getItemDef(item.itemId);
    const name = (def && def.label) || item.itemId;
    return { key: `slot:${index}:${item.itemId}`, lines: [name, itemLore(def, item)] };
  }

  root.addEventListener('pointermove', (e) => {
    const hit = resolve(e.target);
    if (!hit) {
      clearHover();
      return;
    }
    const moved = Math.hypot(e.clientX - ax, e.clientY - ay) > 6;
    if (hit.key !== key || moved) {
      clearHover();
      key = hit.key;
      ax = e.clientX;
      ay = e.clientY;
      const snap = hit;
      timer = setTimeout(() => {
        api.state.hoverDetail = snap.lines;
      }, dwellMs);
    }
  });
  root.addEventListener('pointerleave', clearHover);
}

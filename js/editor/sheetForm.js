/**
 * One settings panel per kind. The id field is the real string the game uses.
 */

import { WEAPON_BTN_ART, weaponArtSpec } from '../view/cosmetics.js';
import { renderRecord } from './recordForm.js';

const DEFAULT_WEAPON_GROUP = 'Weapon_Colt_1911';
const HOLD_STYLES = ['hold_Gun', 'hold_Gun_2'];

export const BLOCK_TAB_KINDS = ['Block', 'Door', 'Generator', 'Factory', 'Base'];
export const ARMOR_TAB_KINDS = ['Armor', 'Shield'];

export function isBlockTabKind(name) {
  return BLOCK_TAB_KINDS.indexOf(name) >= 0;
}

export function isArmorTabKind(name) {
  return ARMOR_TAB_KINDS.indexOf(name) >= 0;
}

export function weaponArtGroups() {
  const names = Object.keys(WEAPON_BTN_ART);
  const groups = [];
  const seen = {};
  for (let i = 0; i < names.length; i++) {
    const group = WEAPON_BTN_ART[names[i]] && WEAPON_BTN_ART[names[i]].group;
    if (!group || seen[group]) continue;
    seen[group] = true;
    groups.push(group);
  }
  if (!seen[DEFAULT_WEAPON_GROUP]) groups.unshift(DEFAULT_WEAPON_GROUP);
  return groups;
}

export function shownWeaponModel(record) {
  if (record && typeof record.model === 'string' && record.model) return record.model;
  const spec = weaponArtSpec(record && record.id);
  if (spec && spec.group) return spec.group;
  return DEFAULT_WEAPON_GROUP;
}

export function shownWeaponHold(record) {
  if (record && (record.holdStyle === 'hold_Gun' || record.holdStyle === 'hold_Gun_2')) return record.holdStyle;
  const spec = weaponArtSpec(record && record.id);
  if (spec && spec.pose === 'heavy') return 'hold_Gun_2';
  return 'hold_Gun';
}

export function weaponPreviewSpec(record) {
  return {
    group: shownWeaponModel(record),
    hold: shownWeaponHold(record),
  };
}

const WEAPON_COMMON = [
  'id', 'label', 'color', 'baseDamage', 'cooldownSec', 'spreadDeg', 'magCapacity', 'maxMags',
  'maxDistancePath', 'reloadSec', 'infiniteAmmo', 'ammoTypeId', 'targetFaction', 'damageType',
  'reloadType', 'muzzleLeadSec', 'projectileRadius', 'aiFireRangePath',
];

const WEAPON_EXTRA = {
  Normal: ['bulletSpeedPxSec', 'pierceUnits'],
  Shotgun: ['pelletCount', 'bulletSpeedPxSec'],
  Burst: ['burstCount', 'burstIntervalSec', 'bulletSpeedPxSec'],
  Lazer: ['beamDurationSec'],
};

const PLACE_FLAGS = [
  'isDefeatCondition', 'isTurret', 'isHeal', 'isGen', 'isFactory', 'isDoor', 'isWire', 'isHarvest',
];

const TURRET_RECORD = [
  'id', 'label', 'color', 'typeId', 'maxStack', 'maxHp', 'armorType', 'weaponId', 'detectRadius',
  'infiniteAmmo', 'priorityScore', 'footprint',
];

const ITEM_FIELDS = {
  Block: ['id', 'label', 'color', 'typeId', 'maxStack', 'maxHp', 'armorType', 'skillId', 'pierceCost', 'walkSolid', 'projectileSolid', 'allowProjectilePass', 'footprint'],
  Door: ['id', 'label', 'color', 'typeId', 'maxStack', 'maxHp', 'armorType', 'pierceCost', 'canToggle', 'footprint'],
  Turret: ['id', 'weaponId'],
  Generator: ['id', 'label', 'color', 'maxHp', 'genRate', 'footprint'],
  Factory: ['id', 'label', 'color', 'maxHp', 'armorType', 'footprint'],
  Base: ['id', 'label', 'color', 'maxHp', 'armorType', 'weaponId', 'detectRadius', 'generatorList', 'footprint'],
  Weapon: ['id', 'label', 'color', 'weaponId', 'maxStack'],
  Resource: ['id', 'label', 'color', 'maxStack'],
  Tool: ['id', 'label', 'color', 'toolTier', 'maxStack', 'harvestDamage', 'structureDamage', 'repairAmount', 'meleeRole', 'activeDurationSec', 'cooldownSec'],
  Armor: ['id', 'label', 'color', 'maxStack', 'damageReduction', 'markerColor'],
  Shield: ['id', 'label', 'color', 'maxStack', 'shieldMaxHp', 'shieldRadius', 'shieldOffset', 'shieldPierceCost', 'shieldAbsorbRatio', 'shieldRegenPerSec', 'markerColor'],
  Backpack: ['id', 'label', 'color', 'maxStack', 'backpackTier', 'backpackBonusSlots'],
};

const EFFECT = {
  MELEE_SWING: { damage: 18, hitUnits: true, hitBlocks: true, vfxSize: 54, color: '#e8dcc0' },
  TAUNT_PULSE: { radius: 288, durationSec: 5 },
  SPEED_BOOST: { speedMult: 1.35 },
  SHIELD_OVERCHARGE: { shieldBonus: 60 },
  HEAL_SELF: { amount: 5 },
};

const SKILL_HEAD = ['id', 'label', 'castTimeSec', 'activeDurationSec', 'cooldownSec'];

function categorySelect(label, names, value, onChange) {
  const select = document.createElement('select');
  for (let i = 0; i < names.length; i++) {
    const option = document.createElement('option');
    option.value = names[i];
    option.textContent = names[i];
    select.appendChild(option);
  }
  select.value = value;
  select.addEventListener('change', () => onChange(select.value));
  const wrap = document.createElement('label');
  wrap.textContent = label;
  wrap.appendChild(select);
  return wrap;
}

function ensure(record, keys, defaults) {
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (record[key] == null && defaults[key] != null) record[key] = defaults[key];
  }
}

export function weaponCategory(record) {
  if (record.projectileMode === 'CONTINUOUS_BEAM' || (record.beamDurationSec || 0) > 0) return 'Lazer';
  if ((record.pelletCount || 1) > 1) return 'Shotgun';
  if ((record.burstCount || 1) > 1) return 'Burst';
  return 'Normal';
}

function applyWeapon(record, category) {
  record.projectileMode = category === 'Lazer' ? 'CONTINUOUS_BEAM' : 'PROJECTILE_RAYCAST';
  if (category === 'Shotgun') record.pelletCount = Math.max(2, record.pelletCount || 2);
  else record.pelletCount = 1;
  if (category === 'Burst') record.burstCount = Math.max(2, record.burstCount || 2);
  else record.burstCount = 1;
  if (category === 'Lazer') record.beamDurationSec = record.beamDurationSec > 0 ? record.beamDurationSec : 1;
  else record.beamDurationSec = 0;
  ensure(record, WEAPON_COMMON.concat(WEAPON_EXTRA[category]), {
    label: record.id || '',
    color: '#6b9fbf',
    baseDamage: 10,
    cooldownSec: 0.5,
    spreadDeg: 5,
    magCapacity: 10,
    maxMags: 3,
    maxDistancePath: 1,
    reloadSec: 1.4,
    infiniteAmmo: category === 'Lazer',
    ammoTypeId: category === 'Lazer' ? null : 'AMMO_5_56',
    targetFaction: 'ENEMY',
    damageType: category === 'Lazer' ? 'LAZER' : 'BULLET',
    reloadType: 'MAGAZINE',
    muzzleLeadSec: 0.02,
    projectileRadius: 9,
    aiFireRangePath: 0.75,
    bulletSpeedPxSec: 1600,
    pierceUnits: 0,
    pelletCount: category === 'Shotgun' ? 5 : 1,
    burstCount: category === 'Burst' ? 3 : 1,
    burstIntervalSec: 0.06,
    beamDurationSec: category === 'Lazer' ? 1 : 0,
  });
}

export function itemHeadings() {
  return Object.keys(ITEM_FIELDS);
}

export function skillEffectNames() {
  return Object.keys(EFFECT);
}

const LOCKED_BACKPACK_IDS = { BACKPACK_T1: true, BACKPACK_T2: true, BACKPACK_T3: true };

export function isLockedBackpack(record) {
  return !!(record && !record.pending && LOCKED_BACKPACK_IDS[record.id]);
}

export function itemCategory(record) {
  if (record.kind === 'WEAPON') return 'Weapon';
  if (record.kind === 'RESOURCE') {
    if (typeof record.id === 'string' && record.id.indexOf('AMMO_') === 0) return 'Ammo';
    return 'Resource';
  }
  if (record.kind === 'TOOL') return 'Tool';
  if (record.kind === 'ARMOR') return 'Armor';
  if (record.kind === 'SHIELD') return 'Shield';
  if (record.kind === 'BACKPACK') return 'Backpack';
  if (record.isDefeatCondition) return 'Base';
  if (record.isTurret) return 'Turret';
  if (record.isGen) return 'Generator';
  if (record.isFactory) return 'Factory';
  if (record.isDoor) return 'Door';
  return 'Block';
}

function storedItemKeys(category) {
  if (category === 'Ammo') return ITEM_FIELDS.Resource;
  if (category === 'Turret') return TURRET_RECORD;
  return ITEM_FIELDS[category];
}

function applyItem(record, category) {
  if (category === 'Wire' || category === 'Heal') category = 'Block';
  const fields = storedItemKeys(category);
  const placeable = !!fields && category !== 'Ammo' && category !== 'Weapon' && category !== 'Resource' && category !== 'Tool' && category !== 'Armor' && category !== 'Shield' && category !== 'Backpack';
  if (category === 'Ammo') record.kind = 'RESOURCE';
  else if (placeable) {
    record.kind = 'PLACEABLE';
    for (let i = 0; i < PLACE_FLAGS.length; i++) record[PLACE_FLAGS[i]] = false;
    if (category === 'Base') record.isDefeatCondition = true;
    if (category === 'Turret') record.isTurret = true;
    if (category === 'Generator') record.isGen = true;
    if (category === 'Factory') record.isFactory = true;
    if (category === 'Door') record.isDoor = true;
  } else if (category !== 'Ammo') {
    record.kind = category.toUpperCase();
  }
  ensure(record, fields || ITEM_FIELDS.Block, {
    label: record.id || '',
    color: '#8a8a8a',
    typeId: category === 'Ammo' ? 'RESOURCE' : category.toUpperCase(),
    maxStack: category === 'Resource' || category === 'Ammo' ? 64 : 1,
    maxHp: 100,
    armorType: 'DEFAULT',
    skillId: '',
    pierceCost: 1,
    walkSolid: true,
    projectileSolid: true,
    allowProjectilePass: false,
    canToggle: category === 'Door',
    blocksProjectiles: true,
    weaponId: '',
    detectRadius: 256,
    infiniteAmmo: false,
    priorityScore: 0,
    healFriendly: true,
    healRadius: 160,
    healPerSec: 8,
    areaMode: 'CONTINUOUS_TICK',
    triggerRadius: 160,
    effectRadius: 160,
    tickIntervalSec: 0.5,
    tickValue: 8,
    footprint: { w: 1, h: 1 },
    genRate: { itemId: '', amount: 1, intervalSec: 30 },
    generatorList: [],
    toolTier: 'TIER0',
    harvestDamage: 0,
    structureDamage: 0,
    repairAmount: 0,
    meleeRole: 'HARVEST_AXE',
    activeDurationSec: 0.1,
    cooldownSec: 0.2,
    damageReduction: 0.2,
    markerColor: '#7a9ab0',
    shieldMaxHp: 100,
    shieldRadius: 35,
    shieldOffset: 42,
    shieldPierceCost: 1,
    shieldAbsorbRatio: 1,
    shieldRegenPerSec: 0,
    backpackTier: 1,
    backpackBonusSlots: 2,
  });
}

function applyEffect(record, type) {
  const prev = record.effect || {};
  const spec = EFFECT[type] || EFFECT.MELEE_SWING;
  const next = { type: type };
  const keys = Object.keys(spec);
  for (let i = 0; i < keys.length; i++) {
    next[keys[i]] = prev[keys[i]] != null ? prev[keys[i]] : spec[keys[i]];
  }
  record.effect = next;
}

export function blankFor(key, category) {
  if (key === 'weaponId') return { id: '', pending: true, pendingCategory: category || 'Normal' };
  if (key === 'itemId') return { id: '', pending: true, pendingCategory: category || 'Block' };
  return { id: '', pending: true, pendingCategory: category || 'MELEE_SWING' };
}

function kindNote(parent, text) {
  const note = document.createElement('p');
  note.className = 'editor-note';
  note.textContent = text;
  parent.appendChild(note);
}

function deleteButton(ctx, id) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Delete';
  button.addEventListener('click', async () => {
    const yes = ctx.confirm
      ? await ctx.confirm('Delete ' + id + '? This id and its side tab will be removed.')
      : false;
    if (yes && ctx.remove) ctx.remove();
  });
  return button;
}

function finishDraft(key, record) {
  const category = record.pendingCategory;
  if (key === 'weaponId') {
    if (category === 'Melee') applyItem(record, 'Tool');
    else if (category === 'Gun') applyWeapon(record, 'Normal');
    else applyWeapon(record, category || 'Normal');
  } else if (key === 'itemId') applyItem(record, category || 'Block');
  else {
    applyEffect(record, category || 'MELEE_SWING');
    ensure(record, SKILL_HEAD, {
      label: record.id || '',
      castTimeSec: 0,
      activeDurationSec: 0,
      cooldownSec: 1,
    });
  }
  delete record.pending;
  delete record.pendingCategory;
}

function renderDraft(body, key, record, ctx) {
  if (key === 'weaponId') {
    const piece = record.pendingCategory === 'Melee' ? 'Melee' : 'Gun';
    body.appendChild(categorySelect('Piece', ['Gun', 'Melee'], piece, (next) => {
      record.pendingCategory = next;
      if (ctx.touch) ctx.touch(true);
    }));
  } else if (key === 'itemId') {
    let category = record.pendingCategory || 'Block';
    if (category === 'Wire' || category === 'Heal') {
      category = 'Block';
      record.pendingCategory = 'Block';
    }
    if (isBlockTabKind(category)) {
      body.appendChild(categorySelect('Kind', BLOCK_TAB_KINDS, category, (next) => {
        record.pendingCategory = next;
      }));
    } else if (isArmorTabKind(category)) {
      body.appendChild(categorySelect('Kind', ARMOR_TAB_KINDS, category, (next) => {
        record.pendingCategory = next;
      }));
    } else {
      kindNote(body, category);
    }
  } else {
    const names = Object.keys(EFFECT);
    body.appendChild(categorySelect('Effect', names, record.pendingCategory || 'MELEE_SWING', (next) => {
      record.pendingCategory = next;
    }));
  }
  const apply = document.createElement('button');
  apply.type = 'button';
  apply.textContent = 'Apply';
  apply.addEventListener('click', () => {
    finishDraft(key, record);
    if (ctx.afterApply) ctx.afterApply(record);
    else ctx.touch(true);
  });
  body.appendChild(apply);
  body.appendChild(deleteButton(ctx, record.id));
}

function labeledNumber(parent, label, value, onChange) {
  const input = document.createElement('input');
  input.type = 'number';
  input.step = 'any';
  input.value = String(value == null ? 0 : value);
  input.addEventListener('change', () => onChange(Number(input.value) || 0));
  const wrap = document.createElement('label');
  wrap.textContent = label;
  wrap.appendChild(input);
  parent.appendChild(wrap);
}

function renderArmorExtra(parent, record, ctx) {
  const types = Array.isArray(ctx.armorTypes) ? ctx.armorTypes : [];
  if (!record.resistPercent || typeof record.resistPercent !== 'object' || Array.isArray(record.resistPercent)) {
    record.resistPercent = {};
  }
  for (let i = 0; i < types.length; i++) {
    const typeName = types[i];
    labeledNumber(parent, typeName + ' %', record.resistPercent[typeName] || 0, (next) => {
      record.resistPercent[typeName] = next;
      ctx.touch(false);
    });
  }
  labeledNumber(parent, 'bonusHp', record.bonusHp || 0, (next) => {
    record.bonusHp = next;
    ctx.touch(false);
  });
}

function renderBlockSkill(parent, record, ctx) {
  const names = ctx.choices ? ctx.choices('skills', record.skillId || '') : [];
  const select = document.createElement('select');
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = '(none)';
  select.appendChild(blank);
  for (let i = 0; i < names.length; i++) {
    if (!names[i]) continue;
    const option = document.createElement('option');
    option.value = names[i];
    option.textContent = names[i];
    select.appendChild(option);
  }
  select.value = record.skillId && names.indexOf(record.skillId) >= 0 ? record.skillId : '';
  select.addEventListener('change', () => {
    record.skillId = select.value;
    if (!record.skillId) delete record.skillId;
    ctx.touch(false);
  });
  const wrap = document.createElement('label');
  wrap.textContent = 'Skill';
  wrap.appendChild(select);
  parent.appendChild(wrap);
}

export function renderTyped(body, key, record, ctx) {
  if (record.pending) {
    renderDraft(body, key, record, ctx);
    return;
  }
  if (key === 'weaponId') {
    const category = weaponCategory(record);
    kindNote(body, category);
    const groups = weaponArtGroups();
    const artValue = shownWeaponModel(record);
    if (groups.indexOf(artValue) < 0) groups.push(artValue);
    body.appendChild(categorySelect('Art', groups, artValue, (next) => {
      record.model = next;
      ctx.touch(true);
    }));
    body.appendChild(categorySelect('Hold style', HOLD_STYLES, shownWeaponHold(record), (next) => {
      record.holdStyle = next;
      ctx.touch(true);
    }));
    renderRecord(body, record, record, Object.assign({}, ctx, {
      only: WEAPON_COMMON.concat(WEAPON_EXTRA[category] || WEAPON_EXTRA.Normal),
    }));
    body.appendChild(deleteButton(ctx, record.id));
    return;
  }
  if (key === 'itemId') {
    const category = itemCategory(record);
    const fields = storedItemKeys(category) || ITEM_FIELDS.Block;
    kindNote(body, isLockedBackpack(record) ? 'Backpack' : category);
    if (category === 'Weapon' && record.maxStack !== 1) record.maxStack = 1;
    const formCtx = Object.assign({}, ctx, {
      only: fields,
      lockMaxStack: category === 'Weapon',
    });
    if (isLockedBackpack(record)) {
      const box = document.createElement('div');
      box.className = 'editor-fields';
      renderRecord(box, record, record, formCtx);
      const controls = box.querySelectorAll('input, select, textarea, button');
      for (let i = 0; i < controls.length; i++) controls[i].disabled = true;
      body.appendChild(box);
      return;
    }
    renderRecord(body, record, record, formCtx);
    if (category === 'Armor') renderArmorExtra(body, record, ctx);
    if (category === 'Shield') {
      const pierce = document.createElement('p');
      pierce.className = 'editor-note';
      pierce.textContent = 'The projectile requests the pierce. The shield charges shieldPierceCost.';
      body.appendChild(pierce);
    }
    if (category === 'Block') renderBlockSkill(body, record, ctx);
    body.appendChild(deleteButton(ctx, record.id));
    return;
  }
  if (key === 'skillId') {
    const type = (record.effect && record.effect.type) || '';
    kindNote(body, type || 'Skill');
    renderRecord(body, record, record, Object.assign({}, ctx, { only: SKILL_HEAD }));
    const effect = record.effect || {};
    const box = document.createElement('div');
    box.className = 'editor-fields';
    const keys = Object.keys(effect).filter((name) => name !== 'type' && name !== 'id');
    renderRecord(box, effect, effect, {
      choices: ctx.choices,
      canWear: ctx.canWear,
      touch: () => ctx.touch(false),
      rename: () => {},
      only: keys,
    });
    body.appendChild(box);
    body.appendChild(deleteButton(ctx, record.id));
  }
}

/**
 * One settings panel per kind. The id field is the real string the game uses.
 */

import {
  artIdsForCategory,
  modelIdFromVehicleArt,
} from '../assets/closedCatalog.js';
import { WEAPON_BTN_ART, weaponArtSpec } from '../view/cosmetics.js';
import { appendDivider, appendSectionTitle, renderRecord, toReadableLabel } from './recordForm.js';
import {
  BLOCK_SIZE,
  createDefaultSkillRecord,
  ensureSkillRecord,
} from './defaultMapFactory.js';

const DEFAULT_WEAPON_GROUP = 'Weapon_Colt_1911';
const HOLD_STYLES = ['hold_Gun', 'hold_Gun_2'];

export const WEAPON_TYPES = [
  { value: 'Normal', label: 'Normal' },
  { value: 'Shotgun', label: 'Shotgun' },
  { value: 'Burst', label: 'Burst' },
  { value: 'Lazer', label: 'Lazer' },
  { value: 'Melee', label: 'Melee (Tool)' },
];

export const BLOCK_TAB_KINDS = ['Block', 'Door', 'Generator', 'Factory', 'Base'];
/** Item tab kinds — no Armor Slot picker; Kind alone sets wear channel. */
export const ARMOR_TAB_KINDS = ['Vest', 'Helmet', 'Shield', 'Shield Energy'];

export function isBlockTabKind(name) {
  return BLOCK_TAB_KINDS.indexOf(name) >= 0;
}

export function isArmorTabKind(name) {
  return ARMOR_TAB_KINDS.indexOf(name) >= 0 || name === 'Armor';
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
  if (record && typeof record.artId === 'string' && record.artId) return record.artId;
  if (record && typeof record.model === 'string' && record.model) return record.model;
  const spec = weaponArtSpec(record && record.id);
  if (spec && spec.group) return spec.group;
  return null;
}

/** Write cosmetics/default into artId once so the form field is the source of truth. */
export function ensureWeaponArtId(record) {
  if (!record) return;
  if (typeof record.artId === 'string' && record.artId) {
    record.model = record.artId;
    return;
  }
  const fromModel = typeof record.model === 'string' && record.model ? record.model : '';
  const fromCosmetics = weaponArtSpec(record.id);
  const group = fromModel || (fromCosmetics && fromCosmetics.group) || '';
  if (group) {
    record.artId = group;
    record.model = group;
  }
}

export function isTurretWeaponRecord(record) {
  const art = shownWeaponModel(record) || '';
  return /^Weapon_Turrent_[123]$/i.test(art);
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

const WEAPON_IDENTITY = ['id', 'label', 'color', 'artId', 'bulletArtId', 'previewHost'];
const WEAPON_IDENTITY_TURRET = WEAPON_IDENTITY.concat(['shotFrameArtId']);
const WEAPON_BALLISTICS = [
  'baseDamage', 'cooldownSec', 'spreadDeg', 'maxDistancePath', 'aiFireRangePath',
  'muzzleLeadSec', 'projectileRadius',
];
const WEAPON_AMMO = [
  'magCapacity', 'maxMags', 'reloadSec', 'infiniteAmmo', 'ammoTypeId',
  'damageType', 'targetFaction',
];
const WEAPON_COMMON = WEAPON_IDENTITY.concat(WEAPON_BALLISTICS, WEAPON_AMMO);

const WEAPON_EXTRA = {
  Normal: ['bulletSpeedPxSec', 'pierceUnits'],
  Shotgun: ['pelletCount', 'bulletSpeedPxSec'],
  Burst: ['burstCount', 'burstIntervalSec', 'bulletSpeedPxSec'],
  Lazer: ['beamDurationSec'],
};

const PLACE_FLAGS = [
  'isDefeatCondition', 'isTurret', 'isHeal', 'isGen', 'isFactory', 'isDoor', 'isWire', 'isHarvest',
];

const PLACEABLE_CORE = [
  'id', 'label', 'color', 'typeId', 'maxStack', 'maxHp', 'armorType', 'priorityScore',
  'skillId', 'pierceCost', 'footprint', 'artId',
];

const TURRET_RECORD = PLACEABLE_CORE.concat([
  'weaponId', 'detectRadius', 'infiniteAmmo',
]);

const WEAR_CORE = ['id', 'label', 'color', 'maxStack', 'artId', 'markerColor'];
const VEST_HELMET_FIELDS = WEAR_CORE.concat(['damageReduction', 'armorType']);
const SHIELD_FIELDS = WEAR_CORE.concat([
  'shieldMaxHp', 'shieldRadius', 'shieldOffset', 'shieldPierceCost',
  'shieldAbsorbRatio', 'shieldRegenPerSec',
]);

const ITEM_FIELDS = {
  Block: PLACEABLE_CORE.concat([
    'walkSolid', 'projectileSolid', 'allowProjectilePass',
  ]),
  Door: PLACEABLE_CORE.concat(['canToggle']),
  Turret: TURRET_RECORD.slice(),
  Generator: PLACEABLE_CORE.concat(['generatorList']),
  Factory: PLACEABLE_CORE.slice(),
  Base: PLACEABLE_CORE.concat(['weaponId', 'detectRadius', 'generatorList']),
  Weapon: ['id', 'label', 'color', 'weaponId', 'maxStack'],
  Resource: ['id', 'label', 'color', 'maxStack'],
  Tool: ['id', 'label', 'color', 'toolTier', 'maxStack', 'harvestDamage', 'structureDamage', 'repairAmount', 'meleeRole', 'activeDurationSec', 'cooldownSec'],
  Vest: VEST_HELMET_FIELDS.slice(),
  Helmet: VEST_HELMET_FIELDS.slice(),
  Shield: SHIELD_FIELDS.slice(),
  'Shield Energy': SHIELD_FIELDS.slice(),
  Backpack: ['id', 'label', 'color', 'maxStack', 'backpackTier', 'backpackBonusSlots'],
  /** Vehicle mirrors unit armor contract: maxHp + armorType + resistPercent (panel). */
  Vehicle: [
    'id', 'label', 'color', 'artId', 'maxHp', 'armorType', 'speed', 'speedBase',
    'speedMax', 'accel', 'brake', 'turnRateRadPerSec', 'weaponId',
    'detectRadius', 'mobilityHpRatio', 'mobilityRepairChance', 'brokenClearSec',
    'ramSpeedMin', 'ramDamage', 'driverProtection', 'startUnitDriven',
  ],
};

export const GENERATOR_OUTPUT_CAP = 3;

const EFFECT = {
  MELEE_SWING: { damage: 18, hitUnits: true, hitBlocks: true, vfxSize: 54, color: '#e8dcc0' },
  TAUNT_PULSE: { radius: 288, durationSec: 5 },
  SPEED_BOOST: { speedMult: 1.35 },
  SHIELD_OVERCHARGE: { shieldBonus: 60 },
  HEAL_SELF: { amount: 5 },
};

const SKILL_HEAD = ['id', 'label', 'artId', 'castTimeSec', 'activeDurationSec', 'cooldownSec'];
const SKILL_TARGET_TYPES = ['Self', 'Ally', 'Enemy', 'Point / Area'];
const SKILL_EFFECT_TYPES = ['Heal', 'Damage', 'Buff', 'Spawn'];

function categorySelect(label, items, value, onChange) {
  const select = document.createElement('select');
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const option = document.createElement('option');
    if (item && typeof item === 'object') {
      option.value = item.value;
      option.textContent = item.label;
    } else {
      option.value = item;
      option.textContent = item;
    }
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

function reloadTypeForCategory(category) {
  return category === 'Shotgun' ? 'INDIVIDUAL_SHELL' : 'MAGAZINE';
}

function applyWeapon(record, category) {
  record.projectileMode = category === 'Lazer' ? 'CONTINUOUS_BEAM' : 'PROJECTILE_RAYCAST';
  if (category === 'Shotgun') record.pelletCount = Math.max(2, record.pelletCount || 2);
  else record.pelletCount = 1;
  if (category === 'Burst') record.burstCount = Math.max(2, record.burstCount || 2);
  else record.burstCount = 1;
  if (category === 'Lazer') record.beamDurationSec = record.beamDurationSec > 0 ? record.beamDurationSec : 1;
  else record.beamDurationSec = 0;
  record.reloadType = reloadTypeForCategory(category);
  ensure(record, WEAPON_COMMON.concat(WEAPON_EXTRA[category] || WEAPON_EXTRA.Normal), {
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
    ammoTypeId: category === 'Lazer' ? null : 'Ammo_5_56',
    targetFaction: 'ENEMY',
    damageType: category === 'Lazer' ? 'Lazer' : 'Bullet',
    reloadType: reloadTypeForCategory(category),
    muzzleLeadSec: 0.02,
    projectileRadius: 9,
    aiFireRangePath: 0.75,
    bulletSpeedPxSec: 1600,
    pierceUnits: 0,
    pelletCount: category === 'Shotgun' ? 5 : 1,
    burstCount: category === 'Burst' ? 3 : 1,
    burstIntervalSec: 0.06,
    beamDurationSec: category === 'Lazer' ? 1 : 0,
    artId: '',
    bulletArtId: '',
    shotFrameArtId: '',
    previewHost: 'unit',
  });
  ensureWeaponArtId(record);
  if (!isTurretWeaponRecord(record)) delete record.shotFrameArtId;
}

export function itemHeadings() {
  return Object.keys(ITEM_FIELDS);
}

export function skillEffectNames() {
  return Object.keys(EFFECT);
}

const LOCKED_BACKPACK_IDS = {
  Backpack_T1: true,
  Backpack_T2: true,
  Backpack_T3: true,
  BACKPACK_T1: true,
  BACKPACK_T2: true,
  BACKPACK_T3: true,
};

export function isLockedBackpack(record) {
  return !!(record && !record.pending && LOCKED_BACKPACK_IDS[record.id]);
}

function isEnergyShieldRecord(record) {
  if (!record) return false;
  if (record.shieldVariant === 'ENERGY' || record.itemKind === 'Shield Energy') return true;
  const art = String(record.artId || '');
  const id = String(record.id || '');
  return /Enegy|Energy/i.test(art) || /ENERGY/i.test(id);
}

/** Display / rail category for an item record. */
export function itemCategory(record) {
  if (record.kind === 'WEAPON') return 'Weapon';
  if (
    record.kind === 'RESOURCE' ||
    record.kind === 'AMMO' ||
    record.typeId === 'AMMO' ||
    record.typeId === 'RESOURCE'
  ) {
    return 'Resource';
  }
  if (record.kind === 'TOOL') return 'Tool';
  if (record.kind === 'BACKPACK') return 'Backpack';
  if (record.kind === 'VEHICLE' || record.isVehicle) return 'Vehicle';
  if (record.kind === 'ARMOR') {
    if (record.itemKind === 'Helmet' || record.armorSlot === 'TOP') return 'Helmet';
    return 'Vest';
  }
  if (record.kind === 'SHIELD') {
    return isEnergyShieldRecord(record) ? 'Shield Energy' : 'Shield';
  }
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
  if (category === 'Armor') return ITEM_FIELDS.Vest;
  return ITEM_FIELDS[category];
}

/** Apply Kind → runtime kind + hidden armorSlot / shieldVariant. */
function applyWearKind(record, category) {
  record.itemKind = category;
  if (category === 'Vest') {
    record.kind = 'ARMOR';
    record.armorSlot = 'VEST';
    delete record.shieldVariant;
  } else if (category === 'Helmet') {
    record.kind = 'ARMOR';
    record.armorSlot = 'TOP';
    delete record.shieldVariant;
  } else if (category === 'Shield') {
    record.kind = 'SHIELD';
    record.shieldVariant = 'BASIC';
    delete record.armorSlot;
  } else if (category === 'Shield Energy') {
    record.kind = 'SHIELD';
    record.shieldVariant = 'ENERGY';
    delete record.armorSlot;
  }
}

function applyItem(record, category) {
  if (category === 'Wire' || category === 'Heal') category = 'Block';
  if (category === 'Armor') category = 'Vest';
  const fields = storedItemKeys(category);
  const wear = isArmorTabKind(category);
  const placeable =
    !!fields &&
    category !== 'Ammo' &&
    category !== 'Weapon' &&
    category !== 'Resource' &&
    category !== 'Tool' &&
    !wear &&
    category !== 'Backpack' &&
    category !== 'Vehicle';
  if (category === 'Ammo') record.kind = 'RESOURCE';
  else if (category === 'Vehicle') {
    record.kind = 'VEHICLE';
    record.isVehicle = true;
  } else if (wear) {
    applyWearKind(record, category);
  } else if (placeable) {
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
  const defaultArt = artIdsForCategory(category, record)[0] || '';
  ensure(record, fields || ITEM_FIELDS.Block, {
    label: record.id || '',
    color: '#8a8a8a',
    typeId: category === 'Ammo' ? 'RESOURCE' : category.toUpperCase(),
    maxStack: category === 'Resource' || category === 'Ammo' ? 64 : 1,
    maxHp: category === 'Vehicle' ? 400 : 100,
    armorType: 'DEFAULT',
    skillId: '',
    pierceCost: 1,
    walkSolid: true,
    projectileSolid: true,
    allowProjectilePass: false,
    canToggle: category === 'Door',
    blocksProjectiles: true,
    weaponId: category === 'Vehicle' ? 'AK47' : '',
    detectRadius: category === 'Vehicle' ? 420 : 256,
    infiniteAmmo: false,
    priorityScore: 5,
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
    damageReduction: category === 'Helmet' ? 0.1 : 0.2,
    markerColor: '#7a9ab0',
    artId: defaultArt,
    speed: 220,
    turnRateRadPerSec: 2.4,
    mobilityHpRatio: 0.45,
    mobilityRepairChance: 0.55,
    brokenClearSec: 60,
    driverProtection: {
      allowPierce: true,
      absorbRatio: 0,
      explosionFactor: 1,
    },
    startUnitDriven: '',
    resistPercent: { DEFAULT: 0, BULLET: 0, EXPLOSION: 0, LAZER: 0 },
    shieldMaxHp: category === 'Shield Energy' ? 120 : 100,
    shieldRadius: 35,
    shieldOffset: 42,
    shieldPierceCost: 1,
    shieldAbsorbRatio: 1,
    shieldRegenPerSec: category === 'Shield Energy' ? 4 : 0,
    backpackTier: 1,
    backpackBonusSlots: 2,
  });
  if (category === 'Vehicle') {
    if (!record.artId) record.artId = 'Vehicle_ArmorCar_1';
    record.modelId = modelIdFromVehicleArt(record.artId);
  }
  if (wear && !record.artId) record.artId = defaultArt;
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
  if (key === 'skillId') {
    const row = createDefaultSkillRecord('', category || 'Damage');
    row.pending = true;
    row.pendingCategory = category || 'MELEE_SWING';
    row.kind = 'skill';
    return row;
  }
  return { id: '', pending: true, pendingCategory: category || 'MELEE_SWING', kind: 'skill' };
}

function kindNote(parent, text) {
  const note = document.createElement('p');
  note.className = 'editor-note';
  note.textContent = toReadableLabel(text) || text;
  parent.appendChild(note);
}

function deleteButton(ctx, id) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'is-delete-record';
  button.textContent = 'Delete';
  button.addEventListener('click', async () => {
    const yes = ctx.confirm
      ? await ctx.confirm('Delete ' + id + '? This id and its side tab will be removed.')
      : false;
    if (!yes) return;
    if (ctx.remove) ctx.remove(id);
  });
  return button;
}

export function finishDraft(key, record) {
  const category = record.pendingCategory;
  if (key === 'weaponId') {
    if (category === 'Melee') {
      record.kind = 'TOOL';
      applyItem(record, 'Tool');
    } else applyWeapon(record, category || 'Normal');
  } else if (key === 'itemId') applyItem(record, category || 'Block');
  else {
    applyEffect(record, category || 'MELEE_SWING');
    ensureSkillRecord(record);
    record.kind = 'skill';
  }
  delete record.pending;
  delete record.pendingCategory;
}

function normalizedWeaponDraftType(pendingCategory) {
  if (pendingCategory === 'Melee' || pendingCategory === 'Tool') return 'Melee';
  if (pendingCategory === 'Shotgun' || pendingCategory === 'Burst' || pendingCategory === 'Lazer') return pendingCategory;
  return 'Normal';
}

function renderDraft(body, key, record, ctx) {
  if (key === 'weaponId') {
    const draftType = normalizedWeaponDraftType(record.pendingCategory);
    record.pendingCategory = draftType;
    body.appendChild(categorySelect('Type', WEAPON_TYPES, draftType, (next) => {
      record.pendingCategory = next;
      if (ctx.touch) ctx.touch(true);
    }));
  } else if (key === 'itemId') {
    let category = record.pendingCategory || 'Block';
    if (category === 'Wire' || category === 'Heal') {
      category = 'Block';
      record.pendingCategory = 'Block';
    }
    if (category === 'Armor') {
      category = 'Vest';
      record.pendingCategory = 'Vest';
    }
    if (isBlockTabKind(category)) {
      body.appendChild(categorySelect('Kind', BLOCK_TAB_KINDS, category, (next) => {
        record.pendingCategory = next;
        if (next !== 'Base' && next !== 'Turret') delete record.artId;
        if (ctx.touch) ctx.touch(true);
      }));
    } else if (isArmorTabKind(category)) {
      body.appendChild(categorySelect('Kind', ARMOR_TAB_KINDS, category, (next) => {
        record.pendingCategory = next;
      }));
    } else {
      kindNote(body, category);
    }
    // Base / Turret: pick artId before Apply (pivot layout lives on the art).
    if (category === 'Base' || category === 'Turret') {
      const artIds = artIdsForCategory(category, record);
      const note = document.createElement('p');
      note.className = 'editor-note';
      note.textContent =
        category === 'Base'
          ? 'Art Id required — Base art has 4× Pivot_turrent for weapon snap.'
          : 'Art Id required — Turret art has 1× Pivot_turrent for weapon snap.';
      body.appendChild(note);
      const preferred =
        category === 'Base'
          ? 'Block_Base'
          : category === 'Turret'
            ? 'Block_Turrent_1'
            : '';
      const artValue =
        record.artId && artIds.indexOf(record.artId) >= 0
          ? record.artId
          : artIds.indexOf(preferred) >= 0
            ? preferred
            : artIds[0] || '';
      if (artValue && !record.artId) record.artId = artValue;
      body.appendChild(categorySelect('Art Id', artIds, record.artId || artValue, (next) => {
        record.artId = next;
        if (ctx.trailPreview) ctx.trailPreview('artGroup', next);
        if (ctx.touch) ctx.touch(false);
      }));
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
    if (
      key === 'itemId' &&
      (record.pendingCategory === 'Base' || record.pendingCategory === 'Turret') &&
      !(record.artId && String(record.artId).trim())
    ) {
      if (ctx.setFieldHelp) {
        ctx.setFieldHelp('Pick Art Id before Apply (pivot snap depends on art).', {
          warn: true,
        });
      }
      return;
    }
    finishDraft(key, record);
    if (ctx.afterApply) ctx.afterApply(record);
    else ctx.touch(true);
  });
  body.appendChild(apply);
  body.appendChild(deleteButton(ctx, record.id));
}

/**
 * Resist % column (DEFAULT / BULLET / …). Used inside the modal only —
 * Settings just opens the panel (no duplicate inline fields).
 */
function renderResistPercentColumn(parent, record, ctx) {
  const damageTypes = Array.isArray(ctx.damageTypes) && ctx.damageTypes.length
    ? ctx.damageTypes
    : ['DEFAULT', 'BULLET', 'EXPLOSION', 'LAZER'];
  if (!record.resistPercent || typeof record.resistPercent !== 'object' || Array.isArray(record.resistPercent)) {
    record.resistPercent = {};
  }
  for (let i = 0; i < damageTypes.length; i++) {
    if (record.resistPercent[damageTypes[i]] == null) record.resistPercent[damageTypes[i]] = 0;
  }

  const col = document.createElement('div');
  col.className = 'editor-resist-column';
  for (let i = 0; i < damageTypes.length; i++) {
    const typeName = damageTypes[i];
    const cell = document.createElement('label');
    cell.className = 'editor-resist-cell';
    cell.textContent = typeName + ' %';
    const input = document.createElement('input');
    input.type = 'number';
    input.step = 'any';
    input.value = String(record.resistPercent[typeName] || 0);
    input.addEventListener('change', () => {
      record.resistPercent[typeName] = Number(input.value) || 0;
      ctx.touch(false);
    });
    cell.appendChild(input);
    col.appendChild(cell);
  }
  parent.appendChild(col);
}

function openItemResistModal(record, ctx, damageTypes) {
  const modal = document.getElementById('editor-matrix-modal');
  const body = document.getElementById('editor-matrix-body');
  const title = modal && modal.querySelector('h2');
  if (!modal || !body) return;
  if (title) title.textContent = 'Resist % · ' + (record.id || 'Item');
  body.replaceChildren();
  const note = document.createElement('p');
  note.className = 'editor-note';
  note.textContent =
    'ลดดาเมจเพิ่มเติมจากค่าที่ผ่าน Damage × Armor Matrix แล้ว (Final = Base × Matrix × (1 − Resist%/100)).';
  body.appendChild(note);
  renderResistPercentColumn(body, record, ctx);
  modal.hidden = false;
  const restore = () => {
    if (title && title.dataset.prevTitle != null) {
      title.textContent = title.dataset.prevTitle;
      delete title.dataset.prevTitle;
    }
    modal.hidden = true;
  };
  if (title) title.dataset.prevTitle = title.dataset.prevTitle || title.textContent || '';
  const done = document.getElementById('editor-matrix-done');
  const close = document.getElementById('editor-matrix-close');
  if (done) {
    done.onclick = () => {
      restore();
      if (ctx && ctx.touch) ctx.touch(false);
    };
  }
  if (close) close.onclick = restore;
}

/** Settings: open Resist panel only — no inline duplicate fields. */
function renderResistOpenButton(parent, record, ctx) {
  if (!record.resistPercent || typeof record.resistPercent !== 'object') {
    record.resistPercent = { DEFAULT: 0, BULLET: 0, EXPLOSION: 0, LAZER: 0 };
  }
  const damageTypes = Array.isArray(ctx.damageTypes) && ctx.damageTypes.length
    ? ctx.damageTypes
    : ['DEFAULT', 'BULLET', 'EXPLOSION', 'LAZER'];
  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.textContent = 'Edit Resist %';
  openBtn.title = 'Open Resist % panel';
  openBtn.addEventListener('click', () => openItemResistModal(record, ctx, damageTypes));
  parent.appendChild(openBtn);
}

function renderArmorExtra(parent, record, ctx) {
  renderResistOpenButton(parent, record, ctx);
  const bonus = document.createElement('label');
  bonus.textContent = 'bonusHp';
  const input = document.createElement('input');
  input.type = 'number';
  input.value = String(record.bonusHp || 0);
  input.addEventListener('change', () => {
    record.bonusHp = Number(input.value) || 0;
    ctx.touch(false);
  });
  bonus.appendChild(input);
  parent.appendChild(bonus);
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

function syncVehicleModelFromArt(record) {
  if (!record) return;
  record.modelId = modelIdFromVehicleArt(record.artId);
}

/** Keep Vest/Helmet/Vehicle/Block resist + armorSlot contracts current. */
export function migrateItemRecord(record) {
  if (!record || record.pending) return;
  const kind = itemCategory(record);
  if (kind === 'Helmet') {
    record.kind = 'ARMOR';
    record.armorSlot = 'TOP';
    record.itemKind = 'Helmet';
  } else if (kind === 'Vest' || (record.kind === 'ARMOR' && record.armorSlot !== 'TOP')) {
    if (kind === 'Vest' || record.itemKind === 'Vest') {
      record.kind = 'ARMOR';
      record.armorSlot = 'VEST';
      record.itemKind = 'Vest';
    }
  }
  if (
    kind === 'Vehicle' ||
    kind === 'Base' ||
    kind === 'Turret' ||
    kind === 'Block' ||
    kind === 'Vest' ||
    kind === 'Helmet'
  ) {
    if (!record.resistPercent || typeof record.resistPercent !== 'object') {
      record.resistPercent = { DEFAULT: 0, BULLET: 0, EXPLOSION: 0, LAZER: 0 };
    }
  }
  if (kind === 'Vehicle') {
    if (record.turnRateRadPerSec != null) {
      record.turnRateRadPerSec = Number(record.turnRateRadPerSec) || 0;
    }
    if (record.speedMax == null && record.speed != null) {
      record.speedMax = record.speed;
    }
    if (!record.armorType) record.armorType = 'DEFAULT';
  }
}

function renderSkillForm(body, record, ctx) {
  ensureSkillRecord(record);
  kindNote(body, 'Skill');
  appendDivider(body);
  appendSectionTitle(body, 'General');
  renderRecord(body, record, record, Object.assign({}, ctx, {
    only: ['id', 'label', 'artId'],
  }));
  body.appendChild(categorySelect('Target Type', SKILL_TARGET_TYPES, record.targetType || 'Enemy', (next) => {
    record.targetType = next;
    if (ctx.touch) ctx.touch(false);
  }));
  appendDivider(body);
  appendSectionTitle(body, 'Timing & Range');
  renderRecord(body, record, record, Object.assign({}, ctx, {
    only: ['cooldownSec', 'castTimeSec', 'castRangeBlocks', 'effectRadiusBlocks'],
  }));
  const unitNote = document.createElement('p');
  unitNote.className = 'editor-note';
  unitNote.textContent = 'Ranges in blocks (1 block = ' + BLOCK_SIZE + 'px). Timing in seconds.';
  body.appendChild(unitNote);
  appendDivider(body);
  appendSectionTitle(body, 'Effect');
  body.appendChild(categorySelect('Effect Type', SKILL_EFFECT_TYPES, record.effectType || 'Damage', (next) => {
    record.effectType = next;
    if (ctx.touch) ctx.touch(false);
  }));
  renderRecord(body, record, record, Object.assign({}, ctx, {
    only: ['power', 'durationSec'],
  }));
  // Keep legacy effect blob in sync for runtime readers.
  if (!record.effect || typeof record.effect !== 'object') record.effect = {};
  record.effect.type =
    record.effectType === 'Heal'
      ? 'HEAL_SELF'
      : record.effectType === 'Buff'
        ? 'SPEED_BOOST'
        : record.effectType === 'Spawn'
          ? 'PASS_THROUGH'
          : 'MELEE_SWING';
  if (record.effectType === 'Damage' || record.effectType === 'Heal') {
    record.effect.damage = record.power;
    record.effect.amount = record.power;
  }
  record.activeDurationSec = record.durationSec;
  appendDivider(body);
  body.appendChild(deleteButton(ctx, record.id));
}

export function renderTyped(body, key, record, ctx) {
  if (record.pending) {
    renderDraft(body, key, record, ctx);
    return;
  }
  if (key === 'skillId') {
    renderSkillForm(body, record, ctx);
    return;
  }
  if (key === 'itemId') migrateItemRecord(record);
  if (key === 'weaponId') {
    const category = weaponCategory(record);
    record.reloadType = reloadTypeForCategory(category);
    ensureWeaponArtId(record);
    if (!record.previewHost) record.previewHost = 'unit';
    if (!isTurretWeaponRecord(record)) delete record.shotFrameArtId;
    kindNote(body, category);
    appendDivider(body);
    appendSectionTitle(body, 'Appearance & ID');
    body.appendChild(categorySelect('Hold', HOLD_STYLES, shownWeaponHold(record), (next) => {
      record.holdStyle = next;
      ctx.touch(true);
    }));
    const identityFields = isTurretWeaponRecord(record)
      ? WEAPON_IDENTITY_TURRET
      : WEAPON_IDENTITY;
    renderRecord(body, record, record, Object.assign({}, ctx, {
      only: identityFields,
      afterField: (fieldKey, next) => {
        if (fieldKey === 'artId') {
          record.model = next || '';
          if (!isTurretWeaponRecord(record)) delete record.shotFrameArtId;
          ctx.touch(true);
        }
        if (fieldKey === 'previewHost') ctx.touch(true);
      },
    }));
    appendDivider(body);
    appendSectionTitle(body, 'Ballistics');
    renderRecord(body, record, record, Object.assign({}, ctx, {
      only: WEAPON_BALLISTICS.concat(WEAPON_EXTRA[category] || WEAPON_EXTRA.Normal),
    }));
    appendDivider(body);
    appendSectionTitle(body, 'Ammo & Target');
    renderRecord(body, record, record, Object.assign({}, ctx, {
      only: WEAPON_AMMO,
    }));
    appendDivider(body);
    body.appendChild(deleteButton(ctx, record.id));
    return;
  }
  if (key === 'itemId') {
    const category = itemCategory(record);
    let fields = storedItemKeys(category) || ITEM_FIELDS.Block;
    if (!record.pending) {
      fields = fields.filter((name) => name !== 'typeId' && name !== 'modelId' && name !== 'armorSlot');
      // Base / Turret art locked at Apply — pivots come from that art.
      if (category === 'Base' || category === 'Turret') {
        fields = fields.filter((name) => name !== 'artId');
      }
    }
    if (category === 'Vehicle') syncVehicleModelFromArt(record);
    kindNote(
      body,
      isLockedBackpack(record)
        ? 'Backpack'
        : category === 'Tool'
          ? 'Melee (Tool)'
          : category
    );
    if ((category === 'Base' || category === 'Turret') && record.artId) {
      const locked = document.createElement('p');
      locked.className = 'editor-note';
      locked.textContent = 'Art locked at Apply: ' + record.artId;
      body.appendChild(locked);
    }
    if (category === 'Base' || category === 'Turret' || category === 'Vehicle') {
      const note = document.createElement('p');
      note.className = 'editor-note';
      note.textContent =
        category === 'Vehicle'
          ? 'Vehicle is unit-host (Tool Draw → Unit): hull + unit + weapon art from Weapon sheet at every Pivot_turrent.'
          : 'Weapon is shared across every Pivot_turrent on this art.';
      body.appendChild(note);
    }
    appendDivider(body);
    if (category === 'Weapon' && record.maxStack !== 1) record.maxStack = 1;
    const formCtx = Object.assign({}, ctx, {
      only: fields,
      lockMaxStack: category === 'Weapon',
      afterField: (fieldKey, next) => {
        if (fieldKey === 'artId' && category === 'Vehicle') {
          syncVehicleModelFromArt(record);
        }
      },
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
    const fieldsNoSkill = fields.filter((name) => name !== 'skillId');
    renderRecord(
      body,
      record,
      record,
      Object.assign({}, formCtx, { only: fieldsNoSkill })
    );
    if (category === 'Vest' || category === 'Helmet') {
      renderArmorExtra(body, record, ctx);
    }
    if (
      category === 'Vehicle' ||
      category === 'Base' ||
      category === 'Turret' ||
      category === 'Block'
    ) {
      appendDivider(body);
      renderResistOpenButton(body, record, ctx);
    }
    if (category === 'Shield' || category === 'Shield Energy') {
      const pierce = document.createElement('p');
      pierce.className = 'editor-note';
      pierce.textContent = 'The projectile requests the pierce. The shield charges shieldPierceCost.';
      body.appendChild(pierce);
    }
    if (fields.indexOf('skillId') >= 0) {
      appendDivider(body);
      renderBlockSkill(body, record, ctx);
    }
    appendDivider(body);
    body.appendChild(deleteButton(ctx, record.id));
  }
}

export {
  WEAPON_COMMON,
  WEAPON_BALLISTICS,
  WEAPON_AMMO,
  WEAPON_EXTRA,
  ITEM_FIELDS,
  SKILL_HEAD,
};

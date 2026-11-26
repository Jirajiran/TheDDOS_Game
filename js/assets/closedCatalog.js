/**
 * Closed art tier. Creators add model files here.
 * A map editor can only assign these ids. A missing id does not invent a file.
 * Sounds stay in data/pack/audio.json and play from Asset/AudioV2/.
 */

export const UNIT_TEMPLATE_FILE = 'Asset/AssetSVG/Unit/Unit_Template.svg';
/** Split art packs — load per domain (do not merge into one DOM). */
export const ITEM_HOLD_FILE = 'Asset/AssetSVG/Unit/ItemHold.svg';
export const VEHICLE_ART_FILE = 'Asset/AssetSVG/Unit/VehicleArt.svg';
export const BLOCK_ART_FILE = 'Asset/AssetSVG/Unit/BlockArt.svg';
export const ICON_ITEM_FILE = 'Asset/AssetSVG/Unit/IconItem.svg';

export const CLOSED_MODELS = Object.freeze({
  'model.unit.default_1': Object.freeze({
    id: 'model.unit.default_1',
    file: UNIT_TEMPLATE_FILE,
    groupId: 'Default_skin_1',
  }),
  'model.unit.default_2': Object.freeze({
    id: 'model.unit.default_2',
    file: UNIT_TEMPLATE_FILE,
    groupId: 'Default_skin_2',
  }),
  'model.unit.default_3': Object.freeze({
    id: 'model.unit.default_3',
    file: UNIT_TEMPLATE_FILE,
    groupId: 'Default_skin_3',
  }),
  'model.unit.default_4': Object.freeze({
    id: 'model.unit.default_4',
    file: UNIT_TEMPLATE_FILE,
    groupId: 'Default_skin_4',
  }),
  'model.unit.default_5': Object.freeze({
    id: 'model.unit.default_5',
    file: UNIT_TEMPLATE_FILE,
    groupId: 'Default_skin_5',
  }),
  'model.unit.default_6': Object.freeze({
    id: 'model.unit.default_6',
    file: UNIT_TEMPLATE_FILE,
    groupId: 'Default_skin_6',
  }),
  'model.vehicle.armor_car_1': Object.freeze({
    id: 'model.vehicle.armor_car_1',
    file: VEHICLE_ART_FILE,
    groupId: 'Vehicle_ArmorCar_1_Empty',
    artId: 'Vehicle_ArmorCar_1',
  }),
});

/** Head / hat overlays — wear on TOP armor slot (drawn over skin). */
export const ARMOR_TOP_ART_IDS = Object.freeze([
  'Asset_Top_CommandCap',
  'Asset_Top_Helmet_1',
  'Asset_Top_Helmet_3',
]);

/**
 * Body vest overlays — wear on VEST slot.
 * Arms inside vest are drawn ON TOP of skin arms (same pose matrices).
 */
export const ARMOR_VEST_ART_IDS = Object.freeze([
  'Asset_Arm_Vest_1',
  'Asset_Arm_Vest_2',
  'Asset_Arm_Vest_3',
]);

/** BlockArt.svg placeable groups (receive-side; ignore _FL). */
export const BLOCK_ART_IDS = Object.freeze([
  'Block_Wood',
  'Block_Stone',
  'Block_Iron',
  'Block_Base',
  'Block_Turrent_1',
  'Block_Turrent_2',
]);

/** Turret gun art in ItemHold — Weapon records, linked from Block.weaponId. */
export const WEAPON_TURRET_ART = Object.freeze({
  Weapon_Turrent_1: Object.freeze({
    group: 'Weapon_Turrent_1',
    shotFrame: 'Weapon_Turrent_1_Frame_shot',
  }),
  Weapon_Turrent_2: Object.freeze({
    group: 'Weapon_Turrent_2',
    shotFrame: 'Weapon_Turrent_2_Frame_shot',
  }),
  Weapon_Turrent_3: Object.freeze({
    group: 'Weapon_Turrent_3',
    shotFrame: 'Weapon_Turrent_3_Frame_shot',
  }),
});

/** Shield art groups in ItemHold (Energy on/off from shield HP). */
export const SHIELD_ART_IDS = Object.freeze({
  Item_shiled_Basic_1: 'Item_shiled_Basic_1',
  Item_shiled_Basic_2: 'Item_shiled_Basic_2',
  Item_shiled_Basic_3: 'Item_shiled_Basic_3',
  Item_shiled_Enegy: Object.freeze({
    on: 'Item_shiled_Enegy_on',
    off: 'Item_shiled_Enegy_off',
  }),
});

/** Projectile / tracer art for WeaponDef.bulletArtId — closed set only. */
export const BULLET_ART_IDS = Object.freeze([
  'Bullet_Rpg',
  'Bullet_Tracer_1',
  'Bullet_Tracer_2',
]);

export function getClosedModel(id) {
  if (!id) return null;
  return CLOSED_MODELS[id] || null;
}

export function closedModelGroupId(id) {
  const model = getClosedModel(id);
  return model ? model.groupId : '';
}

export function listClosedModelGroupIds() {
  const ids = [];
  const keys = Object.keys(CLOSED_MODELS);
  for (let i = 0; i < keys.length; i++) {
    const groupId = CLOSED_MODELS[keys[i]].groupId;
    if (groupId && ids.indexOf(groupId) < 0) ids.push(groupId);
  }
  return ids;
}

export function listUnitSkinModelIds() {
  return Object.keys(CLOSED_MODELS).filter((id) => id.indexOf('model.unit.') === 0);
}

export function listVehicleModelIds() {
  return Object.keys(CLOSED_MODELS).filter((id) => id.indexOf('model.vehicle.') === 0);
}

/** Normalize armor wear channel from item record. */
export function armorSlotOf(def) {
  if (!def) return 'VEST';
  const raw = String(def.armorSlot || '').toUpperCase();
  if (raw === 'TOP' || raw === 'HEAD' || raw === 'HAT') return 'TOP';
  // Editor Helmet tab may leave itemKind without armorSlot on older rows.
  if (String(def.itemKind || '') === 'Helmet' || String(def.kind || '') === 'Helmet') {
    return 'TOP';
  }
  return 'VEST';
}

export function listShieldArtIds() {
  return Object.keys(SHIELD_ART_IDS);
}

export function listWeaponTurretArtIds() {
  return Object.keys(WEAPON_TURRET_ART);
}

export function listWeaponShotFrameArtIds(weaponArtId) {
  const spec = WEAPON_TURRET_ART[weaponArtId];
  if (spec && spec.shotFrame) return [spec.shotFrame];
  const all = [];
  const keys = Object.keys(WEAPON_TURRET_ART);
  for (let i = 0; i < keys.length; i++) {
    const frame = WEAPON_TURRET_ART[keys[i]].shotFrame;
    if (frame && all.indexOf(frame) < 0) all.push(frame);
  }
  return all;
}

export function listShieldBasicArtIds() {
  return ['Item_shiled_Basic_1', 'Item_shiled_Basic_2', 'Item_shiled_Basic_3'];
}

export function listShieldEnergyArtIds() {
  // Editor starts with on only — off is a runtime play toggle, not a sheet pick.
  return ['Item_shiled_Enegy_on'];
}

/** Map vehicle art group → closed model id (single select drives both). */
export function modelIdFromVehicleArt(artId) {
  const id = String(artId || '');
  if (/ArmorCar_1/i.test(id) || id === 'Vehicle_ArmorCar_1') {
    return 'model.vehicle.armor_car_1';
  }
  return '';
}

/**
 * Catalog artId → real SVG group id for preview/load.
 * Vehicle sheet art is one logical id; SVG has Empty/Driven/… states.
 */
export function resolvePreviewArtGroupId(artId, opts) {
  const id = String(artId || '');
  const o = opts || {};
  if (!id) return '';
  if (id === 'Item_shiled_Enegy') return 'Item_shiled_Enegy_on';
  if (/^Vehicle_ArmorCar_1$/i.test(id) || id === 'Vehicle_ArmorCar_1') {
    return o.driven ? 'Vehicle_ArmorCar_1_Driven' : 'Vehicle_ArmorCar_1_Empty';
  }
  if (/^Vehicle_ArmorCar_1_(Empty|Driven|Mobility|Broken)$/i.test(id)) return id;
  return id;
}

/** Vehicle hull group for a catalog artId + state name. */
export function vehicleStateArtGroupId(artId, state) {
  const base = String(artId || 'Vehicle_ArmorCar_1').replace(
    /_(Empty|Driven|Mobility|Broken)$/i,
    ''
  );
  const st = state === 'Driven' || state === 'Mobility' || state === 'Broken' ? state : 'Empty';
  if (/ArmorCar_1/i.test(base)) return 'Vehicle_ArmorCar_1_' + st;
  return base + '_' + st;
}

/**
 * Art group ids for one Editor sheet category (never the whole catalog).
 * @param {string} category itemCategory / Weapon
 * @param {{ armorSlot?: string, artId?: string }} [opts]
 */
export function artIdsForCategory(category, opts) {
  const o = opts || {};
  if (category === 'Vest' || category === 'Armor') {
    return ARMOR_VEST_ART_IDS.slice();
  }
  if (category === 'Helmet') {
    return ARMOR_TOP_ART_IDS.slice();
  }
  if (
    category === 'Block' ||
    category === 'Door' ||
    category === 'Generator' ||
    category === 'Factory' ||
    category === 'Base' ||
    category === 'Turret'
  ) {
    return BLOCK_ART_IDS.slice();
  }
  if (category === 'Vehicle') return ['Vehicle_ArmorCar_1'];
  if (category === 'Shield') return listShieldBasicArtIds();
  if (category === 'Shield Energy') return listShieldEnergyArtIds();
  if (category === 'Weapon') {
    return listWeaponTurretArtIds();
  }
  // Legacy Armor with armorSlot
  if (category === 'Armor' && armorSlotOf(o) === 'TOP') {
    return ARMOR_TOP_ART_IDS.slice();
  }
  return [];
}

/** Closed model ids for Unit sheet vs Vehicle sheet. */
export function modelIdsForCategory(category) {
  if (category === 'Vehicle') return listVehicleModelIds();
  if (category === 'unit' || category === 'Unit') return listUnitSkinModelIds();
  return listUnitSkinModelIds();
}

/** Which SVG file hosts a closed art group. */
export function artFileForGroupId(groupId) {
  const id = String(groupId || '');
  if (!id) return UNIT_TEMPLATE_FILE;
  if (/^Default_skin|^Asset_Top_|^Asset_Arm_Vest_/i.test(id)) return UNIT_TEMPLATE_FILE;
  if (/^Vehicle_/i.test(id)) return VEHICLE_ART_FILE;
  if (/^Block_/i.test(id)) return BLOCK_ART_FILE;
  if (
    /^Weapon_|^Item_shiled|^Bullet_/i.test(id) ||
    /^Icon_/i.test(id)
  ) {
    return ITEM_HOLD_FILE;
  }
  return UNIT_TEMPLATE_FILE;
}

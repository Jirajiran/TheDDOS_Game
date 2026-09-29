/**
 * Spatial blueprint (world units) — Set A, power-of-2:
 * Path 1024 → L1 512 → L2 256 → L3 64 (16×16 place cells per Path).
 * Place / snap / occupancy / block footprints use L3 only.
 * Keep PATH_SIZE ≤ ~1024 so one Path fits web viewport with follow zoom.
 */
export const PATH_SIZE = 1024;
export const L1_SIZE = 512;
export const L2_SIZE = 256;
/** Place grid cell — Path 1024 → 16×16 L3 (8 cells to center). */
export const L3_SIZE = 64;

/** World = N×N Paths. Baseline 4 → 16 Paths (4096×4096). */
export const PATH_GRID_N = 4;

export const POOL_UNITS = 100;
export const POOL_PROJECTILES = 256;
export const POOL_DROPS = 128;

/** Debug Path fill palette (test mode look from AskKeep). */
export const PATH_DEBUG_COLORS = [
  '#3d6b4f',
  '#4a6b8a',
  '#8a6b3d',
  '#6b3d5a',
  '#3d6b6b',
  '#6b5a3d',
  '#4a4a8a',
  '#5a6b3d',
  '#6b3d3d',
];

export const AppState = Object.freeze({
  MENU: 'MENU',
  LOADING: 'LOADING',
  PLAYING: 'PLAYING',
  RESULT: 'RESULT',
});

export const GameMode = Object.freeze({
  FLAT_SURVIVAL: 'FLAT_SURVIVAL',
  WORLD_TYPE: 'WORLD_TYPE',
});

/** Team ids — player/ally vs enemies. */
export const TEAM = Object.freeze({
  NEUTRAL: 0,
  PLAYER: 1,
  ENEMY: 2,
  /** Reserved for future ally team id (maps to CollisionLayer.TEAM_3). */
  ALLY: 3,
});

/**
 * Collision layers (type n — NOT render Z).
 * Used by projectile/beam hit tests via hitMask bits — not draw order.
 * 1 GROUND · 2 NATURE · 3 TEAM_1 (player) · 4 TEAM_2 (enemy) · 5 TEAM_3 (ally) · 6 OTHER
 */
export const CollisionLayer = Object.freeze({
  GROUND: 1,
  NATURE: 2,
  TEAM_1: 3,
  TEAM_2: 4,
  TEAM_3: 5,
  OTHER: 6,
});

/** Bit for layer n (1-based): 1 << (n - 1). */
export function collisionLayerBit(layer) {
  const n = layer | 0;
  if (n < 1) return 0;
  return 1 << (n - 1);
}

export const CollisionLayerBits = Object.freeze({
  GROUND: collisionLayerBit(CollisionLayer.GROUND),
  NATURE: collisionLayerBit(CollisionLayer.NATURE),
  TEAM_1: collisionLayerBit(CollisionLayer.TEAM_1),
  TEAM_2: collisionLayerBit(CollisionLayer.TEAM_2),
  TEAM_3: collisionLayerBit(CollisionLayer.TEAM_3),
  OTHER: collisionLayerBit(CollisionLayer.OTHER),
});

/** Default projectile/beam hit masks (prefer over raw team === checks). */
export const HIT_MASK = Object.freeze({
  /** Player / player turrets: nature resources + enemies. */
  PLAYER_OFFENSE:
    CollisionLayerBits.NATURE | CollisionLayerBits.TEAM_2,
  /** Enemy shots: player team (+ nature if in path). */
  ENEMY_OFFENSE:
    CollisionLayerBits.TEAM_1 | CollisionLayerBits.NATURE,
  /** Heal / friendly beams. */
  FRIENDLY_HEAL:
    CollisionLayerBits.TEAM_1 | CollisionLayerBits.TEAM_3,
});

/**
 * Derive collisionLayer from team / harvest flags when not set explicitly.
 * @param {{ team?: number, isHarvest?: boolean, collisionLayer?: number, role?: string }} ent
 */
export function deriveCollisionLayer(ent) {
  if (!ent) return CollisionLayer.OTHER;
  if (typeof ent.collisionLayer === 'number') return ent.collisionLayer;
  if (ent.isHarvest || ent.team === TEAM.NEUTRAL) return CollisionLayer.NATURE;
  if (ent.team === TEAM.PLAYER || ent.role === 'player') {
    return CollisionLayer.TEAM_1;
  }
  if (ent.team === TEAM.ENEMY || ent.role === 'enemy') {
    return CollisionLayer.TEAM_2;
  }
  if (ent.team === TEAM.ALLY) return CollisionLayer.TEAM_3;
  return CollisionLayer.OTHER;
}

export function layerHitsMask(layer, mask) {
  if (mask == null) return true;
  return (collisionLayerBit(layer) & mask) !== 0;
}

/** Hit mask for a projectile/beam from team + weapon targetFaction. */
export function defaultProjectileHitMask(team, targetFaction) {
  if (targetFaction === 'FRIENDLY') return HIT_MASK.FRIENDLY_HEAL;
  if (team === TEAM.ENEMY) return HIT_MASK.ENEMY_OFFENSE;
  return HIT_MASK.PLAYER_OFFENSE;
}

/** Single autosave throttle while PLAYING (seconds). */
export const AUTOSAVE_INTERVAL_SEC = 45;

export const DamageType = Object.freeze({
  DEFAULT: 'DEFAULT',
  BULLET: 'BULLET',
  EXPLOSION: 'EXPLOSION',
  LAZER: 'LAZER',
});

export const ArmorType = Object.freeze({
  DEFAULT: 'DEFAULT',
  BULLET: 'BULLET',
  EXPLOSION: 'EXPLOSION',
  LAZER: 'LAZER',
});

export const ItemKind = Object.freeze({
  EMPTY: 'EMPTY',
  PLACEABLE: 'PLACEABLE',
  WEAPON: 'WEAPON',
  RESOURCE: 'RESOURCE',
  TOOL: 'TOOL',
});

export const ReloadType = Object.freeze({
  MAGAZINE: 'MAGAZINE',
  INDIVIDUAL_SHELL: 'INDIVIDUAL_SHELL',
});

/** AskKeep / plan damage mult table — row attack, column armor. */
export const DAMAGE_MULT_TABLE = Object.freeze({
  DEFAULT: Object.freeze({
    DEFAULT: 1.0,
    BULLET: 1.25,
    EXPLOSION: 0.9,
    LAZER: 0.75,
  }),
  BULLET: Object.freeze({
    DEFAULT: 1.25,
    BULLET: 0.75,
    EXPLOSION: 0.85,
    LAZER: 0.5,
  }),
  EXPLOSION: Object.freeze({
    DEFAULT: 1.4,
    BULLET: 0.9,
    EXPLOSION: 0.7,
    LAZER: 0.8,
  }),
  LAZER: Object.freeze({
    DEFAULT: 1.6,
    BULLET: 1.4,
    EXPLOSION: 1.1,
    LAZER: 0.6,
  }),
});

/**
 * Tool tier × harvest object mult (AskKeep §5).
 * Rows = tool tier id · columns = object type.
 */
export const TOOL_HARVEST_TABLE = Object.freeze({
  TIER0: Object.freeze({ TREE: 1, STONE: 1, ORE: 0, ORE_HIGH: 0 }),
  TIER1: Object.freeze({ TREE: 1, STONE: 1, ORE: 1, ORE_HIGH: 0.5 }),
});

/** Melee vs Wire gets 3× (plan). */
export const WIRE_MELEE_MULT = 3.0;

function weaponBase(partial) {
  return Object.freeze({
    projectileMode: 'PROJECTILE_RAYCAST',
    /** ~1/8 L3 — readable at Set A zoom; scales with place cell. */
    projectileRadius: Math.max(6, Math.round(L3_SIZE * 0.14)),
    pierceUnits: 0,
    pierceConfig: null,
    burstCount: 1,
    pelletCount: 1,
    reloadSec: 1.4,
    /** Never on shared defs for turrets — infiniteAmmo is block/fire-path flag. */
    infiniteAmmo: false,
    ammoTypeId: null,
    targetFaction: 'ENEMY',
    beamDurationSec: 0,
    ...partial,
  });
}

/**
 * Single WEAPON_REGISTRY — units hold weaponId; turrets/Base reuse the SAME id
 * with infiniteAmmo on the block / fire path (no TURRET_*_GUN duplicates).
 */
export const WEAPON_REGISTRY = Object.freeze({
  M1991: weaponBase({
    id: 'M1991',
    label: 'M1991',
    color: '#6b9fbf',
    baseDamage: 24,
    cooldownSec: 1.2,
    spreadDeg: 25,
    magCapacity: 30,
    maxMags: 4,
    ammoTypeId: 'AMMO_5_56',
    maxDistancePath: 1.0,
    bulletSpeedPxSec: PATH_SIZE,
    damageType: DamageType.BULLET,
    reloadType: ReloadType.MAGAZINE,
  }),
  SMG: weaponBase({
    id: 'SMG',
    label: 'SMG',
    color: '#7a9e6b',
    baseDamage: 24,
    cooldownSec: 0.6,
    spreadDeg: 45,
    magCapacity: 30,
    maxMags: 4,
    ammoTypeId: 'AMMO_5_56',
    maxDistancePath: 1.0,
    bulletSpeedPxSec: PATH_SIZE,
    damageType: DamageType.BULLET,
    reloadType: ReloadType.MAGAZINE,
    burstCount: 3,
  }),
  AK47: weaponBase({
    id: 'AK47',
    label: 'AK47',
    color: '#6b8a4a',
    baseDamage: 37,
    cooldownSec: 0.9,
    spreadDeg: 30,
    magCapacity: 30,
    maxMags: 4,
    ammoTypeId: 'AMMO_7_62',
    maxDistancePath: 1.5,
    bulletSpeedPxSec: PATH_SIZE * 0.78,
    damageType: DamageType.BULLET,
    reloadType: ReloadType.MAGAZINE,
  }),
  SHOTGUN_SHELL: weaponBase({
    id: 'SHOTGUN_SHELL',
    label: 'Shotgun Shell',
    color: '#bf8a5a',
    baseDamage: 12,
    cooldownSec: 1.2,
    spreadDeg: 75,
    magCapacity: 7,
    maxMags: 30,
    ammoTypeId: 'AMMO_SHELL',
    maxDistancePath: 0.5,
    bulletSpeedPxSec: PATH_SIZE * 0.73,
    damageType: DamageType.BULLET,
    reloadType: ReloadType.INDIVIDUAL_SHELL,
    pelletCount: 5,
    reloadSec: 0.55,
  }),
  SHOTGUN_BUCK: weaponBase({
    id: 'SHOTGUN_BUCK',
    label: 'Shotgun Buck',
    color: '#d4a060',
    baseDamage: 24,
    cooldownSec: 1.2,
    spreadDeg: 45,
    magCapacity: 3,
    maxMags: 30,
    ammoTypeId: 'AMMO_SHELL',
    maxDistancePath: 0.8,
    bulletSpeedPxSec: PATH_SIZE * 0.78,
    damageType: DamageType.BULLET,
    reloadType: ReloadType.INDIVIDUAL_SHELL,
    pelletCount: 5,
    reloadSec: 0.55,
  }),
  KAR98: weaponBase({
    id: 'KAR98',
    label: 'Kar98',
    color: '#8a6b4a',
    baseDamage: 90,
    cooldownSec: 2.0,
    spreadDeg: 5,
    magCapacity: 7,
    maxMags: 4,
    ammoTypeId: 'AMMO_7_62',
    maxDistancePath: 2.0,
    bulletSpeedPxSec: PATH_SIZE * 1.76,
    damageType: DamageType.BULLET,
    reloadType: ReloadType.MAGAZINE,
    pierceUnits: 2,
    pierceConfig: Object.freeze({
      maxUnitPierce: 2,
      blockPierceCost: Object.freeze({
        WALL_WOOD: 1,
        WALL_STONE: 2,
        WALL_IRON: 3,
        DOOR_WOOD: 1,
        DOOR_STONE: 2,
        DOOR_IRON: 3,
        WIRE_BLOCK: 1,
        OBJ_TREE: 1,
        OBJ_STONE: 1,
        OBJ_ORE: 1,
        DEFAULT_BLOCK: 1,
      }),
    }),
    reloadSec: 2.2,
  }),
  MEDIC_GUN: weaponBase({
    id: 'MEDIC_GUN',
    label: 'Medic Gun',
    color: '#5cbf8a',
    baseDamage: -60,
    cooldownSec: 3.0,
    spreadDeg: 5,
    magCapacity: 15,
    maxMags: 4,
    ammoTypeId: 'AMMO_MEDIC',
    maxDistancePath: 0.35,
    bulletSpeedPxSec: PATH_SIZE * 1.56,
    damageType: DamageType.DEFAULT,
    reloadType: ReloadType.MAGAZINE,
    targetFaction: 'FRIENDLY',
  }),
  LAZER_HEAL: weaponBase({
    id: 'LAZER_HEAL',
    label: 'Heal Beam',
    color: '#7dffb0',
    baseDamage: -12,
    cooldownSec: 0.9,
    spreadDeg: 0,
    magCapacity: 1,
    maxMags: 0,
    ammoTypeId: null,
    maxDistancePath: 0.35,
    bulletSpeedPxSec: 9999,
    damageType: DamageType.LAZER,
    reloadType: ReloadType.MAGAZINE,
    targetFaction: 'FRIENDLY',
    projectileMode: 'CONTINUOUS_BEAM',
    beamDurationSec: 3.0,
    infiniteAmmo: true,
  }),
  LAZER: weaponBase({
    id: 'LAZER',
    label: 'Lazer',
    color: '#ff6b9a',
    baseDamage: 12,
    cooldownSec: 2.0,
    spreadDeg: 0,
    magCapacity: 1,
    maxMags: 0,
    ammoTypeId: null,
    maxDistancePath: 2.5,
    bulletSpeedPxSec: 9999,
    damageType: DamageType.LAZER,
    reloadType: ReloadType.MAGAZINE,
    targetFaction: 'ENEMY',
    projectileMode: 'CONTINUOUS_BEAM',
    beamDurationSec: 5.0,
    infiniteAmmo: true,
  }),
  WEAPON_50CAL: weaponBase({
    id: 'WEAPON_50CAL',
    label: '50Cal',
    color: '#c4a35a',
    baseDamage: 90,
    cooldownSec: 0.9,
    spreadDeg: 5,
    magCapacity: 999,
    maxMags: 1,
    ammoTypeId: null,
    maxDistancePath: 2.5,
    bulletSpeedPxSec: PATH_SIZE * 1.95,
    damageType: DamageType.BULLET,
    reloadType: ReloadType.MAGAZINE,
  }),
  SMG_MODIFIED: weaponBase({
    id: 'SMG_MODIFIED',
    label: 'SMG+',
    color: '#8fbf6b',
    baseDamage: 27,
    cooldownSec: 0.5,
    spreadDeg: 30,
    magCapacity: 40,
    maxMags: 5,
    ammoTypeId: 'AMMO_5_56',
    maxDistancePath: 1.1,
    bulletSpeedPxSec: PATH_SIZE * 0.49,
    damageType: DamageType.BULLET,
    reloadType: ReloadType.MAGAZINE,
    burstCount: 4,
  }),
  AK47_MODIFIED: weaponBase({
    id: 'AK47_MODIFIED',
    label: 'AK47+',
    color: '#7a9a50',
    baseDamage: 45,
    cooldownSec: 0.7,
    spreadDeg: 25,
    magCapacity: 40,
    maxMags: 5,
    ammoTypeId: 'AMMO_7_62',
    maxDistancePath: 1.8,
    bulletSpeedPxSec: PATH_SIZE * 0.88,
    damageType: DamageType.BULLET,
    reloadType: ReloadType.MAGAZINE,
  }),
  SHOTGUN_SHELL_MODIFIED: weaponBase({
    id: 'SHOTGUN_SHELL_MODIFIED',
    label: 'Shotgun Shell+',
    color: '#cfa070',
    baseDamage: 20,
    cooldownSec: 0.9,
    spreadDeg: 75,
    magCapacity: 12,
    maxMags: 42,
    ammoTypeId: 'AMMO_SHELL',
    maxDistancePath: 0.65,
    bulletSpeedPxSec: PATH_SIZE * 0.83,
    damageType: DamageType.BULLET,
    reloadType: ReloadType.INDIVIDUAL_SHELL,
    pelletCount: 5,
    reloadSec: 0.45,
  }),
  SHOTGUN_BUCK_MODIFIED: weaponBase({
    id: 'SHOTGUN_BUCK_MODIFIED',
    label: 'Shotgun Buck+',
    color: '#e0b070',
    baseDamage: 35,
    cooldownSec: 0.9,
    spreadDeg: 30,
    magCapacity: 7,
    maxMags: 36,
    ammoTypeId: 'AMMO_SHELL',
    maxDistancePath: 1.0,
    bulletSpeedPxSec: PATH_SIZE * 0.88,
    damageType: DamageType.BULLET,
    reloadType: ReloadType.INDIVIDUAL_SHELL,
    pelletCount: 5,
    reloadSec: 0.45,
  }),
  KAR98_MODIFIED: weaponBase({
    id: 'KAR98_MODIFIED',
    label: 'Kar98+',
    color: '#a07850',
    baseDamage: 120,
    cooldownSec: 1.5,
    spreadDeg: 5,
    magCapacity: 7,
    maxMags: 4,
    ammoTypeId: 'AMMO_7_62',
    maxDistancePath: 2.5,
    bulletSpeedPxSec: PATH_SIZE * 2.15,
    damageType: DamageType.BULLET,
    reloadType: ReloadType.MAGAZINE,
    pierceUnits: 3,
    pierceConfig: Object.freeze({
      maxUnitPierce: 3,
      blockPierceCost: Object.freeze({
        WALL_WOOD: 1,
        WALL_STONE: 1,
        WALL_IRON: 2,
        DOOR_WOOD: 1,
        DOOR_STONE: 1,
        DOOR_IRON: 2,
        WIRE_BLOCK: 1,
        OBJ_TREE: 1,
        OBJ_STONE: 1,
        OBJ_ORE: 1,
        DEFAULT_BLOCK: 1,
      }),
    }),
  }),
});

/** Factory upgrade recipes (soft UX — swap weaponId after timer). */
export const WEAPON_UPGRADES = Object.freeze({
  SMG: Object.freeze({
    resultWeaponId: 'SMG_MODIFIED',
    upgradeTimeSec: 15,
  }),
  AK47: Object.freeze({
    resultWeaponId: 'AK47_MODIFIED',
    upgradeTimeSec: 20,
  }),
  SHOTGUN_SHELL: Object.freeze({
    resultWeaponId: 'SHOTGUN_SHELL_MODIFIED',
    upgradeTimeSec: 18,
  }),
  SHOTGUN_BUCK: Object.freeze({
    resultWeaponId: 'SHOTGUN_BUCK_MODIFIED',
    upgradeTimeSec: 18,
  }),
  KAR98: Object.freeze({
    resultWeaponId: 'KAR98_MODIFIED',
    upgradeTimeSec: 25,
  }),
});

/** Dogpile K in Score = priorityScore / (distance + attackers * K). */
export const TURRET_DOGPILE_K = 50;

function blockBase(partial) {
  return Object.freeze({
    kind: ItemKind.PLACEABLE,
    maxStack: 64,
    walkSolid: true,
    projectileSolid: true,
    allowProjectilePass: false,
    canToggle: false,
    isDefeatCondition: false,
    isTurret: false,
    isHeal: false,
    isGen: false,
    isFactory: false,
    isDoor: false,
    isWire: false,
    isHarvest: false,
    infiniteAmmo: false,
    priorityScore: 0,
    pierceCost: 1,
    team: TEAM.PLAYER,
    armorType: ArmorType.DEFAULT,
    ...partial,
  });
}

/** Block / placeable registry — footprint w/h are L3 cells (64u), not L2. */
export const BLOCK_REGISTRY = Object.freeze({
  /** BaseBlock placeable — 3×3 L3 (defeat condition). */
  BASE_CORE_3X3: blockBase({
    id: 'BASE_CORE_3X3',
    typeId: 'BASE_CORE',
    label: 'Base',
    color: '#c4a35a',
    footprint: Object.freeze({ w: 3, h: 3 }),
    maxHp: 1000,
    armorType: ArmorType.DEFAULT,
    isDefeatCondition: true,
    maxStack: 1,
    /** Shared WEAPON_50CAL — infiniteAmmo on block fire path. */
    weaponId: 'WEAPON_50CAL',
    infiniteAmmo: true,
    priorityScore: 120,
    pierceCost: 4,
    detectRadius: Math.round(PATH_SIZE * 0.75),
    /** Inherent multi-resource generators (plan §1.5). */
    generatorList: Object.freeze([
      Object.freeze({ itemId: 'WOOD', amount: 5, intervalSec: 30 }),
      Object.freeze({ itemId: 'STONE', amount: 3, intervalSec: 45 }),
      Object.freeze({ itemId: 'IRON', amount: 1, intervalSec: 90 }),
    ]),
  }),
  WALL_WOOD: blockBase({
    id: 'WALL_WOOD',
    typeId: 'WALL',
    label: 'Wood Wall',
    color: '#8b6914',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 250,
    armorType: ArmorType.DEFAULT,
    pierceCost: 1,
  }),
  WALL_STONE: blockBase({
    id: 'WALL_STONE',
    typeId: 'WALL',
    label: 'Stone Wall',
    color: '#7a7a7a',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 550,
    armorType: ArmorType.BULLET,
    pierceCost: 2,
  }),
  WALL_IRON: blockBase({
    id: 'WALL_IRON',
    typeId: 'WALL',
    label: 'Iron Wall',
    color: '#5a6a7a',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 800,
    armorType: ArmorType.BULLET,
    pierceCost: 3,
  }),
  DOOR_WOOD: blockBase({
    id: 'DOOR_WOOD',
    typeId: 'DOOR',
    label: 'Wood Door',
    color: '#a07830',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: Math.round(250 * 0.65),
    armorType: ArmorType.DEFAULT,
    canToggle: true,
    isDoor: true,
    pierceCost: 1,
  }),
  DOOR_STONE: blockBase({
    id: 'DOOR_STONE',
    typeId: 'DOOR',
    label: 'Stone Door',
    color: '#8a8a8a',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: Math.round(550 * 0.65),
    armorType: ArmorType.BULLET,
    canToggle: true,
    isDoor: true,
    pierceCost: 2,
  }),
  DOOR_IRON: blockBase({
    id: 'DOOR_IRON',
    typeId: 'DOOR',
    label: 'Iron Door',
    color: '#6a7a8a',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: Math.round(800 * 0.65),
    armorType: ArmorType.BULLET,
    canToggle: true,
    isDoor: true,
    pierceCost: 3,
  }),
  WIRE_BLOCK: blockBase({
    id: 'WIRE_BLOCK',
    typeId: 'WIRE',
    label: 'Wire',
    color: '#c8c060',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 150,
    armorType: ArmorType.DEFAULT,
    allowProjectilePass: true,
    projectileSolid: false,
    isWire: true,
    pierceCost: 1,
  }),
  /** Alias kept for loadout — shared M1991 + infiniteAmmo on block. */
  TURRET_PISTOL: blockBase({
    id: 'TURRET_PISTOL',
    typeId: 'TURRET',
    label: 'Turret M1911',
    color: '#4a7a9a',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 350,
    armorType: ArmorType.BULLET,
    isTurret: true,
    weaponId: 'M1991',
    infiniteAmmo: true,
    priorityScore: 30,
    pierceCost: 2,
    detectRadius: Math.round(PATH_SIZE * 0.8),
    maxStack: 8,
  }),
  TURRET_M1911: blockBase({
    id: 'TURRET_M1911',
    typeId: 'TURRET',
    label: 'Turret M1911',
    color: '#4a7a9a',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 350,
    armorType: ArmorType.BULLET,
    isTurret: true,
    weaponId: 'M1991',
    infiniteAmmo: true,
    priorityScore: 30,
    pierceCost: 2,
    detectRadius: Math.round(PATH_SIZE * 0.8),
    maxStack: 8,
  }),
  TURRET_50CAL: blockBase({
    id: 'TURRET_50CAL',
    typeId: 'TURRET',
    label: 'Turret 50Cal',
    color: '#9a7a4a',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 450,
    armorType: ArmorType.BULLET,
    isTurret: true,
    weaponId: 'WEAPON_50CAL',
    infiniteAmmo: true,
    priorityScore: 100,
    pierceCost: 3,
    detectRadius: PATH_SIZE,
    maxStack: 4,
  }),
  TURRET_SMG: blockBase({
    id: 'TURRET_SMG',
    typeId: 'TURRET',
    label: 'Turret SMG',
    color: '#5a8a5a',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 380,
    armorType: ArmorType.BULLET,
    isTurret: true,
    weaponId: 'SMG',
    infiniteAmmo: true,
    priorityScore: 50,
    pierceCost: 2,
    detectRadius: Math.round(PATH_SIZE * 0.85),
    maxStack: 6,
  }),
  TURRET_AK47: blockBase({
    id: 'TURRET_AK47',
    typeId: 'TURRET',
    label: 'Turret AK47',
    color: '#6a8a4a',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 420,
    armorType: ArmorType.BULLET,
    isTurret: true,
    weaponId: 'AK47',
    infiniteAmmo: true,
    priorityScore: 70,
    pierceCost: 2,
    detectRadius: Math.round(PATH_SIZE * 0.95),
    maxStack: 4,
  }),
  TURRET_LAZER: blockBase({
    id: 'TURRET_LAZER',
    typeId: 'TURRET',
    label: 'Turret Lazer',
    color: '#9a4a7a',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 500,
    armorType: ArmorType.BULLET,
    isTurret: true,
    weaponId: 'LAZER',
    infiniteAmmo: true,
    priorityScore: 90,
    pierceCost: 3,
    detectRadius: Math.round(PATH_SIZE * 1.1),
    maxStack: 2,
  }),
  HEAL_BLOCK: blockBase({
    id: 'HEAL_BLOCK',
    typeId: 'HEAL',
    label: 'Heal Pad',
    color: '#5cbf8a',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 300,
    armorType: ArmorType.DEFAULT,
    isHeal: true,
    healRadius: Math.round(L3_SIZE * 2.5),
    healPerSec: 12,
    maxStack: 4,
  }),
  GEN_WOOD: blockBase({
    id: 'GEN_WOOD',
    typeId: 'GEN',
    label: 'Wood Gen',
    color: '#6b8b3d',
    footprint: Object.freeze({ w: 2, h: 2 }),
    maxHp: 700,
    armorType: ArmorType.DEFAULT,
    isGen: true,
    genRate: Object.freeze({ itemId: 'WOOD', amount: 5, intervalSec: 50 }),
    maxStack: 2,
  }),
  GEN_STONE: blockBase({
    id: 'GEN_STONE',
    typeId: 'GEN',
    label: 'Stone Gen',
    color: '#6a6a6a',
    footprint: Object.freeze({ w: 2, h: 2 }),
    maxHp: 700,
    armorType: ArmorType.BULLET,
    isGen: true,
    genRate: Object.freeze({ itemId: 'STONE', amount: 3, intervalSec: 90 }),
    maxStack: 2,
  }),
  GEN_IRON: blockBase({
    id: 'GEN_IRON',
    typeId: 'GEN',
    label: 'Iron Gen',
    color: '#5a6a8a',
    footprint: Object.freeze({ w: 2, h: 2 }),
    maxHp: 750,
    armorType: ArmorType.BULLET,
    isGen: true,
    genRate: Object.freeze({ itemId: 'IRON', amount: 1, intervalSec: 180 }),
    maxStack: 2,
  }),
  FACTORY_WEAPON: blockBase({
    id: 'FACTORY_WEAPON',
    typeId: 'FACTORY',
    label: 'Factory',
    color: '#5a4a6a',
    footprint: Object.freeze({ w: 3, h: 3 }),
    maxHp: 800,
    armorType: ArmorType.BULLET,
    isFactory: true,
    maxStack: 1,
  }),
  /** World-gen harvestables (not hotbar placeables normally). */
  OBJ_TREE: blockBase({
    id: 'OBJ_TREE',
    typeId: 'HARVEST',
    label: 'Tree',
    color: '#2d6b3a',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 80,
    armorType: ArmorType.DEFAULT,
    isHarvest: true,
    harvestKind: 'TREE',
    dropItemId: 'WOOD',
    dropCount: 6,
    team: TEAM.NEUTRAL,
    pierceCost: 1,
    maxStack: 1,
  }),
  OBJ_STONE: blockBase({
    id: 'OBJ_STONE',
    typeId: 'HARVEST',
    label: 'Stone',
    color: '#6e6e6e',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 120,
    armorType: ArmorType.BULLET,
    isHarvest: true,
    harvestKind: 'STONE',
    dropItemId: 'STONE',
    dropCount: 4,
    team: TEAM.NEUTRAL,
    pierceCost: 1,
    maxStack: 1,
  }),
  OBJ_ORE: blockBase({
    id: 'OBJ_ORE',
    typeId: 'HARVEST',
    label: 'Ore',
    color: '#4a5a7a',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 160,
    armorType: ArmorType.BULLET,
    isHarvest: true,
    harvestKind: 'ORE',
    dropItemId: 'IRON',
    dropCount: 2,
    team: TEAM.NEUTRAL,
    pierceCost: 1,
    maxStack: 1,
  }),
});

export const ITEM_REGISTRY = Object.freeze({
  BASE_CORE_3X3: BLOCK_REGISTRY.BASE_CORE_3X3,
  WALL_WOOD: BLOCK_REGISTRY.WALL_WOOD,
  WALL_STONE: BLOCK_REGISTRY.WALL_STONE,
  WALL_IRON: BLOCK_REGISTRY.WALL_IRON,
  DOOR_WOOD: BLOCK_REGISTRY.DOOR_WOOD,
  DOOR_STONE: BLOCK_REGISTRY.DOOR_STONE,
  DOOR_IRON: BLOCK_REGISTRY.DOOR_IRON,
  WIRE_BLOCK: BLOCK_REGISTRY.WIRE_BLOCK,
  TURRET_PISTOL: BLOCK_REGISTRY.TURRET_PISTOL,
  TURRET_M1911: BLOCK_REGISTRY.TURRET_M1911,
  TURRET_50CAL: BLOCK_REGISTRY.TURRET_50CAL,
  TURRET_SMG: BLOCK_REGISTRY.TURRET_SMG,
  TURRET_AK47: BLOCK_REGISTRY.TURRET_AK47,
  TURRET_LAZER: BLOCK_REGISTRY.TURRET_LAZER,
  HEAL_BLOCK: BLOCK_REGISTRY.HEAL_BLOCK,
  GEN_WOOD: BLOCK_REGISTRY.GEN_WOOD,
  GEN_STONE: BLOCK_REGISTRY.GEN_STONE,
  GEN_IRON: BLOCK_REGISTRY.GEN_IRON,
  FACTORY_WEAPON: BLOCK_REGISTRY.FACTORY_WEAPON,
  M1991: Object.freeze({
    id: 'M1991',
    label: 'M1991',
    color: '#6b9fbf',
    kind: ItemKind.WEAPON,
    weaponId: 'M1991',
    maxStack: 1,
  }),
  SMG: Object.freeze({
    id: 'SMG',
    label: 'SMG',
    color: '#7a9e6b',
    kind: ItemKind.WEAPON,
    weaponId: 'SMG',
    maxStack: 1,
  }),
  AK47: Object.freeze({
    id: 'AK47',
    label: 'AK47',
    color: '#6b8a4a',
    kind: ItemKind.WEAPON,
    weaponId: 'AK47',
    maxStack: 1,
  }),
  SHOTGUN_SHELL: Object.freeze({
    id: 'SHOTGUN_SHELL',
    label: 'Shotgun Shell',
    color: '#bf8a5a',
    kind: ItemKind.WEAPON,
    weaponId: 'SHOTGUN_SHELL',
    maxStack: 1,
  }),
  SHOTGUN_BUCK: Object.freeze({
    id: 'SHOTGUN_BUCK',
    label: 'Shotgun Buck',
    color: '#d4a060',
    kind: ItemKind.WEAPON,
    weaponId: 'SHOTGUN_BUCK',
    maxStack: 1,
  }),
  KAR98: Object.freeze({
    id: 'KAR98',
    label: 'Kar98',
    color: '#8a6b4a',
    kind: ItemKind.WEAPON,
    weaponId: 'KAR98',
    maxStack: 1,
  }),
  MEDIC_GUN: Object.freeze({
    id: 'MEDIC_GUN',
    label: 'Medic Gun',
    color: '#5cbf8a',
    kind: ItemKind.WEAPON,
    weaponId: 'MEDIC_GUN',
    maxStack: 1,
  }),
  LAZER: Object.freeze({
    id: 'LAZER',
    label: 'Lazer',
    color: '#ff6b9a',
    kind: ItemKind.WEAPON,
    weaponId: 'LAZER',
    maxStack: 1,
  }),
  LAZER_HEAL: Object.freeze({
    id: 'LAZER_HEAL',
    label: 'Heal Beam',
    color: '#7dffb0',
    kind: ItemKind.WEAPON,
    weaponId: 'LAZER_HEAL',
    maxStack: 1,
  }),
  WEAPON_50CAL: Object.freeze({
    id: 'WEAPON_50CAL',
    label: '50Cal',
    color: '#c4a35a',
    kind: ItemKind.WEAPON,
    weaponId: 'WEAPON_50CAL',
    maxStack: 1,
  }),
  WOOD: Object.freeze({
    id: 'WOOD',
    label: 'Wood',
    color: '#8b6914',
    kind: ItemKind.RESOURCE,
    maxStack: 64,
  }),
  STONE: Object.freeze({
    id: 'STONE',
    label: 'Stone',
    color: '#8a8a8a',
    kind: ItemKind.RESOURCE,
    maxStack: 64,
  }),
  IRON: Object.freeze({
    id: 'IRON',
    label: 'Iron',
    color: '#5a6a8a',
    kind: ItemKind.RESOURCE,
    maxStack: 64,
  }),
  AMMO_5_56: Object.freeze({
    id: 'AMMO_5_56',
    label: '5.56 Mag',
    color: '#9ab07a',
    kind: ItemKind.RESOURCE,
    maxStack: 64,
  }),
  AMMO_7_62: Object.freeze({
    id: 'AMMO_7_62',
    label: '7.62 Mag',
    color: '#a09070',
    kind: ItemKind.RESOURCE,
    maxStack: 64,
  }),
  AMMO_SHELL: Object.freeze({
    id: 'AMMO_SHELL',
    label: 'Shells',
    color: '#bf8a5a',
    kind: ItemKind.RESOURCE,
    maxStack: 64,
  }),
  AMMO_MEDIC: Object.freeze({
    id: 'AMMO_MEDIC',
    label: 'Medic Ammo',
    color: '#5cbf8a',
    kind: ItemKind.RESOURCE,
    maxStack: 64,
  }),
  TOOL_AXE: Object.freeze({
    id: 'TOOL_AXE',
    label: 'Axe',
    color: '#a09060',
    kind: ItemKind.TOOL,
    toolTier: 'TIER0',
    maxStack: 1,
    harvestDamage: 25,
  }),
  TOOL_PICK: Object.freeze({
    id: 'TOOL_PICK',
    label: 'Pick',
    color: '#9090a0',
    kind: ItemKind.TOOL,
    toolTier: 'TIER1',
    maxStack: 1,
    harvestDamage: 30,
  }),
});

/** Craft panel category tabs (UI order). */
export const CRAFT_CATEGORIES = Object.freeze([
  'Block',
  'Gun',
  'Turret',
  'Ammo',
  'Gen',
  'Other',
]);

/**
 * Data-driven craft / buy recipes — costs deducted from player inventory.
 * Wire lives under Other (only wire for now).
 * Craft UI open = crafting state (MOVE only) — no CRAFT_ITEM action required.
 */
export const CRAFT_RECIPES = Object.freeze([
  // Block
  Object.freeze({
    id: 'craft_wall_wood',
    itemId: 'WALL_WOOD',
    category: 'Block',
    resultCount: 4,
    cost: Object.freeze({ WOOD: 3 }),
  }),
  Object.freeze({
    id: 'craft_wall_stone',
    itemId: 'WALL_STONE',
    category: 'Block',
    resultCount: 4,
    cost: Object.freeze({ STONE: 3 }),
  }),
  Object.freeze({
    id: 'craft_wall_iron',
    itemId: 'WALL_IRON',
    category: 'Block',
    resultCount: 2,
    cost: Object.freeze({ IRON: 3 }),
  }),
  Object.freeze({
    id: 'craft_door_wood',
    itemId: 'DOOR_WOOD',
    category: 'Block',
    resultCount: 1,
    cost: Object.freeze({ WOOD: 4 }),
  }),
  Object.freeze({
    id: 'craft_door_stone',
    itemId: 'DOOR_STONE',
    category: 'Block',
    resultCount: 1,
    cost: Object.freeze({ STONE: 4 }),
  }),
  Object.freeze({
    id: 'craft_door_iron',
    itemId: 'DOOR_IRON',
    category: 'Block',
    resultCount: 1,
    cost: Object.freeze({ IRON: 4 }),
  }),
  Object.freeze({
    id: 'craft_heal',
    itemId: 'HEAL_BLOCK',
    category: 'Block',
    resultCount: 1,
    cost: Object.freeze({ WOOD: 8, STONE: 4 }),
  }),
  // Gun
  Object.freeze({
    id: 'craft_smg',
    itemId: 'SMG',
    category: 'Gun',
    resultCount: 1,
    cost: Object.freeze({ IRON: 6, WOOD: 4 }),
  }),
  Object.freeze({
    id: 'craft_ak47',
    itemId: 'AK47',
    category: 'Gun',
    resultCount: 1,
    cost: Object.freeze({ IRON: 10, WOOD: 4 }),
  }),
  Object.freeze({
    id: 'craft_shotgun',
    itemId: 'SHOTGUN_SHELL',
    category: 'Gun',
    resultCount: 1,
    cost: Object.freeze({ IRON: 8, STONE: 4 }),
  }),
  Object.freeze({
    id: 'craft_shotgun_buck',
    itemId: 'SHOTGUN_BUCK',
    category: 'Gun',
    resultCount: 1,
    cost: Object.freeze({ IRON: 10, STONE: 6 }),
  }),
  Object.freeze({
    id: 'craft_kar98',
    itemId: 'KAR98',
    category: 'Gun',
    resultCount: 1,
    cost: Object.freeze({ IRON: 12, WOOD: 6 }),
  }),
  Object.freeze({
    id: 'craft_medic',
    itemId: 'MEDIC_GUN',
    category: 'Gun',
    resultCount: 1,
    cost: Object.freeze({ WOOD: 8, STONE: 4, IRON: 2 }),
  }),
  Object.freeze({
    id: 'craft_lazer',
    itemId: 'LAZER',
    category: 'Gun',
    resultCount: 1,
    cost: Object.freeze({ IRON: 20, STONE: 15 }),
  }),
  Object.freeze({
    id: 'craft_50cal',
    itemId: 'WEAPON_50CAL',
    category: 'Gun',
    resultCount: 1,
    cost: Object.freeze({ IRON: 25, STONE: 20 }),
  }),
  // Turret
  Object.freeze({
    id: 'craft_turret_pistol',
    itemId: 'TURRET_PISTOL',
    category: 'Turret',
    resultCount: 1,
    cost: Object.freeze({ STONE: 10, IRON: 1 }),
  }),
  Object.freeze({
    id: 'craft_turret_50cal',
    itemId: 'TURRET_50CAL',
    category: 'Turret',
    resultCount: 1,
    cost: Object.freeze({ STONE: 25, IRON: 10 }),
  }),
  Object.freeze({
    id: 'craft_turret_smg',
    itemId: 'TURRET_SMG',
    category: 'Turret',
    resultCount: 1,
    cost: Object.freeze({ STONE: 15, IRON: 4 }),
  }),
  Object.freeze({
    id: 'craft_turret_ak47',
    itemId: 'TURRET_AK47',
    category: 'Turret',
    resultCount: 1,
    cost: Object.freeze({ STONE: 20, IRON: 8 }),
  }),
  Object.freeze({
    id: 'craft_turret_lazer',
    itemId: 'TURRET_LAZER',
    category: 'Turret',
    resultCount: 1,
    cost: Object.freeze({ STONE: 50, IRON: 30 }),
  }),
  // Ammo
  Object.freeze({
    id: 'craft_ammo_556',
    itemId: 'AMMO_5_56',
    category: 'Ammo',
    resultCount: 1,
    cost: Object.freeze({ IRON: 1 }),
  }),
  Object.freeze({
    id: 'craft_ammo_762',
    itemId: 'AMMO_7_62',
    category: 'Ammo',
    resultCount: 1,
    cost: Object.freeze({ IRON: 2 }),
  }),
  Object.freeze({
    id: 'craft_ammo_shell',
    itemId: 'AMMO_SHELL',
    category: 'Ammo',
    resultCount: 15,
    cost: Object.freeze({ IRON: 1, STONE: 2 }),
  }),
  Object.freeze({
    id: 'craft_ammo_medic',
    itemId: 'AMMO_MEDIC',
    category: 'Ammo',
    resultCount: 15,
    cost: Object.freeze({ WOOD: 2, STONE: 2 }),
  }),
  // Gen
  Object.freeze({
    id: 'craft_gen_wood',
    itemId: 'GEN_WOOD',
    category: 'Gen',
    resultCount: 1,
    cost: Object.freeze({ WOOD: 20, STONE: 5 }),
  }),
  Object.freeze({
    id: 'craft_gen_stone',
    itemId: 'GEN_STONE',
    category: 'Gen',
    resultCount: 1,
    cost: Object.freeze({ STONE: 20, IRON: 5 }),
  }),
  Object.freeze({
    id: 'craft_gen_iron',
    itemId: 'GEN_IRON',
    category: 'Gen',
    resultCount: 1,
    cost: Object.freeze({ IRON: 15, STONE: 10 }),
  }),
  // Other
  Object.freeze({
    id: 'craft_wire',
    itemId: 'WIRE_BLOCK',
    category: 'Other',
    resultCount: 8,
    cost: Object.freeze({ WOOD: 2, IRON: 1 }),
  }),
]);

/**
 * Unit archetypes as DATA — Boss = stats + sizeScale 1.5, not a special JSON type.
 */
export const UNIT_ARCHETYPE_REGISTRY = Object.freeze({
  CLASS_BRIGADIER: Object.freeze({
    id: 'CLASS_BRIGADIER',
    hpRange: Object.freeze([100, 450]),
    defaultWeapon: 'SMG',
    armorType: ArmorType.DEFAULT,
    sizeScale: 1,
    meleeMultiplier: 1,
    aiBehavior: Object.freeze({
      preferredRange: 'MEDIUM_CLOSE',
      retreatHpRatio: 0.3,
    }),
  }),
  CLASS_ASSAULT: Object.freeze({
    id: 'CLASS_ASSAULT',
    hpRange: Object.freeze([450, 650]),
    defaultWeapon: 'AK47',
    armorType: ArmorType.BULLET,
    sizeScale: 1,
    meleeMultiplier: 1,
    aiBehavior: Object.freeze({
      preferredRange: 'MEDIUM',
      retreatHpRatio: 0.25,
    }),
  }),
  CLASS_QUARTER: Object.freeze({
    id: 'CLASS_QUARTER',
    hpRange: Object.freeze([450, 650]),
    defaultWeapon: 'SHOTGUN_SHELL',
    armorType: ArmorType.BULLET,
    sizeScale: 1,
    meleeMultiplier: 1.2,
    aiBehavior: Object.freeze({
      preferredRange: 'EXTREME_CLOSE',
      retreatHpRatio: 0.1,
      relentless: true,
    }),
  }),
  CLASS_SNIPER_CAMP: Object.freeze({
    id: 'CLASS_SNIPER_CAMP',
    hpRange: Object.freeze([250, 400]),
    defaultWeapon: 'KAR98',
    armorType: ArmorType.DEFAULT,
    sizeScale: 1,
    meleeMultiplier: 1,
    aiBehavior: Object.freeze({
      preferredRange: 'LONG_RANGE',
      retreatHpRatio: 0.5,
      fleeOnApproach: true,
    }),
  }),
  CLASS_SUPPORT_MEDIC: Object.freeze({
    id: 'CLASS_SUPPORT_MEDIC',
    hpRange: Object.freeze([300, 450]),
    defaultWeapon: 'MEDIC_GUN',
    armorType: ArmorType.DEFAULT,
    sizeScale: 1,
    meleeMultiplier: 1,
    aiBehavior: Object.freeze({
      preferredRange: 'LONG_SUPPORT',
      targetPriority: 'LOWEST_HP_FRIENDLY',
      retreatHpRatio: 0.4,
    }),
  }),
  CLASS_HIGH_RANK: Object.freeze({
    id: 'CLASS_HIGH_RANK',
    hpRange: Object.freeze([650, 850]),
    defaultWeapon: 'LAZER',
    armorType: ArmorType.EXPLOSION,
    sizeScale: 1,
    meleeMultiplier: 1.5,
    aiBehavior: Object.freeze({
      preferredRange: 'MEDIUM_CLOSE',
      retreatHpRatio: 0.05,
      relentless: true,
    }),
  }),
  CLASS_BOSS: Object.freeze({
    id: 'CLASS_BOSS',
    hpRange: Object.freeze([850, 1200]),
    defaultWeapon: 'AK47',
    armorType: ArmorType.LAZER,
    sizeScale: 1.5,
    isBoss: true,
    meleeMultiplier: 5.0,
    aiBehavior: Object.freeze({
      preferredRange: 'ALL_OUT_ATTACK',
      retreatHpRatio: 0.0,
      relentless: true,
    }),
  }),
});

/** Wave → archetype id (data-driven spawn). */
export const WAVE_ARCHETYPE_TABLE = Object.freeze([
  null,
  'CLASS_BRIGADIER',
  'CLASS_BRIGADIER',
  'CLASS_QUARTER',
  'CLASS_ASSAULT',
  'CLASS_SNIPER_CAMP',
  'CLASS_HIGH_RANK',
  'CLASS_BOSS',
]);

export const MEMENTO_STORAGE_KEY = 'wanttoplay_local_host_snapshot_v1';

export function getCraftRecipesByCategory(category) {
  return CRAFT_RECIPES.filter((r) => r.category === category);
}

export function getCraftRecipe(recipeId) {
  for (let i = 0; i < CRAFT_RECIPES.length; i++) {
    if (CRAFT_RECIPES[i].id === recipeId) return CRAFT_RECIPES[i];
  }
  return null;
}

/**
 * Flat / World Survival V1 pack rules.
 * Respawn: 10 + (wave - 1) * 5
 */
export const GAME_PACK = Object.freeze({
  targetWaveToWin: 7,
  setupPhaseDurationSec: 30,
  waveCountdownSec: 12,
  enemiesPerWaveBase: 3,
  enemiesPerWaveScale: 1,
  baseFootprintL3: 3,
  baseMaxHp: 1000,
  /** BaseChunk pad around BaseBlock (+2 L3 from original 2 → 4). */
  baseZonePaddingL3: 4,
  /**
   * Extra L3 cells beyond BaseChunk edges where enemies cannot spawn
   * (chunk size stays the same — this is spawn-only exclusion).
   */
  baseSpawnExclusionL3: 4,
  baseArmorType: ArmorType.DEFAULT,
  playerMaxHp: 100,
  playerSpeed: 200,
  /** Radii as fractions of L3 64 — unit ≈ ~0.45 place cell. */
  playerRadius: Math.round(L3_SIZE * 0.44),
  playerArmorType: ArmorType.DEFAULT,
  enemyMaxHp: 60,
  enemySpeed: 90,
  enemyRadius: Math.round(L3_SIZE * 0.38),
  enemyArmorType: ArmorType.DEFAULT,
  enemyContactDps: 12,
  enemyBaseContactDps: 18,
  enemyEngageRadius: Math.round(L3_SIZE * 6.5),
  enemyFireRadius: Math.round(L3_SIZE * 5.5),
  /** Ranged bots hold this distance — do not push into melee. */
  enemyPreferredRange: Math.round(L3_SIZE * 4),
  enemyRetreatHpRatio: 0.3,
  enemyStrafeSpeed: 70,
  /** General prepares this many spawn groups per wave (sequential paths). */
  waveGroupCount: 3,
  /**
   * Reach past block AABB edge (not center). Gen 2×2 / Base 3×3 stay usable when touching.
   */
  interactRadius: Math.round(L3_SIZE * 1.25),
  /** Tool/melee damage volume: depth ahead + half-width (facing-aligned box, not radial ring). */
  meleeReach: Math.round(L3_SIZE * 1.35),
  meleeHalfWidth: Math.round(L3_SIZE * 0.55),
  /** Max angular slew for aim / facing / turret gun (rad/sec). */
  aimTurnRateRadPerSec: Math.PI * 3.2,
  facingTurnRateRadPerSec: Math.PI * 4,
  turretTurnRateRadPerSec: Math.PI * 2.4,
  hotbarSlots: 10,
  unitPushSeparation: 0.85,
  /**
   * Default follow zoom (overridable in Cheat panel).
   * Player can tune 0.25–2.0 in steps of 0.1.
   */
  cameraFollowZoom: 1,
  cameraZoomMin: 0.25,
  cameraZoomMax: 2,
  cameraZoomStep: 0.1,
  /** Free-fly pan speed while dead (world units / sec). */
  cameraFreeFlySpeed: 520,
  respawnBaseSec: 10,
  respawnExtraPerWave: 5,
  dropExpireSec: 180,
  /** Per Path quotas — denser scatter on 16×16 L3. */
  worldGenPerPath: Object.freeze({
    trees: 10,
    stones: 6,
    ores: 2,
  }),
  startingLoadout: Object.freeze([
    Object.freeze({ itemId: 'BASE_CORE_3X3', count: 1 }),
    Object.freeze({ itemId: 'M1991', count: 1 }),
    Object.freeze({ itemId: 'WALL_WOOD', count: 20 }),
    Object.freeze({ itemId: 'DOOR_WOOD', count: 2 }),
    Object.freeze({ itemId: 'TURRET_PISTOL', count: 1 }),
    Object.freeze({ itemId: 'TURRET_50CAL', count: 1 }),
    Object.freeze({ itemId: 'GEN_WOOD', count: 1 }),
    Object.freeze({ itemId: 'AMMO_5_56', count: 4 }),
    Object.freeze({ itemId: 'TOOL_AXE', count: 1 }),
    Object.freeze({ itemId: 'WIRE_BLOCK', count: 12 }),
  ]),
  /** @deprecated prefer WAVE_ARCHETYPE_TABLE + UNIT_ARCHETYPE_REGISTRY */
  enemyWeaponByWave: Object.freeze([
    null,
    'SMG',
    'SMG',
    'SHOTGUN_SHELL',
    'AK47',
    'KAR98',
    'LAZER',
    'AK47',
  ]),
});

/** @deprecated use GAME_PACK.waveCountdownSec */
export const WAVE_COUNTDOWN_STUB_SEC = GAME_PACK.waveCountdownSec;

export function getDamageMult(damageType, armorType) {
  const row = DAMAGE_MULT_TABLE[damageType] || DAMAGE_MULT_TABLE.DEFAULT;
  const mult = row[armorType];
  return typeof mult === 'number' ? mult : 1;
}

export function getWeaponDef(weaponId) {
  return WEAPON_REGISTRY[weaponId] || null;
}

export function getBlockDef(blockId) {
  return BLOCK_REGISTRY[blockId] || null;
}

export function getItemDef(itemId) {
  return ITEM_REGISTRY[itemId] || null;
}

export function getUnitArchetype(archetypeId) {
  return UNIT_ARCHETYPE_REGISTRY[archetypeId] || null;
}

export function getArchetypeForWave(waveIndex) {
  const id =
    WAVE_ARCHETYPE_TABLE[
      Math.min(waveIndex, WAVE_ARCHETYPE_TABLE.length - 1)
    ] || 'CLASS_BRIGADIER';
  return getUnitArchetype(id);
}

export function getToolHarvestMult(toolTier, harvestKind) {
  const row = TOOL_HARVEST_TABLE[toolTier] || TOOL_HARVEST_TABLE.TIER0;
  const m = row[harvestKind];
  return typeof m === 'number' ? m : 0;
}

export function getUpgradeRecipe(weaponId) {
  return WEAPON_UPGRADES[weaponId] || null;
}

/**
 * Shared pierce budget for projectiles / beams (units + blocks spend the same pool).
 * Resolved from pierceConfig.maxUnitPierce or legacy pierceUnits.
 */
export function getPierceUnitBudget(weapon) {
  if (!weapon) return 0;
  if (weapon.pierceConfig && typeof weapon.pierceConfig.maxUnitPierce === 'number') {
    return weapon.pierceConfig.maxUnitPierce;
  }
  return weapon.pierceUnits || 0;
}

/** Pierce cost for a unit (default 1). */
export function getEntityPierceCost(ent) {
  if (!ent) return 1;
  if (typeof ent.pierceCost === 'number') return ent.pierceCost;
  return 1;
}

/** Block pierce cost for a placed block / harvest resource. */
export function getBlockPierceCost(weapon, block) {
  if (!block) return 999;
  const costs = weapon && weapon.pierceConfig && weapon.pierceConfig.blockPierceCost;
  if (costs) {
    if (typeof costs[block.itemId] === 'number') return costs[block.itemId];
    if (typeof costs.DEFAULT_BLOCK === 'number') return costs.DEFAULT_BLOCK;
  }
  return getEntityPierceCost(block);
}

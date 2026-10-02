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
  /** Page open — prefetch assets/modules before MENU is usable. */
  BOOT: 'BOOT',
  MENU: 'MENU',
  /** Match load — pools + world before PLAYING. */
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
  /** Single active armor slot on unit — equip new deactivates old. */
  ARMOR: 'ARMOR',
  /**
   * Single active shield slot (separate from armor).
   * Equip enables/refreshes unit.shield from item stats; ORs with archetype
   * hasPassiveShield (item wins while equipped; unequip restores passive).
   */
  SHIELD: 'SHIELD',
});

/**
 * Archetype preferredRange → standoff as fraction of weapon maxDistancePath.
 * Never invent a separate short L3 band; always scale from weapon range.
 */
export const PREFERRED_RANGE_MULT = Object.freeze({
  MELEE: 0.12,
  EXTREME_CLOSE: 0.22,
  CLOSE: 0.4,
  MEDIUM_CLOSE: 0.55,
  MEDIUM: 0.75,
  LONG_RANGE: 0.92,
  LONG_SUPPORT: 0.95,
  MAX_WEAPON_RANGE: 1.0,
});

/** Weapon fire / max reach in world px (same as sim projectile maxRange). */
export function getWeaponMaxRangePx(weapon) {
  if (!weapon) return 0;
  return (weapon.maxDistancePath || 1) * PATH_SIZE;
}

/** Standoff hold distance from weapon range × preferredRange mult. */
export function getPreferredStandoffPx(weapon, preferredRangeKey) {
  const max = getWeaponMaxRangePx(weapon);
  if (max <= 0) return 0;
  const key = preferredRangeKey || 'MEDIUM';
  const mult =
    typeof PREFERRED_RANGE_MULT[key] === 'number'
      ? PREFERRED_RANGE_MULT[key]
      : PREFERRED_RANGE_MULT.MEDIUM;
  return max * mult;
}

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
    /** Fire rate ×2 vs prior 1.2. Mag 9 + 3 spare mags → full load 9/27 rounds. */
    cooldownSec: 0.6,
    spreadDeg: 25,
    magCapacity: 9,
    maxMags: 4,
    ammoTypeId: 'AMMO_5_56',
    maxDistancePath: 1.0,
    /** Projectile speed ×2 (real bullets only; beams stay 9999). */
    bulletSpeedPxSec: PATH_SIZE * 2,
    damageType: DamageType.BULLET,
    reloadType: ReloadType.MAGAZINE,
  }),
  SMG: weaponBase({
    id: 'SMG',
    label: 'SMG',
    color: '#7a9e6b',
    baseDamage: 24,
    /** Fire rate ×2 vs prior 0.6. */
    cooldownSec: 0.3,
    spreadDeg: 45,
    magCapacity: 30,
    maxMags: 4,
    ammoTypeId: 'AMMO_5_56',
    maxDistancePath: 1.0,
    bulletSpeedPxSec: PATH_SIZE * 2,
    damageType: DamageType.BULLET,
    reloadType: ReloadType.MAGAZINE,
    burstCount: 3,
  }),
  AK47: weaponBase({
    id: 'AK47',
    label: 'AK47',
    color: '#6b8a4a',
    baseDamage: 37,
    /** Fire rate ×2 vs prior 0.9. */
    cooldownSec: 0.45,
    spreadDeg: 30,
    magCapacity: 30,
    maxMags: 4,
    ammoTypeId: 'AMMO_7_62',
    maxDistancePath: 1.5,
    bulletSpeedPxSec: PATH_SIZE * 1.56,
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
    bulletSpeedPxSec: PATH_SIZE * 1.46,
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
    spreadDeg: 10,
    magCapacity: 3,
    maxMags: 30,
    ammoTypeId: 'AMMO_SHELL',
    maxDistancePath: 0.8,
    bulletSpeedPxSec: PATH_SIZE * 1.56,
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
    bulletSpeedPxSec: PATH_SIZE * 3.52,
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
    bulletSpeedPxSec: PATH_SIZE * 3.12,
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
    /** Beam/hitscan — not projectile speed; leave unchanged. */
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
    /** Beam/hitscan — not projectile speed; leave unchanged. */
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
    bulletSpeedPxSec: PATH_SIZE * 3.9,
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
    bulletSpeedPxSec: PATH_SIZE * 0.98,
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
    bulletSpeedPxSec: PATH_SIZE * 1.76,
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
    bulletSpeedPxSec: PATH_SIZE * 1.66,
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
    spreadDeg: 10,
    magCapacity: 7,
    maxMags: 36,
    ammoTypeId: 'AMMO_SHELL',
    maxDistancePath: 1.0,
    bulletSpeedPxSec: PATH_SIZE * 1.76,
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
    bulletSpeedPxSec: PATH_SIZE * 4.3,
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
  /** Explosive projectile — AoE via explosionRadius (Phase 1 area groundwork). */
  GRENADE_LAUNCHER: weaponBase({
    id: 'GRENADE_LAUNCHER',
    label: 'Grenade Launcher',
    color: '#bf6b4a',
    baseDamage: 55,
    cooldownSec: 1.8,
    spreadDeg: 8,
    magCapacity: 4,
    maxMags: 3,
    ammoTypeId: 'AMMO_SHELL',
    maxDistancePath: 1.2,
    bulletSpeedPxSec: PATH_SIZE * 1.1,
    damageType: DamageType.EXPLOSION,
    reloadType: ReloadType.MAGAZINE,
    projectileRadius: Math.max(8, Math.round(L3_SIZE * 0.18)),
    explosionRadius: Math.round(L3_SIZE * 2.2),
    explosionDamage: 70,
    pierceUnits: 0,
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
    /** Blocks gun projectiles — fist/melee still effective (WIRE_MELEE_MULT). */
    allowProjectilePass: false,
    projectileSolid: true,
    blocksProjectiles: true,
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
    healFriendly: true,
    healRadius: Math.round(L3_SIZE * 2.5),
    healPerSec: 12,
    /** Area Trigger CONTINUOUS_TICK (heal pad). */
    areaMode: 'CONTINUOUS_TICK',
    triggerRadius: Math.round(L3_SIZE * 2.5),
    effectRadius: Math.round(L3_SIZE * 2.5),
    tickIntervalSec: 0.5,
    tickValue: 6,
    maxStack: 4,
  }),
  /** Proximity mine — ONE_SHOT AoE then self-destruct. */
  TRAP_MINE: blockBase({
    id: 'TRAP_MINE',
    typeId: 'TRAP',
    label: 'Mine',
    color: '#8a4a3a',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 80,
    armorType: ArmorType.EXPLOSION,
    walkSolid: false,
    allowProjectilePass: true,
    areaMode: 'ONE_SHOT',
    triggerRadius: Math.round(L3_SIZE * 1.1),
    effectRadius: Math.round(L3_SIZE * 2.5),
    explosionRadius: Math.round(L3_SIZE * 2.5),
    tickValue: 90,
    damageType: DamageType.EXPLOSION,
    tripHostile: true,
    maxStack: 8,
  }),
  /** Durability trap — ticks damage + self HP loss until broken. */
  TRAP_SPIKE: blockBase({
    id: 'TRAP_SPIKE',
    typeId: 'TRAP',
    label: 'Spike Trap',
    color: '#6a5a4a',
    footprint: Object.freeze({ w: 1, h: 1 }),
    maxHp: 200,
    armorType: ArmorType.DEFAULT,
    walkSolid: false,
    allowProjectilePass: true,
    areaMode: 'DURABILITY_TRAP',
    triggerRadius: Math.round(L3_SIZE * 0.85),
    effectRadius: Math.round(L3_SIZE * 0.85),
    tickIntervalSec: 0.5,
    tickValue: 18,
    selfDamageRatio: 0.25,
    damageType: DamageType.DEFAULT,
    maxStack: 8,
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
  TRAP_MINE: BLOCK_REGISTRY.TRAP_MINE,
  TRAP_SPIKE: BLOCK_REGISTRY.TRAP_SPIKE,
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
    structureDamage: 35,
    meleeRole: 'HARVEST_AXE',
    /** Open collider 0.1s then cooldown 0.2s. */
    activeDurationSec: 0.1,
    cooldownSec: 0.2,
  }),
  TOOL_PICK: Object.freeze({
    id: 'TOOL_PICK',
    label: 'Pick',
    color: '#9090a0',
    kind: ItemKind.TOOL,
    toolTier: 'TIER1',
    maxStack: 1,
    harvestDamage: 30,
    structureDamage: 30,
    meleeRole: 'HARVEST_AXE',
    activeDurationSec: 0.1,
    cooldownSec: 0.2,
  }),
  /** Repair wrench — friendly BLOCK/TURRET only; never heals living units. */
  TOOL_WRENCH: Object.freeze({
    id: 'TOOL_WRENCH',
    label: 'Wrench',
    color: '#7a8a9a',
    kind: ItemKind.TOOL,
    toolTier: 'TIER0',
    maxStack: 1,
    harvestDamage: 0,
    repairAmount: 45,
    meleeRole: 'REPAIR_WRENCH',
    activeDurationSec: 0.1,
    cooldownSec: 0.2,
  }),
  /** Light vest — single active armor slot (equip replaces previous). */
  ARMOR_VEST: Object.freeze({
    id: 'ARMOR_VEST',
    label: 'Armor Vest',
    color: '#5a6a7a',
    kind: ItemKind.ARMOR,
    maxStack: 1,
    damageReduction: 0.2,
    markerColor: '#7a9ab0',
  }),
  /** Handheld / equippable shield — single activeShieldId channel (not armor). */
  SHIELD_BASIC: Object.freeze({
    id: 'SHIELD_BASIC',
    label: 'Basic Shield',
    color: '#4a7a9a',
    kind: ItemKind.SHIELD,
    maxStack: 1,
    shieldMaxHp: 100,
    shieldRadius: Math.round(L3_SIZE * 0.55),
    shieldOffset: Math.round(L3_SIZE * 0.65),
    shieldPierceCost: 2,
    shieldAbsorbRatio: 1,
    shieldRegenPerSec: 4,
    markerColor: '#6a9ccc',
  }),
  GRENADE_LAUNCHER: Object.freeze({
    id: 'GRENADE_LAUNCHER',
    label: 'Grenade Launcher',
    color: '#bf6b4a',
    kind: ItemKind.WEAPON,
    weaponId: 'GRENADE_LAUNCHER',
    maxStack: 1,
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
  Object.freeze({
    id: 'craft_trap_mine',
    itemId: 'TRAP_MINE',
    category: 'Block',
    resultCount: 2,
    cost: Object.freeze({ IRON: 2, STONE: 2 }),
  }),
  Object.freeze({
    id: 'craft_trap_spike',
    itemId: 'TRAP_SPIKE',
    category: 'Block',
    resultCount: 2,
    cost: Object.freeze({ WOOD: 4, IRON: 1 }),
  }),
  // Gun
  Object.freeze({
    id: 'craft_m1991',
    itemId: 'M1991',
    category: 'Gun',
    resultCount: 1,
    cost: Object.freeze({ IRON: 4, WOOD: 2 }),
  }),
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
    id: 'craft_lazer_heal',
    itemId: 'LAZER_HEAL',
    category: 'Gun',
    resultCount: 1,
    cost: Object.freeze({ IRON: 12, WOOD: 8, STONE: 6 }),
  }),
  Object.freeze({
    id: 'craft_50cal',
    itemId: 'WEAPON_50CAL',
    category: 'Gun',
    resultCount: 1,
    cost: Object.freeze({ IRON: 25, STONE: 20 }),
  }),
  Object.freeze({
    id: 'craft_grenade_launcher',
    itemId: 'GRENADE_LAUNCHER',
    category: 'Gun',
    resultCount: 1,
    cost: Object.freeze({ IRON: 18, STONE: 10 }),
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
    id: 'craft_turret_m1911',
    itemId: 'TURRET_M1911',
    category: 'Turret',
    resultCount: 1,
    cost: Object.freeze({ STONE: 10, IRON: 2 }),
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
  // Other — tools, base, factory, wire, armor (raw WOOD/STONE/IRON omitted: harvest/gen only)
  Object.freeze({
    id: 'craft_base_core',
    itemId: 'BASE_CORE_3X3',
    category: 'Other',
    resultCount: 1,
    cost: Object.freeze({ WOOD: 30, STONE: 20, IRON: 10 }),
  }),
  Object.freeze({
    id: 'craft_factory',
    itemId: 'FACTORY_WEAPON',
    category: 'Other',
    resultCount: 1,
    cost: Object.freeze({ IRON: 15, STONE: 10, WOOD: 8 }),
  }),
  Object.freeze({
    id: 'craft_wire',
    itemId: 'WIRE_BLOCK',
    category: 'Other',
    resultCount: 8,
    cost: Object.freeze({ WOOD: 2, IRON: 1 }),
  }),
  Object.freeze({
    id: 'craft_axe',
    itemId: 'TOOL_AXE',
    category: 'Other',
    resultCount: 1,
    cost: Object.freeze({ WOOD: 4, IRON: 1 }),
  }),
  Object.freeze({
    id: 'craft_pick',
    itemId: 'TOOL_PICK',
    category: 'Other',
    resultCount: 1,
    cost: Object.freeze({ WOOD: 2, IRON: 3, STONE: 2 }),
  }),
  Object.freeze({
    id: 'craft_wrench',
    itemId: 'TOOL_WRENCH',
    category: 'Other',
    resultCount: 1,
    cost: Object.freeze({ IRON: 4, WOOD: 2 }),
  }),
  Object.freeze({
    id: 'craft_armor_vest',
    itemId: 'ARMOR_VEST',
    category: 'Other',
    resultCount: 1,
    cost: Object.freeze({ IRON: 8, STONE: 4 }),
  }),
  Object.freeze({
    id: 'craft_shield_basic',
    itemId: 'SHIELD_BASIC',
    category: 'Other',
    resultCount: 1,
    cost: Object.freeze({ IRON: 6, WOOD: 4, STONE: 2 }),
  }),
]);

/**
 * Active skill defs — CAST_SKILL resolves by skillId (data-driven).
 * Stages emit Actions only; they never branch on skill name strings.
 */
export const SKILL_REGISTRY = Object.freeze({
  /** Default melee on every unit — open volume 0.1s, then wait 0.3s. */
  FIST: Object.freeze({
    id: 'FIST',
    label: 'Fist',
    castTimeSec: 0,
    activeDurationSec: 0.1,
    cooldownSec: 0.3,
    effect: Object.freeze({
      type: 'MELEE_SWING',
      damage: 18,
      hitUnits: true,
      hitBlocks: true,
      /** Slash VFX size ≤ ~1 L3 cell. */
      vfxSize: Math.round(L3_SIZE * 0.85),
      color: '#e8dcc0',
    }),
  }),
  TAUNT_ROAR: Object.freeze({
    id: 'TAUNT_ROAR',
    label: 'Taunt Roar',
    castTimeSec: 0.35,
    activeDurationSec: 0.5,
    cooldownSec: 12,
    effect: Object.freeze({
      type: 'TAUNT_PULSE',
      radius: Math.round(L3_SIZE * 4.5),
      durationSec: 5,
    }),
  }),
  SPEED_BOOST: Object.freeze({
    id: 'SPEED_BOOST',
    label: 'Speed Boost',
    castTimeSec: 0,
    activeDurationSec: 3,
    cooldownSec: 10,
    effect: Object.freeze({
      type: 'SPEED_BOOST',
      speedMult: 1.35,
    }),
  }),
  SHIELD_OVERCHARGE: Object.freeze({
    id: 'SHIELD_OVERCHARGE',
    label: 'Shield Overcharge',
    castTimeSec: 0.2,
    activeDurationSec: 0.1,
    cooldownSec: 14,
    effect: Object.freeze({
      type: 'SHIELD_OVERCHARGE',
      shieldBonus: 60,
    }),
  }),
});

/**
 * Unit archetypes as DATA (NextPlan Phase 3).
 * Mediator filters Goals to allowedGoals; Stages stay archetype-agnostic.
 * Boss = stats + sizeScale + optional isDynamicDriver phases — not a special class.
 */
export const UNIT_ARCHETYPE_REGISTRY = Object.freeze({
  GRUNT_BASIC: Object.freeze({
    id: 'GRUNT_BASIC',
    description: '1. Basic grunt — full decision cycle',
    hpRange: Object.freeze([100, 450]),
    defaultWeapon: 'SMG',
    armorType: ArmorType.DEFAULT,
    sizeScale: 1,
    meleeMultiplier: 1,
    allowedGoals: Object.freeze([
      'DESTROY_BASE',
      'ELIMINATE_PLAYER',
      'SURVIVE_RETREAT',
      'SEEK_HEAL_POINT',
      'REGROUP_ALLIES',
    ]),
    targetPriorityList: Object.freeze(['PLAYER', 'BLOCK_TURRET', 'BLOCK_BASE']),
    behaviorFlags: Object.freeze({
      retreatHpRatio: 0.25,
      canRegroup: true,
      preferredRange: 'MEDIUM',
    }),
  }),
  SUICIDE_BERSERKER: Object.freeze({
    id: 'SUICIDE_BERSERKER',
    description: '2. Berserker — no retreat/heal; fight to death',
    hpRange: Object.freeze([450, 650]),
    defaultWeapon: 'SHOTGUN_SHELL',
    armorType: ArmorType.BULLET,
    sizeScale: 1,
    meleeMultiplier: 1.2,
    allowedGoals: Object.freeze([
      'DESTROY_BASE',
      'ELIMINATE_PLAYER',
      'ELIMINATE_TARGET',
    ]),
    targetPriorityList: Object.freeze(['PLAYER', 'BLOCK_TURRET', 'BLOCK_BASE']),
    behaviorFlags: Object.freeze({
      retreatHpRatio: 0.0,
      canRegroup: false,
      relentless: true,
      preferredRange: 'EXTREME_CLOSE',
    }),
  }),
  STEALTH_SNIPER: Object.freeze({
    id: 'STEALTH_SNIPER',
    description: '3.1 Stealth sniper — player only, long range',
    hpRange: Object.freeze([250, 400]),
    defaultWeapon: 'KAR98',
    armorType: ArmorType.DEFAULT,
    sizeScale: 1,
    meleeMultiplier: 1,
    allowedGoals: Object.freeze(['ELIMINATE_PLAYER', 'SURVIVE_RETREAT']),
    targetPriorityList: Object.freeze(['PLAYER']),
    behaviorFlags: Object.freeze({
      retreatHpRatio: 0.5,
      fleeOnApproach: true,
      preferredRange: 'LONG_RANGE',
    }),
  }),
  STEALTH_SHADOW_MELEE: Object.freeze({
    id: 'STEALTH_SHADOW_MELEE',
    description: '3.2 Shadow melee — player focus, path blockers only',
    hpRange: Object.freeze([300, 480]),
    defaultWeapon: 'SHOTGUN_SHELL',
    armorType: ArmorType.DEFAULT,
    sizeScale: 1,
    meleeMultiplier: 1.4,
    allowedGoals: Object.freeze(['ELIMINATE_PLAYER', 'ELIMINATE_TARGET']),
    targetPriorityList: Object.freeze(['PLAYER', 'BLOCK_OTHER']),
    behaviorFlags: Object.freeze({
      canRegroup: false,
      ignoreNonPathObstacles: true,
      preferredRange: 'MELEE',
      retreatHpRatio: 0.0,
      relentless: true,
    }),
  }),
  STEALTH_ASSAULT_HEAVY: Object.freeze({
    id: 'STEALTH_ASSAULT_HEAVY',
    description: '3.3 Heavy assault — turrets first (registry; light wave use)',
    hpRange: Object.freeze([500, 700]),
    defaultWeapon: 'AK47',
    armorType: ArmorType.BULLET,
    sizeScale: 1.1,
    meleeMultiplier: 1.3,
    allowedGoals: Object.freeze(['ELIMINATE_TARGET', 'DESTROY_BASE']),
    targetPriorityList: Object.freeze([
      'BLOCK_TURRET',
      'BLOCK_OTHER',
      'PLAYER',
      'ENEMY_UNIT',
    ]),
    behaviorFlags: Object.freeze({
      canRegroup: false,
      preferredRange: 'CLOSE',
      retreatHpRatio: 0.1,
    }),
  }),
  STEALTH_DEMOLITION_SIEGE: Object.freeze({
    id: 'STEALTH_DEMOLITION_SIEGE',
    description: '3.4 Siege demolition — long-range structures (registry stub wave)',
    hpRange: Object.freeze([400, 600]),
    defaultWeapon: 'LAZER',
    armorType: ArmorType.EXPLOSION,
    sizeScale: 1.1,
    meleeMultiplier: 1,
    allowedGoals: Object.freeze(['ELIMINATE_TARGET', 'DESTROY_BASE']),
    targetPriorityList: Object.freeze([
      'BLOCK_TURRET',
      'BLOCK_OTHER',
      'PLAYER',
      'ENEMY_UNIT',
    ]),
    behaviorFlags: Object.freeze({
      canRegroup: false,
      preferredRange: 'LONG_RANGE',
      retreatHpRatio: 0.15,
    }),
  }),
  SUPPORT_MEDIC: Object.freeze({
    id: 'SUPPORT_MEDIC',
    description: '4.1 Support medic — allies / heal / regroup',
    hpRange: Object.freeze([300, 450]),
    defaultWeapon: 'MEDIC_GUN',
    armorType: ArmorType.DEFAULT,
    sizeScale: 1,
    meleeMultiplier: 1,
    allowedGoals: Object.freeze([
      'SEEK_HEAL_POINT',
      'REGROUP_ALLIES',
      'SURVIVE_RETREAT',
    ]),
    targetPriorityList: Object.freeze(['ALLY_UNIT']),
    behaviorFlags: Object.freeze({
      targetSelectionRule: 'LOWEST_HP_FRIENDLY_IN_GROUP',
      stayInBackline: true,
      allowCrossGroupHelp: false,
      preferredRange: 'LONG_SUPPORT',
      retreatHpRatio: 0.4,
      canRegroup: true,
    }),
  }),
  COWARD_UNIT: Object.freeze({
    id: 'COWARD_UNIT',
    description: '5. Coward — morale drops on hit; flee then regroup',
    hpRange: Object.freeze([200, 380]),
    defaultWeapon: 'SMG',
    armorType: ArmorType.DEFAULT,
    sizeScale: 1,
    meleeMultiplier: 1,
    allowedGoals: Object.freeze([
      'ELIMINATE_TARGET',
      'SURVIVE_RETREAT',
      'REGROUP_ALLIES',
    ]),
    targetPriorityList: Object.freeze(['PLAYER', 'ENEMY_UNIT']),
    behaviorFlags: Object.freeze({
      useMoraleSystem: true,
      initialMorale: 100,
      moraleDropOnHit: 40,
      moraleRecoverRate: 15,
      fleeMoraleThreshold: 30,
      preferredRange: 'MAX_WEAPON_RANGE',
      retreatHpRatio: 0.35,
      canRegroup: true,
    }),
  }),
  COMMANDER_LEADER: Object.freeze({
    id: 'COMMANDER_LEADER',
    description: '6. Local General — morale aura + regroup centroid',
    hpRange: Object.freeze([550, 750]),
    defaultWeapon: 'AK47',
    armorType: ArmorType.BULLET,
    sizeScale: 1.15,
    meleeMultiplier: 1.2,
    isLocalGeneral: true,
    moraleAuraRadius: 300,
    allowedGoals: Object.freeze([
      'HOLD_SECTOR',
      'REGROUP_ALLIES',
      'ELIMINATE_PLAYER',
    ]),
    targetPriorityList: Object.freeze(['PLAYER', 'BLOCK_TURRET']),
    behaviorFlags: Object.freeze({
      isGroupLeader: true,
      preferredRange: 'MEDIUM',
      retreatHpRatio: 0.2,
      canRegroup: true,
    }),
  }),
  COMBAT_ENGINEER: Object.freeze({
    id: 'COMBAT_ENGINEER',
    description: '7. Engineer — PLACE / REPAIR when blackboard primed',
    hpRange: Object.freeze([350, 520]),
    defaultWeapon: 'SMG',
    armorType: ArmorType.DEFAULT,
    sizeScale: 1,
    meleeMultiplier: 1,
    hasPlacementSkill: true,
    placeableBlockTypes: Object.freeze(['TURRET_PISTOL', 'WALL_WOOD']),
    allowedGoals: Object.freeze([
      'REPAIR_STRUCTURE',
      'PLACE_TRAP',
      'ELIMINATE_TARGET',
    ]),
    targetPriorityList: Object.freeze(['BLOCK_TURRET', 'BLOCK_OTHER']),
    behaviorFlags: Object.freeze({
      interactTargetType: 'FRIENDLY_BUILDINGS_FIRST',
      preferredRange: 'CLOSE',
      retreatHpRatio: 0.3,
      canRegroup: true,
    }),
  }),
  SHIELD_VANGUARD: Object.freeze({
    id: 'SHIELD_VANGUARD',
    description: '8. Shield tank — passive shield + TAUNT_ROAR',
    hpRange: Object.freeze([650, 900]),
    defaultWeapon: 'SHOTGUN_SHELL',
    armorType: ArmorType.BULLET,
    sizeScale: 1.2,
    meleeMultiplier: 1.5,
    hasPassiveShield: true,
    shieldColliderRadius: 60,
    shieldMaxHp: 180,
    activeSkills: Object.freeze(['TAUNT_ROAR']),
    allowedGoals: Object.freeze([
      'PROTECT_ALLY',
      'ELIMINATE_PLAYER',
      'HOLD_SECTOR',
    ]),
    targetPriorityList: Object.freeze(['PLAYER', 'ENEMY_UNIT']),
    behaviorFlags: Object.freeze({
      armorType: 'BULLET',
      bodyguardMode: true,
      retreatHpRatio: 0.05,
      preferredRange: 'EXTREME_CLOSE',
      canRegroup: true,
    }),
  }),
  FLANK_SKIRMISHER: Object.freeze({
    id: 'FLANK_SKIRMISHER',
    description: '9. Skirmisher — burst then FLANK_POSITION relocate',
    hpRange: Object.freeze([280, 420]),
    defaultWeapon: 'SMG',
    armorType: ArmorType.DEFAULT,
    sizeScale: 1,
    meleeMultiplier: 1,
    useLocalFlankPathing: true,
    burstDurationSec: 2.0,
    allowedGoals: Object.freeze([
      'ELIMINATE_PLAYER',
      'FLANK_POSITION',
      'SURVIVE_RETREAT',
    ]),
    targetPriorityList: Object.freeze(['PLAYER']),
    behaviorFlags: Object.freeze({
      relocateAfterBurst: true,
      preferredRange: 'MEDIUM_CLOSE',
      retreatHpRatio: 0.3,
      canRegroup: true,
      lowHpSpeedBuff: 1.25,
      lowHpSpeedThreshold: 0.5,
    }),
  }),
  DYNAMIC_PHASE_BOSS: Object.freeze({
    id: 'DYNAMIC_PHASE_BOSS',
    description: '10. Phase boss — weapon/goals swap by hpRatio',
    hpRange: Object.freeze([850, 1200]),
    defaultWeapon: 'LAZER',
    armorType: ArmorType.LAZER,
    sizeScale: 1.5,
    isBoss: true,
    isDynamicDriver: true,
    meleeMultiplier: 5.0,
    activeSkills: Object.freeze(['SPEED_BOOST']),
    allowedGoals: Object.freeze(['ELIMINATE_PLAYER', 'HOLD_SECTOR']),
    targetPriorityList: Object.freeze(['PLAYER', 'BLOCK_TURRET']),
    behaviorFlags: Object.freeze({
      preferredRange: 'LONG_RANGE',
      retreatHpRatio: 0.0,
      relentless: true,
      canRegroup: false,
    }),
    phases: Object.freeze([
      Object.freeze({
        hpRatio: 0.5,
        weaponId: 'LAZER',
        activeSkills: Object.freeze(['SPEED_BOOST']),
        allowedGoals: Object.freeze(['ELIMINATE_PLAYER', 'HOLD_SECTOR']),
        behaviorFlags: Object.freeze({
          preferredRange: 'LONG_RANGE',
          retreatHpRatio: 0.0,
          relentless: true,
          canRegroup: false,
        }),
      }),
      Object.freeze({
        hpRatio: 0.0,
        /** Stand-in for MELEE_SAW — shotgun close; no dedicated saw weapon yet. */
        weaponId: 'SHOTGUN_SHELL',
        activeSkills: Object.freeze(['SPEED_BOOST']),
        allowedGoals: Object.freeze(['SUICIDE_ATTACK', 'ELIMINATE_TARGET']),
        behaviorFlags: Object.freeze({
          preferredRange: 'EXTREME_CLOSE',
          relentless: true,
          retreatHpRatio: 0.0,
          canRegroup: false,
        }),
      }),
    ]),
  }),
});

/**
 * Legacy CLASS_* ids → NextPlan ids (saves / old WAVE table).
 */
export const ARCHETYPE_ALIASES = Object.freeze({
  CLASS_BRIGADIER: 'GRUNT_BASIC',
  CLASS_ASSAULT: 'GRUNT_BASIC',
  CLASS_QUARTER: 'SUICIDE_BERSERKER',
  CLASS_SNIPER_CAMP: 'STEALTH_SNIPER',
  CLASS_SUPPORT_MEDIC: 'SUPPORT_MEDIC',
  CLASS_HIGH_RANK: 'COMMANDER_LEADER',
  CLASS_BOSS: 'DYNAMIC_PHASE_BOSS',
});

/**
 * Wave → weighted composition (data-driven mixed spawn).
 * Index 0 unused; waves 1..N.
 */
export const WAVE_ARCHETYPE_COMPOSITION = Object.freeze([
  null,
  Object.freeze([Object.freeze({ id: 'GRUNT_BASIC', weight: 1 })]),
  Object.freeze([
    Object.freeze({ id: 'GRUNT_BASIC', weight: 3 }),
    Object.freeze({ id: 'SUICIDE_BERSERKER', weight: 1 }),
  ]),
  Object.freeze([
    Object.freeze({ id: 'GRUNT_BASIC', weight: 2 }),
    Object.freeze({ id: 'STEALTH_SNIPER', weight: 1 }),
    Object.freeze({ id: 'STEALTH_SHADOW_MELEE', weight: 1 }),
  ]),
  Object.freeze([
    Object.freeze({ id: 'GRUNT_BASIC', weight: 2 }),
    Object.freeze({ id: 'SUPPORT_MEDIC', weight: 1 }),
    Object.freeze({ id: 'COWARD_UNIT', weight: 2 }),
  ]),
  Object.freeze([
    Object.freeze({ id: 'COMMANDER_LEADER', weight: 1 }),
    Object.freeze({ id: 'GRUNT_BASIC', weight: 2 }),
    Object.freeze({ id: 'SHIELD_VANGUARD', weight: 1 }),
    Object.freeze({ id: 'COWARD_UNIT', weight: 1 }),
  ]),
  Object.freeze([
    Object.freeze({ id: 'COMBAT_ENGINEER', weight: 1 }),
    Object.freeze({ id: 'FLANK_SKIRMISHER', weight: 2 }),
    Object.freeze({ id: 'SHIELD_VANGUARD', weight: 1 }),
    Object.freeze({ id: 'STEALTH_ASSAULT_HEAVY', weight: 1 }),
  ]),
  Object.freeze([
    Object.freeze({ id: 'DYNAMIC_PHASE_BOSS', weight: 1 }),
    Object.freeze({ id: 'GRUNT_BASIC', weight: 2 }),
    Object.freeze({ id: 'FLANK_SKIRMISHER', weight: 1 }),
  ]),
]);

/** @deprecated prefer WAVE_ARCHETYPE_COMPOSITION — primary id per wave. */
export const WAVE_ARCHETYPE_TABLE = Object.freeze([
  null,
  'GRUNT_BASIC',
  'GRUNT_BASIC',
  'SUICIDE_BERSERKER',
  'SUPPORT_MEDIC',
  'COMMANDER_LEADER',
  'FLANK_SKIRMISHER',
  'DYNAMIC_PHASE_BOSS',
]);

export const MEMENTO_STORAGE_KEY = 'theddos_local_host_snapshot_v1';
/** Legacy WantToPlay key — migrate once into MEMENTO_STORAGE_KEY. */
export const MEMENTO_STORAGE_KEY_LEGACY = 'wanttoplay_local_host_snapshot_v1';

/**
 * Feature flag — Snapshot / autosave / Restore / save-file import.
 * true = enabled. false = deferred (Start ignores localStorage saves).
 */
export const FEATURE_SNAPSHOT = true;

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
  /** Throw/drop launch speed (world units / sec) along unit facing. */
  dropThrowSpeed: 220,
  /** Offset past unit radius when spawning a thrown drop (player throw). */
  dropThrowOffset: 28,
  /** Circle radius for drop vs solid resolve + pickup (fraction of L3). */
  dropRadius: Math.round(L3_SIZE * 0.16),
  /**
   * Extra past block half-extent when ejecting Take from Gen/Base center.
   * Spawn distance = max(w,h)/2 + this (Gen 2×2 / Base 3×3).
   */
  dropEjectMargin: Math.round(L3_SIZE * 0.4),
  /**
   * Magnet beyond player collider: pickup if dist ≤ player.radius + this + dropRadius.
   * Keep small — not a wide vacuum.
   */
  dropMagnetRange: Math.round(L3_SIZE * 0.28),
  /** Exponential velocity damp for drops (/sec); slows then stops. */
  dropFriction: 6.5,
  /** Below this speed (wu/s) drop velocity is zeroed. */
  dropStopSpeed: 8,
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
  /** Player starts with this armor active (single slot; craft adds more to bag). */
  startingArmorId: 'ARMOR_VEST',
  /**
   * Optional starting shield item (activeShieldId channel, separate from armor).
   * null = craft SHIELD_BASIC / select hotbar to equip. Passive archetype shields unaffected.
   */
  startingShieldId: null,
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

/** AI Goal baseWeight catalog (Mediator). Preconditions gate via factors. */
export const AI_GOAL_BASE_WEIGHTS = Object.freeze({
  SURVIVE_RETREAT: 900,
  SEEK_HEAL_POINT: 700,
  PLACE_TRAP: 620,
  REPAIR_STRUCTURE: 580,
  ELIMINATE_PLAYER: 500,
  ELIMINATE_TARGET: 480,
  SUICIDE_ATTACK: 520,
  DESTROY_BASE: 400,
  PROTECT_ALLY: 280,
  FLANK_POSITION: 260,
  HOLD_SECTOR: 150,
  REGROUP_ALLIES: 120,
  REACH_PATH_GOAL: 100,
});

/** Goal → Stage map (Mediator only; Stages do not know Goals). */
export const AI_GOAL_TO_STAGE = Object.freeze({
  REACH_PATH_GOAL: 'APPROACH_PATH',
  ELIMINATE_PLAYER: 'ENGAGE',
  ELIMINATE_TARGET: 'ENGAGE',
  DESTROY_BASE: 'ENGAGE',
  SUICIDE_ATTACK: 'ENGAGE',
  SURVIVE_RETREAT: 'RETREAT',
  SEEK_HEAL_POINT: 'SEEK_POINT',
  HOLD_SECTOR: 'REGROUP',
  REGROUP_ALLIES: 'REGROUP',
  PROTECT_ALLY: 'REGROUP',
  FLANK_POSITION: 'RETREAT',
  PLACE_TRAP: 'PLACE',
  REPAIR_STRUCTURE: 'PLACE',
});

/** Event → Goal Δpriority (data-driven). */
export const AI_EVENT_BOOSTS = Object.freeze({
  HIT_BY_PLAYER: Object.freeze({ ELIMINATE_PLAYER: 400 }),
  HIT_BY_TURRET: Object.freeze({ ELIMINATE_TARGET: 380 }),
  SPOTTED_PLAYER: Object.freeze({ ELIMINATE_PLAYER: 220 }),
  TAUNT_TRIGGERED: Object.freeze({ ELIMINATE_TARGET: 450 }),
  LOW_HP: Object.freeze({
    SURVIVE_RETREAT: 500,
    SEEK_HEAL_POINT: 200,
  }),
  LEFT_GENERAL_SECTOR: Object.freeze({
    REACH_PATH_GOAL: 350,
    ELIMINATE_PLAYER: -180,
    ELIMINATE_TARGET: -180,
    PLACE_TRAP: -120,
    REPAIR_STRUCTURE: -80,
  }),
  BASE_IN_RANGE: Object.freeze({ DESTROY_BASE: 280 }),
  PATH_GOAL_REACHED: Object.freeze({ REACH_PATH_GOAL: -40 }),
  HEAL_POINT_AVAILABLE: Object.freeze({ SEEK_HEAL_POINT: 260 }),
  PATH_BLOCKED: Object.freeze({ ELIMINATE_TARGET: 420 }),
  PLACE_SLOT_RESERVED: Object.freeze({ PLACE_TRAP: 480 }),
  REPAIR_TARGET_RESERVED: Object.freeze({ REPAIR_STRUCTURE: 460 }),
  /** Skirmisher burst finished → relocate (FLANK_POSITION). */
  BURST_COMPLETE: Object.freeze({
    FLANK_POSITION: 520,
    ELIMINATE_PLAYER: -120,
  }),
  /** Coward morale below threshold. */
  MORALE_BROKEN: Object.freeze({
    SURVIVE_RETREAT: 600,
    REGROUP_ALLIES: -200,
  }),
});

/**
 * Local path layer (Phase 2b) — raycast fan + rear Pi + steering budget.
 * General clear-corridor pivots stay in js/general.js (Path/L1, no nature BFS).
 */
export const AI_LOCAL_PATH = Object.freeze({
  fanSpanRad: Math.PI / 4,
  fanStages: Object.freeze([1, 3, 5]),
  fanRange: Math.round(L3_SIZE * 5),
  rearPiRadius: Math.round(L3_SIZE * 1.5),
  steeringBudgetMax: 10,
  dodgeLateral: L1_SIZE * 0.35,
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

export function getSkillDef(skillId) {
  return SKILL_REGISTRY[skillId] || null;
}

export function getUnitArchetype(archetypeId) {
  if (!archetypeId) return null;
  const resolved = ARCHETYPE_ALIASES[archetypeId] || archetypeId;
  return (
    UNIT_ARCHETYPE_REGISTRY[resolved] ||
    UNIT_ARCHETYPE_REGISTRY[archetypeId] ||
    null
  );
}

export function getArchetypeForWave(waveIndex) {
  const id =
    WAVE_ARCHETYPE_TABLE[
      Math.min(waveIndex, WAVE_ARCHETYPE_TABLE.length - 1)
    ] || 'GRUNT_BASIC';
  return getUnitArchetype(id);
}

/**
 * Deterministic weighted pick from WAVE_ARCHETYPE_COMPOSITION.
 * Boss slots: at most one DYNAMIC_PHASE_BOSS per wave (first matching index).
 */
export function pickArchetypeIdForWaveSlot(waveIndex, unitIndex) {
  const table = WAVE_ARCHETYPE_COMPOSITION;
  const row =
    table[Math.min(Math.max(0, waveIndex), table.length - 1)] ||
    table[1] ||
    null;
  if (!row || !row.length) {
    const fallback = getArchetypeForWave(waveIndex);
    return (fallback && fallback.id) || 'GRUNT_BASIC';
  }

  // Reserve unitIndex 0 for boss when composition includes one.
  let bossId = null;
  for (let i = 0; i < row.length; i++) {
    if (row[i].id === 'DYNAMIC_PHASE_BOSS') {
      bossId = 'DYNAMIC_PHASE_BOSS';
      break;
    }
  }
  if (bossId && unitIndex === 0) return bossId;

  let total = 0;
  const pool = [];
  for (let i = 0; i < row.length; i++) {
    const e = row[i];
    if (bossId && e.id === bossId) continue;
    const w = Math.max(0, e.weight || 0);
    if (w <= 0) continue;
    pool.push(e);
    total += w;
  }
  if (!pool.length) {
    return row[0].id || 'GRUNT_BASIC';
  }

  // Deterministic: wave*31 + unitIndex (no Math.random).
  let ticket = (waveIndex * 31 + unitIndex * 17) % total;
  for (let i = 0; i < pool.length; i++) {
    ticket -= pool[i].weight;
    if (ticket < 0) return pool[i].id;
  }
  return pool[pool.length - 1].id;
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

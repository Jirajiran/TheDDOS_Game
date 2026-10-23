/**
 * Spatial blueprint + shared identifiers.
 * Catalogs (weapons, blocks, items, craft, skills, archetypes, damage,
 * game pack, AI weights) load from data/pack/*.json at boot.
 * This module re-exports those names so existing imports keep working.
 * Lookups are synchronous after loadDefinitionPack.
 */

import {
  getActor,
  getArchetype,
  getItem,
  getWaveArchetypeComposition,
  getWaveArchetypeTable,
} from './defs/registry.js';
import { GAME_PACK } from './defs/gamePack.js';

export {
  WEAPON_REGISTRY,
  WEAPON_UPGRADES,
  BLOCK_REGISTRY,
  ITEM_REGISTRY,
  CRAFT_CATEGORIES,
  CRAFT_RECIPES,
  SKILL_REGISTRY,
  UNIT_ARCHETYPE_REGISTRY,
  ARCHETYPE_ALIASES,
  WAVE_ARCHETYPE_COMPOSITION,
  WAVE_ARCHETYPE_TABLE,
  ACTOR_REGISTRY,
  getCraftRecipesByCategory,
  getCraftRecipeById as getCraftRecipe,
  getWeapon as getWeaponDef,
  getBlock as getBlockDef,
  getItem as getItemDef,
  getSkill as getSkillDef,
  getArchetype as getUnitArchetype,
  getWeaponUpgrade as getUpgradeRecipe,
  getActor as getActorDef,
} from './defs/registry.js';

export {
  GAME_PACK,
  WAVE_COUNTDOWN_STUB_SEC,
  getBalancePack,
} from './defs/gamePack.js';

export {
  AI_GOAL_BASE_WEIGHTS,
  AI_GOAL_TO_STAGE,
  AI_EVENT_BOOSTS,
  AI_LOCAL_PATH,
} from './defs/aiPack.js';

export { DAMAGE_MULT_TABLE, getDamageMult } from './defs/damageResolver.js';

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

/**
 * HTML loading labels (art ref: Loading_main / Loading_GamePlay SVG).
 * worldPick keys match mainMenuUi: flat | resource | loadFile
 */
export const LOADING_SCREEN = Object.freeze({
  maps: Object.freeze({
    flat: Object.freeze({
      nameMap: 'FLATLAND',
      modeLabel: 'MODE: FLAT SURVIVAL',
    }),
    resource: Object.freeze({
      nameMap: 'RESOURCE WORLD',
      modeLabel: 'MODE: WORLD TYPE',
    }),
    loadFile: Object.freeze({
      nameMap: 'SAVED MAP',
      modeLabel: 'MODE: LOADED',
    }),
  }),
  /** PvE bots only (not player vs player). */
  enemyNames: Object.freeze([
    'Bot Grunt',
    'Bot Runner',
    'Bot Heavy',
    'Bot Sniper',
    'Bot Siege',
  ]),
  maxPlayerRows: 7,
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
  /** Wearable bag — extends hotbar capacity; one equipped at a time. */
  BACKPACK: 'BACKPACK',
});

/**
 * Archetype preferredRange → standoff as fraction of AI fire band
 * (aiFireRangePath), falling back to maxDistancePath.
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

/**
 * AI / unit fire-decision band (when bot chooses FIRE).
 * Separate from bullet maxDistancePath — pack field `aiFireRangePath`.
 * Fallback: maxDistancePath when omitted.
 */
export function getWeaponAiFireRangePx(weapon) {
  if (!weapon) return 0;
  if (typeof weapon.aiFireRangePath === 'number' && weapon.aiFireRangePath > 0) {
    return weapon.aiFireRangePath * PATH_SIZE;
  }
  return getWeaponMaxRangePx(weapon);
}

/** Standoff hold distance from a reach band × preferredRange mult. */
export function getPreferredStandoffPx(weapon, preferredRangeKey, reachPx) {
  const max =
    reachPx > 0 ? reachPx : getWeaponAiFireRangePx(weapon) || getWeaponMaxRangePx(weapon);
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


/** Dogpile K in Score = priorityScore / (distance + attackers * K). */
export const TURRET_DOGPILE_K = 50;

export const MEMENTO_STORAGE_KEY = 'theddos_local_host_snapshot_v1';
/** Legacy WantToPlay key — migrate once into MEMENTO_STORAGE_KEY. */
export const MEMENTO_STORAGE_KEY_LEGACY = 'wanttoplay_local_host_snapshot_v1';

/**
 * Feature flag — Snapshot / autosave / Restore / save-file import.
 * true = enabled. false = deferred (Start ignores localStorage saves).
 */
export const FEATURE_SNAPSHOT = true;

/**
 * Awareness / engage sense in world px.
 * Player → PLAYER actor; enemy → archetype.senseRadiusPath or ENEMY_DEFAULT.
 */
export function getSenseRadiusPx(unit) {
  if (!unit) {
    const d = getActor('ENEMY_DEFAULT');
    return ((d && d.senseRadiusPath) || 0.7) * PATH_SIZE;
  }
  if (unit.role === 'player') {
    const p = getActor('PLAYER');
    return ((p && p.senseRadiusPath) || 1) * PATH_SIZE;
  }
  const arch =
    unit._effectiveArchetype ||
    (unit.archetypeId ? getArchetype(unit.archetypeId) : null);
  if (arch && typeof arch.senseRadiusPath === 'number') {
    return arch.senseRadiusPath * PATH_SIZE;
  }
  const d = getActor('ENEMY_DEFAULT');
  return ((d && d.senseRadiusPath) || 0.7) * PATH_SIZE;
}

/** Extra inventory slots from a backpack item id (0 if none). */
export function getBackpackBonusSlots(itemId) {
  const def = getItem(itemId);
  if (!def || def.kind !== ItemKind.BACKPACK) return 0;
  return def.backpackBonusSlots || 0;
}

/** UI tyle 1|2|3 or 0. */
export function getBackpackTier(itemId) {
  const def = getItem(itemId);
  if (!def || def.kind !== ItemKind.BACKPACK) return 0;
  return def.backpackTier || 0;
}

export function isBackpackItemId(itemId) {
  return getBackpackTier(itemId) > 0;
}

/** Capacity = base + equipped backpack bonus. */
export function getInventoryCapacity(equippedBackpackId) {
  const base = GAME_PACK.hotbarBaseSlots || GAME_PACK.hotbarSlots || 6;
  return base + getBackpackBonusSlots(equippedBackpackId);
}

export function getArchetypeForWave(waveIndex) {
  const src = getWaveArchetypeTable();
  const id =
    (src && src[Math.min(waveIndex, Math.max(0, src.length - 1))]) ||
    'GRUNT_BASIC';
  return getArchetype(id);
}

/**
 * Deterministic weighted pick from WAVE_ARCHETYPE_COMPOSITION.
 * Boss slots: at most one DYNAMIC_PHASE_BOSS per wave (first matching index).
 * Rows stored without .length fall through to the wave table (existing result).
 */
export function pickArchetypeIdForWaveSlot(waveIndex, unitIndex) {
  const table = getWaveArchetypeComposition();
  const row =
    table && table.length
      ? table[Math.min(Math.max(0, waveIndex), table.length - 1)] ||
        table[1] ||
        null
      : null;
  if (!row || !row.length) {
    const fallback = getArchetypeForWave(waveIndex);
    return (fallback && fallback.id) || 'GRUNT_BASIC';
  }

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

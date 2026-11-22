/**
 * Public Definition API — single entry for gameplay systems.
 * Prefer these over digging into config registries.
 */

export {
  isDefsReady,
  getDefsVersion,
  getWeapon,
  getBlock,
  getItem,
  getSkill,
  getArchetype,
  getWeaponUpgrade,
  getArmorItem,
  getActor,
  getDayConfig,
  getRulesConfig,
  getArmorTypes,
  listWeaponIds,
  listBlockIds,
  listItemIds,
  listArchetypeIds,
  getWaveArchetypeTable,
  getWaveArchetypeComposition,
  getCraftRecipes,
  getCraftCategories,
  getCraftRecipeById,
  getCraftRecipesByCategory,
} from './registry.js';

export {
  resolveDamage,
  getDamageMult,
} from './damageResolver.js';

export {
  TEAM_ROW_CAP,
  normalizeTeamRows,
  teamsFromDoc,
  teamIdsFromDoc,
  teamSelectOptions,
  playerTeamId,
  enemyTeamId,
  firstTeamId,
  teamIdByRole,
  clampTeamId,
  collisionLayerForTeam,
} from './teams.js';

export {
  pickEdgeSpawnPosition,
  buildBaseSpawnMask,
  perimeterPoint,
} from './spawnPolicy.js';

export { loadDefinitionPack, PACK_BASE } from './loadPack.js';

/**
 * defs public barrel — re-exports API + install helpers for boot/config.
 */

export * from './api.js';

export {
  installPackData,
  seedWeaponsFromRegistry,
  seedBlocksFromRegistry,
  seedItemsFromRegistry,
  seedSkillsFromRegistry,
  seedArchetypesFromRegistries,
  seedWeaponUpgradesFromRegistry,
  seedCraftFromData,
  seedActorsFromRegistry,
} from './registry.js';

export {
  installDamageMatrix,
  seedDamageMatrixFromTable,
} from './damageResolver.js';

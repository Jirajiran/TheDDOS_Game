/**
 * DefinitionRegistry — DOP lookup by id only.
 * Catalogs are filled from data/pack JSON at boot (loadDefinitionPack).
 * Lookups stay synchronous after that install.
 */

function cloneFreeze(value) {
  if (Array.isArray(value)) {
    const next = new Array(value.length);
    for (let i = 0; i < value.length; i++) next[i] = cloneFreeze(value[i]);
    return Object.freeze(next);
  }
  if (value && typeof value === 'object') {
    const next = {};
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i++) {
      next[keys[i]] = cloneFreeze(value[keys[i]]);
    }
    return Object.freeze(next);
  }
  return value;
}

function freezeMap(src) {
  const next = Object.create(null);
  if (!src || typeof src !== 'object') return Object.freeze(next);
  const keys = Object.keys(src);
  for (let i = 0; i < keys.length; i++) {
    next[keys[i]] = cloneFreeze(src[keys[i]]);
  }
  return Object.freeze(next);
}

/**
 * Shallow copy used for wave composition rows.
 * Array rows become plain objects (no .length), so pickArchetypeIdForWaveSlot
 * keeps using the wave table — same result as the previous in-module seed.
 */
function freezeArray(arr) {
  if (!Array.isArray(arr)) return Object.freeze([]);
  return Object.freeze(
    arr.map((x) => (x && typeof x === 'object' ? Object.freeze({ ...x }) : x))
  );
}

export let WEAPON_REGISTRY = Object.freeze(Object.create(null));
export let BLOCK_REGISTRY = Object.freeze(Object.create(null));
export let ITEM_REGISTRY = Object.freeze(Object.create(null));
export let SKILL_REGISTRY = Object.freeze(Object.create(null));
export let UNIT_ARCHETYPE_REGISTRY = Object.freeze(Object.create(null));
export let ARCHETYPE_ALIASES = Object.freeze(Object.create(null));
export let WAVE_ARCHETYPE_COMPOSITION = Object.freeze([]);
export let WAVE_ARCHETYPE_TABLE = Object.freeze([]);
export let WEAPON_UPGRADES = Object.freeze(Object.create(null));
export let CRAFT_RECIPES = Object.freeze([]);
export let CRAFT_CATEGORIES = Object.freeze([]);
let _armorItems = Object.freeze(Object.create(null));
let _armorTypes = Object.freeze(['DEFAULT', 'BULLET', 'EXPLOSION', 'LAZER']);
export let ACTOR_REGISTRY = Object.freeze(Object.create(null));
let _day = null;
let _rules = null;
let _ready = false;
let _version = '0';

function markReady() {
  _ready =
    Object.keys(WEAPON_REGISTRY).length > 0 &&
    Object.keys(BLOCK_REGISTRY).length > 0 &&
    Object.keys(ITEM_REGISTRY).length > 0 &&
    _rules != null &&
    _day != null;
  return _ready;
}

export function isDefsReady() {
  return _ready;
}

export function getDefsVersion() {
  return _version;
}

/** Install pack JSON docs. Does not merge a second hardcoded catalog. */
export function installPackData(pack) {
  if (!pack) return _ready;

  if (pack.weapons && pack.weapons.weapons) {
    WEAPON_REGISTRY = freezeMap(pack.weapons.weapons);
  }
  if (pack.blocks && pack.blocks.blocks) {
    BLOCK_REGISTRY = freezeMap(pack.blocks.blocks);
  }
  if (pack.items && pack.items.items) {
    ITEM_REGISTRY = freezeMap(pack.items.items);
  }
  if (pack.skills && pack.skills.skills) {
    SKILL_REGISTRY = freezeMap(pack.skills.skills);
  }
  const unitDoc = pack.units || {};
  const legacyArch = pack.archetypes || {};
  const unitSheet = Object.assign(
    {},
    legacyArch.archetypes || {},
    unitDoc.units || {}
  );
  if (Object.keys(unitSheet).length) {
    const frozenUnits = freezeMap(unitSheet);
    ACTOR_REGISTRY = frozenUnits;
    UNIT_ARCHETYPE_REGISTRY = frozenUnits;
  }
  const aliases = unitDoc.aliases || legacyArch.aliases;
  const waveComposition = unitDoc.waveComposition || legacyArch.waveComposition;
  const waveTable = unitDoc.waveTable || legacyArch.waveTable;
  if (aliases) ARCHETYPE_ALIASES = freezeMap(aliases);
  if (waveComposition) WAVE_ARCHETYPE_COMPOSITION = freezeArray(waveComposition);
  if (waveTable) WAVE_ARCHETYPE_TABLE = Object.freeze(waveTable.slice());
  if (pack.weaponUpgrades && pack.weaponUpgrades.upgrades) {
    WEAPON_UPGRADES = freezeMap(pack.weaponUpgrades.upgrades);
  }
  if (pack.craft) {
    if (pack.craft.recipes) CRAFT_RECIPES = cloneFreeze(pack.craft.recipes);
    if (pack.craft.categories) {
      CRAFT_CATEGORIES = Object.freeze(pack.craft.categories.slice());
    }
  }
  if (pack.day && typeof pack.day === 'object') {
    _day = Object.freeze({ ...pack.day });
  }
  if (pack.rules && typeof pack.rules === 'object') {
    const next = { ...pack.rules };
    if (Array.isArray(pack.rules.playerActiveSkills)) {
      next.playerActiveSkills = Object.freeze(pack.rules.playerActiveSkills.slice());
    }
    _rules = Object.freeze(next);
  }

  const asrc = pack.armor || {};
  if (Array.isArray(asrc.armorTypes) && asrc.armorTypes.length) {
    _armorTypes = Object.freeze(asrc.armorTypes.slice());
  }
  if (asrc.items) {
    _armorItems = freezeMap(asrc.items);
  }

  _version =
    (pack && pack.version) ||
    (pack && pack.manifest && pack.manifest.version) ||
    _version ||
    '1';
  return markReady();
}

export function seedWeaponsFromRegistry(registry) {
  if (!registry) return;
  WEAPON_REGISTRY = freezeMap(registry);
  markReady();
}

export function seedBlocksFromRegistry(registry) {
  if (!registry) return;
  BLOCK_REGISTRY = freezeMap(registry);
  markReady();
}

export function seedItemsFromRegistry(registry) {
  if (!registry) return;
  ITEM_REGISTRY = freezeMap(registry);
  markReady();
}

export function seedSkillsFromRegistry(registry) {
  if (!registry) return;
  SKILL_REGISTRY = freezeMap(registry);
}

export function seedArchetypesFromRegistries(opts = {}) {
  if (opts.archetypes) UNIT_ARCHETYPE_REGISTRY = freezeMap(opts.archetypes);
  if (opts.aliases) ARCHETYPE_ALIASES = freezeMap(opts.aliases);
  if (opts.waveComposition) {
    WAVE_ARCHETYPE_COMPOSITION = freezeArray(opts.waveComposition);
  }
  if (opts.waveTable) WAVE_ARCHETYPE_TABLE = Object.freeze(opts.waveTable.slice());
}

export function seedWeaponUpgradesFromRegistry(registry) {
  if (!registry) return;
  WEAPON_UPGRADES = freezeMap(registry);
}

export function seedCraftFromData(categories, recipes) {
  if (categories) CRAFT_CATEGORIES = Object.freeze(categories.slice());
  if (recipes) CRAFT_RECIPES = cloneFreeze(recipes);
}

export function seedActorsFromRegistry(registry) {
  if (!registry) return;
  ACTOR_REGISTRY = freezeMap(registry);
}

export function getWeapon(id) {
  return id ? WEAPON_REGISTRY[id] || null : null;
}

export function getBlock(id) {
  return id ? BLOCK_REGISTRY[id] || null : null;
}

export function getItem(id) {
  return id ? ITEM_REGISTRY[id] || null : null;
}

export function getSkill(id) {
  return id ? SKILL_REGISTRY[id] || null : null;
}

export function getArchetype(id) {
  if (!id) return null;
  const resolved = ARCHETYPE_ALIASES[id] || id;
  return UNIT_ARCHETYPE_REGISTRY[resolved] || UNIT_ARCHETYPE_REGISTRY[id] || null;
}

export function getWeaponUpgrade(weaponId) {
  return weaponId ? WEAPON_UPGRADES[weaponId] || null : null;
}

export function getArmorItem(id) {
  return id ? _armorItems[id] || null : null;
}

export function getActor(id) {
  return id ? ACTOR_REGISTRY[id] || null : null;
}

/** Day/night rules from data/pack/day.json. */
export function getDayConfig() {
  if (!_day) {
    throw new Error('Day pack not loaded (data/pack/day.json)');
  }
  return _day;
}

/** Match rules from data/pack/rules.json. Unit bodies live in units.json. */
export function getRulesConfig() {
  if (!_rules) {
    throw new Error('Rules pack not loaded (data/pack/rules.json)');
  }
  return _rules;
}

export function listWeaponIds() {
  return Object.keys(WEAPON_REGISTRY);
}

export function listBlockIds() {
  return Object.keys(BLOCK_REGISTRY);
}

export function listItemIds() {
  return Object.keys(ITEM_REGISTRY);
}

export function listArchetypeIds() {
  return Object.keys(UNIT_ARCHETYPE_REGISTRY);
}

export function getArmorTypes() {
  return _armorTypes;
}

export function getWaveArchetypeTable() {
  return WAVE_ARCHETYPE_TABLE;
}

export function getWaveArchetypeComposition() {
  return WAVE_ARCHETYPE_COMPOSITION;
}

export function getCraftRecipes() {
  return CRAFT_RECIPES;
}

export function getCraftCategories() {
  return CRAFT_CATEGORIES;
}

export function getCraftRecipeById(recipeId) {
  for (let i = 0; i < CRAFT_RECIPES.length; i++) {
    if (CRAFT_RECIPES[i].id === recipeId) return CRAFT_RECIPES[i];
  }
  return null;
}

export function getCraftRecipesByCategory(category) {
  const out = [];
  for (let i = 0; i < CRAFT_RECIPES.length; i++) {
    if (CRAFT_RECIPES[i].category === category) out.push(CRAFT_RECIPES[i]);
  }
  return out;
}

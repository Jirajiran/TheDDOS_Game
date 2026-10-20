/**
 * DefinitionRegistry — DOP lookup by id only. No name-branches in gameplay logic.
 * Stores: weapons, blocks, items, skills, archetypes, actors, upgrades, craft, armor.
 */

function freezeMap(src) {
  const next = Object.create(null);
  if (!src || typeof src !== 'object') return Object.freeze(next);
  const keys = Object.keys(src);
  for (let i = 0; i < keys.length; i++) {
    const id = keys[i];
    const v = src[id];
    next[id] =
      v && typeof v === 'object' && !Array.isArray(v)
        ? Object.freeze({ ...v })
        : v;
  }
  return Object.freeze(next);
}

function freezeArray(arr) {
  if (!Array.isArray(arr)) return Object.freeze([]);
  return Object.freeze(arr.map((x) => (x && typeof x === 'object' ? Object.freeze({ ...x }) : x)));
}

let _weapons = Object.freeze(Object.create(null));
let _blocks = Object.freeze(Object.create(null));
let _items = Object.freeze(Object.create(null));
let _skills = Object.freeze(Object.create(null));
let _archetypes = Object.freeze(Object.create(null));
let _archetypeAliases = Object.freeze(Object.create(null));
let _waveComposition = Object.freeze([]);
let _waveTable = Object.freeze([]);
let _weaponUpgrades = Object.freeze(Object.create(null));
let _craftRecipes = Object.freeze([]);
let _craftCategories = Object.freeze([]);
let _armorItems = Object.freeze(Object.create(null));
let _armorTypes = Object.freeze(['DEFAULT', 'BULLET', 'EXPLOSION', 'LAZER']);
let _actors = Object.freeze(Object.create(null));
const DEFAULT_DAY = Object.freeze({
  dayLengthSec: 300,
  startHour: 6,
  dawnHour: 6,
  duskHour: 18,
  nightOverlayColor: '#55008C',
  nightOverlayMaxAlpha: 0.32,
  nightEnemyAiFireMul: 0.9,
  nightCameraZoomMul: 0.98,
  nightCameraTweenPerSec: 1.8,
  nightTurretAiFireMul: 0.9,
  applyNightTurretAiFire: false,
});
let _day = DEFAULT_DAY;

const DEFAULT_RULES = Object.freeze({
  targetWaveToWin: 7,
  setupPhaseDurationSec: 60,
  waveCountdownSec: 20,
  enemiesPerWaveBase: 3,
  enemiesPerWaveScale: 1,
  waveGroupCount: 3,
  playerMaxHp: 850,
  playerSpeed: 200,
  playerActiveSkills: Object.freeze(['FIST', 'SELF_HEAL']),
});
let _rules = DEFAULT_RULES;
let _ready = false;
let _version = '0';

export function isDefsReady() {
  return _ready;
}

export function getDefsVersion() {
  return _version;
}

/** Deep-ish install from pack JSON docs + optional seeds already applied. */
export function installPackData(pack) {
  if (!pack) return _ready;

  if (pack.weapons && pack.weapons.weapons) {
    _weapons = freezeMap(pack.weapons.weapons);
  }
  if (pack.blocks && pack.blocks.blocks) {
    _blocks = freezeMap(pack.blocks.blocks);
  }
  if (pack.items && pack.items.items) {
    _items = freezeMap(pack.items.items);
  }
  if (pack.skills && pack.skills.skills) {
    _skills = freezeMap(pack.skills.skills);
  }
  if (pack.archetypes) {
    if (pack.archetypes.archetypes) {
      _archetypes = freezeMap(pack.archetypes.archetypes);
    }
    if (pack.archetypes.aliases) {
      _archetypeAliases = freezeMap(pack.archetypes.aliases);
    }
    if (pack.archetypes.waveComposition) {
      _waveComposition = freezeArray(pack.archetypes.waveComposition);
    }
    if (pack.archetypes.waveTable) {
      _waveTable = Object.freeze(pack.archetypes.waveTable.slice());
    }
  }
  if (pack.weaponUpgrades && pack.weaponUpgrades.upgrades) {
    _weaponUpgrades = freezeMap(pack.weaponUpgrades.upgrades);
  }
  if (pack.craft) {
    if (pack.craft.recipes) _craftRecipes = freezeArray(pack.craft.recipes);
    if (pack.craft.categories) {
      _craftCategories = Object.freeze(pack.craft.categories.slice());
    }
  }
  if (pack.actors && pack.actors.actors) {
    _actors = freezeMap(pack.actors.actors);
  }
  if (pack.day && typeof pack.day === 'object') {
    _day = Object.freeze({ ...DEFAULT_DAY, ...pack.day });
  }
  if (pack.rules && typeof pack.rules === 'object') {
    const skills = Array.isArray(pack.rules.playerActiveSkills)
      ? Object.freeze(pack.rules.playerActiveSkills.slice())
      : DEFAULT_RULES.playerActiveSkills;
    _rules = Object.freeze({
      ...DEFAULT_RULES,
      ...pack.rules,
      playerActiveSkills: skills,
    });
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
  _ready =
    Object.keys(_weapons).length > 0 ||
    Object.keys(_blocks).length > 0 ||
    Object.keys(_items).length > 0;
  return _ready;
}

export function seedWeaponsFromRegistry(registry) {
  if (!registry) return;
  _weapons = freezeMap(registry);
  _ready = Object.keys(_weapons).length > 0 || _ready;
}

export function seedBlocksFromRegistry(registry) {
  if (!registry) return;
  _blocks = freezeMap(registry);
  _ready = Object.keys(_blocks).length > 0 || _ready;
}

export function seedItemsFromRegistry(registry) {
  if (!registry) return;
  _items = freezeMap(registry);
  _ready = Object.keys(_items).length > 0 || _ready;
}

export function seedSkillsFromRegistry(registry) {
  if (!registry) return;
  _skills = freezeMap(registry);
}

export function seedArchetypesFromRegistries(opts = {}) {
  if (opts.archetypes) _archetypes = freezeMap(opts.archetypes);
  if (opts.aliases) _archetypeAliases = freezeMap(opts.aliases);
  if (opts.waveComposition) _waveComposition = freezeArray(opts.waveComposition);
  if (opts.waveTable) _waveTable = Object.freeze(opts.waveTable.slice());
}

export function seedWeaponUpgradesFromRegistry(registry) {
  if (!registry) return;
  _weaponUpgrades = freezeMap(registry);
}

export function seedCraftFromData(categories, recipes) {
  if (categories) _craftCategories = Object.freeze(categories.slice());
  if (recipes) _craftRecipes = freezeArray(recipes);
}

export function seedActorsFromRegistry(registry) {
  if (!registry) return;
  _actors = freezeMap(registry);
}

export function getWeapon(id) {
  return id ? _weapons[id] || null : null;
}

export function getBlock(id) {
  return id ? _blocks[id] || null : null;
}

export function getItem(id) {
  return id ? _items[id] || null : null;
}

export function getSkill(id) {
  return id ? _skills[id] || null : null;
}

export function getArchetype(id) {
  if (!id) return null;
  const resolved = _archetypeAliases[id] || id;
  return _archetypes[resolved] || _archetypes[id] || null;
}

export function getWeaponUpgrade(weaponId) {
  return weaponId ? _weaponUpgrades[weaponId] || null : null;
}

export function getArmorItem(id) {
  return id ? _armorItems[id] || null : null;
}

export function getActor(id) {
  return id ? _actors[id] || null : null;
}

/** Day/night rules from data/pack/day.json (defaults if missing). */
export function getDayConfig() {
  return _day || DEFAULT_DAY;
}

/** Gameloop / player balance from data/pack/rules.json (defaults if missing). */
export function getRulesConfig() {
  return _rules || DEFAULT_RULES;
}

export function listWeaponIds() {
  return Object.keys(_weapons);
}

export function listBlockIds() {
  return Object.keys(_blocks);
}

export function listItemIds() {
  return Object.keys(_items);
}

export function listArchetypeIds() {
  return Object.keys(_archetypes);
}

export function getArmorTypes() {
  return _armorTypes;
}

export function getWaveArchetypeTable() {
  return _waveTable;
}

export function getWaveArchetypeComposition() {
  return _waveComposition;
}

export function getCraftRecipes() {
  return _craftRecipes;
}

export function getCraftCategories() {
  return _craftCategories;
}

export function getCraftRecipeById(recipeId) {
  for (let i = 0; i < _craftRecipes.length; i++) {
    if (_craftRecipes[i].id === recipeId) return _craftRecipes[i];
  }
  return null;
}

export function getCraftRecipesByCategory(category) {
  return _craftRecipes.filter((r) => r.category === category);
}

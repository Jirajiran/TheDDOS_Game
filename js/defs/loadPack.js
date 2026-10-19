/**
 * Load Nozone definition pack from data/pack/ (HTTP). Falls back to in-memory seed.
 */

import {
  installPackData,
  seedWeaponsFromRegistry,
  seedBlocksFromRegistry,
  seedItemsFromRegistry,
  seedSkillsFromRegistry,
  seedArchetypesFromRegistries,
  seedWeaponUpgradesFromRegistry,
  seedCraftFromData,
  seedActorsFromRegistry,
  isDefsReady,
} from './registry.js';
import {
  installDamageMatrix,
  seedDamageMatrixFromTable,
} from './damageResolver.js';

export const PACK_BASE = 'data/pack/';

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`pack fetch ${url} → ${res.status}`);
  return res.json();
}

function applySeeds(opts) {
  if (opts.seedWeapons) seedWeaponsFromRegistry(opts.seedWeapons);
  if (opts.seedBlocks) seedBlocksFromRegistry(opts.seedBlocks);
  if (opts.seedItems) seedItemsFromRegistry(opts.seedItems);
  if (opts.seedSkills) seedSkillsFromRegistry(opts.seedSkills);
  if (opts.seedArchetypes) {
    seedArchetypesFromRegistries(opts.seedArchetypes);
  }
  if (opts.seedWeaponUpgrades) {
    seedWeaponUpgradesFromRegistry(opts.seedWeaponUpgrades);
  }
  if (opts.seedCraft) {
    seedCraftFromData(opts.seedCraft.categories, opts.seedCraft.recipes);
  }
  if (opts.seedActors) seedActorsFromRegistry(opts.seedActors);
  if (opts.seedDamageTable) seedDamageMatrixFromTable(opts.seedDamageTable);
}

/**
 * @param {object} [opts] seed* registries + onWarn
 * @returns {Promise<{ ok: boolean, fromJson: boolean, error?: string }>}
 */
export async function loadDefinitionPack(opts = {}) {
  const warn = opts.onWarn || ((m) => console.warn('[defs]', m));
  applySeeds(opts);

  try {
    const manifest = await fetchJson(PACK_BASE + 'pack_manifest.json');
    const files = manifest.files || {};

    const urls = {
      weapons: PACK_BASE + (files.weapons || 'weapons.json'),
      armor: PACK_BASE + (files.armor || 'armor.json'),
      damageMatrix: PACK_BASE + (files.damageMatrix || 'damage_matrix.json'),
      blocks: PACK_BASE + (files.blocks || 'blocks.json'),
      items: PACK_BASE + (files.items || 'items.json'),
      skills: PACK_BASE + (files.skills || 'skills.json'),
      archetypes: PACK_BASE + (files.archetypes || 'archetypes.json'),
      weaponUpgrades:
        PACK_BASE + (files.weaponUpgrades || 'weapon_upgrades.json'),
      craft: PACK_BASE + (files.craft || 'craft.json'),
      actors: PACK_BASE + (files.actors || 'actors.json'),
      day: PACK_BASE + (files.day || 'day.json'),
      rules: PACK_BASE + (files.rules || 'rules.json'),
    };

    const entries = Object.keys(urls);
    const results = await Promise.all(
      entries.map(async (key) => {
        try {
          return { key, ok: true, data: await fetchJson(urls[key]) };
        } catch (err) {
          warn(`pack skip ${key}: ${err && err.message ? err.message : err}`);
          return { key, ok: false, data: null };
        }
      })
    );

    const pack = { version: manifest.version, manifest };
    let loaded = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (!r.ok || !r.data) continue;
      loaded += 1;
      if (r.key === 'weapons') pack.weapons = r.data;
      else if (r.key === 'armor') pack.armor = r.data;
      else if (r.key === 'damageMatrix') {
        installDamageMatrix(r.data);
      } else if (r.key === 'blocks') pack.blocks = r.data;
      else if (r.key === 'items') pack.items = r.data;
      else if (r.key === 'skills') pack.skills = r.data;
      else if (r.key === 'archetypes') pack.archetypes = r.data;
      else if (r.key === 'weaponUpgrades') pack.weaponUpgrades = r.data;
      else if (r.key === 'craft') pack.craft = r.data;
      else if (r.key === 'actors') pack.actors = r.data;
      else if (r.key === 'day') pack.day = r.data;
      else if (r.key === 'rules') pack.rules = r.data;
    }

    installPackData(pack);

    if (!isDefsReady()) {
      warn('JSON pack empty after load — using seed');
      return { ok: isDefsReady(), fromJson: false, error: 'empty_pack' };
    }
    return { ok: true, fromJson: loaded > 0, loadedFiles: loaded };
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    warn(`pack JSON load failed (${msg}) — using in-memory seed`);
    return { ok: isDefsReady(), fromJson: false, error: msg };
  }
}

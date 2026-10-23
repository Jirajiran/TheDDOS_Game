/**
 * Load Nozone definition pack from data/pack/ (HTTP).
 * Registries stay empty until every file loads. Lookups are synchronous after that.
 */

import { installPackData, isDefsReady } from './registry.js';
import { installDamageMatrix } from './damageResolver.js';
import { installGamePack } from './gamePack.js';
import { installAiPack } from './aiPack.js';
import { installAudioPack } from '../audio/sfx.js';

export const PACK_BASE = 'data/pack/';

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`pack fetch ${url} → ${res.status}`);
  return res.json();
}

/**
 * @param {object} [opts] onWarn
 * @returns {Promise<{ ok: boolean, fromJson: boolean, error?: string, loadedFiles?: number }>}
 */
export async function loadDefinitionPack(opts = {}) {
  const warn = opts.onWarn || ((m) => console.warn('[defs]', m));

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
      gamePack: PACK_BASE + (files.gamePack || 'game_pack.json'),
      ai: PACK_BASE + (files.ai || 'ai.json'),
      audio: PACK_BASE + (files.audio || 'audio.json'),
    };

    const entries = Object.keys(urls);
    const results = await Promise.all(
      entries.map(async (key) => {
        try {
          return { key, ok: true, data: await fetchJson(urls[key]) };
        } catch (err) {
          const message = err && err.message ? err.message : String(err);
          return { key, ok: false, data: null, error: message };
        }
      })
    );

    const failed = results.filter((r) => !r.ok);
    if (failed.length) {
      const msg = `pack JSON failed: ${failed
        .map((r) => `${r.key} (${r.error})`)
        .join('; ')}`;
      warn(msg);
      return { ok: false, fromJson: false, error: msg };
    }

    const byKey = Object.create(null);
    for (let i = 0; i < results.length; i++) {
      byKey[results[i].key] = results[i].data;
    }

    const pack = {
      version: manifest.version,
      manifest,
      weapons: byKey.weapons,
      armor: byKey.armor,
      blocks: byKey.blocks,
      items: byKey.items,
      skills: byKey.skills,
      archetypes: byKey.archetypes,
      weaponUpgrades: byKey.weaponUpgrades,
      craft: byKey.craft,
      actors: byKey.actors,
      day: byKey.day,
      rules: byKey.rules,
    };

    installDamageMatrix(byKey.damageMatrix);
    installPackData(pack);
    installGamePack(byKey.gamePack, byKey.rules);
    installAiPack(byKey.ai);
    installAudioPack(byKey.audio);

    if (!isDefsReady()) {
      const msg = 'pack JSON loaded but weapon/block/item/rules/day registries are empty';
      warn(msg);
      return { ok: false, fromJson: false, error: msg };
    }
    return { ok: true, fromJson: true, loadedFiles: results.length };
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    warn(`pack JSON load failed (${msg})`);
    return { ok: false, fromJson: false, error: msg };
  }
}

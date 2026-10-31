/**
 * GAME_PACK shell. The map file, presentation file, and unit bodies
 * are merged here so existing readers keep one object.
 * Wave timing stays in rules.json. Body HP, speed, and skills stay on the unit.
 */

import { getRulesConfig } from './registry.js';
import { closedModelGroupId } from '../assets/closedCatalog.js';

const MAX_LOCAL_TEAMS = 6;

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

export let GAME_PACK = Object.freeze({});

/** @deprecated use GAME_PACK.waveCountdownSec */
export let WAVE_COUNTDOWN_STUB_SEC = 0;

/**
 * @param {object} doc game_pack.json
 * @param {object} rulesDoc rules.json (wave timing and match rules)
 * @param {{ presentation?: object, units?: object }} [extras]
 */
export function installGamePack(doc, rulesDoc, extras) {
  const src = (doc && doc.pack) || {};
  const r = rulesDoc || {};
  const extra = extras || {};
  const presentation =
    (extra.presentation && extra.presentation.presentation) || {};
  const units = (extra.units && extra.units.units) || {};
  const player = units.PLAYER || {};
  const enemy = units.ENEMY_DEFAULT || {};
  const teams = Array.isArray(src.teams) ? src.teams : [];
  if (teams.length < 1 || teams.length > MAX_LOCAL_TEAMS) {
    throw new Error(
      `map teams must be 1 to ${MAX_LOCAL_TEAMS} (got ${teams.length})`
    );
  }
  const skills = Array.isArray(player.skills)
    ? Object.freeze(player.skills.slice())
    : Object.freeze([]);
  const merged = {
    ...presentation,
    ...src,
    targetWaveToWin: r.targetWaveToWin,
    setupPhaseDurationSec: r.setupPhaseDurationSec,
    waveCountdownSec: r.waveCountdownSec,
    enemiesPerWaveBase: r.enemiesPerWaveBase,
    enemiesPerWaveScale: r.enemiesPerWaveScale,
    waveGroupCount: r.waveGroupCount,
    loseMode: r.loseMode != null ? r.loseMode : 1,
    lastStand: r.lastStand === true,
    dodgeQuota: r.dodgeQuota != null ? r.dodgeQuota : 4,
    area: r.area || null,
    territory: r.territory || null,
    playerMaxHp: player.maxHp,
    playerSpeed: player.speed,
    playerRadius: player.radius,
    playerArmorType: player.armorType || 'DEFAULT',
    playerActiveSkills: skills,
    enemyDefaultSkinGroupId:
      closedModelGroupId(enemy.model) || 'Default_skin_2',
    playerDefaultSkinGroupId:
      closedModelGroupId(player.model) || 'Default_skin_1',
    seatCap: src.seatCap != null ? src.seatCap : 12,
    startingLoadout: Array.isArray(player.startingLoadout)
      ? player.startingLoadout
      : [],
    currentSlot: player.currentSlot | 0,
    areas: Array.isArray(extra.areas && extra.areas.areas)
      ? extra.areas.areas
      : [],
    spawns: Array.isArray(extra.spawns && extra.spawns.spawns)
      ? extra.spawns.spawns
      : [],
  };
  delete merged.startingArmorId;
  delete merged.startingShieldId;
  GAME_PACK = cloneFreeze(merged);
  WAVE_COUNTDOWN_STUB_SEC = GAME_PACK.waveCountdownSec;
}

/**
 * GAME_PACK with rules.json winning on wave timing.
 * Player body fields stay on the merged unit values unless rules still override them.
 */
export function getBalancePack() {
  const g = GAME_PACK;
  let r = null;
  try {
    r = getRulesConfig();
  } catch (_) {
    r = null;
  }
  if (!r) return g;
  const skills = Array.isArray(r.playerActiveSkills)
    ? r.playerActiveSkills
    : g.playerActiveSkills;
  return {
    ...g,
    targetWaveToWin:
      r.targetWaveToWin != null ? r.targetWaveToWin : g.targetWaveToWin,
    setupPhaseDurationSec:
      r.setupPhaseDurationSec != null
        ? r.setupPhaseDurationSec
        : g.setupPhaseDurationSec,
    waveCountdownSec:
      r.waveCountdownSec != null ? r.waveCountdownSec : g.waveCountdownSec,
    enemiesPerWaveBase:
      r.enemiesPerWaveBase != null
        ? r.enemiesPerWaveBase
        : g.enemiesPerWaveBase,
    enemiesPerWaveScale:
      r.enemiesPerWaveScale != null
        ? r.enemiesPerWaveScale
        : g.enemiesPerWaveScale,
    waveGroupCount:
      r.waveGroupCount != null ? r.waveGroupCount : g.waveGroupCount,
    loseMode: r.loseMode != null ? r.loseMode : g.loseMode != null ? g.loseMode : 1,
    lastStand: r.lastStand != null ? r.lastStand === true : g.lastStand === true,
    dodgeQuota:
      r.dodgeQuota != null ? r.dodgeQuota : g.dodgeQuota != null ? g.dodgeQuota : 4,
    area: r.area || g.area || null,
    territory: r.territory || g.territory || null,
    playerMaxHp: r.playerMaxHp != null ? r.playerMaxHp : g.playerMaxHp,
    playerSpeed: r.playerSpeed != null ? r.playerSpeed : g.playerSpeed,
    playerActiveSkills: skills,
  };
}

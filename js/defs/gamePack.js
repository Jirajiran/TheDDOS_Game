/**
 * GAME_PACK shell. Camera / place / hotbar fields come from data/pack/game_pack.json.
 * Wave timing and player HP/speed/skills come from data/pack/rules.json only.
 */

import { getRulesConfig } from './registry.js';

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
 * @param {object} rulesDoc rules.json (source for the overlaid balance fields)
 */
export function installGamePack(doc, rulesDoc) {
  const src = (doc && doc.pack) || {};
  const r = rulesDoc || {};
  const skills = Array.isArray(r.playerActiveSkills)
    ? Object.freeze(r.playerActiveSkills.slice())
    : Object.freeze([]);
  const merged = {
    ...src,
    targetWaveToWin: r.targetWaveToWin,
    setupPhaseDurationSec: r.setupPhaseDurationSec,
    waveCountdownSec: r.waveCountdownSec,
    enemiesPerWaveBase: r.enemiesPerWaveBase,
    enemiesPerWaveScale: r.enemiesPerWaveScale,
    waveGroupCount: r.waveGroupCount,
    loseMode: r.loseMode != null ? r.loseMode : 1,
    dodgeQuota: r.dodgeQuota != null ? r.dodgeQuota : 4,
    area: r.area || null,
    territory: r.territory || null,
    playerMaxHp: r.playerMaxHp,
    playerSpeed: r.playerSpeed,
    playerActiveSkills: skills,
  };
  GAME_PACK = cloneFreeze(merged);
  WAVE_COUNTDOWN_STUB_SEC = GAME_PACK.waveCountdownSec;
}

/**
 * GAME_PACK with rules.json winning on wave timing and player HP/speed/skills.
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
    dodgeQuota:
      r.dodgeQuota != null ? r.dodgeQuota : g.dodgeQuota != null ? g.dodgeQuota : 4,
    area: r.area || g.area || null,
    territory: r.territory || g.territory || null,
    playerMaxHp: r.playerMaxHp != null ? r.playerMaxHp : g.playerMaxHp,
    playerSpeed: r.playerSpeed != null ? r.playerSpeed : g.playerSpeed,
    playerActiveSkills: skills,
  };
}

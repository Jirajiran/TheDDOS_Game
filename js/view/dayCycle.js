/**
 * Day / night — clock, bars, night01 from pack day.json (defs getDayConfig).
 * AI fire-decision mul only; weapon projectile range unchanged.
 */

import { getDayConfig } from '../defs/api.js';
import {
  getWeaponAiFireRangePx,
  getWeaponMaxRangePx,
  GAME_PACK,
} from '../config.js';

function cfg() {
  return getDayConfig();
}

/** Clock hour 0–24 from simTime; simTime 0 = startHour. */
export function getClockHourFloat(simTimeSec, day) {
  const d = day || cfg();
  const daySec = d.dayLengthSec > 0 ? d.dayLengthSec : 1440;
  const start = Number.isFinite(d.startHour) ? d.startHour : 6;
  const t = (((simTimeSec || 0) % daySec) + daySec) % daySec;
  return (start + (t / daySec) * 24) % 24;
}

export function formatClockFromSim(simTimeSec, day) {
  const hoursFloat = getClockHourFloat(simTimeSec, day);
  let h = Math.floor(hoursFloat);
  const m = Math.floor((hoursFloat - h) * 60);
  const ap = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${m < 10 ? '0' : ''}${m} ${ap}`;
}

/** 0 = full day, 1 = full night (hard edge at dawn/dusk). */
export function getNight01(simTimeSec, day) {
  const d = day || cfg();
  const hour = getClockHourFloat(simTimeSec, d);
  const dawn = Number.isFinite(d.dawnHour) ? d.dawnHour : 6;
  const dusk = Number.isFinite(d.duskHour) ? d.duskHour : 18;
  if (hour >= dawn && hour < dusk) return 0;
  return 1;
}

/**
 * Day-bar phase for HUD: morning progress in day window, night in night window.
 * @returns {{ isMorning: boolean, progress: number }}
 */
export function getDayBarPhase(simTimeSec, day) {
  const d = day || cfg();
  const hour = getClockHourFloat(simTimeSec, d);
  const dawn = Number.isFinite(d.dawnHour) ? d.dawnHour : 6;
  const dusk = Number.isFinite(d.duskHour) ? d.duskHour : 18;
  if (hour >= dawn && hour < dusk) {
    const span = Math.max(0.001, dusk - dawn);
    return { isMorning: true, progress: (hour - dawn) / span };
  }
  const nightLen = Math.max(0.001, 24 - (dusk - dawn));
  const intoNight = hour >= dusk ? hour - dusk : hour + (24 - dusk);
  return { isMorning: false, progress: intoNight / nightLen };
}

/** Smooth night blend on match (for overlay + camera tween). */
export function tickNightBlend(match, dt) {
  if (!match) return 0;
  const d = cfg();
  const target = getNight01(match.simTime || 0, d);
  const speed =
    typeof d.nightCameraTweenPerSec === 'number'
      ? d.nightCameraTweenPerSec
      : 1.8;
  let cur =
    typeof match.nightBlend === 'number' ? match.nightBlend : target;
  const maxStep = Math.max(0, speed) * (dt > 0 ? dt : 0.016);
  if (cur < target) cur = Math.min(target, cur + maxStep);
  else if (cur > target) cur = Math.max(target, cur - maxStep);
  match.nightBlend = cur;
  return cur;
}

export function getNightOverlayStyle(nightBlend, day) {
  const d = day || cfg();
  const maxA =
    typeof d.nightOverlayMaxAlpha === 'number' ? d.nightOverlayMaxAlpha : 0.32;
  const blend = Math.max(0, Math.min(1, nightBlend || 0));
  return {
    color: d.nightOverlayColor || '#55008C',
    alpha: blend * maxA,
  };
}

export function getNightCameraZoomMul(nightBlend, day) {
  const d = day || cfg();
  const nightMul =
    typeof d.nightCameraZoomMul === 'number' ? d.nightCameraZoomMul : 0.98;
  const blend = Math.max(0, Math.min(1, nightBlend || 0));
  return 1 + (nightMul - 1) * blend;
}

/**
 * AI fire-decision range only (when unit emits FIRE).
 * Uses weapon.aiFireRangePath (JSON); projectile still uses maxDistancePath.
 * Night mul for enemies; turret mul only when day.applyNightTurretAiFire.
 */
export function getAiFireDecisionRangePx(weapon, match, unit) {
  const base =
    getWeaponAiFireRangePx(weapon) ||
    getWeaponMaxRangePx(weapon) ||
    (GAME_PACK && GAME_PACK.enemyFireRadius) ||
    0;
  if (base <= 0) return 0;
  if (!unit || !match) return base;

  const d = cfg();
  const night01 = getNight01(match.simTime || 0, d);

  if (unit.role === 'enemy') {
    const mul =
      typeof d.nightEnemyAiFireMul === 'number' ? d.nightEnemyAiFireMul : 1;
    return base * (1 + (mul - 1) * night01);
  }

  if (
    (unit.isTurret || unit.role === 'turret' || unit.kind === 'turret') &&
    d.applyNightTurretAiFire
  ) {
    const mul =
      typeof d.nightTurretAiFireMul === 'number' ? d.nightTurretAiFireMul : 1;
    return base * (1 + (mul - 1) * night01);
  }

  return base;
}

/**
 * Short SFX. Call sites name an event id. The pack row names the file.
 * A missing row or a missing file stays silent.
 */

const AUDIO_BASE = 'Asset/AudioV2/';
const MUTE_KEY = 'theddos_mute';

const RELOAD_KEY = {
  M1991: 'reload.M1991',
  KAR98: 'reload.KAR98',
  MEDIC_GUN: 'reload.MEDIC_GUN',
  GRENADE_LAUNCHER: 'reload.GRENADE_LAUNCHER',
  SHOTGUN_SHELL: 'reload.SHOTGUN',
  SHOTGUN_BUCK: 'reload.SHOTGUN',
};

let sounds = Object.create(null);
let unlocked = false;
let loops = Object.create(null);

export function installAudioPack(doc) {
  const next = doc && doc.sounds;
  sounds = next && typeof next === 'object' ? next : Object.create(null);
}

function muted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch (_) {
    return false;
  }
}

function fileFor(id) {
  if (!id) return null;
  if (sounds[id]) return sounds[id];
  if (id.startsWith('weapon.') && id.endsWith('_MODIFIED')) {
    const base = id.slice(0, -'_MODIFIED'.length);
    if (sounds[base]) return sounds[base];
  }
  if (id.startsWith('weapon.')) return sounds['weapon.OTHER'] || null;
  return null;
}

export function playSfx(id) {
  if (!unlocked || muted()) return;
  const file = fileFor(id);
  if (!file || typeof Audio === 'undefined') return;
  try {
    const clip = new Audio(`${AUDIO_BASE}${file}`);
    clip.volume = 0.5;
    const pending = clip.play();
    if (pending && typeof pending.catch === 'function') pending.catch(() => {});
  } catch (_) {
    /* missing file or blocked playback */
  }
}

export function playWeaponSfx(weaponId) {
  if (!weaponId) return;
  playSfx(`weapon.${weaponId}`);
}

export function playReloadSfx(weaponId) {
  if (!weaponId) return;
  const id = String(weaponId).replace(/_MODIFIED$/, '');
  playSfx(RELOAD_KEY[id] || 'reload.MAG');
}

function loopFor(id) {
  if (loops[id]) return loops[id];
  const file = fileFor(id);
  if (!file || typeof Audio === 'undefined') return null;
  const clip = new Audio(`${AUDIO_BASE}${file}`);
  clip.loop = true;
  clip.volume = 0;
  loops[id] = clip;
  return clip;
}

function setLoop(id, volume) {
  const clip = loopFor(id);
  if (!clip) return;
  if (!unlocked || muted() || volume <= 0.001) {
    clip.pause();
    return;
  }
  clip.volume = volume;
  if (clip.paused) {
    const pending = clip.play();
    if (pending && typeof pending.catch === 'function') pending.catch(() => {});
  }
}

/** Day wind and birds, night bed. Volumes follow the night blend already in the match. */
export function tickAmbience(nightBlend) {
  const night = Math.max(0, Math.min(1, nightBlend || 0));
  const day = 1 - night;
  setLoop('ambience.wind', day * 0.35);
  setLoop('ambience.bird', day * 0.28);
  setLoop('ambience.night', night * 0.4);
}

export function stopAmbience() {
  const keys = Object.keys(loops);
  for (let i = 0; i < keys.length; i++) loops[keys[i]].pause();
}

function unlock() {
  unlocked = true;
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', unlock, { capture: true });
  window.addEventListener('keydown', unlock, { capture: true });
}

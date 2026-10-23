/**
 * Short SFX. Call sites name an event id. The pack row names the file.
 * A missing row or a missing file stays silent.
 */

const AUDIO_BASE = 'Audio/';
const MUTE_KEY = 'theddos_mute';

let sounds = Object.create(null);
let unlocked = false;

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

function unlock() {
  unlocked = true;
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', unlock, { capture: true });
  window.addEventListener('keydown', unlock, { capture: true });
}

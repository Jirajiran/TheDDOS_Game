/**
 * Fixed SFX pool. One set of voices per file, built once and kept.
 * A play restarts a voice already in the ring. The ring never grows or shrinks.
 * A missing row or a file that never becomes ready stays silent.
 */

const AUDIO_BASE = 'Asset/AudioV2/';
const MUTE_KEY = 'theddos_mute';
const SFX_VOLUME = 0.5;
/** One-shot ceiling per file. A full ring restarts the oldest voice. */
const ONE_SHOT_VOICES = 3;
const READY_STATE = 2;
const WARM_MS = 4000;

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
/** @type {Record<string, { voices: HTMLAudioElement[], cursor: number, loop: boolean }> | null} */
let voicesByFile = null;
let warmPromise = null;

export function installAudioPack(doc) {
  const next = doc && doc.sounds;
  sounds = next && typeof next === 'object' ? next : Object.create(null);
}

/**
 * Build the voice ring once. Later calls return the same set.
 * Call after the pack is installed, before the first shot or menu click.
 */
export function warmSfxPool() {
  if (warmPromise) return warmPromise;
  warmPromise = buildPool();
  return warmPromise;
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

function buildPool() {
  const next = Object.create(null);
  if (typeof Audio === 'undefined') {
    voicesByFile = next;
    return Promise.resolve(next);
  }

  const loopByFile = Object.create(null);
  const ids = Object.keys(sounds);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const file = sounds[id];
    if (!file) continue;
    const loop = id.startsWith('ambience.');
    if (loopByFile[file] == null) loopByFile[file] = loop;
  }

  const pending = [];
  const files = Object.keys(loopByFile);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const loop = loopByFile[file];
    const count = loop ? 1 : ONE_SHOT_VOICES;
    const voices = new Array(count);
    for (let v = 0; v < count; v++) {
      const clip = new Audio();
      clip.preload = 'auto';
      clip.loop = loop;
      clip.volume = loop ? 0 : SFX_VOLUME;
      clip.src = `${AUDIO_BASE}${file}`;
      voices[v] = clip;
      pending.push(waitReady(clip));
    }
    next[file] = { voices, cursor: 0, loop };
  }

  voicesByFile = next;
  return Promise.all(pending).then(() => next);
}

function waitReady(clip) {
  if (clip.readyState >= READY_STATE) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(finish, WARM_MS);
    function finish() {
      clearTimeout(timer);
      clip.removeEventListener('canplay', finish);
      clip.removeEventListener('error', finish);
      resolve();
    }
    clip.addEventListener('canplay', finish);
    clip.addEventListener('error', finish);
    try {
      clip.load();
    } catch (_) {
      finish();
    }
  });
}

function takeVoice(slot) {
  const voices = slot.voices;
  const n = voices.length;
  for (let i = 0; i < n; i++) {
    const idx = (slot.cursor + i) % n;
    const clip = voices[idx];
    if (clip.readyState < READY_STATE) continue;
    slot.cursor = (idx + 1) % n;
    return clip;
  }
  return null;
}

function replay(clip) {
  try {
    clip.volume = SFX_VOLUME;
    clip.pause();
    clip.currentTime = 0;
    const pending = clip.play();
    if (pending && typeof pending.catch === 'function') pending.catch(() => {});
  } catch (_) {
    /* element not seekable yet */
  }
}

export function playSfx(id) {
  if (!unlocked || muted() || !voicesByFile) return;
  const file = fileFor(id);
  if (!file) return;
  const slot = voicesByFile[file];
  if (!slot || slot.loop) return;
  const clip = takeVoice(slot);
  if (!clip) return;
  replay(clip);
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
  if (!voicesByFile) return null;
  const file = fileFor(id);
  if (!file) return null;
  const slot = voicesByFile[file];
  if (!slot) return null;
  return slot.voices[0];
}

function setLoop(id, volume) {
  const clip = loopFor(id);
  if (!clip || clip.readyState < READY_STATE) return;
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
  if (!voicesByFile) return;
  const files = Object.keys(voicesByFile);
  for (let i = 0; i < files.length; i++) {
    const slot = voicesByFile[files[i]];
    if (slot.loop) slot.voices[0].pause();
  }
}

function unlock() {
  unlocked = true;
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', unlock, { capture: true });
  window.addEventListener('keydown', unlock, { capture: true });
}

import {
  MEMENTO_STORAGE_KEY,
  MEMENTO_STORAGE_KEY_LEGACY,
  AUTOSAVE_INTERVAL_SEC,
  FEATURE_SNAPSHOT,
} from './config.js';

/**
 * Local Host memento — single autosave slot in localStorage + optional JSON export.
 * Gated by FEATURE_SNAPSHOT (false = deferred / no-op).
 */

export { AUTOSAVE_INTERVAL_SEC, FEATURE_SNAPSHOT };

function readStorageRaw(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Prefer new key; if only legacy WantToPlay slot exists, migrate once. */
function migrateLegacySnapshotIfNeeded() {
  if (!FEATURE_SNAPSHOT) return;
  try {
    if (localStorage.getItem(MEMENTO_STORAGE_KEY)) return;
    const legacy = localStorage.getItem(MEMENTO_STORAGE_KEY_LEGACY);
    if (!legacy) return;
    localStorage.setItem(MEMENTO_STORAGE_KEY, legacy);
    localStorage.removeItem(MEMENTO_STORAGE_KEY_LEGACY);
  } catch {
    /* ignore */
  }
}

/**
 * Drop corrupt / unreadable autosave so MENU never hangs on bad legacy data.
 * No-op when FEATURE_SNAPSHOT is false.
 */
export function sanitizeLocalSnapshot() {
  if (!FEATURE_SNAPSHOT) return { ok: true, cleared: false, skipped: true };
  migrateLegacySnapshotIfNeeded();
  try {
    const raw = localStorage.getItem(MEMENTO_STORAGE_KEY);
    if (!raw) return { ok: true, cleared: false };
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') {
      localStorage.removeItem(MEMENTO_STORAGE_KEY);
      return { ok: false, cleared: true, reason: 'not-object' };
    }
    return { ok: true, cleared: false };
  } catch {
    try {
      localStorage.removeItem(MEMENTO_STORAGE_KEY);
      localStorage.removeItem(MEMENTO_STORAGE_KEY_LEGACY);
    } catch {
      /* ignore */
    }
    return { ok: false, cleared: true, reason: 'parse-error' };
  }
}

export function hasLocalSnapshot() {
  if (!FEATURE_SNAPSHOT) return false;
  migrateLegacySnapshotIfNeeded();
  const check = sanitizeLocalSnapshot();
  if (!check.ok) return false;
  return !!readStorageRaw(MEMENTO_STORAGE_KEY);
}

export function clearLocalSnapshot() {
  if (!FEATURE_SNAPSHOT) return;
  try {
    localStorage.removeItem(MEMENTO_STORAGE_KEY);
    localStorage.removeItem(MEMENTO_STORAGE_KEY_LEGACY);
  } catch {
    /* ignore */
  }
}

export function loadLocalSnapshotRaw() {
  if (!FEATURE_SNAPSHOT) return null;
  migrateLegacySnapshotIfNeeded();
  try {
    const raw = localStorage.getItem(MEMENTO_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLocalSnapshotRaw(data) {
  if (!FEATURE_SNAPSHOT) return false;
  try {
    localStorage.setItem(MEMENTO_STORAGE_KEY, JSON.stringify(data));
    localStorage.removeItem(MEMENTO_STORAGE_KEY_LEGACY);
    return true;
  } catch {
    return false;
  }
}

/** Serialize runtime match into a plain JSON-safe object. */
export function serializeMatchSnapshot(match) {
  if (!match || !match.world) return null;
  const units = [];
  const poolU = match.pools.units;
  for (let i = 0; i < poolU.length; i++) {
    const u = poolU[i];
    if (!u.active) continue;
    units.push({
      id: u.id,
      role: u.role,
      team: u.team,
      collisionLayer: u.collisionLayer,
      pierceCost: u.pierceCost,
      x: u.x,
      y: u.y,
      hp: u.hp,
      maxHp: u.maxHp,
      speed: u.speed,
      radius: u.radius,
      armorType: u.armorType,
      weaponId: u.weaponId,
      ammoInMag: u.ammoInMag,
      mags: u.mags,
      reloadTimer: u.reloadTimer,
      facingRad: u.facingRad,
      aimRad: u.aimRad,
      archetypeId: u.archetypeId || null,
      sizeScale: u.sizeScale || 1,
      isBoss: !!u.isBoss,
      groupId: u.groupId,
      pivotIndex: u.pivotIndex,
      aiStage: u.aiStage,
      aggroChase: !!u.aggroChase,
      combatTargetKind: u.combatTargetKind,
      combatTargetId: u.combatTargetId,
      aggroBlockId: u.aggroBlockId != null ? u.aggroBlockId : -1,
      localGeneral: !!u.localGeneral,
    });
  }

  const blocks = [];
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (!b.alive) continue;
    blocks.push({
      id: b.id,
      itemId: b.itemId,
      gx: b.gx,
      gy: b.gy,
      hp: b.hp,
      maxHp: b.maxHp,
      isOpen: !!b.isOpen,
      fireCooldown: b.fireCooldown || 0,
      turretAimRad: b.turretAimRad || 0,
      genStock: b.genStock || 0,
      genTimer: b.genTimer || 0,
      collisionLayer: b.collisionLayer,
      pierceCost: b.pierceCost,
      generatorList: b.generatorList
        ? b.generatorList.map((g) => ({
            itemId: g.itemId,
            amount: g.amount,
            intervalSec: g.intervalSec,
            timer: g.timer,
            stock: g.stock,
          }))
        : null,
      factoryBusy: !!b.factoryBusy,
      factoryTimer: b.factoryTimer || 0,
      factoryWeaponId: b.factoryWeaponId || null,
    });
  }

  const drops = [];
  const poolD = match.pools.drops;
  for (let i = 0; i < poolD.length; i++) {
    const d = poolD[i];
    if (!d.active) continue;
    drops.push({
      x: d.x,
      y: d.y,
      vx: d.vx || 0,
      vy: d.vy || 0,
      itemId: d.itemId,
      stack: d.stack,
      age: d.age,
    });
  }

  const inventory = match.inventory.map((s) => ({
    itemId: s.itemId,
    count: s.count,
    kind: s.kind,
    weaponId: s.weaponId,
    ammoInMag: s.ammoInMag,
    mags: s.mags,
    reloadTimer: s.reloadTimer,
    toolTier: s.toolTier,
    label: s.label,
    color: s.color,
  }));

  return {
    version: 1,
    savedAt: Date.now(),
    gameMode: match.gameMode,
    pathGridN: match.world.pathGridN,
    phase: match.phase,
    waveIndex: match.waveIndex,
    waveCountdown: match.waveCountdown,
    waveActive: match.waveActive,
    enemiesAlive: match.enemiesAlive,
    basePlaced: match.basePlaced,
    outcome: match.outcome,
    activeHotbar: match.activeHotbar,
    playerUnitId: match.playerUnitId,
    playerDead: match.playerDead,
    respawnTimer: match.respawnTimer,
    cameraZoom: match.cameraZoom,
    freeCraft: !!match.freeCraft,
    stats: { ...match.stats },
    inventory,
    blocks,
    units,
    drops,
    general: match.general
      ? {
          targetPathIndex: match.general.targetPathIndex,
          laneCursorBySide: { ...match.general.laneCursorBySide },
          groups: (match.general.groups || []).map((g) => ({
            id: g.id,
            lane: g.lane,
            side: g.side,
            pivots: g.pivots,
            segmentIndex: g.segmentIndex,
            unitIds: g.unitIds.slice(),
            spotted: !!g.spotted,
            sectorStart: g.sectorStart,
            sectorEnd: g.sectorEnd,
          })),
        }
      : null,
    pathPipeMask: match.pathPipeMask
      ? {
          active: !!match.pathPipeMask.active,
          maskedKeys: Array.from(match.pathPipeMask.maskedKeys || []),
        }
      : null,
    baseChunk: match.baseChunk
      ? {
          x: match.baseChunk.x,
          y: match.baseChunk.y,
          w: match.baseChunk.w,
          h: match.baseChunk.h,
          cx: match.baseChunk.cx,
          cy: match.baseChunk.cy,
          navPoints: match.baseChunk.navPoints || null,
        }
      : null,
  };
}

/** Persist match into the single autosave localStorage slot. */
export function writeAutosave(match) {
  if (!FEATURE_SNAPSHOT) return false;
  const snap = serializeMatchSnapshot(match);
  if (!snap) return false;
  return saveLocalSnapshotRaw(snap);
}

export function downloadSnapshotJson(snapshot, filename) {
  if (!FEATURE_SNAPSHOT || !snapshot) return;
  const name =
    filename ||
    `theddos-save-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Manual export — download only; does not touch autosave. */
export function exportMatchSnapshotFile(match) {
  if (!FEATURE_SNAPSHOT) return false;
  const snap = serializeMatchSnapshot(match);
  if (!snap) return false;
  downloadSnapshotJson(snap);
  return true;
}

/**
 * Parse a user-picked save JSON. Returns snapshot object or null.
 * Accepts either a full snapshot or `{ snapshot: {...} }` wrapper.
 */
export function parseSnapshotFileText(text) {
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object') return null;
    if (data.inventory && data.units && data.blocks) return data;
    if (data.snapshot && data.snapshot.inventory) return data.snapshot;
    if (data.version && (data.inventory || data.waveIndex != null)) return data;
    return null;
  } catch {
    return null;
  }
}

/** Load exported file into Local Host autosave slot (for Restore). */
export function importSnapshotIntoAutosave(snapshot) {
  if (!snapshot) return false;
  return saveLocalSnapshotRaw(snapshot);
}

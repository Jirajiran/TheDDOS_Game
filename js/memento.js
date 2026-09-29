import { MEMENTO_STORAGE_KEY, AUTOSAVE_INTERVAL_SEC } from './config.js';

/**
 * Local Host memento — single autosave slot in localStorage + optional JSON export.
 * Autosave: throttled while PLAYING (see AUTOSAVE_INTERVAL_SEC).
 * Win/Lose: clear autosave (no Restore after finished match).
 * Manual Save: download file only — does NOT write autosave.
 */

export { AUTOSAVE_INTERVAL_SEC };

export function hasLocalSnapshot() {
  try {
    return !!localStorage.getItem(MEMENTO_STORAGE_KEY);
  } catch {
    return false;
  }
}

export function clearLocalSnapshot() {
  try {
    localStorage.removeItem(MEMENTO_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function loadLocalSnapshotRaw() {
  try {
    const raw = localStorage.getItem(MEMENTO_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLocalSnapshotRaw(data) {
  try {
    localStorage.setItem(MEMENTO_STORAGE_KEY, JSON.stringify(data));
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
  const snap = serializeMatchSnapshot(match);
  if (!snap) return false;
  return saveLocalSnapshotRaw(snap);
}

export function downloadSnapshotJson(snapshot, filename) {
  if (!snapshot) return;
  const name =
    filename ||
    `wanttoplay-save-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
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

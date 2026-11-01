/**
 * Real pages for boot, menu, match loading, and one play document.
 * The map name rides in sessionStorage, then in the play page hash.
 */

export const PAGE_MAP_KEY = 'theddos_page_map';

export function pageId() {
  const body = document.body;
  const id = body && body.dataset.page;
  return id || 'boot';
}

export function mapToken(name) {
  const clean = String(name || 'FLATLAND').replace(/[^A-Za-z0-9_-]/g, '');
  return clean || 'FLATLAND';
}

export function writePageHandoff(row) {
  const next = {
    mapName: mapToken(row && row.mapName),
    gameMode: row && row.gameMode ? String(row.gameMode) : 'FLAT_SURVIVAL',
    worldPick: row && row.worldPick ? String(row.worldPick) : 'flat',
    restore: !!(row && row.restore),
    skinId: row && row.skinId ? String(row.skinId) : 'Skin_Default_1',
  };
  sessionStorage.setItem(PAGE_MAP_KEY, JSON.stringify(next));
  return next;
}

export function readPageHandoff() {
  try {
    const raw = sessionStorage.getItem(PAGE_MAP_KEY);
    if (!raw) return null;
    const row = JSON.parse(raw);
    if (!row || typeof row.mapName !== 'string' || !row.mapName) return null;
    row.mapName = mapToken(row.mapName);
    return row;
  } catch (_) {
    return null;
  }
}

export function hashMapName() {
  const raw = decodeURIComponent((location.hash || '').replace(/^#/, ''));
  if (!raw) return '';
  return mapToken(raw);
}

export function goPage(href) {
  location.assign(href);
}

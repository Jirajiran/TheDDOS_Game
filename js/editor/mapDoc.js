/**
 * One editor map file. The path grid is chosen once at creation and then locked.
 * The page cache is only for this editor tab. Current edits overwrite it.
 */

import { normalizeTeamRows, teamIdsFromDoc } from '../defs/teams.js';

export const PATH_SIZE = 1024;
export const MAX_SIDE = 8;
export const CACHE_KEY = 'theddos_editor_page';

export function sanitizeMapName(raw) {
  const text = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '');
  return text || 'untitled_map';
}

export function clampSide(value) {
  const side = value | 0;
  if (side < 1 || side > MAX_SIDE) return 0;
  return side;
}

export function worldSize(doc) {
  return {
    w: (doc.pathCols | 0) * PATH_SIZE,
    h: (doc.pathRows | 0) * PATH_SIZE,
  };
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value == null ? {} : value));
}

const FALLBACK_DAMAGE_MATRIX = {
  DEFAULT: { DEFAULT: 1, BULLET: 1.25, EXPLOSION: 0.9, LAZER: 0.75 },
  BULLET: { DEFAULT: 0.5, BULLET: 0.75, EXPLOSION: 0.85, LAZER: 0.5 },
  EXPLOSION: { DEFAULT: 1.4, BULLET: 0.9, EXPLOSION: 0.7, LAZER: 0.8 },
  LAZER: { DEFAULT: 1.6, BULLET: 1.4, EXPLOSION: 1.1, LAZER: 0.6 },
};

export function cloneDamageMatrix(src) {
  const raw = src && src.matrix && typeof src.matrix === 'object' && !Array.isArray(src.matrix) ? src.matrix : null;
  const matrix = raw && Object.keys(raw).length ? cloneData(raw) : cloneData(FALLBACK_DAMAGE_MATRIX);
  return {
    version: src && src.version ? String(src.version) : '1.0.0',
    matrix: matrix,
  };
}

export function damageTypeNames(doc) {
  const matrix = doc && doc.damageMatrix && doc.damageMatrix.matrix;
  if (!matrix || typeof matrix !== 'object' || Array.isArray(matrix)) return Object.keys(FALLBACK_DAMAGE_MATRIX);
  const names = Object.keys(matrix);
  return names.length ? names : Object.keys(FALLBACK_DAMAGE_MATRIX);
}

export function armorTypeNames(doc) {
  const matrix = doc && doc.damageMatrix && doc.damageMatrix.matrix;
  const rows = matrix && typeof matrix === 'object' && !Array.isArray(matrix) ? Object.keys(matrix) : [];
  const seen = {};
  const names = [];
  for (let i = 0; i < rows.length; i++) {
    const row = matrix[rows[i]];
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const cols = Object.keys(row);
    for (let c = 0; c < cols.length; c++) {
      if (seen[cols[c]]) continue;
      seen[cols[c]] = true;
      names.push(cols[c]);
    }
  }
  if (!names.length) return Object.keys(FALLBACK_DAMAGE_MATRIX.DEFAULT);
  return names;
}

export function normalizeTeams(teams) {
  return normalizeTeamRows(teams);
}

function mapTeamIds(doc) {
  return teamIdsFromDoc(doc);
}

function keptAreaId(doc, areaId) {
  const areas = doc.areas || [];
  for (let i = 0; i < areas.length; i++) {
    if (areas[i].id === areaId) return areaId;
  }
  return areas[0] && areas[0].id ? areas[0].id : '';
}

function keptUnitId(doc, unitId) {
  if (unitId && doc.units && Object.prototype.hasOwnProperty.call(doc.units, unitId)) return unitId;
  if (doc.units && doc.units.PLAYER) return 'PLAYER';
  const ids = Object.keys(doc.units || {});
  return ids[0] || '';
}

export function ensurePlayerSpawns(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  const teamIds = mapTeamIds(doc);
  if (!Array.isArray(doc.playerSpawns)) doc.playerSpawns = [];
  let host = null;
  const players = [];
  for (let i = 0; i < doc.playerSpawns.length; i++) {
    const row = doc.playerSpawns[i];
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    if (row.role === 'host' && !host) host = row;
    else if (row.role === 'player') players.push(row);
  }
  if (!host) {
    host = { role: 'host', unitId: '', team: teamIds[0] || 0, areaId: '' };
  }
  host.role = 'host';
  host.unitId = keptUnitId(doc, host.unitId);
  host.areaId = keptAreaId(doc, host.areaId);
  const used = {};
  let hostTeam = host.team | 0;
  if (!teamIds.length || teamIds.indexOf(hostTeam) < 0) hostTeam = teamIds[0] || 1;
  host.team = hostTeam;
  const maxPlayers = teamIds.length || 1;
  const nextPlayers = [];
  for (let i = 0; i < players.length && nextPlayers.length < maxPlayers; i++) {
    const row = players[i];
    let team = row.team | 0;
    if (teamIds.indexOf(team) < 0 || used[team]) {
      team = 0;
      for (let t = 0; t < teamIds.length; t++) {
        if (!used[teamIds[t]]) {
          team = teamIds[t];
          break;
        }
      }
    }
    if (!team) continue;
    used[team] = true;
    row.role = 'player';
    row.team = team;
    row.unitId = keptUnitId(doc, row.unitId);
    row.areaId = keptAreaId(doc, row.areaId);
    nextPlayers.push(row);
  }
  doc.playerSpawns = [host].concat(nextPlayers);
  doc.playerFriendlyFire = doc.playerFriendlyFire === true;
  if (!Array.isArray(doc.spawns)) doc.spawns = [];
  for (let i = 0; i < doc.spawns.length; i++) {
    const row = doc.spawns[i];
    if (!row || typeof row !== 'object') continue;
    row.areaId = keptAreaId(doc, row.areaId);
  }
  return doc;
}

export function spawnPoint(doc, row) {
  const areaId = row && row.areaId;
  const areas = (doc && doc.areas) || [];
  for (let i = 0; i < areas.length; i++) {
    if (areas[i].id === areaId) {
      return {
        x: areas[i].x + areas[i].w / 2,
        y: areas[i].y + areas[i].h / 2,
        areaId: areas[i].id,
      };
    }
  }
  const world = worldSize(doc);
  return { x: world.w / 2, y: world.h / 2, areaId: '' };
}

export function spawnRow(doc, key) {
  if (!doc || !key) return null;
  if (key === 'host') {
    const seats = doc.playerSpawns || [];
    for (let i = 0; i < seats.length; i++) {
      if (seats[i].role === 'host') return seats[i];
    }
    return null;
  }
  if (key.indexOf('player:') === 0) {
    const index = key.slice(7) | 0;
    const seats = doc.playerSpawns || [];
    let seen = 0;
    for (let i = 0; i < seats.length; i++) {
      if (seats[i].role !== 'player') continue;
      if (seen === index) return seats[i];
      seen += 1;
    }
    return null;
  }
  if (key.indexOf('wave:') === 0) {
    const index = key.slice(5) | 0;
    return doc.spawns && doc.spawns[index] ? doc.spawns[index] : null;
  }
  return null;
}

/** GRUNT_BASIC → Grunt_Basic; keeps SMG / M1991-style tokens. */
export function formatCatalogId(raw) {
  if (raw == null || raw === '') return '';
  const text = String(raw).trim();
  if (!text) return '';
  const keep = {
    SMG: 'SMG',
    AK47: 'AK47',
    RPG: 'RPG',
    M1991: 'M1991',
    M1911: 'M1911',
    KAR98: 'KAR98',
    '50CAL': '50Cal',
    T1: 'T1',
    T2: 'T2',
    T3: 'T3',
  };
  const parts = text.split('_');
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) {
      out.push(part);
      continue;
    }
    const upper = part.toUpperCase();
    if (keep[upper]) {
      out.push(keep[upper]);
      continue;
    }
    if (/^\d/.test(part)) {
      out.push(part.charAt(0) + part.slice(1).toLowerCase());
      continue;
    }
    out.push(part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
  }
  return out.join('_');
}

function rewriteCatalogStrings(node, remap) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (typeof node[i] === 'string' && remap[node[i]]) node[i] = remap[node[i]];
      else rewriteCatalogStrings(node[i], remap);
    }
    return;
  }
  const keys = Object.keys(node);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = node[key];
    if (typeof value === 'string') {
      if (key === 'label' || key === 'description' || key === 'color' || key === 'markerColor') continue;
      if (remap[value]) node[key] = remap[value];
    } else {
      rewriteCatalogStrings(value, remap);
    }
  }
}

function normalizeCatalogMap(map) {
  const src = map && typeof map === 'object' ? map : {};
  const remap = {};
  const keys = Object.keys(src);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const rec = src[key];
    const nextId = formatCatalogId((rec && rec.id) || key);
    remap[key] = nextId;
    if (key !== nextId) remap[key.toUpperCase()] = nextId;
    if (rec && typeof rec === 'object' && typeof rec.id === 'string') rec.id = nextId;
  }
  const next = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const nid = remap[key] || formatCatalogId(key);
    next[nid] = src[key];
  }
  rewriteCatalogStrings(next, remap);
  return next;
}

export function sheetsFromPack(pack) {
  const game = (pack.gamePack && pack.gamePack.pack) || {};
  const rules = cloneData(pack.rules || {});
  if (game.respawnBaseSec != null) rules.respawnBaseSec = game.respawnBaseSec;
  if (game.respawnExtraPerWave != null) rules.respawnExtraPerWave = game.respawnExtraPerWave;
  const units = normalizeCatalogMap(cloneData((pack.units && pack.units.units) || {}));
  const weapons = normalizeCatalogMap(cloneData((pack.weapons && pack.weapons.weapons) || {}));
  const items = normalizeCatalogMap(cloneData((pack.items && pack.items.items) || {}));
  const skills = normalizeCatalogMap(cloneData((pack.skills && pack.skills.skills) || {}));
  const cross = {};
  function absorb(map) {
    const ids = Object.keys(map);
    for (let i = 0; i < ids.length; i++) {
      cross[ids[i]] = ids[i];
      cross[ids[i].toUpperCase()] = ids[i];
    }
  }
  absorb(units);
  absorb(weapons);
  absorb(items);
  absorb(skills);
  rewriteCatalogStrings(units, cross);
  rewriteCatalogStrings(weapons, cross);
  rewriteCatalogStrings(items, cross);
  rewriteCatalogStrings(skills, cross);
  return {
    units,
    weapons,
    items,
    skills,
    rules,
    teams: normalizeTeams(game.teams),
    damageMatrix: cloneDamageMatrix(pack.damageMatrix),
  };
}

const MIX_SKILLS = {
  Wire: {
    id: 'Wire',
    label: 'Wire',
    castTimeSec: 0,
    activeDurationSec: 0,
    cooldownSec: 0,
    effect: { type: 'PASS_THROUGH', allowProjectilePass: true },
  },
  Heal: {
    id: 'Heal',
    label: 'Heal',
    castTimeSec: 0,
    activeDurationSec: 0,
    cooldownSec: 0,
    effect: { type: 'HEAL_RADIUS', healRadius: 160, healPerSec: 5 },
  },
};

export function ensureMixSkills(doc) {
  if (!doc.skills || typeof doc.skills !== 'object') doc.skills = {};
  const ids = Object.keys(MIX_SKILLS);
  for (let i = 0; i < ids.length; i++) {
    if (!doc.skills[ids[i]]) doc.skills[ids[i]] = cloneData(MIX_SKILLS[ids[i]]);
  }
  return doc;
}

export function createMapDoc(opts) {
  const pathCols = clampSide(opts.pathCols);
  const pathRows = clampSide(opts.pathRows);
  if (!pathCols || !pathRows) {
    throw new Error('Path grid must be 1 to 8 on each side');
  }
  const doc = {
    kind: 'theddos-map',
    version: '1',
    name: sanitizeMapName(opts.name),
    pathCols,
    pathRows,
    pathLocked: true,
    areas: [],
    placedObjects: Array.isArray(opts.placedObjects) ? opts.placedObjects : [],
    spawns: [],
    playerSpawns: [],
    playerFriendlyFire: false,
    units: opts.units || {},
    weapons: opts.weapons || {},
    items: opts.items || {},
    skills: opts.skills || {},
    rules: opts.rules || {},
    teams: normalizeTeams(opts.teams),
    damageMatrix: cloneDamageMatrix(opts.damageMatrix),
  };
  return ensureMixSkills(ensurePlayerSpawns(doc));
}

export function parseMapFile(text) {
  const doc = JSON.parse(text);
  if (!doc || doc.kind !== 'theddos-map' || doc.pathLocked !== true) {
    throw new Error('Not a map file from this editor');
  }
  const pathCols = clampSide(doc.pathCols);
  const pathRows = clampSide(doc.pathRows);
  if (!pathCols || !pathRows) {
    throw new Error('Path grid must be 1 to 8 on each side');
  }
  doc.name = sanitizeMapName(doc.name);
  doc.pathCols = pathCols;
  doc.pathRows = pathRows;
  if (!Array.isArray(doc.areas)) doc.areas = [];
  if (!Array.isArray(doc.placedObjects)) doc.placedObjects = [];
  if (!Array.isArray(doc.spawns)) doc.spawns = [];
  if (!doc.units || typeof doc.units !== 'object') doc.units = {};
  if (doc.archetypes && typeof doc.archetypes === 'object') {
    const oldIds = Object.keys(doc.archetypes);
    for (let i = 0; i < oldIds.length; i++) {
      if (!doc.units[oldIds[i]]) doc.units[oldIds[i]] = doc.archetypes[oldIds[i]];
    }
    delete doc.archetypes;
  }
  if (!doc.weapons || typeof doc.weapons !== 'object') doc.weapons = {};
  if (!doc.items || typeof doc.items !== 'object') doc.items = {};
  if (!doc.skills || typeof doc.skills !== 'object') doc.skills = {};
  if (!doc.rules || typeof doc.rules !== 'object') doc.rules = {};
  doc.units = normalizeCatalogMap(doc.units);
  doc.weapons = normalizeCatalogMap(doc.weapons);
  doc.items = normalizeCatalogMap(doc.items);
  doc.skills = normalizeCatalogMap(doc.skills);
  const cross = {};
  function absorb(map) {
    const ids = Object.keys(map);
    for (let i = 0; i < ids.length; i++) {
      cross[ids[i]] = ids[i];
      cross[String(ids[i]).toUpperCase()] = ids[i];
    }
  }
  absorb(doc.units);
  absorb(doc.weapons);
  absorb(doc.items);
  absorb(doc.skills);
  rewriteCatalogStrings(doc.units, cross);
  rewriteCatalogStrings(doc.weapons, cross);
  rewriteCatalogStrings(doc.items, cross);
  rewriteCatalogStrings(doc.skills, cross);
  for (let i = 0; i < doc.placedObjects.length; i++) {
    const inst = doc.placedObjects[i];
    if (!inst || typeof inst.templateId !== 'string') continue;
    const next = cross[inst.templateId] || cross[inst.templateId.toUpperCase()] || formatCatalogId(inst.templateId);
    if (next) inst.templateId = next;
  }
  if (doc.damageMatrix && typeof doc.damageMatrix === 'object') doc.damageMatrix = cloneDamageMatrix(doc.damageMatrix);
  else delete doc.damageMatrix;
  doc.teams = normalizeTeams(doc.teams);
  return ensureMixSkills(ensurePlayerSpawns(doc));
}

export function readPageCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return parseMapFile(raw);
  } catch (_) {
    return null;
  }
}

export function writePageCache(doc) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(doc));
}

export function clearPageCache() {
  sessionStorage.removeItem(CACHE_KEY);
}

export function nextAreaId(areas) {
  const taken = Object.create(null);
  for (let i = 0; i < areas.length; i++) taken[areas[i].id] = true;
  let n = areas.length + 1;
  let id = 'area_' + n;
  while (taken[id]) {
    n += 1;
    id = 'area_' + n;
  }
  return id;
}

export function clampRect(rect, world) {
  const min = 64;
  let w = Math.max(min, Math.round(rect.w));
  let h = Math.max(min, Math.round(rect.h));
  let x = Math.round(rect.x);
  let y = Math.round(rect.y);
  if (w > world.w) w = world.w;
  if (h > world.h) h = world.h;
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x + w > world.w) x = world.w - w;
  if (y + h > world.h) y = world.h - h;
  return { x, y, w, h };
}

export function exportMapText(doc) {
  const copy = cloneData(doc);
  const names = ['weapons', 'items', 'skills'];
  for (let i = 0; i < names.length; i++) {
    const map = copy[names[i]];
    if (!map) continue;
    const ids = Object.keys(map);
    for (let j = 0; j < ids.length; j++) {
      if (map[ids[j]] && map[ids[j]].pending) delete map[ids[j]];
    }
  }
  return JSON.stringify(copy, null, 2);
}

/**
 * One editor map file. The path grid is chosen once at creation and then locked.
 * The page cache is only for this editor tab. Current edits overwrite it.
 */

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
  if (!Array.isArray(teams)) return [];
  const out = [];
  for (let i = 0; i < teams.length && out.length < 6; i++) {
    const row = teams[i];
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const next = {};
    const keys = Object.keys(row);
    for (let k = 0; k < keys.length; k++) next[keys[k]] = row[keys[k]];
    next.hostileTo = teamIdList(row.hostileTo);
    next.allyTo = teamIdList(row.allyTo);
    if (next.id != null) next.id = next.id | 0;
    out.push(next);
  }
  return out;
}

function teamIdList(src) {
  const out = [];
  const list = Array.isArray(src) ? src : [];
  for (let i = 0; i < list.length; i++) {
    const id = list[i] | 0;
    if (id >= 1 && id <= 6 && out.indexOf(id) < 0) out.push(id);
  }
  return out;
}

function mapTeamIds(doc) {
  const ids = [];
  const teams = Array.isArray(doc.teams) ? doc.teams : [];
  for (let i = 0; i < teams.length && ids.length < 6; i++) {
    const id = teams[i] && (teams[i].id | 0);
    if (id >= 1 && id <= 6 && ids.indexOf(id) < 0) ids.push(id);
  }
  return ids;
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
  if (!host) host = { role: 'host', unitId: '', team: teamIds[0] || 1, areaId: '' };
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

export function sheetsFromPack(pack) {
  const game = (pack.gamePack && pack.gamePack.pack) || {};
  const rules = cloneData(pack.rules || {});
  if (game.respawnBaseSec != null) rules.respawnBaseSec = game.respawnBaseSec;
  if (game.respawnExtraPerWave != null) rules.respawnExtraPerWave = game.respawnExtraPerWave;
  return {
    units: cloneData((pack.units && pack.units.units) || {}),
    weapons: cloneData((pack.weapons && pack.weapons.weapons) || {}),
    items: cloneData((pack.items && pack.items.items) || {}),
    skills: cloneData((pack.skills && pack.skills.skills) || {}),
    rules,
    teams: normalizeTeams(game.teams),
    damageMatrix: cloneDamageMatrix(pack.damageMatrix),
  };
}

const MIX_SKILLS = {
  WIRE: {
    id: 'WIRE',
    label: 'Wire',
    castTimeSec: 0,
    activeDurationSec: 0,
    cooldownSec: 0,
    effect: { type: 'PASS_THROUGH', allowProjectilePass: true },
  },
  HEAL: {
    id: 'HEAL',
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

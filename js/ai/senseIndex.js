/**
 * Sense Field index — team-bucketed, x-sorted (binary search).
 * Only Team-tagged combat entities enter. Query = hostile teams only, not full pool scan.
 * Snapshots stay lean (id / slot / TargetKind / team / x / y). Stages still read blackboard only.
 */

import { TEAM } from '../config.js';
import { TargetKind } from './blackboard.js';

function emptyHostileCache() {
  return Object.create(null);
}

export function createSenseIndex() {
  return {
    byTeam: Object.create(null),
    unitAt: Object.create(null),
    blockAt: Object.create(null),
    teams: defaultTeamRows(),
    hostileOf: emptyHostileCache(),
    dirtyTeams: Object.create(null),
  };
}

function defaultTeamRows() {
  return [
    { id: TEAM.PLAYER, name: 'Team 1', hostileTo: [TEAM.ENEMY], allyTo: [TEAM.ALLY] },
    { id: TEAM.ENEMY, name: 'Team 2', hostileTo: [TEAM.PLAYER, TEAM.ALLY], allyTo: [] },
    { id: TEAM.ALLY, name: 'Team 3', hostileTo: [TEAM.ENEMY], allyTo: [TEAM.PLAYER] },
  ];
}

function teamIdList(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = Object.create(null);
  for (let i = 0; i < raw.length; i++) {
    const id = raw[i] | 0;
    if (!id || seen[id]) continue;
    seen[id] = true;
    out.push(id);
  }
  return out;
}

/** Install map/doc team relations (hostileTo / allyTo). */
export function installSenseTeams(match, teams) {
  const idx = ensureSenseIndex(match);
  if (Array.isArray(teams) && teams.length) {
    const rows = [];
    for (let i = 0; i < teams.length && rows.length < 6; i++) {
      const row = teams[i];
      if (!row) continue;
      const id = row.id | 0;
      if (!id) continue;
      rows.push({
        id,
        name: row.name || 'Team ' + id,
        hostileTo: teamIdList(row.hostileTo),
        allyTo: teamIdList(row.allyTo),
      });
    }
    if (rows.length) idx.teams = rows;
  } else {
    idx.teams = defaultTeamRows();
  }
  rebuildHostileCache(idx);
  match.mapTeams = idx.teams;
  return idx;
}

function rebuildHostileCache(idx) {
  idx.hostileOf = emptyHostileCache();
  const rows = idx.teams || [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    idx.hostileOf[row.id] = teamIdList(row.hostileTo).slice();
  }
  // Fallback pairs if a team id has no row.
  if (!idx.hostileOf[TEAM.ENEMY]) {
    idx.hostileOf[TEAM.ENEMY] = [TEAM.PLAYER, TEAM.ALLY];
  }
  if (!idx.hostileOf[TEAM.PLAYER]) {
    idx.hostileOf[TEAM.PLAYER] = [TEAM.ENEMY];
  }
  if (!idx.hostileOf[TEAM.ALLY]) {
    idx.hostileOf[TEAM.ALLY] = [TEAM.ENEMY];
  }
}

export function ensureSenseIndex(match) {
  if (!match) return null;
  if (!match.senseIndex) {
    match.senseIndex = createSenseIndex();
    rebuildHostileCache(match.senseIndex);
  }
  return match.senseIndex;
}

export function hostileTeamIds(match, selfTeam) {
  const idx = ensureSenseIndex(match);
  const team = selfTeam | 0;
  const list = idx.hostileOf[team];
  if (list && list.length) return list;
  if (team === TEAM.ENEMY) return [TEAM.PLAYER, TEAM.ALLY];
  if (team === TEAM.PLAYER || team === TEAM.ALLY) return [TEAM.ENEMY];
  return [];
}

export function isHostileTeam(match, selfTeam, otherTeam) {
  if (otherTeam == null || otherTeam === TEAM.NEUTRAL) return false;
  if ((selfTeam | 0) === (otherTeam | 0)) return false;
  const list = hostileTeamIds(match, selfTeam);
  for (let i = 0; i < list.length; i++) {
    if (list[i] === (otherTeam | 0)) return true;
  }
  return false;
}

function teamBucket(idx, team) {
  const t = team | 0;
  if (!idx.byTeam[t]) idx.byTeam[t] = [];
  return idx.byTeam[t];
}

function markDirty(idx, team) {
  idx.dirtyTeams[team | 0] = true;
}

function removeFromBucket(bucket, slot, id) {
  for (let i = 0; i < bucket.length; i++) {
    const e = bucket[i];
    if (e && e.slot === slot && e.id === id) {
      bucket.splice(i, 1);
      return true;
    }
  }
  return false;
}

/** Combat units with a real team enter the set. */
export function registerSenseUnit(match, unit) {
  if (!match || !unit || !unit.active) return;
  const team = unit.team | 0;
  if (!team || team === TEAM.NEUTRAL) return;
  const idx = ensureSenseIndex(match);
  const id = unit.id;
  const prev = idx.unitAt[id];
  if (prev && prev.team !== team) {
    removeFromBucket(teamBucket(idx, prev.team), 'unit', id);
  }
  const targetKind = classifyUnitTargetKind(team, unit);
  const entry = {
    id,
    slot: 'unit',
    team,
    targetKind,
    x: unit.x || 0,
    y: unit.y || 0,
  };
  if (prev && prev.team === team) {
    const bucket = teamBucket(idx, team);
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].slot === 'unit' && bucket[i].id === id) {
        bucket[i] = entry;
        markDirty(idx, team);
        idx.unitAt[id] = { team };
        return;
      }
    }
  }
  teamBucket(idx, team).push(entry);
  idx.unitAt[id] = { team };
  markDirty(idx, team);
}

export function unregisterSenseUnit(match, unitOrId) {
  if (!match) return;
  const idx = match.senseIndex;
  if (!idx) return;
  const id = typeof unitOrId === 'object' ? unitOrId.id : unitOrId;
  const prev = idx.unitAt[id];
  if (!prev) return;
  removeFromBucket(teamBucket(idx, prev.team), 'unit', id);
  delete idx.unitAt[id];
  markDirty(idx, prev.team);
}

/** Team-tagged combat blocks (base / turret / armed) enter the set. */
export function registerSenseBlock(match, block) {
  if (!match || !block || !block.alive) return;
  const team = block.team | 0;
  if (!team || team === TEAM.NEUTRAL) return;
  if (block.isHarvest) return;
  // Combat set only — not every walk-solid wall (avoids bloating sense buckets).
  const combat =
    block.isDefeatCondition || block.isTurret || !!block.weaponId;
  if (!combat) return;
  const idx = ensureSenseIndex(match);
  const id = block.id;
  const prev = idx.blockAt[id];
  if (prev && prev.team !== team) {
    removeFromBucket(teamBucket(idx, prev.team), 'block', id);
  }
  const targetKind = classifyBlockTargetKind(block);
  const entry = {
    id,
    slot: 'block',
    team,
    targetKind,
    x: block.x + (block.w || 0) * 0.5,
    y: block.y + (block.h || 0) * 0.5,
  };
  if (prev && prev.team === team) {
    const bucket = teamBucket(idx, team);
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].slot === 'block' && bucket[i].id === id) {
        bucket[i] = entry;
        markDirty(idx, team);
        idx.blockAt[id] = { team };
        return;
      }
    }
  }
  teamBucket(idx, team).push(entry);
  idx.blockAt[id] = { team };
  markDirty(idx, team);
}

export function unregisterSenseBlock(match, blockOrId) {
  if (!match) return;
  const idx = match.senseIndex;
  if (!idx) return;
  const id = typeof blockOrId === 'object' ? blockOrId.id : blockOrId;
  const prev = idx.blockAt[id];
  if (!prev) return;
  removeFromBucket(teamBucket(idx, prev.team), 'block', id);
  delete idx.blockAt[id];
  markDirty(idx, prev.team);
}

export function classifyUnitTargetKind(team, unit) {
  if (unit && unit.role === 'player') return TargetKind.PLAYER;
  if (team === TEAM.PLAYER) return TargetKind.PLAYER;
  if (team === TEAM.ALLY) return TargetKind.ALLY_UNIT;
  return TargetKind.ENEMY_UNIT;
}

export function classifyBlockTargetKind(block) {
  if (!block) return TargetKind.BLOCK_OTHER;
  if (block.isDefeatCondition) return TargetKind.BLOCK_BASE;
  if (block.isTurret || block.weaponId) return TargetKind.BLOCK_TURRET;
  return TargetKind.BLOCK_OTHER;
}

function cmpX(a, b) {
  return a.x - b.x;
}

function sortTeamBucket(idx, team) {
  const bucket = idx.byTeam[team | 0];
  if (!bucket || bucket.length < 2) return;
  bucket.sort(cmpX);
}

/** Lower bound: first index with entry.x >= x. */
function lowerBoundX(arr, x) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].x < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Upper bound: first index with entry.x > x. */
function upperBoundX(arr, x) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].x <= x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Refresh lean x/y from live entities for registered rows, then sort dirty teams.
 * Touches only indexed combatants — not an unfiltered world search for targets.
 */
export function syncSenseIndexPositions(match) {
  const idx = ensureSenseIndex(match);
  if (!idx) return;
  const units = match.pools && match.pools.units;
  const keys = Object.keys(idx.byTeam);
  for (let k = 0; k < keys.length; k++) {
    const team = keys[k] | 0;
    const bucket = idx.byTeam[team];
    if (!bucket || !bucket.length) continue;
    let moved = false;
    for (let i = bucket.length - 1; i >= 0; i--) {
      const e = bucket[i];
      if (e.slot === 'unit') {
        const u = units && units[e.id];
        if (!u || !u.active) {
          bucket.splice(i, 1);
          delete idx.unitAt[e.id];
          moved = true;
          continue;
        }
        if (u.x !== e.x || u.y !== e.y) {
          e.x = u.x;
          e.y = u.y;
          moved = true;
        }
        e.targetKind = classifyUnitTargetKind(u.team | 0, u);
        e.team = u.team | 0;
      } else if (e.slot === 'block') {
        const b = match.blockById && match.blockById[e.id];
        if (!b || !b.alive) {
          bucket.splice(i, 1);
          delete idx.blockAt[e.id];
          moved = true;
          continue;
        }
        const cx = b.x + (b.w || 0) * 0.5;
        const cy = b.y + (b.h || 0) * 0.5;
        if (cx !== e.x || cy !== e.y) {
          e.x = cx;
          e.y = cy;
          moved = true;
        }
        e.targetKind = classifyBlockTargetKind(b);
        e.team = b.team | 0;
      }
    }
    if (moved || idx.dirtyTeams[team]) {
      sortTeamBucket(idx, team);
      delete idx.dirtyTeams[team];
    }
  }
}

/**
 * Query hostile team buckets in sense radius via x binary search + y/dist filter.
 * @returns {{ id, slot, targetKind, team, x, y, dist, unit?, block? }[]}
 */
export function queryHostileInSense(match, self, radius) {
  const out = [];
  if (!match || !self || !(radius > 0)) return out;
  const selfTeam = self.team | 0;
  const cx = self.x;
  const cy = self.y;
  const hostiles = hostileTeamIds(match, selfTeam);
  if (!hostiles.length) return out;

  const idx = ensureSenseIndex(match);
  const units = match.pools && match.pools.units;
  const r2 = radius * radius;
  const x0 = cx - radius;
  const x1 = cx + radius;

  for (let h = 0; h < hostiles.length; h++) {
    const bucket = idx.byTeam[hostiles[h]];
    if (!bucket || !bucket.length) continue;
    const lo = lowerBoundX(bucket, x0);
    const hi = upperBoundX(bucket, x1);
    for (let i = lo; i < hi; i++) {
      const e = bucket[i];
      if (!e || e.id === self.id && e.slot === 'unit') continue;
      const dy = e.y - cy;
      if (dy > radius || dy < -radius) continue;
      const dx = e.x - cx;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const dist = Math.sqrt(d2);
      if (e.slot === 'unit') {
        const u = units && units[e.id];
        if (!u || !u.active) continue;
        out.push({
          id: e.id,
          slot: 'unit',
          kind: 'unit',
          targetKind: e.targetKind || classifyUnitTargetKind(u.team | 0, u),
          team: u.team | 0,
          x: u.x,
          y: u.y,
          dist,
          unit: u,
        });
      } else {
        const b = match.blockById && match.blockById[e.id];
        if (!b || !b.alive) continue;
        const kind =
          e.targetKind === TargetKind.BLOCK_BASE || b.isDefeatCondition
            ? 'base'
            : 'block';
        out.push({
          id: e.id,
          slot: 'block',
          kind,
          targetKind: e.targetKind || classifyBlockTargetKind(b),
          team: b.team | 0,
          x: e.x,
          y: e.y,
          dist,
          block: b,
        });
      }
    }
  }
  return out;
}

/**
 * One-time / load: register all currently alive team-tagged combatants.
 * Prefer incremental register at spawn; this seeds after map materialize.
 */
export function rebuildSenseIndexFromMatch(match) {
  const idx = ensureSenseIndex(match);
  idx.byTeam = Object.create(null);
  idx.unitAt = Object.create(null);
  idx.blockAt = Object.create(null);
  idx.dirtyTeams = Object.create(null);
  const units = match.pools && match.pools.units;
  if (units) {
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (u && u.active) registerSenseUnit(match, u);
    }
  }
  const blocks = match.blocks || [];
  for (let i = 0; i < blocks.length; i++) {
    registerSenseBlock(match, blocks[i]);
  }
  syncSenseIndexPositions(match);
  return idx;
}

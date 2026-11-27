/**
 * Default mapDoc factory + sanitize — zero-config complete documents.
 * Archetype / skill templates fill blanks; never invent runtime rules here.
 * (No import from mapDoc.js — avoids circular deps; mapDoc wraps sanitize.)
 */

import { Goal } from '../ai/blackboard.js';

export const BLOCK_SIZE = 64;
export const PATH_SIZE = 1024;
const MAX_SIDE = 8;

export const AI_ROLES = Object.freeze([
  'Grunt',
  'Sidekick',
  'Sniper',
  'Vanguard',
  'Boss_1v1',
]);

export const AI_ARCHETYPES = Object.freeze({
  Grunt_Aggressive: {
    role: 'Grunt',
    reactionTimeSec: 0.35,
    morale: 0.55,
    fleeOnAllyCasualties: false,
    allowedGoals: [
      { goalId: Goal.ELIMINATE_PLAYER, priority: 60, resumeOnInterrupt: true },
      { goalId: Goal.REACH_PATH_GOAL, priority: 40, resumeOnInterrupt: true },
      { goalId: Goal.SURVIVE_RETREAT, priority: 80, resumeOnInterrupt: false },
    ],
    behaviorFlags: {
      retreatHpRatio: 0.25,
      canRegroup: true,
      preferredRange: 'MEDIUM',
      relentless: false,
      fleeOnApproach: false,
      ignoreNonPathObstacles: false,
    },
  },
  Vanguard_Defender: {
    role: 'Vanguard',
    reactionTimeSec: 0.4,
    morale: 0.75,
    fleeOnAllyCasualties: false,
    allowedGoals: [
      { goalId: Goal.PROTECT_ALLY, priority: 70, resumeOnInterrupt: true },
      { goalId: Goal.HOLD_SECTOR, priority: 55, resumeOnInterrupt: true },
      { goalId: Goal.ELIMINATE_TARGET, priority: 50, resumeOnInterrupt: true },
      { goalId: Goal.SURVIVE_RETREAT, priority: 85, resumeOnInterrupt: false },
    ],
    behaviorFlags: {
      retreatHpRatio: 0.2,
      canRegroup: true,
      preferredRange: 'CLOSE',
      relentless: false,
      fleeOnApproach: false,
      ignoreNonPathObstacles: false,
    },
  },
  Sniper_Cover: {
    role: 'Sniper',
    reactionTimeSec: 0.55,
    morale: 0.45,
    fleeOnAllyCasualties: true,
    allowedGoals: [
      { goalId: Goal.ELIMINATE_PLAYER, priority: 65, resumeOnInterrupt: true },
      { goalId: Goal.FLANK_POSITION, priority: 50, resumeOnInterrupt: true },
      { goalId: Goal.SEEK_HEAL_POINT, priority: 75, resumeOnInterrupt: false },
      { goalId: Goal.SURVIVE_RETREAT, priority: 90, resumeOnInterrupt: false },
    ],
    behaviorFlags: {
      retreatHpRatio: 0.35,
      canRegroup: false,
      preferredRange: 'LONG_RANGE',
      relentless: false,
      fleeOnApproach: true,
      ignoreNonPathObstacles: false,
    },
  },
  Boss_Dynamic: {
    role: 'Boss_1v1',
    reactionTimeSec: 0.2,
    morale: 0.95,
    fleeOnAllyCasualties: false,
    allowedGoals: [
      { goalId: Goal.ELIMINATE_PLAYER, priority: 70, resumeOnInterrupt: true },
      { goalId: Goal.DESTROY_BASE, priority: 55, resumeOnInterrupt: true },
      { goalId: Goal.SUICIDE_ATTACK, priority: 95, resumeOnInterrupt: false },
      { goalId: Goal.SURVIVE_RETREAT, priority: 30, resumeOnInterrupt: false },
    ],
    behaviorFlags: {
      retreatHpRatio: 0.1,
      canRegroup: false,
      preferredRange: 'MEDIUM',
      relentless: true,
      fleeOnApproach: false,
      ignoreNonPathObstacles: true,
    },
  },
});

const DEFAULT_SKILL_TEMPLATE = Object.freeze({
  kind: 'skill',
  label: '',
  artId: '',
  targetType: 'Enemy',
  castTimeSec: 0.2,
  cooldownSec: 5,
  castRangeBlocks: 4,
  effectRadiusBlocks: 1,
  effectType: 'Damage',
  power: 10,
  durationSec: 0,
  activeDurationSec: 0,
});

const GOAL_IDS = Object.keys(Goal).map((k) => Goal[k]);

function clone(value) {
  return JSON.parse(JSON.stringify(value == null ? {} : value));
}

function clampSide(value) {
  const side = value | 0;
  if (side < 1 || side > MAX_SIDE) return 0;
  return side;
}

function sanitizeName(raw) {
  const text = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '');
  return text || 'untitled_map';
}

/** Normalize one goal entry to { goalId, priority, resumeOnInterrupt }. */
export function normalizeGoalEntry(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const goalId = String(raw).trim();
    if (!goalId) return null;
    return { goalId, priority: 50, resumeOnInterrupt: true };
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) return null;
  const goalId = String(raw.goalId || raw.id || raw.goal || '').trim();
  if (!goalId) return null;
  let priority = Number(raw.priority);
  if (!isFinite(priority)) priority = 50;
  priority = Math.max(0, Math.min(100, Math.round(priority)));
  return {
    goalId,
    priority,
    resumeOnInterrupt: raw.resumeOnInterrupt !== false,
  };
}

export function normalizeAllowedGoalsList(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  const seen = Object.create(null);
  for (let i = 0; i < list.length; i++) {
    const entry = normalizeGoalEntry(list[i]);
    if (!entry || seen[entry.goalId]) continue;
    seen[entry.goalId] = true;
    out.push(entry);
  }
  return out;
}

/** String ids only — for runtime Mediator / archetypes. */
export function goalIdsFromList(list) {
  return normalizeAllowedGoalsList(list).map((g) => g.goalId);
}

export function allGoalIds() {
  return GOAL_IDS.slice();
}

export function createDefaultSkillRecord(id, effectType) {
  const row = clone(DEFAULT_SKILL_TEMPLATE);
  row.id = id || '';
  row.label = id || '';
  row.kind = 'skill';
  if (effectType) row.effectType = effectType;
  return row;
}

export function createDefaultGoalEntry(goalId) {
  return normalizeGoalEntry(goalId || Goal.ELIMINATE_PLAYER);
}

export function applyAiArchetype(record, archetypeKey) {
  if (!record || typeof record !== 'object') return record;
  const key = archetypeKey && AI_ARCHETYPES[archetypeKey] ? archetypeKey : 'Grunt_Aggressive';
  const arch = AI_ARCHETYPES[key];
  record.aiRole = arch.role;
  record.reactionTimeSec = arch.reactionTimeSec;
  record.morale = arch.morale;
  record.fleeOnAllyCasualties = !!arch.fleeOnAllyCasualties;
  record.allowedGoals = clone(arch.allowedGoals);
  record.behaviorFlags = Object.assign({}, arch.behaviorFlags);
  if (!Array.isArray(record.targetPriorityList)) record.targetPriorityList = [];
  return record;
}

export function ensureUnitAiFields(record) {
  if (!record || typeof record !== 'object') return record;
  if (!record.aiRole) record.aiRole = 'Grunt';
  if (typeof record.reactionTimeSec !== 'number' || !isFinite(record.reactionTimeSec)) {
    record.reactionTimeSec = 0.35;
  }
  if (typeof record.morale !== 'number' || !isFinite(record.morale)) {
    record.morale = 0.55;
  }
  record.morale = Math.max(0, Math.min(1, record.morale));
  record.fleeOnAllyCasualties = record.fleeOnAllyCasualties === true;
  record.allowedGoals = normalizeAllowedGoalsList(record.allowedGoals);
  if (!record.behaviorFlags || typeof record.behaviorFlags !== 'object') {
    record.behaviorFlags = {
      retreatHpRatio: 0.25,
      canRegroup: true,
      preferredRange: 'MEDIUM',
      relentless: false,
      fleeOnApproach: false,
      ignoreNonPathObstacles: false,
    };
  } else {
    const f = record.behaviorFlags;
    if (typeof f.retreatHpRatio !== 'number') f.retreatHpRatio = 0.25;
    if (typeof f.canRegroup !== 'boolean') f.canRegroup = true;
    if (!f.preferredRange) f.preferredRange = 'MEDIUM';
    if (typeof f.relentless !== 'boolean') f.relentless = false;
    if (typeof f.fleeOnApproach !== 'boolean') f.fleeOnApproach = false;
    if (typeof f.ignoreNonPathObstacles !== 'boolean') f.ignoreNonPathObstacles = false;
  }
  if (!Array.isArray(record.targetPriorityList)) record.targetPriorityList = [];
  if (typeof record.senseRadiusPath !== 'number' || !isFinite(record.senseRadiusPath)) {
    record.senseRadiusPath = 4 / (PATH_SIZE / BLOCK_SIZE);
  }
  return record;
}

export function ensureSkillRecord(record) {
  if (!record || typeof record !== 'object') return record;
  record.kind = 'skill';
  if (record.label == null) record.label = record.id || '';
  if (record.artId == null) record.artId = '';
  if (!record.targetType) record.targetType = 'Enemy';
  if (typeof record.castTimeSec !== 'number') record.castTimeSec = 0.2;
  if (typeof record.cooldownSec !== 'number') record.cooldownSec = 5;
  if (typeof record.castRangeBlocks !== 'number') {
    record.castRangeBlocks =
      typeof record.castRange === 'number' ? record.castRange / BLOCK_SIZE : 4;
  }
  if (typeof record.effectRadiusBlocks !== 'number') record.effectRadiusBlocks = 1;
  if (!record.effectType) {
    const t = record.effect && record.effect.type;
    record.effectType =
      t === 'HEAL_RADIUS' || t === 'HEAL_SELF'
        ? 'Heal'
        : t === 'TAUNT_PULSE' || t === 'SPEED_BOOST' || t === 'SHIELD_OVERCHARGE'
          ? 'Buff'
          : 'Damage';
  }
  if (typeof record.power !== 'number') {
    const eff = record.effect || {};
    record.power =
      eff.damage != null
        ? Number(eff.damage) || 0
        : eff.amount != null
          ? Number(eff.amount) || 0
          : 10;
  }
  if (typeof record.durationSec !== 'number') {
    record.durationSec =
      typeof record.activeDurationSec === 'number' ? record.activeDurationSec : 0;
  }
  if (typeof record.activeDurationSec !== 'number') {
    record.activeDurationSec = record.durationSec || 0;
  }
  return record;
}

function sanitizeCatalogSkills(skills) {
  if (!skills || typeof skills !== 'object') return {};
  const ids = Object.keys(skills);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const row = skills[id];
    if (!row || typeof row !== 'object' || row.pending) continue;
    ensureSkillRecord(row);
    if (!row.id) row.id = id;
  }
  return skills;
}

function sanitizeCatalogUnits(units) {
  if (!units || typeof units !== 'object') return {};
  const ids = Object.keys(units);
  for (let i = 0; i < ids.length; i++) {
    const row = units[ids[i]];
    if (!row || typeof row !== 'object' || row.pending) continue;
    ensureUnitAiFields(row);
  }
  return units;
}

/**
 * Core sanitize — mapDoc wraps with ensureMixSkills / ensurePlayerSpawns / teams / matrix.
 */
export function sanitizeMapDocCore(rawDoc) {
  const doc = rawDoc && typeof rawDoc === 'object' ? rawDoc : {};
  doc.kind = 'theddos-map';
  if (!doc.version) doc.version = '1';
  doc.name = sanitizeName(doc.name);
  const pathCols = clampSide(doc.pathCols);
  const pathRows = clampSide(doc.pathRows);
  if (pathCols) doc.pathCols = pathCols;
  if (pathRows) doc.pathRows = pathRows;
  doc.pathLocked = true;
  if (!Array.isArray(doc.areas)) doc.areas = [];
  if (!Array.isArray(doc.placedObjects)) doc.placedObjects = [];
  if (!Array.isArray(doc.spawns)) doc.spawns = [];
  if (!doc.units || typeof doc.units !== 'object') doc.units = {};
  if (!doc.weapons || typeof doc.weapons !== 'object') doc.weapons = {};
  if (!doc.items || typeof doc.items !== 'object') doc.items = {};
  if (!doc.skills || typeof doc.skills !== 'object') doc.skills = {};
  if (!doc.rules || typeof doc.rules !== 'object') doc.rules = {};
  sanitizeCatalogUnits(doc.units);
  sanitizeCatalogSkills(doc.skills);
  if (!doc.navGraph || typeof doc.navGraph !== 'object') {
    doc.navGraph = { nodes: [], edges: [] };
  } else {
    if (!Array.isArray(doc.navGraph.nodes)) doc.navGraph.nodes = [];
    if (!Array.isArray(doc.navGraph.edges)) doc.navGraph.edges = [];
  }
  if (!Array.isArray(doc.tacticalWaypoints)) doc.tacticalWaypoints = [];
  if (!doc.tacticalMeta || typeof doc.tacticalMeta !== 'object') {
    doc.tacticalMeta = { blockSize: BLOCK_SIZE, bakedAt: null };
  } else if (!doc.tacticalMeta.blockSize) {
    doc.tacticalMeta.blockSize = BLOCK_SIZE;
  }
  return doc;
}

export function createDefaultMapDocCore(name, cols, rows, opts) {
  const pathCols = clampSide(cols);
  const pathRows = clampSide(rows);
  if (!pathCols || !pathRows) {
    throw new Error('Path grid must be 1 to 8 on each side');
  }
  const base = opts && typeof opts === 'object' ? opts : {};
  return sanitizeMapDocCore({
    kind: 'theddos-map',
    version: '1',
    name: sanitizeName(name),
    pathCols,
    pathRows,
    pathLocked: true,
    areas: [],
    placedObjects: Array.isArray(base.placedObjects) ? base.placedObjects : [],
    spawns: [],
    playerSpawns: [],
    playerFriendlyFire: false,
    units: base.units || {},
    weapons: base.weapons || {},
    items: base.items || {},
    skills: base.skills || {},
    rules: base.rules || {},
    teams: base.teams,
    damageMatrix: base.damageMatrix,
    navGraph: { nodes: [], edges: [] },
    tacticalWaypoints: [],
    tacticalMeta: { blockSize: BLOCK_SIZE, bakedAt: null },
  });
}

export function blocksToWorld(blocks) {
  const b = Number(blocks);
  if (!isFinite(b)) return 0;
  return b * BLOCK_SIZE;
}

export function worldToBlocks(px) {
  const n = Number(px);
  if (!isFinite(n)) return 0;
  return n / BLOCK_SIZE;
}

export function sensePathToBlocks(pathUnits) {
  const cell = PATH_SIZE / BLOCK_SIZE;
  const n = Number(pathUnits);
  if (!isFinite(n) || n <= 0) return 4;
  return n * cell;
}

export function blocksToSensePath(blocks) {
  const cell = PATH_SIZE / BLOCK_SIZE;
  let b = Number(blocks);
  if (!isFinite(b) || b <= 0) b = 4;
  return b / cell;
}

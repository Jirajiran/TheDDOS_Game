import {
  AI_LOCAL_PATH,
  GAME_PACK,
  getBalancePack,
  TEAM,
  deriveCollisionLayer,
  getArchetypeForWave,
  getUnitArchetype,
} from '../config.js';
import { enemyTeamId } from '../defs/teams.js';
import { pickEdgeSpawnPosition, pointInArea } from '../defs/spawnPolicy.js';
import { edgeSpawnAnchor } from '../world/world.js';
import {
  attachUnitToGroup,
  deployPreparedGroups,
  prepareGroupPathsSequential,
  resetGeneral,
} from '../ai/general.js';
import {
  ensureMeleeSwing,
} from '../combat/meleeTools.js';
import {
  seedMoraleFromArchetype,
} from '../combat/morale.js';
import {
  acquireUnit,
} from '../world/pools.js';
import {
  ensureUnitWearVisuals,
  skinGroupIdFromSheet,
  UNIT_VISUAL_ACTIONS,
} from '../view/unitVisual.js';
import {
  seedShieldFromArchetype,
} from '../combat/shield.js';
import {
  ensureUnitSkills,
} from '../combat/skills.js';
import {
  applyEffectiveArchetypeToUnit,
  resolveEffectiveArchetype,
} from '../ai/archetypes.js';
import {
  ensureBlackboardStub,
} from '../combat/taunt.js';
import {
  createAmmoState,
} from '../combat/weapons.js';
import {
  equipArmorOnUnit,
  equipShieldOnUnit,
  readLoadoutOrders,
} from '../player/inventory.js';
import { claimAreaOrder } from './areaOrders.js';
import { registerSenseUnit } from '../ai/senseIndex.js';
function balanceForMatch(match) {
  const pack = getBalancePack();
  const rules = match && match.mapRules;
  if (!rules) return pack;
  return Object.assign({}, pack, {
    targetWaveToWin:
      rules.targetWaveToWin != null ? rules.targetWaveToWin : pack.targetWaveToWin,
    winByWaves:
      rules.winByWaves != null ? rules.winByWaves === true : pack.winByWaves,
    waveAdvanceMode:
      rules.waveAdvanceMode || pack.waveAdvanceMode || 'CONTINUOUS',
    waveWinMode: rules.waveWinMode || pack.waveWinMode || 'CLEAR',
    setupPhaseDurationSec:
      rules.setupPhaseDurationSec != null
        ? rules.setupPhaseDurationSec
        : pack.setupPhaseDurationSec,
    waveCountdownSec:
      rules.waveCountdownSec != null
        ? rules.waveCountdownSec
        : pack.waveCountdownSec,
    waveGroupCount:
      rules.waveGroupCount != null ? rules.waveGroupCount : pack.waveGroupCount,
    lastStand: rules.lastStand != null ? rules.lastStand : pack.lastStand,
    botInfiniteAmmo:
      rules.botInfiniteAmmo != null
        ? rules.botInfiniteAmmo === true
        : pack.botInfiniteAmmo === true,
  });
}

/** Win-by-waves is an optional Rule condition (checkbox in Editor). */
function wavesWinEnabled(pack) {
  if (!pack) return false;
  if (pack.winByWaves === false) return false;
  if (pack.winByWaves === true) return (pack.targetWaveToWin | 0) > 0;
  return (pack.targetWaveToWin | 0) > 0;
}

function maxAuthoredWave(match) {
  const custom =
    match && Array.isArray(match.editorSpawns) && match.editorSpawns.length
      ? match.editorSpawns
      : null;
  const rows = custom || GAME_PACK.spawns || [];
  let max = 0;
  for (let i = 0; i < rows.length; i++) {
    const w = rows[i] && rows[i].wave != null ? rows[i].wave | 0 : 0;
    if (w > max) max = w;
  }
  return max;
}

export function updateWaves(match, dt) {
  const pack = balanceForMatch(match);
  if (!match.basePlaced || !match.base) return;
  if (!match.base.alive && !pack.lastStand) return;
  if (match.outcome) return;

  tickPendingSpawns(match);

  const winWaves = wavesWinEnabled(pack);
  const target = Math.max(1, pack.targetWaveToWin | 0);
  const scheduleCap = winWaves ? target : Math.max(1, maxAuthoredWave(match));

  // Win-by-waves: mode CLEAR = need wipe; REACH = hit wave index alone.
  const winMode = String(pack.waveWinMode || 'CLEAR').toUpperCase();
  if (winWaves && match.waveIndex >= target && match.waveIndex > 0) {
    const cleared = match.enemiesAlive <= 0;
    if (winMode === 'REACH' || cleared) {
      match.waveActive = false;
      match.outcome = 'win';
      return;
    }
  }

  // No more scheduled waves — wait for clear (win only if winWaves).
  if (match.waveIndex >= scheduleCap) {
    match.waveActive = match.enemiesAlive > 0;
    return;
  }

  // Advance: CONTINUOUS = countdown always; WAIT_CLEAR = wait wipe between waves.
  const advance = String(pack.waveAdvanceMode || 'CONTINUOUS').toUpperCase();
  if (advance === 'WAIT_CLEAR' && match.waveIndex > 0 && match.enemiesAlive > 0) {
    match.waveActive = true;
    return;
  }

  match.waveCountdown -= dt;
  if (match.waveCountdown > 0) return;

  match.waveIndex += 1;
  spawnWave(match, match.waveIndex);
  match.waveActive = true;
  match.phase = 'wave';
  if (match.waveIndex < scheduleCap) {
    match.waveCountdown = pack.waveCountdownSec;
  } else {
    match.waveCountdown = 0;
  }
}

function parseUnitSpec(spec) {
  const text = String(spec || '');
  const cut = text.lastIndexOf(':');
  if (cut < 0) return { id: text.trim(), count: 1 };
  return {
    id: text.slice(0, cut).trim(),
    count: Math.max(0, parseInt(text.slice(cut + 1), 10) || 0),
  };
}

function areaById(match, id) {
  const mapped = (match && match.mapAreas) || [];
  for (let i = 0; i < mapped.length; i++) {
    if (mapped[i] && mapped[i].id === id) return mapped[i];
  }
  const areas = GAME_PACK.areas || [];
  for (let i = 0; i < areas.length; i++) {
    if (areas[i] && areas[i].id === id) return areas[i];
  }
  return null;
}

function rowsForWave(match, waveIndex) {
  // Editor / map-file spawn rail wins over default pack schedule.
  const custom =
    match && Array.isArray(match.editorSpawns) && match.editorSpawns.length
      ? match.editorSpawns
      : null;
  const rows = custom || GAME_PACK.spawns || [];
  const next = [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i].wave === waveIndex) next.push(rows[i]);
  }
  return next;
}

export function spawnWave(match, waveIndex) {
  const rows = rowsForWave(match, waveIndex);
  const now = [];
  if (!match.pendingSpawns) match.pendingSpawns = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const delay = row.timeStart || 0;
    if (delay > 0) {
      match.pendingSpawns.push({
        due: (match.simTime || 0) + delay,
        row,
      });
    } else now.push(row);
  }
  if (now.length) spawnRows(match, now);
}

export function tickPendingSpawns(match) {
  const pending = match.pendingSpawns;
  if (!pending || !pending.length) return;
  const time = match.simTime || 0;
  const due = [];
  const wait = [];
  for (let i = 0; i < pending.length; i++) {
    if (pending[i].due <= time) due.push(pending[i].row);
    else wait.push(pending[i]);
  }
  match.pendingSpawns = wait;
  if (due.length) spawnRows(match, due);
}

/** Wave points: each { areaId, units } owns its list. Legacy: areaId/areaIds + row.units. */
function pointsOfRow(row) {
  if (!row) return [];
  if (Array.isArray(row.points) && row.points.length) return row.points;
  const units = Array.isArray(row.units) ? row.units : [];
  if (Array.isArray(row.areaIds) && row.areaIds.length) {
    return row.areaIds.map((areaId, i) => ({
      areaId,
      units: i === 0 ? units : [],
    }));
  }
  return [{ areaId: row.areaId || '', units }];
}

function expandSpawnSlots(match, rows) {
  const slots = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const points = pointsOfRow(row);
    for (let p = 0; p < points.length; p++) {
      const point = points[p] || {};
      const specs = Array.isArray(point.units) ? point.units : [];
      const flat = [];
      for (let s = 0; s < specs.length; s++) {
        const spec = parseUnitSpec(specs[s]);
        const archId = String(spec.id || '').toUpperCase();
        for (let n = 0; n < spec.count; n++) flat.push(archId || spec.id);
      }
      if (!flat.length) continue;
      const area = point.areaId ? areaById(match, point.areaId) : null;
      for (let i = 0; i < flat.length; i++) {
        let pos;
        if (area) {
          pos = pointInArea(area, i, flat.length);
        } else {
          pos = pickSpawnOutsideBaseChunk(match, i + p * flat.length, flat.length);
        }
        slots.push({
          archId: flat[i],
          team: row.team,
          x: pos.x,
          y: pos.y,
        });
      }
    }
  }
  return slots;
}

function spawnRows(match, rows) {
  const pack = balanceForMatch(match);
  const slots = expandSpawnSlots(match, rows);
  if (!slots.length || !match.base) return;
  const positions = [];
  for (let i = 0; i < slots.length; i++) {
    positions.push({
      x: slots[i].x,
      y: slots[i].y,
      archId: slots[i].archId,
      team: slots[i].team,
    });
  }

  const base = match.base;
  const tx = base.x + base.w / 2;
  const ty = base.y + base.h / 2;

  resetGeneral(match);
  const groupCount = Math.max(1, pack.waveGroupCount || 3);
  const groupLists = partitionSpawnGroups(positions, groupCount, tx, ty);
  const prepared = prepareGroupPathsSequential(match, groupLists, tx, ty);
  const groups = deployPreparedGroups(match, prepared, tx, ty);

  let unitSeq = 0;
  for (let gi = 0; gi < prepared.length; gi++) {
    const prep = prepared[gi];
    const group = groups[gi];
    if (!group) continue;
    for (let i = 0; i < prep.positions.length; i++) {
      const u = acquireUnit(match.pools);
      if (!u) break;
      const pos = prep.positions[i];
      const archId = pos.archId;
      const archetype = getUnitArchetype(archId) || getArchetypeForWave(0);
      const orders = readLoadoutOrders(
        archetype && archetype.startingLoadout,
        archetype && archetype.currentSlot
      );
      const weaponId = orders.weaponId;
      const hpLo = archetype ? archetype.hpRange[0] : pack.enemyMaxHp;
      const hpHi = archetype ? archetype.hpRange[1] : pack.enemyMaxHp + 4;
      const t = (unitSeq % 5) / 4;
      const maxHp = Math.round(hpLo + (hpHi - hpLo) * t);
      const sizeScale =
        archetype && (archetype.sizeScale || (archetype.isBoss ? 1.5 : 1));
      const team =
        pos.team != null
          ? pos.team
          : enemyTeamId(match, GAME_PACK && GAME_PACK.teams);
      u.active = true;
      u.typeId = 2;
      u.team = team;
      u.role = 'enemy';
      u.collisionLayer = deriveCollisionLayer({ team, role: 'enemy' });
      u.pierceCost = 1;
      u.skinGroupId = skinGroupIdFromSheet(archetype);
      u.visualAction = UNIT_VISUAL_ACTIONS.idle;
      u.visualActionPrev = UNIT_VISUAL_ACTIONS.idle;
      u.visualActionT = 0;
      u.armTweenT = 0;
      u.armTweenDur = 0;
      u.archetypeId = archetype ? archetype.id : archId;
      u.isBoss = !!(archetype && archetype.isBoss);
      u.sizeScale = sizeScale || 1;
      u.maxHp = maxHp;
      u.hp = u.maxHp;
      if (archetype && archetype.speed != null && Number(archetype.speed) > 0) {
        u.speed = Number(archetype.speed);
      } else {
        u.speed = pack.enemySpeed * (u.isBoss ? 0.85 : 1);
      }
      {
        let pri =
          archetype && archetype.priorityScore != null
            ? Number(archetype.priorityScore)
            : 5;
        if (!isFinite(pri)) pri = 5;
        u.priorityScore = Math.max(1, Math.min(10, Math.round(pri)));
      }
      u.radius = Math.round(pack.enemyRadius * (u.sizeScale || 1));
      u.armorType =
        (archetype && archetype.armorType) || pack.enemyArmorType;
      u.meleeMultiplier =
        (archetype && archetype.meleeMultiplier) || 1;
      const flags =
        (archetype && (archetype.behaviorFlags || archetype.aiBehavior)) || {};
      u.retreatHpRatio =
        typeof flags.retreatHpRatio === 'number'
          ? flags.retreatHpRatio
          : pack.enemyRetreatHpRatio;
      u.weaponId = weaponId;
      if (weaponId) {
        Object.assign(u, createAmmoState(weaponId));
        u.mags = Math.max(u.mags, 2);
      } else {
        u.ammoInMag = 0;
        u.mags = 0;
      }
      u.x = pos.x;
      u.y = pos.y;
      u.vx = 0;
      u.vy = 0;
      u.facingRad = 0;
      u.aimRad = 0;
      u.targetAimRad = 0;
      u.targetFacingRad = 0;
      u.fireCooldown = 0;
      u.aiStage = 'approach';
      u.aiStrafeSign = unitSeq % 2 === 0 ? 1 : -1;
      u.aiStrafeTimer = 0.4 + (unitSeq % 4) * 0.15;
      u.attackBlockId = -1;
      u.combatTargetKind = null;
      u.combatTargetId = -1;
      u.combatLockTimer = 0;
      u.aggroChase = false;
      u.aggroBlockId = -1;
      u.localGeneral = !!(archetype && archetype.isLocalGeneral);
      u.steeringUsed = 0;
      u.steeringBudgetMax = AI_LOCAL_PATH.steeringBudgetMax;
      u.skillIds = (archetype && archetype.activeSkills) || [];
      seedMoraleFromArchetype(u, archetype);
      seedShieldFromArchetype(u, archetype);
      ensureUnitSkills(u);
      ensureMeleeSwing(u);
      ensureBlackboardStub(u);
      u.skillSpeedMult = 1;
      u.tauntTimer = 0;
      u.tauntedById = -1;
      u.activeArmorId = null;
      u.activeArmorTopId = null;
      u.activeArmorVestId = null;
      u.activeShieldId = null;
      if (orders.armorTopId) equipArmorOnUnit(u, orders.armorTopId);
      if (orders.armorVestId || orders.armorId) {
        equipArmorOnUnit(u, orders.armorVestId || orders.armorId);
      }
      if (orders.shieldId) equipShieldOnUnit(u, orders.shieldId);
      ensureUnitWearVisuals(u);
      u.hasPlacementSkill = !!(archetype && archetype.hasPlacementSkill);
      u.inventory = null;
      u.activeHotbar = orders.currentSlot || 0;
      u.areaOrder = null;
      u._burstTimer = 0;
      u._flankTimer = 0;
      u._archetypePhaseKey = null;
      const effective = resolveEffectiveArchetype(u, u.archetypeId);
      if (effective) {
        applyEffectiveArchetypeToUnit(u, effective, { syncWeapon: false });
        ensureUnitSkills(u);
      }
      u.weaponId = weaponId;
      claimAreaOrder(u);
      attachUnitToGroup(group, u);
      registerSenseUnit(match, u);
      match.enemiesAlive += 1;
      unitSeq += 1;
    }
  }
}

/** Split perimeter spawns into angular arcs → one list per General group. */

export function partitionSpawnGroups(positions, groupCount, cx, cy) {
  if (!positions.length) return [];
  const sorted = positions.slice().sort((a, b) => {
    return Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx);
  });
  const n = sorted.length;
  const gCount = Math.min(groupCount, n);
  const groups = [];
  for (let g = 0; g < gCount; g++) {
    const start = Math.floor((g * n) / gCount);
    const end = Math.floor(((g + 1) * n) / gCount);
    const slice = sorted.slice(start, end);
    if (slice.length) groups.push(slice);
  }
  return groups;
}

export function pickSpawnOutsideBaseChunk(match, index, total) {
  const picked = pickOpenEdgeAreaPosition(match, index);
  if (picked) return picked;
  return pickEdgeSpawnPosition(match, index, total);
}

function pickOpenEdgeAreaPosition(match, slot) {
  // FlatLand handmade rim, then editor map areas (same pipe).
  const rim = match.world && match.world.edgeAreas;
  const mapped = match.mapAreas;
  const areas =
    rim && rim.length ? rim : mapped && mapped.length ? mapped : null;
  if (!areas || !areas.length) return null;
  const open = [];
  for (let i = 0; i < areas.length; i++) {
    if (areas[i].open !== false) open.push(areas[i]);
  }
  if (!open.length) return null;
  const waveIndex = match.waveIndex | 0;
  const area = open[(waveIndex + slot) % open.length];
  if (area.fromEditor) {
    // Editor areas are free rects — spawn inside, not on FlatLand outer-edge midpoints.
    const inset = 16;
    const slotN = ((slot % 5) - 2) * 36;
    return {
      x: Math.max(
        area.x + inset,
        Math.min(area.x + area.w - inset, area.x + area.w * 0.5 + slotN)
      ),
      y: Math.max(
        area.y + inset,
        Math.min(area.y + area.h - inset, area.y + area.h * 0.5)
      ),
    };
  }
  return edgeSpawnAnchor(area, match.world, slot);
}

/** Apply pack damage matrix (heal amounts stay raw). */

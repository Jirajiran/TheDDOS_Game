/**
 * Materialize editor / room map JSON into a live match.
 * Placeholders in the map file → real blocks/units/areas at load.
 * Editor maps do NOT keep FlatLand handmade red edgeAreas.
 */

import {
  getBalancePack,
  getBlockDef,
  getItemDef,
  getUnitArchetype,
  L3_SIZE,
  TEAM,
  deriveCollisionLayer,
} from '../config.js';
import { createAmmoState } from '../combat/weapons.js';
import { ensureUnitSkills } from '../combat/skills.js';
import { ensureMeleeSwing } from '../combat/meleeTools.js';
import { ensureUnitMorale, seedMoraleFromArchetype } from '../combat/morale.js';
import { seedShieldFromArchetype } from '../combat/shield.js';
import { ensureBlackboardStub } from '../combat/taunt.js';
import { readLoadoutOrders } from '../player/inventory.js';
import {
  applyEffectiveArchetypeToUnit,
  resolveEffectiveArchetype,
} from '../ai/archetypes.js';
import {
  skinGroupIdFromSheet,
  UNIT_VISUAL_ACTIONS,
} from '../view/unitVisual.js';
import { acquireUnit } from './pools.js';
import { canPlaceFootprint, worldToL3 } from './occupancy.js';
import { rebuildTerritories } from '../sim/territory.js';
import {
  applyBaseChunkPipeMask,
  buildBaseChunk,
  ensureBaseStorage,
  registerBlock,
  syncBaseStorageFromGenerators,
} from '../sim/block.js';
import { createPlacedBlock } from '../sim/place.js';
import { refreshEdgeAreas } from './world.js';
import {
  installSenseTeams,
  rebuildSenseIndexFromMatch,
  registerSenseUnit,
} from '../ai/senseIndex.js';

function lookupId(raw, getters) {
  if (!raw) return { id: '', def: null };
  const id0 = String(raw);
  for (let g = 0; g < getters.length; g++) {
    const def = getters[g](id0);
    if (def) return { id: id0, def };
  }
  const upper = id0.toUpperCase();
  if (upper !== id0) {
    for (let g = 0; g < getters.length; g++) {
      const def = getters[g](upper);
      if (def) return { id: upper, def };
    }
  }
  // Soft match: Title_Case / camel → UPPER_SNAKE (Grunt_Basic → GRUNT_BASIC).
  const snake = id0.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
  if (snake !== upper) {
    for (let g = 0; g < getters.length; g++) {
      const def = getters[g](snake);
      if (def) return { id: snake, def };
    }
  }
  return { id: id0, def: null };
}

function resolveBlockDef(templateId) {
  const hit = lookupId(templateId, [getBlockDef, getItemDef]);
  return hit.def ? { id: hit.id, def: hit.def } : null;
}

function resolveUnitArchetype(templateId) {
  const hit = lookupId(templateId, [getUnitArchetype]);
  return hit.def ? { id: hit.id, def: hit.def } : null;
}

function spawnPointFromDoc(doc, row) {
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
  const cols = Math.max(1, (doc && doc.pathCols) | 0);
  const rows = Math.max(1, (doc && doc.pathRows) | 0);
  const pathSize = (doc && doc.pathSize) || 1024;
  return {
    x: (cols * pathSize) / 2,
    y: (rows * pathSize) / 2,
    areaId: '',
  };
}

function hostSpawnRow(doc) {
  const seats = (doc && doc.playerSpawns) || [];
  for (let i = 0; i < seats.length; i++) {
    if (seats[i] && seats[i].role === 'host') return seats[i];
  }
  return seats[0] || null;
}

function clearFlatLandEdge(world) {
  if (!world) return;
  world.edgeAreas = [];
  world.skipEdgeAreas = true;
  world.disableEdgePlaceLock = true;
  const paths = world.paths || [];
  for (let i = 0; i < paths.length; i++) {
    if (paths[i]) paths[i].edge = false;
  }
}

/**
 * Install editor trigger areas; clear FlatLand handmade red edgeAreas.
 */
export function installEditorAreas(match, doc) {
  if (!match || !match.world) return;
  clearFlatLandEdge(match.world);

  const src = (doc && Array.isArray(doc.areas) ? doc.areas : []) || [];
  const mapped = [];
  for (let i = 0; i < src.length; i++) {
    const a = src[i];
    if (!a) continue;
    mapped.push({
      id: a.id || 'area_' + (i + 1),
      pathIndex: 0,
      x: a.x | 0,
      y: a.y | 0,
      w: Math.max(1, a.w | 0),
      h: Math.max(1, a.h | 0),
      open: a.open !== false,
      fromEditor: true,
      label: a.label || a.id || '',
    });
  }
  match.mapAreas = mapped;
  match.editorAreas = mapped.slice();
}

/**
 * Place object placeholders from the map file into real blocks.
 */
export function materializePlacedObjects(match, doc) {
  if (!match || !doc) return;
  const placed = Array.isArray(doc.placedObjects) ? doc.placedObjects : [];
  let needTerritory = false;

  for (let i = 0; i < placed.length; i++) {
    const inst = placed[i];
    if (!inst || inst.kind === 'unit') continue;
    const resolved = resolveBlockDef(inst.templateId);
    if (!resolved) {
      console.warn('[map] unknown placeable', inst.templateId);
      continue;
    }
    const { id: itemId, def: blockDef } = resolved;
    if (!blockDef.footprint) {
      console.warn('[map] no footprint', itemId);
      continue;
    }
    const fw = blockDef.footprint.w || 1;
    const fh = blockDef.footprint.h || 1;
    const { gx, gy } = worldToL3(inst.x || 0, inst.y || 0);
    if (!canPlaceFootprint(match.occupancy, gx, gy, fw, fh, null)) {
      console.warn('[map] footprint blocked', itemId, gx, gy);
      continue;
    }
    const team =
      inst.team != null
        ? inst.team | 0
        : blockDef.team != null
          ? blockDef.team
          : TEAM.PLAYER;
    const block = createPlacedBlock(match, itemId, gx, gy, blockDef, { team });
    if (inst.currentHp != null) {
      block.hp = Math.max(1, inst.currentHp | 0);
      if (inst.maxHp != null) block.maxHp = Math.max(block.hp, inst.maxHp | 0);
    }
    registerBlock(match, block);

    if (block.isDefeatCondition) {
      match.base = block;
      match.basePlaced = true;
      ensureBaseStorage(block);
      syncBaseStorageFromGenerators(block);
      match.baseChunk = buildBaseChunk(match, block);
      applyBaseChunkPipeMask(match);
      needTerritory = true;
    } else if (block.isTurret || block.isGen) {
      needTerritory = true;
    }
  }

  if (match.basePlaced && match.base) {
    const pack = getBalancePack();
    const rules = match.mapRules || (doc && doc.rules) || null;
    match.phase = 'setup';
    match.waveCountdown =
      (rules && rules.setupPhaseDurationSec != null
        ? rules.setupPhaseDurationSec
        : pack.setupPhaseDurationSec) | 0;
    match.waveActive = false;
    match.waveIndex = 0;
    match.interactPrompt = 'Map loaded — setup';
    refreshEdgeAreas(match);
  }

  if (needTerritory) rebuildTerritories(match);
}

/**
 * Spawn unit placeholders from the map file.
 */
export function materializePlacedUnits(match, doc) {
  if (!match || !doc || !match.pools) return;
  const placed = Array.isArray(doc.placedObjects) ? doc.placedObjects : [];
  const pack = getBalancePack();
  match.editorPlacedUnits = [];

  for (let i = 0; i < placed.length; i++) {
    const inst = placed[i];
    if (!inst || inst.kind !== 'unit') continue;
    match.editorPlacedUnits.push({
      templateId: inst.templateId,
      x: inst.x || 0,
      y: inst.y || 0,
      team: inst.team != null ? inst.team | 0 : TEAM.ENEMY,
      currentHp: inst.currentHp,
      maxHp: inst.maxHp,
    });

    const resolved = resolveUnitArchetype(inst.templateId);
    const archetype = resolved ? resolved.def : getUnitArchetype('GRUNT_BASIC');
    const archId = resolved ? resolved.id : 'GRUNT_BASIC';
    const u = acquireUnit(match.pools);
    if (!u) break;

    const team = inst.team != null ? inst.team | 0 : TEAM.ENEMY;
    // Player seat is only the human-controlled unit — map bots stay AI on any team.
    const sheet =
      (doc.units &&
        (doc.units[inst.templateId] ||
          doc.units[archId] ||
          doc.units[String(inst.templateId || '').toUpperCase()])) ||
      archetype;
    const orders = readLoadoutOrders(
      (sheet && sheet.startingLoadout) ||
        (archetype && archetype.startingLoadout),
      (sheet && sheet.currentSlot) != null
        ? sheet.currentSlot
        : archetype && archetype.currentSlot
    );
    const weaponId = orders.weaponId;
    const hpLo = archetype && archetype.hpRange ? archetype.hpRange[0] : pack.enemyMaxHp;
    const hpHi = archetype && archetype.hpRange ? archetype.hpRange[1] : pack.enemyMaxHp + 4;
    const maxHp =
      inst.maxHp != null
        ? inst.maxHp | 0
        : Math.round((hpLo + hpHi) / 2);

    u.active = true;
    u.typeId = 2;
    u.team = team;
    u.role = 'enemy';
    u.collisionLayer = deriveCollisionLayer({
      team,
      role: u.role,
    });
    u.pierceCost = 1;
    u.skinGroupId = skinGroupIdFromSheet(sheet);
    u.visualAction = UNIT_VISUAL_ACTIONS.idle;
    u.visualActionPrev = UNIT_VISUAL_ACTIONS.idle;
    u.visualActionT = 0;
    u.armTweenT = 0;
    u.armTweenDur = 0;
    u.archetypeId = archetype ? archetype.id : archId;
    u.isBoss = !!(archetype && archetype.isBoss);
    u.sizeScale =
      (archetype && (archetype.sizeScale || (archetype.isBoss ? 1.5 : 1))) || 1;
    u.maxHp = Math.max(1, maxHp);
    u.hp =
      inst.currentHp != null
        ? Math.max(1, Math.min(u.maxHp, inst.currentHp | 0))
        : u.maxHp;
    u.speed = pack.enemySpeed * (u.isBoss ? 0.85 : 1);
    u.radius = Math.round(pack.enemyRadius * (u.sizeScale || 1));
    u.armorType = (archetype && archetype.armorType) || pack.enemyArmorType;
    u.meleeMultiplier = (archetype && archetype.meleeMultiplier) || 1;
    u.weaponId = weaponId || null;
    if (weaponId) {
      Object.assign(u, createAmmoState(weaponId));
      u.mags = Math.max(u.mags || 0, 2);
    } else {
      u.ammoInMag = 0;
      u.mags = 0;
    }
    // Editor stores cell top-left; spawn at cell center.
    u.x = (inst.x || 0) + L3_SIZE * 0.5;
    u.y = (inst.y || 0) + L3_SIZE * 0.5;
    u.vx = 0;
    u.vy = 0;
    u.facingRad = 0;
    u.aimRad = 0;
    u.targetAimRad = 0;
    u.targetFacingRad = 0;
    u.fireCooldown = 0;
    u.aiStage = 'approach';
    u.groupId = -1;
    u.pivotIndex = 0;
    u.attackBlockId = -1;
    u.fromEditorMap = true;
    ensureBlackboardStub(u);
    ensureUnitMorale(u);
    if (archetype) {
      seedMoraleFromArchetype(u, archetype);
      seedShieldFromArchetype(u, archetype);
    }
    const effective = resolveEffectiveArchetype(u, u.archetypeId);
    if (effective) applyEffectiveArchetypeToUnit(u, effective, { syncWeapon: false });
    ensureUnitSkills(u);
    ensureMeleeSwing(u);
    registerSenseUnit(match, u);
    // Wave-clear counter: only non-player-faction bots (team 1 allies do not block win).
    if (team !== TEAM.PLAYER) {
      match.enemiesAlive = (match.enemiesAlive || 0) + 1;
    }
  }
}

/**
 * Apply editor map doc onto a loaded match (areas + placeholds).
 */
export function applyEditorMapDoc(match, doc) {
  if (!match || !doc) return match;

  match.editorMapDoc = doc;
  match.editorSpawns = Array.isArray(doc.spawns) ? doc.spawns.slice() : [];
  match.editorPlayerSpawns = Array.isArray(doc.playerSpawns)
    ? doc.playerSpawns.slice()
    : [];
  if (doc.rules && typeof doc.rules === 'object') {
    match.mapRules = Object.assign({}, match.mapRules || {}, doc.rules);
  }

  installSenseTeams(match, doc.teams);
  installEditorAreas(match, doc);
  materializePlacedObjects(match, doc);
  materializePlacedUnits(match, doc);
  rebuildSenseIndexFromMatch(match);

  return match;
}

/**
 * Move the player unit to the editor host spawn if present.
 */
export function applyEditorPlayerSpawn(match, doc) {
  if (!match || !doc) return;
  const row = hostSpawnRow(doc);
  if (!row) return;
  const point = spawnPointFromDoc(doc, row);
  const u =
    match.playerUnitId >= 0 && match.pools
      ? match.pools.units[match.playerUnitId]
      : null;
  if (!u || !u.active) return;
  u.x = point.x;
  u.y = point.y;
  if (match.world) {
    const pad = L3_SIZE;
    u.x = Math.max(pad, Math.min(match.world.worldW - pad, u.x));
    u.y = Math.max(pad, Math.min(match.world.worldH - pad, u.y));
  }
  match.cameraSnapPending = true;
}

/**
 * Apply resolved play map (editor doc and/or room catalog JSON).
 */
export function applyResolvedPlayMap(match, resolved) {
  if (!match || !resolved) return match;

  match.playMap = resolved;
  match.mapSource = resolved.source;
  match.mapFile = resolved.mapFile || '';
  match.roomMeta = resolved.roomMeta || null;
  match.mapRules = resolved.rules || null;
  match.mapBase = resolved.base || null;
  match.mapResources = resolved.resources || null;

  if (resolved.gameMode) match.gameMode = resolved.gameMode;

  const doc = resolved.mapDoc;
  if (doc) {
    applyEditorMapDoc(match, doc);
    match.fromEditorTestPlay = resolved.source === 'editor';
  } else if (resolved.roomMap && resolved.roomMap.placedObjects) {
    applyEditorMapDoc(match, resolved.roomMap);
  } else if (resolved.source === 'editor') {
    installEditorAreas(match, { areas: [] });
  }

  return match;
}

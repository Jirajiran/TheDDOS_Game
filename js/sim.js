import { ActionType } from './player/actions.js';
import {
  tickAreaTriggers,
} from './combat/areaTriggers.js';
import {
  GAME_PACK,
  getBalancePack,
  deriveCollisionLayer,
  getUnitArchetype,
  getBlockDef,
  getInventoryCapacity,
} from './config.js';
import {
  buildBaseChunkNavPoints,
  clearBaseChunkL1Mask,
  createGeneralState,
} from './ai/general.js';
import {
  applyStartingLoadout,
  createEmptyInventory,
  emptySlot,
  equipArmorOnUnit,
  equipShieldOnUnit,
  tryEquipWornFromActive,
  makeSlotFromItem,
} from './player/inventory.js';
import { generateWorldObjects } from './world/mapgen.js';
import { refreshEdgeAreas } from './world/world.js';
import { rebuildTerritories } from './sim/territory.js';
import { openHuntArea } from './sim/huntArea.js';
import {
  getEffectiveSpeedMult,
  tickMoralePassives,
} from './combat/morale.js';
import {
  clearFootprint,
  createOccupancy,
  markFootprint,
} from './world/occupancy.js';
import {
  acquireUnit,
  resetPools,
} from './world/pools.js';
import {
  menuSkinToGroupId,
  tickAllUnitVisuals,
} from './view/unitVisual.js';
import {
  seedShieldFromArchetype,
  tickShields,
} from './combat/shield.js';
import {
  tickAllSkills,
  tryBeginCastSkill,
} from './combat/skills.js';
import {
  tickTauntFlags,
} from './combat/taunt.js';
import {
  applyBaseChunkPipeMask,
  applyDamageToBlock,
  buildBaseChunk,
  destroyBlock,
  registerBlock,
  takeBaseResources,
  takeGenResources,
  collectFactoryWeapon,
  depositFactoryWeapon,
  tryInteract,
  updateBlockSystems,
  updateFactory,
  updateInteractPrompt,
} from './sim/block.js';
import {
  pickupDrops,
  spawnDrop,
  updateDrops,
} from './sim/drops.js';
import {
  decideTurretActions,
  queueHotbarSelect,
  tickHotbarSwitches,
  tickMuzzleLead,
  tickWeaponBursts,
  tryFire,
  tryTurretFire,
  updateBeams,
  updateCooldowns,
  updateProjectiles,
} from './sim/fire.js';
import {
  tickAllMeleeSwings,
  tickExplosionVfx,
  tickMeleeVfx,
  tryHarvest,
} from './sim/melee.js';
import {
  createPlacedBlock,
  tryPlaceFromAction,
  updatePlaceGhost,
} from './sim/place.js';
import {
  tryCancelReload,
  tryReload,
  updateWeaponReloads,
} from './sim/reload.js';
import {
  applyDamageToUnit,
  applyEnemyContactDamage,
  decideEnemyActions,
  getPlayerUnit,
  integrateUnitMotion,
  separateUnits,
  slewAngle,
  spawnPlayerNearWorldCenter,
  updatePlayerRespawn,
} from './sim/unit.js';
import {
  updateWaves,
} from './sim/wave.js';
export {
  findInteractTarget,
  getGenReceiveState,
  takeGenResources,
  getBaseReceiveState,
  takeBaseResources,
  depositFactoryWeapon,
  collectFactoryWeapon,
} from './sim/block.js';
export {
  throwHotbarSlot,
  findNearbyBackpackDrop,
  tryEquipBackpackFromDrop,
  tryEquipBackpackFromSlot,
  equipCraftedBackpack,
  tryUnequipBackpackToDrop,
  getEquippedBackpackTier,
} from './sim/drops.js';
export {
  getMeleeVolume,
} from './sim/melee.js';
export {
  updatePlaceGhost,
} from './sim/place.js';
export {
  spawnPlayer,
  getPlayerUnit,
} from './sim/unit.js';
export function initMatchGameplay(match, options = {}) {
  const pack = getBalancePack();
  const { world } = match;

  match.gameMode = options.gameMode || match.gameMode || 'FLAT_SURVIVAL';
  match.host = options.host || match.host || null;
  match.playerSkinGroupId =
    options.playerSkinGroupId ||
    menuSkinToGroupId(options.menuSkinId) ||
    'Default_skin_1';

  if (!match.occupancy) {
    match.occupancy = createOccupancy(world);
  } else {
    const cells = match.occupancy.cells;
    for (let i = 0; i < cells.length; i++) cells[i] = -1;
    match.occupancy.nextBlockId = 1;
  }

  match.base = null;
  match.baseChunk = null;
  refreshEdgeAreas(match);
  match.territories = [];
  match.huntArea = null;
  match.blocks = [];
  match.worldObjects = [];
  match.blockById = Object.create(null);
  match.basePlaced = false;
  match.phase = 'await_base';
  match.waveIndex = 0;
  match.waveCountdown = 0;
  match.waveActive = false;
  match.enemiesAlive = 0;
  match.outcome = null;
  match.activeHotbar = 0;
  match.wornArmorSlot = -1;
  match.wornShieldSlot = -1;
  match.pendingHotbar = -1;
  match.hotbarSwitchT = 0;
  match.hotbarFireLockT = 0;
  match.equippedBackpackId = null;
  match.inventory = createEmptyInventory(
    pack.hotbarBaseSlots || pack.hotbarSlots
  );
  applyStartingLoadout(match.inventory);
  match.hotbar = match.inventory;
  match.playerUnitId = -1;
  match.respawnTimer = 0;
  match.playerDead = false;
  match.cameraFreeFly = false;
  match.deathX = 0;
  match.deathY = 0;
  match.cameraZoom = pack.cameraFollowZoom;
  match.placeGhost = null;
  match.interactPrompt = '';
  match.pendingUi = null;
  match.lastTakeResult = null;
  match.showMeleeVolume = false;
  match.meleeVfx = [];
  match.explosionVfx = [];
  match.freeCraft = false;
  match.stats = {
    kills: 0,
    shotsFired: 0,
    blocksPlaced: 0,
    resourcesGathered: 0,
    damageDealt: 0,
  };
  match.general = createGeneralState();
  match.factoryQueue = [];
  match.beams = [];
  match.pathPipeMask = { active: false, maskedKeys: new Set(), navPoints: [] };
  match.simTime = 0;
  match.nightBlend = 0;

  generateWorldObjects(match);
  spawnPlayerNearWorldCenter(match);
  return match;
}

export function tickMatch(match, actions, mouseWorld, dt) {
  if (match.outcome) return match.outcome;

  match.simTime = (match.simTime || 0) + dt;
  updatePlaceGhost(match, mouseWorld);

  const botActions = decideEnemyActions(match, dt);
  const turretActions = decideTurretActions(match);
  const allActions = actions.concat(botActions).concat(turretActions);

  applyActions(match, allActions, mouseWorld, dt);
  integrateUnitMotion(match, dt);
  separateUnits(match);
  updateCooldowns(match, dt);
  tickWeaponBursts(match, dt);
  tickMuzzleLead(match, dt);
  tickHotbarSwitches(match, dt);
  updateWeaponReloads(match, dt);
  tickAllSkills(match, dt);
  tickAllMeleeSwings(match, dt);
  tickAllUnitVisuals(match, dt);
  tickMeleeVfx(match, dt);
  tickExplosionVfx(match, dt);
  tickMoralePassives(match, dt);
  tickShields(match, dt);
  tickTauntFlags(match, dt);
  updateProjectiles(match, dt);
  updateBeams(match, dt);
  updateBlockSystems(match, dt);
  tickAreaTriggers(match, dt, {
    applyDamageToUnit,
    applyDamageToBlock,
  });
  updateFactory(match, dt);
  applyEnemyContactDamage(match, dt);
  updateDrops(match, dt);
  pickupDrops(match);
  updateInteractPrompt(match);
  updateWaves(match, dt);
  updatePlayerRespawn(match, dt);

  if (match.base && match.base.alive && match.base.hp <= 0) {
    destroyBlock(match, match.base);
    match.baseChunk = null;
    refreshEdgeAreas(match);
  }
  if (match.basePlaced && (!match.base || !match.base.alive)) {
    const loseMode = getBalancePack().loseMode === 2 ? 2 : 1;
    if (loseMode === 1 || match.playerDead) {
      match.outcome = 'lose';
      return 'lose';
    }
  }

  return match.outcome;
}

function noteFactory(match, lines) {
  const dwell = GAME_PACK.gunDetailDwellSec != null ? GAME_PACK.gunDetailDwellSec : 0.9;
  match.factoryNotice = {
    lines,
    until: (match.simTime || 0) + dwell,
  };
}

function applyFactoryTake(match, blockId, slotIndex, role) {
  if (!match || !match.blocks || blockId == null) return;
  let factory = null;
  for (let i = 0; i < match.blocks.length; i++) {
    const block = match.blocks[i];
    if (block && block.id === blockId) {
      factory = block;
      break;
    }
  }
  const want = role || 'take';
  if (!factory || !factory.alive) {
    noteFactory(match, ['Cannot insert', 'Factory is closed']);
    return;
  }
  if (factory.factoryBusy) {
    noteFactory(match, [
      want === 'collect' ? 'Cannot take' : 'Cannot insert',
      'Factory is working',
    ]);
    return;
  }
  if (want === 'collect' || (want === 'take' && factory.factoryWeaponId)) {
    if (!factory.factoryWeaponId) {
      noteFactory(match, ['Cannot take', 'Nothing to return']);
      return;
    }
    const id = factory.factoryWeaponId;
    const code = collectFactoryWeapon(match, factory);
    if (code === 'ok') noteFactory(match, ['Returned', id]);
    else if (code === 'full') noteFactory(match, ['Cannot take', 'Inventory full']);
    else noteFactory(match, ['Cannot take', 'Nothing to return']);
    return;
  }
  if (factory.factoryWeaponId) {
    noteFactory(match, ['Cannot insert', 'Take the finished gun first']);
    return;
  }
  const code = depositFactoryWeapon(match, factory, slotIndex);
  if (code === 'ok') noteFactory(match, ['Accepted', factory._pendingResult || '']);
  else if (code === 'no-recipe') noteFactory(match, ['Cannot insert', 'No upgrade recipe']);
  else if (code === 'not-weapon') noteFactory(match, ['Cannot insert', 'Not a weapon']);
  else noteFactory(match, ['Cannot insert', 'Factory is working']);
}

function applyActions(match, actions, mouseWorld, dt) {
  const player = getPlayerUnit(match);
  const moveIntent = Object.create(null);

  // Pass 1: queue SELECT (delay + lock while burst/beam). Commit in tickHotbarSwitches.
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    if (a.type !== ActionType.SELECT_HOTBAR) continue;
    if (player && a.unitId === player.id) {
      queueHotbarSelect(match, player, a.slot | 0, true);
    } else {
      const u = match.pools.units[a.unitId];
      if (u && u.active && u.inventory) {
        queueHotbarSelect(match, u, a.slot | 0, false);
      }
    }
  }

  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];

    if (a.type === ActionType.SELECT_HOTBAR) {
      continue;
    }

    // Turret fire uses synthetic unitId = -(blockId+1)
    if (a.type === ActionType.FIRE && a.turretBlockId != null) {
      tryTurretFire(match, a.turretBlockId, a.aimRad);
      continue;
    }

    const unit = match.pools.units[a.unitId];
    if (!unit || !unit.active) continue;

    if (a.type === ActionType.MOVE) {
      moveIntent[unit.id] = { dx: a.dx, dy: a.dy };
      if (a.dx !== 0 || a.dy !== 0) {
        unit.targetFacingRad = Math.atan2(a.dy, a.dx);
      }
    } else if (a.type === ActionType.AIM) {
      if (a.stickAim && typeof a.aimRad === 'number') {
        unit.targetAimRad = a.aimRad;
        unit.targetFacingRad = a.aimRad;
      } else if (unit.role === 'player' && mouseWorld) {
        unit.targetAimRad = Math.atan2(mouseWorld.y - unit.y, mouseWorld.x - unit.x);
        unit.targetFacingRad = unit.targetAimRad;
      } else if (typeof a.aimRad === 'number') {
        unit.targetAimRad = a.aimRad;
      }
    } else if (a.type === ActionType.FIRE) {
      tryFire(match, unit);
    } else if (a.type === ActionType.RELOAD) {
      tryReload(match, unit);
    } else if (a.type === ActionType.CANCEL_RELOAD) {
      tryCancelReload(match, unit);
    } else if (a.type === ActionType.INTERACT) {
      if (unit.role === 'player') tryInteract(match, unit);
    } else if (a.type === ActionType.HARVEST) {
      // Player + AI units with inventory share tool/wrench path (no cheat).
      tryHarvest(match, unit, a.worldX, a.worldY);
    } else if (a.type === ActionType.TAKE_GEN) {
      if (unit.role === 'player') {
        match.lastTakeResult = {
          kind: 'gen',
          blockId: a.blockId,
          ...takeGenResources(match, a.blockId, a.amount),
        };
      }
    } else if (a.type === ActionType.TAKE_BASE) {
      if (unit.role === 'player') {
        match.lastTakeResult = {
          kind: 'base',
          itemId: a.itemId,
          ...takeBaseResources(match, a.itemId, a.amount),
        };
      }
    } else if (a.type === ActionType.TAKE_FACTORY) {
      if (unit.role === 'player') {
        applyFactoryTake(match, a.blockId, a.slotIndex, a.role);
      }
    } else if (a.type === ActionType.PLACE) {
      tryPlaceFromAction(match, unit, a);
    } else if (a.type === ActionType.EQUIP_WORN) {
      if (unit.role === 'player') tryEquipWornFromActive(match, unit);
    } else if (a.type === ActionType.CAST_SKILL) {
      if (a.skillId === 'SELF_HEAL') continue;
      tryBeginCastSkill(unit, {
        skillId: a.skillId,
        targetPosVec2: a.targetPosVec2,
        targetEntityId: a.targetEntityId,
      });
    }
  }

  const units = match.pools.units;
  const pack = GAME_PACK;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active) continue;
    const intent = moveIntent[u.id];
    const speedMult = getEffectiveSpeedMult(u);
    if (intent) {
      u.vx = intent.dx * u.speed * speedMult;
      u.vy = intent.dy * u.speed * speedMult;
    } else if (u.role === 'player') {
      u.vx = 0;
      u.vy = 0;
    }
    // Slew aim / facing toward targets (no instant snap).
    if (typeof u.targetAimRad === 'number') {
      u.aimRad = slewAngle(u.aimRad, u.targetAimRad, pack.aimTurnRateRadPerSec, dt);
      // Enemies often set aim only — keep body facing target for sprite tween.
      if (u.role === 'enemy') {
        u.targetFacingRad = u.targetAimRad;
      }
    }
    if (typeof u.targetFacingRad === 'number') {
      u.facingRad = slewAngle(
        u.facingRad,
        u.targetFacingRad,
        pack.facingTurnRateRadPerSec,
        dt
      );
    }
  }
}

/** Resolve inventory bag for player (match-shared) or AI unit bag. */

export function restoreMatchFromSnapshot(match, snap) {
  if (!match || !snap) return false;
  initMatchGameplay(match, {
    gameMode: snap.gameMode || match.gameMode,
    host: match.host,
  });

  match.phase = snap.phase || 'await_base';
  match.waveIndex = snap.waveIndex || 0;
  match.waveCountdown = snap.waveCountdown || 0;
  match.waveActive = !!snap.waveActive;
  match.enemiesAlive = 0;
  match.outcome = snap.outcome || null;
  match.activeHotbar = snap.activeHotbar || 0;
  match.wornArmorSlot = snap.wornArmorSlot != null ? snap.wornArmorSlot : -1;
  match.wornShieldSlot = snap.wornShieldSlot != null ? snap.wornShieldSlot : -1;
  match.playerDead = !!snap.playerDead;
  match.respawnTimer = snap.respawnTimer || 0;
  match.cameraZoom = snap.cameraZoom || GAME_PACK.cameraFollowZoom;
  match.nightBlend =
    typeof snap.nightBlend === 'number' ? snap.nightBlend : match.nightBlend || 0;
  match.freeCraft = !!snap.freeCraft;
  if (snap.stats) match.stats = { ...match.stats, ...snap.stats };

  // Clear world harvest then rebuild from snap blocks only (snapshot owns world objects).
  match.blocks = [];
  match.blockById = Object.create(null);
  match.base = null;
  match.basePlaced = false;
  match.baseChunk = null;
  clearBaseChunkL1Mask(match);
  const cells = match.occupancy.cells;
  for (let i = 0; i < cells.length; i++) cells[i] = -1;
  match.occupancy.nextBlockId = 1;

  resetPools(match.pools);
  // resetPools is imported? — use deactivate via acquire cycle instead
  for (let i = 0; i < match.pools.units.length; i++) {
    match.pools.units[i].active = false;
  }
  for (let i = 0; i < match.pools.drops.length; i++) {
    match.pools.drops[i].active = false;
  }
  for (let i = 0; i < match.pools.projectiles.length; i++) {
    match.pools.projectiles[i].active = false;
  }

  if (Array.isArray(snap.inventory)) {
    match.equippedBackpackId = snap.equippedBackpackId || null;
    const cap = getInventoryCapacity(match.equippedBackpackId);
    match.inventory = createEmptyInventory(cap);
    for (let i = 0; i < snap.inventory.length && i < match.inventory.length; i++) {
      const s = snap.inventory[i];
      if (!s || !s.itemId) {
        match.inventory[i] = emptySlot();
        continue;
      }
      const slot = makeSlotFromItem(s.itemId, s.count || 1);
      slot.ammoInMag = s.ammoInMag || 0;
      slot.mags = s.mags || 0;
      slot.reloadTimer = s.reloadTimer || 0;
      if (s.weaponId) slot.weaponId = s.weaponId;
      match.inventory[i] = slot;
    }
    match.hotbar = match.inventory;
  }

  if (Array.isArray(snap.blocks)) {
    let maxId = 0;
    for (let i = 0; i < snap.blocks.length; i++) {
      const sb = snap.blocks[i];
      const def = getBlockDef(sb.itemId);
      if (!def) continue;
      const block = createPlacedBlock(match, sb.itemId, sb.gx, sb.gy, def, {
        team: sb.team != null ? sb.team : undefined,
      });
      // Prefer saved id if unique
      if (sb.id > 0) {
        clearFootprint(match.occupancy, block.gx, block.gy, block.fw, block.fh);
        block.id = sb.id;
        markFootprint(match.occupancy, block.gx, block.gy, block.fw, block.fh, block.id);
        if (sb.id >= match.occupancy.nextBlockId) {
          match.occupancy.nextBlockId = sb.id + 1;
        }
      }
      block.hp = sb.hp != null ? sb.hp : block.maxHp;
      block.maxHp = sb.maxHp != null ? sb.maxHp : block.maxHp;
      block.isOpen = !!sb.isOpen;
      if (block.isOpen) {
        block.walkSolid = false;
        block.projectileSolid = false;
      }
      block.fireCooldown = sb.fireCooldown || 0;
      block.turretAimRad = sb.turretAimRad || 0;
      block.genStock = sb.genStock || 0;
      block.genTimer = sb.genTimer || block.genTimer;
      if (sb.generatorList && block.generatorList) {
        for (let g = 0; g < block.generatorList.length && g < sb.generatorList.length; g++) {
          block.generatorList[g].timer = sb.generatorList[g].timer;
          block.generatorList[g].stock = sb.generatorList[g].stock;
        }
      }
      block.factoryBusy = !!sb.factoryBusy;
      block.factoryTimer = sb.factoryTimer || 0;
      block.factoryDuration = sb.factoryDuration || 0;
      block.factoryWeaponId = sb.factoryWeaponId || null;
      block._pendingResult = sb.factoryPendingId || null;
      block.factorySourceId = sb.factorySourceId || null;
      registerBlock(match, block);
      if (block.isDefeatCondition) {
        match.base = block;
        match.basePlaced = true;
        match.baseChunk = buildBaseChunk(match, block);
        applyBaseChunkPipeMask(match);
      }
      if (block.id > maxId) maxId = block.id;
    }
  }

  if (snap.baseChunk && match.basePlaced) {
    match.baseChunk = {
      ...snap.baseChunk,
      navPoints: snap.baseChunk.navPoints || buildBaseChunkNavPoints(snap.baseChunk),
    };
    applyBaseChunkPipeMask(match);
  }
  refreshEdgeAreas(match);
  rebuildTerritories(match);
  if (snap.basePlaced && !(match.base && match.base.alive)) openHuntArea(match);
  else match.huntArea = null;

  if (snap.pathPipeMask) {
    match.pathPipeMask = {
      active: !!snap.pathPipeMask.active,
      maskedKeys: new Set(snap.pathPipeMask.maskedKeys || []),
      navPoints: (match.baseChunk && match.baseChunk.navPoints) || [],
    };
  }

  match.playerUnitId = -1;
  if (Array.isArray(snap.units)) {
    for (let i = 0; i < snap.units.length; i++) {
      const su = snap.units[i];
      const u = acquireUnit(match.pools);
      if (!u) break;
      u.active = true;
      u.role = su.role;
      u.team = su.team;
      u.collisionLayer =
        typeof su.collisionLayer === 'number'
          ? su.collisionLayer
          : deriveCollisionLayer({ team: su.team, role: su.role });
      u.pierceCost = typeof su.pierceCost === 'number' ? su.pierceCost : 1;
      u.x = su.x;
      u.y = su.y;
      u.hp = su.hp;
      u.maxHp = su.maxHp;
      u.speed = su.speed;
      u.radius = su.radius;
      u.armorType = su.armorType || 'DEFAULT';
      u.weaponId = su.weaponId || null;
      u.ammoInMag = su.ammoInMag || 0;
      u.mags = su.mags || 0;
      u.reloadTimer = su.reloadTimer || 0;
      u.facingRad = su.facingRad || 0;
      u.aimRad = su.aimRad || 0;
      u.targetAimRad = su.aimRad || 0;
      u.targetFacingRad = su.facingRad || 0;
      u.archetypeId = su.archetypeId || null;
      u.sizeScale = su.sizeScale || 1;
      u.isBoss = !!su.isBoss;
      u.groupId = su.groupId != null ? su.groupId : -1;
      u.pivotIndex = su.pivotIndex || 0;
      u.aiStage = su.aiStage || 'approach';
      u.aggroChase = !!su.aggroChase;
      u.combatTargetKind = su.combatTargetKind || null;
      u.combatTargetId = su.combatTargetId != null ? su.combatTargetId : -1;
      u.aggroBlockId = su.aggroBlockId != null ? su.aggroBlockId : -1;
      u.localGeneral = !!su.localGeneral;
      u.activeArmorId = su.activeArmorId || null;
      u.activeShieldId = su.activeShieldId || null;
      if (u.activeArmorId) {
        equipArmorOnUnit(u, u.activeArmorId);
      }
      if (u.activeShieldId) {
        equipShieldOnUnit(u, u.activeShieldId);
      } else if (u.archetypeId) {
        const arch = getUnitArchetype(u.archetypeId);
        if (arch) seedShieldFromArchetype(u, arch);
      }
      u.fireCooldown = 0;
      u.vx = 0;
      u.vy = 0;
      if (u.role === 'player') {
        match.playerUnitId = u.id;
        match.playerDead = false;
      }
      if (u.role === 'enemy') match.enemiesAlive += 1;
    }
  }

  if (match.playerUnitId < 0 && !match.playerDead) {
    spawnPlayerNearWorldCenter(match);
  }

  if (Array.isArray(snap.drops)) {
    for (let i = 0; i < snap.drops.length; i++) {
      const sd = snap.drops[i];
      spawnDrop(match, sd.x, sd.y, sd.itemId, sd.stack, sd.vx || 0, sd.vy || 0);
    }
  }

  if (snap.general) {
    match.general = createGeneralState();
    match.general.targetPathIndex = snap.general.targetPathIndex;
    match.general.laneCursorBySide = { ...(snap.general.laneCursorBySide || {}) };
    if (Array.isArray(snap.general.groups)) {
      match.general.groups = snap.general.groups.map((g) => ({
        id: g.id,
        lane: g.lane,
        side: g.side,
        pivots: g.pivots || [],
        segmentIndex: g.segmentIndex || 0,
        unitIds: g.unitIds || [],
        spotted: !!g.spotted,
        sectorStart: g.sectorStart != null ? g.sectorStart : 0,
        sectorEnd: g.sectorEnd != null ? g.sectorEnd : Math.PI * 2,
      }));
    }
  }

  match.beams = [];
  match.cameraSnapPending = true;
  return true;
}

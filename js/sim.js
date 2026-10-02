import { ActionType } from './actions.js';
import {
  attachAreaTriggerFromDef,
  tickAreaTriggers,
  tryProjectileExplosion,
} from './areaTriggers.js';
import {
  AI_EVENT_BOOSTS,
  AI_GOAL_BASE_WEIGHTS,
  AI_GOAL_TO_STAGE,
  AI_LOCAL_PATH,
  GAME_PACK,
  L3_SIZE,
  PATH_SIZE,
  TEAM,
  TURRET_DOGPILE_K,
  WIRE_MELEE_MULT,
  defaultProjectileHitMask,
  deriveCollisionLayer,
  getArchetypeForWave,
  getUnitArchetype,
  pickArchetypeIdForWaveSlot,
  getBlockDef,
  getBlockPierceCost,
  getDamageMult,
  getEntityPierceCost,
  getItemDef,
  getPierceUnitBudget,
  getUpgradeRecipe,
  getWeaponDef,
  layerHitsMask,
} from './config.js';
import {
  advanceUnitAlongChain,
  attachUnitToGroup,
  buildBaseChunkNavPoints,
  clearBaseChunkL1Mask,
  createGeneralState,
  deployPreparedGroups,
  isUnitInsideSector,
  maskBaseChunkL1Pipes,
  prepareGroupPathsSequential,
  resetGeneral,
  updateGeneralTarget,
} from './general.js';
import {
  applyLocalPathLayer,
  writeGeneralPathToBlackboard,
} from './ai/local_group_manager.js';
import {
  addItemToInventory,
  applyStartingLoadout,
  consumeSlotItem,
  countItem,
  createEmptyInventory,
  deductCost,
  emptySlot,
  getActiveSlot,
  getWeaponFromSlot,
  equipArmorOnUnit,
  equipShieldOnUnit,
  getArmorDamageReduction,
  isArmorSlot,
  isShieldSlot,
  isPlaceableSlot,
  isToolSlot,
  isWeaponSlot,
  makeSlotFromItem,
} from './inventory.js';
import { generateWorldObjects } from './mapgen.js';
import {
  applyBlockRepair,
  ensureMeleeSwing,
  resolveFistVsUnit,
  resolveMeleeVsBlock,
  tickMeleeSwing,
  tryBeginMeleeSwing,
} from './meleeTools.js';
import {
  ensureUnitMorale,
  getEffectiveSpeedMult,
  getPassiveDamageReduction,
  noteMoralePressure,
  seedMoraleFromArchetype,
  tickMoralePassives,
} from './morale.js';
import {
  blockProjectileSolid,
  canPlaceFootprint,
  clearFootprint,
  createOccupancy,
  l3OriginWorld,
  markFootprint,
  resolveUnitVsOccupancy,
  snapWorldToL3Origin,
  unitStandingCells,
  worldToL3,
} from './occupancy.js';
import { acquireDrop, acquireProjectile, acquireUnit, deactivateUnit, resetPools } from './pools.js';
import {
  absorbDamageWithShield,
  segmentHitsShield,
  seedShieldFromArchetype,
  tickShields,
} from './shield.js';
import {
  ensureUnitSkills,
  tickAllSkills,
  tryBeginCastSkill,
} from './skills.js';
import { ensureBlackboard } from './ai/blackboard.js';
import { noteHitEvent } from './ai/events.js';
import { decideUnitViaMediator } from './ai/mediator.js';
import {
  applyEffectiveArchetypeToUnit,
  resolveEffectiveArchetype,
} from './ai/archetypes.js';
import { ensureBlackboardStub, tickTauntFlags } from './taunt.js';
import {
  beginReload,
  canFireAmmo,
  consumeAmmoForShot,
  createAmmoState,
  tickReload,
} from './weapons.js';

/**
 * Build runtime match gameplay state on top of loaded pools/world.
 * Match starts WITHOUT a base — player must PLACE via hotbar.
 */
export function initMatchGameplay(match, options = {}) {
  const pack = GAME_PACK;
  const { world } = match;

  match.gameMode = options.gameMode || match.gameMode || 'FLAT_SURVIVAL';
  match.host = options.host || match.host || null;

  if (!match.occupancy) {
    match.occupancy = createOccupancy(world);
  } else {
    const cells = match.occupancy.cells;
    for (let i = 0; i < cells.length; i++) cells[i] = -1;
    match.occupancy.nextBlockId = 1;
  }

  match.base = null;
  match.baseChunk = null;
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
  match.inventory = createEmptyInventory(pack.hotbarSlots);
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

  generateWorldObjects(match);
  spawnPlayerNearWorldCenter(match);
  return match;
}

function getBlock(match, id) {
  return match.blockById[id] || null;
}

function registerBlock(match, block) {
  match.blocks.push(block);
  match.blockById[block.id] = block;
}

function spawnPlayerNearWorldCenter(match) {
  const pack = GAME_PACK;
  const { world, pools } = match;
  let u = null;
  if (match.playerUnitId >= 0) {
    u = pools.units[match.playerUnitId];
  }
  if (!u || !u.active) {
    u = acquireUnit(pools);
    if (!u) return null;
    match.playerUnitId = u.id;
  }

  resetPlayerStats(u, pack);
  u.x = world.worldW * 0.5;
  u.y = world.worldH * 0.5;
  match.playerDead = false;
  match.cameraFreeFly = false;
  match.respawnTimer = 0;
  match.cameraSnapPending = true;
  return u;
}

function resetPlayerStats(u, pack) {
  u.active = true;
  u.typeId = 1;
  u.team = TEAM.PLAYER;
  u.role = 'player';
  u.collisionLayer = deriveCollisionLayer({ team: TEAM.PLAYER, role: 'player' });
  u.pierceCost = 1;
  u.maxHp = pack.playerMaxHp;
  u.hp = pack.playerMaxHp;
  u.speed = pack.playerSpeed;
  u.radius = pack.playerRadius;
  u.armorType = pack.playerArmorType;
  u.weaponId = 'M1991';
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
  Object.assign(u, createAmmoState('M1991'));
  ensureUnitMorale(u);
  ensureBlackboardStub(u);
  u.skillIds = u.skillIds || [];
  ensureUnitSkills(u);
  ensureMeleeSwing(u);
  u.skillSpeedMult = 1;
  u.shield = null;
  u.tauntTimer = 0;
  u.tauntedById = -1;
  if (pack.startingArmorId) {
    equipArmorOnUnit(u, pack.startingArmorId);
  } else {
    u.activeArmorId = null;
  }
  if (pack.startingShieldId) {
    equipShieldOnUnit(u, pack.startingShieldId);
  } else {
    u.activeShieldId = null;
  }
}

export function spawnPlayer(match) {
  const pack = GAME_PACK;
  const { base, pools, world } = match;
  if (!base || !base.alive) {
    return spawnPlayerNearWorldCenter(match);
  }

  let u = null;
  if (match.playerUnitId >= 0) {
    u = pools.units[match.playerUnitId];
  }
  if (!u || !u.active) {
    u = acquireUnit(pools);
    if (!u) return null;
    match.playerUnitId = u.id;
  }

  resetPlayerStats(u, pack);
  const angle = (match.waveIndex * 1.7 + u.id) % (Math.PI * 2);
  const dist = base.w * 0.55 + L3_SIZE * 0.5;
  u.x = clamp(
    base.x + base.w / 2 + Math.cos(angle) * dist,
    u.radius,
    world.worldW - u.radius
  );
  u.y = clamp(
    base.y + base.h / 2 + Math.sin(angle) * dist,
    u.radius,
    world.worldH - u.radius
  );
  resolveUnitVsOccupancy(u, match.occupancy, (id) => getBlock(match, id));
  clampUnitInWorld(u, world);
  match.playerDead = false;
  match.cameraFreeFly = false;
  match.respawnTimer = 0;
  match.cameraSnapPending = true;
  return u;
}

export function getPlayerUnit(match) {
  if (!match || match.playerUnitId < 0) return null;
  const u = match.pools.units[match.playerUnitId];
  return u && u.active && u.role === 'player' ? u : null;
}

export function updatePlaceGhost(match, mouseWorld) {
  match.placeGhost = null;
  if (!mouseWorld) return null;
  const slot = getActiveSlot(match.inventory, match.activeHotbar);
  if (!isPlaceableSlot(slot)) return null;

  const blockDef = getBlockDef(slot.itemId);
  if (!blockDef) return null;

  const fw = blockDef.footprint.w;
  const fh = blockDef.footprint.h;
  const snapped = snapWorldToL3Origin(mouseWorld.x, mouseWorld.y);
  const ox = snapped.gx - Math.floor(fw / 2);
  const oy = snapped.gy - Math.floor(fh / 2);
  const player = getPlayerUnit(match);
  const standing = player
    ? unitStandingCells(player.x, player.y, player.radius)
    : null;
  const valid = canPlaceFootprint(match.occupancy, ox, oy, fw, fh, standing);
  const origin = l3OriginWorld(ox, oy);
  match.placeGhost = {
    gx: ox,
    gy: oy,
    x: origin.x,
    y: origin.y,
    w: fw * L3_SIZE,
    h: fh * L3_SIZE,
    valid,
    itemId: slot.itemId,
    color: blockDef.color,
  };
  return match.placeGhost;
}

/**
 * Process Action list then advance sim one frame.
 * @returns {'win'|'lose'|null}
 */
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
  updateWeaponReloads(match, dt);
  tickAllSkills(match, dt);
  tickAllMeleeSwings(match, dt);
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
    match.outcome = 'lose';
    return 'lose';
  }

  return match.outcome;
}

function applyActions(match, actions, mouseWorld, dt) {
  const player = getPlayerUnit(match);
  const moveIntent = Object.create(null);

  // Pass 1: SELECT before PLACE/FIRE (same-frame scroll/click uses new slot).
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    if (a.type !== ActionType.SELECT_HOTBAR) continue;
    if (player && a.unitId === player.id) {
      match.activeHotbar = a.slot | 0;
      const slot = getActiveSlot(match.inventory, match.activeHotbar);
      if (isArmorSlot(slot) && player) {
        equipArmorOnUnit(player, slot.itemId);
      }
      if (isShieldSlot(slot) && player) {
        equipShieldOnUnit(player, slot.itemId);
      }
    } else {
      const u = match.pools.units[a.unitId];
      if (u && u.active && u.inventory) {
        u.activeHotbar = a.slot | 0;
        const slot = getActiveSlot(u.inventory, u.activeHotbar);
        if (isArmorSlot(slot)) equipArmorOnUnit(u, slot.itemId);
        if (isShieldSlot(slot)) equipShieldOnUnit(u, slot.itemId);
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
      if (unit.role === 'player' && mouseWorld) {
        unit.targetAimRad = Math.atan2(mouseWorld.y - unit.y, mouseWorld.x - unit.x);
        unit.targetFacingRad = unit.targetAimRad;
      } else if (typeof a.aimRad === 'number') {
        unit.targetAimRad = a.aimRad;
      }
    } else if (a.type === ActionType.FIRE) {
      tryFire(match, unit);
    } else if (a.type === ActionType.RELOAD) {
      tryReload(match, unit);
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
    } else if (a.type === ActionType.PLACE) {
      tryPlaceFromAction(match, unit, a);
    } else if (a.type === ActionType.CAST_SKILL) {
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
function resolveUnitInventory(match, unit) {
  if (!unit) return null;
  if (unit.role === 'player') {
    return {
      inventory: match.inventory,
      activeHotbar: match.activeHotbar,
      shared: true,
    };
  }
  if (unit.inventory) {
    return {
      inventory: unit.inventory,
      activeHotbar: unit.activeHotbar != null ? unit.activeHotbar : 0,
      shared: false,
    };
  }
  return null;
}

/** PLACE Action → same tryPlace / occupancy / consume path for player + AI. */
function tryPlaceFromAction(match, unit, a) {
  const inv = resolveUnitInventory(match, unit);
  if (!inv) return false;

  if (unit.role === 'player' && match.placeGhost) {
    return tryPlace(match, unit, match.placeGhost.gx, match.placeGhost.gy);
  }

  if (typeof a.gx === 'number' && typeof a.gy === 'number') {
    return tryPlace(match, unit, a.gx | 0, a.gy | 0);
  }

  if (typeof a.worldX === 'number' && typeof a.worldY === 'number') {
    const slot = getActiveSlot(inv.inventory, inv.activeHotbar);
    const blockDef = getBlockDef(slot.itemId);
    if (!blockDef) return false;
    const snapped = snapWorldToL3Origin(a.worldX, a.worldY);
    const ox = snapped.gx - Math.floor(blockDef.footprint.w / 2);
    const oy = snapped.gy - Math.floor(blockDef.footprint.h / 2);
    return tryPlace(match, unit, ox, oy);
  }

  return false;
}


/** Shortest-path angular slew toward target at max rad/sec. */
function slewAngle(current, target, rateRadPerSec, dt) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const maxStep = Math.max(0, rateRadPerSec) * dt;
  if (Math.abs(diff) <= maxStep) return target;
  return current + Math.sign(diff) * maxStep;
}

function tryPlace(match, unit, gx, gy) {
  const inv = resolveUnitInventory(match, unit);
  if (!inv) return false;

  const slot = getActiveSlot(inv.inventory, inv.activeHotbar);
  if (!isPlaceableSlot(slot)) return false;

  const blockDef = getBlockDef(slot.itemId);
  if (!blockDef) return false;

  if (blockDef.isDefeatCondition && match.basePlaced) return false;
  // AI may not place defeat-condition base via engineer path (player-only).
  if (blockDef.isDefeatCondition && unit.role !== 'player') return false;

  const fw = blockDef.footprint.w;
  const fh = blockDef.footprint.h;
  const standing = unitStandingCells(unit.x, unit.y, unit.radius);
  if (!canPlaceFootprint(match.occupancy, gx, gy, fw, fh, standing)) {
    return false;
  }

  const placerTeam =
    unit.team != null
      ? unit.team
      : unit.role === 'enemy'
        ? TEAM.ENEMY
        : TEAM.PLAYER;
  const block = createPlacedBlock(match, slot.itemId, gx, gy, blockDef, {
    team: placerTeam,
  });
  registerBlock(match, block);
  match.stats.blocksPlaced += 1;

  const placedItemId = slot.itemId;
  // Economy: place always consumes from inventory (freeCraft is craft-only).
  // Hub/UI only displays counts — sim is the sole writer.
  consumeSlotItem(inv.inventory, inv.activeHotbar, 1);

  if (block.isDefeatCondition) {
    match.base = block;
    match.basePlaced = true;
    ensureBaseStorage(block);
    syncBaseStorageFromGenerators(block);
    match.baseChunk = buildBaseChunk(match, block);
    applyBaseChunkPipeMask(match);
    match.phase = 'setup';
    match.waveCountdown = GAME_PACK.setupPhaseDurationSec;
    match.waveActive = false;
    match.waveIndex = 0;
    match.interactPrompt = 'Base placed — setup started';
    // Turret + resource gen are inherent BaseBlock systems — no free starter blocks.
  }

  // Clear AI place intent after successful consume.
  if (unit.blackboard && unit.role !== 'player') {
    const bb = unit.blackboard;
    if (bb.placeBlockTypeId === placedItemId) {
      bb.placeBlockTypeId = null;
      bb.placeGx = -1;
      bb.placeGy = -1;
      if (bb.flags) bb.flags.PLACE_INTENT = false;
    }
  }

  return true;
}

function createPlacedBlock(match, itemId, gx, gy, blockDef, opts = {}) {
  const fw = blockDef.footprint.w;
  const fh = blockDef.footprint.h;
  const blockId = match.occupancy.nextBlockId++;
  markFootprint(match.occupancy, gx, gy, fw, fh, blockId);
  const origin = l3OriginWorld(gx, gy);
  const w = fw * L3_SIZE;
  const h = fh * L3_SIZE;
  const team =
    opts.team != null
      ? opts.team
      : blockDef.team != null
        ? blockDef.team
        : TEAM.PLAYER;

  const block = {
    id: blockId,
    itemId,
    typeId: blockDef.typeId,
    label: blockDef.label || itemId,
    gx,
    gy,
    fw,
    fh,
    x: origin.x,
    y: origin.y,
    w,
    h,
    hp: blockDef.maxHp,
    maxHp: blockDef.maxHp,
    armorType: blockDef.armorType,
    alive: true,
    isDefeatCondition: !!blockDef.isDefeatCondition,
    isTurret: !!blockDef.isTurret || (!!blockDef.weaponId && blockDef.isDefeatCondition),
    isHeal: !!blockDef.isHeal,
    isGen: !!blockDef.isGen,
    isFactory: !!blockDef.isFactory,
    isDoor: !!blockDef.isDoor,
    isWire: !!blockDef.isWire,
    blocksProjectiles: !!blockDef.blocksProjectiles || !!blockDef.isWire,
    isHarvest: !!blockDef.isHarvest,
    harvestKind: blockDef.harvestKind || null,
    dropItemId: blockDef.dropItemId || null,
    dropCount: blockDef.dropCount || 0,
    canToggle: !!blockDef.canToggle,
    isOpen: false,
    walkSolid: blockDef.walkSolid !== false,
    projectileSolid: !blockDef.allowProjectilePass,
    allowProjectilePass: !!blockDef.allowProjectilePass,
    weaponId: blockDef.weaponId || null,
    detectRadius: blockDef.detectRadius || PATH_SIZE,
    healRadius: blockDef.healRadius || 0,
    healPerSec: blockDef.healPerSec || 0,
    genRate: blockDef.genRate || null,
    genTimer: blockDef.genRate ? blockDef.genRate.intervalSec : 0,
    genStock: 0,
    genStockMax: 64,
    /** Inherent BaseBlock multi-gen (or empty). */
    generatorList: initGeneratorList(blockDef.generatorList),
    fireCooldown: 0,
    /** Turret gun layer aim (base stays fixed). */
    turretAimRad: 0,
    turretTargetAimRad: 0,
    factoryWeaponId: null,
    factoryTimer: 0,
    factoryBusy: false,
    color: blockDef.color,
    team,
    pierceCost: typeof blockDef.pierceCost === 'number' ? blockDef.pierceCost : 1,
    collisionLayer: deriveCollisionLayer({
      team,
      isHarvest: !!blockDef.isHarvest,
      collisionLayer: blockDef.collisionLayer,
    }),
    tauntTimer: 0,
    tauntedById: -1,
    blackboard: null,
  };
  attachAreaTriggerFromDef(block, blockDef);
  ensureBlackboardStub(block);
  return block;
}

function initGeneratorList(list) {
  if (!list || !list.length) return null;
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const g = list[i];
    out.push({
      itemId: g.itemId,
      amount: g.amount,
      intervalSec: g.intervalSec,
      timer: g.intervalSec,
      stock: 0,
    });
  }
  return out;
}

/** Ensure defeat-condition block has storage bags for receive UI. */
function ensureBaseStorage(block) {
  if (!block) return null;
  if (!block.storage || !Array.isArray(block.storage.bags)) {
    block.storage = { bags: [] };
  }
  return block.storage;
}

/**
 * Mirror inherent generatorList stock into base.storage.bags
 * so receive panel / takeBaseResources see the same numbers.
 */
function syncBaseStorageFromGenerators(block) {
  if (!block || !block.generatorList || !block.generatorList.length) return;
  const storage = ensureBaseStorage(block);
  for (let g = 0; g < block.generatorList.length; g++) {
    const gen = block.generatorList[g];
    if (!gen || !gen.itemId) continue;
    let bag = null;
    for (let i = 0; i < storage.bags.length; i++) {
      if (storage.bags[i].itemId === gen.itemId) {
        bag = storage.bags[i];
        break;
      }
    }
    if (!bag) {
      bag = { itemId: gen.itemId, count: 0 };
      storage.bags.push(bag);
    }
    bag.count = Math.max(0, gen.stock | 0);
  }
}

function buildBaseChunk(match, base) {
  const pad = GAME_PACK.baseZonePaddingL3 * L3_SIZE;
  const zone = {
    x: base.x - pad,
    y: base.y - pad,
    w: base.w + pad * 2,
    h: base.h + pad * 2,
    cx: base.x + base.w / 2,
    cy: base.y + base.h / 2,
  };
  zone.navPoints = buildBaseChunkNavPoints(zone);
  return zone;
}

function applyBaseChunkPipeMask(match) {
  if (!match.baseChunk) {
    clearBaseChunkL1Mask(match);
    return;
  }
  const mask = maskBaseChunkL1Pipes(match.world, match.baseChunk);
  match.pathPipeMask = mask;
  match.baseChunk.navPoints = mask.navPoints;
}

function getUnitWeaponAmmo(match, unit) {
  if (unit.role === 'player') {
    const slot = getActiveSlot(match.inventory, match.activeHotbar);
    const weapon = getWeaponFromSlot(slot);
    return { weapon, ammo: slot, fromSlot: true };
  }
  const weapon = unit.weaponId ? getWeaponDef(unit.weaponId) : null;
  return { weapon, ammo: unit, fromSlot: false };
}

function tryReload(match, unit) {
  const { weapon, ammo } = getUnitWeaponAmmo(match, unit);
  if (!weapon || !ammo) return;
  const opts = unit.role === 'player' ? playerReloadOpts(match, weapon) : null;
  beginReload(ammo, weapon, opts);
}

function tryFire(match, unit) {
  const { weapon, ammo } = getUnitWeaponAmmo(match, unit);
  if (!weapon) return;
  if (unit.fireCooldown > 0) return;
  if (!canFireAmmo(ammo, weapon)) {
    if (ammo && ammo.ammoInMag <= 0 && ammo.mags > 0) {
      const opts = unit.role === 'player' ? playerReloadOpts(match, weapon) : null;
      beginReload(ammo, weapon, opts);
    }
    return;
  }

  if (weapon.projectileMode === 'CONTINUOUS_BEAM') {
    if (!weapon.infiniteAmmo) {
      const consumed = consumeAmmoForShot(ammo, weapon);
      if (!consumed) return;
    }
    // No stacking: fireCooldown covers beamDuration then cooldownSec.
    if (ownerHasActiveBeam(match, unit.id, -1)) return;
    spawnBeam(match, unit, weapon, unit.aimRad);
    const duration = weapon.beamDurationSec || 0;
    unit.fireCooldown = duration + (weapon.cooldownSec || 0);
    match.stats.shotsFired += 1;
    return;
  }

  const pellets = weapon.pelletCount || 1;
  const consumed = consumeAmmoForShot(ammo, weapon);
  if (!consumed && !weapon.infiniteAmmo) return;

  const baseAim = unit.aimRad;
  const spread = ((weapon.spreadDeg || 0) * Math.PI) / 180;
  for (let p = 0; p < pellets; p++) {
    const offset =
      pellets === 1
        ? (Math.random() - 0.5) * spread * 0.35
        : (p / (pellets - 1) - 0.5) * spread;
    spawnProjectile(match, unit, weapon, baseAim + offset);
  }
  unit.fireCooldown = weapon.cooldownSec;
  match.stats.shotsFired += 1;
}

function spawnProjectile(match, owner, weapon, aimRad) {
  const proj = acquireProjectile(match.pools);
  if (!proj) return null;

  const cos = Math.cos(aimRad);
  const sin = Math.sin(aimRad);
  const muzzle = (owner.radius || 20) + 2;
  const maxRange = (weapon.maxDistancePath || 1) * PATH_SIZE;
  const speed = weapon.bulletSpeedPxSec || 400;
  const ox = owner.x != null ? owner.x : owner.cx;
  const oy = owner.y != null ? owner.y : owner.cy;

  proj.active = true;
  proj.x = ox + cos * muzzle;
  proj.y = oy + sin * muzzle;
  proj.prevX = proj.x;
  proj.prevY = proj.y;
  proj.speed = speed;
  proj.vx = cos * speed;
  proj.vy = sin * speed;
  proj.damage = weapon.baseDamage;
  proj.damageType = weapon.damageType;
  proj.ownerId = owner.id != null ? owner.id : -1;
  proj.team = owner.team != null ? owner.team : TEAM.PLAYER;
  proj.traveled = 0;
  proj.maxRange = maxRange;
  proj.radius = weapon.projectileRadius || 4;
  proj.pierceLeft = getPierceUnitBudget(weapon);
  proj.blockPierceLeft = proj.pierceLeft; // shared budget (legacy field kept in sync)
  proj.pierceConfig = weapon.pierceConfig || null;
  proj.weaponId = weapon.id;
  proj.targetFaction = weapon.targetFaction || 'ENEMY';
  proj.hitMask = defaultProjectileHitMask(proj.team, proj.targetFaction);
  proj.hitBlockIds = [];
  proj.fromTurret = !!owner.fromTurret;
  proj.sourceBlockId = owner.sourceBlockId != null ? owner.sourceBlockId : -1;
  proj.noLootOnPierce = true;
  proj.isBeam = false;
  proj.explosionRadius = weapon.explosionRadius || 0;
  proj.explosionDamage =
    weapon.explosionDamage != null ? weapon.explosionDamage : weapon.baseDamage;
  return proj;
}

function ownerHasActiveBeam(match, ownerId, sourceBlockId) {
  if (!match.beams || !match.beams.length) return false;
  for (let i = 0; i < match.beams.length; i++) {
    const b = match.beams[i];
    if (!b.active) continue;
    if (sourceBlockId >= 0 && b.sourceBlockId === sourceBlockId) return true;
    if (sourceBlockId < 0 && b.ownerId === ownerId && !(b.sourceBlockId >= 0)) {
      return true;
    }
  }
  return false;
}

function spawnBeam(match, owner, weapon, aimRad) {
  if (!match.beams) match.beams = [];
  const cos = Math.cos(aimRad);
  const sin = Math.sin(aimRad);
  const ox = owner.x != null ? owner.x : owner.cx;
  const oy = owner.y != null ? owner.y : owner.cy;
  const muzzle = (owner.radius || 20) + 2;
  const maxRange = (weapon.maxDistancePath || 1) * PATH_SIZE;
  const team = owner.team != null ? owner.team : TEAM.PLAYER;
  const targetFaction = weapon.targetFaction || 'ENEMY';
  const x0 = ox + cos * muzzle;
  const y0 = oy + sin * muzzle;
  match.beams.push({
    active: true,
    x0,
    y0,
    x1: x0 + cos * maxRange,
    y1: y0 + sin * maxRange,
    aimRad,
    maxRange,
    damage: weapon.baseDamage,
    damageType: weapon.damageType,
    team,
    targetFaction,
    hitMask: defaultProjectileHitMask(team, targetFaction),
    ownerId: owner.id != null ? owner.id : -1,
    sourceBlockId: owner.sourceBlockId != null ? owner.sourceBlockId : -1,
    fromTurret: !!owner.fromTurret,
    durationLeft: weapon.beamDurationSec || 1,
    tickAcc: 0,
    tickInterval: 0.2,
    color: weapon.color || '#ff6b9a',
    weaponId: weapon.id,
    pierceLeft: getPierceUnitBudget(weapon),
    pierceBudgetMax: getPierceUnitBudget(weapon),
  });
}

function tryTurretFire(match, blockId, aimRad) {
  const block = getBlock(match, blockId);
  if (!block || !block.alive || !block.weaponId) return;
  if (block.fireCooldown > 0) return;
  const weapon = getWeaponDef(block.weaponId);
  if (!weapon) return;
  const owner = {
    id: -block.id,
    x: block.x + block.w / 2,
    y: block.y + block.h / 2,
    radius: Math.min(block.w, block.h) * 0.35,
    team: TEAM.PLAYER,
    fromTurret: true,
    sourceBlockId: block.id,
  };
  const aim =
    typeof aimRad === 'number'
      ? aimRad
      : typeof block.turretAimRad === 'number'
        ? block.turretAimRad
        : block.turretTargetAimRad || 0;

  if (weapon.projectileMode === 'CONTINUOUS_BEAM') {
    if (ownerHasActiveBeam(match, owner.id, block.id)) return;
    spawnBeam(match, owner, weapon, aim);
    const duration = weapon.beamDurationSec || 0;
    block.fireCooldown = duration + (weapon.cooldownSec || 0);
  } else {
    spawnProjectile(match, owner, weapon, aim);
    block.fireCooldown = weapon.cooldownSec;
  }
  match.stats.shotsFired += 1;
}

function decideTurretActions(match) {
  const actions = [];
  const units = match.pools.units;
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (!b.alive) continue;
    const isArmed = b.isTurret || (b.isDefeatCondition && b.weaponId);
    if (!isArmed || !b.weaponId) continue;
    if (b.fireCooldown > 0) continue;

    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    let best = null;
    let bestD = b.detectRadius || PATH_SIZE;
    for (let u = 0; u < units.length; u++) {
      const e = units[u];
      if (!e.active || e.team === TEAM.PLAYER) continue;
      const d = Math.hypot(e.x - cx, e.y - cy);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    if (!best) continue;
    const aim = Math.atan2(best.y - cy, best.x - cx);
    b.turretTargetAimRad = aim;
    actions.push({
      type: ActionType.FIRE,
      turretBlockId: b.id,
      aimRad: aim,
    });
  }
  return actions;
}

/**
 * Distance from point to block AABB edge (0 if inside).
 * Large footprints (Gen 2×2 / Base 3×3) stay interactable when touching sides.
 */
function distToBlockAABB(px, py, b) {
  const nx = Math.max(b.x, Math.min(px, b.x + b.w));
  const ny = Math.max(b.y, Math.min(py, b.y + b.h));
  return Math.hypot(px - nx, py - ny);
}

/**
 * Nearest interactable block within radius (door / gen / factory / base).
 * Exported for UI peeks; mutation stays in tryInteract / take* helpers.
 */
export function findInteractTarget(match, unit, radius = GAME_PACK.interactRadius) {
  if (!match || !unit) return null;
  let best = null;
  let bestD = radius;
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (!b.alive) continue;
    if (!(b.canToggle || b.isGen || b.isFactory || b.isDefeatCondition)) continue;
    const d = distToBlockAABB(unit.x, unit.y, b);
    if (d > bestD) continue;
    best = b;
    bestD = d;
  }
  return best;
}

function tryInteract(match, unit) {
  const best = findInteractTarget(match, unit);
  if (!best) return;

  if (best.canToggle && best.isDoor) {
    // Enemies cannot open — player only reaches here.
    best.isOpen = !best.isOpen;
    match.interactPrompt = best.isOpen ? 'Door open' : 'Door closed';
    return;
  }

  // Gen / Base → request UI panel (app opens receive panel; no window.prompt).
  if (best.isGen && best.genRate) {
    match.pendingUi = {
      type: 'receive-gen',
      blockId: best.id,
    };
    match.interactPrompt = `E: Gen ${best.genStock || 0}`;
    return;
  }

  if (best.isDefeatCondition) {
    match.pendingUi = {
      type: 'receive-base',
      blockId: best.id,
    };
    match.interactPrompt = 'E: Base';
    return;
  }

  if (best.isFactory) {
    interactFactory(match, best);
  }
}

/** Snapshot for Gen receive panel. */
export function getGenReceiveState(match, blockId) {
  const block = findBlockById(match, blockId);
  if (!block || !block.alive || !block.isGen) return null;
  return {
    blockId: block.id,
    label: block.label || block.itemId || 'Gen',
    itemId: block.genRate ? block.genRate.itemId : null,
    stock: block.genStock || 0,
    stockMax: block.genStockMax || 64,
    timerSec: Math.max(0, block.genTimer || 0),
    intervalSec: block.genRate ? block.genRate.intervalSec : 0,
    amountPerTick: block.genRate ? block.genRate.amount : 0,
    hp: block.hp,
    maxHp: block.maxHp,
  };
}

/**
 * Distance from AABB center to surface along unit direction (cos, sin).
 * Axis-aligned box half-extents hw/hh — needed so diagonal eject clears Gen/Base.
 */
function aabbRayExitDist(hw, hh, cos, sin) {
  let t = Infinity;
  if (Math.abs(cos) > 1e-8) t = Math.min(t, hw / Math.abs(cos));
  if (Math.abs(sin) > 1e-8) t = Math.min(t, hh / Math.abs(sin));
  return Number.isFinite(t) ? t : Math.max(hw, hh);
}

/**
 * Eject stock as a world drop toward the player (pickup in-scene).
 * Does not write inventory directly — player walks to collect.
 * @param {{ hw?: number, hh?: number }} [boxHalf] half-extents of source block from center.
 *   When set, spawn at AABB surface + dropEjectMargin along player dir.
 */
function ejectDropTowardPlayer(match, fromX, fromY, itemId, count, boxHalf = null) {
  if (!match || !itemId || !(count > 0)) return false;
  const player = getPlayerUnit(match);
  const pack = GAME_PACK;
  const speed = pack.dropThrowSpeed || 220;
  const margin =
    pack.dropEjectMargin != null ? pack.dropEjectMargin : Math.round(L3_SIZE * 0.4);
  let cos = 1;
  let sin = 0;
  if (player) {
    const dx = player.x - fromX;
    const dy = player.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    cos = dx / len;
    sin = dy / len;
  }
  let off;
  if (boxHalf && boxHalf.hw > 0 && boxHalf.hh > 0) {
    off = aabbRayExitDist(boxHalf.hw, boxHalf.hh, cos, sin) + margin;
  } else {
    off = (player ? player.radius : 0) + (pack.dropThrowOffset || 28);
  }
  const x = fromX + cos * off;
  const y = fromY + sin * off;
  spawnDrop(match, x, y, itemId, count, cos * speed, sin * speed);
  return true;
}

/**
 * Take Gen stock → world drop toward player (not inventory).
 * @returns {{ taken: number, itemId: string|null, reason?: string, mode?: string }}
 */
export function takeGenResources(match, blockId, amount = Infinity) {
  const block = findBlockById(match, blockId);
  if (!block || !block.alive || !block.isGen || !block.genRate) {
    return { taken: 0, itemId: null, reason: 'No gen' };
  }
  const itemId = block.genRate.itemId;
  const want = Math.min(
    block.genStock || 0,
    Number.isFinite(amount) ? amount : block.genStock || 0
  );
  if (want <= 0) return { taken: 0, itemId, reason: 'Empty' };

  const cx = block.x + block.w / 2;
  const cy = block.y + block.h / 2;
  const boxHalf = { hw: block.w * 0.5, hh: block.h * 0.5 };
  if (!ejectDropTowardPlayer(match, cx, cy, itemId, want, boxHalf)) {
    return { taken: 0, itemId, reason: 'Drop failed' };
  }
  block.genStock = (block.genStock || 0) - want;
  match.interactPrompt = `Ejected ${want} ${itemId} — walk to pick up`;
  return { taken: want, itemId, mode: 'world_drop' };
}

/**
 * Base receive panel state.
 */
export function getBaseReceiveState(match) {
  const base = match && match.base;
  if (!base || !base.alive) return null;
  const storage = base.storage || null;
  return {
    blockId: base.id,
    label: 'Base',
    hp: base.hp,
    maxHp: base.maxHp,
    hasStorageApi: !!storage,
    /** @type {Array<{ itemId: string, count: number }>} */
    bags: storage && Array.isArray(storage.bags) ? storage.bags : [],
    note: storage
      ? null
      : 'Base storage missing — place Base again or report bug',
  };
}

/**
 * Take base storage bag → world drop toward player (not inventory).
 */
export function takeBaseResources(match, itemId, amount = Infinity) {
  const base = match && match.base;
  if (!base || !base.alive) {
    return { taken: 0, itemId, reason: 'No base' };
  }
  const storage = base.storage;
  if (!storage || !Array.isArray(storage.bags)) {
    return {
      taken: 0,
      itemId,
      reason: 'Base storage API not ready',
    };
  }
  let bag = null;
  for (let i = 0; i < storage.bags.length; i++) {
    if (storage.bags[i].itemId === itemId) {
      bag = storage.bags[i];
      break;
    }
  }
  if (!bag || bag.count <= 0) {
    return { taken: 0, itemId, reason: 'Empty' };
  }
  const want = Math.min(
    bag.count,
    Number.isFinite(amount) ? amount : bag.count
  );

  const cx = base.x + base.w / 2;
  const cy = base.y + base.h / 2;
  const boxHalf = { hw: base.w * 0.5, hh: base.h * 0.5 };
  if (!ejectDropTowardPlayer(match, cx, cy, itemId, want, boxHalf)) {
    return { taken: 0, itemId, reason: 'Drop failed' };
  }
  bag.count -= want;
  if (base.generatorList) {
    for (let g = 0; g < base.generatorList.length; g++) {
      const gen = base.generatorList[g];
      if (gen && gen.itemId === itemId) gen.stock = bag.count;
    }
  }
  match.interactPrompt = `Ejected ${want} ${itemId} — walk to pick up`;
  return { taken: want, itemId, mode: 'world_drop' };
}

function findBlockById(match, blockId) {
  if (!match || blockId == null) return null;
  for (let i = 0; i < match.blocks.length; i++) {
    if (match.blocks[i].id === blockId) return match.blocks[i];
  }
  return null;
}

function interactFactory(match, factory) {
  // Soft stub UX: if holding upgradable weapon, deposit & start timer.
  const slot = getActiveSlot(match.inventory, match.activeHotbar);
  if (factory.factoryBusy) {
    match.interactPrompt = `Factory: ${Math.ceil(factory.factoryTimer)}s left`;
    return;
  }
  if (factory.factoryWeaponId) {
    // Collect finished weapon
    const leftover = addItemToInventory(match.inventory, factory.factoryWeaponId, 1);
    if (leftover === 0) {
      factory.factoryWeaponId = null;
      match.interactPrompt = 'Upgrade collected';
    } else {
      match.interactPrompt = 'Inventory full';
    }
    return;
  }
  if (!isWeaponSlot(slot)) {
    match.interactPrompt = 'Factory: hold weapon, press E';
    return;
  }
  const recipe = getUpgradeRecipe(slot.weaponId || slot.itemId);
  if (!recipe) {
    match.interactPrompt = 'No upgrade recipe';
    return;
  }
  factory.factoryBusy = true;
  factory.factoryTimer = recipe.upgradeTimeSec;
  factory.factoryWeaponId = recipe.resultWeaponId;
  factory._pendingResult = recipe.resultWeaponId;
  consumeSlotItem(match.inventory, match.activeHotbar, 1);
  match.interactPrompt = `Upgrading → ${recipe.resultWeaponId}`;
}

function updateFactory(match, dt) {
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (!b.alive || !b.isFactory || !b.factoryBusy) continue;
    b.factoryTimer -= dt;
    if (b.factoryTimer <= 0) {
      b.factoryTimer = 0;
      b.factoryBusy = false;
      b.factoryWeaponId = b._pendingResult || b.factoryWeaponId;
      b._pendingResult = null;
    }
  }
}

function tryHarvest(match, unit, _wx, _wy) {
  const inv = resolveUnitInventory(match, unit);
  if (!inv) return;
  const slot = getActiveSlot(inv.inventory, inv.activeHotbar);
  if (!isToolSlot(slot)) return;
  const def = getItemDef(slot.itemId);
  if (!def) return;

  // Shared pipeline: open 0.1s → close → tool cooldown 0.2s (spam fails).
  tryBeginMeleeSwing(unit, {
    source: 'TOOL',
    toolId: slot.itemId,
    activeDurationSec: def.activeDurationSec != null ? def.activeDurationSec : 0.1,
    cooldownSec: def.cooldownSec != null ? def.cooldownSec : 0.2,
    damage: def.harvestDamage || def.structureDamage || 20,
    hitUnits: false,
    hitBlocks: true,
    vfxSize: Math.round(L3_SIZE * 0.9),
    color: def.color || '#c0b080',
  });
}

function tickAllMeleeSwings(match, dt) {
  const units = match.pools && match.pools.units;
  if (!units) return;
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    if (!unit.active) continue;
    if (!tickMeleeSwing(unit, dt)) continue;
    applyMeleeSwingHits(match, unit);
  }
}

function applyMeleeSwingHits(match, unit) {
  const sw = unit.meleeSwing;
  if (!sw) return;
  const vol = getMeleeVolume(unit, { toolId: sw.toolId });
  spawnMeleeVfx(match, unit, sw);

  const sourceTeam =
    unit.team != null
      ? unit.team
      : unit.role === 'enemy'
        ? TEAM.ENEMY
        : TEAM.PLAYER;

  if (sw.hitBlocks) {
    const toolDef = sw.toolId ? getItemDef(sw.toolId) : null;
    const targets = blocksOverlappingMeleeVolume(match, vol);
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (toolDef) {
        const resolved = resolveMeleeVsBlock(sourceTeam, toolDef, target);
        if (resolved.kind === 'repair') {
          const healed = applyBlockRepair(target, resolved.amount);
          if (healed > 0 && unit.role === 'player') {
            match.interactPrompt = `Repaired ${target.label || target.itemId} +${Math.round(healed)}`;
          }
          if (
            healed > 0 &&
            unit.blackboard &&
            unit.blackboard.repairTargetId === target.id &&
            target.hp >= target.maxHp
          ) {
            unit.blackboard.repairTargetId = -1;
            if (unit.blackboard.flags) unit.blackboard.flags.REPAIR_INTENT = false;
          }
          continue;
        }
        if (resolved.kind !== 'damage') {
          if (resolved.reason === 'wrong_tool_tier' && unit.role === 'player') {
            match.interactPrompt = 'Wrong tool tier';
          }
          continue;
        }
        applyDamageToBlock(match, target, resolved.amount, 'DEFAULT', {
          sourceTeam,
          damageKind: 'TOOL',
        });
      } else if (sw.source === 'FIST') {
        // Fist damages structures / wire (WIRE_MELEE_MULT via DEFAULT type).
        applyDamageToBlock(match, target, sw.damage, 'DEFAULT', {
          sourceTeam,
          damageKind: 'TOOL',
        });
      }
    }
  }

  if (sw.hitUnits || sw.source === 'FIST') {
    const unitHits = unitsOverlappingMeleeVolume(match, unit, vol);
    for (let i = 0; i < unitHits.length; i++) {
      const other = unitHits[i];
      if (sw.toolId) {
        const toolDef = getItemDef(sw.toolId);
        // Tools do not hit living units (wrench/axe matrix).
        if (toolDef) continue;
      }
      const resolved = resolveFistVsUnit(sw.damage, unit.meleeMultiplier);
      if (resolved.kind !== 'damage') continue;
      applyDamageToUnit(match, other, resolved.amount, {
        sourceTeam,
        sourceX: unit.x,
        sourceY: unit.y,
      });
    }
  }
}

function unitsOverlappingMeleeVolume(match, attacker, vol) {
  const out = [];
  const units = match.pools.units;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active || u.id === attacker.id) continue;
    if (u.team === attacker.team) continue;
    if (circleOverlapsMeleeVolume(u.x, u.y, u.radius || 12, vol)) out.push(u);
  }
  return out;
}

function circleOverlapsMeleeVolume(cx, cy, r, vol) {
  const cos = Math.cos(vol.ang);
  const sin = Math.sin(vol.ang);
  const dx = cx - vol.ox;
  const dy = cy - vol.oy;
  const lx = dx * cos + dy * sin;
  const ly = -dx * sin + dy * cos;
  const x0 = vol.start;
  const x1 = vol.start + vol.reach;
  const y0 = -vol.halfW;
  const y1 = vol.halfW;
  const qx = Math.max(x0, Math.min(x1, lx));
  const qy = Math.max(y0, Math.min(y1, ly));
  const ex = lx - qx;
  const ey = ly - qy;
  return ex * ex + ey * ey <= r * r;
}

function spawnMeleeVfx(match, unit, sw) {
  if (!match.meleeVfx) match.meleeVfx = [];
  const ang =
    typeof unit.aimRad === 'number' ? unit.aimRad : unit.facingRad || 0;
  const reach = (GAME_PACK.meleeReach || L3_SIZE) * 0.55;
  match.meleeVfx.push({
    x: unit.x + Math.cos(ang) * (unit.radius + reach * 0.5),
    y: unit.y + Math.sin(ang) * (unit.radius + reach * 0.5),
    ang,
    life: 0.14,
    maxLife: 0.14,
    size: Math.min(L3_SIZE, sw.vfxSize || L3_SIZE * 0.85),
    color: sw.color || '#e8dcc0',
  });
}

function tickMeleeVfx(match, dt) {
  const list = match.meleeVfx;
  if (!list || !list.length) return;
  for (let i = list.length - 1; i >= 0; i--) {
    list[i].life -= dt;
    if (list[i].life <= 0) list.splice(i, 1);
  }
}

function tickExplosionVfx(match, dt) {
  const list = match.explosionVfx;
  if (!list || !list.length) return;
  for (let i = list.length - 1; i >= 0; i--) {
    list[i].life -= dt;
    if (list[i].life <= 0) list.splice(i, 1);
  }
}

/** Alive harvest resources + placeables overlapping the oriented melee box. */
function blocksOverlappingMeleeVolume(match, vol) {
  const out = [];
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (!b.alive) continue;
    if (!b.isHarvest && b.isDefeatCondition) continue;
    if (!aabbOverlapsMeleeVolume(b.x, b.y, b.w, b.h, vol)) continue;
    out.push(b);
  }
  return out;
}

/**
 * Oriented box vs AABB: any block corner in OBB, or any OBB corner in AABB.
 * Vol local X = ahead (start..start+reach), local Y = lateral ±halfW.
 */
function aabbOverlapsMeleeVolume(bx, by, bw, bh, vol) {
  const cos = Math.cos(vol.ang);
  const sin = Math.sin(vol.ang);
  const ox = vol.ox;
  const oy = vol.oy;
  const x0 = vol.start;
  const x1 = vol.start + vol.reach;
  const y0 = -vol.halfW;
  const y1 = vol.halfW;

  function localInObb(wx, wy) {
    const dx = wx - ox;
    const dy = wy - oy;
    const lx = dx * cos + dy * sin;
    const ly = -dx * sin + dy * cos;
    return lx >= x0 && lx <= x1 && ly >= y0 && ly <= y1;
  }

  if (localInObb(bx, by)) return true;
  if (localInObb(bx + bw, by)) return true;
  if (localInObb(bx, by + bh)) return true;
  if (localInObb(bx + bw, by + bh)) return true;
  if (localInObb(bx + bw * 0.5, by + bh * 0.5)) return true;

  function worldFromLocal(lx, ly) {
    return {
      x: ox + lx * cos - ly * sin,
      y: oy + lx * sin + ly * cos,
    };
  }
  function inAabb(wx, wy) {
    return wx >= bx && wx <= bx + bw && wy >= by && wy <= by + bh;
  }
  const corners = [
    worldFromLocal(x0, y0),
    worldFromLocal(x1, y0),
    worldFromLocal(x0, y1),
    worldFromLocal(x1, y1),
    worldFromLocal((x0 + x1) * 0.5, (y0 + y1) * 0.5),
  ];
  for (let i = 0; i < corners.length; i++) {
    if (inAabb(corners[i].x, corners[i].y)) return true;
  }
  return false;
}

function integrateUnitMotion(match, dt) {
  const units = match.pools.units;
  const { world, occupancy } = match;
  const getter = (id) => getBlock(match, id);
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active) continue;
    u.x += u.vx * dt;
    u.y += u.vy * dt;
    resolveUnitVsOccupancy(u, occupancy, getter);
    clampUnitInWorld(u, world);
  }
}

function separateUnits(match) {
  const units = match.pools.units;
  const active = [];
  for (let i = 0; i < units.length; i++) {
    if (units[i].active) active.push(units[i]);
  }
  const soft = GAME_PACK.unitPushSeparation;
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const minDist = a.radius + b.radius;
        let dist = Math.hypot(dx, dy);
        if (dist < 1e-6) {
          const nudge = minDist * 0.5;
          const side = a.id < b.id ? -1 : 1;
          a.x -= nudge * 0.5 * side;
          b.x += nudge * 0.5 * side;
          dx = b.x - a.x;
          dy = b.y - a.y;
          dist = Math.hypot(dx, dy) || 1e-6;
        }
        if (dist >= minDist) continue;
        const overlap = (minDist - dist) * soft;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;
      }
    }
  }
  const getter = (id) => getBlock(match, id);
  for (let i = 0; i < active.length; i++) {
    resolveUnitVsOccupancy(active[i], match.occupancy, getter);
    clampUnitInWorld(active[i], match.world);
  }
}

function clampUnitInWorld(u, world) {
  u.x = clamp(u.x, u.radius, world.worldW - u.radius);
  u.y = clamp(u.y, u.radius, world.worldH - u.radius);
}

function updateCooldowns(match, dt) {
  const units = match.pools.units;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active) continue;
    if (u.fireCooldown > 0) u.fireCooldown = Math.max(0, u.fireCooldown - dt);
  }
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (!b.alive) continue;
    if (b.fireCooldown > 0) b.fireCooldown = Math.max(0, b.fireCooldown - dt);
  }
}

function updateWeaponReloads(match, dt) {
  const inv = match.inventory;
  for (let i = 0; i < inv.length; i++) {
    const slot = inv[i];
    if (!isWeaponSlot(slot)) continue;
    const def = getWeaponDef(slot.weaponId || slot.itemId);
    tickReload(slot, def, dt, playerReloadOpts(match, def));
  }
  const units = match.pools.units;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active || u.role !== 'enemy' || !u.weaponId) continue;
    tickReload(u, getWeaponDef(u.weaponId), dt, null);
  }
}

/** Player hotbar weapons: sync reload with inventory ammoTypeId stock. */
function playerReloadOpts(match, weaponDef) {
  if (!match || !match.inventory || !weaponDef || !weaponDef.ammoTypeId) {
    return null;
  }
  const ammoTypeId = weaponDef.ammoTypeId;
  return {
    reserveCount: countItem(match.inventory, ammoTypeId),
    spendReserve: () => {
      if (countItem(match.inventory, ammoTypeId) <= 0) return false;
      deductCost(match.inventory, { [ammoTypeId]: 1 });
      return true;
    },
  };
}

function unitMatchesFaction(unit, projectileTeam, targetFaction) {
  if (!unit || !unit.active) return false;
  if (targetFaction === 'FRIENDLY') return unit.team === projectileTeam;
  return unit.team !== projectileTeam;
}

function entityCollisionLayer(ent) {
  if (!ent) return 0;
  if (typeof ent.collisionLayer === 'number') return ent.collisionLayer;
  return deriveCollisionLayer(ent);
}

/** Prefer hitMask; fall back to team/faction while migrating. */
function canHitUnit(pOrBeam, unit) {
  if (!unit || !unit.active) return false;
  if (pOrBeam.hitMask != null) {
    return layerHitsMask(entityCollisionLayer(unit), pOrBeam.hitMask);
  }
  return unitMatchesFaction(unit, pOrBeam.team, pOrBeam.targetFaction || 'ENEMY');
}

function canHitBlock(pOrBeam, block) {
  if (!block || !block.alive) return false;
  if (!blockProjectileSolid(block)) return false;
  // Heal / friendly beams only target units — do not stop on placeables.
  if ((pOrBeam.targetFaction || 'ENEMY') === 'FRIENDLY') return false;
  // Wire always collides with projectiles (incl. own-team) — force fist/melee.
  if (block.isWire || block.blocksProjectiles) {
    if (pOrBeam.hitMask != null) {
      return layerHitsMask(entityCollisionLayer(block), pOrBeam.hitMask);
    }
    return true;
  }
  if (pOrBeam.hitMask != null) {
    return layerHitsMask(entityCollisionLayer(block), pOrBeam.hitMask);
  }
  // Fallback: own-team placeables are non-collision for that team's shots (harvest still hits).
  if (block.team === pOrBeam.team && !block.isHarvest) return false;
  return true;
}

function updateProjectiles(match, dt) {
  const projs = match.pools.projectiles;
  const units = match.pools.units;

  for (let i = 0; i < projs.length; i++) {
    const p = projs[i];
    if (!p.active) continue;

    p.prevX = p.x;
    p.prevY = p.y;
    const step = p.speed * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.traveled += step;

    if (
      p.traveled >= p.maxRange ||
      p.x < 0 ||
      p.y < 0 ||
      p.x > match.world.worldW ||
      p.y > match.world.worldH
    ) {
      if (p.explosionRadius > 0) {
        tryProjectileExplosion(match, p, {
          applyDamageToUnit,
          applyDamageToBlock,
        });
      }
      p.active = false;
      continue;
    }

    const hits = collectProjectileSegmentHits(match, p, units);
    let pierce = p.pierceLeft | 0;
    let stopped = false;
    for (let h = 0; h < hits.length; h++) {
      const hit = hits[h];
      if (hit.kind === 'block') {
        const weapon = p.weaponId ? getWeaponDef(p.weaponId) : null;
        const cost = getBlockPierceCost(weapon, hit.block);
        applyDamageToBlock(match, hit.block, p.damage, p.damageType, {
          sourceTeam: p.team,
          damageKind: 'PROJECTILE',
          fromTurret: !!p.fromTurret,
          fromPierce: true,
          skipLoot: !!p.noLootOnPierce,
        });
        if (!p.hitBlockIds) p.hitBlockIds = [];
        p.hitBlockIds.push(hit.block.id);
        if (cost > pierce) {
          stopped = true;
          break;
        }
        pierce -= cost;
        p.pierceLeft = pierce;
        p.blockPierceLeft = pierce;
        continue;
      }
      if (hit.kind === 'shield') {
        const unit = hit.unit;
        const abs = absorbDamageWithShield(unit, p.damage);
        if (abs.leftover > 0) {
          const mult = getDamageMult(p.damageType, unit.armorType || 'DEFAULT');
          const dmg = p.damage < 0 ? abs.leftover : abs.leftover * mult;
          applyDamageToUnit(match, unit, dmg, {
            sourceTeam: p.team,
            fromTurret: !!p.fromTurret,
            sourceBlockId: p.sourceBlockId,
            sourceX: p.prevX,
            sourceY: p.prevY,
            skipShield: true,
          });
          if (dmg > 0) match.stats.damageDealt += dmg;
        }
        const cost = abs.pierceCost || (unit.shield && unit.shield.pierceCost) || 1;
        if (cost > pierce || abs.broke || abs.leftover <= 0) {
          stopped = true;
          break;
        }
        pierce -= cost;
        p.pierceLeft = pierce;
        p.blockPierceLeft = pierce;
        continue;
      }
      const unit = hit.unit;
      const cost = getEntityPierceCost(unit);
      const mult = getDamageMult(p.damageType, unit.armorType || 'DEFAULT');
      const dmg = p.damage < 0 ? p.damage : p.damage * mult;
      applyDamageToUnit(match, unit, dmg, {
        sourceTeam: p.team,
        fromTurret: !!p.fromTurret,
        sourceBlockId: p.sourceBlockId,
        sourceX: p.prevX,
        sourceY: p.prevY,
      });
      if (dmg > 0) match.stats.damageDealt += dmg;
      if (cost > pierce) {
        stopped = true;
        break;
      }
      pierce -= cost;
      p.pierceLeft = pierce;
      p.blockPierceLeft = pierce;
    }
    if (stopped) {
      if (p.explosionRadius > 0) {
        tryProjectileExplosion(match, p, {
          applyDamageToUnit,
          applyDamageToBlock,
        });
      }
      p.active = false;
    }
  }
}

function collectProjectileSegmentHits(match, p, units) {
  const hits = [];
  const hitBlock = projectileHitsBlock(match, p);
  if (hitBlock) {
    const t = segmentClosestT(
      p.prevX,
      p.prevY,
      p.x,
      p.y,
      hitBlock.x + hitBlock.w * 0.5,
      hitBlock.y + hitBlock.h * 0.5
    );
    hits.push({ kind: 'block', t, block: hitBlock });
  }
  for (let u = 0; u < units.length; u++) {
    const unit = units[u];
    if (!canHitUnit(p, unit)) continue;
    const shieldHit = segmentHitsShield(
      unit,
      p.prevX,
      p.prevY,
      p.x,
      p.y,
      p.radius || 0
    );
    if (shieldHit.hit) {
      hits.push({ kind: 'shield', t: shieldHit.t, unit });
      continue;
    }
    if (
      segmentHitsCircle(
        p.prevX,
        p.prevY,
        p.x,
        p.y,
        unit.x,
        unit.y,
        unit.radius + p.radius
      )
    ) {
      const t = segmentClosestT(p.prevX, p.prevY, p.x, p.y, unit.x, unit.y);
      hits.push({ kind: 'unit', t, unit });
    }
  }
  hits.sort((a, b) => a.t - b.t);
  return hits;
}

function segmentClosestT(x0, y0, x1, y1, px, py) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  if (len2 <= 0) return 0;
  let t = ((px - x0) * dx + (py - y0) * dy) / len2;
  if (t < 0) t = 0;
  if (t > 1) t = 1;
  return t;
}

function syncBeamToOwner(match, b) {
  if (b.sourceBlockId >= 0) {
    const block = getBlock(match, b.sourceBlockId);
    if (!block || !block.alive) {
      b.active = false;
      return false;
    }
    const aim =
      typeof block.turretAimRad === 'number'
        ? block.turretAimRad
        : block.turretTargetAimRad || 0;
    const ox = block.x + block.w / 2;
    const oy = block.y + block.h / 2;
    const muzzle = Math.min(block.w, block.h) * 0.35 + 2;
    b.aimRad = aim;
    b.x0 = ox + Math.cos(aim) * muzzle;
    b.y0 = oy + Math.sin(aim) * muzzle;
    return true;
  }
  if (b.ownerId >= 0 && match.pools && match.pools.units[b.ownerId]) {
    const owner = match.pools.units[b.ownerId];
    if (!owner || !owner.active) {
      b.active = false;
      return false;
    }
    const aim = owner.aimRad || 0;
    const muzzle = (owner.radius || 20) + 2;
    b.aimRad = aim;
    b.x0 = owner.x + Math.cos(aim) * muzzle;
    b.y0 = owner.y + Math.sin(aim) * muzzle;
    return true;
  }
  return true;
}

function updateBeams(match, dt) {
  if (!match.beams || !match.beams.length) return;
  const units = match.pools.units;
  const next = [];
  for (let i = 0; i < match.beams.length; i++) {
    const b = match.beams[i];
    if (!b.active) continue;
    if (!syncBeamToOwner(match, b)) continue;

    b.durationLeft -= dt;
    if (b.durationLeft <= 0) continue;

    const tip = castBeamRay(match, b, units, false);
    b.x1 = tip.x1;
    b.y1 = tip.y1;

    b.tickAcc += dt;
    while (b.tickAcc >= b.tickInterval) {
      b.tickAcc -= b.tickInterval;
      syncBeamToOwner(match, b);
      b.pierceLeft = b.pierceBudgetMax | 0;
      const tickTip = castBeamRay(match, b, units, true);
      b.x1 = tickTip.x1;
      b.y1 = tickTip.y1;
    }
    next.push(b);
  }
  match.beams = next;
}

/**
 * Cast beam ray with shared pierce budget. Updates visual end tip.
 * @param {boolean} applyDamage — when true, apply tick damage along segment.
 */
function castBeamRay(match, b, units, applyDamage) {
  const cos = Math.cos(b.aimRad);
  const sin = Math.sin(b.aimRad);
  const xMax = b.x0 + cos * b.maxRange;
  const yMax = b.y0 + sin * b.maxRange;
  const hits = [];

  for (let u = 0; u < units.length; u++) {
    const unit = units[u];
    if (!canHitUnit(b, unit)) continue;
    const hit = rayHitsCircle(b.x0, b.y0, xMax, yMax, unit.x, unit.y, unit.radius + 6);
    if (hit) hits.push({ kind: 'unit', t: hit.t, unit });
  }

  for (let i = 0; i < match.blocks.length; i++) {
    const block = match.blocks[i];
    if (!canHitBlock(b, block)) continue;
    const hit = rayHitsAABB(b.x0, b.y0, xMax, yMax, block.x, block.y, block.w, block.h);
    if (hit) hits.push({ kind: 'block', t: hit.t, block });
  }

  hits.sort((a, c) => a.t - c.t);

  let pierce = b.pierceLeft | 0;
  let endT = 1;
  for (let h = 0; h < hits.length; h++) {
    const hit = hits[h];
    const cost =
      hit.kind === 'block'
        ? getBlockPierceCost(b.weaponId ? getWeaponDef(b.weaponId) : null, hit.block)
        : getEntityPierceCost(hit.unit);

    if (applyDamage) {
      if (hit.kind === 'unit') {
        const unit = hit.unit;
        const mult = getDamageMult(b.damageType, unit.armorType || 'DEFAULT');
        const dmg = b.damage < 0 ? b.damage : b.damage * mult;
        applyDamageToUnit(match, unit, dmg, {
          sourceTeam: b.team,
          fromTurret: !!b.fromTurret,
          sourceBlockId: b.sourceBlockId,
          sourceX: b.x0,
          sourceY: b.y0,
        });
        if (dmg > 0) match.stats.damageDealt += dmg;
      } else {
        applyDamageToBlock(match, hit.block, b.damage, b.damageType, {
          sourceTeam: b.team,
          damageKind: 'PROJECTILE',
          fromTurret: !!b.fromTurret,
          fromPierce: true,
          skipLoot: true,
        });
      }
    }

    if (cost > pierce) {
      endT = hit.t;
      break;
    }
    pierce -= cost;
  }
  b.pierceLeft = pierce;
  return {
    x1: b.x0 + (xMax - b.x0) * endT,
    y1: b.y0 + (yMax - b.y0) * endT,
  };
}

/** Ray-circle: returns {t} in [0,1] if hit. */
function rayHitsCircle(x0, y0, x1, y1, cx, cy, r) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const fx = x0 - cx;
  const fy = y0 - cy;
  const a = dx * dx + dy * dy;
  const bb = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  let disc = bb * bb - 4 * a * c;
  if (disc < 0 || a <= 0) return null;
  disc = Math.sqrt(disc);
  const t = (-bb - disc) / (2 * a);
  if (t < 0 || t > 1) return null;
  return { t };
}

/** Segment vs AABB (Liang-Barsky); returns entry {t} in [0,1]. */
function rayHitsAABB(x0, y0, x1, y1, bx, by, bw, bh) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x0 - bx, bx + bw - x0, y0 - by, by + bh - y0];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null;
    } else {
      const r = q[i] / p[i];
      if (p[i] < 0) {
        if (r > t1) return null;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return null;
        if (r < t1) t1 = r;
      }
    }
  }
  if (t0 > t1) return null;
  return { t: t0 };
}

function projectileHitsBlock(match, p) {
  const occ = match.occupancy;
  if (!occ) return null;
  const samples = 4;
  for (let s = 0; s <= samples; s++) {
    const t = s / samples;
    const x = p.prevX + (p.x - p.prevX) * t;
    const y = p.prevY + (p.y - p.prevY) * t;
    const { gx, gy } = worldToL3(x, y);
    if (gx < 0 || gy < 0 || gx >= occ.cols || gy >= occ.rows) continue;
    const owner = occ.cells[gy * occ.cols + gx];
    if (owner < 0) continue;
    if (p.hitBlockIds && p.hitBlockIds.indexOf(owner) >= 0) continue;
    const block = getBlock(match, owner);
    if (!canHitBlock(p, block)) continue;
    return block;
  }
  return null;
}

/**
 * @param {object} [ctx]
 * @param {number} [ctx.sourceTeam]
 * @param {'TOOL'|'PROJECTILE'|'CONTACT'} [ctx.damageKind]
 * @param {boolean} [ctx.fromTurret]
 */
function applyDamageToBlock(match, block, baseDamage, damageType, ctx = {}) {
  if (!block || !block.alive) return;

  const sourceTeam = ctx.sourceTeam;
  const damageKind = ctx.damageKind || 'PROJECTILE';
  const fromTurret = !!ctx.fromTurret;
  const skipLoot = !!ctx.skipLoot;

  // Turret bullets: skip damage to other turrets and all blocks except resources.
  if (fromTurret) {
    if (!block.isHarvest) return;
  }

  // Team grief: player cannot destroy own BaseBlock (any weapon / tool).
  // Own-team blocks: only TOOL damage allowed. Enemies may damage as designed.
  if (sourceTeam === TEAM.PLAYER && block.team === TEAM.PLAYER) {
    if (block.isDefeatCondition) return;
    if (damageKind !== 'TOOL') return;
  }

  let mult = getDamageMult(damageType, block.armorType || 'DEFAULT');
  if (block.isWire && damageType === 'DEFAULT') {
    mult *= WIRE_MELEE_MULT;
  }
  // Pierce vs resources: still pays pierce cost / HP, but heal-style negative ignored.
  if (baseDamage < 0) return;
  const dmg = baseDamage * mult;
  block.hp -= dmg;
  match.stats.damageDealt += dmg;
  if (block.hp <= 0) {
    destroyBlock(match, block, { skipLoot: skipLoot && !!block.isHarvest });
  }
}

function destroyBlock(match, block, opts = {}) {
  if (!block || !block.alive) return;
  block.alive = false;
  block.hp = 0;
  if (block.isGen) {
    block.genStock = 0;
    block.genTimer = 0;
  }
  clearFootprint(match.occupancy, block.gx, block.gy, block.fw, block.fh);

  // Piercing resources counts as block cost only — no loot drop.
  if (block.isHarvest && block.dropItemId && !opts.skipLoot) {
    spawnDrop(match, block.x + block.w / 2, block.y + block.h / 2, block.dropItemId, block.dropCount);
  }

  if (block.isDefeatCondition) {
    match.base = block;
    match.baseChunk = null;
    clearBaseChunkL1Mask(match);
    if (!match.outcome) match.outcome = 'lose';
  }
}

function applyDamageToUnit(match, unit, damage, ctx = {}) {
  if (!unit || !unit.active) return;

  // Negative damage = heal (friendly medic / heal beam / heal pad).
  if (damage < 0) {
    unit.hp = Math.min(unit.maxHp, unit.hp - damage);
    return;
  }

  let dmg = damage;
  if (!ctx.skipShield && unit.shield) {
    const abs = absorbDamageWithShield(unit, dmg);
    dmg = abs.leftover;
  }
  if (dmg <= 0) return;

  const reduction = getPassiveDamageReduction(unit);
  if (reduction > 0) dmg *= 1 - reduction;
  const armorRed = getArmorDamageReduction(unit);
  if (armorRed > 0) dmg *= 1 - armorRed;

  unit.hp -= dmg;
  noteMoralePressure(unit, 2);

  // Player-team projectile / turret hit → sticky aggro + HIT Event for Mediator.
  if (
    unit.role === 'enemy' &&
    unit.hp > 0 &&
    ctx.sourceTeam === TEAM.PLAYER
  ) {
    unit.aggroChase = true;
    unit.aiStage = 'engage';
    noteHitEvent(unit, {
      fromTurret: !!ctx.fromTurret,
      sourceBlockId: ctx.sourceBlockId,
      sourceX: ctx.sourceX,
      sourceY: ctx.sourceY,
    });
    if (ctx.fromTurret && ctx.sourceBlockId >= 0) {
      const blk = getBlock(match, ctx.sourceBlockId);
      if (blk && blk.alive) {
        unit.aggroBlockId = blk.id;
        unit.combatTargetKind = 'block';
        unit.combatTargetId = blk.id;
        unit.combatLockTimer = 8;
        unit.targetAimRad = Math.atan2(
          blk.y + blk.h / 2 - unit.y,
          blk.x + blk.w / 2 - unit.x
        );
        return;
      }
    }
    const player = getPlayerUnit(match);
    if (player && player.active) {
      unit.combatTargetKind = 'unit';
      unit.combatTargetId = player.id;
      unit.combatLockTimer = 8;
      unit.targetAimRad = Math.atan2(player.y - unit.y, player.x - unit.x);
    } else if (typeof ctx.sourceX === 'number') {
      unit.targetAimRad = Math.atan2(ctx.sourceY - unit.y, ctx.sourceX - unit.x);
    }
  }

  if (unit.hp > 0) return;

  unit.hp = 0;
  if (unit.role === 'enemy') {
    match.enemiesAlive = Math.max(0, match.enemiesAlive - 1);
    match.stats.kills += 1;
  }
  if (unit.role === 'player') {
    match.playerDead = true;
    match.deathX = unit.x;
    match.deathY = unit.y;
    match.cameraFreeFly = true;
    match._freeFlyBooted = false;
    const pack = GAME_PACK;
    const wave = Math.max(1, match.waveIndex);
    match.respawnTimer =
      pack.respawnBaseSec + (wave - 1) * pack.respawnExtraPerWave;
  }
  deactivateUnit(unit);
}

function updateBlockSystems(match, dt) {
  const player = getPlayerUnit(match);
  const turnRate = GAME_PACK.turretTurnRateRadPerSec;
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (!b.alive) continue;

    const isArmed = b.isTurret || (b.isDefeatCondition && b.weaponId);
    if (isArmed && typeof b.turretTargetAimRad === 'number') {
      if (typeof b.turretAimRad !== 'number') b.turretAimRad = 0;
      b.turretAimRad = slewAngle(b.turretAimRad, b.turretTargetAimRad, turnRate, dt);
    }

    if (b.isHeal && player && !b.areaTrigger) {
      // Legacy fallback if areaTrigger missing — prefer CONTINUOUS_TICK pad.
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      if (Math.hypot(player.x - cx, player.y - cy) <= b.healRadius) {
        player.hp = Math.min(player.maxHp, player.hp + b.healPerSec * dt);
      }
    }

    if (b.isGen && b.genRate) {
      b.genTimer -= dt;
      if (b.genTimer <= 0) {
        b.genTimer = b.genRate.intervalSec;
        b.genStock = Math.min(
          b.genStockMax,
          b.genStock + b.genRate.amount
        );
      }
    }

    // Inherent BaseBlock multi-resource generators
    if (b.generatorList && b.generatorList.length) {
      for (let g = 0; g < b.generatorList.length; g++) {
        const gen = b.generatorList[g];
        gen.timer -= dt;
        if (gen.timer <= 0) {
          gen.timer = gen.intervalSec;
          gen.stock = Math.min(64, gen.stock + gen.amount);
        }
      }
      if (b.isDefeatCondition) syncBaseStorageFromGenerators(b);
    }
  }
}

function spawnDrop(match, x, y, itemId, count, vx = 0, vy = 0) {
  const drop = acquireDrop(match.pools);
  if (!drop) {
    addItemToInventory(match.inventory, itemId, count);
    return;
  }
  const pack = GAME_PACK;
  drop.active = true;
  drop.x = x;
  drop.y = y;
  drop.vx = vx || 0;
  drop.vy = vy || 0;
  drop.radius = pack.dropRadius != null ? pack.dropRadius : Math.round(L3_SIZE * 0.16);
  drop.itemId = itemId;
  drop.itemTypeId = itemId;
  drop.stack = count;
  drop.age = 0;
}

/**
 * Throw entire hotbar slot contents as a world drop (drag-drop outside hotbar).
 * Spawn uses unit facing + velocity — cursor world coords are ignored for position.
 * @returns {{ ok: boolean, reason?: string }}
 */
export function throwHotbarSlot(match, slotIndex, _worldX, _worldY) {
  if (!match || !match.inventory) return { ok: false, reason: 'No inventory' };
  const slot = match.inventory[slotIndex];
  if (!slot || !slot.itemId || slot.count <= 0) {
    return { ok: false, reason: 'Empty slot' };
  }
  const itemId = slot.itemId;
  const count = slot.count;
  const player = getPlayerUnit(match);
  if (!player) return { ok: false, reason: 'No player' };
  const pack = GAME_PACK;
  const ang =
    typeof player.aimRad === 'number'
      ? player.aimRad
      : player.facingRad || 0;
  const off = player.radius + (pack.dropThrowOffset || 28);
  const speed = pack.dropThrowSpeed || 220;
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const x = player.x + cos * off;
  const y = player.y + sin * off;
  spawnDrop(match, x, y, itemId, count, cos * speed, sin * speed);
  match.inventory[slotIndex] = emptySlot();
  match.interactPrompt = `Dropped ${itemId}`;
  return { ok: true };
}

function updateDrops(match, dt) {
  const drops = match.pools.drops;
  const pack = GAME_PACK;
  const friction = pack.dropFriction != null ? pack.dropFriction : 6.5;
  const stopSpeed = pack.dropStopSpeed != null ? pack.dropStopSpeed : 8;
  const damp = Math.exp(-friction * dt);
  const getter = (id) => getBlock(match, id);
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    if (!d.active) continue;
    if (d.radius == null || !(d.radius > 0)) {
      d.radius = pack.dropRadius != null ? pack.dropRadius : Math.round(L3_SIZE * 0.16);
    }
    if (d.vx || d.vy) {
      d.x += (d.vx || 0) * dt;
      d.y += (d.vy || 0) * dt;
      d.vx = (d.vx || 0) * damp;
      d.vy = (d.vy || 0) * damp;
      if (Math.hypot(d.vx, d.vy) < stopSpeed) {
        d.vx = 0;
        d.vy = 0;
      }
    }
    // Same solid push as units — eject out of Gen/Base footprint if overlapping.
    if (match.occupancy) {
      resolveUnitVsOccupancy(d, match.occupancy, getter);
    }
    d.age = (d.age || 0) + dt;
    if (d.age >= pack.dropExpireSec) d.active = false;
  }
}

function pickupDrops(match) {
  const player = getPlayerUnit(match);
  if (!player) return;
  const pack = GAME_PACK;
  const magnet =
    pack.dropMagnetRange != null ? pack.dropMagnetRange : Math.round(L3_SIZE * 0.28);
  const drops = match.pools.drops;
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    if (!d.active) continue;
    const dropR =
      d.radius != null && d.radius > 0
        ? d.radius
        : pack.dropRadius != null
          ? pack.dropRadius
          : Math.round(L3_SIZE * 0.16);
    const reach = player.radius + magnet + dropR;
    if (Math.hypot(d.x - player.x, d.y - player.y) > reach) continue;
    const left = addItemToInventory(match.inventory, d.itemId || d.itemTypeId, d.stack);
    if (left < d.stack) {
      match.stats.resourcesGathered += d.stack - left;
    }
    if (left <= 0) d.active = false;
    else d.stack = left;
  }
}

function updateInteractPrompt(match) {
  const player = getPlayerUnit(match);
  if (!player) {
    match.interactPrompt = '';
    return;
  }
  // Keep last explicit prompt briefly; refresh proximity hint.
  let hint = '';
  const pack = GAME_PACK;
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (!b.alive) continue;
    const d = distToBlockAABB(player.x, player.y, b);
    if (d > pack.interactRadius) continue;
    if (b.isDoor) hint = `E: ${b.isOpen ? 'Close' : 'Open'} door`;
    else if (b.isGen) hint = `E: Open Gen (${b.genStock || 0})`;
    else if (b.isDefeatCondition) hint = 'E: Open Base';
    else if (b.isFactory) hint = 'E: Factory upgrade';
  }
  const slot = getActiveSlot(match.inventory, match.activeHotbar);
  if (isToolSlot(slot)) {
    const def = getItemDef(slot.itemId);
    if (def && def.meleeRole === 'REPAIR_WRENCH') {
      hint = hint || 'LMB: wrench (repair friendly structures)';
    } else {
      hint = hint || 'LMB: tool (facing volume — harvest / walls)';
    }
  }
  if (hint) match.interactPrompt = hint;
}

/**
 * Enemy AI: General pivots + Approach/Engage/Retreat + firearms.
 * Combat target is sticky (pick once, hold) with hysteresis — no per-frame thrash.
 */
/**
 * Enemy AI entry — path/perception prep, then Mediator → Stage → Unified Input.
 * Pipeline: Event(+Δpriority) → argmax Goal → GoalToStage → Stage Actions.
 */
function decideEnemyActions(match, dt) {
  const actions = [];
  if (!match.basePlaced || !match.base || !match.base.alive) return actions;

  const pack = GAME_PACK;
  const player = getPlayerUnit(match);
  const base = match.base;
  const bx = base.x + base.w / 2;
  const by = base.y + base.h / 2;
  updateGeneralTarget(match, bx, by);

  const units = match.pools.units;

  let allyX = 0;
  let allyY = 0;
  let allyN = 0;
  for (let i = 0; i < units.length; i++) {
    const e = units[i];
    if (!e.active || e.role !== 'enemy') continue;
    allyX += e.x;
    allyY += e.y;
    allyN += 1;
  }
  if (allyN > 0) {
    allyX /= allyN;
    allyY /= allyN;
  }

  for (let i = 0; i < units.length; i++) {
    const e = units[i];
    if (!e.active || e.role !== 'enemy') continue;

    ensureBlackboard(e);

    // General: clear-corridor Path/L1 pivots → blackboard (no per-unit map BFS).
    let pathGoal = advanceUnitAlongChain(match, e);
    if (!pathGoal) {
      pathGoal = { x: bx, y: by, radius: 160 };
      e.pathGoalX = bx;
      e.pathGoalY = by;
    }
    const group = match.general && match.general.groups[e.groupId];
    writeGeneralPathToBlackboard(e, group, pathGoal);

    // Sector leave → Event LEFT_GENERAL_SECTOR (Mediator prefers REACH_PATH_GOAL).
    const leftSector =
      group &&
      e.aiStage === 'engage' &&
      !isUnitInsideSector(group, e.x, e.y);
    if (leftSector) {
      e.combatTargetKind = null;
      e.combatTargetId = -1;
      e.combatLockTimer = 0;
    }

    // Local: raycast fan + steering budget dodge around real obstacles.
    const local = applyLocalPathLayer(match, e, pathGoal, {
      baseX: bx,
      baseY: by,
      leftSector: !!leftSector,
      config: AI_LOCAL_PATH,
    });
    pathGoal = local.goal;
    if (local.attackBlock) {
      e.attackBlockId = local.attackBlock.id;
    } else if (
      e.attackBlockId >= 0 &&
      e.aggroBlockId !== e.attackBlockId &&
      !(e.blackboard && e.blackboard.flags && e.blackboard.flags.STEERING_EXHAUSTED)
    ) {
      e.attackBlockId = -1;
    }

    const combatTarget = pickStickyCombatTarget(
      match,
      e,
      player,
      bx,
      by,
      pack,
      dt
    );
    if (!combatTarget) {
      e.combatTargetKind = null;
      e.combatTargetId = -1;
      e.combatLockTimer = 0;
    }

    const unitActions = decideUnitViaMediator(match, e, {
      dt,
      pack,
      pathGoal,
      combatTarget,
      allyX,
      allyY,
      allyN,
      leftSector: !!leftSector,
      canFireAmmo,
      getWeaponDef,
      goalBaseWeights: AI_GOAL_BASE_WEIGHTS,
      goalToStage: AI_GOAL_TO_STAGE,
      eventBoostTable: AI_EVENT_BOOSTS,
    });
    for (let a = 0; a < unitActions.length; a++) {
      actions.push(unitActions[a]);
    }

    // Melee-only bots may contact-damage blockers (parity with pre-Mediator loop).
    if (
      !e.weaponId &&
      combatTarget &&
      combatTarget.kind === 'block' &&
      combatTarget.dist < e.radius + 80
    ) {
      applyDamageToBlock(
        match,
        combatTarget.block,
        pack.enemyContactDps * dt,
        'DEFAULT',
        { sourceTeam: TEAM.ENEMY, damageKind: 'CONTACT' }
      );
    }
  }

  return actions;
}

/** Score candidate: higher = better. Invalid / too far → negative. */
function scoreCombatCandidate(kind, dist, pack, isPathBlocker, aggroChase) {
  const engage = pack.enemyEngageRadius;
  // Aggro chase ignores normal engage radius (sticky pursuit of player).
  if (!aggroChase && dist > engage * 1.25) return -1;
  let bias = 0;
  if (kind === 'block' && isPathBlocker) bias = 110;
  else if (kind === 'unit') bias = aggroChase ? 200 : 90;
  else if (kind === 'block') bias = 45;
  else if (kind === 'base') bias = 25;
  return bias + (engage - Math.min(dist, engage));
}

/**
 * Phase 3 — bias score by archetype targetPriorityList order (0 = highest).
 * Maps combat kind (+ block flags) → TargetKind labels from NextPlan.
 */
function targetPriorityBias(unit, candidate) {
  const list = unit && unit.targetPriorityList;
  if (!list || !list.length || !candidate) return 0;
  let label = null;
  if (candidate.kind === 'unit') label = 'PLAYER';
  else if (candidate.kind === 'base') label = 'BLOCK_BASE';
  else if (candidate.kind === 'block' && candidate.block) {
    if (candidate.block.isTurret) label = 'BLOCK_TURRET';
    else if (candidate.block.isDefeatCondition) label = 'BLOCK_BASE';
    else label = 'BLOCK_OTHER';
  }
  if (!label) return 0;
  const idx = list.indexOf(label);
  if (idx < 0) {
    // Not in list → soft demote (sniper won't prefer turrets).
    return -80;
  }
  return (list.length - idx) * 35;
}

/** Dogpile: Score = priorityScore / (distance + currentAttackers * K). */
function scoreTurretPriority(block, dist, attackers) {
  const pri = block.priorityScore || 10;
  return pri / (dist + attackers * TURRET_DOGPILE_K + 1);
}

function recountTurretAttackers(match) {
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (b.alive) b.currentAttackers = 0;
  }
  const units = match.pools.units;
  for (let i = 0; i < units.length; i++) {
    const e = units[i];
    if (!e.active || e.role !== 'enemy') continue;
    if (e.combatTargetKind === 'block' && e.combatTargetId >= 0) {
      const b = getBlock(match, e.combatTargetId);
      if (b && b.alive && (b.isTurret || b.isDefeatCondition)) {
        b.currentAttackers = (b.currentAttackers || 0) + 1;
      }
    }
  }
}

/**
 * Sticky combat lock: keep focus until invalid / far / meaningful score gap after lock timer.
 */
function pickStickyCombatTarget(match, e, player, bx, by, pack, dt) {
  e.combatLockTimer = Math.max(0, (e.combatLockTimer || 0) - dt);
  recountTurretAttackers(match);
  const candidates = [];
  const aggro = !!e.aggroChase;

  if (e.attackBlockId >= 0) {
    const blk = getBlock(match, e.attackBlockId);
    if (blk && blk.alive) {
      const x = blk.x + blk.w / 2;
      const y = blk.y + blk.h / 2;
      const dist = Math.hypot(x - e.x, y - e.y);
      candidates.push({
        kind: 'block',
        id: blk.id,
        x,
        y,
        dist,
        block: blk,
        score: scoreCombatCandidate('block', dist, pack, true, false),
      });
    } else {
      e.attackBlockId = -1;
    }
  }

  // Aggro turret that damaged this unit — strong sticky bias.
  if (e.aggroBlockId >= 0) {
    const ab = getBlock(match, e.aggroBlockId);
    if (ab && ab.alive) {
      const x = ab.x + ab.w / 2;
      const y = ab.y + ab.h / 2;
      const dist = Math.hypot(x - e.x, y - e.y);
      const dog = scoreTurretPriority(ab, dist, ab.currentAttackers || 0);
      candidates.push({
        kind: 'block',
        id: ab.id,
        x,
        y,
        dist,
        block: ab,
        score: 250 + dog * 100,
      });
    } else {
      e.aggroBlockId = -1;
    }
  }

  // All armed player turrets / base — dogpile priority formula.
  for (let i = 0; i < match.blocks.length; i++) {
    const blk = match.blocks[i];
    if (!blk.alive) continue;
    if (!(blk.isTurret || (blk.isDefeatCondition && blk.weaponId))) continue;
    if (blk.id === e.aggroBlockId) continue;
    const x = blk.x + blk.w / 2;
    const y = blk.y + blk.h / 2;
    const dist = Math.hypot(x - e.x, y - e.y);
    if (dist > pack.enemyEngageRadius * 1.4 && !aggro) continue;
    const dog = scoreTurretPriority(blk, dist, blk.currentAttackers || 0);
    candidates.push({
      kind: 'block',
      id: blk.id,
      x,
      y,
      dist,
      block: blk,
      score: 40 + dog * 80,
    });
  }

  if (player && player.active) {
    const dist = Math.hypot(player.x - e.x, player.y - e.y);
    candidates.push({
      kind: 'unit',
      id: player.id,
      x: player.x,
      y: player.y,
      dist,
      unit: player,
      score: scoreCombatCandidate('unit', dist, pack, false, aggro),
    });
  }

  const bd = Math.hypot(bx - e.x, by - e.y);
  candidates.push({
    kind: 'base',
    id: -1,
    x: bx,
    y: by,
    dist: bd,
    score: scoreCombatCandidate('base', bd, pack, false, false),
  });

  let sticky = null;
  if (e.combatTargetKind) {
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (c.kind === e.combatTargetKind && c.id === e.combatTargetId) {
        sticky = c;
        break;
      }
    }
    // Hysteresis: keep lock a bit past engage; aggro chase never drops for distance.
    if (sticky && !aggro && sticky.dist > pack.enemyEngageRadius * 1.3) {
      sticky = null;
    }
    if (sticky && sticky.score < 0) sticky = null;
  }

  let best = null;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (c.score < 0) continue;
    const scored = c.score + targetPriorityBias(e, c);
    if (!best || scored > best._scored) {
      best = c;
      best._scored = scored;
    }
  }

  const reselectGap = Math.max(50, pack.enemyEngageRadius * 0.14);
  let chosen = sticky;
  if (sticky) {
    if (
      best &&
      (best.kind !== sticky.kind || best.id !== sticky.id) &&
      best.score > sticky.score + reselectGap &&
      e.combatLockTimer <= 0
    ) {
      chosen = best;
      e.combatLockTimer = 0.65;
    }
  } else if (best) {
    chosen = best;
    e.combatLockTimer = 0.65;
  }

  if (chosen) {
    e.combatTargetKind = chosen.kind;
    e.combatTargetId = chosen.id;
  } else {
    e.combatTargetKind = null;
    e.combatTargetId = -1;
    e.combatLockTimer = 0;
  }
  return chosen;
}

function applyEnemyContactDamage(match, dt) {
  const pack = GAME_PACK;
  const units = match.pools.units;
  const player = getPlayerUnit(match);
  const base = match.base;

  for (let i = 0; i < units.length; i++) {
    const e = units[i];
    if (!e.active || e.role !== 'enemy') continue;

    // Melee contact only if no gun or very close
    if (player) {
      const d = Math.hypot(player.x - e.x, player.y - e.y);
      if (d < player.radius + e.radius + 2) {
        applyDamageToUnit(match, player, pack.enemyContactDps * dt);
      }
    }

    if (base && base.alive && pointInRectExpanded(e.x, e.y, base, e.radius)) {
      applyDamageToBlock(match, base, pack.enemyBaseContactDps * dt, 'DEFAULT', {
        sourceTeam: TEAM.ENEMY,
        damageKind: 'CONTACT',
      });
    }
  }
}

function updateWaves(match, dt) {
  const pack = GAME_PACK;
  if (!match.basePlaced || !match.base || !match.base.alive) return;
  if (match.outcome) return;

  // Win: cleared target wave (all enemies dead after wave N spawned).
  if (
    match.waveIndex >= pack.targetWaveToWin &&
    match.enemiesAlive <= 0 &&
    match.waveIndex > 0
  ) {
    match.waveActive = false;
    match.outcome = 'win';
    return;
  }

  // Final wave spawned — wait for clear only (no more schedule spawns).
  if (match.waveIndex >= pack.targetWaveToWin) {
    match.waveActive = match.enemiesAlive > 0;
    return;
  }

  // Countdown always ticks (setup + between). Does NOT wait for full wipe.
  match.waveCountdown -= dt;
  if (match.waveCountdown > 0) return;

  match.waveIndex += 1;
  spawnWave(match, match.waveIndex);
  match.waveActive = true;
  match.phase = 'wave';
  if (match.waveIndex < pack.targetWaveToWin) {
    match.waveCountdown = pack.waveCountdownSec;
  } else {
    match.waveCountdown = 0;
  }
}

function spawnWave(match, waveIndex) {
  const pack = GAME_PACK;
  const count =
    pack.enemiesPerWaveBase + Math.max(0, waveIndex - 1) * pack.enemiesPerWaveScale;

  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push(pickSpawnOutsideBaseChunk(match, i, count));
  }

  const base = match.base;
  const tx = base.x + base.w / 2;
  const ty = base.y + base.h / 2;

  // Next wave: clear old group pattern, recompute paths group-by-group, then deploy.
  resetGeneral(match);
  const groupCount = Math.max(1, pack.waveGroupCount || 3);
  const groupLists = partitionSpawnGroups(positions, groupCount, tx, ty);
  const prepared = prepareGroupPathsSequential(match, groupLists, tx, ty);
  // Apply/Deploy only when all group paths are ready.
  const groups = deployPreparedGroups(match, prepared, tx, ty);

  // Phase 3 — per-slot archetype from WAVE_ARCHETYPE_COMPOSITION (mixed types).
  let unitSeq = 0;
  for (let gi = 0; gi < prepared.length; gi++) {
    const prep = prepared[gi];
    const group = groups[gi];
    if (!group) continue;
    for (let i = 0; i < prep.positions.length; i++) {
      const u = acquireUnit(match.pools);
      if (!u) break;
      const pos = prep.positions[i];
      const archId = pickArchetypeIdForWaveSlot(waveIndex, unitSeq);
      const archetype =
        getUnitArchetype(archId) || getArchetypeForWave(waveIndex);
      const weaponId =
        (archetype && archetype.defaultWeapon) ||
        pack.enemyWeaponByWave[
          Math.min(waveIndex, pack.enemyWeaponByWave.length - 1)
        ] ||
        null;
      const hpLo = archetype ? archetype.hpRange[0] : pack.enemyMaxHp;
      const hpHi = archetype ? archetype.hpRange[1] : pack.enemyMaxHp + waveIndex * 4;
      const t = (unitSeq % 5) / 4;
      const maxHp = Math.round(hpLo + (hpHi - hpLo) * t);
      const sizeScale =
        archetype && (archetype.sizeScale || (archetype.isBoss ? 1.5 : 1));
      u.active = true;
      u.typeId = 2;
      u.team = TEAM.ENEMY;
      u.role = 'enemy';
      u.collisionLayer = deriveCollisionLayer({ team: TEAM.ENEMY, role: 'enemy' });
      u.pierceCost = 1;
      u.archetypeId = archetype ? archetype.id : archId;
      u.isBoss = !!(archetype && archetype.isBoss);
      u.sizeScale = sizeScale || 1;
      u.maxHp = maxHp;
      u.hp = u.maxHp;
      u.speed = pack.enemySpeed * (u.isBoss ? 0.85 : 1);
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
      u.activeShieldId = null;
      u.hasPlacementSkill = !!(archetype && archetype.hasPlacementSkill);
      u.inventory = null;
      u.activeHotbar = 0;
      u._burstTimer = 0;
      u._flankTimer = 0;
      u._archetypePhaseKey = null;
      // Compose Goals+Stages from archetype data (allowedGoals / flags / phase).
      const effective = resolveEffectiveArchetype(u, u.archetypeId);
      if (effective) {
        applyEffectiveArchetypeToUnit(u, effective, { syncWeapon: false });
        ensureUnitSkills(u);
      }
      attachUnitToGroup(group, u);
      match.enemiesAlive += 1;
      unitSeq += 1;
    }
  }
}

/** Split perimeter spawns into angular arcs → one list per General group. */
function partitionSpawnGroups(positions, groupCount, cx, cy) {
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

function pickSpawnOutsideBaseChunk(match, index, total) {
  const { world, baseChunk, base } = match;
  const pack = GAME_PACK;
  const margin = 40;
  const peri = 2 * (world.worldW + world.worldH);
  let t = ((index + 0.5) / total) * peri;
  let x;
  let y;
  if (t < world.worldW) {
    x = t;
    y = margin;
  } else if (t < world.worldW + world.worldH) {
    x = world.worldW - margin;
    y = t - world.worldW;
  } else if (t < 2 * world.worldW + world.worldH) {
    x = world.worldW - (t - world.worldW - world.worldH);
    y = world.worldH - margin;
  } else {
    x = margin;
    y = world.worldH - (t - 2 * world.worldW - world.worldH);
  }

  const zone = baseChunk || {
    x: base.x,
    y: base.y,
    w: base.w,
    h: base.h,
    cx: base.x + base.w / 2,
    cy: base.y + base.h / 2,
  };

  // Spawn-only exclusion: BaseChunk size unchanged, push farther outside edges.
  const excludePad =
    ((pack.baseSpawnExclusionL3 != null
      ? pack.baseSpawnExclusionL3
      : 4) *
      L3_SIZE) ||
    0;
  const exclude = {
    x: zone.x - excludePad,
    y: zone.y - excludePad,
    w: zone.w + excludePad * 2,
    h: zone.h + excludePad * 2,
    cx: zone.cx != null ? zone.cx : zone.x + zone.w / 2,
    cy: zone.cy != null ? zone.cy : zone.y + zone.h / 2,
  };

  if (pointInRectExpanded(x, y, exclude, 0)) {
    const dx = x - exclude.cx;
    const dy = y - exclude.cy;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX > absY) {
      x = dx >= 0 ? exclude.x + exclude.w + margin : exclude.x - margin;
    } else {
      y = dy >= 0 ? exclude.y + exclude.h + margin : exclude.y - margin;
    }
  }

  return {
    x: clamp(x, margin, world.worldW - margin),
    y: clamp(y, margin, world.worldH - margin),
  };
}

function updatePlayerRespawn(match, dt) {
  if (!match.playerDead) return;
  if (!match.base || !match.base.alive) return;
  match.respawnTimer -= dt;
  if (match.respawnTimer > 0) return;
  spawnPlayer(match);
}

export function getMeleeVolume(unit, opts = {}) {
  const pack = GAME_PACK;
  const weaponId = opts.weaponId || unit.weaponId || null;
  const toolId = opts.toolId || null;
  // Optional future hook: weapon/tool-specific reach/width tables.
  // const custom = resolveMeleeVolumeDef(weaponId || toolId);
  const ang =
    typeof unit.aimRad === 'number' ? unit.aimRad : unit.facingRad || 0;
  const reach = pack.meleeReach;
  const halfW = pack.meleeHalfWidth;
  const start = unit.radius * 0.35;
  return {
    ang,
    reach,
    halfW,
    start,
    ox: unit.x,
    oy: unit.y,
    weaponId,
    toolId,
  };
}

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
  match.playerDead = !!snap.playerDead;
  match.respawnTimer = snap.respawnTimer || 0;
  match.cameraZoom = snap.cameraZoom || GAME_PACK.cameraFollowZoom;
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
    match.inventory = createEmptyInventory(GAME_PACK.hotbarSlots);
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
      block.factoryWeaponId = sb.factoryWeaponId || null;
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

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function pointInRectExpanded(px, py, r, expand) {
  return (
    px >= r.x - expand &&
    px <= r.x + r.w + expand &&
    py >= r.y - expand &&
    py <= r.y + r.h + expand
  );
}

function segmentHitsCircle(x0, y0, x1, y1, cx, cy, radius) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const fx = x0 - cx;
  const fy = y0 - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;
  let disc = b * b - 4 * a * c;
  if (disc < 0) return false;
  if (a < 1e-8) return fx * fx + fy * fy <= radius * radius;
  disc = Math.sqrt(disc);
  const t1 = (-b - disc) / (2 * a);
  const t2 = (-b + disc) / (2 * a);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

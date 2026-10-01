import { ActionType } from './actions.js';
import {
  GAME_PACK,
  L3_SIZE,
  PATH_SIZE,
  TEAM,
  TURRET_DOGPILE_K,
  WIRE_MELEE_MULT,
  getArchetypeForWave,
  getBlockDef,
  getBlockPierceCost,
  getDamageMult,
  getItemDef,
  getPierceUnitBudget,
  getToolHarvestMult,
  getUpgradeRecipe,
  getWeaponDef,
} from './config.js';
import {
  advanceUnitAlongChain,
  applyLocalGeneralStub,
  attachUnitToGroup,
  buildBaseChunkNavPoints,
  clearBaseChunkL1Mask,
  createGeneralState,
  deployPreparedGroups,
  isUnitInsideSector,
  maskBaseChunkL1Pipes,
  prepareGroupPathsSequential,
  resetGeneral,
  resolveObstacleOnPath,
  updateGeneralTarget,
} from './general.js';
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
  isPlaceableSlot,
  isToolSlot,
  isWeaponSlot,
  makeSlotFromItem,
} from './inventory.js';
import { generateWorldObjects } from './mapgen.js';
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
import { acquireDrop, acquireProjectile, acquireUnit, deactivateUnit } from './pools.js';
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
  match.showMeleeVolume = false;
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

  updatePlaceGhost(match, mouseWorld);

  const botActions = decideEnemyActions(match, dt);
  const turretActions = decideTurretActions(match);
  const allActions = actions.concat(botActions).concat(turretActions);

  applyActions(match, allActions, mouseWorld, dt);
  integrateUnitMotion(match, dt);
  separateUnits(match);
  updateCooldowns(match, dt);
  updateWeaponReloads(match, dt);
  updateProjectiles(match, dt);
  updateBeams(match, dt);
  updateBlockSystems(match, dt);
  updateFactory(match, dt);
  applyEnemyContactDamage(match, dt);
  pickupDrops(match);
  updateDrops(match, dt);
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

  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];

    if (a.type === ActionType.SELECT_HOTBAR) {
      if (player && a.unitId === player.id) {
        match.activeHotbar = a.slot | 0;
      }
      continue;
    }

    // Turret fire uses synthetic unitId = -(blockId+1)
    if (a.type === ActionType.FIRE && a.turretBlockId != null) {
      tryTurretFire(match, a.turretBlockId);
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
      if (unit.role === 'player') {
        tryHarvest(match, unit);
      }
    } else if (a.type === ActionType.PLACE) {
      if (unit.role === 'player') {
        const ghost = match.placeGhost;
        if (ghost) {
          tryPlace(match, unit, ghost.gx, ghost.gy);
        } else if (typeof a.worldX === 'number') {
          const blockDef = getBlockDef(
            getActiveSlot(match.inventory, match.activeHotbar).itemId
          );
          if (blockDef) {
            const snapped = snapWorldToL3Origin(a.worldX, a.worldY);
            const ox = snapped.gx - Math.floor(blockDef.footprint.w / 2);
            const oy = snapped.gy - Math.floor(blockDef.footprint.h / 2);
            tryPlace(match, unit, ox, oy);
          }
        }
      }
    }
  }

  const units = match.pools.units;
  const pack = GAME_PACK;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active) continue;
    const intent = moveIntent[u.id];
    if (intent) {
      u.vx = intent.dx * u.speed;
      u.vy = intent.dy * u.speed;
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
  const slot = getActiveSlot(match.inventory, match.activeHotbar);
  if (!isPlaceableSlot(slot)) return false;

  const blockDef = getBlockDef(slot.itemId);
  if (!blockDef) return false;

  if (blockDef.isDefeatCondition && match.basePlaced) return false;

  const fw = blockDef.footprint.w;
  const fh = blockDef.footprint.h;
  const standing = unitStandingCells(unit.x, unit.y, unit.radius);
  if (!canPlaceFootprint(match.occupancy, gx, gy, fw, fh, standing)) {
    return false;
  }

  const block = createPlacedBlock(match, slot.itemId, gx, gy, blockDef);
  registerBlock(match, block);
  match.stats.blocksPlaced += 1;

  if (block.isDefeatCondition) {
    match.base = block;
    match.basePlaced = true;
    match.baseChunk = buildBaseChunk(match, block);
    applyBaseChunkPipeMask(match);
    match.phase = 'setup';
    match.waveCountdown = GAME_PACK.setupPhaseDurationSec;
    match.waveActive = false;
    match.waveIndex = 0;
    // Turret + resource gen are inherent BaseBlock systems — no free starter blocks.
  }



function createPlacedBlock(match, itemId, gx, gy, blockDef) {
  const fw = blockDef.footprint.w;
  const fh = blockDef.footprint.h;
  const blockId = match.occupancy.nextBlockId++;
  markFootprint(match.occupancy, gx, gy, fw, fh, blockId);
  const origin = l3OriginWorld(gx, gy);
  const w = fw * L3_SIZE;
  const h = fh * L3_SIZE;

  return {
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
    team: blockDef.team != null ? blockDef.team : TEAM.PLAYER,
  };
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
  beginReload(ammo, weapon);
}

function tryFire(match, unit) {
  const { weapon, ammo } = getUnitWeaponAmmo(match, unit);
  if (!weapon) return;
  if (unit.fireCooldown > 0) return;
  if (!canFireAmmo(ammo, weapon)) {
    if (ammo && ammo.ammoInMag <= 0 && ammo.mags > 0) beginReload(ammo, weapon);
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
  proj.pierceLeft = weapon.pierceUnits || 0;
  proj.hitBlockIds = [];
  proj.fromTurret = !!owner.fromTurret;
  return proj;
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
  };
  spawnProjectile(match, owner, weapon, aimRad);
  block.fireCooldown = weapon.cooldownSec;
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
    actions.push({
      type: ActionType.FIRE,
      turretBlockId: b.id,
      aimRad: Math.atan2(best.y - cy, best.x - cx),
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
 * Take produced resources from a Gen block into player inventory.
 * @returns {{ taken: number, itemId: string|null, reason?: string }}
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
  const left = addItemToInventory(match.inventory, itemId, want);
  const taken = want - left;
  block.genStock = (block.genStock || 0) - taken;
  if (taken > 0) match.stats.resourcesGathered += taken;
  if (taken <= 0) return { taken: 0, itemId, reason: 'Inventory full' };
  match.interactPrompt = `Took ${taken} ${itemId}`;
  return { taken, itemId };
}

/**
 * Base receive panel state.
 * TODO hook: when sim adds inherent gen/storage on base (`base.storage`),
 * panel reads it here. Until then: HP + empty placeholder bags.
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
      : 'Inherent base storage/gen not wired yet (sim TODO)',
  };
}

/**
 * Take from base inherent storage when sim provides `base.storage`.
 * Stub-safe: returns reason if API missing.
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
  const left = addItemToInventory(match.inventory, itemId, want);
  const taken = want - left;
  bag.count -= taken;
  if (taken > 0) match.stats.resourcesGathered += taken;
  if (taken <= 0) return { taken: 0, itemId, reason: 'Inventory full' };
  return { taken, itemId };
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

function tryHarvest(match, unit, wx, wy) {
  if (typeof wx !== 'number') return;
  const slot = getActiveSlot(match.inventory, match.activeHotbar);
  if (!isToolSlot(slot)) return;
  const def = getItemDef(slot.itemId);
  if (!def) return;

  let target = harvestTargetAt(match, wx, wy);
  if (!target) target = placeableTargetAt(match, wx, wy);
  if (!target) return;

  const d = distToBlockAABB(unit.x, unit.y, target);
  if (d > GAME_PACK.interactRadius + L3_SIZE) return;

  let dmg = def.harvestDamage || 20;
  if (target.isHarvest) {
    const mult = getToolHarvestMult(def.toolTier || 'TIER0', target.harvestKind);
    if (mult <= 0) {
      match.interactPrompt = 'Wrong tool tier';
      return;
    }
    dmg *= mult;
  }

  applyDamageToBlock(match, target, dmg, 'DEFAULT', {
    sourceTeam: TEAM.PLAYER,
    damageKind: 'TOOL',
  });
}

/** Any non-harvest placeable under cursor (for tool grief / deconstruct). */
function placeableTargetAt(match, worldX, worldY) {
  const { gx, gy } = worldToL3(worldX, worldY);
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (!b.alive || b.isHarvest) continue;
    if (gx >= b.gx && gx < b.gx + b.fw && gy >= b.gy && gy < b.gy + b.fh) {
      return b;
    }
  }
  return null;
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

function unitMatchesFaction(unit, projectileTeam, targetFaction) {
  if (!unit || !unit.active) return false;
  if (targetFaction === 'FRIENDLY') return unit.team === projectileTeam;
  return unit.team !== projectileTeam;
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
      p.active = false;
      continue;
    }

    const hitBlock = projectileHitsBlock(match, p);
    if (hitBlock) {
      const weapon = p.weaponId ? getWeaponDef(p.weaponId) : null;
      const cost = getBlockPierceCost(weapon, hitBlock);
      const canPierceBlock =
        (p.blockPierceLeft | 0) >= cost &&
        weapon &&
        weapon.pierceConfig &&
        cost < 999;

      applyDamageToBlock(match, hitBlock, p.damage, p.damageType, {
        sourceTeam: p.team,
        damageKind: 'PROJECTILE',
        fromTurret: !!p.fromTurret,
        fromPierce: true,
        skipLoot: !!p.noLootOnPierce,
      });

      if (canPierceBlock) {
        p.blockPierceLeft = (p.blockPierceLeft | 0) - cost;
        if (!p.hitBlockIds) p.hitBlockIds = [];
        p.hitBlockIds.push(hitBlock.id);
        // Continue flight after paying block pierce cost (no loot from pierce kill).
      } else {
        p.active = false;
        continue;
      }
    }

    let pierce = p.pierceLeft | 0;
    let hitUnit = false;
    for (let u = 0; u < units.length; u++) {
      const unit = units[u];
      if (!unitMatchesFaction(unit, p.team, p.targetFaction || 'ENEMY')) continue;
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
        const mult = getDamageMult(p.damageType, unit.armorType || 'DEFAULT');
        // Heal beams / medic: negative baseDamage → restore HP (skip armor invert).
        const dmg =
          p.damage < 0 ? p.damage : p.damage * mult;
        applyDamageToUnit(match, unit, dmg, {
          sourceTeam: p.team,
          fromTurret: !!p.fromTurret,
          sourceBlockId: p.sourceBlockId,
          sourceX: p.prevX,
          sourceY: p.prevY,
        });
        if (dmg > 0) match.stats.damageDealt += dmg;
        hitUnit = true;
        if (pierce > 0) {
          pierce -= 1;
          p.pierceLeft = pierce;
          continue;
        }
        break;
      }
    }
    if (hitUnit && pierce <= 0) p.active = false;
  }
}

function updateBeams(match, dt) {
  if (!match.beams || !match.beams.length) return;
  const units = match.pools.units;
  const next = [];
  for (let i = 0; i < match.beams.length; i++) {
    const b = match.beams[i];
    if (!b.active) continue;
    b.durationLeft -= dt;
    if (b.durationLeft <= 0) continue;

    b.tickAcc += dt;
    while (b.tickAcc >= b.tickInterval) {
      b.tickAcc -= b.tickInterval;
      const cos = Math.cos(b.aimRad);
      const sin = Math.sin(b.aimRad);
      const x1 = b.x0 + cos * b.maxRange;
      const y1 = b.y0 + sin * b.maxRange;

      // First unit along beam (friendly or enemy per targetFaction).
      let bestT = 1.01;
      let bestUnit = null;
      for (let u = 0; u < units.length; u++) {
        const unit = units[u];
        if (!unitMatchesFaction(unit, b.team, b.targetFaction || 'ENEMY')) continue;
        const hit = rayHitsCircle(b.x0, b.y0, x1, y1, unit.x, unit.y, unit.radius + 6);
        if (hit && hit.t < bestT) {
          bestT = hit.t;
          bestUnit = unit;
        }
      }
      if (bestUnit) {
        const mult = getDamageMult(b.damageType, bestUnit.armorType || 'DEFAULT');
        const dmg = b.damage < 0 ? b.damage : b.damage * mult;
        applyDamageToUnit(match, bestUnit, dmg, {
          sourceTeam: b.team,
          fromTurret: !!b.fromTurret,
          sourceBlockId: b.sourceBlockId,
          sourceX: b.x0,
          sourceY: b.y0,
        });
        if (dmg > 0) match.stats.damageDealt += dmg;
      }
    }
    next.push(b);
  }
  match.beams = next;
}

/** Ray-circle: returns {t} in [0,1] if hit. */
function rayHitsCircle(x0, y0, x1, y1, cx, cy, r) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const fx = x0 - cx;
  const fy = y0 - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  let disc = b * b - 4 * a * c;
  if (disc < 0 || a <= 0) return null;
  disc = Math.sqrt(disc);
  const t = (-b - disc) / (2 * a);
  if (t < 0 || t > 1) return null;
  return { t };
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
    if (!block || !blockProjectileSolid(block)) continue;
    // Own-team placeables are a non-collision layer for that team's projectiles
    // (turret/base/player guns pass through walls/turrets/base). Harvest/resources still hit.
    if (block.team === p.team && !block.isHarvest) continue;
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

  // Negative damage = heal (friendly medic / heal beam).
  if (damage < 0) {
    unit.hp = Math.min(unit.maxHp, unit.hp - damage);
    return;
  }

  unit.hp -= damage;

  // Player-team projectile / turret hit → sticky aggro (prefer damaging turret).
  if (
    unit.role === 'enemy' &&
    unit.hp > 0 &&
    ctx.sourceTeam === TEAM.PLAYER
  ) {
    unit.aggroChase = true;
    unit.aiStage = 'engage';
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

    if (b.isHeal && player) {
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

function spawnDrop(match, x, y, itemId, count) {
  const drop = acquireDrop(match.pools);
  if (!drop) {
    addItemToInventory(match.inventory, itemId, count);
    return;
  }
  drop.active = true;
  drop.x = x;
  drop.y = y;
  drop.itemId = itemId;
  drop.itemTypeId = itemId;
  drop.stack = count;
  drop.age = 0;
}

/**
 * Throw entire hotbar slot contents as a world drop (drag-drop outside hotbar).
 * @returns {{ ok: boolean, reason?: string }}
 */
export function throwHotbarSlot(match, slotIndex, worldX, worldY) {
  if (!match || !match.inventory) return { ok: false, reason: 'No inventory' };
  const slot = match.inventory[slotIndex];
  if (!slot || !slot.itemId || slot.count <= 0) {
    return { ok: false, reason: 'Empty slot' };
  }
  const itemId = slot.itemId;
  const count = slot.count;
  const player = getPlayerUnit(match);
  let x = worldX;
  let y = worldY;
  if (typeof x !== 'number' || typeof y !== 'number') {
    if (!player) return { ok: false, reason: 'No player' };
    const ang = player.aimRad || 0;
    x = player.x + Math.cos(ang) * (player.radius + 24);
    y = player.y + Math.sin(ang) * (player.radius + 24);
  }
  spawnDrop(match, x, y, itemId, count);
  match.inventory[slotIndex] = emptySlot();
  match.interactPrompt = `Dropped ${itemId}`;
  return { ok: true };
}

function updateDrops(match, dt) {
  const drops = match.pools.drops;
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    if (!d.active) continue;
    d.age = (d.age || 0) + dt;
    if (d.age >= GAME_PACK.dropExpireSec) d.active = false;
  }
}

function pickupDrops(match) {
  const player = getPlayerUnit(match);
  if (!player) return;
  const drops = match.pools.drops;
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    if (!d.active) continue;
    if (Math.hypot(d.x - player.x, d.y - player.y) > player.radius + 18) continue;
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
    hint = hint || 'LMB: tool (harvest / own walls — not base)';
  }
  if (hint) match.interactPrompt = hint;
}

/**
 * Enemy AI: General pivots + Approach/Engage/Retreat + firearms.
 * Combat target is sticky (pick once, hold) with hysteresis — no per-frame thrash.
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

    let pathGoal = advanceUnitAlongChain(match, e);
    if (!pathGoal) {
      pathGoal = { x: bx, y: by, radius: 160 };
      e.pathGoalX = bx;
      e.pathGoalY = by;
    }

    // Sector Pi: leave sector while attacking → return to path stage (Local General stub).
    const group = match.general && match.general.groups[e.groupId];
    const leftSector =
      group &&
      e.aiStage === 'engage' &&
      !isUnitInsideSector(group, e.x, e.y);
    if (leftSector) {
      e.aiStage = 'approach';
      e.combatTargetKind = null;
      e.combatTargetId = -1;
      e.combatLockTimer = 0;
      const localGoal = applyLocalGeneralStub(match, e, bx, by);
      if (localGoal) pathGoal = localGoal;
    } else {
      const localGoal = applyLocalGeneralStub(match, e, bx, by);
      if (localGoal && e.localGeneral) pathGoal = localGoal;
    }

    const resolved = resolveObstacleOnPath(match, e, pathGoal);
    pathGoal = resolved.goal;
    if (resolved.attackBlock) {
      e.attackBlockId = resolved.attackBlock.id;
    }

    const hpRatio = e.maxHp > 0 ? e.hp / e.maxHp : 1;
    const retreatRatio =
      typeof e.retreatHpRatio === 'number'
        ? e.retreatHpRatio
        : pack.enemyRetreatHpRatio;
    const combatTarget = pickStickyCombatTarget(match, e, player, bx, by, pack, dt);
    let tx = pathGoal.x;
    let ty = pathGoal.y;
    let targetDist = Math.hypot(tx - e.x, ty - e.y);

    if (combatTarget) {
      tx = combatTarget.x;
      ty = combatTarget.y;
      targetDist = combatTarget.dist;
    } else {
      e.combatTargetKind = null;
      e.combatTargetId = -1;
      e.combatLockTimer = 0;
    }

    if (hpRatio <= retreatRatio) {
      e.aiStage = 'retreat';
    } else if (e.aggroChase && combatTarget) {
      // Sticky pursuit after taking player/turret fire — even beyond normal engage radius.
      e.aiStage =
        targetDist <= pack.enemyFireRadius ? 'engage' : 'approach';
    } else if (combatTarget && targetDist <= pack.enemyEngageRadius) {
      e.aiStage = 'engage';
    } else {
      e.aiStage = 'approach';
    }

    const weapon = e.weaponId ? getWeaponDef(e.weaponId) : null;
    const needsReload =
      !!weapon &&
      !weapon.infiniteAmmo &&
      e.ammoInMag <= 0 &&
      e.mags > 0;
    const reloading = e.reloadTimer > 0;
    if (needsReload && !reloading) {
      actions.push({ type: ActionType.RELOAD, unitId: e.id });
    }

    let dx = 0;
    let dy = 0;

    if (e.aiStage === 'approach') {
      if (e.aggroChase && combatTarget) {
        // Approach + light strafe toward sticky combat target.
        e.aiStrafeTimer -= dt;
        if (e.aiStrafeTimer <= 0) {
          e.aiStrafeSign *= -1;
          e.aiStrafeTimer = 0.7 + (e.id % 5) * 0.12;
        }
        const len = targetDist || 1;
        const fx = (tx - e.x) / len;
        const fy = (ty - e.y) / len;
        const sx = -fy * e.aiStrafeSign;
        const sy = fx * e.aiStrafeSign;
        dx = fx * 0.85 + sx * 0.35;
        dy = fy * 0.85 + sy * 0.35;
        const m = Math.hypot(dx, dy) || 1;
        dx /= m;
        dy /= m;
      } else {
        const len = Math.hypot(pathGoal.x - e.x, pathGoal.y - e.y) || 1;
        dx = (pathGoal.x - e.x) / len;
        dy = (pathGoal.y - e.y) / len;
      }
    } else if (e.aiStage === 'engage') {
      e.aiStrafeTimer -= dt;
      if (e.aiStrafeTimer <= 0) {
        e.aiStrafeSign *= -1;
        e.aiStrafeTimer = 0.7 + (e.id % 5) * 0.12;
      }
      const len = targetDist || 1;
      const fx = (tx - e.x) / len;
      const fy = (ty - e.y) / len;
      const sx = -fy * e.aiStrafeSign;
      const sy = fx * e.aiStrafeSign;
      if (e.weaponId) {
        // Non-melee: keep preferred standoff (also vs player-team blocks). Closer while reloading.
        let pref = pack.enemyPreferredRange || 560;
        if (reloading || needsReload) pref *= 0.55;
        let toward = 0;
        if (targetDist > pref * 1.12) toward = 0.55;
        else if (targetDist < pref * 0.88) toward = -0.75;
        else toward = 0;
        dx = fx * toward + sx * 0.75;
        dy = fy * toward + sy * 0.75;
      } else {
        const hold = 0.65;
        dx = fx * hold + sx * 0.55;
        dy = fy * hold + sy * 0.55;
      }
      const m = Math.hypot(dx, dy) || 1;
      dx /= m;
      dy /= m;
    } else {
      let rx = allyX - e.x;
      let ry = allyY - e.y;
      if (allyN <= 1) {
        rx = e.x - tx;
        ry = e.y - ty;
      }
      const len = Math.hypot(rx, ry) || 1;
      dx = rx / len;
      dy = ry / len;
    }

    actions.push({ type: ActionType.MOVE, unitId: e.id, dx, dy });
    actions.push({
      type: ActionType.AIM,
      unitId: e.id,
      aimRad: Math.atan2(ty - e.y, tx - e.x),
    });

    // Fire when armed + in range. Blocking placeables/resources: shoot even while approaching.
    // Aggro chase: also fire once within fire radius while closing in.
    const shootingBlocker =
      combatTarget &&
      combatTarget.kind === 'block' &&
      e.attackBlockId >= 0;
    const aggroInRange = e.aggroChase && targetDist <= pack.enemyFireRadius;
    if (
      e.weaponId &&
      (e.aiStage !== 'approach' || shootingBlocker || aggroInRange) &&
      targetDist <= pack.enemyFireRadius &&
      canFireAmmo(e, weapon)
    ) {
      actions.push({ type: ActionType.FIRE, unitId: e.id });
    }

    // Melee-only bots may contact-damage blockers; ranged keep standoff and shoot.
    if (
      !e.weaponId &&
      combatTarget &&
      combatTarget.kind === 'block' &&
      targetDist < e.radius + 80
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
    if (!best || c.score > best.score) best = c;
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

  const archetype = getArchetypeForWave(waveIndex);
  const weaponId =
    (archetype && archetype.defaultWeapon) ||
    pack.enemyWeaponByWave[
      Math.min(waveIndex, pack.enemyWeaponByWave.length - 1)
    ] ||
    null;

  let unitSeq = 0;
  for (let gi = 0; gi < prepared.length; gi++) {
    const prep = prepared[gi];
    const group = groups[gi];
    if (!group) continue;
    for (let i = 0; i < prep.positions.length; i++) {
      const u = acquireUnit(match.pools);
      if (!u) break;
      const pos = prep.positions[i];
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
      u.archetypeId = archetype ? archetype.id : null;
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
      u.retreatHpRatio =
        (archetype &&
          archetype.aiBehavior &&
          archetype.aiBehavior.retreatHpRatio) != null
          ? archetype.aiBehavior.retreatHpRatio
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
      u.localGeneral = false;
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

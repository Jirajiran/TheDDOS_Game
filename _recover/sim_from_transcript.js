import { ActionType } from './actions.js';
import {
  GAME_PACK,
  ItemKind,
  L3_SIZE,
  PATH_SIZE,
  TEAM,
  WIRE_MELEE_MULT,
  getBlockDef,
  getDamageMult,
  getItemDef,
  getToolHarvestMult,
  getUpgradeRecipe,
  getWeaponDef,
} from './config.js';
import {
  advanceUnitAlongChain,
  attachUnitToGroup,
  createGeneralState,
  registerGroup,
  resolveObstacleOnPath,
  updateGeneralTarget,
} from './general.js';
import {
  addItemToInventory,
  applyStartingLoadout,
  consumeSlotItem,
  createEmptyInventory,
  findWeaponSlotIndex,
  getActiveSlot,
  getWeaponFromSlot,
  isPlaceableSlot,
  isToolSlot,
  isWeaponSlot,
  makeSlotFromItem,
} from './inventory.js';
import { generateWorldObjects, harvestTargetAt } from './mapgen.js';
import {
  blockProjectileSolid,
  blockWalkSolid,
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
  match.placeGhost = null;
  match.interactPrompt = '';
  match.stats = {
    kills: 0,
    shotsFired: 0,
    blocksPlaced: 0,
    resourcesGathered: 0,
    damageDealt: 0,
  };
  match.general = createGeneralState();
  match.factoryQueue = [];

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
  match.respawnTimer = 0;
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
  match.respawnTimer = 0;
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
      tryTurretFire(match, a.turretBlockId, a.aimRad);
      continue;
    }

    const unit = match.pools.units[a.unitId];
    if (!unit || !unit.active) continue;

    if (a.type === ActionType.MOVE) {
      moveIntent[unit.id] = { dx: a.dx, dy: a.dy };
      if (a.dx !== 0 || a.dy !== 0) {
        unit.facingRad = Math.atan2(a.dy, a.dx);
      }
    } else if (a.type === ActionType.AIM) {
      if (unit.role === 'player' && mouseWorld) {
        unit.aimRad = Math.atan2(mouseWorld.y - unit.y, mouseWorld.x - unit.x);
      } else {
        unit.aimRad = a.aimRad;
      }
    } else if (a.type === ActionType.FIRE) {
      tryFire(match, unit);
    } else if (a.type === ActionType.RELOAD) {
      tryReload(match, unit);
    } else if (a.type === ActionType.INTERACT) {
      if (unit.role === 'player') tryInteract(match, unit);
    } else if (a.type === ActionType.HARVEST) {
      if (unit.role === 'player') {
        tryHarvest(
          match,
          unit,
          typeof a.worldX === 'number' ? a.worldX : mouseWorld && mouseWorld.x,
          typeof a.worldY === 'number' ? a.worldY : mouseWorld && mouseWorld.y
        );
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
  }
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
    match.phase = 'setup';
    match.waveCountdown = GAME_PACK.setupPhaseDurationSec;
    match.waveActive = false;
    match.waveIndex = 0;
    placeStarterNearBase(match, block);
  }

  consumeSlotItem(match.inventory, match.activeHotbar, 1);
  const gunIdx = findWeaponSlotIndex(match.inventory, 1);
  if (gunIdx >= 0 && !isPlaceableSlot(getActiveSlot(match.inventory, match.activeHotbar))) {
    match.activeHotbar = gunIdx;
  }
  return true;
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
    detectRadius: blockDef.detectRadius || 400,
    healRadius: blockDef.healRadius || 0,
    healPerSec: blockDef.healPerSec || 0,
    genRate: blockDef.genRate || null,
    genTimer: blockDef.genRate ? blockDef.genRate.intervalSec : 0,
    genStock: 0,
    genStockMax: 64,
    fireCooldown: 0,
    factoryWeaponId: null,
    factoryTimer: 0,
    factoryBusy: false,
    color: blockDef.color,
    team: blockDef.team != null ? blockDef.team : TEAM.PLAYER,
  };
}

function placeStarterNearBase(match, base) {
  const list = GAME_PACK.starterNearBase || [];
  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    const def = getBlockDef(entry.itemId);
    if (!def) continue;
    const gx = base.gx + entry.offsetGx;
    const gy = base.gy + entry.offsetGy;
    if (!canPlaceFootprint(match.occupancy, gx, gy, def.footprint.w, def.footprint.h, null)) {
      continue;
    }
    const block = createPlacedBlock(match, entry.itemId, gx, gy, def);
    registerBlock(match, block);
  }
}

function buildBaseChunk(match, base) {
  const pad = GAME_PACK.baseZonePaddingL3 * L3_SIZE;
  return {
    x: base.x - pad,
    y: base.y - pad,
    w: base.w + pad * 2,
    h: base.h + pad * 2,
    cx: base.x + base.w / 2,
    cy: base.y + base.h / 2,
  };
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
    let bestD = b.detectRadius || 400;
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

function tryInteract(match, unit) {
  const pack = GAME_PACK;
  let best = null;
  let bestD = pack.interactRadius;
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (!b.alive) continue;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const d = Math.hypot(cx - unit.x, cy - unit.y);
    if (d > bestD) continue;
    if (b.canToggle || b.isGen || b.isFactory) {
      best = b;
      bestD = d;
    }
  }
  if (!best) return;

  if (best.canToggle && best.isDoor) {
    // Enemies cannot open — player only reaches here.
    best.isOpen = !best.isOpen;
    match.interactPrompt = best.isOpen ? 'Door open' : 'Door closed';
    return;
  }

  if (best.isGen && best.genRate) {
    if (best.genStock > 0) {
      const left = addItemToInventory(
        match.inventory,
        best.genRate.itemId,
        best.genStock
      );
      const taken = best.genStock - left;
      best.genStock = left;
      match.stats.resourcesGathered += taken;
      match.interactPrompt = `Took ${taken} ${best.genRate.itemId}`;
    } else {
      match.interactPrompt = `${best.label || best.itemId}: 0 stock · ${Math.ceil(best.genTimer)}s`;
    }
    return;
  }

  if (best.isFactory) {
    interactFactory(match, best);
  }
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
  const target = harvestTargetAt(match, wx, wy);
  if (!target) return;
  const d = Math.hypot(
    target.x + target.w / 2 - unit.x,
    target.y + target.h / 2 - unit.y
  );
  if (d > GAME_PACK.interactRadius + 40) return;

  const mult = getToolHarvestMult(def.toolTier || 'TIER0', target.harvestKind);
  if (mult <= 0) {
    match.interactPrompt = 'Wrong tool tier';
    return;
  }
  const dmg = (def.harvestDamage || 20) * mult;
  applyDamageToBlock(match, target, dmg, 'DEFAULT');
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
    tickReload(slot, def, dt);
  }
  const units = match.pools.units;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active || u.role !== 'enemy' || !u.weaponId) continue;
    tickReload(u, getWeaponDef(u.weaponId), dt);
  }
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
      applyDamageToBlock(match, hitBlock, p.damage, p.damageType);
      p.active = false;
      continue;
    }

    let pierce = p.pierceLeft | 0;
    let hitUnit = false;
    for (let u = 0; u < units.length; u++) {
      const unit = units[u];
      if (!unit.active || unit.team === p.team) continue;
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
        const dmg = p.damage * mult;
        applyDamageToUnit(match, unit, dmg);
        match.stats.damageDealt += dmg;
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
    const block = getBlock(match, owner);
    if (!block || !blockProjectileSolid(block)) continue;
    return block;
  }
  return null;
}

function applyDamageToBlock(match, block, baseDamage, damageType) {
  if (!block || !block.alive) return;
  let mult = getDamageMult(damageType, block.armorType || 'DEFAULT');
  if (block.isWire && damageType === 'DEFAULT') {
    mult *= WIRE_MELEE_MULT;
  }
  const dmg = baseDamage * mult;
  block.hp -= dmg;
  match.stats.damageDealt += dmg;
  if (block.hp <= 0) {
    destroyBlock(match, block);
  }
}

function destroyBlock(match, block) {
  if (!block || !block.alive) return;
  block.alive = false;
  block.hp = 0;
  clearFootprint(match.occupancy, block.gx, block.gy, block.fw, block.fh);

  if (block.isHarvest && block.dropItemId) {
    spawnDrop(match, block.x + block.w / 2, block.y + block.h / 2, block.dropItemId, block.dropCount);
  }

  if (block.isDefeatCondition) {
    match.base = block;
  }
}

function applyDamageToUnit(match, unit, damage) {
  if (!unit || !unit.active) return;
  unit.hp -= damage;
  if (unit.hp > 0) return;

  unit.hp = 0;
  if (unit.role === 'enemy') {
    match.enemiesAlive = Math.max(0, match.enemiesAlive - 1);
    match.stats.kills += 1;
  }
  if (unit.role === 'player') {
    match.playerDead = true;
    const pack = GAME_PACK;
    const wave = Math.max(1, match.waveIndex);
    match.respawnTimer =
      pack.respawnBaseSec + (wave - 1) * pack.respawnExtraPerWave;
  }
  deactivateUnit(unit);
}

function updateBlockSystems(match, dt) {
  const player = getPlayerUnit(match);
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (!b.alive) continue;

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
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const d = Math.hypot(cx - player.x, cy - player.y);
    if (d > pack.interactRadius) continue;
    if (b.isDoor) hint = `E: ${b.isOpen ? 'Close' : 'Open'} door`;
    else if (b.isGen) hint = `E: Gen ${b.genStock || 0} ${b.genRate ? b.genRate.itemId : ''}`;
    else if (b.isFactory) hint = 'E: Factory upgrade';
  }
  const slot = getActiveSlot(match.inventory, match.activeHotbar);
  if (isToolSlot(slot) && match.gameMode === 'WORLD_TYPE') {
    hint = hint || 'LMB: harvest with tool';
  }
  if (hint) match.interactPrompt = hint;
}

/**
 * Enemy AI: General pivots + Approach/Engage/Retreat + firearms.
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
      pathGoal = { x: bx, y: by, radius: 80 };
      e.pathGoalX = bx;
      e.pathGoalY = by;
    }
    const resolved = resolveObstacleOnPath(match, e, pathGoal);
    pathGoal = resolved.goal;
    if (resolved.attackBlock) {
      e.attackBlockId = resolved.attackBlock.id;
    }

    const hpRatio = e.maxHp > 0 ? e.hp / e.maxHp : 1;
    let tx = pathGoal.x;
    let ty = pathGoal.y;
    let combatTarget = null;
    let targetDist = Math.hypot(tx - e.x, ty - e.y);

    // Prefer attack blocking placeable when stuck
    if (e.attackBlockId >= 0) {
      const blk = getBlock(match, e.attackBlockId);
      if (blk && blk.alive) {
        combatTarget = {
          x: blk.x + blk.w / 2,
          y: blk.y + blk.h / 2,
          kind: 'block',
          block: blk,
        };
        targetDist = Math.hypot(combatTarget.x - e.x, combatTarget.y - e.y);
        tx = combatTarget.x;
        ty = combatTarget.y;
      } else {
        e.attackBlockId = -1;
      }
    }

    if (player) {
      const pd = Math.hypot(player.x - e.x, player.y - e.y);
      if (pd < pack.enemyEngageRadius) {
        combatTarget = { x: player.x, y: player.y, kind: 'unit', unit: player };
        tx = player.x;
        ty = player.y;
        targetDist = pd;
      }
    }

    // Also engage base when close
    const bd = Math.hypot(bx - e.x, by - e.y);
    if (!combatTarget && bd < pack.enemyEngageRadius * 0.7) {
      combatTarget = { x: bx, y: by, kind: 'base' };
      tx = bx;
      ty = by;
      targetDist = bd;
    }

    if (hpRatio <= pack.enemyRetreatHpRatio) {
      e.aiStage = 'retreat';
    } else if (combatTarget && targetDist <= pack.enemyEngageRadius) {
      e.aiStage = 'engage';
    } else {
      e.aiStage = 'approach';
    }

    let dx = 0;
    let dy = 0;

    if (e.aiStage === 'approach') {
      const len = Math.hypot(pathGoal.x - e.x, pathGoal.y - e.y) || 1;
      dx = (pathGoal.x - e.x) / len;
      dy = (pathGoal.y - e.y) / len;
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
      const hold = e.weaponId ? 0.45 : 0.65;
      dx = fx * hold + sx * 0.55;
      dy = fy * hold + sy * 0.55;
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

    // Fire via same pipeline when armed + in range
    if (
      e.weaponId &&
      e.aiStage !== 'approach' &&
      targetDist <= pack.enemyFireRadius &&
      canFireAmmo(e, getWeaponDef(e.weaponId))
    ) {
      actions.push({ type: ActionType.FIRE, unitId: e.id });
    }

    // Melee damage to blocking block when touching
    if (
      combatTarget &&
      combatTarget.kind === 'block' &&
      targetDist < e.radius + 40
    ) {
      applyDamageToBlock(match, combatTarget.block, pack.enemyContactDps * dt, 'DEFAULT');
    }
  }

  return actions;
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
      applyDamageToBlock(match, base, pack.enemyBaseContactDps * dt, 'DEFAULT');
    }
  }
}

function updateWaves(match, dt) {
  const pack = GAME_PACK;
  if (!match.basePlaced || !match.base || !match.base.alive) return;

  if (match.waveActive) {
    if (match.enemiesAlive <= 0) {
      match.waveActive = false;
      if (match.waveIndex >= pack.targetWaveToWin) {
        match.outcome = 'win';
        return;
      }
      match.phase = 'between';
      match.waveCountdown = pack.waveCountdownSec;
    }
    return;
  }

  match.waveCountdown -= dt;
  if (match.waveCountdown > 0) return;

  match.waveIndex += 1;
  spawnWave(match, match.waveIndex);
  match.waveActive = true;
  match.phase = 'wave';
  match.waveCountdown = 0;
}

function spawnWave(match, waveIndex) {
  const pack = GAME_PACK;
  const count =
    pack.enemiesPerWaveBase + Math.max(0, waveIndex - 1) * pack.enemiesPerWaveScale;
  match.enemiesAlive = 0;

  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push(pickSpawnOutsideBaseChunk(match, i, count));
  }

  const base = match.base;
  const tx = base.x + base.w / 2;
  const ty = base.y + base.h / 2;
  const group = registerGroup(match, positions, tx, ty);

  const weaponId =
    pack.enemyWeaponByWave[
      Math.min(waveIndex, pack.enemyWeaponByWave.length - 1)
    ] || null;

  for (let i = 0; i < count; i++) {
    const u = acquireUnit(match.pools);
    if (!u) break;
    const pos = positions[i];
    u.active = true;
    u.typeId = 2;
    u.team = TEAM.ENEMY;
    u.role = 'enemy';
    u.maxHp = pack.enemyMaxHp + waveIndex * 4;
    u.hp = u.maxHp;
    u.speed = pack.enemySpeed;
    u.radius = pack.enemyRadius;
    u.armorType = pack.enemyArmorType;
    u.weaponId = weaponId;
    if (weaponId) {
      Object.assign(u, createAmmoState(weaponId));
      // Enemies get spare mags for V1
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
    u.fireCooldown = 0;
    u.aiStage = 'approach';
    u.aiStrafeSign = i % 2 === 0 ? 1 : -1;
    u.aiStrafeTimer = 0.4 + (i % 4) * 0.15;
    u.attackBlockId = -1;
    attachUnitToGroup(group, u);
    match.enemiesAlive += 1;
  }
}

function pickSpawnOutsideBaseChunk(match, index, total) {
  const { world, baseChunk, base } = match;
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

  if (pointInRectExpanded(x, y, zone, 0)) {
    const dx = x - zone.cx;
    const dy = y - zone.cy;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX > absY) {
      x = dx >= 0 ? zone.x + zone.w + margin : zone.x - margin;
    } else {
      y = dy >= 0 ? zone.y + zone.h + margin : zone.y - margin;
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

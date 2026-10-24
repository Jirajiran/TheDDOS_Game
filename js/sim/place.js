import { playSfx } from '../audio/sfx.js';
import {
  attachAreaTriggerFromDef,
} from '../combat/areaTriggers.js';
import {
  GAME_PACK,
  getBalancePack,
  L3_SIZE,
  PATH_SIZE,
  TEAM,
  deriveCollisionLayer,
  getBlockDef,
} from '../config.js';
import {
  consumeSlotItem,
  getActiveSlot,
  isPlaceableSlot,
} from '../player/inventory.js';
import {
  canPlaceFootprint,
  l3OriginWorld,
  markFootprint,
  snapWorldToL3Origin,
  unitStandingCells,
} from '../world/occupancy.js';
import {
  footprintHitsEdgePath,
  refreshEdgeAreas,
} from '../world/world.js';
import { rebuildTerritories } from './territory.js';
import {
  cutUnitVisualAction,
  UNIT_VISUAL_ACTIONS,
} from '../view/unitVisual.js';
import {
  ensureBlackboardStub,
} from '../combat/taunt.js';
import {
  applyBaseChunkPipeMask,
  buildBaseChunk,
  ensureBaseStorage,
  initGeneratorList,
  registerBlock,
  syncBaseStorageFromGenerators,
} from './block.js';
import {
  getPlayerUnit,
  resolveUnitInventory,
} from './unit.js';
export function updatePlaceGhost(match, mouseWorld) {
  match.placeGhost = null;
  if (!mouseWorld) return null;
  const slot = getActiveSlot(match.inventory, match.activeHotbar);
  if (!isPlaceableSlot(slot)) return null;

  const blockDef = getBlockDef(slot.itemId);
  if (!blockDef) return null;

  const fw = blockDef.footprint.w;
  const fh = blockDef.footprint.h;
  const player = getPlayerUnit(match);
  let aimX = mouseWorld.x;
  let aimY = mouseWorld.y;
  if (player) {
    const cells = GAME_PACK.placeMaxCells > 0 ? GAME_PACK.placeMaxCells : 3;
    const maxR = cells * L3_SIZE;
    const dx = aimX - player.x;
    const dy = aimY - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR && dist > 0) {
      const scale = maxR / dist;
      aimX = player.x + dx * scale;
      aimY = player.y + dy * scale;
    }
  }
  const snapped = snapWorldToL3Origin(aimX, aimY);
  const ox = snapped.gx - Math.floor(fw / 2);
  const oy = snapped.gy - Math.floor(fh / 2);
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

export function tryPlaceFromAction(match, unit, a) {
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

export function tryPlace(match, unit, gx, gy) {
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
  if (footprintHitsEdgePath(match.world, gx, gy, fw, fh)) return false;
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
    refreshEdgeAreas(match);
    match.phase = 'setup';
    match.waveCountdown = getBalancePack().setupPhaseDurationSec;
    match.waveActive = false;
    match.waveIndex = 0;
    match.interactPrompt = 'Base placed — setup started';
    // Turret + resource gen are inherent BaseBlock systems — no free starter blocks.
  }
  if (block.isDefeatCondition || block.isTurret || block.isGen) {
    rebuildTerritories(match);
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

  // Visual one-shot — arm tween only; no effect on place rules.
  cutUnitVisualAction(
    unit,
    UNIT_VISUAL_ACTIONS.PlaceBlock,
    GAME_PACK.unitVisualPlaceBlockSec != null
      ? GAME_PACK.unitVisualPlaceBlockSec
      : 0.1
  );
  playSfx('world.place');
  return true;
}

export function createPlacedBlock(match, itemId, gx, gy, blockDef, opts = {}) {
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
    /** One delayed turret shot. Released by tickMuzzleLead. */
    muzzlePending: false,
    muzzleLeadT: 0,
    muzzleAimRad: 0,
    muzzleWeaponId: null,
    muzzleSimTime: 0,
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

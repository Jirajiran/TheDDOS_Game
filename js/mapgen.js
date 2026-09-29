import { GAME_PACK, L3_SIZE, getBlockDef, deriveCollisionLayer } from './config.js';
import {
  canPlaceFootprint,
  l3OriginWorld,
  markFootprint,
  worldToL3,
} from './occupancy.js';

/**
 * World Type lite — place trees/stone/ore per Path via % / modulo.
 * Flat mode skips this entirely.
 */
export function generateWorldObjects(match) {
  match.worldObjects = match.worldObjects || [];
  if (match.gameMode !== 'WORLD_TYPE') return;

  const pack = GAME_PACK;
  const quotas = pack.worldGenPerPath;
  const { world, occupancy } = match;
  const cellsPerSide = Math.round(world.pathSize / L3_SIZE); // 16
  /** Leave center clear for Base 5×5 + pad on 16×16. */
  const centerClear = Math.max(4, Math.ceil((pack.baseFootprintL3 || 5) / 2) + 2);

  for (let pi = 0; pi < world.paths.length; pi++) {
    const path = world.paths[pi];
    placeQuota(match, path, 'OBJ_TREE', quotas.trees, cellsPerSide, 17 + pi * 3, centerClear);
    placeQuota(match, path, 'OBJ_STONE', quotas.stones, cellsPerSide, 41 + pi * 5, centerClear);
    placeQuota(match, path, 'OBJ_ORE', quotas.ores, cellsPerSide, 73 + pi * 7, centerClear);
  }
}

function placeQuota(match, path, blockId, count, cellsPerSide, seed, centerClear) {
  const def = getBlockDef(blockId);
  if (!def || count <= 0) return;
  const fw = def.footprint.w;
  const fh = def.footprint.h;
  let placed = 0;
  const maxTries = count * 48;
  const mid = (cellsPerSide - 1) * 0.5;
  const clear = centerClear || 4;
  for (let t = 0; t < maxTries && placed < count; t++) {
    // Deterministic scatter: modulo + larger stride mix for 16×16
    const n = (seed * 1103515245 + t * 12345 + t * t * 7) >>> 0;
    const lx = n % cellsPerSide;
    const ly = ((n / cellsPerSide) | 0) % cellsPerSide;
    // Skip center band so Base 5×5 (+ pad) has room
    if (Math.abs(lx - mid) <= clear && Math.abs(ly - mid) <= clear) continue;
    const gx = Math.floor(path.x / L3_SIZE) + lx;
    const gy = Math.floor(path.y / L3_SIZE) + ly;
    if (!canPlaceFootprint(match.occupancy, gx, gy, fw, fh, null)) continue;
    spawnWorldBlock(match, blockId, gx, gy);
    placed += 1;
  }
}

export function spawnWorldBlock(match, itemId, gx, gy) {
  const def = getBlockDef(itemId);
  if (!def) return null;
  const fw = def.footprint.w;
  const fh = def.footprint.h;
  const blockId = match.occupancy.nextBlockId++;
  markFootprint(match.occupancy, gx, gy, fw, fh, blockId);
  const origin = l3OriginWorld(gx, gy);
  const block = {
    id: blockId,
    itemId,
    typeId: def.typeId,
    gx,
    gy,
    fw,
    fh,
    x: origin.x,
    y: origin.y,
    w: fw * L3_SIZE,
    h: fh * L3_SIZE,
    hp: def.maxHp,
    maxHp: def.maxHp,
    armorType: def.armorType,
    alive: true,
    isDefeatCondition: false,
    isHarvest: !!def.isHarvest,
    harvestKind: def.harvestKind || null,
    dropItemId: def.dropItemId || null,
    dropCount: def.dropCount || 0,
    walkSolid: def.walkSolid !== false,
    projectileSolid: !def.allowProjectilePass,
    allowProjectilePass: !!def.allowProjectilePass,
    isOpen: false,
    color: def.color,
    team: def.team,
    pierceCost: typeof def.pierceCost === 'number' ? def.pierceCost : 1,
    collisionLayer: deriveCollisionLayer({
      team: def.team,
      isHarvest: !!def.isHarvest,
      collisionLayer: def.collisionLayer,
    }),
  };
  match.blocks.push(block);
  match.worldObjects.push(block);
  return block;
}

/** Resolve harvest cell under cursor / unit facing (L3). */
export function harvestTargetAt(match, worldX, worldY) {
  const { gx, gy } = worldToL3(worldX, worldY);
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (!b.alive || !b.isHarvest) continue;
    if (gx >= b.gx && gx < b.gx + b.fw && gy >= b.gy && gy < b.gy + b.fh) {
      return b;
    }
  }
  return null;
}

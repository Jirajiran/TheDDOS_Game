import {
  GAME_PACK,
  getBalancePack,
  L3_SIZE,
  TEAM,
  WIRE_MELEE_MULT,
  getItemDef,
  getUpgradeRecipe,
} from '../config.js';
import {
  buildBaseChunkNavPoints,
  clearBaseChunkL1Mask,
  maskBaseChunkL1Pipes,
} from '../ai/general.js';
import {
  addItemToInventory,
  consumeSlotItem,
  getActiveSlot,
  isToolSlot,
  isWeaponSlot,
} from '../player/inventory.js';
import {
  clearFootprint,
} from '../world/occupancy.js';
import { playSfx } from '../audio/sfx.js';
import { refreshEdgeAreas } from '../world/world.js';
import { rebuildTerritories } from './territory.js';
import {
  ejectDropTowardPlayer,
  spawnDrop,
} from './drops.js';
import {
  scaledHitDamage,
} from './fire.js';
import {
  getPlayerUnit,
  slewAngle,
} from './unit.js';
export function getBlock(match, id) {
  return match.blockById[id] || null;
}

export function registerBlock(match, block) {
  match.blocks.push(block);
  match.blockById[block.id] = block;
}

export function initGeneratorList(list) {
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

export function ensureBaseStorage(block) {
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

export function syncBaseStorageFromGenerators(block) {
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

export function buildBaseChunk(match, base) {
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

export function applyBaseChunkPipeMask(match) {
  if (!match.baseChunk) {
    clearBaseChunkL1Mask(match);
    return;
  }
  const mask = maskBaseChunkL1Pipes(match.world, match.baseChunk);
  match.pathPipeMask = mask;
  match.baseChunk.navPoints = mask.navPoints;
}

export function distToBlockAABB(px, py, b) {
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

export function tryInteract(match, unit) {
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

export function aabbRayExitDist(hw, hh, cos, sin) {
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

export function findBlockById(match, blockId) {
  if (!match || blockId == null) return null;
  for (let i = 0; i < match.blocks.length; i++) {
    if (match.blocks[i].id === blockId) return match.blocks[i];
  }
  return null;
}

export function interactFactory(match, factory) {
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

export function updateFactory(match, dt) {
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

export function applyDamageToBlock(match, block, baseDamage, damageType, ctx = {}) {
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

  // Pierce vs resources: still pays pierce cost / HP, but heal-style negative ignored.
  if (baseDamage < 0) return;
  const hpBefore = block.hp;
  let dmg = scaledHitDamage(
    baseDamage,
    damageType,
    block.armorType || 'DEFAULT'
  );
  if (block.isWire && damageType === 'DEFAULT') {
    dmg *= WIRE_MELEE_MULT;
  }
  block.hp -= dmg;
  if (ctx.impact && dmg > 0 && hpBefore > 0) playSfx('combat.hit');
  match.stats.damageDealt += dmg;
  if (block.hp <= 0) {
    destroyBlock(match, block, { skipLoot: skipLoot && !!block.isHarvest });
  }
}

export function destroyBlock(match, block, opts = {}) {
  if (!block || !block.alive) return;
  block.alive = false;
  playSfx('world.broken');
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
    refreshEdgeAreas(match);
    const loseMode = getBalancePack().loseMode === 2 ? 2 : 1;
    if (loseMode !== 2 && !match.outcome) match.outcome = 'lose';
  }
  if (block.isDefeatCondition || block.isTurret || block.isGen) {
    rebuildTerritories(match);
  }
}

export function updateBlockSystems(match, dt) {
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

export function updateInteractPrompt(match) {
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

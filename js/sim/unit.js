import {
  AI_EVENT_BOOSTS,
  AI_GOAL_BASE_WEIGHTS,
  AI_GOAL_TO_STAGE,
  AI_LOCAL_PATH,
  GAME_PACK,
  getBalancePack,
  L3_SIZE,
  TEAM,
  TURRET_DOGPILE_K,
  deriveCollisionLayer,
  getSenseRadiusPx,
  getWeaponDef,
} from '../config.js';
import {
  advanceUnitAlongChain,
  isUnitInsideSector,
  updateGeneralTarget,
} from '../ai/general.js';
import {
  applyLocalPathLayer,
  writeGeneralPathToBlackboard,
} from '../ai/local_group_manager.js';
import { territoryWalkGoal } from './territory.js';
import { marchIntoBaseChunk } from './march.js';
import { huntAreaGoal } from './huntArea.js';
import {
  equipArmorOnUnit,
  equipShieldOnUnit,
  ejectBrokenBasicShield,
  getArmorDamageReduction,
} from '../player/inventory.js';
import {
  ensureMeleeSwing,
} from '../combat/meleeTools.js';
import {
  ensureUnitMorale,
  getPassiveDamageReduction,
  noteMoralePressure,
} from '../combat/morale.js';
import {
  resolveUnitVsOccupancy,
} from '../world/occupancy.js';
import {
  acquireUnit,
  clearMuzzleQueue,
  deactivateUnit,
} from '../world/pools.js';
import { pickPlayerSpawnPoint } from '../defs/spawnPolicy.js';
import {
  absorbDamageWithShield,
} from '../combat/shield.js';
import {
  ensureUnitSkills,
} from '../combat/skills.js';
import { ensureBlackboard, TargetKind } from '../ai/blackboard.js';
import {
  isHostileTeam,
  queryHostileInSense,
  registerSenseUnit,
  syncSenseIndexPositions,
  unregisterSenseUnit,
} from '../ai/senseIndex.js';
import { playSfx } from '../audio/sfx.js';
import { noteHitEvent } from '../ai/events.js';
import { decideUnitViaMediator } from '../ai/mediator.js';
import {
  ensureBlackboardStub,
} from '../combat/taunt.js';
import {
  canFireAmmo,
  createAmmoState,
} from '../combat/weapons.js';
import {
  applyDamageToBlock,
  getBlock,
} from './block.js';
import {
  clamp,
  pointInRectExpanded,
} from './geom.js';
import {
  tryPlace,
} from './place.js';
import {
  UNIT_VISUAL_ACTIONS,
} from '../view/unitVisual.js';
export function spawnPlayerNearWorldCenter(match) {
  const pack = getBalancePack();
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

  resetPlayerStats(u, pack, match);
  u.skinGroupId =
    match.playerSkinGroupId ||
    (pack && pack.playerDefaultSkinGroupId) ||
    'Default_skin_1';
  const start = pickPlayerSpawnPoint(world);
  u.x = start.x;
  u.y = start.y;
  match.playerDead = false;
  match.cameraFreeFly = false;
  match.respawnTimer = 0;
  match.cameraSnapPending = true;
  registerSenseUnit(match, u);
  return u;
}

export function resetPlayerStats(u, pack, match) {
  const bal = pack || getBalancePack();
  u.active = true;
  u.typeId = 1;
  u.team = TEAM.PLAYER;
  u.role = 'player';
  u.collisionLayer = deriveCollisionLayer({ team: TEAM.PLAYER, role: 'player' });
  u.pierceCost = 1;
  u.maxHp = bal.playerMaxHp;
  u.hp = bal.playerMaxHp;
  u.speed = bal.playerSpeed;
  u.radius = bal.playerRadius;
  u.armorType = bal.playerArmorType;
  const weaponId = match && match.startingWeaponId;
  u.weaponId = weaponId || null;
  u.vx = 0;
  u.vy = 0;
  u.facingRad = 0;
  u.aimRad = 0;
  u.targetAimRad = 0;
  u.targetFacingRad = 0;
  u.fireCooldown = 0;
  clearMuzzleQueue(u);
  u.aiStage = 'approach';
  u.groupId = -1;
  u.pivotIndex = 0;
  u.attackBlockId = -1;
  if (weaponId) Object.assign(u, createAmmoState(weaponId));
  ensureUnitMorale(u);
  ensureBlackboardStub(u);
  u.skillIds = Array.isArray(bal.playerActiveSkills)
    ? bal.playerActiveSkills.slice()
    : ['FIST', 'SELF_HEAL'];
  ensureUnitSkills(u);
  ensureMeleeSwing(u);
  u.skillSpeedMult = 1;
  u.shield = null;
  u.tauntTimer = 0;
  u.tauntedById = -1;
  const armorSlot = match && match.wornArmorSlot >= 0 ? match.wornArmorSlot : -1;
  const armorItem =
    armorSlot >= 0 && match.inventory && match.inventory[armorSlot]
      ? match.inventory[armorSlot].itemId
      : null;
  if (armorItem) equipArmorOnUnit(u, armorItem);
  else u.activeArmorId = null;
  const shieldSlot =
    match && match.wornShieldSlot >= 0 ? match.wornShieldSlot : -1;
  const shieldItem =
    shieldSlot >= 0 && match.inventory && match.inventory[shieldSlot]
      ? match.inventory[shieldSlot].itemId
      : null;
  if (shieldItem) equipShieldOnUnit(u, shieldItem);
  else u.activeShieldId = null;
  u.skinGroupId = null; // filled by spawn after match.playerSkinGroupId exists
  u.visualAction = UNIT_VISUAL_ACTIONS.idle;
  u.visualActionPrev = UNIT_VISUAL_ACTIONS.idle;
  u.visualActionT = 0;
  u.armTweenT = 0;
  u.armTweenDur = 0;
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

  resetPlayerStats(u, pack, match);
  u.skinGroupId =
    match.playerSkinGroupId ||
    (pack && pack.playerDefaultSkinGroupId) ||
    'Default_skin_1';
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
  registerSenseUnit(match, u);
  return u;
}

export function getPlayerUnit(match) {
  if (!match || match.playerUnitId < 0) return null;
  const u = match.pools.units[match.playerUnitId];
  return u && u.active && u.role === 'player' ? u : null;
}

export function resolveUnitInventory(match, unit) {
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

export function slewAngle(current, target, rateRadPerSec, dt) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const maxStep = Math.max(0, rateRadPerSec) * dt;
  if (Math.abs(diff) <= maxStep) return target;
  return current + Math.sign(diff) * maxStep;
}

export function integrateUnitMotion(match, dt) {
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

export function separateUnits(match) {
  const units = match.pools.units;
  const active = [];
  for (let i = 0; i < units.length; i++) {
    if (units[i].active) active.push(units[i]);
  }
  // Stronger soft push so AI squads do not death-ball into one cell.
  const soft = Math.max(
    0.65,
    GAME_PACK.unitPushSeparation != null ? GAME_PACK.unitPushSeparation : 0.4
  );
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const minDist = a.radius + b.radius + 4;
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

export function clampUnitInWorld(u, world) {
  u.x = clamp(u.x, u.radius, world.worldW - u.radius);
  u.y = clamp(u.y, u.radius, world.worldH - u.radius);
}

export function applyDamageToUnit(match, unit, damage, ctx = {}) {
  if (!unit || !unit.active) return;
  const hpBefore = unit.hp;

  // Negative damage = heal (friendly medic / heal beam / heal pad).
  if (damage < 0) {
    unit.hp = Math.min(unit.maxHp, unit.hp - damage);
    return;
  }

  let dmg = damage;
  let shieldHit = false;
  if (!ctx.skipShield && unit.shield) {
    const abs = absorbDamageWithShield(unit, dmg);
    dmg = abs.leftover;
    shieldHit = abs.absorbed > 0;
    if (abs.broke) ejectBrokenBasicShield(match, unit);
  }
  if (dmg <= 0) {
    if (ctx.impact && shieldHit) playSfx('combat.hit.shield');
    return;
  }

  const reduction = getPassiveDamageReduction(unit);
  if (reduction > 0) dmg *= 1 - reduction;
  const armorRed = getArmorDamageReduction(unit);
  if (armorRed > 0) dmg *= 1 - armorRed;

  unit.hp -= dmg;
  if (ctx.impact && dmg > 0) playSfx('combat.hit.body');
  noteMoralePressure(unit, 2);

  // Hostile-team hit → sticky aggro (any hostile team, not Player-hardcoded).
  if (
    unit.role !== 'player' &&
    unit.hp > 0 &&
    ctx.sourceTeam != null &&
    isHostileTeam(match, unit.team, ctx.sourceTeam)
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
    const srcId = ctx.sourceUnitId != null ? ctx.sourceUnitId | 0 : -1;
    const srcUnit =
      srcId >= 0 && match.pools && match.pools.units[srcId]
        ? match.pools.units[srcId]
        : null;
    if (srcUnit && srcUnit.active) {
      unit.combatTargetKind = 'unit';
      unit.combatTargetId = srcUnit.id;
      unit.combatLockTimer = 8;
      unit.targetAimRad = Math.atan2(srcUnit.y - unit.y, srcUnit.x - unit.x);
    } else if (typeof ctx.sourceX === 'number') {
      unit.targetAimRad = Math.atan2(ctx.sourceY - unit.y, ctx.sourceX - unit.x);
    }
  }

  if (unit.hp > 0) return;

  unit.hp = 0;
  if (hpBefore > 0) playSfx('combat.death');
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
  unregisterSenseUnit(match, unit);
  deactivateUnit(unit);
}

/** AI-controlled unit (not the human input seat). Hostility is Team-based. */
export function isAiControlledUnit(unit) {
  return !!(unit && unit.active && unit.role !== 'player');
}

function teamCentroidMap(units) {
  const map = Object.create(null);
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!isAiControlledUnit(u)) continue;
    const t = u.team | 0;
    if (!map[t]) map[t] = { x: 0, y: 0, n: 0 };
    map[t].x += u.x;
    map[t].y += u.y;
    map[t].n += 1;
  }
  const keys = Object.keys(map);
  for (let k = 0; k < keys.length; k++) {
    const row = map[keys[k]];
    if (row.n > 0) {
      row.x /= row.n;
      row.y /= row.n;
    }
  }
  return map;
}

function idleWorldGoal(match, unit) {
  const world = match.world;
  if (world && world.worldW > 0) {
    // Spread idle goals on a ring so bots do not all path to one world center.
    const cx = world.worldW * 0.5;
    const cy = world.worldH * 0.5;
    const ang = ((unit.id * 2.399963) % (Math.PI * 2));
    const ring = 140 + (unit.id % 6) * 48;
    return {
      x: cx + Math.cos(ang) * ring,
      y: cy + Math.sin(ang) * ring,
      radius: 96,
    };
  }
  return { x: unit.x, y: unit.y, radius: 80 };
}

/**
 * Bot brain tick — Mediator + path prep.
 * Base is a high-value target when present/hostile, NOT a hard on/off for thinking.
 * Editor Areas are collider/spawn settings — not auto patrol / shoot targets.
 */
export function decideEnemyActions(match, dt) {
  const actions = [];
  if (!match || match.outcome) return actions;
  const pack = getBalancePack();
  const baseAlive = !!(match.base && match.base.alive);

  syncSenseIndexPositions(match);

  const player = getPlayerUnit(match);
  const base = match.base;
  let globalBx = null;
  let globalBy = null;
  if (baseAlive) {
    globalBx = base.x + base.w / 2;
    globalBy = base.y + base.h / 2;
    updateGeneralTarget(match, globalBx, globalBy);
  }

  const units = match.pools.units;
  const centroids = teamCentroidMap(units);

  for (let i = 0; i < units.length; i++) {
    const e = units[i];
    if (!isAiControlledUnit(e)) continue;

    ensureBlackboard(e);

    const teamRow = centroids[e.team | 0];
    const allyX = teamRow ? teamRow.x : e.x;
    const allyY = teamRow ? teamRow.y : e.y;
    const allyN = teamRow ? teamRow.n : 1;

    const hostileBase =
      baseAlive && isHostileTeam(match, e.team, base.team) ? base : null;
    let bx = hostileBase ? globalBx : null;
    let by = hostileBase ? globalBy : null;

    let pathGoal = null;
    let marchBlock = null;
    let holdGoal = false;
    if (hostileBase && match.baseChunk) {
      const march = marchIntoBaseChunk(match, e);
      if (march) {
        pathGoal = march.goal;
        marchBlock = march.attackBlock;
        holdGoal = true;
      }
    }
    if (!pathGoal) {
      pathGoal = advanceUnitAlongChain(match, e);
    }
    if (!pathGoal && !hostileBase) {
      pathGoal = huntAreaGoal(match, e);
      if (pathGoal) holdGoal = true;
      if (!pathGoal) {
        // FlatLand rim / territory only — do NOT hard-walk Editor mapAreas.
        pathGoal = territoryWalkGoal(match, e) || nextOpenEdgeGoal(match, e);
      }
    }
    if (!pathGoal) {
      pathGoal = hostileBase
        ? { x: bx, y: by, radius: 160 }
        : idleWorldGoal(match, e);
      e.pathGoalX = pathGoal.x;
      e.pathGoalY = pathGoal.y;
    }
    const group = match.general && match.general.groups[e.groupId];
    writeGeneralPathToBlackboard(e, group, pathGoal);

    const leftSector =
      group &&
      e.aiStage === 'engage' &&
      !isUnitInsideSector(group, e.x, e.y);
    if (leftSector) {
      e.combatTargetKind = null;
      e.combatTargetId = -1;
      e.combatLockTimer = 0;
    }

    const local = applyLocalPathLayer(match, e, pathGoal, {
      baseX: bx,
      baseY: by,
      leftSector: !!leftSector,
      config: AI_LOCAL_PATH,
      holdGoal,
      attackBlock: marchBlock,
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
      e.combatTargetEnum = null;
      e.combatLockTimer = 0;
      // Drop sticky engage so Mediator returns to REACH_PATH_GOAL (walk, no shoot).
      e.aggroChase = false;
      e.aggroBlockId = -1;
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

    if (
      !e.weaponId &&
      combatTarget &&
      combatTarget.kind === 'block' &&
      combatTarget.block &&
      combatTarget.dist < e.radius + 80
    ) {
      applyDamageToBlock(
        match,
        combatTarget.block,
        pack.enemyContactDps * dt,
        'DEFAULT',
        { sourceTeam: e.team, damageKind: 'CONTACT' }
      );
    }
  }

  return actions;
}

function nextOpenEdgeGoal(match, unit) {
  // Only FlatLand handmade rim — Editor mapAreas are not movement goals here.
  const areas = match.world && match.world.edgeAreas;
  if (!areas || !areas.length) return null;
  const open = [];
  for (let i = 0; i < areas.length; i++) {
    if (areas[i].open !== false) open.push(areas[i]);
  }
  if (!open.length) return null;
  if (unit.edgeWalkIndex == null) unit.edgeWalkIndex = unit.id % open.length;
  let index = unit.edgeWalkIndex % open.length;
  let area = open[index];
  const cx = area.x + area.w * 0.5;
  const cy = area.y + area.h * 0.5;
  if (Math.hypot(cx - unit.x, cy - unit.y) < 80) {
    index = (index + 1) % open.length;
    unit.edgeWalkIndex = index;
    area = open[index];
  }
  return {
    x: area.x + area.w * 0.5,
    y: area.y + area.h * 0.5,
    radius: 80,
  };
}

/** Score candidate: higher = better. Invalid / too far → negative. */

export function scoreCombatCandidate(kind, dist, sensePx, isPathBlocker, aggroChase, priorityScore) {
  const engage =
    typeof sensePx === 'number' && sensePx > 0
      ? sensePx
      : GAME_PACK.enemyEngageRadius;
  // Aggro chase ignores normal engage radius (sticky pursuit).
  if (!aggroChase && dist > engage * 1.25) return -1;
  let bias = 0;
  if (kind === 'block' && isPathBlocker) bias = 110;
  else if (kind === 'unit') bias = aggroChase ? 200 : 90;
  else if (kind === 'block') bias = 45;
  else if (kind === 'base') {
    // Base value from data (priorityScore), not a hard gate for AI thinking.
    const pri = typeof priorityScore === 'number' ? priorityScore : 120;
    bias = 40 + Math.min(160, pri);
  }
  return bias + (engage - Math.min(dist, engage));
}

/**
 * Phase 3 — bias score by archetype targetPriorityList order (0 = highest).
 * Maps combat kind (+ block flags) → TargetKind labels from NextPlan.
 */

export function targetPriorityBias(unit, candidate) {
  const list = unit && unit.targetPriorityList;
  if (!list || !list.length || !candidate) return 0;
  let label = null;
  if (candidate.kind === 'unit') {
    // Hostile unit — Enum TargetKind; PLAYER is one hostile kind, not the only lock.
    const tk = candidate.targetKind;
    if (tk === TargetKind.PLAYER || list.indexOf('PLAYER') >= 0) {
      label = list.indexOf('PLAYER') >= 0 ? 'PLAYER' : 'ENEMY_UNIT';
    } else if (list.indexOf('ENEMY_UNIT') >= 0) {
      label = 'ENEMY_UNIT';
    } else {
      label = 'PLAYER';
    }
    if (list.indexOf(label) < 0 && list.indexOf('ENEMY_UNIT') >= 0) {
      label = 'ENEMY_UNIT';
    }
  } else if (candidate.kind === 'base' || candidate.targetKind === TargetKind.BLOCK_BASE) {
    label = 'BLOCK_BASE';
  } else if (candidate.kind === 'block' && candidate.block) {
    if (candidate.block.isTurret || candidate.targetKind === TargetKind.BLOCK_TURRET) {
      label = 'BLOCK_TURRET';
    } else if (candidate.block.isDefeatCondition) {
      label = 'BLOCK_BASE';
    } else {
      label = 'BLOCK_OTHER';
    }
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

export function scoreTurretPriority(block, dist, attackers) {
  const pri = block.priorityScore || 10;
  return pri / (dist + attackers * TURRET_DOGPILE_K + 1);
}

export function recountTurretAttackers(match) {
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (b.alive) b.currentAttackers = 0;
  }
  const units = match.pools.units;
  for (let i = 0; i < units.length; i++) {
    const e = units[i];
    if (!isAiControlledUnit(e)) continue;
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

export function pickStickyCombatTarget(match, e, player, bx, by, pack, dt) {
  e.combatLockTimer = Math.max(0, (e.combatLockTimer || 0) - dt);
  recountTurretAttackers(match);
  const candidates = [];
  const aggro = !!e.aggroChase;
  const sense = getSenseRadiusPx(e) || pack.enemyEngageRadius;
  const queryR = aggro ? sense * 2.5 : sense * 1.25;

  // Path-blocker reserved by local steering (already known id — not a world scan).
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
        targetKind: TargetKind.BLOCK_OTHER,
        score: scoreCombatCandidate('block', dist, sense, true, false),
      });
    } else {
      e.attackBlockId = -1;
    }
  }

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
        targetKind: TargetKind.BLOCK_TURRET,
        score: 250 + dog * 100,
      });
    } else {
      e.aggroBlockId = -1;
    }
  }

  // Sense Field: binary-search hostile team buckets only (Enum TargetKind on entries).
  const sensed = queryHostileInSense(match, e, queryR);
  const seen = Object.create(null);
  for (let i = 0; i < candidates.length; i++) {
    seen[candidates[i].kind + ':' + candidates[i].id] = true;
  }
  for (let i = 0; i < sensed.length; i++) {
    const hit = sensed[i];
    const key = hit.kind + ':' + hit.id;
    if (seen[key]) continue;
    seen[key] = true;
    if (hit.kind === 'unit') {
      candidates.push({
        kind: 'unit',
        id: hit.id,
        x: hit.x,
        y: hit.y,
        dist: hit.dist,
        unit: hit.unit,
        targetKind: hit.targetKind || TargetKind.ENEMY_UNIT,
        score: scoreCombatCandidate(
          'unit',
          hit.dist,
          sense,
          false,
          aggro && hit.unit && player && hit.unit.id === player.id
        ),
      });
    } else if (hit.kind === 'base') {
      const dog = hit.block
        ? scoreTurretPriority(hit.block, hit.dist, hit.block.currentAttackers || 0)
        : 0;
      const pri = hit.block && hit.block.priorityScore;
      candidates.push({
        kind: 'base',
        id: hit.id,
        x: hit.x,
        y: hit.y,
        dist: hit.dist,
        block: hit.block,
        targetKind: TargetKind.BLOCK_BASE,
        score:
          scoreCombatCandidate('base', hit.dist, sense, false, false, pri) +
          dog * 20,
      });
    } else {
      const dog = hit.block
        ? scoreTurretPriority(hit.block, hit.dist, hit.block.currentAttackers || 0)
        : 0;
      candidates.push({
        kind: 'block',
        id: hit.id,
        x: hit.x,
        y: hit.y,
        dist: hit.dist,
        block: hit.block,
        targetKind: hit.targetKind || TargetKind.BLOCK_OTHER,
        score:
          40 +
          dog * 80 +
          scoreCombatCandidate('block', hit.dist, sense, false, false) * 0.25,
      });
    }
  }

  // Strategic base goal (path layer) — only if still outside sense index hit.
  if (bx != null && by != null && match.base && match.base.alive) {
    const baseId = match.base.id;
    if (!seen['base:' + baseId] && !seen['block:' + baseId]) {
      const bd = Math.hypot(bx - e.x, by - e.y);
      candidates.push({
        kind: 'base',
        id: baseId,
        x: bx,
        y: by,
        dist: bd,
        block: match.base,
        targetKind: TargetKind.BLOCK_BASE,
        score: scoreCombatCandidate(
          'base',
          bd,
          sense,
          false,
          false,
          match.base.priorityScore
        ),
      });
    }
  }

  let sticky = null;
  if (e.combatTargetKind) {
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (c.kind === e.combatTargetKind && c.id === e.combatTargetId) {
        sticky = c;
        break;
      }
    }
    if (sticky && !aggro && sticky.dist > sense * 1.3) {
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

  const reselectGap = Math.max(50, sense * 0.14);
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
    e.combatTargetEnum = chosen.targetKind || null;
  } else {
    e.combatTargetKind = null;
    e.combatTargetId = -1;
    e.combatTargetEnum = null;
    e.combatLockTimer = 0;
  }
  return chosen;
}

export function applyEnemyContactDamage(match, dt) {
  const pack = GAME_PACK;
  const units = match.pools.units;

  for (let i = 0; i < units.length; i++) {
    const e = units[i];
    if (!isAiControlledUnit(e)) continue;

    // Contact any hostile unit in melee range (multi-team, not Player-only).
    for (let j = 0; j < units.length; j++) {
      const other = units[j];
      if (!other.active || other.id === e.id) continue;
      if (!isHostileTeam(match, e.team, other.team)) continue;
      const d = Math.hypot(other.x - e.x, other.y - e.y);
      if (d < (other.radius || 20) + (e.radius || 20) + 2) {
        applyDamageToUnit(match, other, pack.enemyContactDps * dt, {
          sourceTeam: e.team,
          sourceUnitId: e.id,
          damageKind: 'CONTACT',
        });
      }
    }

    const blocks = match.blocks || [];
    for (let b = 0; b < blocks.length; b++) {
      const blk = blocks[b];
      if (!blk || !blk.alive || !blk.isDefeatCondition) continue;
      if (!isHostileTeam(match, e.team, blk.team)) continue;
      if (!pointInRectExpanded(e.x, e.y, blk, e.radius)) continue;
      applyDamageToBlock(match, blk, pack.enemyBaseContactDps * dt, 'DEFAULT', {
        sourceTeam: e.team,
        damageKind: 'CONTACT',
      });
    }
  }
}

export function updatePlayerRespawn(match, dt) {
  if (!match.playerDead) return;
  if (!match.base || !match.base.alive) return;
  match.respawnTimer -= dt;
  if (match.respawnTimer > 0) return;
  spawnPlayer(match);
}

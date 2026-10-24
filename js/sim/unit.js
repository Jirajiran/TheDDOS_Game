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
import {
  UNIT_VISUAL_ACTIONS,
} from '../view/unitVisual.js';
import {
  absorbDamageWithShield,
} from '../combat/shield.js';
import {
  ensureUnitSkills,
} from '../combat/skills.js';
import { ensureBlackboard } from '../ai/blackboard.js';
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

  resetPlayerStats(u, pack);
  u.skinGroupId = match.playerSkinGroupId || 'Default_skin_1';
  u.x = world.worldW * 0.5;
  u.y = world.worldH * 0.5;
  match.playerDead = false;
  match.cameraFreeFly = false;
  match.respawnTimer = 0;
  match.cameraSnapPending = true;
  return u;
}

export function resetPlayerStats(u, pack) {
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
  u.weaponId = 'M1991';
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
  Object.assign(u, createAmmoState('M1991'));
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

  resetPlayerStats(u, pack);
  u.skinGroupId = match.playerSkinGroupId || 'Default_skin_1';
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
  deactivateUnit(unit);
}

export function decideEnemyActions(match, dt) {
  const actions = [];
  const pack = getBalancePack();
  const loseMode = pack.loseMode === 2 ? 2 : 1;
  const baseAlive = !!(match.base && match.base.alive);
  if (!match.basePlaced) return actions;
  if (!baseAlive && loseMode !== 2) return actions;

  const player = getPlayerUnit(match);
  const base = match.base;
  let bx = null;
  let by = null;
  if (baseAlive) {
    bx = base.x + base.w / 2;
    by = base.y + base.h / 2;
    updateGeneralTarget(match, bx, by);
  }

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

    let pathGoal = null;
    let marchBlock = null;
    let holdGoal = false;
    if (baseAlive && match.baseChunk) {
      const march = marchIntoBaseChunk(match, e);
      if (march) {
        pathGoal = march.goal;
        marchBlock = march.attackBlock;
        holdGoal = true;
      }
    } else if (!baseAlive) {
      pathGoal = huntAreaGoal(match, e);
      if (pathGoal) holdGoal = true;
      if (!pathGoal) pathGoal = territoryWalkGoal(match, e) || nextOpenEdgeGoal(match, e);
    }
    if (!pathGoal) {
      pathGoal = advanceUnitAlongChain(match, e);
    }
    if (!pathGoal) {
      pathGoal = baseAlive
        ? { x: bx, y: by, radius: 160 }
        : { x: e.x, y: e.y, radius: 80 };
      e.pathGoalX = pathGoal.x;
      e.pathGoalY = pathGoal.y;
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

function nextOpenEdgeGoal(match, unit) {
  const areas = match.world && match.world.edgeAreas;
  if (!areas || !areas.length) return null;
  const open = [];
  for (let i = 0; i < areas.length; i++) {
    if (areas[i].open) open.push(areas[i]);
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

export function scoreCombatCandidate(kind, dist, sensePx, isPathBlocker, aggroChase) {
  const engage =
    typeof sensePx === 'number' && sensePx > 0
      ? sensePx
      : GAME_PACK.enemyEngageRadius;
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

export function targetPriorityBias(unit, candidate) {
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

export function pickStickyCombatTarget(match, e, player, bx, by, pack, dt) {
  e.combatLockTimer = Math.max(0, (e.combatLockTimer || 0) - dt);
  recountTurretAttackers(match);
  const candidates = [];
  const aggro = !!e.aggroChase;
  const sense = getSenseRadiusPx(e) || pack.enemyEngageRadius;

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
        score: scoreCombatCandidate('block', dist, sense, true, false),
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
    if (dist > sense * 1.4 && !aggro) continue;
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
      score: scoreCombatCandidate('unit', dist, sense, false, aggro),
    });
  }

  const bd = Math.hypot(bx - e.x, by - e.y);
  if (bx != null && by != null) {
    candidates.push({
      kind: 'base',
      id: -1,
      x: bx,
      y: by,
      dist: bd,
      score: scoreCombatCandidate('base', bd, sense, false, false),
    });
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
    // Hysteresis: keep lock a bit past engage; aggro chase never drops for distance.
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
  } else {
    e.combatTargetKind = null;
    e.combatTargetId = -1;
    e.combatLockTimer = 0;
  }
  return chosen;
}

export function applyEnemyContactDamage(match, dt) {
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

export function updatePlayerRespawn(match, dt) {
  if (!match.playerDead) return;
  if (!match.base || !match.base.alive) return;
  match.respawnTimer -= dt;
  if (match.respawnTimer > 0) return;
  spawnPlayer(match);
}

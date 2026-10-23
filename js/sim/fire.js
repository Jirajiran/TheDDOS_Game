import { playWeaponSfx } from '../audio/sfx.js';
import { ActionType } from '../player/actions.js';
import {
  tryProjectileExplosion,
} from '../combat/areaTriggers.js';
import {
  GAME_PACK,
  PATH_SIZE,
  TEAM,
  defaultProjectileHitMask,
  deriveCollisionLayer,
  getBlockPierceCost,
  getEntityPierceCost,
  getPierceUnitBudget,
  getWeaponDef,
  layerHitsMask,
} from '../config.js';
import { resolveDamage } from '../defs/damageResolver.js';
import {
  getActiveSlot,
  equipArmorOnUnit,
  equipShieldOnUnit,
  isArmorSlot,
  isShieldSlot,
} from '../player/inventory.js';
import {
  blockProjectileSolid,
  worldToL3,
} from '../world/occupancy.js';
import {
  acquireProjectile,
} from '../world/pools.js';
import {
  clearReloadVisual,
  cutUnitVisualAction,
  shotVisualAction,
} from '../view/unitVisual.js';
import {
  absorbDamageWithShield,
  segmentHitsShield,
} from '../combat/shield.js';
import {
  beginReload,
  canFireAmmo,
  consumeAmmoForShot,
} from '../combat/weapons.js';
import {
  applyDamageToBlock,
  getBlock,
} from './block.js';
import {
  segmentHitsCircle,
} from './geom.js';
import {
  clearAmmoReload,
  getUnitWeaponAmmo,
  playerReloadOpts,
} from './reload.js';
import {
  applyDamageToUnit,
  getPlayerUnit,
} from './unit.js';
export function pelletAimOffsetRad(match, unit, pelletIndex, spreadRad) {
  const tick = Math.floor((match.simTime || 0) * 60);
  let h =
    (((unit.id | 0) + 1) * 73856093) ^
    (tick * 19349663) ^
    ((pelletIndex | 0) * 83492791);
  h = (h >>> 0) % 10000;
  return (h / 10000 - 0.5) * spreadRad;
}

export function playShotingVisual(unit, match) {
  cutUnitVisualAction(
    unit,
    shotVisualAction(unit, match),
    GAME_PACK.unitVisualShotingSec != null
      ? GAME_PACK.unitVisualShotingSec
      : 0.12
  );
}

/** Spawn pellet volley for one shot action (does not consume ammo / cooldown). */

export function spawnShotVolley(match, unit, weapon, aimRad) {
  const pellets = Math.max(1, weapon.pelletCount || 1);
  const spread = ((weapon.spreadDeg || 0) * Math.PI) / 180;
  for (let p = 0; p < pellets; p++) {
    const offset =
      pellets === 1
        ? pelletAimOffsetRad(match, unit, p, spread * 0.35)
        : pelletAimOffsetRad(match, unit, p, spread);
    spawnProjectile(match, unit, weapon, aimRad + offset);
  }
}

export function clearUnitBurst(unit) {
  if (!unit) return;
  unit.burstRemaining = 0;
  unit.burstIntervalT = 0;
}

export function unitWeaponBusy(match, unit) {
  if (!unit) return false;
  if ((unit.burstRemaining | 0) > 0) return true;
  return ownerHasActiveBeam(match, unit.id, -1);
}

export function hotbarSwitchDelaySec() {
  const d = GAME_PACK.hotbarSwitchDelaySec;
  const v = typeof d === 'number' ? d : 0.1;
  return Math.min(0.1, Math.max(0, v));
}

export function commitHotbarSlot(match, unit, slotIndex, isPlayer) {
  const slot = slotIndex | 0;
  if (isPlayer) {
    if ((match.activeHotbar | 0) !== slot) {
      clearAmmoReload(getActiveSlot(match.inventory, match.activeHotbar));
      clearReloadVisual(unit);
    }
    match.activeHotbar = slot;
    match.pendingHotbar = -1;
    match.hotbarSwitchT = 0;
    const s = getActiveSlot(match.inventory, match.activeHotbar);
    if (isArmorSlot(s) && unit) equipArmorOnUnit(unit, s.itemId);
    if (isShieldSlot(s) && unit) equipShieldOnUnit(unit, s.itemId);
  } else if (unit && unit.inventory) {
    if ((unit.activeHotbar | 0) !== slot) {
      clearAmmoReload(getActiveSlot(unit.inventory, unit.activeHotbar));
      clearAmmoReload(unit);
      clearReloadVisual(unit);
    }
    unit.activeHotbar = slot;
    unit.pendingHotbar = -1;
    unit.hotbarSwitchT = 0;
    const s = getActiveSlot(unit.inventory, unit.activeHotbar);
    if (isArmorSlot(s)) equipArmorOnUnit(unit, s.itemId);
    if (isShieldSlot(s)) equipShieldOnUnit(unit, s.itemId);
  }
}

export function markHotbarFireLock(match, unit) {
  const t = hotbarSwitchDelaySec();
  if (t <= 0) return;
  if (unit && unit.role === 'player') match.hotbarFireLockT = t;
  else if (unit) unit.hotbarFireLockT = t;
}

export function queueHotbarSelect(match, unit, slotIndex, isPlayer) {
  if (unitWeaponBusy(match, unit)) return;
  // 0.1s delay only after a shot (fire lock) — not merely for holding a weapon.
  const lock = isPlayer
    ? match.hotbarFireLockT || 0
    : (unit && unit.hotbarFireLockT) || 0;
  if (lock <= 0) {
    commitHotbarSlot(match, unit, slotIndex, isPlayer);
    return;
  }
  if (isPlayer) {
    match.pendingHotbar = slotIndex | 0;
    match.hotbarSwitchT = lock;
  } else {
    unit.pendingHotbar = slotIndex | 0;
    unit.hotbarSwitchT = lock;
  }
}

export function tickHotbarSwitches(match, dt) {
  match.hotbarFireLockT = Math.max(0, (match.hotbarFireLockT || 0) - dt);
  const player = getPlayerUnit(match);
  if (match.pendingHotbar >= 0) {
    if (player && unitWeaponBusy(match, player)) {
      // Hold timer while burst/beam locks switch.
    } else {
      match.hotbarSwitchT = Math.max(0, (match.hotbarSwitchT || 0) - dt);
      if (match.hotbarSwitchT <= 0 && (match.hotbarFireLockT || 0) <= 0) {
        commitHotbarSlot(match, player, match.pendingHotbar, true);
      }
    }
  }
  const units = match.pools.units;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active) continue;
    u.hotbarFireLockT = Math.max(0, (u.hotbarFireLockT || 0) - dt);
    if (!u.inventory || u.pendingHotbar < 0) continue;
    if (unitWeaponBusy(match, u)) continue;
    u.hotbarSwitchT = Math.max(0, (u.hotbarSwitchT || 0) - dt);
    if (u.hotbarSwitchT <= 0 && (u.hotbarFireLockT || 0) <= 0) {
      commitHotbarSlot(match, u, u.pendingHotbar, false);
    }
  }
}

export function fireProjectileShot(match, unit, weapon, ammo) {
  const consumed = consumeAmmoForShot(ammo, weapon);
  if (!consumed && !weapon.infiniteAmmo) return false;
  spawnShotVolley(match, unit, weapon, unit.aimRad);
  match.stats.shotsFired += 1;
  playShotingVisual(unit, match);
  playWeaponSfx(weapon.id);
  return true;
}

export function tryFire(match, unit) {
  const { weapon, ammo } = getUnitWeaponAmmo(match, unit);
  if (!weapon) return;
  if ((unit.burstRemaining | 0) > 0) return;
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
    playShotingVisual(unit, match);
    playWeaponSfx(weapon.id);
    markHotbarFireLock(match, unit);
    return;
  }

  if (!fireProjectileShot(match, unit, weapon, ammo)) return;
  markHotbarFireLock(match, unit);

  const burst = Math.max(1, weapon.burstCount || 1);
  if (burst > 1) {
    unit.burstRemaining = burst - 1;
    unit.burstIntervalT =
      typeof weapon.burstIntervalSec === 'number'
        ? weapon.burstIntervalSec
        : 0.06;
    // Block new FIRE until sequential burst finishes.
    unit.fireCooldown = 1e6;
  } else {
    clearUnitBurst(unit);
    unit.fireCooldown = weapon.cooldownSec || 0;
  }
}

export function tickWeaponBursts(match, dt) {
  const units = match.pools.units;
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    if (!unit.active || (unit.burstRemaining | 0) <= 0) continue;
    const { weapon, ammo } = getUnitWeaponAmmo(match, unit);
    if (!weapon) {
      clearUnitBurst(unit);
      unit.fireCooldown = 0;
      continue;
    }
    unit.burstIntervalT = Math.max(0, (unit.burstIntervalT || 0) - dt);
    if (unit.burstIntervalT > 0) continue;

    if (!canFireAmmo(ammo, weapon)) {
      clearUnitBurst(unit);
      unit.fireCooldown = weapon.cooldownSec || 0;
      if (ammo && ammo.ammoInMag <= 0 && ammo.mags > 0) {
        const opts =
          unit.role === 'player' ? playerReloadOpts(match, weapon) : null;
        beginReload(ammo, weapon, opts);
      }
      continue;
    }

    if (!fireProjectileShot(match, unit, weapon, ammo)) {
      clearUnitBurst(unit);
      unit.fireCooldown = weapon.cooldownSec || 0;
      continue;
    }

    unit.burstRemaining -= 1;
    if (unit.burstRemaining > 0) {
      unit.burstIntervalT =
        typeof weapon.burstIntervalSec === 'number'
          ? weapon.burstIntervalSec
          : 0.06;
      unit.fireCooldown = 1e6;
    } else {
      clearUnitBurst(unit);
      unit.fireCooldown = weapon.cooldownSec || 0;
    }
  }
}

export function spawnProjectile(match, owner, weapon, aimRad) {
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

export function ownerHasActiveBeam(match, ownerId, sourceBlockId) {
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

export function spawnBeam(match, owner, weapon, aimRad) {
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

export function tryTurretFire(match, blockId, aimRad) {
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
  playWeaponSfx(weapon.id);
}

export function decideTurretActions(match) {
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

export function updateCooldowns(match, dt) {
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

export function unitMatchesFaction(unit, projectileTeam, targetFaction) {
  if (!unit || !unit.active) return false;
  if (targetFaction === 'FRIENDLY') return unit.team === projectileTeam;
  return unit.team !== projectileTeam;
}

export function entityCollisionLayer(ent) {
  if (!ent) return 0;
  if (typeof ent.collisionLayer === 'number') return ent.collisionLayer;
  return deriveCollisionLayer(ent);
}

/** Prefer hitMask; fall back to team/faction while migrating. */

export function canHitUnit(pOrBeam, unit) {
  if (!unit || !unit.active) return false;
  if (pOrBeam.hitMask != null) {
    return layerHitsMask(entityCollisionLayer(unit), pOrBeam.hitMask);
  }
  return unitMatchesFaction(unit, pOrBeam.team, pOrBeam.targetFaction || 'ENEMY');
}

export function canHitBlock(pOrBeam, block) {
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

export function updateProjectiles(match, dt) {
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
          impact: true,
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
          const dmg = scaledHitDamage(
            abs.leftover,
            p.damageType,
            unit.armorType || 'DEFAULT'
          );
          applyDamageToUnit(match, unit, dmg, {
            sourceTeam: p.team,
            fromTurret: !!p.fromTurret,
            sourceBlockId: p.sourceBlockId,
            sourceX: p.prevX,
            sourceY: p.prevY,
            skipShield: true,
            impact: true,
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
      const dmg = scaledHitDamage(
        p.damage,
        p.damageType,
        unit.armorType || 'DEFAULT'
      );
      applyDamageToUnit(match, unit, dmg, {
        sourceTeam: p.team,
        fromTurret: !!p.fromTurret,
        sourceBlockId: p.sourceBlockId,
        sourceX: p.prevX,
        sourceY: p.prevY,
        impact: true,
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

export function collectProjectileSegmentHits(match, p, units) {
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

export function segmentClosestT(x0, y0, x1, y1, px, py) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  if (len2 <= 0) return 0;
  let t = ((px - x0) * dx + (py - y0) * dy) / len2;
  if (t < 0) t = 0;
  if (t > 1) t = 1;
  return t;
}

export function syncBeamToOwner(match, b) {
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

export function updateBeams(match, dt) {
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

export function castBeamRay(match, b, units, applyDamage) {
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
        const dmg = scaledHitDamage(
          b.damage,
          b.damageType,
          unit.armorType || 'DEFAULT'
        );
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

export function rayHitsCircle(x0, y0, x1, y1, cx, cy, r) {
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

export function rayHitsAABB(x0, y0, x1, y1, bx, by, bw, bh) {
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

export function projectileHitsBlock(match, p) {
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

export function scaledHitDamage(amount, damageType, armorType) {
  if (!(amount > 0)) return amount;
  return resolveDamage({
    amount,
    damageType: damageType || 'DEFAULT',
    armorType: armorType || 'DEFAULT',
  }).hpDelta;
}

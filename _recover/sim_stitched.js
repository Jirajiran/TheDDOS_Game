import { ActionType } from './actions.js';
import { GAME_PACK, L3_SIZE, TEAM } from './config.js';
import { acquireProjectile, acquireUnit, deactivateUnit } from './pools.js';

/**
 * Build runtime match gameplay state on top of loaded pools/world.
 */
export function initMatchGameplay(match) {
  const pack = GAME_PACK;
  const { world } = match;
  const cx = world.worldW / 2;
  const cy = world.worldH / 2;

  // Snap BaseBlock 3×3 L3 so footprint is centered on world middle.
  const footprint = pack.baseFootprintL3;
  const size = footprint * L3_SIZE;
  const originX = Math.floor((cx - size / 2) / L3_SIZE) * L3_SIZE;
  const originY = Math.floor((cy - size / 2) / L3_SIZE) * L3_SIZE;

  match.base = {
    x: originX,
    y: originY,
    w: size,
    h: size,
    hp: pack.baseMaxHp,
    maxHp: pack.baseMaxHp,
    alive: true,
  };

  match.waveIndex = 0;
  match.waveCountdown = pack.waveCountdownSec;
  match.waveActive = false;
  match.enemiesAlive = 0;
  match.outcome = null;
  match.activeHotbar = 0;
  match.hotbar = makeHotbarStub(pack.hotbarSlots);
  match.playerUnitId = -1;
  match.respawnTimer = 0;
  match.playerDead = false;

  spawnPlayer(match);
  return match;
}

function makeHotbarStub(n) {
  const colors = ['#6dbf7a', '#6b9fbf', '#bfa06b', '#bf6b8a', '#8a6bbf', '#6bbfbf'];
  const slots = new Array(n);
  for (let i = 0; i < n; i++) {
    slots[i] = { id: i, color: colors[i % colors.length], label: String(i + 1) };
  }
  return slots;
}

export function spawnPlayer(match) {
  const pack = GAME_PACK;
  const { base, pools } = match;
  let u = null;
  if (match.playerUnitId >= 0) {
    u = pools.units[match.playerUnitId];
  }
  if (!u || !u.active) {
    u = acquireUnit(pools);
    if (!u) return null;
    match.playerUnitId = u.id;
  }

  const angle = Math.random() * Math.PI * 2;
  const dist = base.w * 0.55 + L3_SIZE * 0.5;
  u.active = true;
  u.typeId = 1;
  u.team = TEAM.PLAYER;
  u.role = 'player';
  u.maxHp = pack.playerMaxHp;
  u.hp = pack.playerMaxHp;
  u.speed = pack.playerSpeed;
  u.radius = pack.playerRadius;
  u.x = clamp(
    base.x + base.w / 2 + Math.cos(angle) * dist,
    u.radius,
    match.world.worldW - u.radius
  );
  u.y = clamp(
    base.y + base.h / 2 + Math.sin(angle) * dist,
    u.radius,
    match.world.worldH - u.radius
  );
  u.vx = 0;
  u.vy = 0;
  u.facingRad = 0;
  u.aimRad = 0;
  u.fireCooldown = 0;
  match.playerDead = false;
  match.respawnTimer = 0;
  return u;
}

export function getPlayerUnit(match) {
  if (!match || match.playerUnitId < 0) return null;
  const u = match.pools.units[match.playerUnitId];
  return u && u.active && u.role === 'player' ? u : null;
}

/**
 * Process Action list then advance sim one frame.
 * @returns {'win'|'lose'|null}
 */
export function tickMatch(match, actions, mouseWorld, dt) {
  if (match.outcome) return match.outcome;

  applyActions(match, actions, mouseWorld, dt);
  updateCooldowns(match, dt);
  updateProjectiles(match, dt);
  updateEnemies(match, dt);
  updateWaves(match, dt);
  updatePlayerRespawn(match, dt);

  if (match.base && match.base.hp <= 0) {
    match.base.alive = false;
    match.base.hp = 0;
    match.outcome = 'lose';
    return 'lose';
  }

  return match.outcome;
}

function applyActions(match, actions, mouseWorld, dt) {
  const player = getPlayerUnit(match);

  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    if (a.type === ActionType.SELECT_HOTBAR) {
      match.activeHotbar = a.slot | 0;
      continue;
    }

    if (!player || player.id !== a.unitId) continue;

    if (a.type === ActionType.MOVE) {
      const speed = player.speed;
      player.vx = a.dx * speed;
      player.vy = a.dy * speed;
      if (a.dx !== 0 || a.dy !== 0) {
        player.facingRad = Math.atan2(a.dy, a.dx);
      }
    } else if (a.type === ActionType.AIM) {
      if (mouseWorld) {
        player.aimRad = Math.atan2(
          mouseWorld.y - player.y,
          mouseWorld.x - player.x
        );
      } else {
        player.aimRad = a.aimRad;
      }
    } else if (a.type === ActionType.FIRE) {
      tryFire(match, player);
    }
  }

  if (player) {
    player.x = clamp(
      player.x + player.vx * dt,
      player.radius,
      match.world.worldW - player.radius
    );
    player.y = clamp(
      player.y + player.vy * dt,
      player.radius,
      match.world.worldH - player.radius
    );
  }
}

function tryFire(match, unit) {
  const pack = GAME_PACK;
  if (unit.fireCooldown > 0) return;
  const proj = acquireProjectile(match.pools);
  if (!proj) return;

  const cos = Math.cos(unit.aimRad);
  const sin = Math.sin(unit.aimRad);
  const muzzle = unit.radius + 2;
  proj.active = true;
  proj.x = unit.x + cos * muzzle;
  proj.y = unit.y + sin * muzzle;
  proj.prevX = proj.x;
  proj.prevY = proj.y;
  proj.speed = pack.projectileSpeed;
  proj.vx = cos * pack.projectileSpeed;
  proj.vy = sin * pack.projectileSpeed;
  proj.damage = pack.projectileDamage * pack.damageMult;
  proj.ownerId = unit.id;
  proj.team = unit.team;
  proj.traveled = 0;
  proj.maxRange = pack.projectileMaxRange;
  proj.radius = pack.projectileRadius;
  unit.fireCooldown = pack.fireCooldownSec;
}

function updateCooldowns(match, dt) {
  const units = match.pools.units;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!u.active) continue;
    if (u.fireCooldown > 0) u.fireCooldown = Math.max(0, u.fireCooldown - dt);
  }
}

function updateProjectiles(match, dt) {
  const projs = match.pools.projectiles;
  const units = match.pools.units;
  const { base } = match;

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

    let hit = false;

    for (let u = 0; u < units.length; u++) {
      const unit = units[u];
      if (!unit.active || unit.team === p.team) continue;
      if (segmentHitsCircle(p.prevX, p.prevY, p.x, p.y, unit.x, unit.y, unit.radius + p.radius)) {
        applyDamageToUnit(match, unit, p.damage);
        hit = true;
        break;
      }
    }

    if (!hit && base && base.alive && p.team === TEAM.ENEMY) {
      if (segmentHitsRect(p.prevX, p.prevY, p.x, p.y, base)) {
        base.hp -= p.damage;
        hit = true;
      }
    }

    // Player bullets can also chip base? No — only enemies hurt base for V1.
    if (hit) p.active = false;
  }
}

function applyDamageToUnit(match, unit, damage) {
  unit.hp -= damage;
  if (unit.hp > 0) return;

  unit.hp = 0;
  if (unit.role === 'enemy') {
    match.enemiesAlive = Math.max(0, match.enemiesAlive - 1);
  }
  if (unit.role === 'player') {
    match.playerDead = true;
    const pack = GAME_PACK;
    match.respawnTimer =
      pack.respawnBaseSec + match.waveIndex * pack.respawnExtraPerWave;
  }
  deactivateUnit(unit);
}

function updateEnemies(match, dt) {
  const pack = GAME_PACK;
  const units = match.pools.units;
  const player = getPlayerUnit(match);
  const base = match.base;

  for (let i = 0; i < units.length; i++) {
    const e = units[i];
    if (!e.active || e.role !== 'enemy') continue;

    let tx = base.x + base.w / 2;
    let ty = base.y + base.h / 2;
    if (player) {
      tx = player.x;
      ty = player.y;
    }

    const dx = tx - e.x;
    const dy = ty - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.facingRad = Math.atan2(dy, dx);
    e.aimRad = e.facingRad;
    e.x += (dx / dist) * e.speed * dt;
    e.y += (dy / dist) * e.speed * dt;
    e.x = clamp(e.x, e.radius, match.world.worldW - e.radius);
    e.y = clamp(e.y, e.radius, match.world.worldH - e.radius);

    // Contact damage to player.
    if (player) {
      const d = Math.hypot(player.x - e.x, player.y - e.y);
      if (d < player.radius + e.radius) {
        applyDamageToUnit(match, player, pack.enemyContactDps * dt);
      }
    }

    // Contact damage to base.
    if (base && base.alive && pointInRectExpanded(e.x, e.y, base, e.radius)) {
      base.hp -= pack.enemyBaseContactDps * dt;
    }
  }
}

function updateWaves(match, dt) {
  const pack = GAME_PACK;

  if (match.waveActive) {
    if (match.enemiesAlive <= 0) {
      match.waveActive = false;
      if (match.waveIndex >= pack.targetWaveToWin) {
        match.outcome = 'win';
        return;
      }
      match.waveCountdown = pack.waveCountdownSec;
    }
    return;
  }

  // Between waves — countdown then spawn.
  match.waveCountdown -= dt;
  if (match.waveCountdown > 0) return;

  match.waveIndex += 1;
  spawnWave(match, match.waveIndex);
  match.waveActive = true;
  match.waveCountdown = 0;
}

function spawnWave(match, waveIndex) {
  const pack = GAME_PACK;
  const count =
    pack.enemiesPerWaveBase + Math.max(0, waveIndex - 1) * pack.enemiesPerWaveScale;
  match.enemiesAlive = 0;

  for (let i = 0; i < count; i++) {
    const u = acquireUnit(match.pools);
    if (!u) break;
    const pos = pickSpawnOutsideBase(match, i, count);
    u.active = true;
    u.typeId = 2;
    u.team = TEAM.ENEMY;
    u.role = 'enemy';
    u.maxHp = pack.enemyMaxHp;
    u.hp = pack.enemyMaxHp;
    u.speed = pack.enemySpeed;
    u.radius = pack.enemyRadius;
    u.x = pos.x;
    u.y = pos.y;
    u.vx = 0;
    u.vy = 0;
    u.facingRad = 0;
    u.aimRad = 0;
    u.fireCooldown = 0;
    match.enemiesAlive += 1;
  }
}

/** Outer world edge, outside base + padding zone. */
function pickSpawnOutsideBase(match, index, total) {
  const pack = GAME_PACK;
  const { world, base } = match;
  const pad = (pack.baseFootprintL3 / 2 + pack.baseZonePaddingL3) * L3_SIZE;
  const bx = base.x + base.w / 2;
  const by = base.y + base.h / 2;
  const margin = 40;

  // Distribute around perimeter of world rectangle.
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

  // If somehow inside base zone, push outward from base center.
  const dx = x - bx;
  const dy = y - by;
  const d = Math.hypot(dx, dy);
  if (d < pad) {
    const s = pad / (d || 1);
    x = bx + dx * s;
    y = by + dy * s;
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

/** Segment vs circle (for continuous projectile hits). */
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

function segmentHitsRect(x0, y0, x1, y1, r) {
  // Coarse: either endpoint inside or midpoint samples.
  if (pointInRectExpanded(x1, y1, r, 0) || pointInRectExpanded(x0, y0, r, 0)) {
    return true;
  }
  const mx = (x0 + x1) * 0.5;
  const my = (y0 + y1) * 0.5;
  return pointInRectExpanded(mx, my, r, 0);
}
  const projs = match.pools.projectiles;
  const units = match.pools.units;
  const { base } = match;

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

    // Solid blocks stop projectiles (base included via occupancy cells).
    if (projectileHitsSolid(match, p)) {
      // If enemy projectile hits base cells, apply base damage.
      if (base && base.alive && p.team === TEAM.ENEMY) {
        if (segmentHitsRect(p.prevX, p.prevY, p.x, p.y, base)) {
          const mult = getDamageMult(p.damageType, base.armorType || 'DEFAULT');
          base.hp -= p.damage * mult;
        }
      }
      p.active = false;
      continue;
    }

    let hit = false;
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
        applyDamageToUnit(match, unit, p.damage * mult);
        hit = true;
        break;
      }
    }

    if (!hit && base && base.alive && p.team === TEAM.ENEMY) {
      if (segmentHitsRect(p.prevX, p.prevY, p.x, p.y, base)) {
        const mult = getDamageMult(p.damageType, base.armorType || 'DEFAULT');
        base.hp -= p.damage * mult;
        hit = true;
      }
    }

    if (hit) p.active = false;
  }
}

function projectileHitsSolid(match, p) {
  const occ = match.occupancy;
  if (!occ) return false;
  // Sample along segment.
  const samples = 3;
  for (let s = 0; s <= samples; s++) {
    const t = s / samples;
    const x = p.prevX + (p.x - p.prevX) * t;
    const y = p.prevY + (p.y - p.prevY) * t;
    const { gx, gy } = worldToL3(x, y);
    const idx = gy * occ.cols + gx;
    if (gx < 0 || gy < 0 || gx >= occ.cols || gy >= occ.rows) continue;
    if (occ.cells[idx] >= 0) return true;
  }
  return false;
}

function applyDamageToUnit(match, unit, damage) {
  if (!unit || !unit.active) return;
  unit.hp -= damage;
  if (unit.hp > 0) return;

  unit.hp = 0;
  if (unit.role === 'enemy') {
    match.enemiesAlive = Math.max(0, match.enemiesAlive - 1);
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

/**
 * Enemy stage FSM → Action pipeline (Approach / Engage / Retreat).
 * Simplified General: move toward base/player; no full pivot graph.
 */
function decideEnemyActions(match, dt) {
  const actions = [];
  if (!match.basePlaced || !match.base || !match.base.alive) return actions;

  const pack = GAME_PACK;
  const player = getPlayerUnit(match);
  const base = match.base;
  const bx = base.x + base.w / 2;
  const by = base.y + base.h / 2;
  const units = match.pools.units;

  // Ally centroid for retreat.
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

    const hpRatio = e.maxHp > 0 ? e.hp / e.maxHp : 1;
    let tx = bx;
    let ty = by;
    let targetDist = Math.hypot(tx - e.x, ty - e.y);

    if (player) {
      const pd = Math.hypot(player.x - e.x, player.y - e.y);
      // Prefer player when closer than base or within engage.
      if (pd < targetDist || pd < pack.enemyEngageRadius) {
        tx = player.x;
        ty = player.y;
        targetDist = pd;
      }
    }

    // Stage selection.
    if (hpRatio <= pack.enemyRetreatHpRatio) {
      e.aiStage = 'retreat';
    } else if (targetDist <= pack.enemyEngageRadius) {
      e.aiStage = 'engage';
    } else {
      e.aiStage = 'approach';
    }

    let dx = 0;
    let dy = 0;

    if (e.aiStage === 'approach') {
      const len = targetDist || 1;
      dx = (tx - e.x) / len;
      dy = (ty - e.y) / len;
    } else if (e.aiStage === 'engage') {
      // Strafe pattern + close on target.
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
      // Mix chase + strafe.
      dx = fx * 0.65 + sx * 0.55;
      dy = fy * 0.65 + sy * 0.55;
      const m = Math.hypot(dx, dy) || 1;
      dx /= m;
      dy /= m;
    } else {
      // Retreat toward group behind / away from threat.
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

    actions.push({
      type: ActionType.MOVE,
      unitId: e.id,
      dx,
      dy,
    });
    actions.push({
      type: ActionType.AIM,
      unitId: e.id,
      aimRad: Math.atan2(ty - e.y, tx - e.x),
    });
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

    if (player) {
      const d = Math.hypot(player.x - e.x, player.y - e.y);
      if (d < player.radius + e.radius + 2) {
        applyDamageToUnit(match, player, pack.enemyContactDps * dt);
      }
    }

    if (base && base.alive && pointInRectExpanded(e.x, e.y, base, e.radius)) {
      base.hp -= pack.enemyBaseContactDps * dt;
    }
  }
}

function updateWaves(match, dt) {
  const pack = GAME_PACK;

  // Waves locked until base placed.
  if (!match.basePlaced || !match.base || !match.base.alive) {
    return;
  }

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

  // Setup / between waves countdown.
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

  for (let i = 0; i < count; i++) {
    const u = acquireUnit(match.pools);
    if (!u) break;
    const pos = pickSpawnOutsideBaseChunk(match, i, count);
    u.active = true;
    u.typeId = 2;
    u.team = TEAM.ENEMY;
    u.role = 'enemy';
    u.maxHp = pack.enemyMaxHp;
    u.hp = pack.enemyMaxHp;
    u.speed = pack.enemySpeed;
    u.radius = pack.enemyRadius;
    u.armorType = pack.enemyArmorType;
    u.weaponId = null; // melee V1
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
    match.enemiesAlive += 1;
  }
}

/** Outer world edge, outside BaseChunk padding zone. */
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

  // Push outside BaseChunk AABB if inside.
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

function segmentHitsRect(x0, y0, x1, y1, r) {
  if (pointInRectExpanded(x1, y1, r, 0) || pointInRectExpanded(x0, y0, r, 0)) {
    return true;
  }
  const mx = (x0 + x1) * 0.5;
  const my = (y0 + y1) * 0.5;
  return pointInRectExpanded(mx, my, r, 0);
}
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

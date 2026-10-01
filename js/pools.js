import { POOL_DROPS, POOL_PROJECTILES, POOL_UNITS } from './config.js';

function makeInactiveUnit(i) {
  return {
    id: i,
    active: false,
    typeId: 0,
    team: 0,
    collisionLayer: 0,
    pierceCost: 1,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    hp: 0,
    maxHp: 0,
    speed: 0,
    radius: 12,
    facingRad: 0,
    aimRad: 0,
    targetAimRad: 0,
    targetFacingRad: 0,
    fireCooldown: 0,
    armorType: 'DEFAULT',
    weaponId: null,
    ammoInMag: 0,
    mags: 0,
    reloadTimer: 0,
    role: 0,
    aiStage: 'approach',
    aiStrafeSign: 1,
    aiStrafeTimer: 0,
    groupId: -1,
    pivotIndex: 0,
    pathGoalX: 0,
    pathGoalY: 0,
    attackBlockId: -1,
    combatTargetKind: null,
    combatTargetId: -1,
    combatLockTimer: 0,
    aggroChase: false,
    aggroBlockId: -1,
    localGeneral: false,
    archetypeId: null,
    sizeScale: 1,
    isBoss: false,
    retreatHpRatio: 0.3,
    meleeMultiplier: 1,
  };
}

function makeInactiveProjectile(i) {
  return {
    id: i,
    active: false,
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    damage: 0,
    damageType: 'BULLET',
    ownerId: -1,
    team: 0,
    traveled: 0,
    maxRange: 0,
    radius: 4,
    pierceLeft: 0,
    fromTurret: false,
    hitBlockIds: null,
    blockPierceLeft: 0,
    pierceConfig: null,
    weaponId: null,
    targetFaction: 'ENEMY',
    hitMask: 0,
    sourceBlockId: -1,
    noLootOnPierce: false,
    isBeam: false,
  };
}

function makeInactiveDrop(i) {
  return {
    id: i,
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    itemId: null,
    itemTypeId: 0,
    stack: 0,
    age: 0,
  };
}

export function allocatePools() {
  const units = new Array(POOL_UNITS);
  for (let i = 0; i < POOL_UNITS; i++) units[i] = makeInactiveUnit(i);

  const projectiles = new Array(POOL_PROJECTILES);
  for (let i = 0; i < POOL_PROJECTILES; i++) {
    projectiles[i] = makeInactiveProjectile(i);
  }

  const drops = new Array(POOL_DROPS);
  for (let i = 0; i < POOL_DROPS; i++) drops[i] = makeInactiveDrop(i);

  return {
    units,
    projectiles,
    drops,
    capacity: {
      units: POOL_UNITS,
      projectiles: POOL_PROJECTILES,
      drops: POOL_DROPS,
    },
  };
}

export function resetPools(pools) {
  if (!pools) return;
  for (let i = 0; i < pools.units.length; i++) {
    const u = pools.units[i];
    u.active = false;
    u.hp = 0;
    u.x = 0;
    u.y = 0;
    u.vx = 0;
    u.vy = 0;
    u.role = 0;
    u.fireCooldown = 0;
    u.weaponId = null;
    u.ammoInMag = 0;
    u.mags = 0;
    u.reloadTimer = 0;
    u.aiStage = 'approach';
    u.aiStrafeSign = 1;
    u.aiStrafeTimer = 0;
    u.groupId = -1;
    u.pivotIndex = 0;
    u.attackBlockId = -1;
    u.combatTargetKind = null;
    u.combatTargetId = -1;
    u.combatLockTimer = 0;
    u.aggroChase = false;
    u.aggroBlockId = -1;
    u.localGeneral = false;
    u.archetypeId = null;
    u.sizeScale = 1;
    u.isBoss = false;
    u.targetAimRad = 0;
    u.targetFacingRad = 0;
  }
  for (let i = 0; i < pools.projectiles.length; i++) {
    pools.projectiles[i].active = false;
  }
  for (let i = 0; i < pools.drops.length; i++) {
    pools.drops[i].active = false;
  }
}

export function acquireUnit(pools) {
  for (let i = 0; i < pools.units.length; i++) {
    if (!pools.units[i].active) return pools.units[i];
  }
  return null;
}

export function acquireProjectile(pools) {
  for (let i = 0; i < pools.projectiles.length; i++) {
    if (!pools.projectiles[i].active) return pools.projectiles[i];
  }
  return null;
}

export function acquireDrop(pools) {
  for (let i = 0; i < pools.drops.length; i++) {
    if (!pools.drops[i].active) return pools.drops[i];
  }
  return null;
}

export function deactivateUnit(u) {
  if (!u) return;
  u.active = false;
  u.hp = 0;
  u.vx = 0;
  u.vy = 0;
  u.aiStage = 'approach';
  u.combatTargetKind = null;
  u.combatTargetId = -1;
  u.combatLockTimer = 0;
  u.aggroChase = false;
}

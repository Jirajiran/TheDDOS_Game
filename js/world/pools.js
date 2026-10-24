import { POOL_DROPS, POOL_PROJECTILES, POOL_UNITS } from '../config.js';

const MUZZLE_QUEUE = 4;

function makeMuzzleSlot() {
  return { active: false, t: 0, aimRad: 0, weaponId: null, simTime: 0 };
}

function makeMuzzleQueue() {
  const q = new Array(MUZZLE_QUEUE);
  for (let i = 0; i < MUZZLE_QUEUE; i++) q[i] = makeMuzzleSlot();
  return q;
}

export function clearMuzzleQueue(u) {
  const q = u && u.muzzleQueue;
  if (!q) return;
  for (let i = 0; i < q.length; i++) q[i].active = false;
}

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
    steeringUsed: 0,
    steeringBudgetMax: 10,
    archetypeId: null,
    sizeScale: 1,
    isBoss: false,
    retreatHpRatio: 0.3,
    meleeMultiplier: 1,
    /** Phase 1 — skills / morale / shield / taunt stubs. */
    skillIds: null,
    skills: null,
    skillSpeedMult: 1,
    meleeSwing: null,
    activeArmorId: null,
    activeShieldId: null,
    moraleState: null,
    shield: null,
    blackboard: null,
    tauntedById: -1,
    tauntTimer: 0,
    lockRetreat: false,
    _moralePressureTimer: 0,
    _pendingTauntPulse: null,
    /** Phase 2c — optional per-unit bag for PLACE / wrench (AI engineer). */
    inventory: null,
    activeHotbar: 0,
    hasPlacementSkill: false,
    allowedGoals: null,
    targetPriorityList: null,
    behaviorFlags: null,
    _effectiveArchetype: null,
    _archetypePhaseKey: null,
    _burstTimer: 0,
    /** Weapon sequential burst (SMG etc.) — remaining rounds after first shot. */
    burstRemaining: 0,
    burstIntervalT: 0,
    /** Delayed volleys. Fixed ring, cleared on release. */
    muzzleQueue: makeMuzzleQueue(),
    /** Hotbar switch queue (AI units with inventory). */
    pendingHotbar: -1,
    hotbarSwitchT: 0,
    hotbarFireLockT: 0,
    _flankTimer: 0,
    /** Visual — Unit_Template skin group id (Default_skin_1 / Asset_skin_n). */
    skinGroupId: null,
    /** Visual action stage — idle | hold_Gun | Fist | PlaceBlock (no combat effect). */
    visualAction: 'idle',
    /** Previous action while Arm_1/Arm_2 matrices tween. */
    visualActionPrev: 'idle',
    /** One-shot visual timer (sec) for PlaceBlock etc. */
    visualActionT: 0,
    /** Arm pose tween elapsed / duration (sec). */
    armTweenT: 0,
    armTweenDur: 0,
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
    explosionRadius: 0,
    explosionDamage: 0,
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
    u.steeringUsed = 0;
    u.steeringBudgetMax = 10;
    u.archetypeId = null;
    u.sizeScale = 1;
    u.isBoss = false;
    u.targetAimRad = 0;
    u.targetFacingRad = 0;
    u.inventory = null;
    u.activeHotbar = 0;
    u.hasPlacementSkill = false;
    u.allowedGoals = null;
    u.targetPriorityList = null;
    u.behaviorFlags = null;
    u._effectiveArchetype = null;
    u._archetypePhaseKey = null;
    u._burstTimer = 0;
    u.burstRemaining = 0;
    u.burstIntervalT = 0;
    clearMuzzleQueue(u);
    u.pendingHotbar = -1;
    u.hotbarSwitchT = 0;
    u.hotbarFireLockT = 0;
    u._flankTimer = 0;
    u.meleeSwing = null;
    u.activeArmorId = null;
    u.activeShieldId = null;
    u.skillIds = null;
    u.skills = null;
    u.skinGroupId = null;
    u.visualAction = 'idle';
    u.visualActionPrev = 'idle';
    u.visualActionT = 0;
    u.armTweenT = 0;
    u.armTweenDur = 0;
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
  u.burstRemaining = 0;
  u.burstIntervalT = 0;
  clearMuzzleQueue(u);
  u.pendingHotbar = -1;
  u.hotbarSwitchT = 0;
  u.hotbarFireLockT = 0;
}

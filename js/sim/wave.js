import {
  AI_LOCAL_PATH,
  getBalancePack,
  TEAM,
  deriveCollisionLayer,
  getArchetypeForWave,
  getUnitArchetype,
  pickArchetypeIdForWaveSlot,
} from '../config.js';
import { pickEdgeSpawnPosition } from '../defs/spawnPolicy.js';
import { edgeSpawnAnchor } from '../world/world.js';
import {
  attachUnitToGroup,
  deployPreparedGroups,
  prepareGroupPathsSequential,
  resetGeneral,
} from '../ai/general.js';
import {
  ensureMeleeSwing,
} from '../combat/meleeTools.js';
import {
  seedMoraleFromArchetype,
} from '../combat/morale.js';
import {
  acquireUnit,
} from '../world/pools.js';
import {
  enemySkinGroupId,
  UNIT_VISUAL_ACTIONS,
} from '../view/unitVisual.js';
import {
  seedShieldFromArchetype,
} from '../combat/shield.js';
import {
  ensureUnitSkills,
} from '../combat/skills.js';
import {
  applyEffectiveArchetypeToUnit,
  resolveEffectiveArchetype,
} from '../ai/archetypes.js';
import {
  ensureBlackboardStub,
} from '../combat/taunt.js';
import {
  createAmmoState,
} from '../combat/weapons.js';
export function updateWaves(match, dt) {
  const pack = getBalancePack();
  if (!match.basePlaced || !match.base || !match.base.alive) return;
  if (match.outcome) return;

  // Win: cleared target wave (all enemies dead after wave N spawned).
  if (
    match.waveIndex >= pack.targetWaveToWin &&
    match.enemiesAlive <= 0 &&
    match.waveIndex > 0
  ) {
    match.waveActive = false;
    match.outcome = 'win';
    return;
  }

  // Final wave spawned — wait for clear only (no more schedule spawns).
  if (match.waveIndex >= pack.targetWaveToWin) {
    match.waveActive = match.enemiesAlive > 0;
    return;
  }

  // Countdown always ticks (setup + between). Does NOT wait for full wipe.
  match.waveCountdown -= dt;
  if (match.waveCountdown > 0) return;

  match.waveIndex += 1;
  spawnWave(match, match.waveIndex);
  match.waveActive = true;
  match.phase = 'wave';
  if (match.waveIndex < pack.targetWaveToWin) {
    match.waveCountdown = pack.waveCountdownSec;
  } else {
    match.waveCountdown = 0;
  }
}

export function spawnWave(match, waveIndex) {
  const pack = getBalancePack();
  const count =
    pack.enemiesPerWaveBase + Math.max(0, waveIndex - 1) * pack.enemiesPerWaveScale;

  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push(pickSpawnOutsideBaseChunk(match, i, count));
  }

  const base = match.base;
  const tx = base.x + base.w / 2;
  const ty = base.y + base.h / 2;

  // Next wave: clear old group pattern, recompute paths group-by-group, then deploy.
  resetGeneral(match);
  const groupCount = Math.max(1, pack.waveGroupCount || 3);
  const groupLists = partitionSpawnGroups(positions, groupCount, tx, ty);
  const prepared = prepareGroupPathsSequential(match, groupLists, tx, ty);
  // Apply/Deploy only when all group paths are ready.
  const groups = deployPreparedGroups(match, prepared, tx, ty);

  // Phase 3 — per-slot archetype from WAVE_ARCHETYPE_COMPOSITION (mixed types).
  let unitSeq = 0;
  for (let gi = 0; gi < prepared.length; gi++) {
    const prep = prepared[gi];
    const group = groups[gi];
    if (!group) continue;
    for (let i = 0; i < prep.positions.length; i++) {
      const u = acquireUnit(match.pools);
      if (!u) break;
      const pos = prep.positions[i];
      const archId = pickArchetypeIdForWaveSlot(waveIndex, unitSeq);
      const archetype =
        getUnitArchetype(archId) || getArchetypeForWave(waveIndex);
      const weaponId =
        (archetype && archetype.defaultWeapon) ||
        pack.enemyWeaponByWave[
          Math.min(waveIndex, pack.enemyWeaponByWave.length - 1)
        ] ||
        null;
      const hpLo = archetype ? archetype.hpRange[0] : pack.enemyMaxHp;
      const hpHi = archetype ? archetype.hpRange[1] : pack.enemyMaxHp + waveIndex * 4;
      const t = (unitSeq % 5) / 4;
      const maxHp = Math.round(hpLo + (hpHi - hpLo) * t);
      const sizeScale =
        archetype && (archetype.sizeScale || (archetype.isBoss ? 1.5 : 1));
      u.active = true;
      u.typeId = 2;
      u.team = TEAM.ENEMY;
      u.role = 'enemy';
      u.collisionLayer = deriveCollisionLayer({ team: TEAM.ENEMY, role: 'enemy' });
      u.pierceCost = 1;
      u.skinGroupId = enemySkinGroupId();
      u.visualAction = UNIT_VISUAL_ACTIONS.idle;
      u.visualActionPrev = UNIT_VISUAL_ACTIONS.idle;
      u.visualActionT = 0;
      u.armTweenT = 0;
      u.armTweenDur = 0;
      u.archetypeId = archetype ? archetype.id : archId;
      u.isBoss = !!(archetype && archetype.isBoss);
      u.sizeScale = sizeScale || 1;
      u.maxHp = maxHp;
      u.hp = u.maxHp;
      u.speed = pack.enemySpeed * (u.isBoss ? 0.85 : 1);
      u.radius = Math.round(pack.enemyRadius * (u.sizeScale || 1));
      u.armorType =
        (archetype && archetype.armorType) || pack.enemyArmorType;
      u.meleeMultiplier =
        (archetype && archetype.meleeMultiplier) || 1;
      const flags =
        (archetype && (archetype.behaviorFlags || archetype.aiBehavior)) || {};
      u.retreatHpRatio =
        typeof flags.retreatHpRatio === 'number'
          ? flags.retreatHpRatio
          : pack.enemyRetreatHpRatio;
      u.weaponId = weaponId;
      if (weaponId) {
        Object.assign(u, createAmmoState(weaponId));
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
      u.targetAimRad = 0;
      u.targetFacingRad = 0;
      u.fireCooldown = 0;
      u.aiStage = 'approach';
      u.aiStrafeSign = unitSeq % 2 === 0 ? 1 : -1;
      u.aiStrafeTimer = 0.4 + (unitSeq % 4) * 0.15;
      u.attackBlockId = -1;
      u.combatTargetKind = null;
      u.combatTargetId = -1;
      u.combatLockTimer = 0;
      u.aggroChase = false;
      u.aggroBlockId = -1;
      u.localGeneral = !!(archetype && archetype.isLocalGeneral);
      u.steeringUsed = 0;
      u.steeringBudgetMax = AI_LOCAL_PATH.steeringBudgetMax;
      u.skillIds = (archetype && archetype.activeSkills) || [];
      seedMoraleFromArchetype(u, archetype);
      seedShieldFromArchetype(u, archetype);
      ensureUnitSkills(u);
      ensureMeleeSwing(u);
      ensureBlackboardStub(u);
      u.skillSpeedMult = 1;
      u.tauntTimer = 0;
      u.tauntedById = -1;
      u.activeArmorId = null;
      u.activeShieldId = null;
      u.hasPlacementSkill = !!(archetype && archetype.hasPlacementSkill);
      u.inventory = null;
      u.activeHotbar = 0;
      u._burstTimer = 0;
      u._flankTimer = 0;
      u._archetypePhaseKey = null;
      // Compose Goals+Stages from archetype data (allowedGoals / flags / phase).
      const effective = resolveEffectiveArchetype(u, u.archetypeId);
      if (effective) {
        applyEffectiveArchetypeToUnit(u, effective, { syncWeapon: false });
        ensureUnitSkills(u);
      }
      attachUnitToGroup(group, u);
      match.enemiesAlive += 1;
      unitSeq += 1;
    }
  }
}

/** Split perimeter spawns into angular arcs → one list per General group. */

export function partitionSpawnGroups(positions, groupCount, cx, cy) {
  if (!positions.length) return [];
  const sorted = positions.slice().sort((a, b) => {
    return Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx);
  });
  const n = sorted.length;
  const gCount = Math.min(groupCount, n);
  const groups = [];
  for (let g = 0; g < gCount; g++) {
    const start = Math.floor((g * n) / gCount);
    const end = Math.floor(((g + 1) * n) / gCount);
    const slice = sorted.slice(start, end);
    if (slice.length) groups.push(slice);
  }
  return groups;
}

export function pickSpawnOutsideBaseChunk(match, index, total) {
  const picked = pickOpenEdgeAreaPosition(match, index);
  if (picked) return picked;
  return pickEdgeSpawnPosition(match, index, total);
}

function pickOpenEdgeAreaPosition(match, slot) {
  const areas = match.world && match.world.edgeAreas;
  if (!areas || !areas.length) return null;
  const open = [];
  for (let i = 0; i < areas.length; i++) {
    if (areas[i].open) open.push(areas[i]);
  }
  if (!open.length) return null;
  const waveIndex = match.waveIndex | 0;
  const area = open[(waveIndex + slot) % open.length];
  return edgeSpawnAnchor(area, match.world, slot);
}

/** Apply pack damage matrix (heal amounts stay raw). */

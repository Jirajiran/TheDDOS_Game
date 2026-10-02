/**
 * Taunt pulse — writes TAUNT_TRIGGERED event / flag for Mediator.
 * Blackboard is owned by js/ai/blackboard.js (Phase 2a).
 */

import { ensureBlackboard, pushAiEvent } from './ai/blackboard.js';

export const TauntEvent = Object.freeze({
  TAUNT_TRIGGERED: 'TAUNT_TRIGGERED',
});

/** @deprecated prefer ensureBlackboard from ai/blackboard.js */
export function ensureBlackboardStub(ent) {
  return ensureBlackboard(ent);
}

/**
 * Pulse from caster — marks units + turrets in radius.
 * Writes priorityScratch.ELIMINATE_TARGET toward caster for Mediator.
 */
export function emitTauntPulse(match, caster, opts = {}) {
  if (!match || !caster || !caster.active) return 0;
  const radius = opts.radius != null ? opts.radius : 200;
  const durationSec = opts.durationSec != null ? opts.durationSec : 4;
  const r2 = radius * radius;
  let count = 0;

  ensureBlackboard(caster);
  caster.tauntPulseUntil =
    (typeof performance !== 'undefined' ? performance.now() / 1000 : 0) +
    durationSec;
  if (typeof match.simTime === 'number') {
    caster.tauntPulseUntil = match.simTime + durationSec;
  }

  const units = match.pools && match.pools.units;
  if (units) {
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (!u.active || u.id === caster.id) continue;
      if (u.team === caster.team) continue;
      const dx = u.x - caster.x;
      const dy = u.y - caster.y;
      if (dx * dx + dy * dy > r2) continue;
      pushAiEvent(u, TauntEvent.TAUNT_TRIGGERED, {
        sourceEntityId: caster.id,
        durationSec,
      });
      u.blackboard.priorityScratch.ELIMINATE_TARGET = caster.id;
      u.tauntedById = caster.id;
      u.tauntTimer = durationSec;
      u.combatTargetKind = 'unit';
      u.combatTargetId = caster.id;
      u.combatLockTimer = Math.max(u.combatLockTimer || 0, durationSec);
      u.aggroChase = true;
      count += 1;
    }
  }

  if (match.blocks) {
    for (let i = 0; i < match.blocks.length; i++) {
      const b = match.blocks[i];
      if (!b.alive) continue;
      const isArmed = b.isTurret || (b.isDefeatCondition && b.weaponId);
      if (!isArmed) continue;
      if (b.team === caster.team) continue;
      const cx = b.x + b.w * 0.5;
      const cy = b.y + b.h * 0.5;
      const dx = cx - caster.x;
      const dy = cy - caster.y;
      if (dx * dx + dy * dy > r2) continue;
      pushAiEvent(b, TauntEvent.TAUNT_TRIGGERED, {
        sourceEntityId: caster.id,
        durationSec,
      });
      b.blackboard.priorityScratch.ELIMINATE_TARGET = caster.id;
      b.tauntedById = caster.id;
      b.tauntTimer = durationSec;
      count += 1;
    }
  }

  return count;
}

/** Decay taunt timers each frame. */
export function tickTauntFlags(match, dt) {
  if (!match) return;
  const units = match.pools && match.pools.units;
  if (units) {
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (!u.active) continue;
      if (u.tauntTimer > 0) {
        u.tauntTimer -= dt;
        if (u.tauntTimer <= 0) {
          u.tauntTimer = 0;
          u.tauntedById = -1;
          if (u.blackboard && u.blackboard.flags) {
            u.blackboard.flags[TauntEvent.TAUNT_TRIGGERED] = false;
          }
        }
      }
      if (u.blackboard && u.blackboard.events && u.blackboard.events.length) {
        const keep = [];
        for (let e = 0; e < u.blackboard.events.length; e++) {
          const ev = u.blackboard.events[e];
          ev.t = (ev.t || 0) + dt;
          if (ev.t < 8) keep.push(ev);
        }
        u.blackboard.events = keep;
      }
    }
  }
  if (match.blocks) {
    for (let i = 0; i < match.blocks.length; i++) {
      const b = match.blocks[i];
      if (!b.alive || !(b.tauntTimer > 0)) continue;
      b.tauntTimer -= dt;
      if (b.tauntTimer <= 0) {
        b.tauntTimer = 0;
        b.tauntedById = -1;
        if (b.blackboard && b.blackboard.flags) {
          b.blackboard.flags[TauntEvent.TAUNT_TRIGGERED] = false;
        }
      }
    }
  }
}

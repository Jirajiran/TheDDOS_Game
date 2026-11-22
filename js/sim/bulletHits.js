/**
 * Deferred projectile hits (Idea.txt): record this frame, apply next frame.
 * Target is (unitId, generation) so recycled pool slots do not eat old damage (ABA-safe).
 */

/**
 * @param {object} match
 */
export function ensureBulletHitQueues(match) {
  if (!match || match.bulletHits) return;
  match.bulletHits = {
    pending: [],
    current: [],
  };
}

/**
 * @param {object} match
 * @param {{
 *   targetId: number,
 *   generation: number,
 *   damage: number,
 *   damageType: string,
 *   sourceTeam: number,
 *   sourceUnitId: number,
 *   fromTurret: boolean,
 *   sourceBlockId: number,
 *   sourceX: number,
 *   sourceY: number,
 *   skipShield: boolean,
 * }} hit
 */
export function queueUnitHit(match, hit) {
  ensureBulletHitQueues(match);
  match.bulletHits.current.push(hit);
}

/**
 * Apply hits recorded last frame. Call once at the start of the projectile step.
 * @param {object} match
 * @param {(match: object, unit: object, dmg: number, ctx: object) => void} applyDamageToUnit
 */
export function applyPendingBulletHits(match, applyDamageToUnit) {
  ensureBulletHitQueues(match);
  const pending = match.bulletHits.pending;
  const units = match.pools && match.pools.units;
  if (!units || !pending.length) {
    pending.length = 0;
    return;
  }
  for (let i = 0; i < pending.length; i++) {
    const hit = pending[i];
    const unit = units[hit.targetId];
    if (!unit || !unit.active) continue;
    if ((unit.generation | 0) !== (hit.generation | 0)) continue;
    const dmg = hit.damage;
    if (!(dmg > 0)) continue;
    applyDamageToUnit(match, unit, dmg, {
      sourceTeam: hit.sourceTeam,
      sourceUnitId: hit.sourceUnitId,
      fromTurret: !!hit.fromTurret,
      sourceBlockId: hit.sourceBlockId,
      sourceX: hit.sourceX,
      sourceY: hit.sourceY,
      skipShield: !!hit.skipShield,
      impact: true,
    });
    if (dmg > 0 && match.stats) match.stats.damageDealt += dmg;
  }
  pending.length = 0;
}

/** Swap current → pending for next frame. */
export function swapBulletHitBuffers(match) {
  ensureBulletHitQueues(match);
  const q = match.bulletHits;
  const tmp = q.pending;
  q.pending = q.current;
  q.current = tmp;
  q.current.length = 0;
}

/** Unified Action Pipeline — human, AI, and turrets share this path. */

export const ActionType = Object.freeze({
  MOVE: 'MOVE',
  AIM: 'AIM',
  FIRE: 'FIRE',
  PLACE: 'PLACE',
  SELECT_HOTBAR: 'SELECT_HOTBAR',
  RELOAD: 'RELOAD',
  INTERACT: 'INTERACT',
  HARVEST: 'HARVEST',
  /** Take produced stock from a Gen block into inventory (sim mutates). */
  TAKE_GEN: 'TAKE_GEN',
  /** Take from base inherent storage into inventory (sim mutates). */
  TAKE_BASE: 'TAKE_BASE',
  /**
   * Active skill cast — payload: skillId, targetPosVec2?, targetEntityId?
   * AI Stages emit this Action; they do not resolve skill names/effects.
   */
  CAST_SKILL: 'CAST_SKILL',
});

export function makeMoveAction(unitId, dx, dy) {
  return { type: ActionType.MOVE, unitId, dx, dy };
}

export function makeAimAction(unitId, aimRad) {
  return { type: ActionType.AIM, unitId, aimRad };
}

export function makeFireAction(unitId) {
  return { type: ActionType.FIRE, unitId };
}

/** PLACE — world coords; sim snaps to L3 footprint origin. */
export function makePlaceAction(unitId, worldX, worldY) {
  return { type: ActionType.PLACE, unitId, worldX, worldY };
}

export function makeSelectHotbarAction(unitId, slot) {
  return { type: ActionType.SELECT_HOTBAR, unitId, slot };
}

export function makeReloadAction(unitId) {
  return { type: ActionType.RELOAD, unitId };
}

export function makeInteractAction(unitId) {
  return { type: ActionType.INTERACT, unitId };
}

export function makeHarvestAction(unitId, worldX, worldY) {
  return { type: ActionType.HARVEST, unitId, worldX, worldY };
}

/** TAKE_GEN — blockId of Gen; amount optional (default all). */
export function makeTakeGenAction(unitId, blockId, amount = Infinity) {
  return { type: ActionType.TAKE_GEN, unitId, blockId, amount };
}

/** TAKE_BASE — itemId in base.storage bags; amount optional (default all). */
export function makeTakeBaseAction(unitId, itemId, amount = Infinity) {
  return { type: ActionType.TAKE_BASE, unitId, itemId, amount };
}

/**
 * CAST_SKILL — Unified Input skill cast.
 * @param {number} unitId
 * @param {string} skillId
 * @param {{ targetPosVec2?: {x:number,y:number}, targetEntityId?: string|number }} [opts]
 */
export function makeCastSkillAction(unitId, skillId, opts = {}) {
  return {
    type: ActionType.CAST_SKILL,
    unitId,
    skillId,
    targetPosVec2: opts.targetPosVec2 || null,
    targetEntityId: opts.targetEntityId != null ? opts.targetEntityId : null,
  };
}

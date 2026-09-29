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

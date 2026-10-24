/**
 * After the base dies, one map-sized Area tells bots to walk to the player.
 * It does not order fire. Sense radius stays on the unit.
 */

export function openHuntArea(match) {
  const world = match && match.world;
  if (!world) return null;
  match.huntArea = {
    x: 0,
    y: 0,
    w: world.worldW,
    h: world.worldH,
    action: 'hunt',
    shoot: false,
  };
  return match.huntArea;
}

export function huntAreaGoal(match, unit) {
  const area = match && match.huntArea;
  if (!area || area.action !== 'hunt' || area.shoot) return null;
  if (!unit) return null;
  if (
    unit.x < area.x ||
    unit.y < area.y ||
    unit.x > area.x + area.w ||
    unit.y > area.y + area.h
  ) {
    return null;
  }
  const units = match.pools && match.pools.units;
  if (!units) return null;
  let player = null;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (u && u.active && u.role === 'player') {
      player = u;
      break;
    }
  }
  if (!player) return null;
  return { x: player.x, y: player.y, radius: 80 };
}

import { getBalancePack, L3_SIZE } from '../config.js';

const DEFAULT_TERRITORY = Object.freeze({
  base: Object.freeze({ padL3: 4, importance: 3 }),
  turret: Object.freeze({ padL3: 2, importance: 2 }),
  gen: Object.freeze({ padL3: 2, importance: 1 }),
});

function territoryTable() {
  const raw = getBalancePack().territory;
  return raw || DEFAULT_TERRITORY;
}

function specFor(block, table) {
  if (!block) return null;
  if (block.isDefeatCondition) return table.base || DEFAULT_TERRITORY.base;
  if (block.isTurret) return table.turret || DEFAULT_TERRITORY.turret;
  if (block.isGen) return table.gen || DEFAULT_TERRITORY.gen;
  return null;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Merge overlapping base / turret / gen pads into territories.
 * Called on place, destroy, and restore — not every frame.
 */
export function rebuildTerritories(match) {
  const table = territoryTable();
  const blocks = match.blocks || [];
  const nodes = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block || !block.alive) continue;
    const spec = specFor(block, table);
    if (!spec) continue;
    const pad = (spec.padL3 != null ? spec.padL3 : 0) * L3_SIZE;
    nodes.push({
      id: block.id,
      importance: spec.importance | 0,
      cx: block.x + block.w / 2,
      cy: block.y + block.h / 2,
      x: block.x - pad,
      y: block.y - pad,
      w: block.w + pad * 2,
      h: block.h + pad * 2,
    });
  }

  const parent = new Array(nodes.length);
  for (let i = 0; i < nodes.length; i++) parent[i] = i;
  function find(i) {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  }
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (!rectsOverlap(nodes[i], nodes[j])) continue;
      parent[find(i)] = find(j);
    }
  }

  const groups = [];
  const byRoot = Object.create(null);
  for (let i = 0; i < nodes.length; i++) {
    const root = find(i);
    let group = byRoot[root];
    if (!group) {
      group = { importance: 0, members: [], pads: [] };
      byRoot[root] = group;
      groups.push(group);
    }
    const node = nodes[i];
    if (node.importance > group.importance) group.importance = node.importance;
    group.members.push({
      id: node.id,
      x: node.cx,
      y: node.cy,
      importance: node.importance,
    });
    group.pads.push({ x: node.x, y: node.y, w: node.w, h: node.h });
  }
  match.territories = groups;
  return groups;
}

/** Nearest member that carries the winning territory's importance. */
export function territoryWalkGoal(match, unit) {
  const list = match.territories;
  if (!list || !list.length || !unit) return null;
  let best = list[0];
  for (let i = 1; i < list.length; i++) {
    if (list[i].importance > best.importance) best = list[i];
  }
  let pick = null;
  let bestD = Infinity;
  const members = best.members;
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (member.importance !== best.importance) continue;
    const dist = Math.hypot(member.x - unit.x, member.y - unit.y);
    if (dist < bestD) {
      bestD = dist;
      pick = member;
    }
  }
  if (!pick) return null;
  return { x: pick.x, y: pick.y, radius: 80 };
}

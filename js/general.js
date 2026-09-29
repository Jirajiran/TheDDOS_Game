import { L1_SIZE, PATH_SIZE, TEAM } from './config.js';

/**
 * AI General — Path/L1 pivot chains, lane booking, segment handoff.
 * Units follow A→B then next; Approach/Engage/Retreat sit on top in sim.
 */

const LANE_ORDER = Object.freeze(['left', 'mid', 'right']);

/** 9 L1 reference points inside a Path (corners + edge mid + center). */
export function getPathL1Points(path) {
  const { x, y } = path;
  const s = PATH_SIZE;
  const h = s * 0.5;
  return {
    NW: { x: x + L1_SIZE * 0.5, y: y + L1_SIZE * 0.5 },
    N: { x: x + h, y: y + L1_SIZE * 0.5 },
    NE: { x: x + s - L1_SIZE * 0.5, y: y + L1_SIZE * 0.5 },
    W: { x: x + L1_SIZE * 0.5, y: y + h },
    C: { x: x + h, y: y + h },
    E: { x: x + s - L1_SIZE * 0.5, y: y + h },
    SW: { x: x + L1_SIZE * 0.5, y: y + s - L1_SIZE * 0.5 },
    S: { x: x + h, y: y + s - L1_SIZE * 0.5 },
    SE: { x: x + s - L1_SIZE * 0.5, y: y + s - L1_SIZE * 0.5 },
  };
}

export function createGeneralState() {
  return {
    groups: [],
    laneCursorBySide: Object.create(null),
    targetPathIndex: -1,
  };
}

/** L1 port key for pipe mask: `pathIndex:KEY` e.g. `3:N`. */
export function l1PortKey(pathIndex, pointKey) {
  return `${pathIndex}:${pointKey}`;
}

/**
 * Mask Path L1 ports whose centers fall inside BaseChunk AABB.
 * Returns { active, maskedKeys:Set, navPoints } — pipes stay in graph, just skipped.
 */
export function maskBaseChunkL1Pipes(world, baseChunk) {
  const maskedKeys = new Set();
  if (!world || !baseChunk) {
    return { active: false, maskedKeys, navPoints: [] };
  }
  for (let i = 0; i < world.paths.length; i++) {
    const path = world.paths[i];
    const pts = getPathL1Points(path);
    for (const key of Object.keys(pts)) {
      const p = pts[key];
      if (pointInBaseChunk(p.x, p.y, baseChunk)) {
        maskedKeys.add(l1PortKey(path.index, key));
      }
    }
  }
  const navPoints = buildBaseChunkNavPoints(baseChunk);
  return { active: true, maskedKeys, navPoints };
}

export function clearBaseChunkL1Mask(match) {
  if (!match) return;
  match.pathPipeMask = { active: false, maskedKeys: new Set(), navPoints: [] };
}

function pointInBaseChunk(x, y, zone) {
  return x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h;
}

/** Edge midpoints of BaseChunk used as replacement navigation when L1 ports masked. */
export function buildBaseChunkNavPoints(zone) {
  if (!zone) return [];
  const { x, y, w, h } = zone;
  return [
    { x: x + w * 0.5, y: y, radius: 90, label: 'BC_N' },
    { x: x + w, y: y + h * 0.5, radius: 90, label: 'BC_E' },
    { x: x + w * 0.5, y: y + h, radius: 90, label: 'BC_S' },
    { x: x, y: y + h * 0.5, radius: 90, label: 'BC_W' },
    { x: x + w * 0.5, y: y + h * 0.5, radius: 100, label: 'BC_C' },
  ];
}

export function isL1PortMasked(match, pathIndex, pointKey) {
  const mask = match && match.pathPipeMask;
  if (!mask || !mask.active || !mask.maskedKeys) return false;
  return mask.maskedKeys.has(l1PortKey(pathIndex, pointKey));
}

/** If point is inside active BaseChunk mask, snap to nearest BaseChunk nav point. */
export function rerouteAroundBaseChunk(match, x, y) {
  const zone = match && match.baseChunk;
  const mask = match && match.pathPipeMask;
  if (!zone || !mask || !mask.active) return { x, y };
  if (!pointInBaseChunk(x, y, zone)) return { x, y };
  const nav = zone.navPoints || mask.navPoints || buildBaseChunkNavPoints(zone);
  let best = nav[0] || { x: zone.cx, y: zone.cy };
  let bestD = Infinity;
  for (let i = 0; i < nav.length; i++) {
    const n = nav[i];
    // Prefer edge points over center when approaching.
    if (n.label === 'BC_C') continue;
    const d = (n.x - x) * (n.x - x) + (n.y - y) * (n.y - y);
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return { x: best.x, y: best.y };
}

function pathAt(world, col, row) {
  if (col < 0 || row < 0 || col >= world.pathGridN || row >= world.pathGridN) {
    return null;
  }
  return world.paths[row * world.pathGridN + col];
}

function pathIndexOf(world, x, y) {
  const col = Math.floor(x / PATH_SIZE);
  const row = Math.floor(y / PATH_SIZE);
  const p = pathAt(world, col, row);
  return p ? p.index : -1;
}

function spawnSideFromPos(world, x, y) {
  const cx = world.worldW * 0.5;
  const cy = world.worldH * 0.5;
  const dx = x - cx;
  const dy = y - cy;
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'west' : 'east';
  return dy < 0 ? 'north' : 'south';
}

function bookLane(general, side) {
  const key = side || 'any';
  let cursor = general.laneCursorBySide[key] | 0;
  const lane = LANE_ORDER[cursor % LANE_ORDER.length];
  general.laneCursorBySide[key] = cursor + 1;
  return lane;
}

/**
 * Build A→B→C pivot chain from spawn toward target (base/player Path).
 * Lane offsets snap to L1 edge/center points.
 */
export function buildPivotChain(world, spawnX, spawnY, targetX, targetY, lane, match = null) {
  const startPath = pathIndexOf(world, spawnX, spawnY);
  const endPath = pathIndexOf(world, targetX, targetY);
  const start = world.paths.find((p) => p.index === startPath);
  const end = world.paths.find((p) => p.index === endPath);
  if (!start || !end) {
    return [{ x: targetX, y: targetY, radius: 80 }];
  }

  const sp = getPathL1Points(start);
  const ep = getPathL1Points(end);
  const laneShift = lane === 'left' ? -1 : lane === 'right' ? 1 : 0;

  // A = spawn L1 cell center (snap nearest of 9)
  let A = nearestL1(sp, spawnX, spawnY, match, start.index);
  A.x += laneShift * (L1_SIZE * 0.35);
  A.y += laneShift * (L1_SIZE * 0.1);
  A = applyMaskReroute(match, A);

  const chain = [{ x: A.x, y: A.y, radius: 70, label: 'A' }];

  // Intermediate Path stepping (Manhattan Path hops)
  let col = start.col;
  let row = start.row;
  let guard = 0;
  while ((col !== end.col || row !== end.row) && guard < 12) {
    guard += 1;
    if (col !== end.col) col += col < end.col ? 1 : -1;
    else if (row !== end.row) row += row < end.row ? 1 : -1;
    const mid = pathAt(world, col, row);
    if (!mid) break;
    const pts = getPathL1Points(mid);
    let enter;
    if (mid.col > start.col || (mid.col === end.col && mid.row !== start.row && end.col >= start.col)) {
      enter = lanePick(pts, 'W', lane);
    } else if (mid.col < start.col) {
      enter = lanePick(pts, 'E', lane);
    } else if (mid.row > start.row) {
      enter = lanePick(pts, 'N', lane);
    } else {
      enter = lanePick(pts, 'S', lane);
    }
    enter = applyMaskReroute(match, enter);
    chain.push({ x: enter.x, y: enter.y, radius: 75, label: `P${mid.index}` });
  }

  let approach = lanePick(ep, facingKey(end, targetX, targetY), lane);
  approach = applyMaskReroute(match, approach);
  chain.push({ x: approach.x, y: approach.y, radius: 80, label: 'C' });
  // Final approach uses BaseChunk nav if base present
  if (match && match.baseChunk && match.pathPipeMask && match.pathPipeMask.active) {
    const nav = match.baseChunk.navPoints || match.pathPipeMask.navPoints;
    if (nav && nav.length) {
      let best = nav[0];
      let bestD = Infinity;
      for (let i = 0; i < nav.length; i++) {
        if (nav[i].label === 'BC_C') continue;
        const d =
          (nav[i].x - targetX) * (nav[i].x - targetX) +
          (nav[i].y - targetY) * (nav[i].y - targetY);
        if (d < bestD) {
          bestD = d;
          best = nav[i];
        }
      }
      chain.push({ x: best.x, y: best.y, radius: 90, label: best.label || 'BC' });
    }
  }
  chain.push({ x: targetX, y: targetY, radius: 90, label: 'T' });
  return chain;
}

function applyMaskReroute(match, pt) {
  if (!match || !pt) return pt;
  const r = rerouteAroundBaseChunk(match, pt.x, pt.y);
  return { x: r.x, y: r.y };
}

function facingKey(path, tx, ty) {
  const cx = path.x + PATH_SIZE * 0.5;
  const cy = path.y + PATH_SIZE * 0.5;
  const dx = tx - cx;
  const dy = ty - cy;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'E' : 'W';
  return dy > 0 ? 'S' : 'N';
}

function lanePick(pts, edgeKey, lane) {
  const base = pts[edgeKey] || pts.C;
  if (lane === 'mid') return { x: base.x, y: base.y };
  const ortho = edgeKey === 'N' || edgeKey === 'S' ? 'x' : 'y';
  const shift = (lane === 'left' ? -1 : 1) * L1_SIZE * 0.35;
  if (ortho === 'x') return { x: base.x + shift, y: base.y };
  return { x: base.x, y: base.y + shift };
}

function nearestL1(pts, x, y, match = null, pathIndex = -1) {
  let best = pts.C;
  let bestD = Infinity;
  for (const k of Object.keys(pts)) {
    if (match && pathIndex >= 0 && isL1PortMasked(match, pathIndex, k)) continue;
    const p = pts[k];
    const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return { x: best.x, y: best.y };
}

/** Clear group pattern / lane booking before a new wave. */
export function resetGeneral(match) {
  match.general = createGeneralState();
  return match.general;
}

/**
 * Compute paths GROUP BY GROUP (g1 finish → g2 → g3). Does not spawn units.
 * @param {Array<Array<{x:number,y:number}>>} groupSpawnLists
 * @returns prepared plans ready for deploy
 */
export function prepareGroupPathsSequential(match, groupSpawnLists, targetX, targetY) {
  if (!match.general) match.general = createGeneralState();
  const general = match.general;
  const prepared = [];
  for (let i = 0; i < groupSpawnLists.length; i++) {
    const positions = groupSpawnLists[i];
    if (!positions || !positions.length) continue;
    const side = spawnSideFromPos(match.world, positions[0].x, positions[0].y);
    const lane = bookLane(general, side);
    const pivots = buildPivotChain(
      match.world,
      positions[0].x,
      positions[0].y,
      targetX,
      targetY,
      lane,
      match
    );
    prepared.push({ positions, side, lane, pivots });
  }
  return prepared;
}

/**
 * Apply/Deploy group records only after all group paths are prepared.
 * @returns group objects (same order as prepared)
 */
export function deployPreparedGroups(match, prepared, targetX, targetY) {
  if (!match.general) match.general = createGeneralState();
  const general = match.general;
  const groups = [];
  const tx =
    typeof targetX === 'number'
      ? targetX
      : match.base
        ? match.base.x + match.base.w / 2
        : 0;
  const ty =
    typeof targetY === 'number'
      ? targetY
      : match.base
        ? match.base.y + match.base.h / 2
        : 0;
  for (let i = 0; i < prepared.length; i++) {
    const p = prepared[i];
    const group = {
      id: general.groups.length,
      lane: p.lane,
      side: p.side,
      pivots: p.pivots,
      segmentIndex: 0,
      unitIds: [],
      spotted: false,
      sectorStart: 0,
      sectorEnd: Math.PI * 2,
    };
    if (p.positions && p.positions.length) {
      const sx = p.positions[0].x;
      const sy = p.positions[0].y;
      const bearing = Math.atan2(ty - sy, tx - sx);
      const half = Math.PI / 4;
      group.sectorStart = bearing - half;
      group.sectorEnd = bearing + half;
    }
    general.groups.push(group);
    groups.push(group);
  }
  return groups;
}

/**
 * Register a spawn group with shared pivot chain.
 * @returns group object
 * @deprecated prefer prepareGroupPathsSequential + deployPreparedGroups per wave
 */
export function registerGroup(match, spawnPositions, targetX, targetY) {
  const prepared = prepareGroupPathsSequential(
    match,
    [spawnPositions],
    targetX,
    targetY
  );
  const groups = deployPreparedGroups(match, prepared);
  return groups[0] || null;
}

export function attachUnitToGroup(group, unit) {
  group.unitIds.push(unit.id);
  unit.groupId = group.id;
  unit.pivotIndex = 0;
  unit.pathGoalX = group.pivots[0].x;
  unit.pathGoalY = group.pivots[0].y;
}

/** Advance unit along pivot chain when near current pivot. */
export function advanceUnitAlongChain(match, unit) {
  const group = match.general && match.general.groups[unit.groupId];
  if (!group || !group.pivots.length) return null;
  const idx = Math.min(unit.pivotIndex | 0, group.pivots.length - 1);
  const pivot = group.pivots[idx];
  const dist = Math.hypot(pivot.x - unit.x, pivot.y - unit.y);
  if (dist <= pivot.radius) {
    if (idx < group.pivots.length - 1) {
      unit.pivotIndex = idx + 1;
    }
  }
  const goal = group.pivots[Math.min(unit.pivotIndex, group.pivots.length - 1)];
  unit.pathGoalX = goal.x;
  unit.pathGoalY = goal.y;
  return goal;
}

/**
 * If segment blocked by player-team placeable or resource, return sub-pivot
 * and allow shooting/destroying the blocker.
 */
export function resolveObstacleOnPath(match, unit, goal) {
  if (!goal || !match.blocks) return { goal, attackBlock: null };
  const samples = 6;
  for (let s = 1; s <= samples; s++) {
    const t = s / samples;
    const x = unit.x + (goal.x - unit.x) * t;
    const y = unit.y + (goal.y - unit.y) * t;
    const block = findSolidBlockAt(match, x, y);
    if (!block) continue;
    if (!isPathBlockingTarget(block)) continue;
    // Sub-pivot: offset perpendicular within Path
    const dx = goal.x - unit.x;
    const dy = goal.y - unit.y;
    const len = Math.hypot(dx, dy) || 1;
    const ox = -dy / len;
    const oy = dx / len;
    const sign = unit.id % 2 === 0 ? 1 : -1;
    return {
      goal: {
        x: unit.x + dx * 0.35 + ox * L1_SIZE * 0.4 * sign,
        y: unit.y + dy * 0.35 + oy * L1_SIZE * 0.4 * sign,
        radius: 60,
      },
      attackBlock: block,
    };
  }
  return { goal, attackBlock: null };
}

/** Player structures + harvest resources may be destroyed when blocking. */
function isPathBlockingTarget(block) {
  if (!block.alive || block.isOpen) return false;
  if (block.walkSolid === false) return false;
  if (block.isHarvest) return true;
  if (block.team === TEAM.PLAYER) return true;
  return false;
}

function findSolidBlockAt(match, x, y) {
  for (let i = 0; i < match.blocks.length; i++) {
    const b = match.blocks[i];
    if (!b || !b.alive) continue;
    if (b.isOpen) continue;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
  }
  return null;
}

export function updateGeneralTarget(match, targetX, targetY) {
  if (!match.general) return;
  const idx = pathIndexOf(match.world, targetX, targetY);
  if (idx === match.general.targetPathIndex) return;
  match.general.targetPathIndex = idx;
  // Soft update: only extend final pivot of existing groups
  for (let i = 0; i < match.general.groups.length; i++) {
    const g = match.general.groups[i];
    if (!g.pivots.length) continue;
    const last = g.pivots[g.pivots.length - 1];
    last.x = targetX;
    last.y = targetY;
  }
}

/** Normalize angle into (-PI, PI]. */
export function normalizeAngle(a) {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x <= -Math.PI) x += Math.PI * 2;
  return x;
}

/** True if unit angle from group spawn→unit is still inside Sector Pi. */
export function isUnitInsideSector(group, unitX, unitY) {
  if (!group || group.sectorStart == null || group.sectorEnd == null) return true;
  if (!group.pivots || !group.pivots.length) return true;
  const origin = group.pivots[0];
  const ang = Math.atan2(unitY - origin.y, unitX - origin.x);
  let start = group.sectorStart;
  let end = group.sectorEnd;
  // Handle wrap
  const a = normalizeAngle(ang);
  start = normalizeAngle(start);
  end = normalizeAngle(end);
  if (start <= end) return a >= start && a <= end;
  return a >= start || a <= end;
}

/**
 * Local General stub — when unit falls off group path / leaves sector,
 * mark localGeneral and retarget nearest remaining pivot or base.
 * Foundation only (not full AskKeep depth).
 */
export function applyLocalGeneralStub(match, unit, baseX, baseY) {
  if (!unit || !match.general) return null;
  const group = match.general.groups[unit.groupId];
  if (!group) {
    unit.localGeneral = true;
    unit.pathGoalX = baseX;
    unit.pathGoalY = baseY;
    return { x: baseX, y: baseY, radius: 120 };
  }

  const inSector = isUnitInsideSector(group, unit.x, unit.y);
  // Far from current pivot → off path
  const idx = Math.min(unit.pivotIndex | 0, group.pivots.length - 1);
  const pivot = group.pivots[idx];
  const dist = Math.hypot(pivot.x - unit.x, pivot.y - unit.y);
  const offPath = dist > (pivot.radius || 80) * 4;

  if (!inSector || offPath) {
    unit.localGeneral = true;
    // Rejoin: snap goal to nearest later pivot, else base
    let best = { x: baseX, y: baseY, radius: 120 };
    let bestD = Infinity;
    for (let i = idx; i < group.pivots.length; i++) {
      const p = group.pivots[i];
      const d = Math.hypot(p.x - unit.x, p.y - unit.y);
      if (d < bestD) {
        bestD = d;
        best = p;
        unit.pivotIndex = i;
      }
    }
    const routed = applyMaskReroute(match, best);
    unit.pathGoalX = routed.x;
    unit.pathGoalY = routed.y;
    return { x: routed.x, y: routed.y, radius: best.radius || 100 };
  }

  unit.localGeneral = false;
  return null;
}

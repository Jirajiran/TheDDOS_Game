/**
 * Packaging-time tactical bake: L3 walk grid → nav graph + cover waypoints.
 * Runtime should read the graph — do not re-scan the whole board each tick.
 */

import { BLOCK_SIZE, PATH_SIZE } from './defaultMapFactory.js';

const DIRS = [
  { key: 'N', dc: 0, dr: -1 },
  { key: 'E', dc: 1, dr: 0 },
  { key: 'S', dc: 0, dr: 1 },
  { key: 'W', dc: -1, dr: 0 },
];

function itemOf(doc, templateId) {
  if (!doc || !templateId) return null;
  if (doc.items && doc.items[templateId]) return doc.items[templateId];
  return null;
}

function footprintBlocks(doc, placed) {
  if (!placed) return { w: 1, h: 1 };
  if (placed.kind === 'unit') return { w: 1, h: 1 };
  const tpl = itemOf(doc, placed.templateId);
  const fp = (tpl && tpl.footprint) || placed.footprint;
  const w = Math.max(1, (fp && fp.w) | 0 || 1);
  const h = Math.max(1, (fp && fp.h) | 0 || 1);
  return { w, h };
}

function isWalkSolid(doc, placed) {
  if (!placed || placed.kind === 'unit') return false;
  const tpl = itemOf(doc, placed.templateId);
  if (!tpl) return true;
  if (tpl.walkSolid === false) return false;
  return tpl.walkSolid !== false;
}

function isProjSolid(doc, placed) {
  if (!placed || placed.kind === 'unit') return false;
  const tpl = itemOf(doc, placed.templateId);
  if (!tpl) return false;
  if (tpl.allowProjectilePass) return false;
  if (tpl.projectileSolid === true || tpl.blocksProjectiles === true) return true;
  return tpl.projectileSolid !== false && tpl.kind === 'PLACEABLE';
}

function worldDims(doc) {
  const cols = (doc.pathCols | 0) || 1;
  const rows = (doc.pathRows | 0) || 1;
  return {
    worldW: cols * PATH_SIZE,
    worldH: rows * PATH_SIZE,
    gridCols: ((cols * PATH_SIZE) / BLOCK_SIZE) | 0,
    gridRows: ((rows * PATH_SIZE) / BLOCK_SIZE) | 0,
  };
}

function markSolidRect(grid, gridCols, gridRows, col0, row0, w, h, flag) {
  for (let r = row0; r < row0 + h; r++) {
    if (r < 0 || r >= gridRows) continue;
    for (let c = col0; c < col0 + w; c++) {
      if (c < 0 || c >= gridCols) continue;
      const i = r * gridCols + c;
      grid[i] = grid[i] | flag;
    }
  }
}

const FLAG_WALK_BLOCK = 1;
const FLAG_PROJ_BLOCK = 2;

function buildSolidGrids(doc) {
  const dims = worldDims(doc);
  const { gridCols, gridRows } = dims;
  const cells = gridCols * gridRows;
  const flags = new Uint8Array(cells);
  const list = doc.placedObjects || [];
  for (let i = 0; i < list.length; i++) {
    const placed = list[i];
    if (!placed) continue;
    const col0 = Math.floor((placed.x || 0) / BLOCK_SIZE);
    const row0 = Math.floor((placed.y || 0) / BLOCK_SIZE);
    const fp = footprintBlocks(doc, placed);
    if (isWalkSolid(doc, placed)) {
      markSolidRect(flags, gridCols, gridRows, col0, row0, fp.w, fp.h, FLAG_WALK_BLOCK);
    }
    if (isProjSolid(doc, placed)) {
      markSolidRect(flags, gridCols, gridRows, col0, row0, fp.w, fp.h, FLAG_PROJ_BLOCK);
    }
  }
  return { flags, gridCols, gridRows, dims };
}

function nodeId(c, r) {
  return c + ',' + r;
}

function coverQuality(flags, gridCols, gridRows, c, r, dir) {
  // Standing in open cell; cover from adjacent proj-solid in opposite fire direction.
  const behindC = c - dir.dc;
  const behindR = r - dir.dr;
  if (behindC < 0 || behindR < 0 || behindC >= gridCols || behindR >= gridRows) return 0;
  const behind = flags[behindR * gridCols + behindC];
  if (!(behind & FLAG_PROJ_BLOCK)) return 0;
  // Peek cell toward threat must be walkable.
  const peekC = c + dir.dc;
  const peekR = r + dir.dr;
  if (peekC < 0 || peekR < 0 || peekC >= gridCols || peekR >= gridRows) return 0.35;
  const peek = flags[peekR * gridCols + peekC];
  if (peek & FLAG_WALK_BLOCK) return 0.25;
  return peek & FLAG_PROJ_BLOCK ? 0.55 : 0.85;
}

/**
 * @param {object} doc mapDoc
 * @param {{ force?: boolean }} [opts] force=true rebuilds even if manual overrides exist (still preserves per-waypoint manualOverride)
 */
export function bakeTacticalData(doc, opts) {
  if (!doc || typeof doc !== 'object') return doc;
  const force = !!(opts && opts.force);
  const prevWaypoints = Array.isArray(doc.tacticalWaypoints) ? doc.tacticalWaypoints : [];
  const manualKeep = [];
  for (let i = 0; i < prevWaypoints.length; i++) {
    const wp = prevWaypoints[i];
    if (wp && wp.manualOverride) manualKeep.push(wp);
  }
  const meta = doc.tacticalMeta && typeof doc.tacticalMeta === 'object' ? doc.tacticalMeta : {};
  if (!force && meta.manualOverrideGlobal && manualKeep.length && prevWaypoints.length) {
    // Designer locked global bake — only refresh meta stamp.
    doc.tacticalMeta = Object.assign({}, meta, {
      blockSize: BLOCK_SIZE,
      bakedAt: Date.now(),
      skipped: 'manualOverrideGlobal',
    });
    return doc;
  }

  const { flags, gridCols, gridRows } = buildSolidGrids(doc);
  const nodes = [];
  const nodeIndex = Object.create(null);
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (flags[r * gridCols + c] & FLAG_WALK_BLOCK) continue;
      const id = nodeId(c, r);
      nodeIndex[id] = nodes.length;
      nodes.push({
        id,
        c,
        r,
        x: c * BLOCK_SIZE + BLOCK_SIZE / 2,
        y: r * BLOCK_SIZE + BLOCK_SIZE / 2,
      });
    }
  }

  const edges = [];
  const edgeSeen = Object.create(null);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    for (let d = 0; d < DIRS.length; d++) {
      const dir = DIRS[d];
      const nc = n.c + dir.dc;
      const nr = n.r + dir.dr;
      const nid = nodeId(nc, nr);
      if (nodeIndex[nid] == null) continue;
      const a = n.id;
      const b = nid;
      const key = a < b ? a + '|' + b : b + '|' + a;
      if (edgeSeen[key]) continue;
      edgeSeen[key] = true;
      edges.push({ a, b });
    }
  }

  const waypoints = [];
  const wpSeen = Object.create(null);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const cover = { N: 0, E: 0, S: 0, W: 0 };
    let any = 0;
    for (let d = 0; d < DIRS.length; d++) {
      const dir = DIRS[d];
      const q = coverQuality(flags, gridCols, gridRows, n.c, n.r, dir);
      cover[dir.key] = q;
      if (q > 0) any += 1;
    }
    if (!any) continue;
    const id = 'cover_' + n.id;
    wpSeen[n.c + ':' + n.r] = true;
    waypoints.push({
      id,
      c: n.c,
      r: n.r,
      x: n.x,
      y: n.y,
      cover,
      coverKind: 'SmallArms',
      manualOverride: false,
    });
  }

  // Preserve manual waypoints (by grid cell).
  for (let i = 0; i < manualKeep.length; i++) {
    const wp = manualKeep[i];
    const c = wp.c != null ? wp.c | 0 : Math.floor((wp.x || 0) / BLOCK_SIZE);
    const r = wp.r != null ? wp.r | 0 : Math.floor((wp.y || 0) / BLOCK_SIZE);
    const key = c + ':' + r;
    if (wpSeen[key]) {
      // Replace auto with manual at same cell.
      for (let j = 0; j < waypoints.length; j++) {
        if (waypoints[j].c === c && waypoints[j].r === r) {
          waypoints[j] = Object.assign({}, wp, { c, r, manualOverride: true });
          break;
        }
      }
    } else {
      waypoints.push(Object.assign({}, wp, { c, r, manualOverride: true }));
    }
  }

  // Compact walkable bitmask as base64-ish string of 0/1 runs (optional debug).
  const walkable = new Array(gridCols * gridRows);
  for (let i = 0; i < walkable.length; i++) {
    walkable[i] = flags[i] & FLAG_WALK_BLOCK ? 0 : 1;
  }

  doc.navGraph = { nodes, edges, gridCols, gridRows, blockSize: BLOCK_SIZE };
  doc.walkableGrid = { cols: gridCols, rows: gridRows, blockSize: BLOCK_SIZE, cells: walkable };
  doc.tacticalWaypoints = waypoints;
  doc.tacticalMeta = {
    blockSize: BLOCK_SIZE,
    bakedAt: Date.now(),
    nodeCount: nodes.length,
    edgeCount: edges.length,
    waypointCount: waypoints.length,
    manualOverrideGlobal: !!meta.manualOverrideGlobal,
  };
  return doc;
}

/** Highlight issues for Graph Quality Check overlay. */
export function assessNavGraphQuality(doc) {
  const graph = doc && doc.navGraph;
  const issues = [];
  if (!graph || !Array.isArray(graph.nodes) || !graph.nodes.length) {
    issues.push({ type: 'empty', message: 'No nav nodes — place walkable space or bake.' });
    return issues;
  }
  const { nodes, edges, gridCols, gridRows } = graph;
  const adj = Object.create(null);
  for (let i = 0; i < nodes.length; i++) adj[nodes[i].id] = [];
  for (let i = 0; i < (edges || []).length; i++) {
    const e = edges[i];
    if (!e || adj[e.a] == null || adj[e.b] == null) continue;
    adj[e.a].push(e.b);
    adj[e.b].push(e.a);
  }
  // BFS components
  const seen = Object.create(null);
  let components = 0;
  let largest = 0;
  for (let i = 0; i < nodes.length; i++) {
    const start = nodes[i].id;
    if (seen[start]) continue;
    components += 1;
    const queue = [start];
    seen[start] = true;
    let size = 0;
    while (queue.length) {
      const id = queue.shift();
      size += 1;
      const next = adj[id] || [];
      for (let j = 0; j < next.length; j++) {
        if (seen[next[j]]) continue;
        seen[next[j]] = true;
        queue.push(next[j]);
      }
    }
    if (size > largest) largest = size;
  }
  if (components > 1) {
    issues.push({
      type: 'disconnected',
      message: components + ' disconnected walk regions (largest ' + largest + ' nodes)',
      components,
      largest,
    });
  }
  // Isolated nodes
  let isolated = 0;
  for (let i = 0; i < nodes.length; i++) {
    if (!(adj[nodes[i].id] || []).length) isolated += 1;
  }
  if (isolated) {
    issues.push({
      type: 'isolated',
      message: isolated + ' isolated walk cells',
      count: isolated,
    });
  }
  const wps = (doc && doc.tacticalWaypoints) || [];
  let weakCover = 0;
  for (let i = 0; i < wps.length; i++) {
    const c = wps[i] && wps[i].cover;
    if (!c) continue;
    const max = Math.max(c.N || 0, c.E || 0, c.S || 0, c.W || 0);
    if (max > 0 && max < 0.4) weakCover += 1;
  }
  if (weakCover) {
    issues.push({
      type: 'weakCover',
      message: weakCover + ' cover points with low quality',
      count: weakCover,
    });
  }
  if (gridCols && gridRows && nodes.length < (gridCols * gridRows) * 0.05) {
    issues.push({
      type: 'sparse',
      message: 'Walkable area is very sparse relative to map size',
    });
  }
  return issues;
}

export function needsTacticalBake(doc) {
  if (!doc) return true;
  const nodes = doc.navGraph && doc.navGraph.nodes;
  if (!nodes || !nodes.length) return true;
  if (!Array.isArray(doc.tacticalWaypoints)) return true;
  return false;
}

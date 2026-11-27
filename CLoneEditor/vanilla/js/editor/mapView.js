/**
 * Map visual. Path cells are the grid. Areas are rectangles drawn on top.
 * Placed objects and units snap to the L3 grid (64x64) and never overlap footprints.
 * Units/turrets use real SizeView SVG (overflow visible). Blocks use colored footprint only.
 */

import { PATH_SIZE, clampRect, nextAreaId, worldSize } from './mapDoc.js';
import {
  buildStructureMapIcon,
  buildUnitMapIcon,
  buildVehicleMapIcon,
  ensureMapArtDefs,
  getParsedUnitArt,
  itemFootprint,
} from './unitArt.js';

function isVehicleItemDef(itemDef) {
  if (!itemDef) return false;
  return !!(
    itemDef.kind === 'VEHICLE' ||
    itemDef.isVehicle ||
    /^Vehicle_/i.test(String(itemDef.artId || ''))
  );
}

/** Unit Tool Draw may pick a Vehicle item template (unit-host). */
function vehicleItemOf(doc, templateId) {
  if (!doc || !templateId || !doc.items) return null;
  const rec = doc.items[templateId];
  return isVehicleItemDef(rec) ? rec : null;
}

const L3_GRID_SIZE = 64;

const EDGE = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
const CURSOR = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
};

const TEAM_COLORS = {
  0: '#8b949e', // Neutral grey
  1: '#388bfd', // Player / friendly blue
  2: '#f85149', // Enemy / hostile red
  3: '#a371f7', // Purple
  4: '#d29922', // Orange
  5: '#2ea043', // Green
  6: '#f0883e', // Orange-red
};

function el(name, attrs) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  const keys = Object.keys(attrs || {});
  for (let i = 0; i < keys.length; i++) node.setAttribute(keys[i], attrs[keys[i]]);
  return node;
}

export function clientToWorld(svg, clientX, clientY) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

/**
 * Map viewport stays full-bleed and centered — Trail / Panel / Tools are
 * overlays only. Never pad the map when help/preview opens (that shifted PlaceHold).
 */
export function syncMapVisibleInsets() {
  const wrap = document.querySelector('.editor-map-wrap');
  const map = wrap && wrap.querySelector('.editor-map');
  if (!map) return;
  map.style.boxSizing = 'border-box';
  map.style.paddingLeft = '0px';
  map.style.paddingRight = '0px';
  map.style.paddingBottom = '0px';
  map.style.paddingTop = '0px';
}

/** Clear any leftover inset after tray/layout changes. */
export function scheduleMapVisibleInsets() {
  syncMapVisibleInsets();
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(syncMapVisibleInsets);
  }
}

function hitArea(doc, x, y) {
  const areas = doc.areas;
  for (let i = areas.length - 1; i >= 0; i--) {
    const area = areas[i];
    if (x >= area.x && y >= area.y && x <= area.x + area.w && y <= area.y + area.h) {
      return area;
    }
  }
  return null;
}

function placedDimensions(doc, item) {
  if (!item) return { w: L3_GRID_SIZE, h: L3_GRID_SIZE };
  const vehicle = vehicleItemOf(doc, item.templateId);
  if (item.kind === 'unit' && !vehicle) {
    return { w: L3_GRID_SIZE, h: L3_GRID_SIZE };
  }
  const itemDef = vehicle || (doc && doc.items && doc.items[item.templateId]);
  const fp = itemFootprint(itemDef);
  return {
    w: fp.w * L3_GRID_SIZE,
    h: fp.h * L3_GRID_SIZE,
  };
}

function hitPlacedObject(doc, x, y) {
  const list = doc.placedObjects || [];
  for (let i = list.length - 1; i >= 0; i--) {
    const item = list[i];
    const dim = placedDimensions(doc, item);
    if (x >= item.x && x <= item.x + dim.w && y >= item.y && y <= item.y + dim.h) {
      return item;
    }
  }
  return null;
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function hasPlacedOverlap(doc, x, y, w, h, ignoreId, reservedMap, ignoreIds) {
  const list = (doc && doc.placedObjects) || [];
  const ignoreSet = ignoreIds || null;
  for (let i = 0; i < list.length; i++) {
    const other = list[i];
    if (!other) continue;
    if (ignoreId && other.id === ignoreId) continue;
    if (ignoreSet && ignoreSet[other.id]) continue;
    const dim = placedDimensions(doc, other);
    if (rectsOverlap(x, y, w, h, other.x, other.y, dim.w, dim.h)) {
      return true;
    }
  }
  if (reservedMap && reservedMap.size) {
    for (const rect of reservedMap.values()) {
      if (!rect) continue;
      if (rectsOverlap(x, y, w, h, rect.x, rect.y, rect.w, rect.h)) return true;
    }
  }
  return false;
}

/** Visit every footprint-aligned cell along the world segment (frame-rate independent). */
function forEachCellAlongSegment(x0, y0, x1, y1, cellW, cellH, world, visit) {
  const ax = snapCoord(x0, cellW, world.w);
  const ay = snapCoord(y0, cellH, world.h);
  const bx = snapCoord(x1, cellW, world.w);
  const by = snapCoord(y1, cellH, world.h);
  let cx0 = Math.round(ax / cellW);
  let cy0 = Math.round(ay / cellH);
  let cx1 = Math.round(bx / cellW);
  let cy1 = Math.round(by / cellH);
  const dx = Math.abs(cx1 - cx0);
  const dy = Math.abs(cy1 - cy0);
  const sx = cx0 < cx1 ? 1 : -1;
  const sy = cy0 < cy1 ? 1 : -1;
  let err = dx - dy;
  let cx = cx0;
  let cy = cy0;
  for (;;) {
    visit(cx * cellW, cy * cellH);
    if (cx === cx1 && cy === cy1) break;
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      cx += sx;
    }
    if (e2 < dx) {
      err += dx;
      cy += sy;
    }
  }
}

function placedInMarquee(doc, rect) {
  const out = [];
  if (!rect || rect.w < 1 || rect.h < 1) return out;
  const list = (doc && doc.placedObjects) || [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item) continue;
    const dim = placedDimensions(doc, item);
    if (rectsOverlap(rect.x, rect.y, rect.w, rect.h, item.x, item.y, dim.w, dim.h)) {
      out.push(item.id);
    }
  }
  return out;
}

function tolerance(svg, camera) {
  const rect = svg.getBoundingClientRect();
  return (camera.w / Math.max(1, rect.width)) * 12;
}

function edgeAt(area, x, y, tol) {
  const nearL = Math.abs(x - area.x) <= tol;
  const nearR = Math.abs(x - (area.x + area.w)) <= tol;
  const nearT = Math.abs(y - area.y) <= tol;
  const nearB = Math.abs(y - (area.y + area.h)) <= tol;
  const inX = x >= area.x - tol && x <= area.x + area.w + tol;
  const inY = y >= area.y - tol && y <= area.y + area.h + tol;
  let name = '';
  if (nearT && inX) name += 'n';
  if (nearB && inX) name += 's';
  if (nearL && inY) name += 'w';
  if (nearR && inY) name += 'e';
  if (name === 'ns' || name === 'we' || EDGE.indexOf(name) < 0) return '';
  return name;
}

/** Match gameplay: allow a bit of void past the map so content is not edge-stuck. */
const EDITOR_EDGE_MARGIN = 64;

function clampCamera(camera, world) {
  const minW = Math.min(world.w, 256);
  camera.w = Math.max(minW, Math.min(world.w, camera.w));
  camera.h = camera.w * (world.h / world.w);
  if (camera.h > world.h) {
    camera.h = world.h;
    camera.w = world.w;
  }
  const m = EDITOR_EDGE_MARGIN;
  if (camera.x < -m) camera.x = -m;
  if (camera.y < -m) camera.y = -m;
  if (camera.x + camera.w > world.w + m) camera.x = world.w + m - camera.w;
  if (camera.y + camera.h > world.h + m) camera.y = world.h + m - camera.h;
}

function snapCoord(val, span, maxSpan) {
  return Math.max(0, Math.min(maxSpan - span, Math.floor(val / L3_GRID_SIZE) * L3_GRID_SIZE));
}

function appendHpBar(group, x, y, width, height, curHp, maxHp) {
  const bg = el('rect', {
    x: x,
    y: y,
    width: width,
    height: height,
    rx: 2,
    fill: 'rgba(13, 17, 23, 0.9)',
    stroke: '#000000',
    'stroke-width': 0.5,
  });
  group.appendChild(bg);

  const cur = Math.max(0, curHp != null ? curHp : 100);
  const max = Math.max(1, maxHp != null ? maxHp : cur);
  const ratio = Math.min(1, cur / max);
  const fill = el('rect', {
    x: x,
    y: y,
    width: Math.max(2, width * ratio),
    height: height,
    rx: 2,
    fill: ratio > 0.5 ? '#2ea043' : ratio > 0.25 ? '#d29922' : '#f85149',
  });
  group.appendChild(fill);
}

export function mountMapView(svg, api) {
  let drag = null;
  let camera = null;
  let spaceDown = false;
  let hoverPos = null;

  function placeTemplateMeta(doc, paintDrag) {
    const isUnit = paintDrag.kind === 'unit';
    let wPx = L3_GRID_SIZE;
    let hPx = L3_GRID_SIZE;
    let tId = '';
    let defaultHp = 100;
    let chosenTeam = 1;
    if (isUnit) {
      tId = api.getToolUnitTemplate() || Object.keys(doc.units || {})[0] || 'Player';
      const vehicle = vehicleItemOf(doc, tId);
      if (vehicle) {
        const fp = itemFootprint(vehicle);
        wPx = fp.w * L3_GRID_SIZE;
        hPx = fp.h * L3_GRID_SIZE;
        defaultHp = vehicle.maxHp != null ? vehicle.maxHp : 400;
      } else {
        const unitDef = doc.units && doc.units[tId];
        defaultHp =
          (unitDef && unitDef.hpRange && unitDef.hpRange[1]) ||
          (unitDef && unitDef.maxHp) ||
          100;
      }
      chosenTeam = api.getToolUnitTeam ? api.getToolUnitTeam() : (tId === 'Player' ? 1 : 2);
    } else {
      tId = api.getToolObjTemplate() || Object.keys(doc.items || {})[0] || 'Wall_Wood';
      const itemDef = doc.items && doc.items[tId];
      const fp = itemFootprint(itemDef);
      wPx = fp.w * L3_GRID_SIZE;
      hPx = fp.h * L3_GRID_SIZE;
      defaultHp = (itemDef && (itemDef.maxHp != null ? itemDef.maxHp : itemDef.hp)) || 100;
      chosenTeam = api.getToolObjTeam ? api.getToolObjTeam() : 1;
    }
    return { isUnit, wPx, hPx, tId, defaultHp, chosenTeam };
  }

  function reserveCellJob(doc, paintDrag, meta, gx, gy) {
    const cellKey = gx + ',' + gy + ',' + meta.wPx + ',' + meta.hPx;
    if (!paintDrag.reserved) paintDrag.reserved = new Map();
    if (!paintDrag.queue) paintDrag.queue = [];
    if (paintDrag.reserved.has(cellKey)) return false;
    if (hasPlacedOverlap(doc, gx, gy, meta.wPx, meta.hPx, '', paintDrag.reserved)) return false;
    const job = {
      key: cellKey,
      x: gx,
      y: gy,
      w: meta.wPx,
      h: meta.hPx,
      kind: meta.isUnit ? 'unit' : 'object',
      templateId: meta.tId,
      team: meta.chosenTeam,
      currentHp: meta.defaultHp,
      maxHp: meta.defaultHp,
    };
    paintDrag.reserved.set(cellKey, job);
    paintDrag.queue.push(job);
    return true;
  }

  /** Reserve every footprint cell along the drag vector (not just pointer samples). */
  function reservePlaceAt(doc, world, p, paintDrag) {
    if (!doc || !paintDrag) return false;
    const meta = placeTemplateMeta(doc, paintDrag);
    const from = paintDrag.lastWorld || p;
    let added = 0;
    forEachCellAlongSegment(from.x, from.y, p.x, p.y, meta.wPx, meta.hPx, world, (gx, gy) => {
      if (reserveCellJob(doc, paintDrag, meta, gx, gy)) added += 1;
    });
    paintDrag.lastWorld = { x: p.x, y: p.y };
    if (added) {
      scheduleMaterialize(paintDrag);
      paint();
      return true;
    }
    return false;
  }

  function materializeJob(doc, paintDrag, job) {
    if (!doc || !paintDrag || !job) return false;
    if (!doc.placedObjects) doc.placedObjects = [];
    const newInst = {
      id: (job.kind === 'unit' ? 'unit_' : 'obj_') + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      kind: job.kind,
      templateId: job.templateId,
      x: job.x,
      y: job.y,
      team: job.team,
      currentHp: job.currentHp,
      maxHp: job.maxHp,
    };
    doc.placedObjects.push(newInst);
    if (paintDrag.reserved) paintDrag.reserved.delete(job.key);
    api.setSelectedPlacedId(newInst.id);
    api.selectArea('');
    paintDrag.placed = true;
    api.touch({ skipHistory: true });
    return true;
  }

  function materializeBatch(paintDrag, flushAll) {
    const doc = api.getDoc();
    if (!doc || !paintDrag || !paintDrag.queue) return;
    const budget = flushAll ? paintDrag.queue.length : Math.min(4, paintDrag.queue.length);
    let made = 0;
    while (made < budget && paintDrag.queue.length) {
      const job = paintDrag.queue.shift();
      if (materializeJob(doc, paintDrag, job)) made += 1;
    }
    if (made) paint();
  }

  function scheduleMaterialize(paintDrag) {
    if (!paintDrag || paintDrag.raf) return;
    paintDrag.raf = requestAnimationFrame(() => {
      paintDrag.raf = 0;
      materializeBatch(paintDrag, false);
      if (paintDrag.queue && paintDrag.queue.length) scheduleMaterialize(paintDrag);
    });
  }

  function flushPaintPlace(paintDrag) {
    if (!paintDrag) return;
    if (paintDrag.raf) {
      cancelAnimationFrame(paintDrag.raf);
      paintDrag.raf = 0;
    }
    materializeBatch(paintDrag, true);
  }

  function ensureCamera(world) {
    if (!camera || camera.boundW !== world.w || camera.boundH !== world.h) {
      camera = { x: 0, y: 0, w: world.w, h: world.h, boundW: world.w, boundH: world.h };
    }
    clampCamera(camera, world);
  }

  function emitViewState() {
    if (!api.onViewState) return;
    const doc = api.getDoc();
    if (!doc || !camera) return;
    const world = worldSize(doc);
    const zoomPct = Math.max(100, Math.round((world.w / Math.max(1, camera.w)) * 100));
    let gridX = null;
    let gridY = null;
    if (hoverPos && hoverPos.x >= 0 && hoverPos.y >= 0 && hoverPos.x < world.w && hoverPos.y < world.h) {
      // 1-based L3 cell indices (never show 0,0 — first cell is 1,1).
      gridX = Math.floor(hoverPos.x / L3_GRID_SIZE) + 1;
      gridY = Math.floor(hoverPos.y / L3_GRID_SIZE) + 1;
    }
    api.onViewState({ zoomPct, gridX, gridY });
  }

  function refreshCursor(worldPt) {
    const doc = api.getDoc();
    if (!doc) return;
    if (drag && drag.mode === 'pan') {
      svg.style.cursor = 'grabbing';
      return;
    }
    if (spaceDown) {
      svg.style.cursor = 'grab';
      return;
    }
    const toolMode = api.getToolMode ? api.getToolMode() : 'area';
    if (toolMode === 'place-obj' || toolMode === 'place-unit') {
      svg.style.cursor = 'cell';
      return;
    }
    const p = worldPt || hoverPos;
    if (toolMode === 'select') {
      if (p && hitPlacedObject(doc, p.x, p.y)) {
        svg.style.cursor = 'pointer';
        return;
      }
      if (p) {
        const tol = tolerance(svg, camera);
        for (let i = doc.areas.length - 1; i >= 0; i--) {
          const edge = edgeAt(doc.areas[i], p.x, p.y, tol);
          if (edge) {
            svg.style.cursor = CURSOR[edge];
            return;
          }
        }
        if (hitArea(doc, p.x, p.y)) {
          svg.style.cursor = 'move';
          return;
        }
      }
      svg.style.cursor = 'default';
      return;
    }
    // Area mode
    let cursor = 'crosshair';
    if (p) {
      const tol = tolerance(svg, camera);
      for (let i = doc.areas.length - 1; i >= 0; i--) {
        const edge = edgeAt(doc.areas[i], p.x, p.y, tol);
        if (edge) {
          cursor = CURSOR[edge];
          break;
        }
        if (hitArea(doc, p.x, p.y)) cursor = 'move';
      }
    }
    svg.style.cursor = cursor;
  }

  function paint() {
    const doc = api.getDoc();
    if (!doc) return;
    const world = worldSize(doc);
    ensureCamera(world);
    const selectedId = api.getSelectedAreaId();
    const highlightId = api.getHighlightAreaId();
    const selectedPlacedIds = api.getSelectedPlacedIds
      ? api.getSelectedPlacedIds()
      : (api.getSelectedPlacedId ? [api.getSelectedPlacedId()].filter(Boolean) : []);
    const selectedPlacedSet = {};
    for (let i = 0; i < selectedPlacedIds.length; i++) selectedPlacedSet[selectedPlacedIds[i]] = true;
    const toolMode = api.getToolMode ? api.getToolMode() : 'area';
    const pack = api.getPack ? api.getPack() : null;
    const onPoolReady = () => paint();

    svg.setAttribute(
      'viewBox',
      camera.x + ' ' + camera.y + ' ' + camera.w + ' ' + camera.h
    );
    svg.replaceChildren();

    // Shared Unit_Template defs so structure <use> weapon layers resolve (same as inspector).
    const parsedArt = getParsedUnitArt(pack);
    const artDefs = ensureMapArtDefs(svg, parsedArt);
    if (artDefs) svg.appendChild(artDefs);

    // 1. Ground background
    svg.appendChild(
      el('rect', { x: 0, y: 0, width: world.w, height: world.h, class: 'map-ground' })
    );

    // 2. Faint 64x64 L3 subgrid lines
    const totalCols = (world.w / L3_GRID_SIZE) | 0;
    const totalRows = (world.h / L3_GRID_SIZE) | 0;
    for (let c = 1; c < totalCols; c++) {
      if ((c * L3_GRID_SIZE) % PATH_SIZE === 0) continue;
      svg.appendChild(
        el('line', {
          x1: c * L3_GRID_SIZE,
          y1: 0,
          x2: c * L3_GRID_SIZE,
          y2: world.h,
          class: 'map-grid-sub',
        })
      );
    }
    for (let r = 1; r < totalRows; r++) {
      if ((r * L3_GRID_SIZE) % PATH_SIZE === 0) continue;
      svg.appendChild(
        el('line', {
          x1: 0,
          y1: r * L3_GRID_SIZE,
          x2: world.w,
          y2: r * L3_GRID_SIZE,
          class: 'map-grid-sub',
        })
      );
    }

    // 3. Path cells grid lines (1024x1024)
    for (let col = 0; col <= doc.pathCols; col++) {
      svg.appendChild(
        el('line', {
          x1: col * PATH_SIZE,
          y1: 0,
          x2: col * PATH_SIZE,
          y2: world.h,
          class: 'map-grid',
        })
      );
    }
    for (let row = 0; row <= doc.pathRows; row++) {
      svg.appendChild(
        el('line', {
          x1: 0,
          y1: row * PATH_SIZE,
          x2: world.w,
          y2: row * PATH_SIZE,
          class: 'map-grid',
        })
      );
    }

    // 4. Trigger/Spawn Areas
    for (let i = 0; i < doc.areas.length; i++) {
      const area = doc.areas[i];
      const selected = area.id === selectedId;
      const highlighted = area.id === highlightId;
      const cls =
        'map-area' +
        (selected ? ' is-selected' : '') +
        (highlighted ? ' is-spawn' : '');
      svg.appendChild(
        el('rect', {
          x: area.x,
          y: area.y,
          width: area.w,
          height: area.h,
          class: cls,
        })
      );
      const label = el('text', {
        x: area.x + 12,
        y: area.y + 28,
        class: 'map-label',
      });
      label.textContent = area.id;
      svg.appendChild(label);
    }

    // 5. Placed Objects & Units (64x64 Snap, non-overlapping, SizeView SVG art)
    const placedList = doc.placedObjects || [];
    for (let i = 0; i < placedList.length; i++) {
      const item = placedList[i];
      const isSelected = !!selectedPlacedSet[item.id];
      const teamColor = TEAM_COLORS[item.team != null ? item.team : 1] || '#388bfd';
      const dim = placedDimensions(doc, item);

      const group = el('g', {
        class: 'map-placed-obj' + (isSelected ? ' is-selected' : ''),
        'data-id': item.id,
      });

      const title = el('title', {});
      title.textContent = `${item.templateId || item.id} (Team ${item.team != null ? item.team : 1}) @ ${item.x},${item.y}`;
      group.appendChild(title);

      if (item.kind === 'unit') {
        const vehicleDef = vehicleItemOf(doc, item.templateId);
        if (vehicleDef) {
          const iconSvg = buildVehicleMapIcon(
            null,
            doc,
            vehicleDef,
            item.x,
            item.y,
            dim.w,
            dim.h,
            pack,
            onPoolReady
          );
          if (iconSvg) group.appendChild(iconSvg);
          const frame = el('rect', {
            x: item.x + 2,
            y: item.y + 2,
            width: Math.max(8, dim.w - 4),
            height: Math.max(8, dim.h - 4),
            rx: 4,
            fill: 'none',
            stroke: isSelected ? '#ffd700' : teamColor,
            'stroke-width': isSelected ? 3.5 : 1.75,
          });
          group.appendChild(frame);
          appendHpBar(
            group,
            item.x + 6,
            item.y + dim.h - 9,
            Math.max(12, dim.w - 12),
            5,
            item.currentHp,
            item.maxHp
          );
        } else {
          const unitDef = doc.units && doc.units[item.templateId];
          const iconSvg = buildUnitMapIcon(
            null,
            doc,
            unitDef || { id: item.templateId },
            item.x,
            item.y,
            L3_GRID_SIZE,
            L3_GRID_SIZE,
            pack,
            onPoolReady
          );
          if (iconSvg) {
            group.appendChild(iconSvg);
          } else {
            const fallbackLabel = el('text', {
              x: item.x + 32,
              y: item.y + 30,
              'text-anchor': 'middle',
              'dominant-baseline': 'middle',
              fill: '#f0f6fc',
              'font-size': '10',
              'font-weight': 'bold',
            });
            fallbackLabel.textContent = (item.templateId || 'Unit').slice(0, 7);
            group.appendChild(fallbackLabel);
          }

          const frame = el('rect', {
            x: item.x + 1,
            y: item.y + 1,
            width: L3_GRID_SIZE - 2,
            height: L3_GRID_SIZE - 2,
            rx: 3,
            fill: 'none',
            stroke: isSelected ? '#ffd700' : teamColor,
            'stroke-opacity': isSelected ? '1' : '0.45',
            'stroke-width': isSelected ? 2.5 : 1.5,
          });
          group.appendChild(frame);

          appendHpBar(group, item.x + 10, item.y + 56, 44, 4, item.currentHp, item.maxHp);
        }
      } else {
        const itemDef = doc.items && doc.items[item.templateId];
        const def = itemDef || { id: item.templateId };
        const structureIcon = isVehicleItemDef(def)
          ? buildVehicleMapIcon(null, doc, def, item.x, item.y, dim.w, dim.h, pack, onPoolReady)
          : buildStructureMapIcon(null, doc, def, item.x, item.y, dim.w, dim.h, pack, onPoolReady);
        if (structureIcon) group.appendChild(structureIcon);

        const frame = el('rect', {
          x: item.x + 2,
          y: item.y + 2,
          width: Math.max(8, dim.w - 4),
          height: Math.max(8, dim.h - 4),
          rx: 4,
          fill: 'none',
          stroke: isSelected ? '#ffd700' : teamColor,
          'stroke-width': isSelected ? 3.5 : 1.75,
        });
        group.appendChild(frame);

        appendHpBar(group, item.x + 6, item.y + dim.h - 9, Math.max(12, dim.w - 12), 5, item.currentHp, item.maxHp);
      }

      svg.appendChild(group);
    }

    // 6. Spawn mark
    const mark = api.getSpawnMark ? api.getSpawnMark() : null;
    if (mark) {
      svg.appendChild(
        el('circle', {
          cx: mark.x,
          cy: mark.y,
          r: 48,
          class: 'map-spawn-mark',
        })
      );
    }

    // 7. Area draft / marquee select draft
    if (drag && (drag.mode === 'draw' || drag.mode === 'marquee-select') && drag.draft) {
      svg.appendChild(
        el('rect', {
          x: drag.draft.x,
          y: drag.draft.y,
          width: drag.draft.w,
          height: drag.draft.h,
          class: drag.mode === 'marquee-select' ? 'map-marquee' : 'map-area is-selected',
        })
      );
    }

    // 8a. Reserved cells waiting to materialize (paint-place drag)
    if (drag && drag.mode === 'paint-place' && drag.reserved && drag.reserved.size) {
      const reservedGroup = el('g', { class: 'map-place-reserved', 'pointer-events': 'none' });
      for (const job of drag.reserved.values()) {
        reservedGroup.appendChild(
          el('rect', {
            x: job.x,
            y: job.y,
            width: job.w,
            height: job.h,
            fill: job.kind === 'unit' ? 'rgba(88, 166, 255, 0.22)' : 'rgba(46, 160, 67, 0.22)',
            stroke: job.kind === 'unit' ? '#58a6ff' : '#3fb950',
            'stroke-dasharray': '4 3',
            'stroke-width': 2,
          })
        );
      }
      svg.appendChild(reservedGroup);
    }

    // 8b. Ghost preview for active placement mode (shows actual footprint & real SizeView SVG icon)
    if (!drag && !spaceDown && (toolMode === 'place-obj' || toolMode === 'place-unit') && hoverPos) {
      const isUnit = toolMode === 'place-unit';
      let wPx = L3_GRID_SIZE;
      let hPx = L3_GRID_SIZE;
      let gx = snapCoord(hoverPos.x, wPx, world.w);
      let gy = snapCoord(hoverPos.y, hPx, world.h);

      const ghostGroup = el('g', { opacity: '0.68', 'pointer-events': 'none' });
      if (isUnit) {
        const tId = api.getToolUnitTemplate() || Object.keys(doc.units || {})[0] || 'Player';
        const vehicleDef = vehicleItemOf(doc, tId);
        if (vehicleDef) {
          const fp = itemFootprint(vehicleDef);
          wPx = fp.w * L3_GRID_SIZE;
          hPx = fp.h * L3_GRID_SIZE;
          gx = snapCoord(hoverPos.x, wPx, world.w);
          gy = snapCoord(hoverPos.y, hPx, world.h);
          const icon = buildVehicleMapIcon(
            null,
            doc,
            vehicleDef,
            gx,
            gy,
            wPx,
            hPx,
            pack,
            onPoolReady
          );
          if (icon) ghostGroup.appendChild(icon);
        } else {
          const unitDef = doc.units && doc.units[tId];
          const icon = buildUnitMapIcon(
            null,
            doc,
            unitDef || { id: tId },
            gx,
            gy,
            L3_GRID_SIZE,
            L3_GRID_SIZE,
            pack,
            onPoolReady
          );
          if (icon) ghostGroup.appendChild(icon);
        }
      } else {
        const tId = api.getToolObjTemplate() || Object.keys(doc.items || {})[0] || 'Wall_Wood';
        const itemDef = doc.items && doc.items[tId];
        const fp = itemFootprint(itemDef);
        wPx = fp.w * L3_GRID_SIZE;
        hPx = fp.h * L3_GRID_SIZE;
        gx = snapCoord(hoverPos.x, wPx, world.w);
        gy = snapCoord(hoverPos.y, hPx, world.h);
        const def = itemDef || { id: tId };
        const icon = isVehicleItemDef(def)
          ? buildVehicleMapIcon(null, doc, def, gx, gy, wPx, hPx, pack, onPoolReady)
          : buildStructureMapIcon(null, doc, def, gx, gy, wPx, hPx, pack, onPoolReady);
        if (icon) ghostGroup.appendChild(icon);
      }

      const blocked = hasPlacedOverlap(doc, gx, gy, wPx, hPx, '');
      const ghostFrame = el('rect', {
        x: gx,
        y: gy,
        width: wPx,
        height: hPx,
        fill: blocked
          ? 'rgba(248, 81, 73, 0.24)'
          : isUnit
            ? 'rgba(88, 166, 255, 0.14)'
            : 'rgba(46, 160, 67, 0.14)',
        stroke: blocked ? '#f85149' : isUnit ? '#58a6ff' : '#3fb950',
        'stroke-dasharray': '6 3',
        'stroke-width': 2.5,
      });
      ghostGroup.appendChild(ghostFrame);
      svg.appendChild(ghostGroup);
    }

    emitViewState();
  }

  function resizeArea(area, edge, origin, p, world) {
    let x = origin.x;
    let y = origin.y;
    let w = origin.w;
    let h = origin.h;
    if (edge.indexOf('e') >= 0) w = p.x - origin.x;
    if (edge.indexOf('s') >= 0) h = p.y - origin.y;
    if (edge.indexOf('w') >= 0) {
      w = origin.x + origin.w - p.x;
      x = p.x;
    }
    if (edge.indexOf('n') >= 0) {
      h = origin.y + origin.h - p.y;
      y = p.y;
    }
    const next = clampRect({ x, y, w, h }, world);
    area.x = next.x;
    area.y = next.y;
    area.w = next.w;
    area.h = next.h;
  }

  function zoomBy(factor, focusPoint) {
    const doc = api.getDoc();
    if (!doc) return;
    const world = worldSize(doc);
    ensureCamera(world);
    const p = focusPoint || { x: camera.x + camera.w / 2, y: camera.y + camera.h / 2 };
    const nextW = Math.max(Math.min(world.w, 256), Math.min(world.w, camera.w * factor));
    const scale = nextW / Math.max(1, camera.w);
    camera.x = p.x - (p.x - camera.x) * scale;
    camera.y = p.y - (p.y - camera.y) * scale;
    camera.w = nextW;
    clampCamera(camera, world);
    paint();
  }

  function zoomIn() {
    zoomBy(1 / 1.25);
  }

  function zoomOut() {
    zoomBy(1.25);
  }

  function resetView() {
    const doc = api.getDoc();
    if (!doc) return;
    const world = worldSize(doc);
    camera = { x: 0, y: 0, w: world.w, h: world.h, boundW: world.w, boundH: world.h };
    paint();
  }

  // Block browser context menu / tray on the map (right-click does nothing).
  svg.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  svg.addEventListener('pointerdown', (event) => {
    const doc = api.getDoc();
    if (!doc) return;
    const world = worldSize(doc);
    ensureCamera(world);
    const p = clientToWorld(svg, event.clientX, event.clientY);

    // Right button: ignore (no tray / no map action).
    if (event.button === 2) {
      event.preventDefault();
      return;
    }

    // Pan with middle click or space key
    if (event.button === 1 || spaceDown) {
      drag = { mode: 'pan', x: event.clientX, y: event.clientY, camX: camera.x, camY: camera.y };
      svg.style.cursor = 'grabbing';
      try {
        svg.setPointerCapture(event.pointerId);
      } catch (_) {}
      event.preventDefault();
      return;
    }
    if (event.button !== 0) return;

    const toolMode = api.getToolMode ? api.getToolMode() : 'area';

    // 1–2. Place Object / Unit — reserve cells while dragging; materialize next frame.
    if (toolMode === 'place-obj' || toolMode === 'place-unit') {
      const beforeSnapshot = api.snapshot ? api.snapshot() : '';
      drag = {
        mode: 'paint-place',
        kind: toolMode === 'place-unit' ? 'unit' : 'object',
        lastWorld: null,
        reserved: new Map(),
        queue: [],
        raf: 0,
        placed: false,
        beforeSnapshot,
      };
      try {
        svg.setPointerCapture(event.pointerId);
      } catch (_) {}
      reservePlaceAt(doc, world, p, drag);
      event.preventDefault();
      return;
    }

    const beforeSnapshot = api.snapshot ? api.snapshot() : '';

    // 3. Select / Move Mode — click placed, marquee multi-select, or move selection.
    // Ctrl/Cmd: multi — click toggles; marquee adds; empty click keeps selection.
    if (toolMode === 'select') {
      const multi = !!(event.ctrlKey || event.metaKey);
      const hitPlaced = hitPlacedObject(doc, p.x, p.y);
      if (hitPlaced) {
        const curIds = api.getSelectedPlacedIds
          ? api.getSelectedPlacedIds()
          : [api.getSelectedPlacedId()].filter(Boolean);
        const already = curIds.indexOf(hitPlaced.id) >= 0;

        if (multi) {
          let nextIds;
          if (already) nextIds = curIds.filter((id) => id !== hitPlaced.id);
          else nextIds = curIds.concat([hitPlaced.id]);
          if (api.setSelectedPlacedIds) api.setSelectedPlacedIds(nextIds);
          else api.setSelectedPlacedId(nextIds[0] || '');
          api.selectArea('');
          event.preventDefault();
          paint();
          api.refreshPanel();
          return;
        }

        const moveIds = already && curIds.length ? curIds : [hitPlaced.id];
        if (!already || curIds.length <= 1) {
          if (api.setSelectedPlacedIds) api.setSelectedPlacedIds(moveIds);
          else api.setSelectedPlacedId(hitPlaced.id);
        }
        api.selectArea('');
        const moveItems = [];
        for (let i = 0; i < moveIds.length; i++) {
          const row = (doc.placedObjects || []).find((o) => o && o.id === moveIds[i]);
          if (row) moveItems.push({ item: row, ox: row.x, oy: row.y });
        }
        drag = {
          mode: 'move-placed',
          item: hitPlaced,
          items: moveItems,
          offsetX: p.x - hitPlaced.x,
          offsetY: p.y - hitPlaced.y,
          beforeSnapshot,
        };
        try {
          svg.setPointerCapture(event.pointerId);
        } catch (_) {}
        event.preventDefault();
        paint();
        api.refreshPanel();
        return;
      }

      // Empty space: start marquee (small release = click clear / area pick).
      drag = {
        mode: 'marquee-select',
        x: p.x,
        y: p.y,
        draft: { x: p.x, y: p.y, w: 0, h: 0 },
        beforeSnapshot: '',
        didMove: false,
        additive: multi,
      };
      try {
        svg.setPointerCapture(event.pointerId);
      } catch (_) {}
      event.preventDefault();
      paint();
      return;
    }

    // 4. Area Mode (Default)
    api.setSelectedPlacedId('');
    const tol = tolerance(svg, camera);
    for (let i = doc.areas.length - 1; i >= 0; i--) {
      const edge = edgeAt(doc.areas[i], p.x, p.y, tol);
      if (!edge) continue;
      api.selectArea(doc.areas[i].id);
      drag = {
        mode: 'resize',
        edge,
        id: doc.areas[i].id,
        origin: {
          x: doc.areas[i].x,
          y: doc.areas[i].y,
          w: doc.areas[i].w,
          h: doc.areas[i].h,
        },
        beforeSnapshot,
      };
      try {
        svg.setPointerCapture(event.pointerId);
      } catch (_) {}
      event.preventDefault();
      paint();
      api.refreshPanel();
      return;
    }
    const hit = hitArea(doc, p.x, p.y);
    if (hit) {
      api.selectArea(hit.id);
      drag = { mode: 'move', id: hit.id, dx: p.x - hit.x, dy: p.y - hit.y, beforeSnapshot };
    } else {
      drag = { mode: 'draw', x: p.x, y: p.y, beforeSnapshot };
    }
    try {
      svg.setPointerCapture(event.pointerId);
    } catch (_) {}
    event.preventDefault();
  });

  svg.addEventListener('pointermove', (event) => {
    const doc = api.getDoc();
    if (!doc) return;
    const world = worldSize(doc);
    ensureCamera(world);
    const p = clientToWorld(svg, event.clientX, event.clientY);
    hoverPos = p;

    if (!drag) {
      refreshCursor(p);
      const toolMode = api.getToolMode ? api.getToolMode() : 'area';
      if (toolMode === 'place-obj' || toolMode === 'place-unit') {
        paint();
      } else {
        emitViewState();
      }
      return;
    }

    if (drag.mode === 'pan') {
      const rect = svg.getBoundingClientRect();
      const dx = ((event.clientX - drag.x) / Math.max(1, rect.width)) * camera.w;
      const dy = ((event.clientY - drag.y) / Math.max(1, rect.height)) * camera.h;
      camera.x = drag.camX - dx;
      camera.y = drag.camY - dy;
      clampCamera(camera, world);
      paint();
      return;
    }

    if (drag.mode === 'move-placed') {
      const group = drag.items && drag.items.length
        ? drag.items
        : [{ item: drag.item, ox: drag.item.x, oy: drag.item.y }];
      const primary = drag.item;
      const dim0 = placedDimensions(doc, primary);
      const nx = Math.max(0, Math.min(world.w - dim0.w, Math.round((p.x - drag.offsetX) / L3_GRID_SIZE) * L3_GRID_SIZE));
      const ny = Math.max(0, Math.min(world.h - dim0.h, Math.round((p.y - drag.offsetY) / L3_GRID_SIZE) * L3_GRID_SIZE));
      const dx = nx - (group.find((g) => g.item === primary) || group[0]).ox;
      const dy = ny - (group.find((g) => g.item === primary) || group[0]).oy;
      if (dx === 0 && dy === 0) {
        emitViewState();
        return;
      }
      const ignore = {};
      for (let i = 0; i < group.length; i++) ignore[group[i].item.id] = true;
      let blocked = false;
      const nextPos = [];
      for (let i = 0; i < group.length; i++) {
        const row = group[i];
        const dim = placedDimensions(doc, row.item);
        const tx = Math.max(0, Math.min(world.w - dim.w, row.ox + dx));
        const ty = Math.max(0, Math.min(world.h - dim.h, row.oy + dy));
        if (hasPlacedOverlap(doc, tx, ty, dim.w, dim.h, '', null, ignore)) {
          blocked = true;
          break;
        }
        nextPos.push({ item: row.item, x: tx, y: ty });
      }
      if (!blocked) {
        for (let i = 0; i < nextPos.length; i++) {
          nextPos[i].item.x = nextPos[i].x;
          nextPos[i].item.y = nextPos[i].y;
        }
        api.touch({ skipHistory: true });
        paint();
      } else {
        emitViewState();
      }
      return;
    }

    if (drag.mode === 'paint-place') {
      reservePlaceAt(doc, world, p, drag);
      return;
    }

    if (drag.mode === 'draw' || drag.mode === 'marquee-select') {
      const x = Math.max(0, Math.min(drag.x, p.x));
      const y = Math.max(0, Math.min(drag.y, p.y));
      const w = Math.min(world.w - x, Math.abs(p.x - drag.x));
      const h = Math.min(world.h - y, Math.abs(p.y - drag.y));
      drag.draft = { x, y, w, h };
      if (drag.mode === 'marquee-select' && (w > 4 || h > 4)) drag.didMove = true;
      paint();
      return;
    }

    const area = doc.areas.find((row) => row.id === drag.id);
    if (!area) return;
    if (drag.mode === 'move') {
      const next = clampRect(
        { x: p.x - drag.dx, y: p.y - drag.dy, w: area.w, h: area.h },
        world
      );
      area.x = next.x;
      area.y = next.y;
    } else {
      resizeArea(area, drag.edge, drag.origin, p, world);
    }
    api.touch({ skipHistory: true });
    paint();
  });

  function endDrag() {
    if (!drag) return;
    const mode = drag.mode;
    const beforeSnapshot = drag.beforeSnapshot || '';
    const doc = api.getDoc();
    if (mode === 'draw' && drag.draft && drag.draft.w >= 64 && drag.draft.h >= 64) {
      const fitted = clampRect(drag.draft, worldSize(doc));
      const area = {
        id: nextAreaId(doc.areas),
        x: fitted.x,
        y: fitted.y,
        w: fitted.w,
        h: fitted.h,
      };
      doc.areas.push(area);
      api.selectArea(area.id);
      api.touch({ skipHistory: true });
    }
    if (mode === 'marquee-select') {
      const draft = drag.draft;
      const additive = !!drag.additive;
      if (drag.didMove && draft && (draft.w > 8 || draft.h > 8)) {
        const boxed = placedInMarquee(doc, draft);
        let ids = boxed;
        if (additive) {
          const cur = api.getSelectedPlacedIds
            ? api.getSelectedPlacedIds()
            : [api.getSelectedPlacedId()].filter(Boolean);
          const seen = {};
          ids = [];
          for (let i = 0; i < cur.length; i++) {
            if (seen[cur[i]]) continue;
            seen[cur[i]] = true;
            ids.push(cur[i]);
          }
          for (let i = 0; i < boxed.length; i++) {
            if (seen[boxed[i]]) continue;
            seen[boxed[i]] = true;
            ids.push(boxed[i]);
          }
        }
        if (api.setSelectedPlacedIds) api.setSelectedPlacedIds(ids);
        else api.setSelectedPlacedId(ids[0] || '');
        api.selectArea('');
      } else if (!additive) {
        // Click without drag (no Ctrl): clear placed selection; pick area under cursor if any.
        const cx = drag.x;
        const cy = drag.y;
        if (api.setSelectedPlacedIds) api.setSelectedPlacedIds([]);
        else api.setSelectedPlacedId('');
        const hit = hitArea(doc, cx, cy);
        api.selectArea(hit ? hit.id : '');
      }
      // Ctrl+empty click: keep current selection.
    }
    if (mode === 'paint-place') flushPaintPlace(drag);
    const painted = mode === 'paint-place' && drag.placed;
    const skipHistory = mode === 'pan' || mode === 'marquee-select' || !beforeSnapshot;
    drag = null;
    if (!skipHistory && api.commitHistory) {
      api.commitHistory(beforeSnapshot);
    }
    refreshCursor();
    paint();
    if (mode !== 'pan') api.refreshPanel();
    if (painted) api.refreshPanel();
  }

  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('pointerleave', () => {
    hoverPos = null;
    paint();
  });

  svg.addEventListener(
    'wheel',
    (event) => {
      const doc = api.getDoc();
      if (!doc) return;
      event.preventDefault();
      const world = worldSize(doc);
      ensureCamera(world);
      const p = clientToWorld(svg, event.clientX, event.clientY);
      const factor = event.deltaY > 0 ? 1.12 : 1 / 1.12;
      zoomBy(factor, p);
    },
    { passive: false }
  );

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') return;
    const tag = event.target && event.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    spaceDown = true;
    refreshCursor();
    event.preventDefault();
  });

  window.addEventListener('keyup', (event) => {
    if (event.code !== 'Space') return;
    spaceDown = false;
    refreshCursor();
  });

  scheduleMapVisibleInsets();
  if (typeof ResizeObserver !== 'undefined') {
    const wrap = svg.closest('.editor-map-wrap') || svg.parentElement;
    if (wrap) {
      const ro = new ResizeObserver(() => scheduleMapVisibleInsets());
      ro.observe(wrap);
    }
  } else {
    window.addEventListener('resize', scheduleMapVisibleInsets);
  }

  return {
    paint,
    zoomIn,
    zoomOut,
    resetView,
    refreshCursor,
    syncInsets: scheduleMapVisibleInsets,
  };
}

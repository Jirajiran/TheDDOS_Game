/**
 * Map visual. Path cells are the grid. Areas are rectangles drawn on top.
 * The camera zooms and pans inside the page. The page itself does not scroll.
 */

import { PATH_SIZE, clampRect, nextAreaId, worldSize } from './mapDoc.js';

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

function clampCamera(camera, world) {
  const minW = Math.min(world.w, 512);
  camera.w = Math.max(minW, Math.min(world.w, camera.w));
  camera.h = camera.w * (world.h / world.w);
  if (camera.h > world.h) {
    camera.h = world.h;
    camera.w = world.w;
  }
  if (camera.x < 0) camera.x = 0;
  if (camera.y < 0) camera.y = 0;
  if (camera.x + camera.w > world.w) camera.x = world.w - camera.w;
  if (camera.y + camera.h > world.h) camera.y = world.h - camera.h;
}

export function mountMapView(svg, api) {
  let drag = null;
  let camera = null;
  let spaceDown = false;

  function ensureCamera(world) {
    if (!camera || camera.boundW !== world.w || camera.boundH !== world.h) {
      camera = { x: 0, y: 0, w: world.w, h: world.h, boundW: world.w, boundH: world.h };
    }
    clampCamera(camera, world);
  }

  function paint() {
    const doc = api.getDoc();
    if (!doc) return;
    const world = worldSize(doc);
    ensureCamera(world);
    const selectedId = api.getSelectedAreaId();
    const highlightId = api.getHighlightAreaId();
    svg.setAttribute(
      'viewBox',
      camera.x + ' ' + camera.y + ' ' + camera.w + ' ' + camera.h
    );
    svg.replaceChildren();
    svg.appendChild(
      el('rect', { x: 0, y: 0, width: world.w, height: world.h, class: 'map-ground' })
    );
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
    if (drag && drag.mode === 'draw' && drag.draft) {
      svg.appendChild(
        el('rect', {
          x: drag.draft.x,
          y: drag.draft.y,
          width: drag.draft.w,
          height: drag.draft.h,
          class: 'map-area is-selected',
        })
      );
    }
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

  svg.addEventListener('pointerdown', (event) => {
    const doc = api.getDoc();
    if (!doc) return;
    const world = worldSize(doc);
    ensureCamera(world);
    const p = clientToWorld(svg, event.clientX, event.clientY);
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
      };
      try {
        svg.setPointerCapture(event.pointerId);
      } catch (_) {}
      event.preventDefault();
      return;
    }
    const hit = hitArea(doc, p.x, p.y);
    if (hit) {
      api.selectArea(hit.id);
      drag = { mode: 'move', id: hit.id, dx: p.x - hit.x, dy: p.y - hit.y };
    } else {
      drag = { mode: 'draw', x: p.x, y: p.y };
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
    if (!drag) {
      const tol = tolerance(svg, camera);
      let cursor = 'crosshair';
      for (let i = doc.areas.length - 1; i >= 0; i--) {
        const edge = edgeAt(doc.areas[i], p.x, p.y, tol);
        if (edge) {
          cursor = CURSOR[edge];
          break;
        }
        if (hitArea(doc, p.x, p.y)) cursor = 'move';
      }
      if (spaceDown) cursor = 'grab';
      svg.style.cursor = cursor;
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
    if (drag.mode === 'draw') {
      const x = Math.max(0, Math.min(drag.x, p.x));
      const y = Math.max(0, Math.min(drag.y, p.y));
      const w = Math.min(world.w - x, Math.abs(p.x - drag.x));
      const h = Math.min(world.h - y, Math.abs(p.y - drag.y));
      drag.draft = { x, y, w, h };
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
    api.touch();
    paint();
  });

  function endDrag() {
    if (!drag) return;
    const mode = drag.mode;
    if (mode === 'draw' && drag.draft && drag.draft.w >= 64 && drag.draft.h >= 64) {
      const doc = api.getDoc();
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
      api.touch();
    }
    drag = null;
    svg.style.cursor = spaceDown ? 'grab' : 'crosshair';
    paint();
    if (mode !== 'pan') api.refreshPanel();
  }

  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
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
      const scale = (camera.w * factor) / camera.w;
      camera.x = p.x - (p.x - camera.x) * scale;
      camera.y = p.y - (p.y - camera.y) * scale;
      camera.w *= factor;
      clampCamera(camera, world);
      paint();
    },
    { passive: false }
  );
  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') return;
    const tag = event.target && event.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    spaceDown = true;
    svg.style.cursor = 'grab';
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (event.code !== 'Space') return;
    spaceDown = false;
    if (!drag) svg.style.cursor = 'crosshair';
  });

  return { paint };
}

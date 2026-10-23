/**
 * Touch sticks from mobile_controller.svg.
 * ControMove walks. ControAim aims; the rim fires; a release after a drag places.
 * Two taps that stay inside the handle reload. Handles return to the authored center.
 */

import { GAME_PACK } from '../config.js';

const SVG_URL = 'Asset/AssetSVG/Ui/mobile_controller.svg';
const AREA_RADIUS = 89.3;
const HANDLE_RADIUS = 39.3;

function readScale(el) {
  const raw = el && el.getAttribute('transform');
  if (!raw) return 1;
  const m = raw.match(/matrix\(\s*([-\d.eE+]+)/);
  const n = m ? Number(m[1]) : 1;
  return Number.isFinite(n) && n !== 0 ? n : 1;
}

function readMatrix(el) {
  const raw = el && el.getAttribute('transform');
  const m = raw && raw.match(/matrix\(\s*([-\d.eE+]+)[\s,]+([-\d.eE+]+)[\s,]+([-\d.eE+]+)[\s,]+([-\d.eE+]+)[\s,]+([-\d.eE+]+)[\s,]+([-\d.eE+]+)/);
  if (!m) return { a: 1, b: 0, c: 0, d: 1 };
  return {
    a: Number(m[1]),
    b: Number(m[2]),
    c: Number(m[3]),
    d: Number(m[4]),
  };
}

function writeOffset(el, base, x, y) {
  el.setAttribute(
    'transform',
    `matrix(${base.a}, ${base.b}, ${base.c}, ${base.d}, ${x}, ${y})`
  );
}

export async function createMobileController(stage) {
  const pose = {
    shown: false,
    moveX: 0,
    moveY: 0,
    aimX: 0,
    aimY: 0,
    aimAmount: 0,
    aimHeld: false,
    atRim: false,
    rimLatched: false,
    placeRelease: false,
    placeX: 0,
    placeY: 0,
    placeAmount: 0,
    reload: false,
    _lastTap: 0,
  };
  const res = await fetch(SVG_URL);
  if (!res.ok || !stage) return { pose, setShown() {} };

  const wrap = document.createElement('div');
  wrap.innerHTML = await res.text();
  const svg = wrap.querySelector('svg');
  if (!svg) return { pose, setShown() {} };
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.pointerEvents = 'none';
  stage.appendChild(svg);

  const pt = svg.createSVGPoint();

  function localOf(root, clientX, clientY) {
    const ctm = root.getScreenCTM();
    if (!ctm) return null;
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(ctm.inverse());
  }

  function bindStick(rootId, areaId, handleId, kind) {
    const root = svg.querySelector(`#${rootId}`);
    const area = svg.querySelector(`#${areaId}`);
    const handle = svg.querySelector(`#${handleId}`);
    if (!root || !area || !handle) return;
    const areaLimit = AREA_RADIUS * readScale(area);
    const handleLimit = HANDLE_RADIUS * readScale(handle);
    const base = readMatrix(handle);
    root.style.pointerEvents = 'auto';
    root.style.touchAction = 'none';
    let pointerId = -1;
    let leftHandle = false;

    function apply(x, y) {
      let len = Math.hypot(x, y);
      const atRim = len >= areaLimit && areaLimit > 0;
      if (len > areaLimit && len > 0) {
        const s = areaLimit / len;
        x *= s;
        y *= s;
        len = areaLimit;
      }
      if (len > handleLimit) leftHandle = true;
      writeOffset(handle, base, x, y);
      const amount = areaLimit > 0 ? len / areaLimit : 0;
      const inv = len > 0 ? 1 / len : 0;
      if (kind === 'move') {
        pose.moveX = areaLimit > 0 ? x / areaLimit : 0;
        pose.moveY = areaLimit > 0 ? y / areaLimit : 0;
        return;
      }
      pose.aimHeld = true;
      pose.aimAmount = amount;
      pose.aimX = x * inv;
      pose.aimY = y * inv;
      pose.atRim = atRim;
    }

    function onDown(e) {
      if (e.button != null && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      pointerId = e.pointerId;
      leftHandle = false;
      try {
        root.setPointerCapture(e.pointerId);
      } catch (_) {
        /* already captured */
      }
      const p = localOf(root, e.clientX, e.clientY);
      if (p) apply(p.x, p.y);
    }

    function onMove(e) {
      if (e.pointerId !== pointerId) return;
      e.preventDefault();
      const p = localOf(root, e.clientX, e.clientY);
      if (p) apply(p.x, p.y);
    }

    function onUp(e) {
      if (e.pointerId !== pointerId) return;
      pointerId = -1;
      if (kind === 'move') {
        writeOffset(handle, base, 0, 0);
        pose.moveX = 0;
        pose.moveY = 0;
        return;
      }
      if (leftHandle && pose.aimAmount > 0) {
        pose.placeRelease = true;
        pose.placeX = pose.aimX;
        pose.placeY = pose.aimY;
        pose.placeAmount = pose.aimAmount;
      } else {
        const now = performance.now();
        const gap = GAME_PACK.controllerDoubleTapSec > 0 ? GAME_PACK.controllerDoubleTapSec : 0.45;
        if (pose._lastTap > 0 && (now - pose._lastTap) / 1000 <= gap) {
          pose.reload = true;
          pose._lastTap = 0;
        } else {
          pose._lastTap = now;
        }
      }
      writeOffset(handle, base, 0, 0);
      pose.aimHeld = false;
      pose.aimAmount = 0;
      pose.aimX = 0;
      pose.aimY = 0;
      pose.atRim = false;
      leftHandle = false;
    }

    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
  }

  bindStick('ControMove', 'ControPanelArea', 'ControHandle', 'move');
  bindStick('ControAim', 'ControPanelArea_FL', 'ControHandle_FL', 'aim');

  function setShown(on) {
    pose.shown = !!on;
    svg.style.display = on ? 'block' : 'none';
    if (!on) {
      pose.moveX = 0;
      pose.moveY = 0;
      pose.aimHeld = false;
      pose.aimAmount = 0;
      pose.atRim = false;
    }
  }

  setShown(false);
  return { pose, setShown };
}

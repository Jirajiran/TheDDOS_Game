/**
 * Canvas size, world draw, and the play animation loop.
 * updatePlaying stays on the play session; this head only paints and schedules frames.
 */
import { AppState, GAME_PACK } from '../config.js';
import { stopAmbience } from '../audio/sfx.js';
import {
  easeLookToward,
  followPoint,
  panCamera,
  snapCameraTo,
} from '../view/camera.js';
import { getNightCameraZoomMul } from '../view/dayCycle.js';
import { clearCanvas, renderWorld } from '../view/render.js';
import { getPlayerUnit } from '../sim.js';

export function createPlayLoop(hub) {
  const { state, canvas, ctx } = hub;
  const perf = {
    show: false,
    updateMs: 0,
    drawMs: 0,
    worst: 0,
    over16: 0,
    over32: 0,
    frames: 0,
  };

  function paintPerfDebug() {
    const el = document.getElementById('play-perf-debug');
    if (!el) return;
    el.hidden = !perf.show;
    if (!perf.show) return;
    const frameMs = perf.updateMs + perf.drawMs;
    el.textContent =
      `frame ${frameMs.toFixed(2)} ms   update ${perf.updateMs.toFixed(2)}   draw ${perf.drawMs.toFixed(2)}\n` +
      `worst ${perf.worst.toFixed(2)} ms   over16 ${perf.over16}   over32 ${perf.over32}   frames ${perf.frames}   F3 hide`;
  }

  function frame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  function setPlayTrayLock(enabled) {
    document.documentElement.classList.toggle('is-playing-lock', enabled);
    document.body.classList.toggle('is-playing-lock', enabled);
  }

  function onPlayTouchMove(e) {
    if (state.appState !== AppState.PLAYING) return;
    const el = e.target;
    if (el && el.closest && el.closest('.game-panel-card')) return;
    e.preventDefault();
  }

  function onPlayGesture(e) {
    if (state.appState !== AppState.PLAYING) return;
    e.preventDefault();
  }

  function releasePlayFullscreen() {
    const active =
      document.fullscreenElement || document.webkitFullscreenElement;
    if (!active) return;
    const exit =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.webkitCancelFullScreen ||
      document.msExitFullscreen;
    if (typeof exit !== 'function') return;
    try {
      const p = exit.call(document);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (_) {
      /* ignore */
    }
  }

  function resizeCanvas() {
    const parent = canvas.parentElement;
    let w = parent ? parent.clientWidth : 0;
    let h = parent ? parent.clientHeight : 0;
    if (w < 2 || h < 2) {
      w = Math.max(w, window.innerWidth || 800);
      h = Math.max(h, window.innerHeight || 600);
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.max(1, Math.floor(w * dpr));
    const bh = Math.max(1, Math.floor(h * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { cssW: w, cssH: h, dpr };
  }

  function ensureCanvasSize() {
    const parent = canvas.parentElement;
    const w = parent ? parent.clientWidth : 0;
    const h = parent ? parent.clientHeight : 0;
    if (w < 2 || h < 2) return resizeCanvas();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.max(1, Math.floor(w * dpr));
    const bh = Math.max(1, Math.floor(h * dpr));
    if (
      canvas.width !== bw ||
      canvas.height !== bh ||
      canvas.clientWidth !== w ||
      canvas.clientHeight !== h
    ) {
      return resizeCanvas();
    }
    return {
      cssW: w,
      cssH: h,
      dpr: canvas.width / Math.max(1, w),
    };
  }

  function drawPlaying(opts = {}) {
    try {
      const size = ensureCanvasSize();
      const cssW = size.cssW;
      const cssH = size.cssH;
      const dpr = size.dpr > 0 ? size.dpr : 1;

      clearCanvas(ctx, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!state.match) return false;
      const match = state.match;
      if (!match.world) return false;

      const baseZoom = hub.getMatchZoom(match);
      const nightMul = getNightCameraZoomMul(match.nightBlend || 0);
      state.camera.zoom = baseZoom * nightMul;
      if (!Number.isFinite(state.camera.zoom) || state.camera.zoom <= 0) {
        state.camera.zoom = 1;
      }

      if (match.cameraFreeFly || match.playerDead) {
        hub.ensureFreeFlyCamera(match, cssW, cssH);
        panCamera(state.camera, 0, 0, match.world.worldW, match.world.worldH, cssW, cssH);
      } else {
        const player = getPlayerUnit(match);
        const anchorX = player
          ? player.x
          : match.base
            ? match.base.x + match.base.w / 2
            : match.world.worldW / 2;
        const anchorY = player
          ? player.y
          : match.base
            ? match.base.y + match.base.h / 2
            : match.world.worldH / 2;
        if (match.cameraSnapPending && player) {
          state.camera.lookX = anchorX;
          state.camera.lookY = anchorY;
          snapCameraTo(
            state.camera,
            anchorX,
            anchorY,
            match.world.worldW,
            match.world.worldH,
            cssW,
            cssH
          );
          match.cameraSnapPending = false;
          match._freeFlyBooted = false;
        } else {
          const dt = opts.dt > 0 ? opts.dt : 0;
          easeLookToward(
            state.camera,
            anchorX,
            anchorY,
            state.mouseScreenX || 0,
            state.mouseScreenY || 0,
            cssW,
            cssH,
            dt,
            GAME_PACK.cameraLeadFrac,
            GAME_PACK.cameraLeadTweenSec
          );
          followPoint(
            state.camera,
            state.camera.lookX,
            state.camera.lookY,
            match.world.worldW,
            match.world.worldH,
            cssW,
            cssH
          );
        }
      }

      if (!Number.isFinite(state.camera.x)) state.camera.x = 0;
      if (!Number.isFinite(state.camera.y)) state.camera.y = 0;

      renderWorld(ctx, match.world, state.camera, match, dpr, cssW, cssH);
      paintPerfDebug();
      return true;
    } catch (err) {
      console.error('[TheDDOS] drawPlaying failed', err);
      if (opts.throwOnError) throw err;
      return false;
    }
  }

  async function warmFirstWorldPaint(match) {
    const { screens, progressLabel } = hub.dom;
    if (!match || !match.world) {
      throw new Error('First paint: match/world missing');
    }
    if (!match.world.paths || !match.world.paths.length) {
      throw new Error('First paint: world paths empty');
    }
    if (match.playerUnitId < 0 || !getPlayerUnit(match)) {
      throw new Error('First paint: player not spawned');
    }

    screens.menu.hidden = true;
    screens.menu.classList.remove('is-active');
    screens.playing.hidden = false;
    screens.playing.classList.add('is-active', 'is-warming');
    screens.loading.hidden = false;
    screens.loading.classList.add('is-active');

    await frame();
    let size = resizeCanvas();
    if (size.cssW < 2 || size.cssH < 2 || canvas.width < 2 || canvas.height < 2) {
      await frame();
      size = resizeCanvas();
    }
    if (canvas.width < 2 || canvas.height < 2) {
      throw new Error(
        `First paint: canvas buffer ${canvas.width}×${canvas.height} (layout 0×0)`
      );
    }

    match.cameraSnapPending = true;
    let ok = false;
    try {
      ok = drawPlaying({ throwOnError: true });
    } catch (e) {
      throw new Error(`First paint: draw failed — ${e.message || e}`);
    }
    await frame();
    try {
      ok = drawPlaying({ throwOnError: true }) && ok;
    } catch (e) {
      throw new Error(`First paint: draw failed — ${e.message || e}`);
    }
    if (!ok) {
      throw new Error('First paint: draw returned empty (no match/world)');
    }

    const probes = [
      [0.5, 0.5],
      [0.35, 0.35],
      [0.65, 0.65],
      [0.5, 0.4],
    ];
    let painted = false;
    let lastRgb = 'n/a';
    try {
      for (let i = 0; i < probes.length; i++) {
        const px = Math.min(
          canvas.width - 1,
          Math.max(0, Math.floor(canvas.width * probes[i][0]))
        );
        const py = Math.min(
          canvas.height - 1,
          Math.max(0, Math.floor(canvas.height * probes[i][1]))
        );
        const sample = ctx.getImageData(px, py, 1, 1).data;
        const r = sample[0];
        const g = sample[1];
        const b = sample[2];
        lastRgb = `${r},${g},${b}`;
        if (r > 24 || g > 26 || b > 28) {
          painted = true;
          break;
        }
      }
    } catch (e) {
      throw new Error(`First paint: getImageData failed — ${e.message || e}`);
    }
    if (!painted) {
      throw new Error(
        `First paint: canvas still clear-color (last rgb(${lastRgb})) — world not drawn`
      );
    }

    if (progressLabel) progressLabel.textContent = '100% — World paint OK';
    await frame();
  }

  function stopLoop() {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
  }

  function startLoop() {
    stopLoop();
    state.lastTs = 0;
    const tick = (ts) => {
      if (state.appState !== AppState.PLAYING) {
        stopAmbience();
        return;
      }
      if (!state.lastTs) state.lastTs = ts;
      const dt = Math.min(0.05, (ts - state.lastTs) / 1000);
      state.lastTs = ts;
      const updateAt = performance.now();
      try {
        hub.updatePlaying(dt);
      } catch (err) {
        console.error('[TheDDOS] updatePlaying failed (loop kept alive)', err);
      }
      perf.updateMs = performance.now() - updateAt;
      const drawAt = performance.now();
      try {
        drawPlaying({ dt });
      } catch (err) {
        console.error('[TheDDOS] drawPlaying failed (loop kept alive)', err);
      }
      perf.drawMs = performance.now() - drawAt;
      const frameMs = perf.updateMs + perf.drawMs;
      perf.frames += 1;
      if (frameMs > perf.worst) perf.worst = frameMs;
      if (frameMs > 16) perf.over16 += 1;
      if (frameMs > 32) perf.over32 += 1;
      state.rafId = requestAnimationFrame(tick);
    };
    state.rafId = requestAnimationFrame(tick);
  }

  function bind() {
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'F3' && e.code !== 'F3') return;
      if (state.appState !== AppState.PLAYING) return;
      const playerUi = hub.playerUi;
      if (playerUi && playerUi.isChatOpen && playerUi.isChatOpen()) return;
      perf.show = !perf.show;
      paintPerfDebug();
    });
    window.addEventListener('resize', () => {
      if (
        state.appState === AppState.PLAYING ||
        state.appState === AppState.RESULT
      ) {
        resizeCanvas();
      }
    });
    const onFullscreenChange = () => {
      if (
        state.appState === AppState.PLAYING ||
        state.appState === AppState.BOOT ||
        state.appState === AppState.LOADING ||
        state.appState === AppState.RESULT
      ) {
        resizeCanvas();
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('touchmove', onPlayTouchMove, { passive: false });
    document.addEventListener('gesturestart', onPlayGesture, { passive: false });
    document.addEventListener('gesturechange', onPlayGesture, { passive: false });
  }

  return {
    resizeCanvas,
    warmFirstWorldPaint,
    drawPlaying,
    startLoop,
    stopLoop,
    setPlayTrayLock,
    releasePlayFullscreen,
    bind,
  };
}

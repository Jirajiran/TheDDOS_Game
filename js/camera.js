/**
 * Simple camera: follow a point or show whole world; clamp to world bounds.
 * Visible world width ≈ viewW / zoom — raise zoom (GAME_PACK.cameraFollowZoom) to tighten.
 */
export function createCamera() {
  return {
    x: 0,
    y: 0,
    zoom: 1,
  };
}

/**
 * Fit entire world into the viewport (fixed overview). Zoom uniform; clamp.
 */
export function fitWorldInView(camera, worldW, worldH, viewW, viewH) {
  if (viewW <= 0 || viewH <= 0 || worldW <= 0 || worldH <= 0) return;

  const zoom = Math.min(viewW / worldW, viewH / worldH);
  camera.zoom = zoom;

  const drawnW = worldW * zoom;
  const drawnH = worldH * zoom;
  // Center world in view, then clamp so we never scroll past edges.
  let camX = (drawnW - viewW) / 2 / zoom;
  let camY = (drawnH - viewH) / 2 / zoom;

  // When zoomed to fit, drawn size ≤ view → cam should be 0 (letterbox ok).
  // When zoomed larger (follow mode later), clamp.
  const maxX = Math.max(0, worldW - viewW / zoom);
  const maxY = Math.max(0, worldH - viewH / zoom);
  camera.x = clamp(camX, 0, maxX);
  camera.y = clamp(camY, 0, maxY);
}

/**
 * Follow world-space point; keep view inside world.
 */
export function followPoint(camera, targetX, targetY, worldW, worldH, viewW, viewH) {
  const zoom = camera.zoom > 0 ? camera.zoom : 1;
  const halfW = viewW / (2 * zoom);
  const halfH = viewH / (2 * zoom);

  let x = targetX - halfW;
  let y = targetY - halfH;

  const maxX = Math.max(0, worldW - viewW / zoom);
  const maxY = Math.max(0, worldH - viewH / zoom);
  camera.x = clamp(x, 0, maxX);
  camera.y = clamp(y, 0, maxY);
}

/**
 * Pan camera by world delta (free-fly); clamp to world bounds.
 */
export function panCamera(camera, dx, dy, worldW, worldH, viewW, viewH) {
  const zoom = camera.zoom > 0 ? camera.zoom : 1;
  const maxX = Math.max(0, worldW - viewW / zoom);
  const maxY = Math.max(0, worldH - viewH / zoom);
  camera.x = clamp(camera.x + dx, 0, maxX);
  camera.y = clamp(camera.y + dy, 0, maxY);
}

/**
 * Center view on a world point (snap after respawn).
 */
export function snapCameraTo(camera, targetX, targetY, worldW, worldH, viewW, viewH) {
  followPoint(camera, targetX, targetY, worldW, worldH, viewW, viewH);
}

export function clampZoom(z, minZ, maxZ) {
  return clamp(z, minZ, maxZ);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function pointInRectExpanded(px, py, r, expand) {
  return (
    px >= r.x - expand &&
    px <= r.x + r.w + expand &&
    py >= r.y - expand &&
    py <= r.y + r.h + expand
  );
}

export function segmentHitsCircle(x0, y0, x1, y1, cx, cy, radius) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const fx = x0 - cx;
  const fy = y0 - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;
  let disc = b * b - 4 * a * c;
  if (disc < 0) return false;
  if (a < 1e-8) return fx * fx + fy * fy <= radius * radius;
  disc = Math.sqrt(disc);
  const t1 = (-b - disc) / (2 * a);
  const t2 = (-b + disc) / (2 * a);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

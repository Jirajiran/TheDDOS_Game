/** Shared SVG DOM helpers. A matrix component of 0 stays 0. */

export function svgById(root, id) {
  if (!root) return null;
  return root.getElementById
    ? root.getElementById(id)
    : root.querySelector(`#${CSS.escape(id)}`);
}

export function setVisible(el, on) {
  if (!el) return;
  el.style.display = on ? '' : 'none';
  el.style.pointerEvents = on ? 'auto' : 'none';
}

export function parseMatrix(el) {
  const t = (el && el.getAttribute && el.getAttribute('transform')) || '';
  const m = /matrix\s*\(\s*([^)]+)\)/i.exec(t);
  if (!m) return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const p = m[1].split(/[\s,]+/).map(Number);
  return {
    a: Number.isFinite(p[0]) ? p[0] : 1,
    b: Number.isFinite(p[1]) ? p[1] : 0,
    c: Number.isFinite(p[2]) ? p[2] : 0,
    d: Number.isFinite(p[3]) ? p[3] : 1,
    e: Number.isFinite(p[4]) ? p[4] : 0,
    f: Number.isFinite(p[5]) ? p[5] : 0,
  };
}

export function setMatrix(el, mat) {
  el.setAttribute(
    'transform',
    `matrix( ${mat.a}, ${mat.b}, ${mat.c}, ${mat.d}, ${mat.e},${mat.f}) `
  );
}

export function stripIds(root) {
  if (!root || !root.querySelectorAll) return;
  if (root.removeAttribute) root.removeAttribute('id');
  const all = root.querySelectorAll('[id]');
  for (let i = 0; i < all.length; i++) all[i].removeAttribute('id');
}

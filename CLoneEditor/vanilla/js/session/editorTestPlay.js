/**
 * Editor → game Test Play handoff via sessionStorage (separate pages).
 * Payload is the same map JSON a player would Export (1 file = 1 map).
 */

export const EDITOR_TESTPLAY_KEY = 'theddos_editor_testplay';

/**
 * @param {object} doc editor map doc
 * @param {object} [meta]
 */
export function writeEditorTestPlay(doc, meta) {
  if (!doc) throw new Error('Test Play needs a map JSON doc');
  const payload = {
    doc,
    meta: meta && typeof meta === 'object' ? meta : {},
    at: Date.now(),
  };
  sessionStorage.setItem(EDITOR_TESTPLAY_KEY, JSON.stringify(payload));
  return payload;
}

export function peekEditorTestPlay() {
  try {
    const raw = sessionStorage.getItem(EDITOR_TESTPLAY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.doc) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

export function consumeEditorTestPlay() {
  const payload = peekEditorTestPlay();
  try {
    sessionStorage.removeItem(EDITOR_TESTPLAY_KEY);
  } catch (_) {}
  return payload;
}

export function clearEditorTestPlay() {
  try {
    sessionStorage.removeItem(EDITOR_TESTPLAY_KEY);
  } catch (_) {}
}

function clampSide(n) {
  const v = n | 0;
  if (v < 1 || v > 8) return 0;
  return v;
}

/**
 * Rectangular path dims from an editor map doc.
 * @returns {{ cols: number, rows: number, pathGridN: number }}
 */
export function pathDimsFromEditorDoc(doc) {
  if (!doc) return { cols: 0, rows: 0, pathGridN: 0 };
  const cols = clampSide(doc.pathCols || doc.cols || 0);
  const rows = clampSide(doc.pathRows || doc.rows || 0);
  if (!cols || !rows) return { cols: 0, rows: 0, pathGridN: 0 };
  return { cols, rows, pathGridN: Math.max(cols, rows) };
}

/** @deprecated use pathDimsFromEditorDoc — returns max side only */
export function pathGridNFromEditorDoc(doc) {
  return pathDimsFromEditorDoc(doc).pathGridN;
}

/** True when boot should auto-start a match from editor handoff. */
export function hasPendingEditorTestPlay() {
  return !!peekEditorTestPlay();
}

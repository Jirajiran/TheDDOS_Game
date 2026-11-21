/**
 * Unified play-map resolution — Menu room JSON and Editor Test Play
 * share one pipe. One file = one map. No JSON → cannot play (no silent FlatLand).
 */

import {
  pathDimsFromEditorDoc,
  peekEditorTestPlay,
} from './editorTestPlay.js';

/**
 * @typedef {{
 *   source: 'editor'|'room-map',
 *   mapDoc: object|null,
 *   roomMap: object|null,
 *   gameMode: string,
 *   worldPick: string,
 *   pathCols: number,
 *   pathRows: number,
 *   pathGridN: number,
 *   roomMeta: object|null,
 *   mapFile: string,
 *   rules: object|null,
 *   base: object|null,
 *   resources: object|null,
 * }} ResolvedPlayMap
 */

function isEditorMapDoc(doc) {
  return !!(doc && doc.kind === 'theddos-map' && doc.pathLocked === true);
}

function clampSide(n) {
  const v = n | 0;
  if (v < 1 || v > 8) return 0;
  return v;
}

/**
 * @returns {{ cols: number, rows: number, pathGridN: number }}
 */
export function pathDimsFromRoomMap(map) {
  if (!map) return { cols: 0, rows: 0, pathGridN: 0 };
  if (isEditorMapDoc(map) || map.pathCols || map.pathRows) {
    return pathDimsFromEditorDoc(map);
  }
  const w = map.world;
  if (w) {
    let cols = clampSide(w.cellsW || 0);
    let rows = clampSide(w.cellsH || 0);
    const pathSize = (w.pathSize | 0) || 1024;
    if ((!cols || !rows) && w.width > 0 && pathSize > 0) {
      cols = clampSide(Math.round(w.width / pathSize));
      rows = clampSide(
        w.height > 0 ? Math.round(w.height / pathSize) : cols
      );
    }
    if (cols && rows) {
      return { cols, rows, pathGridN: Math.max(cols, rows) };
    }
  }
  return { cols: 0, rows: 0, pathGridN: 0 };
}

/** @deprecated */
export function pathGridNFromRoomMap(map) {
  return pathDimsFromRoomMap(map).pathGridN;
}

function gameModeFromSources(room, roomMap, mapDoc, editorMeta) {
  if (editorMeta && editorMeta.gameMode) return String(editorMeta.gameMode);
  if (mapDoc && mapDoc.gameMode) return String(mapDoc.gameMode);
  if (roomMap && roomMap.gameMode) return String(roomMap.gameMode);
  if (room && room.gameMode) return String(room.gameMode);
  if (room && room.type === 'RESOURCE') return 'WORLD_TYPE';
  if (roomMap && roomMap.type === 'RESOURCE') return 'WORLD_TYPE';
  return 'FLAT_SURVIVAL';
}

function worldPickFromSources(room, roomMap, gameMode) {
  if (roomMap && roomMap.worldPick) return String(roomMap.worldPick);
  if (room && room.worldPick) return String(room.worldPick);
  if (gameMode === 'WORLD_TYPE') return 'resource';
  return 'flat';
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error('Map JSON missing: ' + url + ' → ' + res.status);
  return res.json();
}

function fillDims(out, dims) {
  out.pathCols = dims.cols;
  out.pathRows = dims.rows;
  out.pathGridN = dims.pathGridN;
}

/**
 * Resolve which map the match should deploy.
 * Priority: editor Test Play export → room.mapFile JSON.
 * Throws if no map JSON can be resolved.
 *
 * @param {{
 *   editorPayload?: { doc: object, meta?: object }|null,
 *   room?: object|null,
 *   usePendingEditor?: boolean,
 * }} [opts]
 * @returns {Promise<ResolvedPlayMap>}
 */
export async function resolvePlayMap(opts = {}) {
  const room = opts.room || null;
  let editorPayload = opts.editorPayload || null;
  if (!editorPayload && opts.usePendingEditor) {
    editorPayload = peekEditorTestPlay();
  }

  /** @type {ResolvedPlayMap} */
  const out = {
    source: 'room-map',
    mapDoc: null,
    roomMap: null,
    gameMode: 'FLAT_SURVIVAL',
    worldPick: 'flat',
    pathCols: 0,
    pathRows: 0,
    pathGridN: 0,
    roomMeta: room,
    mapFile: '',
    rules: null,
    base: null,
    resources: null,
  };

  // 1) Editor Test Play — one exported map file worth of JSON
  if (editorPayload && editorPayload.doc) {
    const doc = editorPayload.doc;
    if (!isEditorMapDoc(doc) && !(doc.world || doc.pathCols)) {
      throw new Error('Test Play JSON is not a playable map file');
    }
    out.source = 'editor';
    out.mapDoc = isEditorMapDoc(doc) ? doc : null;
    out.roomMap = !isEditorMapDoc(doc) ? doc : null;
    const dims = out.mapDoc
      ? pathDimsFromEditorDoc(out.mapDoc)
      : pathDimsFromRoomMap(doc);
    if (!dims.cols || !dims.rows) {
      throw new Error('Test Play map JSON has no pathCols/pathRows (or world size)');
    }
    fillDims(out, dims);
    out.gameMode = gameModeFromSources(room, out.roomMap, out.mapDoc, editorPayload.meta);
    out.worldPick = worldPickFromSources(room, out.roomMap, out.gameMode);
    out.rules = (doc && doc.rules) || null;
    out.base = (doc && doc.base) || null;
    out.resources = (doc && doc.resources) || null;
    const mapName = (doc && doc.name) || (editorPayload.meta && editorPayload.meta.name) || 'editor_map';
    out.roomMeta = {
      id: mapName,
      name: mapName,
      type: 'EDITOR',
      gameMode: out.gameMode,
      mapFile: '',
      from: 'editor',
      pathCols: out.pathCols,
      pathRows: out.pathRows,
    };
    return out;
  }

  // 2) Menu / host room — must have mapFile JSON (1 file = 1 map)
  const mapFile = (room && (room.mapFile || room.map)) || '';
  if (!mapFile) {
    throw new Error(
      'No map JSON selected — pick a room map file before Play (1 file = 1 map)'
    );
  }
  out.mapFile = String(mapFile);
  const json = await fetchJson(out.mapFile);
  if (isEditorMapDoc(json)) {
    out.source = 'room-map';
    out.mapDoc = json;
    fillDims(out, pathDimsFromEditorDoc(json));
    out.rules = json.rules || null;
    out.base = json.base || null;
    out.resources = json.resources || null;
  } else {
    out.source = 'room-map';
    out.roomMap = json;
    fillDims(out, pathDimsFromRoomMap(json));
    out.rules = json.rules || null;
    out.base = json.base || null;
    out.resources = json.resources || null;
  }
  if (!out.pathCols || !out.pathRows) {
    throw new Error('Map JSON has no world size: ' + out.mapFile);
  }
  out.gameMode = gameModeFromSources(room, out.roomMap, out.mapDoc, null);
  out.worldPick = worldPickFromSources(room, out.roomMap || json, out.gameMode);
  out.roomMeta = Object.assign({}, room, {
    id: json.id || room.id,
    name: json.name || room.name,
    gameMode: out.gameMode,
    pathCols: out.pathCols,
    pathRows: out.pathRows,
  });
  return out;
}

/**
 * Creator map editor. Not linked from the game menu.
 * Loads the same pack the game reads, then keeps one map file in this page.
 */

import { UNIT_TEMPLATE_FILE } from '../assets/closedCatalog.js';
import {
  MAX_SIDE,
  clearPageCache,
  createMapDoc,
  ensureMixSkills,
  ensurePlayerSpawns,
  exportMapText,
  parseMapFile,
  readPageCache,
  sheetsFromPack,
  spawnPoint,
  spawnRow,
  writePageCache,
} from './mapDoc.js';
import { mountMapView } from './mapView.js';
import {
  renderCatalogTrailPreview,
  renderPanel,
  renderPlacedTray,
  releaseTrailClaim,
  clearFieldHelp,
  setFieldHelp,
} from './panels.js';
import { formatCatalogId } from './recordForm.js';
import { isBlockTabKind, itemCategory } from './sheetForm.js';
import { buildArtPool, renderTemplateThumb } from './unitArt.js';
import { writeEditorTestPlay } from '../session/editorTestPlay.js';

const PACK_BASE = 'data/pack/';
const MAX_HISTORY = 60;
const TRAY_CACHE_KEY = 'theddos_editor_trays';

const state = {
  pack: null,
  doc: null,
  tab: 'area',
  areaId: '',
  spawnKey: '',
  rulesKey: 'rule',
  sheetIds: { unitId: 'Player', weaponId: '', itemId: '', skillId: '' },
  toolMode: 'area', // 'area' | 'place-obj' | 'place-unit' | 'select'
  selectedPlacedIds: [],
  toolObjTemplate: '',
  toolUnitTemplate: '',
  toolObjTeam: 1,
  toolUnitTeam: 2,
  panelOpen: true,
  toolsOpen: true,
};

const history = {
  undo: [],
  redo: [],
  lastSnapshot: '',
};

const screens = {};

function readTrayPrefs() {
  try {
    const raw = sessionStorage.getItem(TRAY_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (typeof parsed.panelOpen === 'boolean') state.panelOpen = parsed.panelOpen;
    if (typeof parsed.toolsOpen === 'boolean') state.toolsOpen = parsed.toolsOpen;
  } catch (_) {}
}

function writeTrayPrefs() {
  try {
    sessionStorage.setItem(
      TRAY_CACHE_KEY,
      JSON.stringify({ panelOpen: state.panelOpen, toolsOpen: state.toolsOpen })
    );
  } catch (_) {}
}

function show(id) {
  const keys = Object.keys(screens);
  for (let i = 0; i < keys.length; i++) {
    screens[keys[i]].hidden = keys[i] !== id;
  }
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(url + ' → ' + res.status);
  return res.json();
}

async function loadResources(onStatus) {
  onStatus('Reading pack…');
  const manifest = await fetchJson(PACK_BASE + 'pack_manifest.json');
  const files = manifest.files || {};
  const names = ['items', 'skills', 'weapons', 'units', 'rules', 'gamePack', 'armor', 'damageMatrix'];
  const pack = { manifest };
  for (let i = 0; i < names.length; i++) {
    const file = files[names[i]];
    if (!file) throw new Error('Missing pack file ' + names[i]);
    onStatus('Reading ' + file + '…');
    pack[names[i]] = await fetchJson(PACK_BASE + file);
  }
  onStatus('Reading unit art…');
  const art = await fetch(UNIT_TEMPLATE_FILE, { cache: 'no-cache' });
  if (!art.ok) throw new Error(UNIT_TEMPLATE_FILE + ' → ' + art.status);
  const svgText = await art.text();
  if (svgText.indexOf('<svg') < 0) throw new Error('Unit art is not SVG');
  pack.unitArt = svgText;
  await buildArtPool(pack, (label) => {
    onStatus(label || 'Building art pool…');
  });
  return pack;
}

function snapshotDoc(doc) {
  return doc ? JSON.stringify(doc) : '';
}

function pruneSelectedPlacedIds() {
  const list = (state.doc && state.doc.placedObjects) || [];
  state.selectedPlacedIds = state.selectedPlacedIds.filter((id) =>
    list.some((p) => p && p.id === id)
  );
}

function updateHistoryUi() {
  const undoBtn = document.getElementById('editor-undo');
  const redoBtn = document.getElementById('editor-redo');
  if (undoBtn) undoBtn.disabled = history.undo.length === 0;
  if (redoBtn) redoBtn.disabled = history.redo.length === 0;
}

function resetHistory() {
  history.undo.length = 0;
  history.redo.length = 0;
  history.lastSnapshot = snapshotDoc(state.doc);
  updateHistoryUi();
}

function commitHistory(prevBase) {
  if (!state.doc) return;
  const next = snapshotDoc(state.doc);
  const base = prevBase || history.lastSnapshot;
  if (base && next !== base) {
    history.undo.push(base);
    if (history.undo.length > MAX_HISTORY) history.undo.shift();
    history.redo.length = 0;
  }
  history.lastSnapshot = next;
  updateHistoryUi();
}

function applyRestoredDoc(jsonText) {
  const restored = fillSheets(parseMapFile(jsonText));
  state.doc = restored;
  writePageCache(state.doc);
  history.lastSnapshot = snapshotDoc(state.doc);

  if (state.areaId && !state.doc.areas.some((a) => a.id === state.areaId)) {
    state.areaId = '';
  }
  pruneSelectedPlacedIds();

  syncToolDropdowns();
  view.paint();
  renderPanel(document.getElementById('editor-panel'), api());
  renderPlacedTray(document.getElementById('editor-placed-tray'), api());
  updateHistoryUi();
}

function performUndo() {
  if (!history.undo.length || !state.doc) return;
  const current = snapshotDoc(state.doc);
  const prev = history.undo.pop();
  history.redo.push(current);
  applyRestoredDoc(prev);
}

function performRedo() {
  if (!history.redo.length || !state.doc) return;
  const current = snapshotDoc(state.doc);
  const next = history.redo.pop();
  history.undo.push(current);
  applyRestoredDoc(next);
}

function api() {
  return {
    getDoc: () => state.doc,
    getPack: () => state.pack,
    getTab: () => state.tab,
    setTab: (tab) => {
      state.tab = tab;
    },
    getSelectedAreaId: () => state.areaId,
    getSelectedArea: () => state.doc.areas.find((row) => row.id === state.areaId) || null,
    selectArea: (id) => {
      state.areaId = id || '';
    },
    getHighlightAreaId: () => {
      const row = spawnRow(state.doc, state.spawnKey);
      if (!row) return '';
      return spawnPoint(state.doc, row).areaId || '';
    },
    getSpawnMark: () => {
      const row = spawnRow(state.doc, state.spawnKey);
      if (!row) return null;
      const point = spawnPoint(state.doc, row);
      if (point.areaId) return null;
      return { x: point.x, y: point.y };
    },
    getSpawnKey: () => state.spawnKey,
    selectSpawnKey: (key) => {
      state.spawnKey = key || '';
    },
    getRulesKey: () => state.rulesKey || 'rule',
    selectRulesKey: (key) => {
      state.rulesKey = key === 'player' || key === 'armorType' ? key : 'rule';
    },
    getSelectedUnitId: () => state.sheetIds.unitId,
    selectUnit: (id) => {
      state.sheetIds.unitId = id;
    },
    getSheetId: (key) => state.sheetIds[key] || '',
    setSheetId: (key, id) => {
      state.sheetIds[key] = id;
    },
    getToolMode: () => state.toolMode || 'area',
    setToolMode: (mode) => {
      state.toolMode = mode || 'area';
    },
    getSelectedPlacedId: () => (state.selectedPlacedIds[0] || ''),
    getSelectedPlacedIds: () => state.selectedPlacedIds.slice(),
    setSelectedPlacedId: (id) => {
      state.selectedPlacedIds = id ? [id] : [];
      if (id) {
        releaseTrailClaim('tools', api());
        releaseTrailClaim('settings', api());
      }
    },
    setSelectedPlacedIds: (ids) => {
      const list = Array.isArray(ids) ? ids.filter(Boolean) : [];
      const seen = {};
      state.selectedPlacedIds = [];
      for (let i = 0; i < list.length; i++) {
        if (seen[list[i]]) continue;
        seen[list[i]] = true;
        state.selectedPlacedIds.push(list[i]);
      }
      if (state.selectedPlacedIds.length) {
        releaseTrailClaim('tools', api());
        releaseTrailClaim('settings', api());
      }
    },
    getToolObjTemplate: () => state.toolObjTemplate || '',
    setToolObjTemplate: (id) => {
      state.toolObjTemplate = id || '';
    },
    getToolUnitTemplate: () => state.toolUnitTemplate || '',
    setToolUnitTemplate: (id) => {
      state.toolUnitTemplate = id || '';
    },
    getToolObjTeam: () => (state.toolObjTeam != null ? state.toolObjTeam : 1),
    getToolUnitTeam: () => (state.toolUnitTeam != null ? state.toolUnitTeam : 2),
    panelRoot: () => document.getElementById('editor-panel'),
    snapshot: () => snapshotDoc(state.doc),
    commitHistory: (prevBase) => commitHistory(prevBase),
    touch: (opts) => {
      if (state.doc) ensurePlayerSpawns(state.doc);
      writePageCache(state.doc);
      syncToolDropdownsIfChanged();
      if (!opts || !opts.skipHistory) {
        commitHistory();
      }
    },
    onViewState: ({ zoomPct, gridX, gridY }) => {
      const resetBtn = document.getElementById('tool-zoom-reset');
      const readout = document.getElementById('tool-grid-readout');
      if (resetBtn) resetBtn.textContent = zoomPct + '%';
      if (readout) {
        const xStr = gridX != null ? String(gridX) : '—';
        const yStr = gridY != null ? String(gridY) : '—';
        readout.textContent = `Grid 64×64 · X: ${xStr} · Y: ${yStr}`;
      }
    },
    paint: () => view.paint(),
    refreshPanel: () => {
      renderPanel(document.getElementById('editor-panel'), api());
      renderPlacedTray(document.getElementById('editor-placed-tray'), api());
    },
    confirm: (message) => askNotice(message),
  };
}

let view = {
  paint() {},
  zoomIn() {},
  zoomOut() {},
  resetView() {},
  refreshCursor() {},
};

function fillSheets(doc) {
  const sheets = sheetsFromPack(state.pack);
  if (!doc.weapons || !Object.keys(doc.weapons).length) doc.weapons = sheets.weapons;
  if (!doc.items || !Object.keys(doc.items).length) doc.items = sheets.items;
  if (!doc.skills || !Object.keys(doc.skills).length) doc.skills = sheets.skills;
  if (!doc.rules || !Object.keys(doc.rules).length) doc.rules = sheets.rules;
  const matrix = doc.damageMatrix && doc.damageMatrix.matrix;
  if (!matrix || typeof matrix !== 'object' || !Object.keys(matrix).length) doc.damageMatrix = sheets.damageMatrix;
  ensureMixSkills(doc);
  return doc;
}

function askNotice(message) {
  const notice = document.getElementById('editor-notice');
  const text = document.getElementById('editor-notice-text');
  text.textContent = message;
  notice.hidden = false;
  return new Promise((resolve) => {
    const ok = document.getElementById('editor-notice-ok');
    const cancel = document.getElementById('editor-notice-cancel');
    const finish = (yes) => {
      notice.hidden = true;
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      resolve(yes);
    };
    const onOk = () => finish(true);
    const onCancel = () => finish(false);
    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
  });
}

function askClear() {
  return askNotice('Clear the map in this tab? The page cache will be removed.');
}

function updateTrayUi() {
  const work = document.getElementById('screen-work');
  const panelTray = document.getElementById('editor-panel-tray');
  const panelToggle = document.getElementById('editor-panel-toggle');
  const toolsTray = document.getElementById('editor-tools-tray');
  const toolsToggle = document.getElementById('editor-tools-toggle');

  if (panelTray) panelTray.classList.toggle('is-collapsed', !state.panelOpen);
  if (panelToggle) {
    panelToggle.setAttribute('aria-expanded', state.panelOpen ? 'true' : 'false');
    const glyph = panelToggle.querySelector('.handle-glyph');
    if (glyph) glyph.textContent = state.panelOpen ? '›' : '‹';
  }

  if (toolsTray) toolsTray.classList.toggle('is-collapsed', !state.toolsOpen);
  if (toolsToggle) {
    toolsToggle.setAttribute('aria-expanded', state.toolsOpen ? 'true' : 'false');
    const glyph = toolsToggle.querySelector('.handle-glyph');
    if (glyph) glyph.textContent = state.toolsOpen ? '⌄' : '⌃';
  }

  if (work) work.classList.toggle('has-tools-open', state.toolsOpen);
}

function updateToolUi() {
  const mode = state.toolMode || 'area';
  const btnArea = document.getElementById('tool-mode-area');
  const btnSelect = document.getElementById('tool-mode-select');
  const slotObj = document.getElementById('tool-slot-obj');
  const slotUnit = document.getElementById('tool-slot-unit');

  if (btnArea) btnArea.classList.toggle('is-active', mode === 'area');
  if (btnSelect) btnSelect.classList.toggle('is-active', mode === 'select');
  if (slotObj) slotObj.classList.toggle('is-active', mode === 'place-obj');
  if (slotUnit) slotUnit.classList.toggle('is-active', mode === 'place-unit');
}

let lastDropdownSig = '';

function nonPendingIds(map) {
  return Object.keys(map || {}).filter((id) => map[id] && !map[id].pending);
}

function toolObjectIds(doc) {
  const items = (doc && doc.items) || {};
  return Object.keys(items).filter((id) => {
    const rec = items[id];
    if (!rec || rec.pending) return false;
    const cat = itemCategory(rec);
    // Same placeables as Block tab (Door/Gen/Factory/Base/…) plus Turret.
    return isBlockTabKind(cat) || cat === 'Turret';
  });
}

function refreshTrailFromTools() {
  releaseTrailClaim('tools', api());
}

function refreshSlotPreview(kind, overrideId) {
  const el = document.getElementById(kind === 'unit' ? 'tool-unit-preview' : 'tool-obj-preview');
  const templateId = overrideId || (kind === 'unit' ? state.toolUnitTemplate : state.toolObjTemplate);
  renderTemplateThumb(el, state.doc, state.pack, kind, templateId);
  if (overrideId) {
    renderCatalogTrailPreview(
      document.getElementById('editor-placed-tray'),
      api(),
      kind,
      overrideId,
      'tools'
    );
  } else {
    refreshTrailFromTools();
  }
}

function closeToolPickers(exceptKind) {
  const objMenu = document.getElementById('tool-obj-menu');
  const objBtn = document.getElementById('tool-obj-picker-btn');
  const unitMenu = document.getElementById('tool-unit-menu');
  const unitBtn = document.getElementById('tool-unit-picker-btn');
  if (exceptKind !== 'object' && objMenu && !objMenu.hidden) {
    objMenu.hidden = true;
    if (objBtn) objBtn.setAttribute('aria-expanded', 'false');
    releaseTrailClaim('tools', api());
    refreshSlotPreview('object');
  }
  if (exceptKind !== 'unit' && unitMenu && !unitMenu.hidden) {
    unitMenu.hidden = true;
    if (unitBtn) unitBtn.setAttribute('aria-expanded', 'false');
    releaseTrailClaim('tools', api());
    refreshSlotPreview('unit');
  }
}

function fillToolPicker(kind, ids, currentId) {
  const btn = document.getElementById(kind === 'unit' ? 'tool-unit-picker-btn' : 'tool-obj-picker-btn');
  const menu = document.getElementById(kind === 'unit' ? 'tool-unit-menu' : 'tool-obj-menu');
  if (btn) btn.textContent = currentId ? formatCatalogId(currentId) : '—';
  if (!menu) return;
  menu.replaceChildren();
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.className = 'tool-picker-item' + (id === currentId ? ' is-selected' : '');
    opt.setAttribute('role', 'option');
    opt.setAttribute('aria-selected', id === currentId ? 'true' : 'false');
    opt.dataset.id = id;
    opt.textContent = formatCatalogId(id);
    opt.addEventListener('pointerenter', () => {
      refreshSlotPreview(kind, id);
    });
    opt.addEventListener('focus', () => {
      refreshSlotPreview(kind, id);
    });
    opt.addEventListener('click', () => {
      if (kind === 'unit') {
        state.toolUnitTemplate = id;
      } else {
        state.toolObjTemplate = id;
      }
      fillToolPicker(kind, ids, id);
      menu.hidden = true;
      if (btn) btn.setAttribute('aria-expanded', 'false');
      releaseTrailClaim('tools', api());
      refreshSlotPreview(kind);
      switchTool(kind === 'unit' ? 'place-unit' : 'place-obj');
    });
    menu.appendChild(opt);
  }
}

function syncToolDropdownsIfChanged() {
  if (!state.doc) return;
  const itemIds = toolObjectIds(state.doc);
  const unitIds = nonPendingIds(state.doc.units);
  const sig = itemIds.join(',') + '|' + unitIds.join(',');
  if (sig !== lastDropdownSig) {
    syncToolDropdowns();
  } else {
    refreshSlotPreview('object');
    refreshSlotPreview('unit');
  }
}

function syncToolDropdowns() {
  if (!state.doc) return;
  const itemIds = toolObjectIds(state.doc);
  const unitIds = nonPendingIds(state.doc.units);
  lastDropdownSig = itemIds.join(',') + '|' + unitIds.join(',');

  if (!state.toolObjTemplate || itemIds.indexOf(state.toolObjTemplate) < 0) {
    state.toolObjTemplate = itemIds[0] || '';
  }
  if (!state.toolUnitTemplate || unitIds.indexOf(state.toolUnitTemplate) < 0) {
    state.toolUnitTemplate = unitIds[0] || '';
  }

  fillToolPicker('object', itemIds, state.toolObjTemplate);
  fillToolPicker('unit', unitIds, state.toolUnitTemplate);
  refreshSlotPreview('object');
  refreshSlotPreview('unit');

  const objTeam = document.getElementById('tool-obj-team');
  const unitTeam = document.getElementById('tool-unit-team');
  if (objTeam) objTeam.value = String(state.toolObjTeam != null ? state.toolObjTeam : 1);
  if (unitTeam) unitTeam.value = String(state.toolUnitTeam != null ? state.toolUnitTeam : 2);
}

function openWork() {
  document.getElementById('editor-title').textContent =
    state.doc.name + ' · ' + state.doc.pathCols + '×' + state.doc.pathRows;
  syncToolDropdowns();
  updateToolUi();
  updateTrayUi();
  resetHistory();
  show('work');
  view.paint();
  view.refreshCursor();
  renderPanel(document.getElementById('editor-panel'), api());
  renderPlacedTray(document.getElementById('editor-placed-tray'), api());
}

function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return !!target.isContentEditable;
}

function switchTool(mode) {
  state.toolMode = mode;
  updateToolUi();
  view.refreshCursor();
  view.paint();
}

function wirePicker(kind) {
  const picker = document.getElementById(kind === 'unit' ? 'tool-unit-picker' : 'tool-obj-picker');
  const btn = document.getElementById(kind === 'unit' ? 'tool-unit-picker-btn' : 'tool-obj-picker-btn');
  const menu = document.getElementById(kind === 'unit' ? 'tool-unit-menu' : 'tool-obj-menu');
  if (!picker || !btn || !menu) return;

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const nextOpen = menu.hidden;
    closeToolPickers(kind);
    menu.hidden = !nextOpen;
    btn.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
    if (!nextOpen) refreshSlotPreview(kind);
  });

  menu.addEventListener('pointerleave', () => {
    releaseTrailClaim('tools', api());
  });
}

function bindWork() {
  const btnArea = document.getElementById('tool-mode-area');
  const btnSelect = document.getElementById('tool-mode-select');
  const btnObjPreview = document.getElementById('tool-obj-preview');
  const btnUnitPreview = document.getElementById('tool-unit-preview');
  const objTeam = document.getElementById('tool-obj-team');
  const unitTeam = document.getElementById('tool-unit-team');

  const btnUndo = document.getElementById('editor-undo');
  const btnRedo = document.getElementById('editor-redo');
  const btnZoomIn = document.getElementById('tool-zoom-in');
  const btnZoomOut = document.getElementById('tool-zoom-out');
  const btnZoomReset = document.getElementById('tool-zoom-reset');
  const btnPanelToggle = document.getElementById('editor-panel-toggle');
  const btnToolsToggle = document.getElementById('editor-tools-toggle');

  if (btnArea) btnArea.addEventListener('click', () => {
    closeToolPickers();
    switchTool('area');
  });
  if (btnSelect) btnSelect.addEventListener('click', () => {
    closeToolPickers();
    switchTool('select');
  });
  if (btnObjPreview) btnObjPreview.addEventListener('click', () => {
    closeToolPickers();
    switchTool('place-obj');
  });
  if (btnUnitPreview) btnUnitPreview.addEventListener('click', () => {
    closeToolPickers();
    switchTool('place-unit');
  });

  if (objTeam) {
    objTeam.addEventListener('change', () => {
      state.toolObjTeam = Number(objTeam.value) || 0;
    });
  }
  if (unitTeam) {
    unitTeam.addEventListener('change', () => {
      state.toolUnitTeam = Number(unitTeam.value) || 0;
    });
  }

  wirePicker('object');
  wirePicker('unit');

  window.addEventListener('pointerdown', (event) => {
    const target = event.target;
    if (target && target.closest && target.closest('.tool-picker')) return;
    closeToolPickers();
  });

  if (btnUndo) btnUndo.addEventListener('click', performUndo);
  if (btnRedo) btnRedo.addEventListener('click', performRedo);
  if (btnZoomIn) btnZoomIn.addEventListener('click', () => view.zoomIn());
  if (btnZoomOut) btnZoomOut.addEventListener('click', () => view.zoomOut());
  if (btnZoomReset) btnZoomReset.addEventListener('click', () => view.resetView());

  if (btnPanelToggle) {
    btnPanelToggle.addEventListener('click', () => {
      state.panelOpen = !state.panelOpen;
      writeTrayPrefs();
      updateTrayUi();
    });
  }

  if (btnToolsToggle) {
    btnToolsToggle.addEventListener('click', () => {
      state.toolsOpen = !state.toolsOpen;
      writeTrayPrefs();
      updateTrayUi();
    });
  }

  document.getElementById('editor-export').addEventListener('click', () => {
    const blob = new Blob([exportMapText(state.doc)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = state.doc.name + '.json';
    link.click();
    URL.revokeObjectURL(link.href);
  });

  const btnTestPlay = document.getElementById('editor-test-play');
  if (btnTestPlay) {
    btnTestPlay.addEventListener('click', () => {
      const detail = { doc: state.doc, pack: state.pack };
      try {
        window.dispatchEvent(new CustomEvent('editor:testPlay', { detail }));
      } catch (_) {}
      const handoff = () => {
        try {
          // Same bytes as Export — 1 file = 1 map, then Gameplay loads that JSON.
          const exported = exportMapText(state.doc);
          const doc = JSON.parse(exported);
          writeEditorTestPlay(doc, {
            name: doc && doc.name,
            from: 'editor',
            exported: true,
            pathCols: doc.pathCols,
            pathRows: doc.pathRows,
            gameMode:
              (doc && doc.gameMode) ||
              (doc && doc.rules && doc.rules.gameMode) ||
              'FLAT_SURVIVAL',
          });
        } catch (err) {
          askNotice(
            'Test Play handoff failed: ' +
              (err && err.message ? err.message : String(err))
          );
          return;
        }
        window.location.href = 'index.html#/loading#from=editor';
      };
      if (typeof window.onEditorTestPlay === 'function') {
        try {
          const maybe = window.onEditorTestPlay(detail);
          if (maybe === false) return;
        } catch (_) {}
      }
      handoff();
    });
  }

  document.getElementById('editor-import').addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    await importMapFromFile(file, { fromWork: true });
  });

  document.getElementById('editor-new').addEventListener('click', async () => {
    const yes = await askClear();
    if (!yes) return;
    clearPageCache();
    state.doc = null;
    state.areaId = '';
    state.selectedPlacedIds = [];
    state.spawnKey = '';
    state.rulesKey = 'rule';
    resetHistory();
    show('create');
  });

  window.addEventListener('keydown', (event) => {
    const modal = document.getElementById('editor-matrix-modal');
    const notice = document.getElementById('editor-notice');

    if (event.key === 'Escape') {
      closeToolPickers();
      if (modal && !modal.hidden) {
        modal.hidden = true;
        event.preventDefault();
        return;
      }
      if (notice && !notice.hidden) {
        const cancelBtn = document.getElementById('editor-notice-cancel');
        if (cancelBtn) cancelBtn.click();
        event.preventDefault();
        return;
      }
      if (screens.work && !screens.work.hidden && state.doc) {
        if (state.selectedPlacedIds.length || state.areaId) {
          state.selectedPlacedIds = [];
          state.areaId = '';
          view.paint();
          api().refreshPanel();
          event.preventDefault();
          return;
        }
        if (state.toolMode !== 'area') {
          switchTool('area');
          event.preventDefault();
          return;
        }
      }
    }

    if (!state.doc || !screens.work || screens.work.hidden) return;
    if ((modal && !modal.hidden) || (notice && !notice.hidden)) return;
    if (isTypingTarget(event.target)) return;

    if ((event.ctrlKey || event.metaKey) && !event.altKey) {
      const key = (event.key || '').toLowerCase();
      if (key === 'z') {
        if (event.shiftKey) performRedo();
        else performUndo();
        event.preventDefault();
        return;
      }
      if (key === 'y') {
        performRedo();
        event.preventDefault();
        return;
      }
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (state.selectedPlacedIds.length && Array.isArray(state.doc.placedObjects)) {
        const drop = {};
        for (let i = 0; i < state.selectedPlacedIds.length; i++) drop[state.selectedPlacedIds[i]] = true;
        const nextList = state.doc.placedObjects.filter((item) => item && !drop[item.id]);
        if (nextList.length !== state.doc.placedObjects.length) {
          state.doc.placedObjects = nextList;
          state.selectedPlacedIds = [];
          api().touch();
          view.paint();
          api().refreshPanel();
          event.preventDefault();
          return;
        }
      }
      if (state.areaId && Array.isArray(state.doc.areas)) {
        const nextAreas = state.doc.areas.filter((row) => row.id !== state.areaId);
        if (nextAreas.length !== state.doc.areas.length) {
          state.doc.areas = nextAreas;
          state.areaId = '';
          api().touch();
          view.paint();
          api().refreshPanel();
          event.preventDefault();
          return;
        }
      }
    }

    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
      if (event.key === '=' || event.key === '+') {
        view.zoomIn();
        event.preventDefault();
      } else if (event.key === '-') {
        view.zoomOut();
        event.preventDefault();
      } else if (event.key === '0') {
        view.resetView();
        event.preventDefault();
      }
    }
  });
}

async function runLoading() {
  show('loading');
  const label = document.getElementById('editor-load-label');
  const error = document.getElementById('editor-load-error');
  const fill = document.getElementById('editor-load-fill');
  const pctEl = document.getElementById('editor-load-pct');
  if (error) error.textContent = '';
  let progress = 4;
  const setProgress = (pct, text) => {
    progress = Math.max(0, Math.min(100, pct));
    if (label) label.textContent = text || label.textContent;
    if (fill) fill.style.width = progress + '%';
    if (pctEl) pctEl.textContent = 'Loading ' + Math.round(progress) + '%';
  };
  setProgress(4, 'Reading pack…');
  try {
    state.pack = await loadResources((text) => {
      const bump =
        text && text.indexOf('Art pool') === 0
          ? Math.min(96, progress + 2)
          : Math.min(70, progress + 3);
      setProgress(bump, text);
    });
    setProgress(100, 'Ready');
  } catch (err) {
    if (error) error.textContent = err.message || String(err);
    throw err;
  }
}

function setCreateError(message) {
  const error = document.getElementById('editor-create-error');
  if (error) error.textContent = message || '';
}

function resetCreateFormDefaults() {
  const name = document.getElementById('editor-name');
  const cols = document.getElementById('editor-cols');
  const rows = document.getElementById('editor-rows');
  if (name) name.value = 'untitled_map';
  if (cols) cols.value = '3';
  if (rows) rows.value = '3';
  setCreateError('');
}

/**
 * Load a map JSON file into the editor and open the work screen.
 * Shared by work-bar Import, create-screen Import, and drag-drop.
 */
async function importMapFromFile(file, opts = {}) {
  if (!file) return;
  const fromWork = !!opts.fromWork;
  try {
    const text = await file.text();
    state.doc = fillSheets(parseMapFile(text));
    writePageCache(state.doc);
    state.areaId = '';
    state.selectedPlacedIds = [];
    state.spawnKey = '';
    state.rulesKey = 'rule';
    resetHistory();
    show('loading');
    await runLoading();
    openWork();
  } catch (err) {
    const message = err.message || String(err);
    if (fromWork && state.pack && state.doc) {
      document.getElementById('editor-copy').textContent = message;
      show('work');
    } else {
      setCreateError(message);
      show('create');
    }
  }
}

function bindCreateDrop(screen) {
  if (!screen) return;
  let dragDepth = 0;
  screen.addEventListener('dragenter', (event) => {
    event.preventDefault();
    dragDepth += 1;
    screen.classList.add('is-drop-target');
  });
  screen.addEventListener('dragleave', (event) => {
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) screen.classList.remove('is-drop-target');
  });
  screen.addEventListener('dragover', (event) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  });
  screen.addEventListener('drop', async (event) => {
    event.preventDefault();
    dragDepth = 0;
    screen.classList.remove('is-drop-target');
    const file =
      event.dataTransfer &&
      event.dataTransfer.files &&
      event.dataTransfer.files[0];
    if (!file) return;
    const name = String(file.name || '').toLowerCase();
    if (name && !name.endsWith('.json')) {
      setCreateError('Drop a map JSON file (.json)');
      return;
    }
    await importMapFromFile(file, { fromWork: false });
  });
}

function bindCreate() {
  const cols = document.getElementById('editor-cols');
  const rows = document.getElementById('editor-rows');
  cols.max = String(MAX_SIDE);
  rows.max = String(MAX_SIDE);
  document.getElementById('editor-create-form').addEventListener('submit', (event) => {
    event.preventDefault();
    setCreateError('');
    try {
      const sheets = sheetsFromPack(state.pack);
      state.doc = createMapDoc({
        name: document.getElementById('editor-name').value,
        pathCols: cols.value,
        pathRows: rows.value,
        units: sheets.units,
        weapons: sheets.weapons,
        items: sheets.items,
        skills: sheets.skills,
        rules: sheets.rules,
        teams: sheets.teams,
        damageMatrix: sheets.damageMatrix,
      });
      state.areaId = '';
      state.selectedPlacedIds = [];
      resetHistory();
      writePageCache(state.doc);
      openWork();
    } catch (err) {
      setCreateError(err.message || String(err));
    }
  });

  const createImport = document.getElementById('editor-create-import');
  if (createImport) {
    createImport.addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      event.target.value = '';
      if (!file) return;
      await importMapFromFile(file, { fromWork: false });
    });
  }

  bindCreateDrop(document.getElementById('screen-create'));
}

function enterEditor() {
  return runLoading()
    .then(() => {
      // Always land on New map so author can Create or Import every session.
      state.doc = null;
      state.areaId = '';
      state.selectedPlacedIds = [];
      state.spawnKey = '';
      state.rulesKey = 'rule';
      resetHistory();
      resetCreateFormDefaults();
      show('create');
    })
    .catch(() => show('loading'));
}

function boot() {
  // Field help targets #editor-field-help in the left Trail tray.
  if (typeof window !== 'undefined') {
    window.__editorSetFieldHelp = setFieldHelp;
    window.__editorClearFieldHelp = clearFieldHelp;
  }
  readTrayPrefs();
  screens.loading = document.getElementById('screen-loading');
  screens.create = document.getElementById('screen-create');
  screens.work = document.getElementById('screen-work');
  view = mountMapView(document.getElementById('editor-svg'), api());
  bindCreate();
  bindWork();
  enterEditor();
}

boot();

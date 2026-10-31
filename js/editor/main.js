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
import { renderPanel } from './panels.js';

const PACK_BASE = 'data/pack/';

const state = {
  pack: null,
  doc: null,
  tab: 'area',
  areaId: '',
  spawnKey: '',
  rulesKey: 'rule',
  sheetIds: { unitId: 'PLAYER', weaponId: '', itemId: '', skillId: '' },
};

const screens = {};

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
  return pack;
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
    panelRoot: () => document.getElementById('editor-panel'),
    touch: () => {
      if (state.doc) ensurePlayerSpawns(state.doc);
      writePageCache(state.doc);
    },
    paint: () => view.paint(),
    refreshPanel: () => renderPanel(document.getElementById('editor-panel'), api()),
    confirm: (message) => askNotice(message),
  };
}

let view = { paint() {} };

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
function openWork() {
  document.getElementById('editor-title').textContent =
    state.doc.name + ' · ' + state.doc.pathCols + '×' + state.doc.pathRows;
  show('work');
  view.paint();
  renderPanel(document.getElementById('editor-panel'), api());
}

function bindWork() {
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
  document.getElementById('editor-import').addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      state.doc = fillSheets(parseMapFile(text));
      writePageCache(state.doc);
      state.areaId = '';
      state.spawnKey = '';
      state.rulesKey = 'rule';
      show('loading');
      await runLoading();
      openWork();
    } catch (err) {
      const message = err.message || String(err);
      if (state.pack && state.doc) {
        document.getElementById('editor-copy').textContent = message;
        show('work');
      } else {
        document.getElementById('editor-load-error').textContent = message;
        show('loading');
      }
    }
  });
  document.getElementById('editor-new').addEventListener('click', async () => {
    const yes = await askClear();
    if (!yes) return;
    clearPageCache();
    state.doc = null;
    state.areaId = '';
    state.spawnKey = '';
    state.rulesKey = 'rule';
    show('create');
  });
}

async function runLoading() {
  show('loading');
  const label = document.getElementById('editor-load-label');
  const error = document.getElementById('editor-load-error');
  error.textContent = '';
  try {
    state.pack = await loadResources((text) => {
      label.textContent = text;
    });
    label.textContent = 'Ready';
  } catch (err) {
    error.textContent = err.message || String(err);
    throw err;
  }
}

function bindCreate() {
  const cols = document.getElementById('editor-cols');
  const rows = document.getElementById('editor-rows');
  cols.max = String(MAX_SIDE);
  rows.max = String(MAX_SIDE);
  document.getElementById('editor-create-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const error = document.getElementById('editor-create-error');
    error.textContent = '';
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
      writePageCache(state.doc);
      openWork();
    } catch (err) {
      error.textContent = err.message || String(err);
    }
  });
}

function enterEditor() {
  return runLoading()
    .then(() => {
      const cached = readPageCache();
      if (cached) {
        state.doc = fillSheets(cached);
        openWork();
      } else {
        show('create');
      }
    })
    .catch(() => show('loading'));
}

function boot() {
  screens.loading = document.getElementById('screen-loading');
  screens.create = document.getElementById('screen-create');
  screens.work = document.getElementById('screen-work');
  view = mountMapView(document.getElementById('editor-svg'), api());
  bindCreate();
  bindWork();
  enterEditor();
}

boot();

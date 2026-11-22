/**
 * Right-hand panels. One id is one record. Catalog ids are chosen, not typed.
 */

import { armorTypeNames, damageTypeNames, spawnRow } from './mapDoc.js';
import {
  UNIT_MODEL_IDS,
  appendDivider,
  appendSectionTitle,
  blankRecord,
  cssColor,
  buildCatalogListPicker,
  formatCatalogId,
  getFieldHelp,
  renderRecord,
  unionShape,
  toReadableLabel,
} from './recordForm.js';
import {
  blankFor,
  isArmorTabKind,
  isBlockTabKind,
  itemCategory,
  itemHeadings,
  renderTyped,
  skillEffectNames,
  weaponPreviewSpec,
} from './sheetForm.js';
import {
  ensureUnitPoolEntry,
  getParsedUnitArt,
  heldLoadout,
  mountModelPreview,
  mountPoolPreview,
  mountStructurePreviewSvg,
  recordSwatch,
  weaponRecordOf,
} from './unitArt.js';
import {
  TEAM_ROW_CAP,
  firstTeamId,
  teamIdsFromDoc,
  teamSelectOptions,
} from '../defs/teams.js';
import { GAME_PACK } from '../defs/gamePack.js';

const TABS = [
  ['area', 'Area'],
  ['spawn', 'Spawns'],
  ['unit', 'Units'],
  ['weapon', 'Weapons'],
];
const TOP_TAB_SKIP = {
  Door: true,
  Wire: true,
  Heal: true,
  Generator: true,
  Factory: true,
  Base: true,
  Weapon: true,
  Shield: true,
  Tool: true,
  Ammo: true,
  Backpack: true,
};
const ITEM_KINDS = itemHeadings();
for (let kindIndex = 0; kindIndex < ITEM_KINDS.length; kindIndex++) {
  if (TOP_TAB_SKIP[ITEM_KINDS[kindIndex]]) continue;
  const tabLabel = ITEM_KINDS[kindIndex] === 'Armor' ? 'Item' : ITEM_KINDS[kindIndex];
  TABS.push(['item:' + ITEM_KINDS[kindIndex], tabLabel]);
}
TABS.push(['skill', 'Skills'], ['rules', 'Rules']);

const FACTION_CHOICES = ['ENEMY', 'FRIENDLY'];
const RELOAD_CHOICES = ['MAGAZINE', 'INDIVIDUAL_SHELL'];

let catalogPage = 0;

/** Active trail owner: settings | tools | placed | null (higher focus wins until released). */
let trailClaim = { source: null, kind: '', templateId: '' };

function syncTrailVisibility(trayEl) {
  if (!trayEl) return;
  const bar = document.getElementById('editor-field-help');
  const panel = document.getElementById('editor-placed-panel');
  const helpOn = !!(bar && !bar.hidden && String(bar.textContent || '').trim());
  const panelOn = !!(panel && panel.childNodes.length);
  trayEl.hidden = !(helpOn || panelOn || trailClaim.source);
}

/** Field help lives on the left tray (near placed-panel), not inside settings. */
export function setFieldHelp(text) {
  const tray = document.getElementById('editor-placed-tray');
  const bar = document.getElementById('editor-field-help');
  if (!bar) return;
  const msg = text && String(text).trim() ? String(text).trim() : '';
  if (!msg) {
    bar.textContent = '';
    bar.hidden = true;
  } else {
    bar.textContent = msg;
    bar.hidden = false;
  }
  syncTrailVisibility(tray);
  if (typeof window !== 'undefined') {
    window.__editorSetFieldHelp = setFieldHelp;
    window.__editorClearFieldHelp = clearFieldHelp;
  }
}

/** Hide help when pointer leaves a help-bearing control. */
export function clearFieldHelp() {
  setFieldHelp('');
}

function bindFieldHelpHover(el, resolveHelp) {
  if (!el || typeof resolveHelp !== 'function') return;
  el.addEventListener('pointerenter', () => setFieldHelp(resolveHelp()));
  el.addEventListener('pointerleave', () => clearFieldHelp());
}

export function claimTrailPreview(source, api, kind, templateId) {
  trailClaim = {
    source: source || null,
    kind: kind || '',
    templateId: templateId || '',
  };
  const tray = document.getElementById('editor-placed-tray');
  if (!tray || !api) return;
  if (templateId) fillCatalogPreview(tray, api, kind, templateId);
  else {
    const panel = tray.querySelector('#editor-placed-panel');
    if (panel) panel.replaceChildren();
  }
  syncTrailVisibility(tray);
}

export function releaseTrailClaim(source, api) {
  if (trailClaim.source !== source) return;
  trailClaim = { source: null, kind: '', templateId: '' };
  refreshTrail(api);
}

export function refreshTrail(api) {
  const tray = document.getElementById('editor-placed-tray');
  if (!tray) return;
  if (
    (trailClaim.source === 'settings' || trailClaim.source === 'tools') &&
    trailClaim.templateId
  ) {
    fillCatalogPreview(tray, api, trailClaim.kind, trailClaim.templateId);
    syncTrailVisibility(tray);
    return;
  }
  renderPlacedTray(tray, api);
}

function field(label, input, kind) {
  const wrap = document.createElement('label');
  if (kind) wrap.className = kind;
  if (label) wrap.textContent = label;
  const resolveHelp = () => {
    const value = input && 'value' in input ? input.value : '';
    return getFieldHelp(label, null, value);
  };
  const help = resolveHelp();
  if (help) {
    wrap.title = help;
    wrap.dataset.fieldHelp = help;
    bindFieldHelpHover(wrap, resolveHelp);
  }
  wrap.appendChild(input);
  return wrap;
}

function columnMark(text, kind) {
  const span = document.createElement('span');
  if (kind) span.className = kind;
  span.textContent = text;
  return span;
}

function numberOf(value, min, onChange) {
  const node = document.createElement('input');
  node.type = 'number';
  node.min = String(min);
  node.value = value == null ? '' : String(value);
  node.addEventListener('change', () => onChange(node.value));
  return node;
}

function selectOf(options, value, onChange) {
  const node = document.createElement('select');
  const seen = {};
  for (let i = 0; i < options.length; i++) {
    if (seen[options[i].value]) continue;
    seen[options[i].value] = true;
    const option = document.createElement('option');
    option.value = options[i].value;
    option.textContent = options[i].label;
    node.appendChild(option);
  }
  node.value = value == null ? '' : String(value);
  node.addEventListener('change', () => onChange(node.value));
  return node;
}

function choiceList(names, current) {
  const options = [{ value: '', label: '(none)' }];
  const seen = { '': true };
  for (let i = 0; i < names.length; i++) {
    if (!names[i] || seen[names[i]]) continue;
    seen[names[i]] = true;
    options.push({ value: names[i], label: names[i] });
  }
  if (current && !seen[current]) options.push({ value: current, label: current });
  return options;
}

function idList(ids, current) {
  const options = [];
  const seen = {};
  for (let i = 0; i < ids.length; i++) {
    if (!ids[i] || seen[ids[i]]) continue;
    seen[ids[i]] = true;
    options.push({ value: ids[i], label: formatCatalogId(ids[i]) });
  }
  if (current && !seen[current]) options.unshift({ value: current, label: formatCatalogId(current) });
  return options;
}

function parseUnitSpec(spec) {
  const text = String(spec || '');
  const cut = text.lastIndexOf(':');
  if (cut < 0) return { id: text.trim(), count: 1 };
  return {
    id: text.slice(0, cut).trim(),
    count: Math.max(1, parseInt(text.slice(cut + 1), 10) || 1),
  };
}

function collectStrings(records, key) {
  const out = [];
  function take(node) {
    if (typeof node === 'string') {
      if (node && out.indexOf(node) < 0) out.push(node);
      return;
    }
    if (!Array.isArray(node)) return;
    for (let i = 0; i < node.length; i++) take(node[i]);
  }
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) walk(node[i]);
      return;
    }
    const keys = Object.keys(node);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === key) take(node[key]);
      else walk(node[keys[i]]);
    }
  }
  for (let i = 0; i < records.length; i++) walk(records[i]);
  return out;
}

function mapRecords(map) {
  const rows = [];
  const ids = Object.keys(map || {});
  for (let i = 0; i < ids.length; i++) rows.push(map[ids[i]]);
  return rows;
}

function measureControl(bar, text, className) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  if (className) button.className = className;
  button.style.position = 'absolute';
  button.style.visibility = 'hidden';
  bar.appendChild(button);
  const width = button.offsetWidth;
  button.remove();
  return width;
}

function packTabPages(widths, gap, limit) {
  const pages = [];
  let page = [];
  let used = 0;
  for (let i = 0; i < widths.length; i++) {
    const need = widths[i] + (page.length ? gap : 0);
    if (page.length && used + need > limit) {
      pages.push(page);
      page = [i];
      used = widths[i];
    } else {
      page.push(i);
      used += need;
    }
  }
  if (page.length) pages.push(page);
  if (!pages.length) pages.push([]);
  return pages;
}

function tabPages(bar) {
  const style = getComputedStyle(bar);
  const gap = parseFloat(style.columnGap || style.gap) || 0;
  const pad = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
  const content = bar.clientWidth - pad;
  const widths = [];
  for (let i = 0; i < TABS.length; i++) widths.push(measureControl(bar, TABS[i][1], ''));
  if (content <= 0) {
    const all = [];
    for (let i = 0; i < TABS.length; i++) all.push(i);
    return [all];
  }
  const pager = Math.max(measureControl(bar, '<', 'is-pager'), measureControl(bar, '>', 'is-pager'));
  const room = Math.max(48, content - pager * 2 - gap * 2);
  let pages = packTabPages(widths, gap, room);
  if (pages.length === 1 && widths.length > 1) {
    const mid = Math.ceil(widths.length / 2);
    const firstWidths = widths.slice(0, mid);
    if (packTabPages(firstWidths, gap, room).length === 1) {
      const first = [];
      const second = [];
      for (let i = 0; i < widths.length; i++) {
        if (i < mid) first.push(i);
        else second.push(i);
      }
      pages = [first, second];
    }
  }
  return pages;
}

function paintTabBar(bar, pages, root, api) {
  bar.replaceChildren();
  const page = pages[catalogPage] || [];
  if (catalogPage > 0) {
    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'is-pager';
    prev.textContent = '<';
    prev.setAttribute('aria-label', 'Previous catalogs');
    prev.addEventListener('click', () => {
      catalogPage -= 1;
      renderPanel(root, api);
    });
    bar.appendChild(prev);
  }
  for (let i = 0; i < page.length; i++) {
    const index = page[i];
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = TABS[index][1];
    const on = api.getTab() === TABS[index][0];
    if (on) button.className = 'is-on';
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    button.addEventListener('click', () => {
      api.setTab(TABS[index][0]);
      renderPanel(root, api);
    });
    bar.appendChild(button);
  }
  if (catalogPage < pages.length - 1) {
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'is-pager';
    next.textContent = '>';
    next.setAttribute('aria-label', 'Next catalogs');
    next.addEventListener('click', () => {
      catalogPage += 1;
      renderPanel(root, api);
    });
    bar.appendChild(next);
  }
}

function appendTabBar(root, api) {
  const bar = document.createElement('div');
  bar.className = 'editor-tabs';
  root.appendChild(bar);
  let pages = tabPages(bar);
  for (let guard = 0; guard < 8; guard++) {
    if (catalogPage >= pages.length) catalogPage = Math.max(0, pages.length - 1);
    if (catalogPage < 0) catalogPage = 0;
    paintTabBar(bar, pages, root, api);
    if (bar.scrollWidth <= bar.clientWidth + 1) return;
    const page = pages[catalogPage];
    if (!page || page.length <= 1) return;
    const moved = page.pop();
    if (!pages[catalogPage + 1]) pages.push([]);
    pages[catalogPage + 1].unshift(moved);
  }
}

export function renderPanel(root, api) {
  const prevRail = root.querySelector('.editor-rail');
  const prevSettings = root.querySelector('.editor-settings');
  const railScroll = prevRail ? prevRail.scrollTop : 0;
  const settingsScroll = prevSettings ? prevSettings.scrollTop : 0;
  const doc = api.getDoc();
  root.replaceChildren();
  appendTabBar(root, api);

  const tab = api.getTab();
  const kind = itemKindOf(tab);
  const bench = document.createElement('div');
  bench.className = 'editor-bench';
  bench.appendChild(renderRail(api, doc, tab));
  const settings = document.createElement('div');
  settings.className = 'editor-settings';
  if (tab === 'area') renderArea(settings, api, doc);
  else if (tab === 'spawn') renderSpawns(settings, api, doc);
  else if (tab === 'unit') renderSheet(settings, api, doc, doc.units, 'unitId', 'Unit');
  else if (tab === 'weapon') renderGear(settings, api, doc);
  else if (kind) renderSheet(settings, api, doc, doc.items, 'itemId', 'Item');
  else if (tab === 'skill') renderSkillSheet(settings, api, doc);
  else renderRules(settings, api, doc);
  bench.appendChild(settings);
  root.appendChild(bench);
  const rail = bench.querySelector('.editor-rail');
  if (rail) rail.scrollTop = railScroll;
  settings.scrollTop = settingsScroll;
  fitPreviewArt(root);
}

function fillCatalogPreview(trayEl, api, kind, templateId) {
  const doc = api.getDoc();
  const panel = trayEl.querySelector('#editor-placed-panel') || trayEl;
  if (!doc || !templateId) {
    panel.replaceChildren();
    return;
  }
  let previewKey = 'itemId';
  let def = null;
  let noteText = 'Object place preview';
  if (kind === 'unit') {
    def = doc.units && doc.units[templateId];
    previewKey = 'unitId';
    noteText = 'Unit place preview';
  } else if (doc.items && doc.items[templateId]) {
    def = doc.items[templateId];
    previewKey = 'itemId';
  } else if (doc.weapons && doc.weapons[templateId]) {
    def = doc.weapons[templateId];
    previewKey = 'weaponId';
    noteText = 'Weapon / loadout preview';
  }
  panel.replaceChildren();
  if (!def) return;

  trayEl.setAttribute('aria-label', 'Trail');
  const header = document.createElement('div');
  header.className = 'editor-placed-header';
  const title = document.createElement('span');
  title.className = 'editor-placed-title';
  title.textContent = 'Preview · ' + formatCatalogId(templateId);
  header.appendChild(title);
  panel.appendChild(header);
  panel.appendChild(previewFor(api, previewKey, def));
  const note = document.createElement('p');
  note.className = 'editor-note';
  note.textContent = noteText;
  panel.appendChild(note);
  fitPreviewArt(panel);
}

/** Claim trail preview from tools/settings hover (does not fight placed until released). */
export function renderCatalogTrailPreview(trayEl, api, kind, templateId, source) {
  claimTrailPreview(source || 'tools', api, kind, templateId);
  if (trayEl) syncTrailVisibility(trayEl);
}

function clearPlacedSelection(api) {
  if (api.setSelectedPlacedIds) api.setSelectedPlacedIds([]);
  else if (api.setSelectedPlacedId) api.setSelectedPlacedId('');
}

function selectedPlacedItems(api, doc) {
  const ids = api.getSelectedPlacedIds
    ? api.getSelectedPlacedIds()
    : (api.getSelectedPlacedId ? [api.getSelectedPlacedId()].filter(Boolean) : []);
  if (!doc || !Array.isArray(doc.placedObjects) || !ids.length) return [];
  const out = [];
  for (let i = 0; i < ids.length; i++) {
    const item = doc.placedObjects.find((p) => p && p.id === ids[i]);
    if (item) out.push(item);
  }
  return out;
}

function selectionIsSameType(items) {
  if (!items.length) return false;
  const kind = items[0].kind;
  const templateId = items[0].templateId || '';
  for (let i = 1; i < items.length; i++) {
    if (items[i].kind !== kind || (items[i].templateId || '') !== templateId) return false;
  }
  return true;
}

export function renderPlacedTray(trayEl, api) {
  if (!trayEl) return;
  // Hover preview from settings/tools keeps ownership until released.
  if (
    (trailClaim.source === 'settings' || trailClaim.source === 'tools') &&
    trailClaim.templateId
  ) {
    fillCatalogPreview(trayEl, api, trailClaim.kind, trailClaim.templateId);
    syncTrailVisibility(trayEl);
    return;
  }

  const doc = api.getDoc();
  const items = selectedPlacedItems(api, doc);
  const panel = trayEl.querySelector('#editor-placed-panel') || trayEl;
  if (!items.length) {
    trailClaim = { source: null, kind: '', templateId: '' };
    panel.replaceChildren();
    syncTrailVisibility(trayEl);
    return;
  }

  const sameType = selectionIsSameType(items);
  const primary = items[0];
  trailClaim = {
    source: 'placed',
    kind: primary.kind === 'unit' ? 'unit' : 'object',
    templateId: sameType ? (primary.templateId || '') : '',
  };
  trayEl.setAttribute('aria-label', 'Trail');
  panel.replaceChildren();

  const header = document.createElement('div');
  header.className = 'editor-placed-header';
  const title = document.createElement('span');
  title.className = 'editor-placed-title';
  if (items.length === 1) {
    title.textContent = 'Trail · ' + formatCatalogId(primary.templateId || primary.id);
  } else if (sameType) {
    title.textContent = 'Trail · ' + formatCatalogId(primary.templateId || primary.id) + ' ×' + items.length;
  } else {
    title.textContent = 'Trail · ' + items.length + ' selected (mixed)';
  }
  header.appendChild(title);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'editor-placed-close';
  closeBtn.textContent = '×';
  closeBtn.title = 'Close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.addEventListener('click', () => {
    clearPlacedSelection(api);
    api.paint();
    renderPlacedTray(trayEl, api);
  });
  header.appendChild(closeBtn);
  panel.appendChild(header);

  if (sameType) {
    const def = primary.kind === 'unit'
      ? (doc.units && doc.units[primary.templateId])
      : (doc.items && doc.items[primary.templateId]);
    if (def) {
      panel.appendChild(previewFor(api, primary.kind === 'unit' ? 'unitId' : 'itemId', def));
    }
  } else {
    const note = document.createElement('p');
    note.className = 'editor-note';
    note.textContent = 'Mixed types — Team and Delete only.';
    panel.appendChild(note);
  }

  if (sameType) {
    let sharedMax = items[0].maxHp != null ? items[0].maxHp : items[0].currentHp || 100;
    let sharedCur = items[0].currentHp != null ? items[0].currentHp : sharedMax;
    let maxSame = true;
    let curSame = true;
    for (let i = 0; i < items.length; i++) {
      const maxHpVal = items[i].maxHp != null ? items[i].maxHp : items[i].currentHp || 100;
      const curHpVal = items[i].currentHp != null ? items[i].currentHp : maxHpVal;
      if (maxHpVal !== sharedMax) maxSame = false;
      if (curHpVal !== sharedCur) curSame = false;
      if (maxHpVal < sharedMax) sharedMax = maxHpVal;
    }

    const hpRow = document.createElement('div');
    hpRow.className = 'editor-placed-hp-row';

    const hpWrap = document.createElement('label');
    hpWrap.textContent = items.length > 1 ? 'Current HP (all)' : 'Current HP';
    const hpInput = document.createElement('input');
    hpInput.type = 'number';
    hpInput.min = '1';
    hpInput.max = String(sharedMax);
    hpInput.value = curSame ? String(sharedCur) : '';
    hpInput.placeholder = curSame ? '' : 'mixed';
    hpInput.addEventListener('change', () => {
      const next = Math.max(1, Number(hpInput.value) || 1);
      for (let i = 0; i < items.length; i++) {
        const maxHpVal = items[i].maxHp != null ? items[i].maxHp : items[i].currentHp || 100;
        items[i].currentHp = Math.min(maxHpVal, next);
      }
      hpInput.value = String(next);
      api.touch();
      api.paint();
    });
    hpWrap.appendChild(hpInput);
    hpRow.appendChild(hpWrap);

    const maxHpWrap = document.createElement('label');
    maxHpWrap.textContent = 'Max HP';
    const maxHpInput = document.createElement('input');
    maxHpInput.type = 'number';
    maxHpInput.value = maxSame ? String(sharedMax) : '';
    maxHpInput.placeholder = maxSame ? '' : 'mixed';
    maxHpInput.disabled = true;
    maxHpInput.title = 'From template — not editable';
    maxHpWrap.appendChild(maxHpInput);
    hpRow.appendChild(maxHpWrap);
    panel.appendChild(hpRow);
  }

  const teamWrap = document.createElement('label');
  teamWrap.textContent = items.length > 1 ? 'Team (all)' : 'Team';
  const teamSelect = document.createElement('select');
  const packTeams = GAME_PACK && GAME_PACK.teams;
  const teamOpts = teamSelectOptions(doc, null, packTeams);
  for (let i = 0; i < teamOpts.length; i++) {
    const opt = document.createElement('option');
    opt.value = teamOpts[i].value;
    opt.textContent = teamOpts[i].label;
    teamSelect.appendChild(opt);
  }
  let teamSame = true;
  const defaultTeam = firstTeamId(doc, packTeams);
  const team0 = items[0].team != null ? items[0].team : defaultTeam;
  for (let i = 1; i < items.length; i++) {
    const t = items[i].team != null ? items[i].team : defaultTeam;
    if (t !== team0) teamSame = false;
  }
  if (teamSame) teamSelect.value = String(team0);
  else {
    const mixed = document.createElement('option');
    mixed.value = '';
    mixed.textContent = 'mixed';
    teamSelect.insertBefore(mixed, teamSelect.firstChild);
    teamSelect.value = '';
  }
  teamSelect.addEventListener('change', () => {
    if (teamSelect.value === '') return;
    const next = Number(teamSelect.value) || 0;
    for (let i = 0; i < items.length; i++) items[i].team = next;
    api.touch();
    api.paint();
  });
  teamWrap.appendChild(teamSelect);
  panel.appendChild(teamWrap);

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'is-delete-record';
  delBtn.textContent = items.length > 1 ? 'Del all' : 'Del';
  delBtn.title = items.length > 1 ? 'Delete selected instances' : 'Delete placed instance';
  delBtn.addEventListener('click', () => {
    const drop = {};
    for (let i = 0; i < items.length; i++) drop[items[i].id] = true;
    doc.placedObjects = (doc.placedObjects || []).filter((p) => p && !drop[p.id]);
    clearPlacedSelection(api);
    api.touch();
    api.paint();
    renderPlacedTray(trayEl, api);
  });
  panel.appendChild(delBtn);

  fitPreviewArt(panel);
  syncTrailVisibility(trayEl);
}

function railButton(label, on, onClick, hint) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.title = hint || label;
  if (hint) button.setAttribute('aria-label', hint);
  if (on) button.className = 'is-on';
  button.setAttribute('aria-pressed', on ? 'true' : 'false');
  button.addEventListener('click', onClick);
  return button;
}

/** Select a sheet row; returns false when id is already selected (skip remount flash). */
function selectSheetIfNew(api, key, id) {
  if (api.getSheetId(key) === id) return false;
  api.setSheetId(key, id);
  return true;
}

function renderPanelIfSheetChanged(api, key, id) {
  if (!selectSheetIfNew(api, key, id)) return;
  renderPanel(api.panelRoot(), api);
}

function renderRail(api, doc, tab) {
  const rail = document.createElement('div');
  rail.className = 'editor-rail';
  if (tab === 'area') {
    for (let i = 0; i < doc.areas.length; i++) {
      const id = doc.areas[i].id;
      rail.appendChild(
        railButton(id, api.getSelectedAreaId() === id, () => {
          if (api.getSelectedAreaId() === id) return;
          clearPlacedSelection(api);
          api.selectArea(id);
          api.paint();
          api.refreshPanel();
        })
      );
    }
    return rail;
  }
  if (tab === 'spawn') {
    const seats = doc.playerSpawns || [];
    rail.appendChild(
      railButton('Host', api.getSpawnKey() === 'host', () => {
        if (api.getSpawnKey() === 'host') return;
        api.selectSpawnKey('host');
        api.paint();
        renderPanel(api.panelRoot(), api);
      })
    );
    let playerCount = 0;
    for (let i = 0; i < seats.length; i++) {
      if (seats[i].role !== 'player') continue;
      const key = 'player:' + playerCount;
      const team = seats[i].team | 0;
      playerCount += 1;
      rail.appendChild(
        railButton('Player ' + team, api.getSpawnKey() === key, () => {
          if (api.getSpawnKey() === key) return;
          api.selectSpawnKey(key);
          api.paint();
          renderPanel(api.panelRoot(), api);
        })
      );
    }
    const teamCount = doc.teams && doc.teams.length ? doc.teams.length : 1;
    if (playerCount < teamCount) {
      rail.appendChild(
        railButton('+', false, () => {
          const used = {};
          for (let i = 0; i < seats.length; i++) {
            if (seats[i].role === 'player') used[seats[i].team | 0] = true;
          }
          let team = 0;
          const teams = doc.teams || [];
          for (let i = 0; i < teams.length; i++) {
            const id = teams[i].id | 0;
            if (id >= 1 && !used[id]) {
              team = id;
              break;
            }
          }
          if (!team) return;
          const unitIds = Object.keys(doc.units || {});
          doc.playerSpawns.push({
            role: 'player',
            unitId: doc.units && doc.units.Player ? 'Player' : unitIds[0] || '',
            team: team,
            areaId: doc.areas[0] ? doc.areas[0].id : '',
          });
          api.selectSpawnKey('player:' + playerCount);
          api.touch();
          api.paint();
          renderPanel(api.panelRoot(), api);
        }, 'Add player')
      );
    }
    for (let i = 0; i < doc.spawns.length; i++) {
      const waveNum = i + 1;
      if (doc.spawns[i]) doc.spawns[i].wave = waveNum;
      const key = 'wave:' + i;
      rail.appendChild(
        railButton('wave ' + waveNum, api.getSpawnKey() === key, () => {
          if (api.getSpawnKey() === key) return;
          if (doc.spawns[i]) doc.spawns[i].wave = waveNum;
          api.selectSpawnKey(key);
          api.paint();
          renderPanel(api.panelRoot(), api);
        })
      );
    }
    rail.appendChild(
      railButton('+', false, () => {
        const area = api.getSelectedArea();
        const unitIds = Object.keys(doc.units || {});
        const waveNum = doc.spawns.length + 1;
        doc.spawns.push({
          wave: waveNum,
          timeStart: 0,
          team: 2,
          areaId: area ? area.id : doc.areas[0] ? doc.areas[0].id : '',
          units: unitIds[0] ? [unitIds[0] + ':1'] : [],
        });
        api.selectSpawnKey('wave:' + (doc.spawns.length - 1));
        api.touch();
        api.paint();
        renderPanel(api.panelRoot(), api);
      }, 'Add wave')
    );
    return rail;
  }
  if (tab === 'rules') {
    const key = api.getRulesKey();
    rail.appendChild(
      railButton('Rule', key === 'rule', () => {
        if (api.getRulesKey() === 'rule') return;
        api.selectRulesKey('rule');
        renderPanel(api.panelRoot(), api);
      })
    );
    rail.appendChild(
      railButton('Player', key === 'player', () => {
        if (api.getRulesKey() === 'player') return;
        api.selectRulesKey('player');
        renderPanel(api.panelRoot(), api);
      })
    );
    rail.appendChild(
      railButton('ArmorType', key === 'armorType', () => {
        if (api.getRulesKey() === 'armorType') return;
        api.selectRulesKey('armorType');
        renderPanel(api.panelRoot(), api);
      })
    );
    return rail;
  }
  if (tab === 'weapon') {
    appendGearRail(rail, api, doc);
    return rail;
  }
  if (tab === 'skill') {
    appendSkillRail(rail, api, doc);
    return rail;
  }
  const kind = itemKindOf(tab);
  const sheet = sheetOf(doc, tab);
  if (kind) {
    appendKindRail(rail, api, sheet, kind);
    return rail;
  }
  const ids = Object.keys(sheet.map);
  const current = api.getSheetId(sheet.key) || ids[0] || '';
  if (current && ids.indexOf(current) < 0 && ids[0]) api.setSheetId(sheet.key, ids[0]);
  const selected = ids.indexOf(api.getSheetId(sheet.key)) >= 0 ? api.getSheetId(sheet.key) : ids[0];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    rail.appendChild(
      railButton(formatCatalogId(id), selected === id, () => {
        renderPanelIfSheetChanged(api, sheet.key, id);
      }, formatCatalogId(id))
    );
  }
  rail.appendChild(
    railButton('+', false, () => {
      const rows = mapRecords(sheet.map);
      const id = nextId(sheet.map, sheet.prefix);
      const row = sheet.key === 'unitId' ? blankRecord(unionShape(rows)) : blankFor(sheet.key);
      row.id = id;
      sheet.map[id] = row;
      api.setSheetId(sheet.key, id);
      api.touch();
      renderPanel(api.panelRoot(), api);
    })
  );
  return rail;
}

function itemKindOf(tab) {
  if (typeof tab === 'string' && tab.indexOf('item:') === 0) return tab.slice(5);
  return '';
}

function idsOfKind(map, kind) {
  const ids = Object.keys(map || {});
  const out = [];
  for (let i = 0; i < ids.length; i++) {
    const group = itemRailGroup(map[ids[i]]);
    if (kind === 'Block') {
      if (isBlockTabKind(group)) out.push(ids[i]);
    } else if (kind === 'Armor') {
      if (isArmorTabKind(group)) out.push(ids[i]);
    } else if (kind === 'Resource') {
      if (group === 'Resource' || group === 'Ammo') out.push(ids[i]);
    } else if (group === kind) out.push(ids[i]);
  }
  return out;
}

const BLOCK_RAIL_SECTIONS = ['Block', 'Door', 'Generator', 'Factory', 'Base'];

function railHeading(text) {
  const node = document.createElement('p');
  node.className = 'editor-rail-label';
  node.textContent = text;
  return node;
}

function blockDisplayType(record) {
  const group = itemRailGroup(record);
  if (group === 'Wire' || group === 'Heal') return 'Block';
  return group;
}

function appendBlockRail(rail, api, sheet) {
  const ids = Object.keys(sheet.map || {});
  const buckets = {};
  for (let s = 0; s < BLOCK_RAIL_SECTIONS.length; s++) buckets[BLOCK_RAIL_SECTIONS[s]] = [];
  for (let i = 0; i < ids.length; i++) {
    const typeName = blockDisplayType(sheet.map[ids[i]]);
    if (!buckets[typeName]) continue;
    buckets[typeName].push(ids[i]);
  }
  const flat = [];
  for (let s = 0; s < BLOCK_RAIL_SECTIONS.length; s++) {
    const list = buckets[BLOCK_RAIL_SECTIONS[s]];
    for (let i = 0; i < list.length; i++) flat.push(list[i]);
  }
  let selected = api.getSheetId(sheet.key);
  if (flat.indexOf(selected) < 0) {
    selected = flat[0] || '';
    api.setSheetId(sheet.key, selected);
  }
  for (let s = 0; s < BLOCK_RAIL_SECTIONS.length; s++) {
    const typeName = BLOCK_RAIL_SECTIONS[s];
    rail.appendChild(railHeading(typeName));
    const list = buckets[typeName];
    for (let i = 0; i < list.length; i++) {
      const id = list[i];
      const label = formatCatalogId(id);
      rail.appendChild(
        railButton(label, selected === id, () => {
          renderPanelIfSheetChanged(api, sheet.key, id);
        }, label + ' · ' + typeName)
      );
    }
  }
  rail.appendChild(
    railButton('+', false, () => {
      const id = nextId(sheet.map, 'Item');
      const row = blankFor(sheet.key, 'Block');
      row.id = id;
      sheet.map[id] = row;
      api.setSheetId(sheet.key, id);
      api.touch();
      renderPanel(api.panelRoot(), api);
    }, 'Add block')
  );
}

function appendSkillRail(rail, api, doc) {
  const skills = doc.skills || {};
  const ids = Object.keys(skills).filter((id) => {
    const upper = String(id || '').toUpperCase();
    // Skills tab: no Tile / Backpack entries or labels.
    if (upper === 'TILE' || upper.indexOf('BACKPACK') >= 0) return false;
    const rec = skills[id];
    const type = rec && rec.effect && rec.effect.type ? String(rec.effect.type).toUpperCase() : '';
    if (type === 'TILE' || type.indexOf('BACKPACK') >= 0) return false;
    return true;
  });
  const known = skillEffectNames();
  const buckets = {};
  const order = [];
  for (let i = 0; i < ids.length; i++) {
    const effect = skills[ids[i]] && skills[ids[i]].effect;
    let typeName = (effect && effect.type) || 'Skill';
    const typeUpper = String(typeName).toUpperCase();
    if (typeUpper === 'TILE' || typeUpper.indexOf('BACKPACK') >= 0) typeName = 'Skill';
    if (!buckets[typeName]) {
      buckets[typeName] = [];
      order.push(typeName);
    }
    buckets[typeName].push(ids[i]);
  }
  order.sort((a, b) => {
    const ai = known.indexOf(a);
    const bi = known.indexOf(b);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a < b ? -1 : a > b ? 1 : 0;
  });
  let pick = api.getSheetId('skillId');
  const flat = [];
  for (let s = 0; s < order.length; s++) {
    const list = buckets[order[s]];
    for (let i = 0; i < list.length; i++) flat.push(list[i]);
  }
  if (flat.indexOf(pick) < 0) {
    pick = flat[0] || '';
    api.setSheetId('skillId', pick);
  }
  for (let i = 0; i < flat.length; i++) {
    const id = flat[i];
    const label = formatCatalogId(id);
    rail.appendChild(
      railButton(label, pick === id, () => {
        renderPanelIfSheetChanged(api, 'skillId', id);
      }, label)
    );
  }
  rail.appendChild(
    railButton('+', false, () => {
      const id = nextId(skills, 'Skill');
      const row = blankFor('skillId', 'MELEE_SWING');
      row.id = id;
      skills[id] = row;
      api.setSheetId('skillId', id);
      api.touch();
      renderPanel(api.panelRoot(), api);
    }, 'Add skill')
  );
}

function renderSkillSheet(body, api, doc) {
  renderSheet(body, api, doc, doc.skills, 'skillId', 'Skill');
}

function appendKindRail(rail, api, sheet, kind) {
  if (kind === 'Block') {
    appendBlockRail(rail, api, sheet);
    return;
  }
  const ids = idsOfKind(sheet.map, kind);
  let selected = api.getSheetId(sheet.key);
  if (ids.indexOf(selected) < 0) {
    selected = ids[0] || '';
    api.setSheetId(sheet.key, selected);
  }
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    rail.appendChild(
      railButton(formatCatalogId(id), selected === id, () => {
        renderPanelIfSheetChanged(api, sheet.key, id);
      }, formatCatalogId(id))
    );
  }
  rail.appendChild(
    railButton('+', false, () => {
      const id = nextId(sheet.map, kind === 'Ammo' ? 'Ammo' : 'Item');
      const row = blankFor(sheet.key, kind);
      row.id = id;
      sheet.map[id] = row;
      api.setSheetId(sheet.key, id);
      api.touch();
      renderPanel(api.panelRoot(), api);
    })
  );
}

function itemRailGroup(record) {
  if (!record) return 'Block';
  if (record.pending) return record.pendingCategory || 'Block';
  return itemCategory(record);
}

function sheetOf(doc, tab) {
  if (tab === 'weapon') return { map: doc.weapons, key: 'weaponId', prefix: 'Weapon' };
  if (itemKindOf(tab)) return { map: doc.items, key: 'itemId', prefix: 'Item' };
  if (tab === 'skill') return { map: doc.skills, key: 'skillId', prefix: 'Skill' };
  return { map: doc.units, key: 'unitId', prefix: 'Unit' };
}

function nextId(map, prefix) {
  let n = Object.keys(map).length + 1;
  let id = formatCatalogId(prefix + '_' + n);
  while (map[id]) {
    n += 1;
    id = formatCatalogId(prefix + '_' + n);
  }
  return id;
}

function gearLists(doc) {
  return {
    guns: Object.keys(doc.weapons || {}),
    tools: idsOfKind(doc.items || {}, 'Tool'),
  };
}

function syncGear(api, doc) {
  const lists = gearLists(doc);
  let pick = api.getSheetId('gearPick');
  let id = pick === 'tool' ? api.getSheetId('meleeId') : api.getSheetId('weaponId');
  const list = pick === 'tool' ? lists.tools : lists.guns;
  if ((pick !== 'gun' && pick !== 'tool') || list.indexOf(id) < 0) {
    const weaponId = api.getSheetId('weaponId');
    if (lists.guns.indexOf(weaponId) >= 0) {
      pick = 'gun';
      id = weaponId;
    } else if (lists.guns.length) {
      pick = 'gun';
      id = lists.guns[0];
    } else if (lists.tools.length) {
      pick = 'tool';
      id = lists.tools[0];
    } else {
      pick = 'gun';
      id = '';
    }
  }
  api.setSheetId('gearPick', pick);
  if (pick === 'tool') api.setSheetId('meleeId', id);
  else if (id) api.setSheetId('weaponId', id);
  return { pick: pick, id: id, guns: lists.guns, tools: lists.tools };
}

function appendGearRail(rail, api, doc) {
  const gear = syncGear(api, doc);
  for (let i = 0; i < gear.guns.length; i++) {
    const id = gear.guns[i];
    rail.appendChild(
      railButton(formatCatalogId(id), gear.pick === 'gun' && gear.id === id, () => {
        if (gear.pick === 'gun' && gear.id === id) return;
        api.setSheetId('gearPick', 'gun');
        api.setSheetId('weaponId', id);
        renderPanel(api.panelRoot(), api);
      }, formatCatalogId(id))
    );
  }
  for (let i = 0; i < gear.tools.length; i++) {
    const id = gear.tools[i];
    rail.appendChild(
      railButton(formatCatalogId(id), gear.pick === 'tool' && gear.id === id, () => {
        if (gear.pick === 'tool' && gear.id === id) return;
        api.setSheetId('gearPick', 'tool');
        api.setSheetId('meleeId', id);
        renderPanel(api.panelRoot(), api);
      }, formatCatalogId(id))
    );
  }
  rail.appendChild(
    railButton('+', false, () => {
      const id = nextId(doc.weapons, 'Weapon');
      const row = blankFor('weaponId', 'Normal');
      row.id = id;
      doc.weapons[id] = row;
      api.setSheetId('gearPick', 'gun');
      api.setSheetId('weaponId', id);
      api.touch();
      renderPanel(api.panelRoot(), api);
    }, 'Add piece')
  );
}

function renderGear(body, api, doc) {
  const gear = syncGear(api, doc);
  if (!gear.id) {
    const note = document.createElement('p');
    note.className = 'editor-note';
    note.textContent = 'Add an id from the side tabs. It uses the same template as the others.';
    body.appendChild(note);
    return;
  }
  if (gear.pick === 'tool') {
    api.setSheetId('itemId', gear.id);
    renderSheet(body, api, doc, doc.items, 'itemId');
    return;
  }
  api.setSheetId('weaponId', gear.id);
  renderSheet(body, api, doc, doc.weapons, 'weaponId');
}

function renderArea(body, api, doc) {
  const area = api.getSelectedArea();
  if (!area) {
    const note = document.createElement('p');
    note.className = 'editor-note';
    note.textContent = 'Drag a rectangle on the map. Each area becomes a side tab.';
    body.appendChild(note);
    return;
  }
  body.appendChild(
    field(
      'Action',
      selectOf(choiceList(['MoveTo'], area.action || ''), area.action || '', (value) => {
        area.action = value;
        if (!area.action) delete area.action;
        api.touch();
      })
    )
  );
  const column = document.createElement('div');
  column.className = 'editor-stack';
  column.appendChild(
    field(
      'Condition',
      selectOf(choiceList(['EnterArea'], area.condition || ''), area.condition || '', (value) => {
        area.condition = value;
        if (!area.condition) delete area.condition;
        if (area.condition !== 'EnterArea') {
          delete area.team;
          delete area.teams;
        }
        api.touch();
        renderPanel(api.panelRoot(), api);
      })
    )
  );
  if (area.condition === 'EnterArea') renderAreaTeams(column, api, area);
  body.appendChild(column);
  const names = [];
  for (let i = 0; i < doc.areas.length; i++) {
    if (doc.areas[i].id !== area.id) names.push(doc.areas[i].id);
  }
  body.appendChild(
    field(
      'Target area',
      selectOf(choiceList(names, area.target || ''), area.target || '', (value) => {
        area.target = value;
        if (!area.target) delete area.target;
        api.touch();
      })
    )
  );
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.textContent = 'Delete area';
  remove.addEventListener('click', () => {
    doc.areas = doc.areas.filter((row) => row.id !== area.id);
    api.selectArea('');
    api.touch();
    api.paint();
    renderPanel(api.panelRoot(), api);
  });
  body.appendChild(remove);
}

function rulesTeamIds(doc) {
  const ids = teamIdsFromDoc(doc, GAME_PACK && GAME_PACK.teams);
  return ids.length ? ids : [];
}

function ensureAreaTeams(area, doc) {
  const allowed = rulesTeamIds(doc);
  const allow = Object.create(null);
  for (let i = 0; i < allowed.length; i++) allow[allowed[i]] = true;
  if (!Array.isArray(area.teams)) {
    const first = area.team == null || area.team === '' ? allowed[0] : area.team | 0;
    area.teams = [allow[first] ? first : allowed[0]];
  }
  const next = [];
  for (let i = 0; i < area.teams.length; i++) {
    const id = area.teams[i] | 0;
    if (allow[id]) next.push(id);
  }
  area.teams = next.length ? next : [allowed[0]];
  area.team = area.teams[0];
  return area.teams;
}

function renderAreaTeams(column, api, area) {
  const doc = api.getDoc ? api.getDoc() : null;
  const teams = ensureAreaTeams(area, doc);
  const allowed = rulesTeamIds(doc);
  const options = [];
  for (let i = 0; i < allowed.length; i++) {
    options.push({ value: String(allowed[i]), label: String(allowed[i]) });
  }
  for (let i = 0; i < teams.length; i++) {
    const line = document.createElement('div');
    line.className = 'editor-line';
    line.appendChild(
      field(
        i === 0 ? 'Team' : '',
        selectOf(options, teams[i], (value) => {
          teams[i] = value | 0;
          area.team = teams.length ? teams[0] | 0 : undefined;
          if (!teams.length) delete area.team;
          api.touch();
        }),
        'is-grow'
      )
    );
    line.appendChild(
      xButton('Remove team', () => {
        teams.splice(i, 1);
        if (teams.length) area.team = teams[0] | 0;
        else delete area.team;
        api.touch();
        renderPanel(api.panelRoot(), api);
      })
    );
    column.appendChild(line);
  }
  const add = document.createElement('button');
  add.type = 'button';
  add.textContent = 'Add';
  add.setAttribute('aria-label', 'Add team');
  add.addEventListener('click', () => {
    const used = {};
    for (let i = 0; i < teams.length; i++) used[teams[i] | 0] = true;
    let next = allowed[0];
    for (let n = 0; n < allowed.length; n++) {
      if (!used[allowed[n]]) {
        next = allowed[n];
        break;
      }
    }
    teams.push(next);
    area.team = teams[0] | 0;
    api.touch();
    renderPanel(api.panelRoot(), api);
  });
  column.appendChild(add);
}

function seatTeamOptions(doc, row) {
  const options = [];
  const used = {};
  const seats = doc.playerSpawns || [];
  const host = row && row.role === 'host';
  for (let i = 0; i < seats.length; i++) {
    if (host || seats[i] === row || seats[i].role === 'host') continue;
    used[seats[i].team | 0] = true;
  }
  const teams = doc.teams || [];
  for (let i = 0; i < teams.length; i++) {
    const id = teams[i].id | 0;
    if (id < 1 || used[id]) continue;
    options.push({ value: String(id), label: String(id) });
  }
  const current = row.team | 0;
  if (current && !used[current] && !options.some((option) => option.value === String(current))) {
    options.unshift({ value: String(current), label: String(current) });
  }
  if (!options.length) options.push({ value: String(current || 1), label: String(current || 1) });
  return options;
}

function appendAreaField(line, api, doc, row) {
  if (doc.areas && doc.areas.length) {
    line.appendChild(
      field(
        'Area',
        selectOf(idList(doc.areas.map((area) => area.id), row.areaId || ''), row.areaId || '', (value) => {
          row.areaId = value;
          api.touch();
          api.paint();
        }),
        'is-grow'
      )
    );
    return;
  }
  const center = document.createElement('span');
  center.textContent = 'Path center';
  line.appendChild(field('Area', center));
}

/** Area always on its own settings row (not packed with Unit/Team). */
function appendAreaRow(body, api, doc, row) {
  const line = document.createElement('div');
  line.className = 'editor-line';
  appendAreaField(line, api, doc, row);
  body.appendChild(line);
}

function settingsUnitPicker(api, unitIds, currentId, onPick) {
  return buildCatalogListPicker({
    ids: unitIds,
    value: currentId || '',
    allowEmpty: false,
    formatId: formatCatalogId,
    onHoverId: (id) => {
      renderCatalogTrailPreview(document.getElementById('editor-placed-tray'), api, 'unit', id, 'settings');
    },
    onHoverEnd: () => releaseTrailClaim('settings', api),
    onChange: (id) => {
      releaseTrailClaim('settings', api);
      if (onPick) onPick(id);
    },
  });
}

function renderSeat(body, api, doc, row, canDelete) {
  body.appendChild(
    field(
      'Player teams',
      selectOf(
        [
          { value: 'friendly', label: 'Friendly' },
          { value: 'friendlyFire', label: 'Friendly Fire' },
        ],
        doc.playerFriendlyFire ? 'friendlyFire' : 'friendly',
        (value) => {
          doc.playerFriendlyFire = value === 'friendlyFire';
          api.touch();
        }
      )
    )
  );
  const line = document.createElement('div');
  line.className = 'editor-line';
  const unitIds = Object.keys(doc.units || {});
  const seatUnitPicker = settingsUnitPicker(api, unitIds, row.unitId || '', (value) => {
    row.unitId = value;
    api.touch();
  });
  line.appendChild(field('Unit', seatUnitPicker, 'is-grow'));
  line.appendChild(
    field('Team', selectOf(seatTeamOptions(doc, row), row.team, (value) => {
      row.team = value | 0;
      api.touch();
      api.paint();
      renderPanel(api.panelRoot(), api);
    }), 'is-short')
  );
  body.appendChild(line);
  appendAreaRow(body, api, doc, row);
  if (!canDelete) return;
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.textContent = 'Delete row';
  remove.addEventListener('click', () => {
    doc.playerSpawns = (doc.playerSpawns || []).filter((seat) => seat !== row);
    api.selectSpawnKey('host');
    api.touch();
    api.paint();
    renderPanel(api.panelRoot(), api);
  });
  body.appendChild(remove);
}

function renderSpawns(body, api, doc) {
  const key = api.getSpawnKey();
  const row = spawnRow(doc, key);
  if (!row) {
    const note = document.createElement('p');
    note.className = 'editor-note';
    note.textContent = 'Choose Host, a player, or a wave from the side tabs.';
    body.appendChild(note);
    return;
  }
  if (key === 'host' || key.indexOf('player:') === 0) {
    renderSeat(body, api, doc, row, key !== 'host');
    return;
  }

  const waveIndex = key.indexOf('wave:') === 0 ? (key.slice(5) | 0) : -1;
  const waveNum = waveIndex >= 0 ? waveIndex + 1 : Math.max(1, row.wave | 0);
  row.wave = waveNum;

  const line = document.createElement('div');
  line.className = 'editor-line is-compact-row';
  const waveInput = numberOf(waveNum, 1, () => {});
  waveInput.disabled = true;
  waveInput.title = 'Locked to rail tab wave ' + waveNum;
  line.appendChild(field('Wave', waveInput, 'is-short'));
  line.appendChild(
    field('Time', numberOf(row.timeStart, 0, (value) => {
      row.timeStart = Math.max(0, Number(value) || 0);
      api.touch();
    }), 'is-short')
  );
  const teamIds = rulesTeamIds(doc);
  const teams = [];
  for (let i = 0; i < teamIds.length; i++) {
    teams.push({ value: String(teamIds[i]), label: String(teamIds[i]) });
  }
  line.appendChild(
    field('Team', selectOf(teams, row.team, (value) => {
      row.team = value | 0;
      api.touch();
    }), 'is-short')
  );
  body.appendChild(line);
  appendAreaRow(body, api, doc, row);

  const unitIds = Object.keys(doc.units || {});
  const specs = Array.isArray(row.units) ? row.units : [];
  if (specs.length) {
    const head = document.createElement('div');
    head.className = 'editor-line is-head is-compact-head';
    head.appendChild(columnMark('Unit', 'is-grow'));
    head.appendChild(columnMark('Count', 'is-short'));
    head.appendChild(columnMark('', 'is-remove'));
    body.appendChild(head);
  }
  for (let i = 0; i < specs.length; i++) {
    const spec = parseUnitSpec(specs[i]);
    const unitLine = document.createElement('div');
    unitLine.className = 'editor-line is-compact-row';
    const unitPicker = settingsUnitPicker(api, unitIds, spec.id, (value) => {
      row.units[i] = value + ':' + spec.count;
      api.touch();
      renderPanel(api.panelRoot(), api);
    });
    // Empty visible label — head row already names columns; help still uses Unit/Count.
    const unitField = field('', unitPicker, 'is-grow');
    unitField.title = getFieldHelp('Unit');
    bindFieldHelpHover(unitField, () => getFieldHelp('Unit'));
    unitLine.appendChild(unitField);
    const countField = field('', numberOf(spec.count, 1, (value) => {
      row.units[i] = spec.id + ':' + Math.max(1, value | 0);
      api.touch();
      renderPanel(api.panelRoot(), api);
    }), 'is-short');
    countField.title = getFieldHelp('Count');
    bindFieldHelpHover(countField, () => getFieldHelp('Count'));
    unitLine.appendChild(countField);
    const dropUnit = document.createElement('button');
    dropUnit.type = 'button';
    dropUnit.className = 'is-remove';
    dropUnit.textContent = 'Remove';
    dropUnit.title = 'Remove this unit row';
    dropUnit.addEventListener('click', () => {
      row.units.splice(i, 1);
      api.touch();
      renderPanel(api.panelRoot(), api);
    });
    unitLine.appendChild(dropUnit);
    body.appendChild(unitLine);
  }
  const addUnit = document.createElement('button');
  addUnit.type = 'button';
  addUnit.textContent = 'Add unit';
  addUnit.addEventListener('click', () => {
    if (!unitIds[0]) return;
    if (!Array.isArray(row.units)) row.units = [];
    row.units.push(unitIds[0] + ':1');
    api.touch();
    renderPanel(api.panelRoot(), api);
  });
  body.appendChild(addUnit);
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.textContent = 'Delete row';
  remove.addEventListener('click', () => {
    const index = key.slice(5) | 0;
    doc.spawns.splice(index, 1);
    api.selectSpawnKey('');
    api.touch();
    api.paint();
    renderPanel(api.panelRoot(), api);
  });
  body.appendChild(remove);
}

function renderSheet(body, api, doc, map, selectedKey) {
  const rows = mapRecords(map);
  const current = api.getSheetId(selectedKey) || (rows[0] && rows[0].id) || '';
  if (current) api.setSheetId(selectedKey, current);
  const record = rows.find((row) => row.id === (api.getSheetId(selectedKey) || current));
  if (!record) {
    const note = document.createElement('p');
    note.className = 'editor-note';
    note.textContent = 'Add an id from the side tabs. It uses the same template as the others.';
    body.appendChild(note);
    return;
  }
  body.appendChild(previewFor(api, selectedKey, record));
  const shape = unionShape(rows);
  const ctx = {
    canWear: (itemId) => {
      const item = doc.items && doc.items[itemId];
      return !!(item && (item.kind === 'ARMOR' || item.kind === 'SHIELD'));
    },
    stackCap: (itemId) => {
      const item = doc.items && doc.items[itemId];
      return item && item.kind === 'WEAPON' ? 1 : 0;
    },
    unitLayout: selectedKey === 'unitId',
    weaponLoadout: (itemId) => {
      if (!itemId) return false;
      const item = doc.items && doc.items[itemId];
      if (item && item.kind === 'WEAPON') return true;
      return !!(doc.weapons && doc.weapons[itemId] && (!item || item.kind === 'WEAPON'));
    },
    armorTypes: armorTypeNames(doc),
    choices: (key, current) => choiceIds(doc, key, current),
    rename: (next) => {
      const normalized = formatCatalogId(next);
      if (!normalized || normalized === record.id || map[normalized]) return;
      const prev = record.id;
      map[normalized] = record;
      record.id = normalized;
      delete map[prev];
      retarget(doc, selectedKey, prev, normalized);
      api.setSheetId(selectedKey, normalized);
      if (selectedKey === 'itemId' && api.getSheetId('gearPick') === 'tool') {
        api.setSheetId('meleeId', normalized);
      }
      api.touch();
      renderPanel(api.panelRoot(), api);
    },
    afterApply: selectedKey === 'weaponId' ? (row) => {
      if (row.kind === 'TOOL') {
        const prev = row.id;
        delete doc.weapons[prev];
        let id = prev;
        if (doc.items[id]) {
          id = nextId(doc.items, 'Item');
          row.id = id;
        }
        doc.items[id] = row;
        api.setSheetId('gearPick', 'tool');
        api.setSheetId('meleeId', id);
        api.setSheetId('itemId', id);
      }
      api.touch();
      renderPanel(api.panelRoot(), api);
    } : null,
    confirm: (message) => (api.confirm ? api.confirm(message) : Promise.resolve(false)),
    touch: (structural) => {
      api.touch();
      api.paint();
      if (structural) renderPanel(api.panelRoot(), api);
    },
    remove: () => {
      delete map[record.id];
      api.setSheetId(selectedKey, '');
      api.touch();
      renderPanel(api.panelRoot(), api);
    },
    trailPreview: (kind, templateId) => {
      if (!templateId) return;
      renderCatalogTrailPreview(
        document.getElementById('editor-placed-tray'),
        api,
        kind,
        templateId,
        'settings'
      );
    },
    trailRelease: () => releaseTrailClaim('settings', api),
    getDoc: () => doc,
  };
  if (selectedKey !== 'unitId') {
    renderTyped(body, selectedKey, record, ctx);
    if (showsCraft(selectedKey, record)) renderCraft(body, api, doc, record);
    if (showsDrops(selectedKey, record)) renderDropRows(body, api, doc, record, selectedKey);
    return;
  }
  renderRecord(body, record, shape, ctx);
  if (showsDrops(selectedKey, record)) renderDropRows(body, api, doc, record, selectedKey);
}

function showsCraft(selectedKey, record) {
  if (!record) return false;
  if (selectedKey === 'weaponId') return true;
  if (selectedKey !== 'itemId') return false;
  const category = record.pending ? record.pendingCategory || 'Block' : itemCategory(record);
  if (isBlockTabKind(category) || isArmorTabKind(category)) return true;
  return category === 'Turret' || category === 'Ammo' || category === 'Tool';
}

function readEditorCraft(record) {
  const craft = record && record.editorCraft;
  if (!craft || typeof craft !== 'object' || Array.isArray(craft)) return { on: false, rows: [] };
  return { on: craft.on === true, rows: Array.isArray(craft.rows) ? craft.rows : [] };
}

function editorCraftOf(record) {
  if (!record.editorCraft || typeof record.editorCraft !== 'object' || Array.isArray(record.editorCraft)) {
    record.editorCraft = { on: false, rows: [] };
  }
  if (!Array.isArray(record.editorCraft.rows)) record.editorCraft.rows = [];
  return record.editorCraft;
}

function showsDrops(selectedKey, record) {
  if (!record || record.pending) return false;
  if (selectedKey === 'unitId') return true;
  if (selectedKey !== 'itemId') return false;
  return isBlockTabKind(itemCategory(record));
}

function unitDropRows(record) {
  const rows = [];
  const list = Array.isArray(record.drops) ? record.drops : [];
  for (let i = 0; i < list.length; i++) {
    const row = list[i];
    if (!row || typeof row !== 'object') continue;
    rows.push({ id: row.id || '', count: Math.max(1, row.count | 0 || 1) });
  }
  return rows;
}

function writeUnitDrops(record, rows) {
  if (!rows.length) {
    delete record.drops;
    return;
  }
  record.drops = rows;
}

function blockDropRows(record) {
  const rows = [];
  if (record.dropItemId) {
    rows.push({
      id: record.dropItemId,
      count: Math.max(1, record.dropCount == null ? 1 : (record.dropCount | 0) || 1),
    });
  }
  const extra = Array.isArray(record.editorDrops) ? record.editorDrops : [];
  for (let i = 0; i < extra.length; i++) {
    const row = extra[i];
    if (!row || typeof row !== 'object') continue;
    rows.push({ id: row.id || '', count: Math.max(1, row.count | 0 || 1) });
  }
  return rows;
}

function writeBlockDrops(record, rows) {
  if (!rows.length) {
    delete record.dropItemId;
    delete record.dropCount;
    delete record.editorDrops;
    return;
  }
  record.dropItemId = rows[0].id;
  record.dropCount = Math.max(1, rows[0].count | 0 || 1);
  if (rows.length > 1) record.editorDrops = rows.slice(1);
  else delete record.editorDrops;
}

function renderDropRows(body, api, doc, record, selectedKey) {
  const ids = resourceItemIds(doc.items);
  const block = selectedKey !== 'unitId';
  const rows = block ? blockDropRows(record) : unitDropRows(record);
  appendDivider(body);
  appendSectionTitle(body, 'Drops');
  for (let i = 0; i < rows.length; i++) {
    const line = document.createElement('div');
    line.className = 'editor-line is-compact-row';
    const options = [];
    for (let n = 0; n < ids.length; n++) options.push({ value: ids[n], label: ids[n] });
    if (rows[i].id && ids.indexOf(rows[i].id) < 0) options.unshift({ value: rows[i].id, label: rows[i].id });
    if (!options.length) options.push({ value: '', label: '(none)' });
    const current = options.some((option) => option.value === rows[i].id) ? rows[i].id : options[0].value;
    const pick = selectOf(options, current, (value) => {
      const list = block ? blockDropRows(record) : unitDropRows(record);
      if (!list[i]) return;
      list[i].id = value;
      if (block) writeBlockDrops(record, list);
      else writeUnitDrops(record, list);
      api.touch();
    });
    pick.setAttribute('aria-label', 'Drop item');
    const count = numberOf(rows[i].count, 1, (value) => {
      const list = block ? blockDropRows(record) : unitDropRows(record);
      if (!list[i]) return;
      list[i].count = Math.max(1, value | 0);
      if (block) writeBlockDrops(record, list);
      else writeUnitDrops(record, list);
      api.touch();
    });
    count.setAttribute('aria-label', 'Drop count');
    line.appendChild(field('', pick, 'is-grow'));
    line.appendChild(field('', count, 'is-short'));
    line.appendChild(
      xButton('Remove drop', () => {
        const list = block ? blockDropRows(record) : unitDropRows(record);
        list.splice(i, 1);
        if (block) writeBlockDrops(record, list);
        else writeUnitDrops(record, list);
        api.touch();
        renderPanel(api.panelRoot(), api);
      })
    );
    body.appendChild(line);
  }
  const add = document.createElement('button');
  add.type = 'button';
  add.textContent = 'Add';
  add.setAttribute('aria-label', 'Add drop');
  add.addEventListener('click', () => {
    if (!ids.length) return;
    const list = block ? blockDropRows(record) : unitDropRows(record);
    list.push({ id: ids[0], count: 1 });
    if (block) writeBlockDrops(record, list);
    else writeUnitDrops(record, list);
    api.touch();
    renderPanel(api.panelRoot(), api);
  });
  body.appendChild(add);
}

function resourceItemIds(items) {
  const ids = [];
  const keys = Object.keys(items || {});
  for (let i = 0; i < keys.length; i++) {
    const row = items[keys[i]];
    if (!row || row.pending) continue;
    const group = itemCategory(row);
    if (group !== 'Resource' && group !== 'Ammo') continue;
    const id = typeof row.id === 'string' && row.id ? row.id : keys[i];
    if (!id || ids.indexOf(id) >= 0) continue;
    ids.push(id);
  }
  return ids;
}

function renderCraft(body, api, doc, record) {
  const craft = readEditorCraft(record);
  appendDivider(body);
  appendSectionTitle(body, 'Crafting');
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.checked = craft.on;
  toggle.addEventListener('change', () => {
    const state = editorCraftOf(record);
    state.on = toggle.checked;
    api.touch();
    renderPanel(api.panelRoot(), api);
  });
  body.appendChild(field('Craft', toggle));
  const box = document.createElement('div');
  box.className = craft.on ? 'editor-craft' : 'editor-craft is-off';
  const ids = resourceItemIds(doc.items);
  const rows = craft.rows;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || typeof row !== 'object') continue;
    const line = document.createElement('div');
    line.className = 'editor-line is-compact-row';
    const options = [];
    for (let n = 0; n < ids.length; n++) options.push({ value: ids[n], label: ids[n] });
    if (!options.length) options.push({ value: '', label: '(none)' });
    const current = ids.indexOf(row.id) >= 0 ? row.id : options[0].value;
    const pick = selectOf(options, current, (value) => {
      const state = editorCraftOf(record);
      if (!state.rows[i] || typeof state.rows[i] !== 'object') return;
      state.rows[i].id = value;
      api.touch();
    });
    pick.setAttribute('aria-label', 'Resource');
    const count = numberOf(Math.max(1, row.count | 0), 1, (value) => {
      const state = editorCraftOf(record);
      if (!state.rows[i] || typeof state.rows[i] !== 'object') return;
      state.rows[i].count = Math.max(1, value | 0);
      api.touch();
    });
    count.setAttribute('aria-label', 'Count');
    line.appendChild(field('', pick, 'is-grow'));
    line.appendChild(field('', count, 'is-short'));
    line.appendChild(
      xButton('Remove ingredient', () => {
        const state = editorCraftOf(record);
        state.rows.splice(i, 1);
        api.touch();
        renderPanel(api.panelRoot(), api);
      })
    );
    box.appendChild(line);
  }
  const add = document.createElement('button');
  add.type = 'button';
  add.textContent = 'Add';
  add.addEventListener('click', () => {
    if (!craft.on || !ids.length) return;
    const state = editorCraftOf(record);
    state.on = true;
    state.rows.push({ id: ids[0], count: 1 });
    api.touch();
    renderPanel(api.panelRoot(), api);
  });
  box.appendChild(add);
  if (!craft.on) {
    const locked = box.querySelectorAll('select, input, button');
    for (let i = 0; i < locked.length; i++) locked[i].disabled = true;
  }
  body.appendChild(box);
}

function nonPendingIds(map) {
  return Object.keys(map || {}).filter((id) => map[id] && !map[id].pending);
}

function ammoItemIds(items) {
  const ids = [];
  const keys = Object.keys(items || {});
  for (let i = 0; i < keys.length; i++) {
    const row = items[keys[i]];
    if (!row || row.pending) continue;
    if (itemCategory(row) !== 'Ammo') continue;
    const id = typeof row.id === 'string' && row.id ? row.id : keys[i];
    if (id && ids.indexOf(id) < 0) ids.push(id);
  }
  return ids;
}

function choiceIds(doc, key, current) {
  const units = mapRecords(doc.units);
  const weapons = mapRecords(doc.weapons).filter((r) => r && !r.pending);
  const items = mapRecords(doc.items).filter((r) => r && !r.pending);
  const skills = mapRecords(doc.skills).filter((r) => r && !r.pending);
  let ids = [];
  if (key === 'model') ids = UNIT_MODEL_IDS.slice();
  else if (key === 'ammoTypeId') ids = ammoItemIds(doc.items);
  else if (key === 'targetFaction') ids = FACTION_CHOICES.slice();
  else if (key === 'damageType') ids = damageTypeNames(doc);
  else if (key === 'reloadType') ids = RELOAD_CHOICES.slice();
  else if (key === 'armorType') ids = armorTypeNames(doc);
  else if (key === 'itemId') ids = nonPendingIds(doc.items);
  else if (key === 'defaultWeapon' || key === 'weaponId') ids = nonPendingIds(doc.weapons);
  else if (key === 'skills' || key === 'activeSkills') ids = nonPendingIds(doc.skills);
  else if (key === 'allowedGoals') ids = collectStrings(units, 'allowedGoals');
  else if (key === 'targetPriorityList') ids = collectStrings(units, 'targetPriorityList');
  else if (key === 'preferredRange') ids = collectStrings(units, 'preferredRange');
  else ids = collectStrings(units.concat(weapons, items, skills), key);
  if (current && ids.indexOf(current) < 0) ids = [current].concat(ids);
  return ids;
}

function retarget(doc, kind, prev, next) {
  if (kind === 'unitId') {
    for (let i = 0; i < doc.spawns.length; i++) {
      const units = doc.spawns[i].units || [];
      for (let n = 0; n < units.length; n++) {
        const spec = parseUnitSpec(units[n]);
        if (spec.id === prev) units[n] = next + ':' + spec.count;
      }
    }
    const seats = doc.playerSpawns || [];
    for (let i = 0; i < seats.length; i++) {
      if (seats[i].unitId === prev) seats[i].unitId = next;
    }
  }
  if (Array.isArray(doc.placedObjects)) {
    const targetKind = kind === 'unitId' ? 'unit' : kind === 'itemId' ? 'object' : '';
    if (targetKind) {
      for (let i = 0; i < doc.placedObjects.length; i++) {
        const inst = doc.placedObjects[i];
        if (inst && inst.kind === targetKind && inst.templateId === prev) {
          inst.templateId = next;
        }
      }
    }
  }
  const sheets = [doc.units, doc.weapons, doc.items];
  for (let s = 0; s < sheets.length; s++) {
    const rows = mapRecords(sheets[s]);
    for (let i = 0; i < rows.length; i++) rewriteRefs(rows[i], prev, next);
  }
}

function rewriteRefs(node, prev, next) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (node[i] === prev) node[i] = next;
      else rewriteRefs(node[i], prev, next);
    }
    return;
  }
  const keys = Object.keys(node);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === 'id' || keys[i] === 'label' || keys[i] === 'description' || keys[i] === 'color') continue;
    if (node[keys[i]] === prev) node[keys[i]] = next;
    else rewriteRefs(node[keys[i]], prev, next);
  }
}

function previewFor(api, key, record) {
  if (key === 'unitId') return unitPreview(api, record);
  if (key === 'weaponId') {
    if (record && record.pending && record.pendingCategory === 'Melee') return colorPreview(recordSwatch(record));
    return weaponPreview(api, record);
  }
  if (key === 'itemId') {
    const category = record && record.pending ? record.pendingCategory || 'Block' : itemCategory(record);
    if (category === 'Block' || category === 'Turret' || category === 'Base') return structurePreview(api, record);
  }
  return colorPreview(recordSwatch(record));
}

function previewFrame() {
  const wrap = document.createElement('div');
  wrap.className = 'editor-preview';
  const box = document.createElement('div');
  box.className = 'editor-preview-box';
  wrap.appendChild(box);
  return { wrap: wrap, box: box };
}

function colorPreview(color) {
  const frame = previewFrame();
  const swatch = document.createElement('div');
  swatch.className = 'editor-preview-swatch';
  swatch.style.background = cssColor(color);
  frame.box.appendChild(swatch);
  return frame.wrap;
}

function fitPreviewArt(root) {
  const svgs = root.querySelectorAll('.editor-preview-box svg');
  for (let i = 0; i < svgs.length; i++) {
    const svg = svgs[i];
    if (svg.getAttribute('data-snap') === 'kept') continue;
    const host = svg.querySelector('g');
    let box = null;
    if (host) {
      try {
        box = host.getBBox();
      } catch (err) {
        box = null;
      }
    }
    const pad = 4;
    if (box && box.width > 0 && box.height > 0) {
      svg.setAttribute(
        'viewBox',
        (box.x - pad) + ' ' + (box.y - pad) + ' ' + (box.width + pad * 2) + ' ' + (box.height + pad * 2)
      );
    } else {
      svg.setAttribute('viewBox', '-120 -120 360 360');
    }
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
}

function previewCaption(text) {
  const note = document.createElement('p');
  note.className = 'editor-preview-caption';
  note.textContent = text;
  return note;
}

function weaponPreview(api, record) {
  const frame = previewFrame();
  frame.box.classList.add('is-weapon-hold');
  const pack = api.getPack ? api.getPack() : null;
  const parsed = getParsedUnitArt(pack);
  // Live layers: bottom / arms / gun / body / top — not a merged pixel bake.
  const svg = mountModelPreview(parsed, 'Default_skin_1', weaponPreviewSpec(record));
  if (svg) {
    frame.box.appendChild(svg);
    requestAnimationFrame(() => fitPreviewArt(frame.wrap));
  }
  return frame.wrap;
}

function structurePreview(api, record) {
  const frame = previewFrame();
  frame.box.classList.add('is-structure');
  const pack = api.getPack ? api.getPack() : null;
  const doc = api.getDoc ? api.getDoc() : null;
  // Layer 1 SizeView footprint + Layer 2 gun; overflow expands viewBox (Unit-style).
  const svg = mountStructurePreviewSvg(pack, doc, record);
  if (svg) {
    frame.box.appendChild(svg);
  } else {
    const swatch = document.createElement('div');
    swatch.className = 'editor-preview-swatch';
    swatch.style.background = cssColor(recordSwatch(record));
    frame.box.appendChild(swatch);
  }
  return frame.wrap;
}

function wearLine(doc, list) {
  const armor = [];
  const shield = [];
  for (let i = 0; i < list.length; i++) {
    const row = list[i];
    if (!row || !row.itemId) continue;
    const item = doc && doc.items ? doc.items[row.itemId] : null;
    if (!item) continue;
    const state = row.active === true ? ' active' : ' inactive';
    if (item.kind === 'ARMOR') armor.push(row.itemId + state);
    if (item.kind === 'SHIELD') shield.push(row.itemId + state);
  }
  const armorText = armor.length ? 'Armor ' + armor.join(', ') : 'Armor inactive';
  const shieldText = shield.length ? 'Shield ' + shield.join(', ') : 'Shield inactive';
  return armorText + '. ' + shieldText + '.';
}

function unitCaption(doc, record) {
  const held = heldLoadout(record);
  const itemId = held.row && held.row.itemId ? held.row.itemId : '(none)';
  return 'Slot ' + (held.index + 1) + ': ' + itemId + ' · ' + wearLine(doc, held.list);
}

function unitPreview(api, record) {
  const frame = previewFrame();
  const pack = api.getPack ? api.getPack() : null;
  const doc = api.getDoc ? api.getDoc() : null;
  const pooled = ensureUnitPoolEntry(pack, doc, record, () => {
    if (api.refreshPanel) api.refreshPanel();
  });
  if (pooled) {
    const img = mountPoolPreview(pooled);
    if (img) frame.box.appendChild(img);
  }
  frame.wrap.appendChild(previewCaption(unitCaption(doc, record)));
  return frame.wrap;
}

function xButton(label, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'editor-btn-danger';
  button.textContent = '×';
  button.title = label;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', onClick);
  return button;
}

function nextTeamId(teams) {
  const used = {};
  let max = 0;
  for (let i = 0; i < teams.length; i++) {
    const id = teams[i].id | 0;
    if (id > 0) used[id] = true;
    if (id > max) max = id;
  }
  const next = max + 1;
  if (next >= 1 && next <= TEAM_ROW_CAP && !used[next]) return next;
  for (let id = 1; id <= TEAM_ROW_CAP; id++) {
    if (!used[id]) return id;
  }
  return 0;
}

function resizeTeams(teams, count) {
  const n = Math.max(1, Math.min(TEAM_ROW_CAP, count | 0));
  while (teams.length > n) teams.pop();
  while (teams.length < n) {
    const id = nextTeamId(teams);
    if (!id) break;
    teams.push({ id: id, name: 'Team ' + id, hostileTo: [], allyTo: [] });
  }
}

function renderRelationGroup(body, teams, api, key, otherKey, activeClass, title) {
  appendDivider(body);
  appendSectionTitle(body, title);
  if (teams.length < 2) {
    const note = document.createElement('p');
    note.className = 'editor-note';
    note.textContent = 'Need 2+ teams.';
    body.appendChild(note);
    return;
  }
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    if (!Array.isArray(team[key])) team[key] = [];
    if (!Array.isArray(team[otherKey])) team[otherKey] = [];
    const row = document.createElement('div');
    row.className = 'editor-relation-row';
    const owner = document.createElement('span');
    owner.className = 'editor-relation-owner';
    owner.textContent = 'Team ' + team.id;
    row.appendChild(owner);

    const chips = document.createElement('div');
    chips.className = 'editor-chip-group';
    for (let j = 0; j < teams.length; j++) {
      const other = teams[j];
      if (!other || other.id === team.id) continue;
      const on = team[key].indexOf(other.id) >= 0;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = on ? 'editor-chip ' + activeClass : 'editor-chip';
      chip.textContent = 'Team ' + other.id;
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      chip.addEventListener('click', () => {
        const idx = team[key].indexOf(other.id);
        if (idx >= 0) {
          team[key].splice(idx, 1);
        } else {
          team[key].push(other.id);
          const opp = team[otherKey].indexOf(other.id);
          if (opp >= 0) team[otherKey].splice(opp, 1);
        }
        api.touch();
        renderPanel(api.panelRoot(), api);
      });
      chips.appendChild(chip);
    }
    row.appendChild(chips);
    body.appendChild(row);
  }
}

function renderPlayerRules(body, api, doc) {
  if (!Array.isArray(doc.teams)) doc.teams = [];
  if (doc.teams.length < 1 || doc.teams.length > TEAM_ROW_CAP) {
    resizeTeams(doc.teams, doc.teams.length < 1 ? 1 : TEAM_ROW_CAP);
  }
  const countInput = document.createElement('input');
  countInput.type = 'number';
  countInput.min = '1';
  countInput.max = String(TEAM_ROW_CAP);
  countInput.value = String(doc.teams.length);
  countInput.addEventListener('change', () => {
    const next = Math.max(1, Math.min(TEAM_ROW_CAP, countInput.value | 0));
    countInput.value = String(next);
    resizeTeams(doc.teams, next);
    api.touch();
    renderPanel(api.panelRoot(), api);
  });
  body.appendChild(field('Teams', countInput, 'is-short'));

  const teams = doc.teams;
  const tags = document.createElement('div');
  tags.className = 'editor-team-tags';
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    if (!team.name) team.name = 'Team ' + team.id;
    const tag = document.createElement('span');
    tag.className = 'editor-team-tag';
    tag.textContent = 'Team ' + team.id;
    tags.appendChild(tag);
  }
  body.appendChild(tags);

  renderRelationGroup(body, teams, api, 'hostileTo', 'allyTo', 'is-hostile-on', 'Hostile');
  renderRelationGroup(body, teams, api, 'allyTo', 'hostileTo', 'is-ally-on', 'Ally');

  appendDivider(body);
  const natureNote = document.createElement('p');
  natureNote.className = 'editor-note';
  natureNote.textContent = 'Nature: Neutral map resources.';
  body.appendChild(natureNote);
}

function renderRules(body, api, doc) {
  if (api.getRulesKey() === 'player') {
    renderPlayerRules(body, api, doc);
    return;
  }
  if (api.getRulesKey() === 'armorType') {
    renderArmorTypeTable(body, api, doc);
    return;
  }
  const rules = doc.rules || (doc.rules = {});
  matchNumbers(body, api, rules);
}

function normalizeTypeId(raw) {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function nextMatrixTypeId(existing, prefix) {
  let n = existing.length + 1;
  let candidate = prefix + '_' + n;
  while (existing.indexOf(candidate) >= 0) {
    n += 1;
    candidate = prefix + '_' + n;
  }
  return candidate;
}

function addArmorType(doc, rawName) {
  const matrix = doc.damageMatrix && doc.damageMatrix.matrix;
  if (!matrix) return false;
  const existing = armorTypeNames(doc);
  const name = normalizeTypeId(rawName) || nextMatrixTypeId(existing, 'Armor');
  if (existing.indexOf(name) >= 0) return false;
  const rowKeys = damageTypeNames(doc);
  for (let i = 0; i < rowKeys.length; i++) {
    const r = rowKeys[i];
    if (!matrix[r] || typeof matrix[r] !== 'object') matrix[r] = {};
    matrix[r][name] = 1;
  }
  return true;
}

function renameArmorType(doc, prevCol, rawNext) {
  const matrix = doc.damageMatrix && doc.damageMatrix.matrix;
  if (!matrix) return false;
  const nextCol = normalizeTypeId(rawNext);
  const existing = armorTypeNames(doc);
  if (!nextCol || nextCol === prevCol || existing.indexOf(nextCol) >= 0) return false;
  const rowKeys = Object.keys(matrix);
  for (let i = 0; i < rowKeys.length; i++) {
    const row = matrix[rowKeys[i]];
    if (!row || typeof row !== 'object') continue;
    const rebuilt = {};
    const cols = Object.keys(row);
    for (let c = 0; c < cols.length; c++) {
      const k = cols[c];
      rebuilt[k === prevCol ? nextCol : k] = row[k];
    }
    if (!Object.prototype.hasOwnProperty.call(rebuilt, nextCol)) rebuilt[nextCol] = 1;
    matrix[rowKeys[i]] = rebuilt;
  }
  const sheets = [doc.units, doc.items];
  for (let s = 0; s < sheets.length; s++) {
    const rows = mapRecords(sheets[s]);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].armorType === prevCol) rows[i].armorType = nextCol;
      if (rows[i].resistPercent && typeof rows[i].resistPercent === 'object' && Object.prototype.hasOwnProperty.call(rows[i].resistPercent, prevCol)) {
        rows[i].resistPercent[nextCol] = rows[i].resistPercent[prevCol];
        delete rows[i].resistPercent[prevCol];
      }
    }
  }
  return true;
}

function removeArmorType(doc, col) {
  const matrix = doc.damageMatrix && doc.damageMatrix.matrix;
  if (!matrix) return false;
  const cols = armorTypeNames(doc);
  if (cols.length <= 1) return false;
  const remaining = cols.filter((c) => c !== col);
  const fallback = remaining.indexOf('Default') >= 0 ? 'Default' : remaining[0];
  const rowKeys = Object.keys(matrix);
  for (let i = 0; i < rowKeys.length; i++) {
    if (matrix[rowKeys[i]] && typeof matrix[rowKeys[i]] === 'object') {
      delete matrix[rowKeys[i]][col];
    }
  }
  const sheets = [doc.units, doc.items];
  for (let s = 0; s < sheets.length; s++) {
    const rows = mapRecords(sheets[s]);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].armorType === col) rows[i].armorType = fallback;
      if (rows[i].resistPercent && typeof rows[i].resistPercent === 'object') {
        delete rows[i].resistPercent[col];
      }
    }
  }
  return true;
}

function addDamageType(doc, rawName) {
  const matrix = doc.damageMatrix && doc.damageMatrix.matrix;
  if (!matrix) return false;
  const existing = damageTypeNames(doc);
  const name = normalizeTypeId(rawName) || nextMatrixTypeId(existing, 'Dmg');
  if (existing.indexOf(name) >= 0) return false;
  const cols = armorTypeNames(doc);
  const row = {};
  for (let c = 0; c < cols.length; c++) row[cols[c]] = 1;
  matrix[name] = row;
  return true;
}

function renameDamageType(doc, prevRow, rawNext) {
  const matrix = doc.damageMatrix && doc.damageMatrix.matrix;
  if (!matrix) return false;
  const nextRow = normalizeTypeId(rawNext);
  const existing = damageTypeNames(doc);
  if (!nextRow || nextRow === prevRow || existing.indexOf(nextRow) >= 0) return false;
  const rebuilt = {};
  const rowKeys = Object.keys(matrix);
  for (let i = 0; i < rowKeys.length; i++) {
    const k = rowKeys[i];
    rebuilt[k === prevRow ? nextRow : k] = matrix[k];
  }
  doc.damageMatrix.matrix = rebuilt;
  const weapons = mapRecords(doc.weapons);
  for (let i = 0; i < weapons.length; i++) {
    if (weapons[i].damageType === prevRow) weapons[i].damageType = nextRow;
  }
  return true;
}

function removeDamageType(doc, rowName) {
  const matrix = doc.damageMatrix && doc.damageMatrix.matrix;
  if (!matrix) return false;
  const rows = damageTypeNames(doc);
  if (rows.length <= 1) return false;
  const remaining = rows.filter((r) => r !== rowName);
  const fallback = remaining.indexOf('Default') >= 0 ? 'Default' : remaining[0];
  delete matrix[rowName];
  const weapons = mapRecords(doc.weapons);
  for (let i = 0; i < weapons.length; i++) {
    if (weapons[i].damageType === rowName) weapons[i].damageType = fallback;
  }
  return true;
}

function renderMatrixTypeEditor(body, api, doc, title, names, placeholder, handlers) {
  appendSectionTitle(body, title + ' (' + names.length + ')');
  const list = document.createElement('div');
  list.className = 'editor-type-list';
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const line = document.createElement('div');
    line.className = 'editor-line is-compact-row';
    const input = document.createElement('input');
    input.value = name;
    input.setAttribute('aria-label', title + ' ' + name);
    input.addEventListener('change', () => {
      if (handlers.rename(name, input.value)) {
        api.touch();
        renderPanel(api.panelRoot(), api);
      } else {
        input.value = name;
      }
    });
    line.appendChild(field('', input, 'is-grow'));
    const del = xButton('Remove ' + name, () => {
      if (handlers.remove(name)) {
        api.touch();
        renderPanel(api.panelRoot(), api);
      }
    });
    del.disabled = names.length <= 1;
    line.appendChild(del);
    list.appendChild(line);
  }
  body.appendChild(list);

  const addLine = document.createElement('div');
  addLine.className = 'editor-line is-compact-row';
  const addInput = document.createElement('input');
  addInput.placeholder = placeholder;
  addInput.setAttribute('aria-label', placeholder);
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'editor-type-add-btn';
  addBtn.textContent = '+ Add';
  const submitAdd = () => {
    if (handlers.add(addInput.value)) {
      api.touch();
      renderPanel(api.panelRoot(), api);
    }
  };
  addBtn.addEventListener('click', submitAdd);
  addInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitAdd();
    }
  });
  addLine.appendChild(field('', addInput, 'is-grow'));
  addLine.appendChild(addBtn);
  body.appendChild(addLine);
}

function renderArmorTypeTable(body, api, doc) {
  const stored = doc.damageMatrix && doc.damageMatrix.matrix;
  if (!stored) return;
  const rows = damageTypeNames(doc);
  const cols = armorTypeNames(doc);

  const card = document.createElement('div');
  card.className = 'editor-fields';

  const note = document.createElement('p');
  note.className = 'editor-note';
  note.textContent = `Matrix: ${rows.length} Damage × ${cols.length} Armor`;
  card.appendChild(note);

  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.textContent = 'Open Matrix Table';
  openBtn.addEventListener('click', () => {
    openDamageMatrixModal(api, doc);
  });
  card.appendChild(openBtn);
  body.appendChild(card);

  appendDivider(body);
  renderMatrixTypeEditor(body, api, doc, 'Armor Types', cols, 'New armor (e.g. HEAVY)', {
    add: (val) => addArmorType(doc, val),
    rename: (prev, next) => renameArmorType(doc, prev, next),
    remove: (name) => removeArmorType(doc, name),
  });

  appendDivider(body);
  renderMatrixTypeEditor(body, api, doc, 'Damage Types', rows, 'New damage (e.g. FIRE)', {
    add: (val) => addDamageType(doc, val),
    rename: (prev, next) => renameDamageType(doc, prev, next),
    remove: (name) => removeDamageType(doc, name),
  });
}

function openDamageMatrixModal(api, doc) {
  const modal = document.getElementById('editor-matrix-modal');
  const body = document.getElementById('editor-matrix-body');
  if (!modal || !body) return;

  const stored = doc.damageMatrix && doc.damageMatrix.matrix;
  if (!stored) return;
  const rows = damageTypeNames(doc);
  const cols = armorTypeNames(doc);

  body.replaceChildren();

  const note = document.createElement('p');
  note.className = 'editor-note';
  note.style.fontSize = '13px';
  note.textContent = 'Rows: Damage (Attacker) · Columns: Armor (Defender).';
  body.appendChild(note);

  const scrollWrap = document.createElement('div');
  scrollWrap.className = 'editor-matrix-scroll';

  const table = document.createElement('table');
  table.className = 'editor-matrix';

  const thead = document.createElement('thead');
  const group = document.createElement('tr');
  const blank = document.createElement('th');
  blank.textContent = '';
  group.appendChild(blank);
  const span = document.createElement('th');
  span.colSpan = cols.length || 1;
  span.textContent = 'Armor (Defender)';
  group.appendChild(span);
  thead.appendChild(group);

  const head = document.createElement('tr');
  const corner = document.createElement('th');
  corner.textContent = 'Damage \\ Armor';
  head.appendChild(corner);
  for (let c = 0; c < cols.length; c++) {
    const th = document.createElement('th');
    th.textContent = toReadableLabel ? toReadableLabel(cols[c]) : cols[c];
    head.appendChild(th);
  }
  thead.appendChild(head);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (let r = 0; r < rows.length; r++) {
    const tr = document.createElement('tr');
    const rowName = rows[r];
    const th = document.createElement('th');
    th.textContent = toReadableLabel ? toReadableLabel(rowName) : rowName;
    tr.appendChild(th);
    const row = stored[rowName] && typeof stored[rowName] === 'object' ? stored[rowName] : {};
    for (let c = 0; c < cols.length; c++) {
      const colName = cols[c];
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.step = 'any';
      input.value = row[colName] == null ? '0' : String(row[colName]);
      input.setAttribute('aria-label', rowName + ' ' + colName);
      input.addEventListener('change', () => {
        if (!doc.damageMatrix.matrix[rowName] || typeof doc.damageMatrix.matrix[rowName] !== 'object') {
          doc.damageMatrix.matrix[rowName] = {};
        }
        const next = Number(input.value);
        doc.damageMatrix.matrix[rowName][colName] = isFinite(next) ? next : 0;
        input.value = String(doc.damageMatrix.matrix[rowName][colName]);
        api.touch();
      });
      td.appendChild(input);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  scrollWrap.appendChild(table);
  body.appendChild(scrollWrap);

  modal.hidden = false;

  const closeBtn = document.getElementById('editor-matrix-close');
  const doneBtn = document.getElementById('editor-matrix-done');
  const closeModal = () => {
    modal.hidden = true;
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (doneBtn) doneBtn.onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}

function matchNumbers(body, api, rules) {
  body.appendChild(
    field(
      'Base destroyed',
      selectOf(
        [
          { value: '1', label: 'Lose immediately' },
          { value: '2', label: 'Lose only with the player down' },
        ],
        rules.loseMode === 1 ? 1 : 2,
        (value) => {
          rules.loseMode = value | 0;
          api.touch();
        }
      )
    )
  );
  const last = document.createElement('input');
  last.type = 'checkbox';
  last.checked = rules.lastStand === true;
  last.addEventListener('change', () => {
    rules.lastStand = last.checked;
    api.touch();
  });
  body.appendChild(field('Last stand', last));
  const numbers = [
    ['targetWaveToWin', 'Waves to win', 1],
    ['setupPhaseDurationSec', 'Setup seconds', 0],
    ['waveCountdownSec', 'Wave countdown', 0],
    ['respawnBaseSec', 'Respawn seconds', 0],
    ['respawnExtraPerWave', 'Extra respawn per wave', 0],
    ['enemiesPerWaveBase', 'Enemies per wave base', 0],
    ['enemiesPerWaveScale', 'Enemies per wave scale', 0],
    ['waveGroupCount', 'Wave groups', 0],
    ['dodgeQuota', 'Dodge quota', 0],
  ];
  for (let i = 0; i < numbers.length; i++) {
    const key = numbers[i][0];
    body.appendChild(
      field(numbers[i][1], numberOf(rules[key] || 0, numbers[i][2], (value) => {
        rules[key] = Math.max(numbers[i][2], Number(value) || 0);
        api.touch();
      }))
    );
  }
}

/**
 * Right-hand panels. One id is one record. Catalog ids are chosen, not typed.
 */

import { closedModelGroupId } from '../assets/closedCatalog.js';
import { armorTypeNames, damageTypeNames, spawnRow } from './mapDoc.js';
import {
  UNIT_MODEL_IDS,
  blankRecord,
  cssColor,
  renderRecord,
  shownUnitModel,
  unionShape,
} from './recordForm.js';
import {
  blankFor,
  isArmorTabKind,
  isBlockTabKind,
  isLockedBackpack,
  itemCategory,
  itemHeadings,
  renderTyped,
  skillEffectNames,
  weaponPreviewSpec,
} from './sheetForm.js';

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

function field(label, input, kind) {
  const wrap = document.createElement('label');
  if (kind) wrap.className = kind;
  if (label) wrap.textContent = label;
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
    options.push({ value: ids[i], label: ids[i] });
  }
  if (current && !seen[current]) options.unshift({ value: current, label: current });
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
  else if (tab === 'unit') renderSheet(settings, api, doc, doc.units, 'unitId', 'UNIT');
  else if (tab === 'weapon') renderGear(settings, api, doc);
  else if (kind) renderSheet(settings, api, doc, doc.items, 'itemId', 'ITEM');
  else if (tab === 'skill') renderSkillSheet(settings, api, doc);
  else renderRules(settings, api, doc);
  bench.appendChild(settings);
  root.appendChild(bench);
  const rail = bench.querySelector('.editor-rail');
  if (rail) rail.scrollTop = railScroll;
  settings.scrollTop = settingsScroll;
  fitPreviewArt(root);
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

function renderRail(api, doc, tab) {
  const rail = document.createElement('div');
  rail.className = 'editor-rail';
  if (tab === 'area') {
    for (let i = 0; i < doc.areas.length; i++) {
      const id = doc.areas[i].id;
      rail.appendChild(
        railButton(id, api.getSelectedAreaId() === id, () => {
          api.selectArea(id);
          api.paint();
          renderPanel(api.panelRoot(), api);
        })
      );
    }
    return rail;
  }
  if (tab === 'spawn') {
    const seats = doc.playerSpawns || [];
    rail.appendChild(
      railButton('Host', api.getSpawnKey() === 'host', () => {
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
            if (id >= 1 && id <= 6 && !used[id]) {
              team = id;
              break;
            }
          }
          if (!team) return;
          const unitIds = Object.keys(doc.units || {});
          doc.playerSpawns.push({
            role: 'player',
            unitId: doc.units && doc.units.PLAYER ? 'PLAYER' : unitIds[0] || '',
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
      const key = 'wave:' + i;
      rail.appendChild(
        railButton('wave ' + (i + 1), api.getSpawnKey() === key, () => {
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
        doc.spawns.push({
          wave: doc.spawns.length + 1,
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
        api.selectRulesKey('rule');
        renderPanel(api.panelRoot(), api);
      })
    );
    rail.appendChild(
      railButton('Player', key === 'player', () => {
        api.selectRulesKey('player');
        renderPanel(api.panelRoot(), api);
      })
    );
    rail.appendChild(
      railButton('ArmorType', key === 'armorType', () => {
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
      railButton(id, selected === id, () => {
        api.setSheetId(sheet.key, id);
        renderPanel(api.panelRoot(), api);
      })
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

const LOCKED_BACKPACKS = ['BACKPACK_T1', 'BACKPACK_T2', 'BACKPACK_T3'];
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
      const label = id + ' ' + typeName;
      rail.appendChild(
        railButton(label, selected === id, () => {
          api.setSheetId(sheet.key, id);
          renderPanel(api.panelRoot(), api);
        }, label)
      );
    }
  }
  rail.appendChild(
    railButton('+', false, () => {
      const id = nextId(sheet.map, 'ITEM');
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
  const ids = Object.keys(skills);
  const known = skillEffectNames();
  const buckets = {};
  const order = [];
  for (let i = 0; i < ids.length; i++) {
    const effect = skills[ids[i]] && skills[ids[i]].effect;
    const typeName = (effect && effect.type) || 'Skill';
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
  const pick = api.getSheetId('skillId');
  for (let s = 0; s < order.length; s++) {
    const typeName = order[s];
    rail.appendChild(railHeading(typeName));
    const list = buckets[typeName];
    for (let i = 0; i < list.length; i++) {
      const id = list[i];
      rail.appendChild(
        railButton(id, pick === id, () => {
          api.setSheetId('skillId', id);
          renderPanel(api.panelRoot(), api);
        }, id)
      );
    }
  }
  rail.appendChild(
    railButton('+', false, () => {
      const id = nextId(skills, 'SKILL');
      const row = blankFor('skillId', 'MELEE_SWING');
      row.id = id;
      skills[id] = row;
      api.setSheetId('skillId', id);
      api.touch();
      renderPanel(api.panelRoot(), api);
    }, 'Add skill')
  );
  rail.appendChild(railHeading('Backpack'));
  const items = doc.items || {};
  for (let i = 0; i < LOCKED_BACKPACKS.length; i++) {
    const id = LOCKED_BACKPACKS[i];
    if (!items[id]) continue;
    rail.appendChild(
      railButton(id, pick === id, () => {
        api.setSheetId('skillId', id);
        renderPanel(api.panelRoot(), api);
      }, id)
    );
  }
}

function renderSkillSheet(body, api, doc) {
  const pick = api.getSheetId('skillId');
  const item = doc.items && doc.items[pick];
  if (isLockedBackpack(item)) {
    renderTyped(body, 'itemId', item, {
      choices: (key, current) => choiceIds(doc, key, current),
      touch: () => {},
      rename: () => {},
      confirm: (message) => (api.confirm ? api.confirm(message) : Promise.resolve(false)),
      remove: () => {},
    });
    return;
  }
  renderSheet(body, api, doc, doc.skills, 'skillId', 'SKILL');
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
      railButton(id, selected === id, () => {
        api.setSheetId(sheet.key, id);
        renderPanel(api.panelRoot(), api);
      })
    );
  }
  rail.appendChild(
    railButton('+', false, () => {
      const id = nextId(sheet.map, kind === 'Ammo' ? 'AMMO' : 'ITEM');
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
  if (tab === 'weapon') return { map: doc.weapons, key: 'weaponId', prefix: 'WEAPON' };
  if (itemKindOf(tab)) return { map: doc.items, key: 'itemId', prefix: 'ITEM' };
  if (tab === 'skill') return { map: doc.skills, key: 'skillId', prefix: 'SKILL' };
  return { map: doc.units, key: 'unitId', prefix: 'UNIT' };
}

function nextId(map, prefix) {
  let n = Object.keys(map).length + 1;
  let id = prefix + '_' + n;
  while (map[id]) {
    n += 1;
    id = prefix + '_' + n;
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
      railButton(id, gear.pick === 'gun' && gear.id === id, () => {
        api.setSheetId('gearPick', 'gun');
        api.setSheetId('weaponId', id);
        renderPanel(api.panelRoot(), api);
      })
    );
  }
  for (let i = 0; i < gear.tools.length; i++) {
    const id = gear.tools[i];
    rail.appendChild(
      railButton(id, gear.pick === 'tool' && gear.id === id, () => {
        api.setSheetId('gearPick', 'tool');
        api.setSheetId('meleeId', id);
        renderPanel(api.panelRoot(), api);
      })
    );
  }
  rail.appendChild(
    railButton('+', false, () => {
      const id = nextId(doc.weapons, 'WEAPON');
      const row = blankFor('weaponId', 'Gun');
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

function ensureAreaTeams(area) {
  if (!Array.isArray(area.teams)) {
    const first = area.team == null || area.team === '' ? 1 : area.team | 0;
    area.teams = [first >= 1 && first <= 6 ? first : 1];
  }
  const next = [];
  for (let i = 0; i < area.teams.length; i++) {
    const id = area.teams[i] | 0;
    if (id >= 1 && id <= 6) next.push(id);
  }
  area.teams = next;
  if (next.length) area.team = next[0];
  else delete area.team;
  return area.teams;
}

function renderAreaTeams(column, api, area) {
  const teams = ensureAreaTeams(area);
  const options = [];
  for (let team = 1; team <= 6; team++) options.push({ value: String(team), label: String(team) });
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
    let next = 1;
    for (let n = 1; n <= 6; n++) {
      if (!used[n]) {
        next = n;
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
    if (id < 1 || id > 6 || used[id]) continue;
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
  line.appendChild(
    field('Unit', selectOf(idList(unitIds, row.unitId), row.unitId || '', (value) => {
      row.unitId = value;
      api.touch();
    }), 'is-grow')
  );
  line.appendChild(
    field('Team', selectOf(seatTeamOptions(doc, row), row.team, (value) => {
      row.team = value | 0;
      api.touch();
      api.paint();
      renderPanel(api.panelRoot(), api);
    }), 'is-short')
  );
  appendAreaField(line, api, doc, row);
  body.appendChild(line);
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

  const line = document.createElement('div');
  line.className = 'editor-line';
  line.appendChild(
    field('Wave', numberOf(row.wave, 1, (value) => {
      row.wave = Math.max(1, value | 0);
      api.touch();
    }), 'is-short')
  );
  line.appendChild(
    field('Time', numberOf(row.timeStart, 0, (value) => {
      row.timeStart = Math.max(0, Number(value) || 0);
      api.touch();
    }), 'is-short')
  );
  const teams = [];
  for (let team = 1; team <= 6; team++) teams.push({ value: String(team), label: String(team) });
  line.appendChild(
    field('Team', selectOf(teams, row.team, (value) => {
      row.team = value | 0;
      api.touch();
    }), 'is-short')
  );
  appendAreaField(line, api, doc, row);
  body.appendChild(line);

  const unitIds = Object.keys(doc.units || {});
  const specs = Array.isArray(row.units) ? row.units : [];
  if (specs.length) {
    const head = document.createElement('div');
    head.className = 'editor-line is-head';
    head.appendChild(columnMark('Unit', 'is-grow'));
    head.appendChild(columnMark('Count', 'is-short'));
    head.appendChild(columnMark('', 'is-remove'));
    body.appendChild(head);
  }
  for (let i = 0; i < specs.length; i++) {
    const spec = parseUnitSpec(specs[i]);
    const unitLine = document.createElement('div');
    unitLine.className = 'editor-line';
    unitLine.appendChild(
      field('', selectOf(idList(unitIds, spec.id), spec.id, (value) => {
        row.units[i] = value + ':' + spec.count;
        api.touch();
        renderPanel(api.panelRoot(), api);
      }), 'is-grow')
    );
    unitLine.appendChild(
      field('', numberOf(spec.count, 1, (value) => {
        row.units[i] = spec.id + ':' + Math.max(1, value | 0);
        api.touch();
        renderPanel(api.panelRoot(), api);
      }), 'is-short')
    );
    const dropUnit = document.createElement('button');
    dropUnit.type = 'button';
    dropUnit.className = 'is-remove';
    dropUnit.textContent = 'Remove';
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
      if (!next || next === record.id || map[next]) return;
      const prev = record.id;
      map[next] = record;
      record.id = next;
      delete map[prev];
      retarget(doc, selectedKey, prev, next);
      api.setSheetId(selectedKey, next);
      if (selectedKey === 'itemId' && api.getSheetId('gearPick') === 'tool') {
        api.setSheetId('meleeId', next);
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
          id = nextId(doc.items, 'ITEM');
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
      if (structural) renderPanel(api.panelRoot(), api);
    },
    remove: () => {
      delete map[record.id];
      api.setSheetId(selectedKey, '');
      api.touch();
      renderPanel(api.panelRoot(), api);
    },
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
  const note = document.createElement('p');
  note.className = 'editor-note';
  note.textContent = 'Drop';
  body.appendChild(note);
  for (let i = 0; i < rows.length; i++) {
    const line = document.createElement('div');
    line.className = 'editor-line';
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
    line.className = 'editor-line';
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

function ammoItemIds(items) {
  const ids = [];
  const keys = Object.keys(items || {});
  for (let i = 0; i < keys.length; i++) {
    const row = items[keys[i]];
    if (!row) continue;
    const ammo = row.pending ? row.pendingCategory === 'Ammo' : itemCategory(row) === 'Ammo';
    if (!ammo) continue;
    const id = typeof row.id === 'string' && row.id ? row.id : keys[i];
    if (id && ids.indexOf(id) < 0) ids.push(id);
  }
  return ids;
}

function choiceIds(doc, key, current) {
  const units = mapRecords(doc.units);
  const weapons = mapRecords(doc.weapons);
  const items = mapRecords(doc.items);
  const skills = mapRecords(doc.skills);
  let ids = [];
  if (key === 'model') ids = UNIT_MODEL_IDS.slice();
  else if (key === 'ammoTypeId') ids = ammoItemIds(doc.items);
  else if (key === 'targetFaction') ids = FACTION_CHOICES.slice();
  else if (key === 'damageType') ids = damageTypeNames(doc);
  else if (key === 'reloadType') ids = RELOAD_CHOICES.slice();
  else if (key === 'armorType') ids = armorTypeNames(doc);
  else if (key === 'itemId') ids = Object.keys(doc.items || {});
  else if (key === 'defaultWeapon' || key === 'weaponId') ids = Object.keys(doc.weapons || {});
  else if (key === 'skills' || key === 'activeSkills') ids = Object.keys(doc.skills || {});
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

function recordSwatch(record) {
  if (record && typeof record.color === 'string' && record.color) return record.color;
  if (record && record.effect && typeof record.effect.color === 'string' && record.effect.color) {
    return record.effect.color;
  }
  return '#808080';
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

function parseUnitArt(svgText) {
  if (!svgText || svgText.indexOf('<svg') < 0) return null;
  return new DOMParser().parseFromString(svgText, 'image/svg+xml');
}

function hideMeasures(clone, extra) {
  const nodes = clone.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].getAttribute('id') || '';
    if (id.indexOf('SizeView') === 0 || (extra && extra(id))) nodes[i].setAttribute('display', 'none');
  }
}

function cloneArtGroup(parsed, groupId) {
  if (!parsed || !groupId) return null;
  const src = parsed.getElementById(groupId);
  if (!src) return null;
  const clone = src.cloneNode(true);
  clone.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
  return clone;
}

function weaponClone(parsed, groupName) {
  let clone = cloneArtGroup(parsed, groupName);
  if (!clone && groupName !== 'Weapon_Colt_1911') clone = cloneArtGroup(parsed, 'Weapon_Colt_1911');
  if (!clone) return null;
  hideMeasures(clone);
  return clone;
}

const LAYER_ARM_RE = /^Arm_/i;
const LAYER_BODY_RE = /^(Body|Outfit)/i;
const LAYER_BOTTOM_RE = /^Pivot_Asset_Bottom/i;
const LAYER_TOP_RE = /^Pivot_Asset_Top/i;

function hideNode(el) {
  el.setAttribute('display', 'none');
  el.style.display = 'none';
}

function filterSkinLayer(clone, kind) {
  const rootId = clone.getAttribute('id') || '';
  const nodes = clone.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i];
    const id = el.getAttribute('id') || '';
    const arm = LAYER_ARM_RE.test(id);
    const measure = id.indexOf('SizeView') === 0 || id.indexOf('ColliderBody') === 0;
    if (measure || arm) {
      if (!(kind === 'arms' && arm)) hideNode(el);
      continue;
    }
    if (kind === 'arms') {
      if (id !== rootId) hideNode(el);
      continue;
    }
    if (kind === 'body') {
      if (LAYER_TOP_RE.test(id) || LAYER_BOTTOM_RE.test(id)) hideNode(el);
      else if (!LAYER_BODY_RE.test(id) && /^Pivot_/i.test(id)) hideNode(el);
    } else if (kind === 'assetBottom') {
      if (!LAYER_BOTTOM_RE.test(id) && id !== rootId) {
        if (LAYER_BODY_RE.test(id) || LAYER_TOP_RE.test(id) || /^Pivot_/i.test(id)) hideNode(el);
      }
    } else if (kind === 'assetTop') {
      if (!LAYER_TOP_RE.test(id) && id !== rootId) {
        if (LAYER_BODY_RE.test(id) || LAYER_BOTTOM_RE.test(id) || /^Pivot_/i.test(id)) hideNode(el);
      }
    }
  }
}

function armPoseTransform(parsed, hold, which) {
  const name = hold === 'hold_Gun_2' ? 'Action_hold_Gun_2' : 'Action_hold_Gun';
  const group = parsed.getElementById(name);
  if (!group) return '';
  const re = which === 1 ? /^Arm_1/i : /^Arm_2/i;
  const nodes = group.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].getAttribute('id') || '';
    if (!re.test(id)) continue;
    return nodes[i].getAttribute('transform') || '';
  }
  return '';
}

function applyModelArmPose(clone, parsed, hold) {
  const nodes = clone.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].getAttribute('id') || '';
    let which = 0;
    if (/^Arm_1/i.test(id)) which = 1;
    else if (/^Arm_2/i.test(id)) which = 2;
    if (!which) continue;
    const transform = armPoseTransform(parsed, hold, which);
    if (transform) nodes[i].setAttribute('transform', transform);
  }
}

function modelHoldNodes(parsed, groupId, spec) {
  const bottom = cloneArtGroup(parsed, groupId);
  const arms = cloneArtGroup(parsed, groupId);
  const body = cloneArtGroup(parsed, groupId);
  const top = cloneArtGroup(parsed, groupId);
  if (!bottom && !arms && !body && !top) return [];
  if (bottom) filterSkinLayer(bottom, 'assetBottom');
  if (arms) {
    filterSkinLayer(arms, 'arms');
    if (spec && spec.hold) applyModelArmPose(arms, parsed, spec.hold);
  }
  if (body) filterSkinLayer(body, 'body');
  if (top) filterSkinLayer(top, 'assetTop');
  const nodes = [];
  if (bottom) nodes.push(bottom);
  if (arms) nodes.push(arms);
  if (spec && spec.group) {
    const gun = weaponClone(parsed, spec.group);
    if (gun) nodes.push(gun);
  }
  if (body) nodes.push(body);
  if (top) nodes.push(top);
  return nodes;
}

function mountModelPreview(parsed, groupId, spec) {
  const nodes = modelHoldNodes(parsed, groupId, spec);
  if (!nodes.length) return null;
  const svg = mountPreviewSvg(parsed.querySelector('defs'), nodes);
  svg.setAttribute('data-skin', groupId);
  svg.setAttribute('data-layers', spec && spec.group ? 'bottom arm weapon body top' : 'bottom arm body top');
  return svg;
}

function mountPreviewSvg(defs, nodes) {
  const serial = new XMLSerializer();
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  if (defs) svg.appendChild(defs.cloneNode(true));
  const host = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  let html = '';
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]) html += serial.serializeToString(nodes[i]);
  }
  host.innerHTML = html;
  svg.appendChild(host);
  return svg;
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

function weaponRecordOf(doc, weaponId) {
  if (!weaponId) return null;
  if (doc && doc.weapons && doc.weapons[weaponId]) return doc.weapons[weaponId];
  if (doc && doc.weapons) {
    const ids = Object.keys(doc.weapons);
    for (let i = 0; i < ids.length; i++) {
      const row = doc.weapons[ids[i]];
      if (row && row.id === weaponId) return row;
    }
  }
  return { id: weaponId };
}

function previewCaption(text) {
  const note = document.createElement('p');
  note.className = 'editor-preview-caption';
  note.textContent = text;
  return note;
}

function weaponPreview(api, record) {
  const frame = previewFrame();
  const pack = api.getPack ? api.getPack() : null;
  const parsed = parseUnitArt(pack && pack.unitArt);
  const svg = parsed ? mountModelPreview(parsed, 'Default_skin_1', weaponPreviewSpec(record)) : null;
  if (svg) frame.box.appendChild(svg);
  return frame.wrap;
}

function boxInSpace(el, space, svg) {
  let bb = null;
  try {
    bb = el.getBBox();
  } catch (err) {
    bb = null;
  }
  if (!bb || !(bb.width > 0) || !(bb.height > 0)) return null;
  const from = el.getScreenCTM();
  const to = space.getScreenCTM();
  if (!from || !to) return { x: bb.x, y: bb.y, w: bb.width, h: bb.height };
  const into = to.inverse();
  const corners = [
    [bb.x, bb.y],
    [bb.x + bb.width, bb.y],
    [bb.x, bb.y + bb.height],
    [bb.x + bb.width, bb.y + bb.height],
  ];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < corners.length; i++) {
    const point = svg.createSVGPoint();
    point.x = corners[i][0];
    point.y = corners[i][1];
    const placed = point.matrixTransform(from).matrixTransform(into);
    if (placed.x < minX) minX = placed.x;
    if (placed.y < minY) minY = placed.y;
    if (placed.x > maxX) maxX = placed.x;
    if (placed.y > maxY) maxY = placed.y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function unionSpace(a, b) {
  if (!a) return b;
  if (!b) return a;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const right = Math.max(a.x + a.w, b.x + b.w);
  const bottom = Math.max(a.y + a.h, b.y + b.h);
  return { x: x, y: y, w: right - x, h: bottom - y };
}

function cellSnapSvg(parsed, groupName, fill, drawGun) {
  let gun = cloneArtGroup(parsed, groupName);
  if (!gun && groupName !== 'Weapon_Colt_1911') gun = cloneArtGroup(parsed, 'Weapon_Colt_1911');
  if (!gun) return null;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '8');
  svg.setAttribute('height', '8');
  svg.style.position = 'absolute';
  svg.style.left = '-10000px';
  svg.style.top = '0';
  const defs = parsed.querySelector('defs');
  if (defs) svg.appendChild(defs.cloneNode(true));
  const host = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  host.appendChild(gun);
  svg.appendChild(host);
  document.body.appendChild(svg);
  let cell = null;
  const nodes = gun.querySelectorAll('[id]');
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].getAttribute('id') || '';
    if (id.indexOf('SizeView') !== 0) continue;
    cell = unionSpace(cell, boxInSpace(nodes[i], host, svg));
  }
  const gunBox = boxInSpace(gun, host, svg);
  hideMeasures(gun);
  if (!drawGun) gun.remove();
  if (cell) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(cell.x));
    rect.setAttribute('y', String(cell.y));
    rect.setAttribute('width', String(cell.w));
    rect.setAttribute('height', String(cell.h));
    rect.setAttribute('fill', fill || '#1c2128');
    rect.setAttribute('stroke', '#2a2010');
    rect.setAttribute('stroke-width', '1');
    host.insertBefore(rect, host.firstChild);
  }
  const frame = unionSpace(cell, drawGun ? gunBox : null) || cell || gunBox;
  const pad = 4;
  if (frame && frame.w > 0 && frame.h > 0) {
    svg.setAttribute('viewBox', (frame.x - pad) + ' ' + (frame.y - pad) + ' ' + (frame.w + pad * 2) + ' ' + (frame.h + pad * 2));
  }
  svg.setAttribute('data-snap', 'kept');
  svg.classList.add('is-snap');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.position = '';
  svg.style.left = '';
  svg.style.top = '';
  svg.remove();
  return svg;
}

function structurePreview(api, record) {
  const frame = previewFrame();
  frame.box.classList.add('is-structure');
  const pack = api.getPack ? api.getPack() : null;
  const parsed = parseUnitArt(pack && pack.unitArt);
  const doc = api.getDoc ? api.getDoc() : null;
  const weapon = record && record.weaponId ? weaponRecordOf(doc, record.weaponId) : null;
  const spec = weapon ? weaponPreviewSpec(weapon) : null;
  const svg = cellSnapSvg(parsed, spec ? spec.group : 'Weapon_Colt_1911', cssColor(recordSwatch(record)), !!spec);
  if (svg) frame.box.appendChild(svg);
  return frame.wrap;
}

function heldLoadout(record) {
  const list = record && Array.isArray(record.startingLoadout) ? record.startingLoadout : [];
  const index = record && record.currentSlot != null ? record.currentSlot | 0 : 0;
  const row = index >= 0 && index < list.length ? list[index] : null;
  return { index: index, row: row, list: list };
}

function heldWeaponId(doc, itemId) {
  if (!itemId || !doc) return '';
  const item = doc.items ? doc.items[itemId] : null;
  if (item && typeof item.weaponId === 'string' && item.weaponId) return item.weaponId;
  if (doc.weapons && doc.weapons[itemId]) return itemId;
  return '';
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
  return 'Current slot ' + (held.index + 1) + ': ' + itemId + '. ' + wearLine(doc, held.list);
}

function unitPreview(api, record) {
  const frame = previewFrame();
  const pack = api.getPack ? api.getPack() : null;
  const parsed = parseUnitArt(pack && pack.unitArt);
  const groupId = closedModelGroupId(shownUnitModel(record));
  const doc = api.getDoc ? api.getDoc() : null;
  if (parsed && groupId) {
    const held = heldLoadout(record);
    const itemId = held.row && held.row.itemId ? held.row.itemId : '';
    const weaponId = heldWeaponId(doc, itemId);
    const weapon = weaponId ? weaponRecordOf(doc, weaponId) : null;
    const spec = weapon ? weaponPreviewSpec(weapon) : null;
    const svg = mountModelPreview(parsed, groupId, spec);
    if (svg) frame.box.appendChild(svg);
  }
  frame.wrap.appendChild(previewCaption(unitCaption(doc, record) + ' Model ' + (groupId || '(none)') + '.'));
  return frame.wrap;
}

function teamLabel(team) {
  const name = team && team.name ? ' ' + team.name : '';
  return 'Team ' + (team ? team.id : '') + name;
}

function hostileOptions(teams, selfId, current) {
  const options = [];
  const seen = {};
  for (let i = 0; i < teams.length; i++) {
    const id = teams[i].id | 0;
    if (id === (selfId | 0) || seen[id]) continue;
    seen[id] = true;
    options.push({ value: String(id), label: teamLabel(teams[i]) });
  }
  const currentId = current | 0;
  if (currentId && currentId !== (selfId | 0) && !seen[currentId]) {
    options.push({ value: String(currentId), label: 'Team ' + currentId });
  }
  return options;
}

function xButton(label, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'is-x';
  button.textContent = 'X';
  button.setAttribute('aria-label', label);
  button.addEventListener('click', onClick);
  return button;
}

function renderRelationList(parent, team, teams, api, key, title, addLabel) {
  if (!Array.isArray(team[key])) team[key] = [];
  const list = team[key];
  const note = document.createElement('p');
  note.className = 'editor-note';
  note.textContent = title;
  parent.appendChild(note);
  for (let h = 0; h < list.length; h++) {
    const column = document.createElement('div');
    column.className = 'editor-column';
    column.appendChild(
      field(
        '',
        selectOf(hostileOptions(teams, team.id, list[h]), list[h], (value) => {
          list[h] = value | 0;
          api.touch();
        })
      )
    );
    column.appendChild(
      xButton(title, () => {
        list.splice(h, 1);
        api.touch();
        renderPanel(api.panelRoot(), api);
      })
    );
    parent.appendChild(column);
  }
  const add = document.createElement('button');
  add.type = 'button';
  add.textContent = addLabel;
  add.addEventListener('click', () => {
    const options = hostileOptions(teams, team.id, 0);
    let pick = 0;
    for (let i = 0; i < options.length; i++) {
      const id = options[i].value | 0;
      if (list.indexOf(id) < 0) {
        pick = id;
        break;
      }
    }
    if (!pick) return;
    list.push(pick);
    api.touch();
    renderPanel(api.panelRoot(), api);
  });
  parent.appendChild(add);
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
  if (next >= 1 && next <= 6 && !used[next]) return next;
  for (let id = 1; id <= 6; id++) {
    if (!used[id]) return id;
  }
  return 0;
}

function resizeTeams(teams, count) {
  const n = Math.max(1, Math.min(6, count | 0));
  while (teams.length > n) teams.pop();
  while (teams.length < n) {
    const id = nextTeamId(teams);
    if (!id) break;
    teams.push({ id: id, name: '', hostileTo: [], allyTo: [] });
  }
}

function renderPlayerRules(body, api, doc) {
  if (!Array.isArray(doc.teams)) doc.teams = [];
  if (doc.teams.length < 1 || doc.teams.length > 6) resizeTeams(doc.teams, doc.teams.length < 1 ? 1 : 6);
  const countInput = document.createElement('input');
  countInput.type = 'number';
  countInput.min = '1';
  countInput.max = '6';
  countInput.value = String(doc.teams.length);
  countInput.addEventListener('change', () => {
    const next = Math.max(1, Math.min(6, countInput.value | 0));
    countInput.value = String(next);
    resizeTeams(doc.teams, next);
    api.touch();
    renderPanel(api.panelRoot(), api);
  });
  body.appendChild(field('Team count', countInput, 'is-short'));

  const teams = doc.teams;
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const title = document.createElement('p');
    title.className = 'editor-note';
    title.textContent = 'Team ' + team.id;
    body.appendChild(title);
    const nameInput = document.createElement('input');
    nameInput.value = team.name || '';
    nameInput.addEventListener('change', () => {
      team.name = nameInput.value.trim();
      api.touch();
      renderPanel(api.panelRoot(), api);
    });
    body.appendChild(field('Name', nameInput));
    renderRelationList(body, team, teams, api, 'hostileTo', 'Hostile', 'Add hostile');
    renderRelationList(body, team, teams, api, 'allyTo', 'Ally', 'Add ally');
  }

  const natureTitle = document.createElement('p');
  natureTitle.className = 'editor-note';
  natureTitle.textContent = 'Nature';
  body.appendChild(natureTitle);
  const natureName = document.createElement('input');
  natureName.value = 'Nature';
  natureName.disabled = true;
  natureName.setAttribute('aria-label', 'Nature');
  body.appendChild(field('Name', natureName));
  const natureNote = document.createElement('p');
  natureNote.className = 'editor-note';
  natureNote.textContent = 'Map resources. Not a Host or Player seat.';
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

function renderArmorTypeTable(body, api, doc) {
  const stored = doc.damageMatrix && doc.damageMatrix.matrix;
  if (!stored) return;
  const rows = damageTypeNames(doc);
  const cols = armorTypeNames(doc);
  const note = document.createElement('p');
  note.className = 'editor-note';
  note.textContent = 'Rows are damageType. Columns are armorType.';
  body.appendChild(note);
  const table = document.createElement('table');
  table.className = 'editor-matrix';
  const thead = document.createElement('thead');
  const group = document.createElement('tr');
  const blank = document.createElement('th');
  blank.textContent = '';
  group.appendChild(blank);
  const span = document.createElement('th');
  span.colSpan = cols.length || 1;
  span.textContent = 'armorType';
  group.appendChild(span);
  thead.appendChild(group);
  const head = document.createElement('tr');
  const corner = document.createElement('th');
  corner.textContent = 'damageType';
  head.appendChild(corner);
  for (let c = 0; c < cols.length; c++) {
    const th = document.createElement('th');
    th.textContent = cols[c];
    head.appendChild(th);
  }
  thead.appendChild(head);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  for (let r = 0; r < rows.length; r++) {
    const tr = document.createElement('tr');
    const rowName = rows[r];
    const th = document.createElement('th');
    th.textContent = rowName;
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
  body.appendChild(table);
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

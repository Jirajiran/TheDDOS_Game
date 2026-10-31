/**
 * One record, every key. The id is typed. Other strings are chosen from lists.
 * Numbers and switches stay numbers and switches.
 */

const TEXT_KEYS = { id: true, label: true, description: true };

export const UNIT_MODEL_IDS = ['model.unit.default_1', 'model.unit.default_2'];

const WEAPON_CHOICE_KEYS = {
  ammoTypeId: true,
  targetFaction: true,
  damageType: true,
  reloadType: true,
};

export function shownUnitModel(record) {
  const model = record && record.model;
  if (UNIT_MODEL_IDS.indexOf(model) >= 0) return model;
  return record && record.id === 'PLAYER' ? UNIT_MODEL_IDS[0] : UNIT_MODEL_IDS[1];
}

export function cssColor(value) {
  const text = String(value || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(text)) return text.toLowerCase();
  const short = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(text);
  if (short) return '#' + short[1] + short[1] + short[2] + short[2] + short[3] + short[3];
  return '#808080';
}

function blankLike(sample) {
  if (typeof sample === 'number') return 0;
  if (typeof sample === 'boolean') return false;
  if (typeof sample === 'string') return '';
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === 'object') {
    const next = {};
    const keys = Object.keys(sample);
    for (let i = 0; i < keys.length; i++) next[keys[i]] = blankLike(sample[keys[i]]);
    return next;
  }
  return '';
}

export function unionShape(records) {
  let shape = {};
  for (let i = 0; i < records.length; i++) shape = mergeShape(shape, records[i]);
  return shape;
}

function mergeShape(a, b) {
  if (b == null) return a === undefined ? b : a;
  if (Array.isArray(b)) {
    const sample = b.length ? b[0] : Array.isArray(a) ? a[0] : undefined;
    if (sample && typeof sample === 'object') return [mergeShape(Array.isArray(a) ? a[0] : {}, sample)];
    if (Array.isArray(a) && a.length) return a;
    return b.slice(0, 1);
  }
  if (typeof b === 'object') {
    const base = a && typeof a === 'object' && !Array.isArray(a) ? a : {};
    const out = {};
    const keys = Object.keys(base).concat(Object.keys(b));
    const seen = {};
    for (let i = 0; i < keys.length; i++) {
      if (seen[keys[i]]) continue;
      seen[keys[i]] = true;
      out[keys[i]] = mergeShape(base[keys[i]], b[keys[i]]);
    }
    return out;
  }
  return a === undefined ? b : a;
}

function field(label, control, kind) {
  const wrap = document.createElement('label');
  if (kind) wrap.className = kind;
  wrap.textContent = label;
  wrap.appendChild(control);
  return wrap;
}

const UNIT_FRONT = ['id', 'model', 'startingLoadout', 'skills', 'currentSlot', 'hpRange'];
const UNIT_TAIL = ['allowedGoals', 'targetPriorityList', 'behaviorFlags'];
const UNIT_HIDDEN = { defaultWeapon: true, hasPassiveShield: true, drops: true };

function orderedKeys(record, shape) {
  const seen = {};
  const keys = [];
  function add(key) {
    if (seen[key] || key == null) return;
    seen[key] = true;
    keys.push(key);
  }
  add('id');
  const names = Object.keys(record || {}).concat(Object.keys(shape || {}));
  for (let i = 0; i < names.length; i++) add(names[i]);
  return keys;
}

function unitFieldKeys(record, shape) {
  const seen = {};
  const names = [];
  function addName(key) {
    if (key == null || seen[key] || UNIT_HIDDEN[key]) return;
    seen[key] = true;
    names.push(key);
  }
  const shapeKeys = Object.keys(shape || {});
  const recordKeys = Object.keys(record || {});
  for (let i = 0; i < shapeKeys.length; i++) addName(shapeKeys[i]);
  for (let i = 0; i < recordKeys.length; i++) addName(recordKeys[i]);
  const used = {};
  const keys = [];
  function take(key) {
    if (!seen[key] || used[key]) return;
    used[key] = true;
    keys.push(key);
  }
  for (let i = 0; i < UNIT_FRONT.length; i++) take(UNIT_FRONT[i]);
  for (let i = 0; i < names.length; i++) {
    if (UNIT_TAIL.indexOf(names[i]) >= 0) continue;
    take(names[i]);
  }
  for (let i = 0; i < UNIT_TAIL.length; i++) take(UNIT_TAIL[i]);
  return keys;
}

export function renderRecord(parent, record, shape, ctx) {
  renderObject(parent, record, shape, ctx, true);
}

export function blankRecord(sample) {
  return blankLike(sample);
}

function isItemRow(sample) {
  if (!sample || typeof sample !== 'object' || Array.isArray(sample)) return false;
  const keys = Object.keys(sample);
  if (keys.indexOf('itemId') < 0) return false;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key !== 'itemId' && key !== 'count' && key !== 'active' && key !== 'amount' && key !== 'intervalSec') {
      return false;
    }
  }
  return true;
}

function fillSelect(select, options, value) {
  const seen = {};
  for (let i = 0; i < options.length; i++) {
    if (seen[options[i]]) continue;
    seen[options[i]] = true;
    const option = document.createElement('option');
    option.value = options[i];
    option.textContent = options[i];
    select.appendChild(option);
  }
  if (value && !seen[value]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
  select.value = value == null ? '' : value;
}

function columnMark(text, kind) {
  const span = document.createElement('span');
  if (kind) span.className = kind;
  span.textContent = text;
  return span;
}

function lineHead(parent, cells) {
  const head = document.createElement('div');
  head.className = 'editor-line is-head';
  for (let i = 0; i < cells.length; i++) head.appendChild(columnMark(cells[i].text, cells[i].kind));
  parent.appendChild(head);
}

function itemHead(row, withRemove) {
  const cells = [{ text: 'Item', kind: 'is-grow' }];
  if (row && 'count' in row) cells.push({ text: 'Count', kind: 'is-short' });
  if (row && 'amount' in row) cells.push({ text: 'Amount', kind: 'is-short' });
  if (row && 'intervalSec' in row) cells.push({ text: 'Every', kind: 'is-short' });
  if (row && 'active' in row) cells.push({ text: 'Active', kind: 'is-short' });
  if (withRemove !== false) cells.push({ text: '', kind: 'is-remove' });
  return cells;
}

function renderItemLine(parent, row, ctx, onRemove) {
  const line = document.createElement('div');
  line.className = 'editor-line';
  const select = document.createElement('select');
  const choiceKey = ctx.loadoutWeapon && ctx.weaponLoadout && ctx.weaponLoadout(row.itemId) ? 'weaponId' : 'itemId';
  fillSelect(select, ctx.choices(choiceKey, row.itemId), row.itemId || '');
  select.addEventListener('change', () => {
    row.itemId = select.value;
    const cap = ctx.stackCap ? ctx.stackCap(row.itemId) : 0;
    if (cap > 0 && (row.count | 0) > cap) row.count = cap;
    ctx.touch(true);
  });
  line.appendChild(field('', select, 'is-grow'));
  if ('count' in row) {
    const cap = ctx.stackCap ? ctx.stackCap(row.itemId) : 0;
    let count = row.count == null ? 1 : row.count | 0;
    if (count < 1) count = 1;
    if (cap > 0 && count > cap) {
      count = cap;
      row.count = cap;
    }
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    if (cap > 0) input.max = String(cap);
    input.value = String(count);
    input.addEventListener('change', () => {
      let next = Math.max(1, input.value | 0);
      if (cap > 0) next = Math.min(cap, next);
      row.count = next;
      input.value = String(next);
      ctx.touch(false);
    });
    line.appendChild(field('', input, 'is-short'));
  }
  if ('amount' in row) {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = String(row.amount == null ? 0 : row.amount);
    input.addEventListener('change', () => {
      row.amount = Number(input.value) || 0;
      ctx.touch(false);
    });
    line.appendChild(field('', input, 'is-short'));
  }
  if ('intervalSec' in row) {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = String(row.intervalSec == null ? 0 : row.intervalSec);
    input.addEventListener('change', () => {
      row.intervalSec = Math.max(0, Number(input.value) || 0);
      ctx.touch(false);
    });
    line.appendChild(field('', input, 'is-short'));
  }
  if ('active' in row && (!ctx.canWear || ctx.canWear(row.itemId))) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = row.active === true;
    input.addEventListener('change', () => {
      row.active = input.checked;
      ctx.touch(false);
    });
    line.appendChild(field('', input, 'is-short'));
  }
  if (onRemove) {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'is-remove';
    remove.textContent = 'Remove';
    remove.addEventListener('click', onRemove);
    line.appendChild(remove);
  }
  parent.appendChild(line);
}

function renderHpRange(parent, holder, ctx) {
  const raw = Array.isArray(holder.hpRange) ? holder.hpRange : [];
  const shown = [raw.length ? raw[0] : 0, raw.length > 1 ? raw[1] : 0];
  const stack = document.createElement('div');
  stack.className = 'editor-hp-range';
  const title = document.createElement('span');
  title.textContent = 'hpRange';
  stack.appendChild(title);
  for (let i = 0; i < 2; i++) {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = String(shown[i] == null ? 0 : shown[i]);
    input.addEventListener('change', () => {
      const next = Array.isArray(holder.hpRange) ? holder.hpRange.slice() : shown.slice();
      while (next.length < 2) next.push(0);
      next[i] = Number(input.value) || 0;
      holder.hpRange = next;
      input.value = String(next[i]);
      ctx.touch(false);
    });
    stack.appendChild(input);
  }
  parent.appendChild(stack);
}

function renderObject(parent, record, shape, ctx, isRoot) {
  const keys = isRoot && ctx.only ? ctx.only : isRoot && ctx.unitLayout ? unitFieldKeys(record, shape) : orderedKeys(record, shape);
  let line = null;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!isRoot && key === 'id' && (record[key] == null || record[key] === '')) continue;
    if (key === 'active' && ctx.canWear && !ctx.canWear(record.itemId)) continue;
    const sample = shape ? shape[key] : undefined;
    const value = record[key] === undefined ? blankLike(sample) : record[key];
    const short = typeof value === 'number' || typeof value === 'boolean';
    let host = parent;
    if (short) {
      if (!line) {
        line = document.createElement('div');
        line.className = 'editor-line';
        parent.appendChild(line);
      }
      host = line;
    } else {
      line = null;
    }
    renderValue(host, key, value, sample, (next) => {
      record[key] = next;
      ctx.touch(key === 'id' || key === 'model');
    }, ctx, record, isRoot && key === 'id');
  }
}

function renderChoiceControl(parent, key, value, setValue, ctx) {
  const select = document.createElement('select');
  const names = ctx.choices(key, value);
  const seen = {};
  if (!value) {
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '(none)';
    select.appendChild(blank);
    seen[''] = true;
  }
  for (let i = 0; i < names.length; i++) {
    if (names[i] == null || seen[names[i]]) continue;
    seen[names[i]] = true;
    const option = document.createElement('option');
    option.value = names[i];
    option.textContent = names[i];
    select.appendChild(option);
  }
  if (value && !seen[value]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
  select.value = value || '';
  select.addEventListener('change', () => {
    if (key === 'ammoTypeId' && !select.value) setValue(null);
    else setValue(select.value);
  });
  parent.appendChild(field(key, select));
}

function renderValue(parent, key, value, sample, setValue, ctx, holder, isRootId) {
  if (key === 'hpRange') {
    renderHpRange(parent, holder, ctx);
    return;
  }
  if (WEAPON_CHOICE_KEYS[key]) {
    renderChoiceControl(parent, key, value == null ? '' : String(value), setValue, ctx);
    return;
  }
  if (value == null) {
    const note = document.createElement('p');
    note.className = 'editor-note';
    note.textContent = key + ': (none)';
    parent.appendChild(note);
    return;
  }
  if (typeof value === 'number') {
    if (key === 'currentSlot') {
      const select = document.createElement('select');
      for (let n = 1; n <= 6; n++) {
        const option = document.createElement('option');
        option.value = String(n);
        option.textContent = String(n);
        select.appendChild(option);
      }
      const shown = Math.min(6, Math.max(1, (value | 0) + 1));
      select.value = String(shown);
      select.addEventListener('change', () => setValue((select.value | 0) - 1));
      parent.appendChild(field(key, select, 'is-short'));
      return;
    }
    if (key === 'maxStack' && ctx.lockMaxStack) {
      if (holder && holder.maxStack !== 1) holder.maxStack = 1;
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.max = '1';
      input.value = '1';
      input.disabled = true;
      parent.appendChild(field(key, input, 'is-short'));
      return;
    }
    const input = document.createElement('input');
    input.type = 'number';
    input.value = String(value);
    input.addEventListener('change', () => setValue(Number(input.value) || 0));
    parent.appendChild(field(key, input, 'is-short'));
    return;
  }
  if (typeof value === 'boolean') {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = value;
    input.addEventListener('change', () => setValue(input.checked));
    parent.appendChild(field(key, input, 'is-short'));
    return;
  }
  if (typeof value === 'string') {
    if (key === 'color') {
      const input = document.createElement('input');
      input.type = 'color';
      input.value = cssColor(value);
      input.addEventListener('input', () => {
        setValue(input.value);
        const swatch = document.querySelector('#editor-panel .editor-preview-swatch');
        if (swatch) swatch.style.background = input.value;
      });
      parent.appendChild(field(key, input));
      return;
    }
    if (key === 'model') {
      const select = document.createElement('select');
      for (let i = 0; i < UNIT_MODEL_IDS.length; i++) {
        const option = document.createElement('option');
        option.value = UNIT_MODEL_IDS[i];
        option.textContent = UNIT_MODEL_IDS[i];
        select.appendChild(option);
      }
      select.value = shownUnitModel(holder);
      select.addEventListener('change', () => setValue(select.value));
      parent.appendChild(field(key, select));
      return;
    }
    if (isRootId || TEXT_KEYS[key]) {
      const input = document.createElement('input');
      input.value = value;
      input.addEventListener('change', () => {
        const next = input.value.trim();
        if (!next) return;
        if (isRootId) ctx.rename(next);
        else setValue(next);
      });
      parent.appendChild(field(key, input));
      return;
    }
    const options = ctx.choices(key, value);
    const select = document.createElement('select');
    const seen = {};
    for (let i = 0; i < options.length; i++) {
      if (seen[options[i]]) continue;
      seen[options[i]] = true;
      const option = document.createElement('option');
      option.value = options[i];
      option.textContent = options[i];
      select.appendChild(option);
    }
    if (value && !seen[value]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    }
    select.value = value;
    select.addEventListener('change', () => setValue(select.value));
    parent.appendChild(field(key, select));
    return;
  }
  if (Array.isArray(value)) {
    const owned = Array.isArray(holder[key]);
    const list = owned ? holder[key] : value;
    const childCtx = Object.assign({}, ctx, {
      loadoutWeapon: key === 'startingLoadout',
      touch(structural) {
        if (!owned) holder[key] = list;
        ctx.touch(structural);
      },
    });
    const block = document.createElement('div');
    block.className = 'editor-fields';
    const title = document.createElement('p');
    title.className = 'editor-note';
    title.textContent = key;
    block.appendChild(title);
    const itemSample = Array.isArray(sample) && sample.length ? sample[0] : list[0];
    const itemList = key === 'startingLoadout' || key === 'generatorList' || isItemRow(itemSample) || (list[0] && isItemRow(list[0]));
    const kind = itemList ? 'item' : list.length ? typeof list[0] : itemSample == null ? 'string' : typeof itemSample;
    const skillList = key === 'skills' || key === 'activeSkills';
    if (kind === 'string') {
      if (skillList && list.length) {
        lineHead(block, [
          { text: 'Skill', kind: 'is-grow' },
          { text: '', kind: 'is-remove' },
        ]);
      }
      for (let i = 0; i < list.length; i++) {
        const line = document.createElement('div');
        line.className = 'editor-line';
        const select = document.createElement('select');
        fillSelect(select, childCtx.choices(key, list[i]), list[i]);
        select.addEventListener('change', () => {
          list[i] = select.value;
          childCtx.touch(true);
        });
        line.appendChild(field('', select, 'is-grow'));
        if (skillList) {
          const remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'is-remove';
          remove.textContent = 'Remove';
          remove.addEventListener('click', () => {
            list.splice(i, 1);
            childCtx.touch(true);
          });
          line.appendChild(remove);
        }
        block.appendChild(line);
      }
    } else if (kind === 'number') {
      for (let i = 0; i < list.length; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = String(list[i]);
        input.addEventListener('change', () => {
          list[i] = Number(input.value) || 0;
          childCtx.touch(false);
        });
        block.appendChild(input);
      }
    } else if (itemList) {
      if (list[0]) lineHead(block, itemHead(list[0]));
      for (let i = 0; i < list.length; i++) {
        renderItemLine(block, list[i], childCtx, () => {
          list.splice(i, 1);
          childCtx.touch(true);
        });
      }
    } else {
      for (let i = 0; i < list.length; i++) {
        const card = document.createElement('div');
        card.className = 'editor-nest';
        renderObject(card, list[i], itemSample || {}, childCtx, false);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = 'Remove';
        remove.addEventListener('click', () => {
          list.splice(i, 1);
          childCtx.touch(true);
        });
        card.appendChild(remove);
        block.appendChild(card);
      }
    }
    if (skillList && list.length >= 3) {
      parent.appendChild(block);
      return;
    }
    const add = document.createElement('button');
    add.type = 'button';
    add.textContent = 'Add ' + key;
    add.addEventListener('click', () => {
      if (skillList && list.length >= 3) return;
      if (kind === 'string') {
        const options = childCtx.choices(key, '');
        list.push(options[0] || '');
      } else if (kind === 'item') {
        list.push(key === 'generatorList'
          ? { itemId: '', amount: 1, intervalSec: 30 }
          : { itemId: '', count: 1 });
      } else if (kind === 'number') list.push(0);
      else if (itemSample && typeof itemSample === 'object') list.push(blankLike(itemSample));
      else return;
      childCtx.touch(true);
    });
    block.appendChild(add);
    parent.appendChild(block);
    return;
  }
  if (typeof value === 'object') {
    const owned = holder[key] && typeof holder[key] === 'object' && !Array.isArray(holder[key]);
    const target = owned ? holder[key] : value;
    const childCtx = Object.assign({}, ctx, {
      touch(structural) {
        if (!owned) holder[key] = target;
        ctx.touch(structural);
      },
    });
    if (isItemRow(target)) {
      lineHead(parent, itemHead(target, false));
      renderItemLine(parent, target, childCtx, null);
      return;
    }
    const block = document.createElement('div');
    block.className = 'editor-fields';
    const title = document.createElement('p');
    title.className = 'editor-note';
    title.textContent = key;
    block.appendChild(title);
    renderObject(block, target, sample && typeof sample === 'object' ? sample : {}, childCtx, false);
    parent.appendChild(block);
  }
}

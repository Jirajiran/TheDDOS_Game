/**
 * One record, every key. The id is typed. Other strings are chosen from lists.
 * Numbers and switches stay numbers and switches.
 */

import { L3_SIZE } from '../config.js';

const TEXT_KEYS = { id: true, label: true, description: true };
const SPEED_BLOCKS_MIN = 0.01;
const SPEED_BLOCKS_MAX = 64;
/** Keep in sync with sheetForm.GENERATOR_OUTPUT_CAP (avoid circular import). */
const GEN_OUTPUT_CAP = 3;
const PRIORITY_MIN = 1;
const PRIORITY_MAX = 10;

/** Gun / model tokens kept as proper nouns (not Title_Case). */
const CATALOG_ACRONYMS = {
  SMG: 'SMG',
  AK47: 'AK47',
  RPG: 'RPG',
  M1991: 'M1991',
  M1911: 'M1911',
  KAR98: 'KAR98',
  '50CAL': '50Cal',
  HP: 'HP',
  AI: 'AI',
  ID: 'ID',
  T1: 'T1',
  T2: 'T2',
  T3: 'T3',
};

/**
 * Catalog id display / storage form: GRUNT_BASIC → Grunt_Basic.
 * Keeps gun tokens like SMG / M1991; normal words (Lazer, Grunt) use Title case.
 */
export function formatCatalogId(raw) {
  if (raw == null || raw === '') return '';
  const text = String(raw).trim();
  if (!text) return '';
  const parts = text.split('_');
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) {
      out.push(part);
      continue;
    }
    const upper = part.toUpperCase();
    if (CATALOG_ACRONYMS[upper]) {
      out.push(CATALOG_ACRONYMS[upper]);
      continue;
    }
    if (/^\d/.test(part)) {
      out.push(part.toLowerCase() === part ? part : part.charAt(0) + part.slice(1).toLowerCase());
      continue;
    }
    out.push(part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
  }
  return out.join('_');
}

export const UNIT_MODEL_IDS = [
  'model.unit.default_1',
  'model.unit.default_2',
  'model.unit.default_3',
  'model.unit.default_4',
  'model.unit.default_5',
  'model.unit.default_6',
];

const WEAPON_CHOICE_KEYS = {
  ammoTypeId: true,
  targetFaction: true,
  damageType: true,
  reloadType: true,
};

export function shownUnitModel(record) {
  const model = record && record.model;
  if (UNIT_MODEL_IDS.indexOf(model) >= 0) return model;
  // No hard Player→default_1 lock — unset sheet uses default_2 until author picks.
  return UNIT_MODEL_IDS[1];
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

/** Hover help text for settings fields (shown in left Trail #editor-field-help). */
const FIELD_HELP = {
  id: 'Stable catalog id referenced by maps, loadouts, craft, and spawns. Renaming retargets linked rows.',
  label: 'Human-readable name in editor lists and UI. Does not change the catalog id.',
  color: 'Swatch used in list thumbs and simple block previews on the map.',
  model: 'Unit body SVG group from the pack art template (SizeView).',
  hpRange: 'Min/max HP roll for this unit template when it spawns or is placed.',
  speed: 'Walk speed in blocks per second (1 block = 64px). Min 0.01, max 64. Stored as world units internally.',
  turnRateRadPerSec: 'Vehicle hull turn rate (rad/s). Facing slews toward move intent — no snap. Collider nose leads.',
  bulletSpeedPxSec: 'Bullet speed in blocks per second (same scale as walk Speed). Stored as world px/s.',
  'Bullet Spd (blocks/s)': 'Bullet speed in blocks per second (1 block = 64px).',
  'Speed (blocks/s)': 'Walk speed in blocks per second (1 block = 64px).',
  priorityScore: 'Target importance 1–10 for AI scoring (higher = more attractive). Shared by units and placeables.',
  'Bot inf ammo': 'Non-player units skip mag consume while firing (not 999 ammo). Player still uses normal mags.',
  armorType: 'Armor column in the damage matrix. Multipliers below show damage×armor for this type.',
  preferredRange: 'AI preferred fight distance band (closer / mid / far) for this unit.',
  skills: 'Skill ids granted to this unit (passive or activatable).',
  startingLoadout: 'Starting inventory rows (items/weapons) this unit holds when it spawns. Hover a row to preview it in Trail.',
  currentSlot: 'Which loadout slot index is held/active first when the unit appears.',
  weaponId: 'One shared weapon for every Pivot_turrent on this art (Base×4 / Turret×1 / Vehicle×N). Overlay uses Weapon_Turrent_* art when available; gun stats stay on the Weapons sheet.',
  defaultWeapon: 'Fallback gun id if loadout has no weapon. Set on the Units tab loadout when possible.',
  footprint: 'Occupied size in L3 cells (64×64). Minimum 1×1. Used for place overlap.',
  maxHp: 'Maximum hit points for this placeable template. Placed instances copy this as Max HP.',
  detectRadius: 'How far (world units) a turret searches for targets.',
  magCapacity: 'Rounds per magazine. Authored on the Weapons sheet; units only pick which weapon id to hold (Units → Loadout).',
  maxMags: 'Spare magazines carried with the weapon template (Weapons sheet). Units reference the weapon via Loadout.',
  reloadSec: 'Reload duration in seconds (Weapons sheet). Units do not override this — they hold a weapon id.',
  fireIntervalSec: 'Time between shots (Weapons sheet). Assign the weapon on Units → Loadout.',
  damage: 'Base damage before the armor matrix (Weapons sheet). Units pick the weapon id in Loadout.',
  damageType: 'Damage row in the matrix (Weapons sheet). Pair with a unit armorType to resolve final multipliers.',
  ammoTypeId: 'Ammo item consumed when firing (Weapons sheet). Units hold the weapon; ammo is weapon-defined.',
  infiniteAmmo: 'If on, this weapon/turret does not consume magazines.',
  pierceCost: 'How much pierce budget a projectile spends hitting this structure.',
  walkSolid: 'Blocks unit walking when true.',
  projectileSolid: 'Blocks projectiles when true (unless allow pass).',
  allowProjectilePass: 'Lets projectiles pass even if solid flags are set.',
  canToggle: 'Door can open/close in play.',
  Wave: 'Wave index locked to the side rail tab (wave N always equals N). Not editable here.',
  Time: 'Delay (seconds) after the wave starts before units at these spawn points appear. Advance policy (wait clear vs continuous) is under Rules → Wave advance.',
  Team: 'Team id for seats, waves, or placed instances (0 = neutral).',
  Area: 'One spawn point (map area). Add multiple points per wave — each gets the unit list.',
  'Win by waves': 'Optional win condition. When on, reaching Waves to win can end the match (see Win when).',
  'Waves to win': 'Target wave index for win-by-waves.',
  'Win when': 'CLEAR = need enemies wiped after reaching the wave. REACH = win as soon as that wave index is reached.',
  'Wave advance': 'CONTINUOUS = between-wave countdown always ticks. WAIT_CLEAR = next wave waits until current enemies are gone.',
  'Last stand': 'Secondary rule: keep playing after the defeat-condition base is destroyed.',
  'Base destroyed': 'Primary lose rule when the defeat-condition base dies.',
  Craft: 'When checked, this template can be crafted and ingredient rows are shown. Unchecked hides craft data UI.',
  Unit: 'Unit template used for this seat or wave row. Hover to preview in Trail.',
  Count: 'How many copies of that unit spawn in this wave row.',
  Art: 'Weapon SVG art group for preview and in-world draw (Weapons sheet).',
  Hold: 'Hold pose when a unit aims this weapon (Weapons sheet).',
  typeId: 'Internal placeable type tag. Not shown for Turrets in this editor.',
  armorSlot: 'TOP = hat/helmet (Asset_Top_*). VEST = body vest — vest arms draw over skin arms.',
  artId: 'Art group for this sheet type only (filtered — not the whole catalog). Empty = no invented art.',
  modelId: 'Vehicle closed model only (model.vehicle.*). Unit sheet uses model (model.unit.*).',
  previewHost: 'Weapon Settings preview: unit = skin under gun; empty = gun only.',
  mobilityHpRatio: 'Hull HP ratio that triggers Mobility immobilized state.',
  mobilityRepairChance: 'Deterministic wrench repair success chance (0–1).',
  brokenClearSec: 'Seconds before a Broken wreck is cleared from the match.',
  driverProtection: 'Pierce/explosion bleed to driver while mounted (absorbRatio, allowPierce, explosionFactor).',
  startUnitDriven: 'Unit template that starts seated as driver (Driven). Empty = Nature/Empty.',
  bulletArtId: 'Projectile tracer art (Bullet_* from ItemHold) for this weapon only.',
  shotFrameArtId: 'Muzzle/shot frame art (Weapon_Turrent_*_Frame_shot) for this weapon.',
};

/** Append damage×armor multipliers for an armor column. */
export function armorMatrixHelpLine(doc, armorName) {
  if (!doc || !armorName) return '';
  const matrix = doc.damageMatrix && doc.damageMatrix.matrix;
  if (!matrix || typeof matrix !== 'object') return '';
  const parts = [];
  const rows = Object.keys(matrix);
  for (let i = 0; i < rows.length; i++) {
    const row = matrix[rows[i]];
    if (!row || typeof row !== 'object') continue;
    if (row[armorName] == null) continue;
    parts.push(toReadableLabel(rows[i]) + '=' + row[armorName]);
  }
  if (!parts.length) return '';
  return ' Values vs this armor: ' + parts.join(', ') + '.';
}

export function getFieldHelp(key, doc, currentValue) {
  if (!key) return '';
  const raw = String(key);
  let text = '';
  if (FIELD_HELP[raw]) text = FIELD_HELP[raw];
  else {
    const readable = toReadableLabel(raw);
    if (FIELD_HELP[readable]) text = FIELD_HELP[readable];
    else text = readable ? readable + ' — settings field for this record.' : '';
  }
  if ((raw === 'armorType' || toReadableLabel(raw) === 'Armor') && doc) {
    const armor = currentValue || '';
    text += armorMatrixHelpLine(doc, armor);
  }
  return text;
}

export function toReadableLabel(str) {
  if (!str) return '';
  const s = String(str);
  const dict = {
    DESTROY_BASE: 'Destroy Base',
    ELIMINATE_PLAYER: 'Eliminate Player',
    SURVIVE_RETREAT: 'Survive / Retreat',
    SEEK_HEAL_POINT: 'Seek Heal Point',
    REGROUP_ALLIES: 'Regroup Allies',
    BLOCK_TURRET: 'Turret',
    BLOCK_BASE: 'Base',
    MAGAZINE: 'Magazine',
    INDIVIDUAL_SHELL: 'Shell',
    PROJECTILE_RAYCAST: 'Raycast',
    MELEE_OBJECT: 'Melee',
    EXPLOSION: 'Explosion',
    Explosion: 'Explosion',
    BULLET: 'Bullet',
    Bullet: 'Bullet',
    LAZER: 'Laser',
    Lazer: 'Laser',
    DEFAULT: 'Default',
    Default: 'Default',
    MELEE_SWING: 'Melee Swing',
    TAUNT_PULSE: 'Taunt Pulse',
    SPEED_BOOST: 'Speed Boost',
    SHIELD_OVERCHARGE: 'Shield Overcharge',
    HEAL_SELF: 'Heal Self',
    PASS_THROUGH: 'Pass Through',
    HEAL_RADIUS: 'Heal Radius',
    MEDIUM: 'Medium',
    CLOSE: 'Close',
    LONG: 'Long',
    ENEMY: 'Enemy',
    FRIENDLY: 'Friendly',
    id: 'ID',
    label: 'Label',
    color: 'Color',
    model: 'Model',
    hpRange: 'HP Range',
    startingLoadout: 'Loadout',
    skills: 'Skills',
    currentSlot: 'Slot',
    armorType: 'Armor',
    speed: 'Speed',
    behaviorFlags: 'Behavior',
    allowedGoals: 'Goals',
    targetPriorityList: 'Priorities',
    retreatHpRatio: 'Retreat HP',
    preferredRange: 'Range',
    canRegroup: 'Regroup',
    damageType: 'Dmg Type',
    reloadType: 'Reload',
    targetFaction: 'Faction',
    ammoTypeId: 'Ammo ID',
    baseDamage: 'Damage',
    cooldownSec: 'Cooldown',
    bulletSpeedPxSec: 'Bullet Spd',
    explosionRadius: 'Exp Radius',
    explosionDamage: 'Exp Dmg',
    magCapacity: 'Mag Cap',
    maxMags: 'Max Mags',
    reloadSec: 'Reload (s)',
    spreadDeg: 'Spread',
    maxDistancePath: 'Max Range',
    aiFireRangePath: 'AI Range',
    muzzleLeadSec: 'Muzzle Lead',
    projectileRadius: 'Proj Rad',
    pierceUnits: 'Pierce',
    pelletCount: 'Pellets',
    burstCount: 'Burst',
    burstIntervalSec: 'Burst Gap',
    beamDurationSec: 'Beam (s)',
    infiniteAmmo: 'Inf Ammo',
    harvestDamage: 'Harvest Dmg',
    structureDamage: 'Struct Dmg',
    repairAmount: 'Repair',
    activeDurationSec: 'Active (s)',
    castTimeSec: 'Cast (s)',
    toolTier: 'Tier',
    meleeRole: 'Role',
    maxStack: 'Max Stack',
    damageReduction: 'Dmg Reduct',
    armorSlot: 'Armor Slot',
    artId: 'Art Id',
    modelId: 'Model Id',
    mobilityHpRatio: 'Mobility HP %',
    mobilityRepairChance: 'Repair Chance',
    brokenClearSec: 'Broken Clear Sec',
    driverProtection: 'Driver Protect',
    startUnitDriven: 'Start Unit Driven',
    bulletArtId: 'Bullet Art',
    shotFrameArtId: 'Shot Frame',
    previewHost: 'Preview Host',
    markerColor: 'Marker',
    shieldMaxHp: 'Shield HP',
    shieldRadius: 'Radius',
    shieldOffset: 'Offset',
    shieldPierceCost: 'Pierce Cost',
    shieldAbsorbRatio: 'Absorb',
    shieldRegenPerSec: 'Regen/s',
    backpackTier: 'Tier',
    backpackBonusSlots: 'Bonus Slots',
    walkSolid: 'Walk Solid',
    projectileSolid: 'Proj Solid',
    allowProjectilePass: 'Pass Shot',
    pierceCost: 'Pierce Cost',
    detectRadius: 'Detect Rad',
    priorityScore: 'Priority',
    generatorList: 'Gen List',
    genRate: 'Gen Rate',
    canToggle: 'Toggle',
    skillId: 'Skill',
    typeId: 'Type ID',
    weaponId: 'Weapon',
    footprint: 'Size',
    // Never surface as "Tile" in Skills / forms.
    tile: 'Size',
    Tile: 'Size',
  };
  if (dict[s]) return dict[s];

  if (s.indexOf('_') >= 0 || /^[A-Z0-9-]+$/.test(s)) return formatCatalogId(s);
  return s
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function helpCtxOf(ctx, getValue, warn) {
  return {
    doc: ctx && ctx.getDoc ? ctx.getDoc() : null,
    getValue: typeof getValue === 'function' ? getValue : () => '',
    warn: !!warn,
  };
}

/** Cross-sheet pointers — Trail help uses warn (red) so authors know stats live elsewhere. */
const CROSS_SHEET_HELP = {
  weaponId: true,
  defaultWeapon: true,
  ammoTypeId: true,
  skillId: true,
  skills: true,
  activeSkills: true,
};

function field(label, control, kind, helpCtx) {
  const wrap = document.createElement('label');
  if (kind) wrap.className = kind;
  if (label) wrap.textContent = toReadableLabel(label);
  const resolveHelp = () => {
    const value = helpCtx && typeof helpCtx.getValue === 'function' ? helpCtx.getValue() : '';
    const doc = helpCtx && helpCtx.doc ? helpCtx.doc : null;
    return getFieldHelp(label, doc, value);
  };
  const help = resolveHelp();
  if (help) {
    wrap.title = help;
    wrap.dataset.fieldHelp = help;
    wrap.addEventListener('pointerenter', () => {
      const next = resolveHelp();
      wrap.title = next;
      const warn =
        (helpCtx && helpCtx.warn) ||
        CROSS_SHEET_HELP[label] ||
        CROSS_SHEET_HELP[String(label || '')];
      if (typeof window.__editorSetFieldHelp === 'function') {
        window.__editorSetFieldHelp(next, { warn: !!warn });
      }
    });
    wrap.addEventListener('pointerleave', () => {
      if (typeof window.__editorClearFieldHelp === 'function') {
        window.__editorClearFieldHelp();
      }
    });
  }
  wrap.appendChild(control);
  return wrap;
}

export function appendDivider(parent) {
  const hr = document.createElement('hr');
  hr.className = 'editor-divider';
  parent.appendChild(hr);
  return hr;
}

export function appendSectionTitle(parent, text) {
  const heading = document.createElement('p');
  heading.className = 'editor-section-title';
  heading.textContent = text;
  parent.appendChild(heading);
  return heading;
}

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
  const allowed = [
    'id',
    'model',
    'hpRange',
    'startingLoadout',
    'skills',
    'currentSlot',
    'armorType',
    'speed',
    'priorityScore',
    'behaviorFlags',
    'allowedGoals',
    'targetPriorityList',
  ];
  const keys = [];
  for (let i = 0; i < allowed.length; i++) {
    const k = allowed[i];
    if (
      (record && Object.prototype.hasOwnProperty.call(record, k)) ||
      (shape && Object.prototype.hasOwnProperty.call(shape, k))
    ) {
      keys.push(k);
    }
  }
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

function fillSelect(select, options, value, rawText) {
  const seen = {};
  for (let i = 0; i < options.length; i++) {
    if (seen[options[i]]) continue;
    seen[options[i]] = true;
    const option = document.createElement('option');
    option.value = options[i];
    option.textContent = rawText ? String(options[i]) : toReadableLabel(options[i]);
    select.appendChild(option);
  }
  if (value && !seen[value]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = rawText ? String(value) : toReadableLabel(value);
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

function lineHead(parent, cells, compact) {
  const head = document.createElement('div');
  head.className = compact ? 'editor-line is-head is-compact-head' : 'editor-line is-head';
  for (let i = 0; i < cells.length; i++) head.appendChild(columnMark(cells[i].text, cells[i].kind));
  parent.appendChild(head);
}

function itemHead(row, withRemove) {
  const cells = [{ text: 'Item', kind: 'is-grow' }];
  if (row && 'count' in row) cells.push({ text: 'Qty', kind: 'is-short' });
  if (row && 'amount' in row) cells.push({ text: 'Amt', kind: 'is-short' });
  if (row && 'intervalSec' in row) cells.push({ text: 'Sec', kind: 'is-short' });
  if (row && 'active' in row) cells.push({ text: 'On', kind: 'is-check' });
  if (withRemove !== false) cells.push({ text: '', kind: 'is-danger-slot' });
  return cells;
}

function trailKindForItemId(ctx, itemId) {
  if (!itemId) return 'object';
  if (ctx.weaponLoadout && ctx.weaponLoadout(itemId)) return 'object';
  const doc = ctx.getDoc ? ctx.getDoc() : null;
  if (doc && doc.units && doc.units[itemId]) return 'unit';
  return 'object';
}

/** Tools-style list picker so each row can fire hover preview (native <select> cannot). */
export function buildCatalogListPicker(opts) {
  const ids = Array.isArray(opts && opts.ids) ? opts.ids.slice() : [];
  let value = opts && opts.value != null ? String(opts.value) : '';
  const allowEmpty = !!(opts && opts.allowEmpty);
  const emptyLabel = (opts && opts.emptyLabel) || '(none)';
  const formatId = (opts && opts.formatId) || formatCatalogId;
  const onChange = opts && opts.onChange;
  const onHoverId = opts && opts.onHoverId;
  const onHoverEnd = opts && opts.onHoverEnd;

  const wrap = document.createElement('div');
  wrap.className = 'tool-picker editor-catalog-picker';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tool-picker-btn';
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');
  const menu = document.createElement('div');
  menu.className = 'tool-picker-menu';
  menu.hidden = true;
  menu.setAttribute('role', 'listbox');

  const labelOf = (id) => (id ? formatId(id) : emptyLabel);
  const syncBtn = () => {
    btn.textContent = value ? labelOf(value) : emptyLabel;
  };
  syncBtn();

  const closeMenu = () => {
    if (menu.hidden) return;
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (onHoverEnd) onHoverEnd();
  };

  const fillMenu = () => {
    menu.replaceChildren();
    if (allowEmpty) {
      const blank = document.createElement('button');
      blank.type = 'button';
      blank.className = 'tool-picker-item' + (!value ? ' is-selected' : '');
      blank.setAttribute('role', 'option');
      blank.textContent = emptyLabel;
      blank.addEventListener('pointerenter', () => {
        if (onHoverEnd) onHoverEnd();
      });
      blank.addEventListener('click', (event) => {
        event.stopPropagation();
        value = '';
        syncBtn();
        closeMenu();
        if (onChange) onChange('');
      });
      menu.appendChild(blank);
    }
    for (let i = 0; i < ids.length; i++) {
      const id = String(ids[i] || '');
      if (!id) continue;
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'tool-picker-item' + (id === value ? ' is-selected' : '');
      opt.setAttribute('role', 'option');
      opt.setAttribute('aria-selected', id === value ? 'true' : 'false');
      opt.dataset.id = id;
      opt.textContent = labelOf(id);
      opt.addEventListener('pointerenter', () => {
        if (onHoverId) onHoverId(id);
      });
      opt.addEventListener('focus', () => {
        if (onHoverId) onHoverId(id);
      });
      opt.addEventListener('click', (event) => {
        event.stopPropagation();
        value = id;
        syncBtn();
        closeMenu();
        if (onChange) onChange(id);
      });
      menu.appendChild(opt);
    }
  };

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const opening = menu.hidden;
    document.querySelectorAll('.editor-catalog-picker .tool-picker-menu').forEach((node) => {
      if (node !== menu) {
        node.hidden = true;
        const host = node.closest('.editor-catalog-picker');
        const otherBtn = host && host.querySelector('.tool-picker-btn');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      }
    });
    if (!opening) {
      closeMenu();
      return;
    }
    fillMenu();
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    if (value && onHoverId) onHoverId(value);
  });

  // Do not clear trail on menu pointerleave — moving toward Trail must not
  // collapse the open picker / interrupt list pointing.
  menu.addEventListener('pointerleave', () => {});

  if (typeof document !== 'undefined' && !document.documentElement.dataset.editorCatalogPicker) {
    document.documentElement.dataset.editorCatalogPicker = '1';
    document.addEventListener('pointerdown', (event) => {
      const t = event.target;
      if (t && t.closest && t.closest('.editor-catalog-picker')) return;
      // Clicks on Trail preview must not close an open art picker mid-select.
      if (t && t.closest && t.closest('#editor-placed-tray')) return;
      document.querySelectorAll('.editor-catalog-picker .tool-picker-menu').forEach((node) => {
        if (node.hidden) return;
        node.hidden = true;
        const host = node.closest('.editor-catalog-picker');
        const otherBtn = host && host.querySelector('.tool-picker-btn');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  wrap.appendChild(btn);
  wrap.appendChild(menu);
  wrap.getValue = () => value;
  return wrap;
}

function renderItemLine(parent, row, ctx, onRemove) {
  const line = document.createElement('div');
  line.className = 'editor-line is-compact-row';
  const choiceKey = ctx.loadoutWeapon && ctx.weaponLoadout && ctx.weaponLoadout(row.itemId) ? 'weaponId' : 'itemId';
  const choiceIds = (ctx.choices(choiceKey, row.itemId) || []).filter(Boolean);
  const picker = buildCatalogListPicker({
    ids: choiceIds,
    value: row.itemId || '',
    allowEmpty: true,
    emptyLabel: '(none)',
    onHoverId: (id) => {
      if (!ctx.trailPreview || !id) return;
      ctx.trailPreview(trailKindForItemId(ctx, id), id);
    },
    onHoverEnd: () => {
      if (ctx.trailRelease) ctx.trailRelease();
    },
    onChange: (id) => {
      row.itemId = id;
      const cap = ctx.stackCap ? ctx.stackCap(row.itemId) : 0;
      if (cap > 0 && (row.count | 0) > cap) row.count = cap;
      if (ctx.loadoutWeapon && ctx.canWear) {
        if (id && ctx.canWear(id)) {
          if (row.active !== true && row.active !== false) row.active = false;
        } else {
          delete row.active;
        }
      }
      if (ctx.trailRelease) ctx.trailRelease();
      ctx.touch(true);
    },
  });
  line.appendChild(field('', picker, 'is-grow', {
    doc: ctx.getDoc ? ctx.getDoc() : null,
    getValue: () => picker.getValue(),
  }));
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
  // Vest / Helmet / Shield / Shield Energy — same On checkbox in unit loadout.
  const wearable =
    !!(ctx.canWear && row.itemId && ctx.canWear(row.itemId));
  if (ctx.loadoutWeapon) {
    if (wearable) {
      if (row.active !== true && row.active !== false) row.active = false;
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = row.active === true;
      input.title = 'Wear / active';
      input.addEventListener('change', () => {
        row.active = input.checked;
        ctx.touch(false);
      });
      line.appendChild(field('', input, 'is-check'));
    } else {
      if ('active' in row) delete row.active;
      const spacer = document.createElement('span');
      spacer.className = 'is-check';
      spacer.setAttribute('aria-hidden', 'true');
      line.appendChild(field('', spacer, 'is-check'));
    }
  } else if ('active' in row && wearable) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = row.active === true;
    input.addEventListener('change', () => {
      row.active = input.checked;
      ctx.touch(false);
    });
    line.appendChild(field('', input, 'is-check'));
  }
  if (onRemove) {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'editor-btn-danger';
    remove.textContent = '×';
    remove.title = 'Remove';
    remove.setAttribute('aria-label', 'Remove');
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
  title.textContent = toReadableLabel('hpRange');
  stack.appendChild(title);
  const row = document.createElement('div');
  row.className = 'editor-hp-range-row';
  const placeholders = ['Min', 'Max'];
  for (let i = 0; i < 2; i++) {
    if (i === 1) {
      const sep = document.createElement('span');
      sep.className = 'editor-hp-range-sep';
      sep.textContent = '–';
      row.appendChild(sep);
    }
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = placeholders[i];
    input.setAttribute('aria-label', 'HP ' + placeholders[i]);
    input.value = String(shown[i] == null ? 0 : shown[i]);
    input.addEventListener('change', () => {
      const next = Array.isArray(holder.hpRange) ? holder.hpRange.slice() : shown.slice();
      while (next.length < 2) next.push(0);
      next[i] = Number(input.value) || 0;
      holder.hpRange = next;
      input.value = String(next[i]);
      ctx.touch(false);
    });
    row.appendChild(input);
  }
  stack.appendChild(row);
  parent.appendChild(stack);
}

function hasRecordKey(record, shape, key) {
  return (
    (record && Object.prototype.hasOwnProperty.call(record, key)) ||
    (shape && Object.prototype.hasOwnProperty.call(shape, key))
  );
}

function renderUnitField(parent, record, shape, ctx, key, opts) {
  const sample = shape ? shape[key] : undefined;
  const value = record[key] === undefined ? blankLike(sample) : record[key];
  renderValue(
    parent,
    key,
    value,
    sample,
    (next) => {
      record[key] = next;
      ctx.touch(key === 'id' || key === 'model');
    },
    ctx,
    record,
    key === 'id',
    opts
  );
}

function worldSpeedToBlocks(speed) {
  const cell = L3_SIZE > 0 ? L3_SIZE : 64;
  const n = Number(speed);
  if (!isFinite(n) || n <= 0) return SPEED_BLOCKS_MIN;
  return Math.max(SPEED_BLOCKS_MIN, Math.min(SPEED_BLOCKS_MAX, n / cell));
}

function blocksToWorldSpeed(blocks) {
  const cell = L3_SIZE > 0 ? L3_SIZE : 64;
  let b = Number(blocks);
  if (!isFinite(b)) b = SPEED_BLOCKS_MIN;
  b = Math.max(SPEED_BLOCKS_MIN, Math.min(SPEED_BLOCKS_MAX, b));
  return b * cell;
}

function clampPriority(raw) {
  const n = Number(raw);
  if (!isFinite(n)) return 5;
  return Math.max(PRIORITY_MIN, Math.min(PRIORITY_MAX, Math.round(n)));
}

/** Seed empty behaviorFlags so AI panel has editable controls (pack may omit keys). */
const DEFAULT_BEHAVIOR_FLAGS = {
  retreatHpRatio: 0.25,
  canRegroup: true,
  preferredRange: 'MEDIUM',
};

function ownKey(record, key) {
  return !!(record && Object.prototype.hasOwnProperty.call(record, key));
}

function ensureAiBehaviorData(record) {
  if (!Array.isArray(record.allowedGoals)) record.allowedGoals = [];
  if (!record.behaviorFlags || typeof record.behaviorFlags !== 'object') {
    record.behaviorFlags = Object.assign({}, DEFAULT_BEHAVIOR_FLAGS);
  } else if (!Object.keys(record.behaviorFlags).length) {
    Object.assign(record.behaviorFlags, DEFAULT_BEHAVIOR_FLAGS);
  }
  if (!Array.isArray(record.targetPriorityList)) record.targetPriorityList = [];
}

/** Open AI & Behavior in the shared editor modal (same pattern as Damage Matrix). */
function openAiBehaviorModal(record, shape, ctx) {
  const modal = document.getElementById('editor-matrix-modal');
  const body = document.getElementById('editor-matrix-body');
  const title = modal && modal.querySelector('h2');
  if (!modal || !body) return;
  ensureAiBehaviorData(record);
  if (title) {
    title.dataset.prevTitle = title.textContent || '';
    title.textContent = 'AI & Behavior';
  }
  body.replaceChildren();
  const scroll = document.createElement('div');
  scroll.className = 'editor-matrix-scroll';
  const wrap = document.createElement('div');
  wrap.className = 'editor-fields';
  renderUnitField(wrap, record, shape, ctx, 'allowedGoals');
  renderUnitField(wrap, record, shape, ctx, 'behaviorFlags');
  renderUnitField(wrap, record, shape, ctx, 'targetPriorityList');
  scroll.appendChild(wrap);
  body.appendChild(scroll);
  modal.hidden = false;
  const restore = () => {
    if (title && title.dataset.prevTitle != null) {
      title.textContent = title.dataset.prevTitle;
      delete title.dataset.prevTitle;
    }
    modal.hidden = true;
  };
  const done = document.getElementById('editor-matrix-done');
  const close = document.getElementById('editor-matrix-close');
  if (done) done.onclick = () => {
    restore();
    if (ctx && ctx.touch) ctx.touch();
  };
  if (close) close.onclick = restore;
}

function renderAiBehaviorPanel(parent, record, shape, ctx) {
  appendSectionTitle(parent, 'AI & Behavior');
  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.textContent = 'Open AI & Behavior';
  openBtn.addEventListener('click', () => openAiBehaviorModal(record, shape, ctx));
  parent.appendChild(openBtn);
}

/** Drop legacy Unit keys that still hang on old map sheets. */
function migrateUnitRecord(record) {
  if (!record) return;
  if (Array.isArray(record.activeSkills) && !Array.isArray(record.skills)) {
    record.skills = record.activeSkills.slice();
  }
  if (ownKey(record, 'activeSkills')) delete record.activeSkills;
  if (!record.model || typeof record.model !== 'string') {
    record.model = 'model.unit.default_1';
  }
  if (!Array.isArray(record.startingLoadout)) record.startingLoadout = [];
  if (record.currentSlot == null) record.currentSlot = 0;
  // Strip obsolete one-off keys that confused old Settings layouts.
  const drop = [
    'weapon',
    'heldWeapon',
    'armorId',
    'vestId',
    'helmetId',
    'wearIds',
  ];
  for (let i = 0; i < drop.length; i++) {
    if (ownKey(record, drop[i])) delete record[drop[i]];
  }
}

function renderUnitSections(parent, record, shape, ctx) {
  migrateUnitRecord(record);
  appendSectionTitle(parent, 'Identity & Stats');
  if (ownKey(record, 'id') || hasRecordKey(record, shape, 'id')) {
    renderUnitField(parent, record, shape, ctx, 'id');
  }
  if (ownKey(record, 'model')) {
    renderUnitField(parent, record, shape, ctx, 'model');
  }
  // Only show HP/speed from this record — never invent 0 from union shape.
  if (ownKey(record, 'hpRange') && Array.isArray(record.hpRange)) {
    const lo = Number(record.hpRange[0]);
    const hi = Number(record.hpRange[1]);
    if (!(lo > 0) && !(hi > 0)) {
      record.hpRange = [100, 100];
    }
    renderUnitField(parent, record, shape, ctx, 'hpRange');
  } else if (ownKey(record, 'maxHp')) {
    if (!(Number(record.maxHp) > 0)) record.maxHp = 100;
    renderUnitField(parent, record, shape, ctx, 'maxHp', { fullWidth: true, minVal: 1 });
  }
  const hasSpeed = ownKey(record, 'speed');
  if (hasSpeed && !(Number(record.speed) > 0)) {
    record.speed = blocksToWorldSpeed(3.125);
  }
  const hasArmor = ownKey(record, 'armorType');
  if (hasSpeed || hasArmor) {
    const pair = document.createElement('div');
    pair.className = 'editor-pair';
    if (hasSpeed) renderUnitField(pair, record, shape, ctx, 'speed', { fullWidth: true });
    if (hasArmor) renderUnitField(pair, record, shape, ctx, 'armorType', { fullWidth: true });
    parent.appendChild(pair);
  }
  if (!ownKey(record, 'priorityScore')) {
    record.priorityScore = 5;
  }
  renderUnitField(parent, record, shape, ctx, 'priorityScore', { fullWidth: true });

  if (ownKey(record, 'startingLoadout') || ownKey(record, 'currentSlot')) {
    appendDivider(parent);
    appendSectionTitle(parent, 'Loadout');
    if (ownKey(record, 'startingLoadout')) {
      renderUnitField(parent, record, shape, ctx, 'startingLoadout', { hideTitle: true });
    }
    if (ownKey(record, 'currentSlot')) {
      renderUnitField(parent, record, shape, ctx, 'currentSlot', { fullWidth: true });
    }
  }

  // Skills slot for units — empty list OK (no HUD invent).
  appendDivider(parent);
  appendSectionTitle(parent, 'Skills');
  if (ownKey(record, 'activeSkills') && !ownKey(record, 'skills')) {
    renderUnitField(parent, record, shape, ctx, 'activeSkills');
  } else {
    if (!ownKey(record, 'skills')) record.skills = [];
    renderUnitField(parent, record, shape, ctx, 'skills');
  }

  appendDivider(parent);
  renderAiBehaviorPanel(parent, record, shape, ctx);
}

function renderObject(parent, record, shape, ctx, isRoot, objOpts) {
  if (isRoot && !ctx.only && ctx.unitLayout) {
    renderUnitSections(parent, record, shape, ctx);
    return;
  }
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
      if (ctx.afterField) ctx.afterField(key, next);
      const refreshArt =
        key === 'id' ||
        key === 'model' ||
        key === 'modelId' ||
        key === 'artId' ||
        key === 'armorSlot' ||
        key === 'startUnitDriven' ||
        key === 'previewHost' ||
        key === 'bulletArtId' ||
        key === 'shotFrameArtId' ||
        key === 'weaponId';
      ctx.touch(refreshArt);
    }, ctx, record, isRoot && key === 'id', objOpts);
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
  parent.appendChild(field(key, select, '', helpCtxOf(ctx, () => select.value)));
}

function renderValue(parent, key, value, sample, setValue, ctx, holder, isRootId, opts) {
  const fullWidth = !!(opts && opts.fullWidth);
  const hideTitle = !!(opts && opts.hideTitle);
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
    note.textContent = toReadableLabel(key) + ': (none)';
    parent.appendChild(note);
    return;
  }
  // Vehicle turn / accel keys must stay number inputs even if a stale string leaked in.
  const FORCE_NUMBER = {
    turnRateRadPerSec: true,
    speedBase: true,
    speedMax: true,
    accel: true,
    brake: true,
    ramSpeedMin: true,
    ramDamage: true,
    ramCooldownSec: true,
    mobilityHpRatio: true,
    mobilityRepairChance: true,
    brokenClearSec: true,
  };
  if (FORCE_NUMBER[key] && typeof value !== 'number') {
    value = Number(value);
    if (!isFinite(value)) value = 0;
    if (holder) holder[key] = value;
  }
  if (typeof value === 'number') {
    const numberClass = fullWidth ? '' : 'is-short';
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
      parent.appendChild(field(key, select, numberClass, helpCtxOf(ctx, () => select.value)));
      return;
    }
    if (key === 'speed' || key === 'bulletSpeedPxSec') {
      const input = document.createElement('input');
      input.type = 'number';
      input.min = String(SPEED_BLOCKS_MIN);
      input.max = String(SPEED_BLOCKS_MAX);
      input.step = '0.01';
      const blocks = worldSpeedToBlocks(value);
      input.value = String(Number(blocks.toFixed(4)));
      input.title = 'Blocks per second (1 block = ' + (L3_SIZE || 64) + 'px)';
      input.addEventListener('change', () => {
        let b = Number(input.value);
        if (!isFinite(b) || b <= 0) b = SPEED_BLOCKS_MIN;
        b = Math.max(SPEED_BLOCKS_MIN, Math.min(SPEED_BLOCKS_MAX, b));
        input.value = String(b);
        setValue(blocksToWorldSpeed(b));
      });
      const label =
        key === 'bulletSpeedPxSec' ? 'Bullet Spd (blocks/s)' : 'Speed (blocks/s)';
      const lab = field(label, input, numberClass, helpCtxOf(ctx, () => input.value));
      parent.appendChild(lab);
      return;
    }
    if (key === 'turnRateRadPerSec') {
      const input = document.createElement('input');
      input.type = 'number';
      input.step = '0.01';
      input.min = '0';
      input.value = String(value);
      input.addEventListener('change', () => {
        let next = Number(input.value);
        if (!isFinite(next) || next < 0) next = 0;
        input.value = String(next);
        setValue(next);
      });
      parent.appendChild(field(key, input, numberClass, helpCtxOf(ctx, () => input.value)));
      return;
    }
    if (key === 'priorityScore') {
      const input = document.createElement('input');
      input.type = 'number';
      input.min = String(PRIORITY_MIN);
      input.max = String(PRIORITY_MAX);
      input.step = '1';
      input.value = String(clampPriority(value));
      input.addEventListener('change', () => {
        const next = clampPriority(input.value);
        input.value = String(next);
        setValue(next);
      });
      parent.appendChild(field(key, input, numberClass, helpCtxOf(ctx, () => input.value)));
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
      parent.appendChild(field(key, input, numberClass, helpCtxOf(ctx)));
      return;
    }
    const input = document.createElement('input');
    input.type = 'number';
    const minVal = opts && typeof opts.minVal === 'number' ? opts.minVal : null;
    if (minVal != null) input.min = String(minVal);
    input.value = String(minVal != null ? Math.max(minVal, Number(value) || minVal) : value);
    input.addEventListener('change', () => {
      let next = Number(input.value);
      if (!isFinite(next)) next = minVal != null ? minVal : 0;
      if (minVal != null) {
        next = Math.max(minVal, Math.round(next));
        input.value = String(next);
      }
      setValue(next);
    });
    parent.appendChild(field(key, input, numberClass, helpCtxOf(ctx, () => input.value)));
    return;
  }
  if (typeof value === 'boolean') {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = value;
    input.addEventListener('change', () => setValue(input.checked));
    parent.appendChild(field(key, input, 'is-short', helpCtxOf(ctx, () => String(input.checked))));
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
      parent.appendChild(field(key, input, '', helpCtxOf(ctx, () => input.value)));
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
      parent.appendChild(field(key, select, '', helpCtxOf(ctx, () => select.value)));
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
      parent.appendChild(field(key, input, '', helpCtxOf(ctx, () => input.value)));
      return;
    }
    const options = ctx.choices(key, value);
    const artTrailKeys = {
      artId: true,
      bulletArtId: true,
      shotFrameArtId: true,
      modelId: true,
    };
    if (artTrailKeys[key] && ctx.choices) {
      const ids = (options || []).filter(Boolean);
      const picker = buildCatalogListPicker({
        ids,
        value: value || '',
        allowEmpty: true,
        emptyLabel: '(none)',
        formatId: (id) => id,
        onChange: (id) => setValue(id),
        onHoverId: (id) => {
          if (ctx.trailPreview) ctx.trailPreview('artGroup', id);
        },
        onHoverEnd: () => {
          if (ctx.trailRelease) ctx.trailRelease();
        },
      });
      parent.appendChild(field(key, picker, '', helpCtxOf(ctx, () => value || '')));
      return;
    }
    if (key === 'previewHost') {
      const select = document.createElement('select');
      ['unit', 'empty'].forEach((opt) => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt === 'unit' ? 'Unit + weapon' : 'Weapon only';
        select.appendChild(option);
      });
      select.value = value === 'empty' ? 'empty' : 'unit';
      select.addEventListener('change', () => setValue(select.value));
      parent.appendChild(field(key, select, '', helpCtxOf(ctx, () => select.value)));
      return;
    }
    const select = document.createElement('select');
    const seen = {};
    if (!value) {
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = '(none)';
      select.appendChild(blank);
      seen[''] = true;
    }
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
    select.value = value || '';
    select.addEventListener('change', () => setValue(select.value));
    parent.appendChild(field(key, select, '', helpCtxOf(ctx, () => select.value)));
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
    if (!hideTitle) {
      const title = document.createElement('p');
      title.className = 'editor-note';
      title.textContent = toReadableLabel(key);
      block.appendChild(title);
    }
    const itemSample = Array.isArray(sample) && sample.length ? sample[0] : list[0];
    const itemList = key === 'startingLoadout' || key === 'generatorList' || isItemRow(itemSample) || (list[0] && isItemRow(list[0]));
    const kind = itemList ? 'item' : list.length ? typeof list[0] : itemSample == null ? 'string' : typeof itemSample;
    const skillList = key === 'skills' || key === 'activeSkills';
    if (kind === 'string') {
      if (skillList && list.length) {
        lineHead(block, [
          { text: 'Skill', kind: 'is-grow' },
          { text: '', kind: 'is-danger-slot' },
        ], true);
      }
      for (let i = 0; i < list.length; i++) {
        const line = document.createElement('div');
        line.className = 'editor-line is-compact-row';
        const select = document.createElement('select');
        fillSelect(select, childCtx.choices(key, list[i]), list[i], skillList);
        select.addEventListener('change', () => {
          list[i] = select.value;
          childCtx.touch(true);
        });
        line.appendChild(field('', select, 'is-grow'));
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'editor-btn-danger';
        remove.textContent = '×';
        remove.title = 'Remove';
        remove.setAttribute('aria-label', 'Remove');
        remove.addEventListener('click', () => {
          list.splice(i, 1);
          childCtx.touch(true);
        });
        line.appendChild(remove);
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
      const headSample =
        key === 'startingLoadout'
          ? Object.assign({}, list[0] || { itemId: '', count: 1 }, { active: false })
          : list[0];
      if (headSample) lineHead(block, itemHead(headSample), true);
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
        remove.className = 'is-delete-record';
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
    const addMap = {
      startingLoadout: 'Add Item',
      skills: 'Add Skill',
      activeSkills: 'Add Skill',
      allowedGoals: 'Add Goal',
      targetPriorityList: 'Add Priority',
      generatorList: 'Add Output',
    };
    add.textContent = addMap[key] || ('Add ' + toReadableLabel(key));
    add.addEventListener('click', () => {
      if (skillList && list.length >= 3) return;
      if (key === 'generatorList' && list.length >= GEN_OUTPUT_CAP) return;
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
    if (key === 'generatorList') {
      add.disabled = list.length >= GEN_OUTPUT_CAP;
      add.title = 'Max ' + GEN_OUTPUT_CAP + ' generator outputs';
    }
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
    title.textContent = toReadableLabel(key);
    block.appendChild(title);
    const nextOpts = key === 'footprint' ? { minVal: 1 } : undefined;
    renderObject(block, target, sample && typeof sample === 'object' ? sample : {}, childCtx, false, nextOpts);
    parent.appendChild(block);
  }
}

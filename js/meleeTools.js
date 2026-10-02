/**
 * Unified melee tool matrix — axe vs wrench outcomes.
 * Shared swing pipeline: open collider → close → cooldown (tools + fist).
 * Wrench repairs friendly BLOCK / TURRET only; never heals living units.
 */

import { TEAM, getItemDef, getToolHarvestMult, L3_SIZE } from './config.js';

export const MeleeToolRole = Object.freeze({
  HARVEST_AXE: 'HARVEST_AXE',
  REPAIR_WRENCH: 'REPAIR_WRENCH',
});

export function getMeleeToolRole(itemId) {
  const def = getItemDef(itemId);
  if (!def) return null;
  if (def.meleeRole) return def.meleeRole;
  if (def.id === 'TOOL_WRENCH') return MeleeToolRole.REPAIR_WRENCH;
  if (def.kind === 'TOOL') return MeleeToolRole.HARVEST_AXE;
  return null;
}

/**
 * Resolve one tool swing against an overlapping block.
 * @returns {{ kind: 'damage'|'repair'|'skip', amount?: number, reason?: string }}
 */
export function resolveMeleeVsBlock(attackerTeam, toolDef, block) {
  if (!toolDef || !block || !block.alive) {
    return { kind: 'skip', reason: 'invalid' };
  }
  const role = toolDef.meleeRole || getMeleeToolRole(toolDef.id);
  const sameTeam =
    block.team === attackerTeam ||
    (attackerTeam === TEAM.PLAYER && block.team === TEAM.PLAYER);

  if (role === MeleeToolRole.REPAIR_WRENCH) {
    // Friendly structures / turrets / base only — not harvestables, not units.
    if (block.isHarvest) return { kind: 'skip', reason: 'not_structure' };
    if (!sameTeam) return { kind: 'skip', reason: 'enemy_structure' };
    if (block.hp >= block.maxHp) return { kind: 'skip', reason: 'full_hp' };
    const amount = toolDef.repairAmount != null ? toolDef.repairAmount : 40;
    return { kind: 'repair', amount };
  }

  // Axe / default harvest tool
  if (block.isHarvest) {
    let dmg = toolDef.harvestDamage || 20;
    const mult = getToolHarvestMult(
      toolDef.toolTier || 'TIER0',
      block.harvestKind
    );
    if (mult <= 0) return { kind: 'skip', reason: 'wrong_tool_tier' };
    return { kind: 'damage', amount: dmg * mult };
  }

  // Structure breaker vs enemy (or any non-friendly) placeables.
  if (sameTeam) {
    // Own walls: axe still damages (existing TOOL path) — keep for demolition.
    const dmg =
      toolDef.structureDamage != null
        ? toolDef.structureDamage
        : toolDef.harvestDamage || 20;
    return { kind: 'damage', amount: dmg };
  }
  const breaker =
    toolDef.structureDamage != null
      ? toolDef.structureDamage
      : (toolDef.harvestDamage || 20) * 1.5;
  return { kind: 'damage', amount: breaker };
}

/** Fist / bare melee vs living unit. */
export function resolveFistVsUnit(baseDamage, meleeMultiplier) {
  const mult = typeof meleeMultiplier === 'number' ? meleeMultiplier : 1;
  return { kind: 'damage', amount: (baseDamage || 18) * mult };
}

/** Wrench never damages / heals living units. Tools do not hit units (fist does). */
export function resolveMeleeVsUnit(toolDef, _unit) {
  const role =
    (toolDef && toolDef.meleeRole) ||
    (toolDef && getMeleeToolRole(toolDef.id));
  if (role === MeleeToolRole.REPAIR_WRENCH) {
    return { kind: 'skip', reason: 'wrench_no_units' };
  }
  return { kind: 'skip', reason: 'tool_vs_unit_unsupported' };
}

export function applyBlockRepair(block, amount) {
  if (!block || !block.alive || amount <= 0) return 0;
  const before = block.hp;
  block.hp = Math.min(block.maxHp, block.hp + amount);
  return block.hp - before;
}

/** Runtime swing state on a unit (shared fist + tool). */
export function createMeleeSwingState() {
  return {
    active: false,
    activeTimer: 0,
    cooldownTimer: 0,
    applied: false,
    source: null,
    toolId: null,
    damage: 18,
    hitUnits: true,
    hitBlocks: true,
    vfxSize: Math.round(L3_SIZE * 0.85),
    color: '#e8dcc0',
    cooldownAfterSec: 0.3,
  };
}

export function ensureMeleeSwing(unit) {
  if (!unit) return null;
  if (!unit.meleeSwing) unit.meleeSwing = createMeleeSwingState();
  return unit.meleeSwing;
}

/**
 * Begin open-window melee. Fails if already active or on cooldown.
 * @returns {boolean}
 */
export function tryBeginMeleeSwing(unit, opts = {}) {
  const sw = ensureMeleeSwing(unit);
  if (!sw) return false;
  if (sw.active || sw.cooldownTimer > 0) return false;

  sw.active = true;
  sw.activeTimer =
    typeof opts.activeDurationSec === 'number' ? opts.activeDurationSec : 0.1;
  sw.cooldownAfterSec =
    typeof opts.cooldownSec === 'number' ? opts.cooldownSec : 0.3;
  sw.applied = false;
  sw.source = opts.source || 'FIST';
  sw.toolId = opts.toolId || null;
  sw.damage = opts.damage != null ? opts.damage : 18;
  sw.hitUnits = opts.hitUnits !== false;
  sw.hitBlocks = opts.hitBlocks !== false;
  sw.vfxSize = Math.min(
    L3_SIZE,
    opts.vfxSize != null ? opts.vfxSize : Math.round(L3_SIZE * 0.85)
  );
  sw.color = opts.color || '#e8dcc0';
  return true;
}

/**
 * Advance swing timers. Returns true once when window just opened (apply hits).
 */
export function tickMeleeSwing(unit, dt) {
  const sw = unit && unit.meleeSwing;
  if (!sw) return false;

  let shouldApply = false;
  if (sw.active) {
    if (!sw.applied) {
      sw.applied = true;
      shouldApply = true;
    }
    sw.activeTimer -= dt;
    if (sw.activeTimer <= 0) {
      sw.active = false;
      sw.activeTimer = 0;
      sw.cooldownTimer = sw.cooldownAfterSec || 0;
    }
  } else if (sw.cooldownTimer > 0) {
    sw.cooldownTimer = Math.max(0, sw.cooldownTimer - dt);
  }
  return shouldApply;
}

export function isMeleeSwingOpen(unit) {
  return !!(unit && unit.meleeSwing && unit.meleeSwing.active);
}

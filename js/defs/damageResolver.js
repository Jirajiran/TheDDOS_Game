/**
 * DamageResolver — pure DOP: amount × matrix[damageType][armorType] → hpDelta.
 * Callers never hardcode weapon names; only types + amounts from definitions.
 */

import { getArmorTypes } from './registry.js';

let _matrix = Object.create(null);

/** Live table. Empty until installDamageMatrix (data/pack/damage_matrix.json). */
export let DAMAGE_MULT_TABLE = Object.freeze(Object.create(null));

/**
 * @param {object} matrixDoc — { matrix: { DAMAGE: { ARMOR: number } } } or bare table
 */
export function installDamageMatrix(matrixDoc) {
  const src = (matrixDoc && matrixDoc.matrix) || matrixDoc;
  if (!src || typeof src !== 'object') {
    throw new Error('Damage matrix not loaded (data/pack/damage_matrix.json)');
  }
  const next = Object.create(null);
  const rows = Object.keys(src);
  for (let i = 0; i < rows.length; i++) {
    const dt = rows[i];
    const row = src[dt] || {};
    const frozenRow = Object.create(null);
    const cols = Object.keys(row);
    for (let j = 0; j < cols.length; j++) {
      frozenRow[cols[j]] = row[cols[j]];
    }
    next[dt] = Object.freeze(frozenRow);
  }
  _matrix = Object.freeze(next);
  DAMAGE_MULT_TABLE = _matrix;
}

export function seedDamageMatrixFromTable(table) {
  installDamageMatrix({ matrix: table });
}

export function getDamageMult(damageType, armorType) {
  const row = _matrix[damageType] || _matrix.DEFAULT;
  if (!row) {
    throw new Error('Damage matrix not loaded (data/pack/damage_matrix.json)');
  }
  const mult = row[armorType];
  return typeof mult === 'number' ? mult : 1;
}

/**
 * @param {{ damageType?: string, amount: number, armorType?: string }} input
 * @returns {{ hpDelta: number, mult: number, flags: object }}
 */
export function resolveDamage(input) {
  const amount = input && typeof input.amount === 'number' ? input.amount : 0;
  const damageType = (input && input.damageType) || 'DEFAULT';
  const armorType = (input && input.armorType) || 'DEFAULT';
  const mult = getDamageMult(damageType, armorType);
  const hpDelta = amount * mult;
  return {
    hpDelta,
    mult,
    flags: Object.freeze({
      damageType,
      armorType,
      knownArmor: getArmorTypes().indexOf(armorType) >= 0,
    }),
  };
}

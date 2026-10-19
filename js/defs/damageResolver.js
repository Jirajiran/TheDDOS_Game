/**
 * DamageResolver — pure DOP: amount × matrix[damageType][armorType] → hpDelta.
 * Callers never hardcode weapon names; only types + amounts from definitions.
 */

import { getArmorTypes } from './registry.js';

let _matrix = Object.create(null);

const FALLBACK_MATRIX = Object.freeze({
  DEFAULT: Object.freeze({
    DEFAULT: 1.0,
    BULLET: 1.25,
    EXPLOSION: 0.9,
    LAZER: 0.75,
  }),
  BULLET: Object.freeze({
    DEFAULT: 1.25,
    BULLET: 0.75,
    EXPLOSION: 0.85,
    LAZER: 0.5,
  }),
  EXPLOSION: Object.freeze({
    DEFAULT: 1.4,
    BULLET: 0.9,
    EXPLOSION: 0.7,
    LAZER: 0.8,
  }),
  LAZER: Object.freeze({
    DEFAULT: 1.6,
    BULLET: 1.4,
    EXPLOSION: 1.1,
    LAZER: 0.6,
  }),
});

/**
 * @param {object} matrixDoc — { matrix: { DAMAGE: { ARMOR: number } } } or bare table
 */
export function installDamageMatrix(matrixDoc) {
  const src =
    (matrixDoc && matrixDoc.matrix) || matrixDoc || FALLBACK_MATRIX;
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
}

export function seedDamageMatrixFromTable(table) {
  installDamageMatrix({ matrix: table });
}

export function getDamageMult(damageType, armorType) {
  const row = _matrix[damageType] || _matrix.DEFAULT || FALLBACK_MATRIX.DEFAULT;
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

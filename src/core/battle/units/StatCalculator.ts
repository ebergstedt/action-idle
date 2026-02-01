/**
 * Stat Calculator
 *
 * Pure functions for computing final unit stats from base stats and modifiers.
 * Uses the modifier formula: (Base + Flat) * (1 + SumOfPercents) * Product(Multipliers)
 *
 * Godot-portable: No React/browser dependencies.
 */

import { ActiveModifier, StatTarget } from '../modifiers/types';
import { calculateModifiedStat, groupModifiersByTarget } from '../modifiers/ModifierCalculator';
import { AttackModeStats, BaseStats, ComputedStats } from './types';

/**
 * Maps a stat target to its base value from BaseStats.
 */
function getBaseValue(baseStats: BaseStats, target: StatTarget): number {
  switch (target) {
    case 'maxHealth':
      return baseStats.maxHealth;
    case 'moveSpeed':
      return baseStats.moveSpeed;
    case 'armor':
      return baseStats.armor;
    case 'melee.damage':
      return baseStats.melee?.damage ?? 0;
    case 'melee.attackSpeed':
      return baseStats.melee?.attackSpeed ?? 0;
    case 'melee.range':
      return baseStats.melee?.range ?? 0;
    case 'ranged.damage':
      return baseStats.ranged?.damage ?? 0;
    case 'ranged.attackSpeed':
      return baseStats.ranged?.attackSpeed ?? 0;
    case 'ranged.range':
      return baseStats.ranged?.range ?? 0;
    default:
      return 0;
  }
}

/**
 * Computes a single stat value with modifiers applied.
 */
export function computeStat(
  baseStats: BaseStats,
  target: StatTarget,
  modifiers: ActiveModifier[]
): number {
  const baseValue = getBaseValue(baseStats, target);
  const result = calculateModifiedStat(baseValue, modifiers);
  return result.final;
}

/**
 * Computes an attack mode's stats with modifiers applied.
 * Returns null if the base attack mode is null.
 */
export function computeAttackMode(
  base: AttackModeStats | null,
  prefix: 'melee' | 'ranged',
  modifiersByTarget: Record<string, ActiveModifier[]>
): AttackModeStats | null {
  if (!base) return null;

  const damageModifiers = modifiersByTarget[`${prefix}.damage`] ?? [];
  const speedModifiers = modifiersByTarget[`${prefix}.attackSpeed`] ?? [];
  const rangeModifiers = modifiersByTarget[`${prefix}.range`] ?? [];

  return {
    damage: calculateModifiedStat(base.damage, damageModifiers).final,
    attackSpeed: calculateModifiedStat(base.attackSpeed, speedModifiers).final,
    range: calculateModifiedStat(base.range, rangeModifiers).final,
  };
}

/**
 * Computes all stats from base stats and active modifiers.
 */
export function computeAllStats(baseStats: BaseStats, modifiers: ActiveModifier[]): ComputedStats {
  const grouped = groupModifiersByTarget(modifiers);

  return {
    maxHealth: calculateModifiedStat(baseStats.maxHealth, grouped['maxHealth'] ?? []).final,
    moveSpeed: calculateModifiedStat(baseStats.moveSpeed, grouped['moveSpeed'] ?? []).final,
    armor: calculateModifiedStat(baseStats.armor, grouped['armor'] ?? []).final,
    melee: computeAttackMode(baseStats.melee, 'melee', grouped),
    ranged: computeAttackMode(baseStats.ranged, 'ranged', grouped),
  };
}

/**
 * Creates a deep copy of BaseStats.
 */
export function cloneBaseStats(stats: BaseStats): BaseStats {
  return {
    maxHealth: stats.maxHealth,
    moveSpeed: stats.moveSpeed,
    armor: stats.armor,
    melee: stats.melee
      ? {
          damage: stats.melee.damage,
          attackSpeed: stats.melee.attackSpeed,
          range: stats.melee.range,
        }
      : null,
    ranged: stats.ranged
      ? {
          damage: stats.ranged.damage,
          attackSpeed: stats.ranged.attackSpeed,
          range: stats.ranged.range,
        }
      : null,
  };
}

/**
 * Calculates effective damage after armor reduction.
 * Simple flat reduction for now, could be percentage-based later.
 */
export function calculateDamageAfterArmor(damage: number, armor: number): number {
  return Math.max(1, damage - armor);
}

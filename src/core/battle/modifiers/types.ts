/**
 * Modifier System Types
 *
 * Modifiers change unit stats from various sources (upgrades, abilities, equipment).
 * They support different stacking behaviors and application orders.
 *
 * Godot-portable: No React/browser dependencies.
 */

/**
 * Valid stat targets for modifiers.
 * Supports both top-level stats and nested attack mode stats.
 */
export type StatTarget =
  | 'maxHealth'
  | 'moveSpeed'
  | 'armor'
  | 'melee.damage'
  | 'melee.attackSpeed'
  | 'melee.range'
  | 'ranged.damage'
  | 'ranged.attackSpeed'
  | 'ranged.range';

/**
 * How the modifier value is applied to the stat.
 * - flat: Added directly to base value
 * - percent: Multiplied as (1 + value), e.g., 0.1 = +10%
 * - multiply: Direct multiplier, e.g., 1.5 = 150% of previous value
 */
export type ModifierType = 'flat' | 'percent' | 'multiply';

/**
 * Where the modifier comes from, used for filtering/debugging.
 */
export type ModifierSource = 'upgrade' | 'ability' | 'equipment' | 'buff' | 'debuff' | 'innate';

/**
 * A modifier definition - the template for stat changes.
 * Can be reused across multiple sources (upgrades, abilities).
 */
export interface Modifier {
  /** Unique identifier for this modifier type */
  id: string;

  /** Which stat this modifier affects */
  target: StatTarget;

  /** How the value is applied */
  type: ModifierType;

  /** The modifier value (interpretation depends on type) */
  value: number;

  /**
   * Optional stacking group. Modifiers in the same group don't stack;
   * only the highest value applies. If undefined, stacks normally.
   */
  stackingGroup?: string;
}

/**
 * An active modifier instance on a unit.
 * Tracks the source, remaining duration, and stacking info.
 */
export interface ActiveModifier {
  /** Reference to the modifier definition */
  modifier: Modifier;

  /** What applied this modifier */
  source: ModifierSource;

  /** Unique ID of the source (upgrade ID, ability ID, etc.) */
  sourceId: string;

  /**
   * Remaining duration in seconds. If undefined, the modifier is permanent
   * (e.g., from upgrades or innate abilities).
   */
  duration?: number;

  /**
   * Number of stacks for stackable modifiers.
   * The modifier value is multiplied by this.
   */
  stacks: number;

  /** Timestamp when this modifier was applied (for ordering) */
  appliedAt: number;
}

/**
 * Grouped modifiers by stat target, ready for calculation.
 */
export interface ModifiersByTarget {
  [target: string]: ActiveModifier[];
}

/**
 * Result of modifier calculation for a single stat.
 */
export interface ModifierResult {
  /** The base value before modifiers */
  base: number;

  /** Total flat bonus */
  flatBonus: number;

  /** Total percent bonus (as decimal, e.g., 0.25 for +25%) */
  percentBonus: number;

  /** Total multiplier (product of all multiply modifiers) */
  multiplier: number;

  /** Final computed value */
  final: number;
}

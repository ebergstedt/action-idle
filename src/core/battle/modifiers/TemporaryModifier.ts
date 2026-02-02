/**
 * Temporary Modifier Types
 *
 * Interfaces for runtime buffs/debuffs applied during battle.
 * Separate from the upgrade modifier system - these are for combat effects.
 *
 * Godot-portable: No React/browser dependencies.
 */

import { UnitTeam } from '../units/types';

/**
 * Temporary modifier (buff/debuff) applied to a unit.
 * Modifiers have a duration and modify stats multiplicatively.
 *
 * Buff vs Debuff is determined by sourceTeam:
 * - If sourceTeam matches unit's team → buff (friendly effect)
 * - If sourceTeam differs from unit's team → debuff (enemy effect)
 */
export interface TemporaryModifier {
  /** Unique ID for this modifier instance */
  id: string;
  /** Source identifier (e.g., 'castle_death_shockwave', 'melee_engagement') */
  sourceId: string;
  /** Team that applied this modifier (determines buff vs debuff) */
  sourceTeam: UnitTeam;
  /** Movement speed modifier (-0.5 = -50% speed) */
  moveSpeedMod: number;
  /** Damage modifier (-0.5 = -50% damage) */
  damageMod: number;
  /** Collision size modifier (0.2 = +20% collision box, does not affect visual) */
  collisionSizeMod: number;
  /** Remaining duration in seconds */
  remainingDuration: number;
  /**
   * If set, this modifier is automatically removed when the linked unit dies.
   * Used for melee engagement debuffs - attacker's debuff is cleared when defender dies.
   */
  linkedUnitId?: string;
}

/**
 * A modifier waiting to be applied after a delay.
 */
export interface PendingModifier {
  /** The modifier to apply */
  modifier: TemporaryModifier;
  /** Time remaining before application (seconds) */
  delay: number;
}

// Note: ModifierRenderData is defined in ../types.ts for consistency with other render data types

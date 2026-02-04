/**
 * Ability System Types
 *
 * Defines passive abilities and triggered effects.
 * No active skills - all abilities are automatic based on triggers.
 *
 * Godot-portable: No React/browser dependencies.
 */

import { Modifier } from '../modifiers/types';

/**
 * When an ability can trigger.
 */
export type TriggerType =
  | 'on_hit' // When this unit deals damage
  | 'on_take_damage' // When this unit takes damage
  | 'on_kill' // When this unit kills an enemy
  | 'on_death' // When this unit dies
  | 'on_spawn' // When this unit spawns
  | 'on_battle_start' // When battle begins
  | 'health_below' // When health drops below threshold
  | 'health_above' // When health is above threshold
  | 'periodic' // Every X seconds
  | 'on_ability_trigger'; // When another ability triggers (chaining)

/**
 * Condition that must be met for the trigger to fire.
 */
export interface TriggerCondition {
  type: TriggerType;

  /** For health_below/health_above: threshold as percentage (0-1) */
  healthThreshold?: number;

  /** For periodic: interval in seconds */
  interval?: number;

  /** For on_ability_trigger: which ability must trigger */
  abilityId?: string;
}

/**
 * Who the ability effect targets.
 */
export type EffectTarget =
  | 'self' // The unit with the ability
  | 'attacker' // Unit that hit us (for on_take_damage)
  | 'target' // Unit we're attacking/killed
  | 'all_allies' // All friendly units
  | 'all_enemies' // All enemy units
  | 'nearby_allies' // Allies within range
  | 'nearby_enemies' // Enemies within range
  | 'random_ally' // One random ally
  | 'random_enemy'; // One random enemy

/**
 * Types of effects an ability can have.
 */
export type EffectType =
  | 'damage' // Deal damage
  | 'heal' // Restore health
  | 'apply_modifier' // Apply a stat modifier
  | 'remove_modifier' // Remove modifiers by source
  | 'spawn_unit' // Spawn additional units
  | 'spawn_shockwave' // Spawn a shockwave effect
  | 'knockback' // Push targets away
  | 'pull'; // Pull targets closer

/**
 * Base interface for ability effects.
 */
export interface AbilityEffectBase {
  type: EffectType;
  target: EffectTarget;

  /** For nearby_* targets: range in pixels */
  range?: number;
}

/**
 * Damage effect.
 */
export interface DamageEffect extends AbilityEffectBase {
  type: 'damage';
  /** Fixed damage amount, or percentage of attacker's damage */
  amount: number;
  /** If true, amount is a percentage of normal attack damage */
  isPercentOfDamage?: boolean;
}

/**
 * Heal effect.
 */
export interface HealEffect extends AbilityEffectBase {
  type: 'heal';
  /** Fixed heal amount, or percentage of max health */
  amount: number;
  /** If true, amount is a percentage of max health */
  isPercentOfMaxHealth?: boolean;
}

/**
 * Apply modifier effect.
 */
export interface ApplyModifierEffect extends AbilityEffectBase {
  type: 'apply_modifier';
  modifier: Modifier;
  /** Duration in seconds (omit for permanent) */
  duration?: number;
  /** Maximum stacks if stackable */
  maxStacks?: number;
}

/**
 * Remove modifier effect.
 */
export interface RemoveModifierEffect extends AbilityEffectBase {
  type: 'remove_modifier';
  /** Source ID to remove modifiers from */
  sourceId: string;
}

/**
 * Spawn unit effect.
 */
export interface SpawnUnitEffect extends AbilityEffectBase {
  type: 'spawn_unit';
  /** Unit definition ID to spawn */
  unitId: string;
  /** Number of units to spawn */
  count: number;
}

/**
 * Knockback effect.
 */
export interface KnockbackEffect extends AbilityEffectBase {
  type: 'knockback';
  /** Distance to push in pixels */
  distance: number;
}

/**
 * Pull effect.
 */
export interface PullEffect extends AbilityEffectBase {
  type: 'pull';
  /** Distance to pull in pixels */
  distance: number;
}

/**
 * Spawn shockwave effect.
 * Creates a visual shockwave that applies modifiers to units in range.
 */
export interface SpawnShockwaveEffect extends AbilityEffectBase {
  type: 'spawn_shockwave';
  /** Which team to target with the shockwave effects */
  targetTeam: 'ally' | 'enemy' | 'both';
}

/**
 * Union of all effect types.
 */
export type AbilityEffect =
  | DamageEffect
  | HealEffect
  | ApplyModifierEffect
  | RemoveModifierEffect
  | SpawnUnitEffect
  | SpawnShockwaveEffect
  | KnockbackEffect
  | PullEffect;

/**
 * Ability Definition - loaded from JSON.
 */
export interface AbilityDefinition {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Description for tooltips */
  description: string;

  /** When this ability triggers */
  trigger: TriggerCondition;

  /** Cooldown in seconds (0 = no cooldown) */
  cooldown: number;

  /** Chance to trigger (0-1, 1 = always) */
  chance: number;

  /** Effects applied when triggered */
  effects: AbilityEffect[];

  /** Visual/audio cue identifier (for rendering) */
  visualEffect?: string;
}

/**
 * Context provided when processing ability triggers.
 */
export interface AbilityTriggerContext {
  /** The unit that has the ability */
  sourceUnitId: string;

  /** The trigger event type */
  triggerType: TriggerType;

  /** For damage events: unit that dealt/received damage */
  otherUnitId?: string;

  /** For damage events: amount of damage */
  damageAmount?: number;

  /** For kill events: unit that was killed */
  killedUnitId?: string;

  /** Current battle time in seconds */
  battleTime: number;
}

/**
 * Result of processing an ability trigger.
 */
export interface AbilityTriggerResult {
  /** Whether the ability triggered */
  triggered: boolean;

  /** Ability that triggered (if any) */
  abilityId?: string;

  /** Effects to apply */
  effects: ResolvedEffect[];

  /** New cooldown to set */
  cooldown?: number;
}

/**
 * An effect with resolved targets (unit IDs).
 */
export interface ResolvedEffect {
  effect: AbilityEffect;
  targetUnitIds: string[];
}

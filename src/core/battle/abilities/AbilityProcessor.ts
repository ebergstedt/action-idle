/**
 * Ability Processor
 *
 * Handles ability triggers, resolves targets, and applies effects.
 * This is the runtime engine for the ability system.
 *
 * Godot-portable: No React/browser dependencies.
 */

import { Vector2 } from '../../physics/Vector2';
import { UnitInstance } from '../units/types';
import {
  AbilityDefinition,
  AbilityEffect,
  AbilityTriggerContext,
  AbilityTriggerResult,
  ResolvedEffect,
  TriggerType,
} from './types';
import { AbilityRegistry } from './AbilityRegistry';

/**
 * Configuration for ability processing.
 */
export interface AbilityProcessorConfig {
  /** Random number generator for chance rolls (defaults to Math.random) */
  random?: () => number;
}

/**
 * State needed for ability processing.
 */
export interface AbilityProcessorState {
  /** All units in the battle */
  units: UnitInstance[];

  /** Current battle time in seconds */
  battleTime: number;
}

/**
 * Processes ability triggers and resolves effects.
 */
export class AbilityProcessor {
  private random: () => number;

  constructor(
    private registry: AbilityRegistry,
    config: AbilityProcessorConfig = {}
  ) {
    this.random = config.random ?? Math.random;
  }

  /**
   * Processes a trigger event for a unit, checking all active abilities.
   *
   * @param unitId - The unit that might have triggered abilities
   * @param abilityIds - The ability IDs the unit has
   * @param cooldowns - Current cooldowns for the unit's abilities
   * @param triggerType - The type of trigger event
   * @param context - Additional context for the trigger
   * @param state - Current battle state
   * @returns Array of trigger results for abilities that fired
   */
  processTrigger(
    unitId: string,
    abilityIds: string[],
    cooldowns: Record<string, number>,
    triggerType: TriggerType,
    context: Partial<AbilityTriggerContext>,
    state: AbilityProcessorState
  ): AbilityTriggerResult[] {
    const results: AbilityTriggerResult[] = [];

    // Get abilities that match this trigger type
    const abilities = this.registry.getMany(abilityIds);

    for (const ability of abilities) {
      // Check if trigger type matches
      if (ability.trigger.type !== triggerType) continue;

      // Check cooldown
      const currentCooldown = cooldowns[ability.id] ?? 0;
      if (currentCooldown > 0) continue;

      // Check trigger conditions
      if (!this.checkTriggerCondition(ability, unitId, state)) continue;

      // Roll for chance
      if (ability.chance < 1 && this.random() > ability.chance) continue;

      // Resolve targets and create effects
      const fullContext: AbilityTriggerContext = {
        sourceUnitId: unitId,
        triggerType,
        battleTime: state.battleTime,
        ...context,
      };

      const resolvedEffects = this.resolveEffects(ability, fullContext, state);

      results.push({
        triggered: true,
        abilityId: ability.id,
        effects: resolvedEffects,
        cooldown: ability.cooldown > 0 ? ability.cooldown : undefined,
      });
    }

    return results;
  }

  /**
   * Checks if a trigger condition is met.
   */
  private checkTriggerCondition(
    ability: AbilityDefinition,
    unitId: string,
    state: AbilityProcessorState
  ): boolean {
    const trigger = ability.trigger;
    const unit = state.units.find((u) => u.id === unitId);
    if (!unit) return false;

    switch (trigger.type) {
      case 'health_below': {
        const threshold = trigger.healthThreshold ?? 0.25;
        const healthPercent = unit.currentHealth / unit.computedStats.maxHealth;
        return healthPercent <= threshold;
      }
      case 'health_above': {
        const threshold = trigger.healthThreshold ?? 0.75;
        const healthPercent = unit.currentHealth / unit.computedStats.maxHealth;
        return healthPercent >= threshold;
      }
      default:
        // Most triggers don't have additional conditions
        return true;
    }
  }

  /**
   * Resolves effects with their target unit IDs.
   */
  private resolveEffects(
    ability: AbilityDefinition,
    context: AbilityTriggerContext,
    state: AbilityProcessorState
  ): ResolvedEffect[] {
    return ability.effects.map((effect) => ({
      effect,
      targetUnitIds: this.resolveTargets(effect, context, state),
    }));
  }

  /**
   * Resolves target unit IDs for an effect.
   */
  private resolveTargets(
    effect: AbilityEffect,
    context: AbilityTriggerContext,
    state: AbilityProcessorState
  ): string[] {
    const sourceUnit = state.units.find((u) => u.id === context.sourceUnitId);
    if (!sourceUnit) return [];

    const sourceTeam = sourceUnit.team;

    switch (effect.target) {
      case 'self':
        return [context.sourceUnitId];

      case 'attacker':
        return context.otherUnitId ? [context.otherUnitId] : [];

      case 'target':
        return context.otherUnitId ? [context.otherUnitId] : [];

      case 'all_allies':
        return state.units.filter((u) => u.team === sourceTeam).map((u) => u.id);

      case 'all_enemies':
        return state.units.filter((u) => u.team !== sourceTeam).map((u) => u.id);

      case 'nearby_allies': {
        const range = effect.range ?? 100;
        return state.units
          .filter(
            (u) =>
              u.team === sourceTeam && this.getDistance(sourceUnit.position, u.position) <= range
          )
          .map((u) => u.id);
      }

      case 'nearby_enemies': {
        const range = effect.range ?? 100;
        return state.units
          .filter(
            (u) =>
              u.team !== sourceTeam && this.getDistance(sourceUnit.position, u.position) <= range
          )
          .map((u) => u.id);
      }

      case 'random_ally': {
        const allies = state.units.filter(
          (u) => u.team === sourceTeam && u.id !== context.sourceUnitId
        );
        if (allies.length === 0) return [];
        const index = Math.floor(this.random() * allies.length);
        return [allies[index].id];
      }

      case 'random_enemy': {
        const enemies = state.units.filter((u) => u.team !== sourceTeam);
        if (enemies.length === 0) return [];
        const index = Math.floor(this.random() * enemies.length);
        return [enemies[index].id];
      }

      default:
        return [];
    }
  }

  /**
   * Calculates distance between two positions.
   */
  private getDistance(a: Vector2, b: Vector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Updates ability cooldowns for a unit.
   *
   * @param cooldowns - Current cooldowns
   * @param delta - Time elapsed in seconds
   * @returns Updated cooldowns (only non-zero values)
   */
  tickCooldowns(cooldowns: Record<string, number>, delta: number): Record<string, number> {
    const updated: Record<string, number> = {};

    for (const [abilityId, remaining] of Object.entries(cooldowns)) {
      const newRemaining = remaining - delta;
      if (newRemaining > 0) {
        updated[abilityId] = newRemaining;
      }
    }

    return updated;
  }

  /**
   * Sets a cooldown for an ability.
   */
  setCooldown(
    cooldowns: Record<string, number>,
    abilityId: string,
    duration: number
  ): Record<string, number> {
    return {
      ...cooldowns,
      [abilityId]: duration,
    };
  }
}

/**
 * Creates an AbilityProcessor with the provided registry.
 */
export function createAbilityProcessor(
  registry: AbilityRegistry,
  config?: AbilityProcessorConfig
): AbilityProcessor {
  return new AbilityProcessor(registry, config);
}

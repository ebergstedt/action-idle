/**
 * Modifier Calculator
 *
 * Pure functions for computing final stat values from base values and modifiers.
 * Uses the formula: (Base + Flat) * (1 + SumOfPercents) * Product(Multipliers)
 *
 * Godot-portable: No React/browser dependencies.
 */

import { ActiveModifier, Modifier, ModifierResult, ModifiersByTarget } from './types';

/**
 * Groups active modifiers by their target stat.
 */
export function groupModifiersByTarget(modifiers: ActiveModifier[]): ModifiersByTarget {
  const grouped: ModifiersByTarget = {};

  for (const active of modifiers) {
    const target = active.modifier.target;
    if (!grouped[target]) {
      grouped[target] = [];
    }
    grouped[target].push(active);
  }

  return grouped;
}

/**
 * Filters modifiers to handle non-stacking groups.
 * For modifiers in the same stacking group, only the highest value is kept.
 */
export function resolveStackingGroups(modifiers: ActiveModifier[]): ActiveModifier[] {
  const stackingGroups = new Map<string, ActiveModifier>();
  const result: ActiveModifier[] = [];

  for (const active of modifiers) {
    const group = active.modifier.stackingGroup;

    if (group) {
      const existing = stackingGroups.get(group);
      if (!existing) {
        stackingGroups.set(group, active);
      } else {
        // Keep the higher value (accounting for stacks)
        const existingValue = existing.modifier.value * existing.stacks;
        const newValue = active.modifier.value * active.stacks;
        if (newValue > existingValue) {
          stackingGroups.set(group, active);
        }
      }
    } else {
      // No stacking group - always include
      result.push(active);
    }
  }

  // Add the winners from each stacking group
  for (const active of stackingGroups.values()) {
    result.push(active);
  }

  return result;
}

/**
 * Calculates the final value for a stat given base value and modifiers.
 *
 * Formula: (Base + Flat) * (1 + SumOfPercents) * Product(Multipliers)
 *
 * @param base - The base stat value
 * @param modifiers - Active modifiers targeting this stat
 * @returns Breakdown of modifier application and final value
 */
export function calculateModifiedStat(base: number, modifiers: ActiveModifier[]): ModifierResult {
  // Resolve non-stacking groups first
  const resolved = resolveStackingGroups(modifiers);

  let flatBonus = 0;
  let percentBonus = 0;
  let multiplier = 1;

  for (const active of resolved) {
    const effectiveValue = active.modifier.value * active.stacks;

    switch (active.modifier.type) {
      case 'flat':
        flatBonus += effectiveValue;
        break;
      case 'percent':
        percentBonus += effectiveValue;
        break;
      case 'multiply':
        multiplier *= effectiveValue;
        break;
    }
  }

  // Apply formula: (Base + Flat) * (1 + Percent) * Multiply
  const afterFlat = base + flatBonus;
  const afterPercent = afterFlat * (1 + percentBonus);
  const final = afterPercent * multiplier;

  return {
    base,
    flatBonus,
    percentBonus,
    multiplier,
    final: Math.max(0, final), // Stats can't go negative
  };
}

/**
 * Updates modifier durations and removes expired ones.
 *
 * @param modifiers - Array of active modifiers
 * @param delta - Time elapsed in seconds
 * @returns Tuple of [remaining modifiers, expired modifiers]
 */
export function tickModifiers(
  modifiers: ActiveModifier[],
  delta: number
): [ActiveModifier[], ActiveModifier[]] {
  const remaining: ActiveModifier[] = [];
  const expired: ActiveModifier[] = [];

  for (const active of modifiers) {
    if (active.duration === undefined) {
      // Permanent modifier
      remaining.push(active);
    } else {
      const newDuration = active.duration - delta;
      if (newDuration > 0) {
        remaining.push({ ...active, duration: newDuration });
      } else {
        expired.push(active);
      }
    }
  }

  return [remaining, expired];
}

/**
 * Creates an active modifier from a modifier definition.
 */
export function createActiveModifier(
  modifier: Modifier,
  source: ActiveModifier['source'],
  sourceId: string,
  duration?: number,
  stacks: number = 1
): ActiveModifier {
  return {
    modifier,
    source,
    sourceId,
    duration,
    stacks,
    appliedAt: Date.now(),
  };
}

/**
 * Adds or stacks a modifier on an existing list.
 * If a modifier with the same ID and source exists, increases stacks.
 * Otherwise, adds a new modifier.
 *
 * @param modifiers - Current list of modifiers
 * @param newModifier - Modifier to add or stack
 * @param maxStacks - Maximum number of stacks (default: unlimited)
 * @returns New array with the modifier added/stacked
 */
export function addOrStackModifier(
  modifiers: ActiveModifier[],
  newModifier: ActiveModifier,
  maxStacks: number = Infinity
): ActiveModifier[] {
  const index = modifiers.findIndex(
    (m) => m.modifier.id === newModifier.modifier.id && m.sourceId === newModifier.sourceId
  );

  if (index === -1) {
    // New modifier
    return [...modifiers, newModifier];
  }

  // Stack existing
  const existing = modifiers[index];
  const newStacks = Math.min(existing.stacks + newModifier.stacks, maxStacks);

  const updated = [...modifiers];
  updated[index] = {
    ...existing,
    stacks: newStacks,
    // Refresh duration if the new modifier has one
    duration: newModifier.duration ?? existing.duration,
  };

  return updated;
}

/**
 * Removes modifiers by source ID.
 */
export function removeModifiersBySource(
  modifiers: ActiveModifier[],
  sourceId: string
): ActiveModifier[] {
  return modifiers.filter((m) => m.sourceId !== sourceId);
}

/**
 * Gets all modifiers of a specific source type.
 */
export function getModifiersBySourceType(
  modifiers: ActiveModifier[],
  source: ActiveModifier['source']
): ActiveModifier[] {
  return modifiers.filter((m) => m.source === source);
}

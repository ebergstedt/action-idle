/**
 * Modifier System
 *
 * Pure functions for modifier management: applying, ticking, removing modifiers.
 * Works with modifier arrays without mutating them.
 *
 * Godot equivalent: Modifier handling functions in a unit script.
 */

import { MIN_COLLISION_SIZE_MULTIPLIER } from '../BattleConfig';
import { TemporaryModifier, PendingModifier } from '../modifiers/TemporaryModifier';
import { UnitTeam } from '../types';

/**
 * Result of applying a modifier.
 */
export interface ApplyModifierResult {
  modifiers: TemporaryModifier[];
  wasRefreshed: boolean;
}

/**
 * Apply a modifier to the active modifiers list.
 * If a modifier with the same sourceId exists, refreshes duration instead of stacking.
 *
 * @param modifiers - Current active modifiers
 * @param newModifier - Modifier to apply
 * @returns New modifiers array and whether an existing modifier was refreshed
 */
export function applyModifier(
  modifiers: readonly TemporaryModifier[],
  newModifier: TemporaryModifier
): ApplyModifierResult {
  const existingIndex = modifiers.findIndex((m) => m.sourceId === newModifier.sourceId);

  if (existingIndex >= 0) {
    // Refresh duration instead of stacking
    const updated = [...modifiers];
    updated[existingIndex] = {
      ...updated[existingIndex],
      remainingDuration: Math.max(
        updated[existingIndex].remainingDuration,
        newModifier.remainingDuration
      ),
    };
    return { modifiers: updated, wasRefreshed: true };
  }

  return { modifiers: [...modifiers, newModifier], wasRefreshed: false };
}

/**
 * Result of ticking modifiers.
 */
export interface TickModifiersResult {
  modifiers: TemporaryModifier[];
  expiredCount: number;
}

/**
 * Tick all active modifiers, removing expired ones.
 *
 * @param modifiers - Current active modifiers
 * @param delta - Frame delta in seconds
 * @returns New modifiers array and count of expired modifiers
 */
export function tickModifiers(
  modifiers: readonly TemporaryModifier[],
  delta: number
): TickModifiersResult {
  const updated: TemporaryModifier[] = [];
  let expiredCount = 0;

  for (const mod of modifiers) {
    const newDuration = mod.remainingDuration - delta;
    if (newDuration > 0) {
      updated.push({ ...mod, remainingDuration: newDuration });
    } else {
      expiredCount++;
    }
  }

  return { modifiers: updated, expiredCount };
}

/**
 * Calculate movement speed after applying all active modifiers.
 * Modifiers are multiplicative: -0.9 means 10% of original speed.
 *
 * @param baseSpeed - Base movement speed
 * @param modifiers - Active modifiers
 * @returns Modified movement speed (minimum 0)
 */
export function calculateModifiedMoveSpeed(
  baseSpeed: number,
  modifiers: readonly TemporaryModifier[]
): number {
  let speed = baseSpeed;
  for (const mod of modifiers) {
    speed *= 1 + mod.moveSpeedMod;
  }
  return Math.max(0, speed);
}

/**
 * Calculate damage multiplier from all active modifiers.
 *
 * @param modifiers - Active modifiers
 * @returns Damage multiplier (minimum 0)
 */
export function calculateDamageMultiplier(modifiers: readonly TemporaryModifier[]): number {
  let mult = 1;
  for (const mod of modifiers) {
    mult *= 1 + mod.damageMod;
  }
  return Math.max(0, mult);
}

/**
 * Calculate collision size after applying all active modifiers.
 *
 * @param baseSize - Base unit size
 * @param modifiers - Active modifiers
 * @returns Modified collision size (minimum is MIN_COLLISION_SIZE_MULTIPLIER * baseSize)
 */
export function calculateCollisionSize(
  baseSize: number,
  modifiers: readonly TemporaryModifier[]
): number {
  let mult = 1;
  for (const mod of modifiers) {
    mult *= 1 + mod.collisionSizeMod;
  }
  return Math.max(baseSize * MIN_COLLISION_SIZE_MULTIPLIER, baseSize * mult);
}

/**
 * Check if a modifier from a specific source exists.
 *
 * @param modifiers - Active modifiers
 * @param sourceId - Source ID to check
 * @returns True if modifier exists
 */
export function hasModifierFromSource(
  modifiers: readonly TemporaryModifier[],
  sourceId: string
): boolean {
  return modifiers.some((m) => m.sourceId === sourceId);
}

/**
 * Remove all modifiers from a specific source.
 *
 * @param modifiers - Current active modifiers
 * @param sourceId - Source ID to remove
 * @returns New modifiers array and whether any were removed
 */
export function removeModifiersBySource(
  modifiers: readonly TemporaryModifier[],
  sourceId: string
): { modifiers: TemporaryModifier[]; removedCount: number } {
  const filtered = modifiers.filter((m) => m.sourceId !== sourceId);
  return {
    modifiers: filtered,
    removedCount: modifiers.length - filtered.length,
  };
}

/**
 * Clear all enemy debuffs (modifiers where sourceTeam differs from unit's team).
 *
 * @param modifiers - Current active modifiers
 * @param unitTeam - The unit's team
 * @returns New modifiers array with only friendly modifiers
 */
export function clearEnemyDebuffs(
  modifiers: readonly TemporaryModifier[],
  unitTeam: UnitTeam
): TemporaryModifier[] {
  return modifiers.filter((m) => m.sourceTeam === unitTeam);
}

/**
 * Remove all modifiers linked to a specific unit.
 * Used when the linked unit dies.
 *
 * @param modifiers - Current active modifiers
 * @param unitId - Unit ID to unlink from
 * @returns New modifiers array
 */
export function removeModifiersLinkedToUnit(
  modifiers: readonly TemporaryModifier[],
  unitId: string
): TemporaryModifier[] {
  return modifiers.filter((m) => m.linkedUnitId !== unitId);
}

/**
 * Result of ticking pending modifiers.
 */
export interface TickPendingResult {
  pendingModifiers: PendingModifier[];
  readyModifiers: TemporaryModifier[];
}

/**
 * Tick pending modifiers, returning those ready to be applied.
 *
 * @param pending - Current pending modifiers
 * @param delta - Frame delta in seconds
 * @returns Updated pending list and modifiers ready to apply
 */
export function tickPendingModifiers(
  pending: readonly PendingModifier[],
  delta: number
): TickPendingResult {
  const stillPending: PendingModifier[] = [];
  const readyModifiers: TemporaryModifier[] = [];

  for (const p of pending) {
    const newDelay = p.delay - delta;
    if (newDelay <= 0) {
      readyModifiers.push(p.modifier);
    } else {
      stillPending.push({ ...p, delay: newDelay });
    }
  }

  return { pendingModifiers: stillPending, readyModifiers };
}

/**
 * Remove pending modifiers linked to a specific unit.
 *
 * @param pending - Current pending modifiers
 * @param unitId - Unit ID to unlink from
 * @returns New pending modifiers array
 */
export function removePendingModifiersLinkedToUnit(
  pending: readonly PendingModifier[],
  unitId: string
): PendingModifier[] {
  return pending.filter((p) => p.modifier.linkedUnitId !== unitId);
}

/**
 * Queue a modifier to be applied after a delay.
 *
 * @param pending - Current pending modifiers
 * @param modifier - Modifier to queue
 * @param delay - Delay in seconds
 * @returns New pending modifiers array
 */
export function queueModifier(
  pending: readonly PendingModifier[],
  modifier: TemporaryModifier,
  delay: number
): PendingModifier[] {
  return [...pending, { modifier, delay }];
}

/**
 * Combat System
 *
 * Pure functions for combat: attack mode selection, damage, attack execution.
 * Works with the CombatUnit interface for testability.
 *
 * Godot equivalent: Combat logic functions in a unit script.
 */

import { Vector2 } from '../../physics/Vector2';
import {
  MELEE_ATTACK_RANGE_THRESHOLD,
  MELEE_SIZE_MULTIPLIER,
  MELEE_RANGE_BUFFER,
} from '../BattleConfig';
import { IDamageable } from '../IEntity';
import { AttackMode, UnitStats } from '../types';

/**
 * Determine the attack mode (melee or ranged) based on distance.
 *
 * @param stats - Unit stats with melee/ranged capabilities
 * @param unitSize - Size of the attacking unit
 * @param distanceToTarget - Distance to target
 * @returns Attack mode to use, or null if no valid attack
 */
export function getAttackMode(
  stats: UnitStats,
  unitSize: number,
  distanceToTarget: number
): AttackMode | null {
  const { melee, ranged } = stats;
  const meleeRange = melee ? melee.range + unitSize * MELEE_SIZE_MULTIPLIER : 0;

  // If in melee range and has melee attack, use melee
  if (melee && distanceToTarget <= meleeRange + MELEE_RANGE_BUFFER) {
    return melee;
  }

  // If has ranged attack and not in melee range, use ranged
  if (ranged) {
    return ranged;
  }

  // Fall back to melee
  return melee;
}

/**
 * Get the maximum attack range for a unit.
 */
export function getMaxRange(stats: UnitStats): number {
  const { melee, ranged } = stats;
  if (ranged) return ranged.range;
  if (melee) return melee.range;
  return 0;
}

/**
 * Check if unit is in melee mode at the given distance.
 */
export function isInMeleeMode(
  stats: UnitStats,
  unitSize: number,
  distanceToTarget: number
): boolean {
  const { melee } = stats;
  if (!melee) return false;
  const meleeRange = melee.range + unitSize * MELEE_SIZE_MULTIPLIER + MELEE_RANGE_BUFFER;
  return distanceToTarget <= meleeRange;
}

/**
 * Check if an attack mode is melee (short range).
 */
export function isMeleeAttack(attackMode: AttackMode): boolean {
  return attackMode.range <= MELEE_ATTACK_RANGE_THRESHOLD;
}

/**
 * Check if a target is in attack range.
 */
export function isInRange(
  attackerPosition: Vector2,
  attackerSize: number,
  target: IDamageable,
  attackMode: AttackMode
): boolean {
  const distance = attackerPosition.distanceTo(target.position);
  const effectiveRange = attackMode.range + attackerSize + target.size;
  return distance <= effectiveRange;
}

/**
 * Calculate modified damage after applying damage multiplier.
 *
 * @param baseDamage - Base damage from attack mode
 * @param damageMultiplier - Multiplier from buffs/debuffs
 * @returns Modified damage (rounded to integer)
 */
export function calculateModifiedDamage(baseDamage: number, damageMultiplier: number): number {
  return Math.round(baseDamage * damageMultiplier);
}

/**
 * Calculate the direction from attacker to target.
 * Returns a normalized vector, or default direction if positions overlap.
 *
 * @param attackerPosition - Attacker's position
 * @param targetPosition - Target's position
 * @param minThreshold - Minimum distance before using default direction
 * @returns Normalized direction vector
 */
export function getAttackDirection(
  attackerPosition: Vector2,
  targetPosition: Vector2,
  minThreshold: number = 0.001
): Vector2 {
  const toTarget = targetPosition.subtract(attackerPosition);
  if (toTarget.magnitude() > minThreshold) {
    return toTarget.normalize();
  }
  // Default direction if positions overlap
  return new Vector2(0, -1);
}

/**
 * Get the cooldown after an attack.
 * Uses attackInterval from stats if available, otherwise calculates from attackSpeed.
 *
 * @param stats - Unit stats
 * @param attackMode - Attack mode used
 * @returns Cooldown in seconds
 */
export function getAttackCooldown(stats: UnitStats, attackMode: AttackMode): number {
  return stats.attackInterval ?? 1 / attackMode.attackSpeed;
}

/**
 * Combat update result.
 */
export interface CombatUpdateResult {
  /** New attack cooldown value */
  attackCooldown: number;
  /** Whether an attack was performed */
  didAttack: boolean;
  /** Attack mode used (if attack performed) */
  attackMode: AttackMode | null;
  /** Damage dealt (if attack performed) */
  damage: number;
  /** Whether the attack was melee */
  isMelee: boolean;
}

/**
 * Update combat state for a unit.
 * Returns combat result without performing the attack (caller handles side effects).
 *
 * @param attackCooldown - Current attack cooldown
 * @param delta - Frame delta in seconds
 * @param position - Unit position
 * @param unitSize - Unit size
 * @param stats - Unit stats
 * @param target - Current target
 * @param damageMultiplier - Damage multiplier from modifiers
 * @returns Combat update result
 */
export function updateCombat(
  attackCooldown: number,
  delta: number,
  position: Vector2,
  unitSize: number,
  stats: UnitStats,
  target: IDamageable | null,
  damageMultiplier: number = 1
): CombatUpdateResult {
  // Update cooldown
  let newCooldown = attackCooldown;
  if (newCooldown > 0) {
    newCooldown -= delta;
  }

  // Default result: no attack
  const result: CombatUpdateResult = {
    attackCooldown: newCooldown,
    didAttack: false,
    attackMode: null,
    damage: 0,
    isMelee: false,
  };

  if (!target) {
    return result;
  }

  const distanceToTarget = position.distanceTo(target.position);
  const attackMode = getAttackMode(stats, unitSize, distanceToTarget);

  if (!attackMode) {
    return result;
  }

  const effectiveRange = attackMode.range + unitSize + target.size;
  const inRange = distanceToTarget <= effectiveRange;

  if (inRange && newCooldown <= 0) {
    // Perform attack
    const damage = calculateModifiedDamage(attackMode.damage, damageMultiplier);
    const cooldown = getAttackCooldown(stats, attackMode);

    return {
      attackCooldown: cooldown,
      didAttack: true,
      attackMode,
      damage,
      isMelee: isMeleeAttack(attackMode),
    };
  }

  return result;
}

/**
 * Targeting System
 *
 * Pure functions for target acquisition and tracking.
 * Handles aggro radius, seek mode, and target switching.
 *
 * Godot equivalent: Targeting AI functions in a unit script.
 */

import {
  BASE_AGGRO_RADIUS,
  TARGET_SWITCH_COOLDOWN_SECONDS,
  TARGET_SWITCH_DISTANCE_RATIO,
  ZONE_HEIGHT_PERCENT,
  ZONE_MIDWAY_DIVISOR,
  scaleValue,
} from '../BattleConfig';
import { IDamageable } from '../IEntity';
import { UnitTeam } from '../types';
import { TargetableUnit, TargetingContext, TargetingResult } from './types';

/**
 * Get scaled aggro radius for current arena size.
 */
export function getAggroRadius(arenaHeight: number): number {
  return scaleValue(BASE_AGGRO_RADIUS, arenaHeight);
}

/**
 * Check if a unit is deep into the enemy's deployment zone.
 * Triggers permanent seek mode.
 *
 * Player units: past midway of top zone (Y < zoneHeight / 2)
 * Enemy units: past midway of bottom zone (Y > height - zoneHeight / 2)
 */
export function isDeepInEnemyZone(
  position: { x: number; y: number },
  team: UnitTeam,
  bounds: { width: number; height: number } | null
): boolean {
  if (!bounds) return false;

  const zoneHeight = bounds.height * ZONE_HEIGHT_PERCENT;

  if (team === 'player') {
    return position.y < zoneHeight / ZONE_MIDWAY_DIVISOR;
  } else {
    return position.y > bounds.height - zoneHeight / ZONE_MIDWAY_DIVISOR;
  }
}

/**
 * Check if all enemy castles have been destroyed.
 */
export function areAllEnemyCastlesDestroyed(team: UnitTeam, context: TargetingContext): boolean {
  const enemyTeam = team === 'player' ? 'enemy' : 'player';
  const initialCount = context.getInitialCastleCount(enemyTeam);
  const currentCastles = context.getEnemyCastles();
  const currentCount = currentCastles.filter((c) => !c.isDestroyed() && c.health > 0).length;

  return initialCount > 0 && currentCount === 0;
}

/**
 * Find the nearest enemy damageable (unit or castle) within aggro radius.
 */
export function findDamageableInAggroRadius(
  position: { x: number; y: number },
  enemies: readonly IDamageable[],
  aggroRadius: number
): IDamageable | null {
  let nearest: IDamageable | null = null;
  let nearestDist = aggroRadius;

  for (const enemy of enemies) {
    if (enemy.health <= 0) continue;
    const dx = position.x - enemy.position.x;
    const dy = position.y - enemy.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = enemy;
    }
  }

  return nearest;
}

/**
 * Find the nearest enemy damageable with no distance limit.
 */
export function findNearestDamageable(
  position: { x: number; y: number },
  enemies: readonly IDamageable[]
): IDamageable | null {
  let nearest: IDamageable | null = null;
  let nearestDist = Infinity;

  for (const enemy of enemies) {
    if (enemy.health <= 0) continue;
    const dx = position.x - enemy.position.x;
    const dy = position.y - enemy.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = enemy;
    }
  }

  return nearest;
}

/**
 * Update targeting for a unit.
 * Returns new targeting state without mutating the input.
 *
 * @param unit - Unit to update targeting for
 * @param context - World context for queries
 * @returns Updated targeting result
 */
export function updateTargeting(unit: TargetableUnit, context: TargetingContext): TargetingResult {
  let target = unit.target;
  let seekMode = unit.seekMode;
  let retargetCooldown = unit.retargetCooldown;

  // Clear dead/destroyed targets
  if (target && (target.isDestroyed() || target.health <= 0)) {
    target = null;
    retargetCooldown = 0;
  }

  // Check if unit should enter seek mode
  if (!seekMode) {
    if (
      areAllEnemyCastlesDestroyed(unit.team, context) ||
      isDeepInEnemyZone(unit.position, unit.team, context.bounds)
    ) {
      seekMode = true;
    }
  }

  const enemies = context.getEnemyDamageables();
  const aggroRadius = getAggroRadius(context.arenaHeight);

  // In seek mode, actively look for closer targets
  if (seekMode) {
    const nearestTarget = findNearestDamageable(unit.position, enemies);

    // Check for closer target (with cooldown)
    if (target && nearestTarget && retargetCooldown <= 0) {
      const currentDist = distanceTo(unit.position, target.position);
      const nearestDist = distanceTo(unit.position, nearestTarget.position);
      if (nearestDist < currentDist * TARGET_SWITCH_DISTANCE_RATIO) {
        target = nearestTarget;
        retargetCooldown = TARGET_SWITCH_COOLDOWN_SECONDS;
        return { target, seekMode, retargetCooldown };
      }
    }

    // Acquire target if none
    if (!target && nearestTarget) {
      target = nearestTarget;
      retargetCooldown = TARGET_SWITCH_COOLDOWN_SECONDS;
      return { target, seekMode, retargetCooldown };
    }

    // Keep existing valid target
    if (target) {
      return { target, seekMode, retargetCooldown };
    }
  }

  // Keep existing valid target (not in seek mode)
  if (target) {
    return { target, seekMode, retargetCooldown };
  }

  // Check for targets within aggro radius
  const nearestInRange = findDamageableInAggroRadius(unit.position, enemies, aggroRadius);
  if (nearestInRange) {
    target = nearestInRange;
    return { target, seekMode, retargetCooldown };
  }

  // No target - will march toward closest castle
  return { target, seekMode, retargetCooldown };
}

/**
 * Calculate distance between two positions.
 */
function distanceTo(from: { x: number; y: number }, to: { x: number; y: number }): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Find the closest living enemy castle.
 */
export function findClosestEnemyCastle(
  position: { x: number; y: number },
  castles: readonly IDamageable[]
): IDamageable | null {
  let closest: IDamageable | null = null;
  let closestDist = Infinity;

  for (const castle of castles) {
    if (castle.isDestroyed() || castle.health <= 0) continue;
    const dist = distanceTo(position, castle.position);
    if (dist < closestDist) {
      closestDist = dist;
      closest = castle;
    }
  }

  return closest;
}

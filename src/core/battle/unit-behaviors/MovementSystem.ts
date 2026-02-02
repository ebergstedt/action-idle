/**
 * Movement System
 *
 * Pure functions for unit movement: marching, pathfinding, ally avoidance.
 * Works with the MovableUnit interface for testability.
 *
 * Godot equivalent: Movement/pathfinding functions in a unit script.
 */

import { Vector2 } from '../../physics/Vector2';
import {
  MIN_MOVE_DISTANCE,
  UNIT_SPACING,
  ALLY_AVOIDANCE_DISTANCE_MULTIPLIER,
  BASE_ALLY_AVOIDANCE_FORCE,
  PATH_DOT_THRESHOLD,
  DIRECTION_CHECK_MULTIPLIER,
  scaleValue,
} from '../BattleConfig';
import { IDamageable } from '../IEntity';
import { UnitTeam } from '../types';
import { AllyData, MovementContext } from './types';

/**
 * Get the forward march direction for a team.
 * Player advances upward (Y-), enemy advances downward (Y+).
 */
export function getForwardDirection(team: UnitTeam): Vector2 {
  const forwardY = team === 'player' ? -1 : 1;
  return new Vector2(0, forwardY);
}

/**
 * Calculate the march direction for a unit.
 * Considers castle state - after first castle destruction, march toward closest.
 */
export function calculateMarchDirection(
  position: Vector2,
  team: UnitTeam,
  context: MovementContext
): Vector2 {
  if (context.hasAnyEnemyCastleBeenDestroyed()) {
    const closestCastle = findClosestCastle(position, context.getEnemyCastles());
    if (closestCastle) {
      const toCastle = closestCastle.position.subtract(position);
      const dist = toCastle.magnitude();
      if (dist > MIN_MOVE_DISTANCE) {
        return toCastle.normalize();
      }
    }
  }

  return getForwardDirection(team);
}

/**
 * Find the closest castle from a list.
 */
function findClosestCastle(position: Vector2, castles: readonly IDamageable[]): IDamageable | null {
  let closest: IDamageable | null = null;
  let closestDist = Infinity;

  for (const castle of castles) {
    if (castle.isDestroyed() || castle.health <= 0) continue;
    const dist = position.distanceTo(castle.position);
    if (dist < closestDist) {
      closestDist = dist;
      closest = castle;
    }
  }

  return closest;
}

/**
 * Calculate ally avoidance vector.
 * Pushes unit away from nearby allies to prevent stacking.
 */
export function calculateAllyAvoidance(
  position: Vector2,
  unitId: string,
  collisionSize: number,
  allies: readonly AllyData[],
  arenaHeight: number
): Vector2 {
  let avoidance = Vector2.zero();
  const allyAvoidanceForce = scaleValue(BASE_ALLY_AVOIDANCE_FORCE, arenaHeight);

  for (const ally of allies) {
    if (ally.id === unitId || ally.health <= 0) continue;

    const toAlly = position.subtract(ally.position);
    const dist = toAlly.magnitude();
    const minDist = (collisionSize + ally.getCollisionSize()) * UNIT_SPACING;
    const avoidDist = minDist * ALLY_AVOIDANCE_DISTANCE_MULTIPLIER;

    if (dist < avoidDist && dist > 0) {
      const pushStrength = (avoidDist - dist) / avoidDist;
      avoidance = avoidance.add(toAlly.normalize().multiply(pushStrength * allyAvoidanceForce));
    }
  }

  return avoidance;
}

/**
 * Calculate pathfinding avoidance when moving toward a target.
 * Uses perpendicular movement to avoid allies blocking the path.
 */
export function calculatePathAvoidance(
  position: Vector2,
  unitId: string,
  collisionSize: number,
  moveDirection: Vector2,
  allies: readonly AllyData[],
  arenaHeight: number
): Vector2 {
  let avoidance = Vector2.zero();
  const allyAvoidanceForce = scaleValue(BASE_ALLY_AVOIDANCE_FORCE, arenaHeight);

  for (const ally of allies) {
    if (ally.id === unitId || ally.health <= 0) continue;

    const toAlly = position.subtract(ally.position);
    const dist = toAlly.magnitude();
    const minDist = (collisionSize + ally.getCollisionSize()) * UNIT_SPACING;
    const avoidDist = minDist * ALLY_AVOIDANCE_DISTANCE_MULTIPLIER;

    if (dist < avoidDist && dist > 0) {
      // Check if ally is in our path
      const dot = moveDirection.dot(toAlly.normalize().multiply(-1));
      if (dot > PATH_DOT_THRESHOLD) {
        const perpendicular = new Vector2(-moveDirection.y, moveDirection.x);
        const leftClear = isDirectionClear(position, perpendicular, collisionSize, allies);
        const rightClear = isDirectionClear(
          position,
          perpendicular.multiply(-1),
          collisionSize,
          allies
        );

        if (leftClear && !rightClear) {
          avoidance = avoidance.add(perpendicular.multiply(allyAvoidanceForce / dist));
        } else if (rightClear && !leftClear) {
          avoidance = avoidance.add(perpendicular.multiply(-allyAvoidanceForce / dist));
        } else {
          // Neither or both clear - use cross product to decide
          const cross = moveDirection.x * toAlly.y - moveDirection.y * toAlly.x;
          avoidance = avoidance.add(
            perpendicular.multiply(((cross > 0 ? 1 : -1) * allyAvoidanceForce) / dist)
          );
        }
      }
    }
  }

  return avoidance;
}

/**
 * Check if a direction is clear of allies.
 */
function isDirectionClear(
  position: Vector2,
  direction: Vector2,
  collisionSize: number,
  allies: readonly AllyData[]
): boolean {
  const checkDist = collisionSize * DIRECTION_CHECK_MULTIPLIER;
  const checkPos = position.add(direction.normalize().multiply(checkDist));

  for (const ally of allies) {
    const minDist = (collisionSize + ally.getCollisionSize()) * UNIT_SPACING;
    if (checkPos.distanceTo(ally.position) < minDist) {
      return false;
    }
  }

  return true;
}

/**
 * Clamp movement speed to maximum.
 */
export function clampSpeed(moveDirection: Vector2, maxSpeed: number): Vector2 {
  const speed = moveDirection.magnitude();
  if (speed > maxSpeed) {
    return moveDirection.normalize().multiply(maxSpeed);
  }
  return moveDirection;
}

/**
 * Movement update result.
 */
export interface MovementResult {
  /** New position */
  position: Vector2;
  /** Movement delta for event */
  movementDelta: Vector2;
  /** Previous position for event */
  previousPosition: Vector2;
  /** Whether unit moved */
  didMove: boolean;
  /** Whether unit is walking (for animation) */
  isWalking: boolean;
}

/**
 * Calculate march forward movement (no target).
 */
export function marchForward(
  position: Vector2,
  team: UnitTeam,
  unitId: string,
  collisionSize: number,
  moveSpeed: number,
  context: MovementContext,
  delta: number
): MovementResult {
  const previousPosition = position.clone();
  const forwardDir = calculateMarchDirection(position, team, context);

  // Apply ally avoidance
  const avoidance = calculateAllyAvoidance(
    position,
    unitId,
    collisionSize,
    context.getAllies(),
    context.arenaHeight
  );

  // Combine forward movement with avoidance
  let moveDirection = forwardDir.multiply(moveSpeed).add(avoidance);
  moveDirection = clampSpeed(moveDirection, moveSpeed);

  const movement = moveDirection.multiply(delta);
  const newPosition = position.add(movement);

  return {
    position: newPosition,
    movementDelta: movement,
    previousPosition,
    didMove: true,
    isWalking: true,
  };
}

/**
 * Calculate movement toward target with formation keeping.
 */
export function moveTowardTarget(
  position: Vector2,
  targetPosition: Vector2,
  unitId: string,
  collisionSize: number,
  moveSpeed: number,
  context: MovementContext,
  delta: number
): MovementResult {
  const previousPosition = position.clone();
  const toTarget = targetPosition.subtract(position);
  const distToTarget = toTarget.magnitude();

  if (distToTarget < MIN_MOVE_DISTANCE) {
    return {
      position,
      movementDelta: Vector2.zero(),
      previousPosition,
      didMove: false,
      isWalking: false,
    };
  }

  let moveDirection = toTarget.normalize();

  // Apply path avoidance
  const avoidance = calculatePathAvoidance(
    position,
    unitId,
    collisionSize,
    moveDirection,
    context.getAllies(),
    context.arenaHeight
  );

  // Combine movement with avoidance
  moveDirection = moveDirection.multiply(moveSpeed).add(avoidance);
  moveDirection = clampSpeed(moveDirection, moveSpeed);

  const movement = moveDirection.multiply(delta);
  const newPosition = position.add(movement);

  return {
    position: newPosition,
    movementDelta: movement,
    previousPosition,
    didMove: true,
    isWalking: true,
  };
}

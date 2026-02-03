/**
 * Obstacle System
 *
 * Reusable interface for static obstructions in the battle arena.
 * Castles, walls, rocks, buildings, etc. all implement this interface.
 *
 * Obstacles:
 * - Block unit deployment (units cannot be placed on them)
 * - Block unit movement (units must path around them)
 * - Have a grid-based footprint for consistent collision
 *
 * Godot equivalent: Area2D or StaticBody2D with collision shape.
 */

import { Vector2 } from '../../physics/Vector2';
import type { GridFootprint } from '../grid/GridTypes';

/**
 * Axis-aligned bounding box for obstacle collision.
 */
export interface ObstacleBounds {
  /** Left edge X coordinate */
  x: number;
  /** Top edge Y coordinate */
  y: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Interface for any static obstacle in the arena.
 */
export interface IObstacle {
  /** Unique identifier */
  readonly id: string;
  /** Center position */
  readonly position: Vector2;
  /** Grid footprint (columns x rows) */
  readonly gridFootprint: GridFootprint;
  /** Whether this obstacle blocks unit movement */
  readonly blocksMovement: boolean;
  /** Whether this obstacle blocks unit deployment */
  readonly blocksDeployment: boolean;
}

/**
 * Calculate the bounding box for an obstacle given cell size.
 * @param obstacle - The obstacle
 * @param cellSize - Size of a grid cell in pixels
 * @returns Axis-aligned bounding box
 */
export function getObstacleBounds(obstacle: IObstacle, cellSize: number): ObstacleBounds {
  const width = obstacle.gridFootprint.cols * cellSize;
  const height = obstacle.gridFootprint.rows * cellSize;
  return {
    x: obstacle.position.x - width / 2,
    y: obstacle.position.y - height / 2,
    width,
    height,
  };
}

/**
 * Check if a point is inside an obstacle's bounds.
 * @param point - Point to check
 * @param obstacle - The obstacle
 * @param cellSize - Size of a grid cell in pixels
 * @param padding - Extra padding around the obstacle
 * @returns True if point is inside bounds (including padding)
 */
export function isPointInObstacle(
  point: Vector2,
  obstacle: IObstacle,
  cellSize: number,
  padding: number = 0
): boolean {
  const bounds = getObstacleBounds(obstacle, cellSize);
  return (
    point.x >= bounds.x - padding &&
    point.x <= bounds.x + bounds.width + padding &&
    point.y >= bounds.y - padding &&
    point.y <= bounds.y + bounds.height + padding
  );
}

/**
 * Check if a circle (unit) collides with an obstacle.
 * @param center - Circle center
 * @param radius - Circle radius
 * @param obstacle - The obstacle
 * @param cellSize - Size of a grid cell in pixels
 * @returns True if circle overlaps with obstacle bounds
 */
export function circleCollidesWithObstacle(
  center: Vector2,
  radius: number,
  obstacle: IObstacle,
  cellSize: number
): boolean {
  const bounds = getObstacleBounds(obstacle, cellSize);

  // Find closest point on rectangle to circle center
  const closestX = Math.max(bounds.x, Math.min(center.x, bounds.x + bounds.width));
  const closestY = Math.max(bounds.y, Math.min(center.y, bounds.y + bounds.height));

  // Calculate distance from closest point to circle center
  const dx = center.x - closestX;
  const dy = center.y - closestY;
  const distSquared = dx * dx + dy * dy;

  return distSquared < radius * radius;
}

/**
 * Check if two axis-aligned bounding boxes overlap.
 * @param a - First bounding box
 * @param b - Second bounding box
 * @param padding - Extra padding
 * @returns True if boxes overlap
 */
export function boundsOverlap(a: ObstacleBounds, b: ObstacleBounds, padding: number = 0): boolean {
  return !(
    a.x + a.width + padding <= b.x ||
    b.x + b.width + padding <= a.x ||
    a.y + a.height + padding <= b.y ||
    b.y + b.height + padding <= a.y
  );
}

/**
 * Calculate avoidance vector to steer away from an obstacle.
 * Used for unit pathfinding around obstacles.
 * @param position - Current position
 * @param velocity - Current velocity/direction
 * @param obstacle - The obstacle to avoid
 * @param cellSize - Size of a grid cell in pixels
 * @param avoidanceRadius - How far ahead to check for obstacles
 * @returns Avoidance vector (zero if no avoidance needed)
 */
export function calculateObstacleAvoidance(
  position: Vector2,
  velocity: Vector2,
  obstacle: IObstacle,
  cellSize: number,
  avoidanceRadius: number
): Vector2 {
  if (!obstacle.blocksMovement) return Vector2.zero();

  const bounds = getObstacleBounds(obstacle, cellSize);
  const obstacleCenter = new Vector2(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);

  // Check if we're heading toward the obstacle
  const toObstacle = obstacleCenter.subtract(position);
  const dist = toObstacle.magnitude();

  if (dist > avoidanceRadius + Math.max(bounds.width, bounds.height) / 2) {
    return Vector2.zero(); // Too far away
  }

  const velocityMag = velocity.magnitude();
  if (velocityMag < 0.001) return Vector2.zero(); // Not moving

  const velocityDir = velocity.normalize();
  const dot = velocityDir.dot(toObstacle.normalize());

  if (dot < 0.3) return Vector2.zero(); // Not heading toward obstacle

  // Calculate perpendicular avoidance direction
  const perpendicular = new Vector2(-velocityDir.y, velocityDir.x);

  // Choose direction based on which side of obstacle we're on
  const cross = velocityDir.x * toObstacle.y - velocityDir.y * toObstacle.x;
  const avoidDir = cross > 0 ? perpendicular : perpendicular.multiply(-1);

  // Stronger avoidance when closer
  const strength = Math.max(0, 1 - dist / avoidanceRadius);

  return avoidDir.multiply(strength * velocityMag);
}

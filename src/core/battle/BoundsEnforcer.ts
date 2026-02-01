import { Vector2 } from '../physics/Vector2';

/**
 * BoundsEnforcer - Pure functions for enforcing arena boundaries
 *
 * Godot equivalent: static utility class or autoload with Vector2 parameters
 * All functions are pure - take state, return new state (or mutate position in-place)
 */

/**
 * Arena boundary definition for entity containment.
 * Distinct from FormationManager.ArenaBounds which is for spawn zones.
 */
export interface EntityBounds {
  width: number;
  height: number;
  margin: number; // Margin from edges
}

/**
 * Clamp a position to stay within arena bounds, accounting for entity size.
 * Pure function - returns clamped position.
 *
 * @param position - Current position
 * @param size - Entity radius/half-size
 * @param bounds - Arena boundaries
 * @returns Clamped position
 */
export function clampToArena(position: Vector2, size: number, bounds: EntityBounds): Vector2 {
  const minX = bounds.margin + size;
  const maxX = bounds.width - bounds.margin - size;
  const minY = bounds.margin + size;
  const maxY = bounds.height - bounds.margin - size;

  return new Vector2(
    Math.max(minX, Math.min(maxX, position.x)),
    Math.max(minY, Math.min(maxY, position.y))
  );
}

/**
 * Check if a position is outside arena bounds.
 *
 * @param position - Position to check
 * @param size - Entity radius/half-size (use 0 for point entities like projectiles)
 * @param bounds - Arena boundaries
 * @returns True if position is outside bounds
 */
export function isOutOfBounds(position: Vector2, size: number, bounds: EntityBounds): boolean {
  const minX = bounds.margin + size;
  const maxX = bounds.width - bounds.margin - size;
  const minY = bounds.margin + size;
  const maxY = bounds.height - bounds.margin - size;

  return position.x < minX || position.x > maxX || position.y < minY || position.y > maxY;
}

/**
 * Clamp position in-place (mutates the position).
 * Use when you want to avoid creating new Vector2 instances.
 *
 * @param position - Position to clamp (mutated)
 * @param size - Entity radius/half-size
 * @param bounds - Arena boundaries
 */
export function clampToArenaInPlace(position: Vector2, size: number, bounds: EntityBounds): void {
  const minX = bounds.margin + size;
  const maxX = bounds.width - bounds.margin - size;
  const minY = bounds.margin + size;
  const maxY = bounds.height - bounds.margin - size;

  position.x = Math.max(minX, Math.min(maxX, position.x));
  position.y = Math.max(minY, Math.min(maxY, position.y));
}

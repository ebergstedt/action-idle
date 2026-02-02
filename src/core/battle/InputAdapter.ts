/**
 * Input Adapter
 *
 * Defines the input interface for the battle system.
 * Implementations bridge from platform-specific input (React, Godot).
 *
 * Godot equivalent: Implement this interface in a GDScript input handler
 * that converts Godot's Input events to these method calls.
 */

import { Vector2 } from '../physics/Vector2';
import { SELECTION_RADIUS_MULTIPLIER } from './BattleConfig';

/**
 * Input events that the battle system can receive.
 */
export interface BattleInputEvent {
  type: 'click' | 'double_click' | 'drag_start' | 'drag_move' | 'drag_end';
  position: Vector2;
  unitId?: string; // Unit at click position, if any
}

/**
 * Interface for platform-specific input handling.
 * React and Godot each implement this differently.
 */
export interface IBattleInputAdapter {
  /**
   * Called when user clicks/taps.
   */
  onClick(position: Vector2): void;

  /**
   * Called when user double-clicks/double-taps.
   */
  onDoubleClick(position: Vector2): void;

  /**
   * Called when drag starts.
   */
  onDragStart(position: Vector2): void;

  /**
   * Called during drag movement.
   */
  onDragMove(position: Vector2): void;

  /**
   * Called when drag ends.
   */
  onDragEnd(position: Vector2): void;
}

/**
 * Finds a unit at the given position.
 * Shared utility for input hit-testing.
 * Selection radius is unit.size * SELECTION_RADIUS_MULTIPLIER (default 1.5x).
 */
export function findUnitAtPosition<T extends { position: Vector2; size: number; id: string }>(
  position: Vector2,
  units: T[],
  radiusMultiplier: number = SELECTION_RADIUS_MULTIPLIER
): T | null {
  // Check in reverse order (top-most first)
  for (let i = units.length - 1; i >= 0; i--) {
    const unit = units[i];
    const dist = position.distanceTo(unit.position);
    const selectionRadius = unit.size * radiusMultiplier;
    if (dist <= selectionRadius) {
      return unit;
    }
  }
  return null;
}

/**
 * Checks if a unit is within drag bounds (for player unit restriction).
 */
export function isWithinDragBounds(
  position: Vector2,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): boolean {
  return (
    position.x >= bounds.minX &&
    position.x <= bounds.maxX &&
    position.y >= bounds.minY &&
    position.y <= bounds.maxY
  );
}

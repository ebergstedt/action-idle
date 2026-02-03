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
import { SELECTION_RADIUS_MULTIPLIER, GRID_TOTAL_ROWS } from './BattleConfig';
import type { GridFootprint } from './grid/GridTypes';

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
 * Finds a unit by checking if the position is within any squad's bounding box.
 * This allows clicking anywhere within a squad's footprint to select it.
 *
 * @param position - Click position
 * @param units - Array of units with squadId and gridFootprint
 * @param arenaHeight - Arena height for cell size calculation
 * @returns A unit from the clicked squad, or null if no squad was clicked
 */
export function findSquadAtPosition<
  T extends {
    position: Vector2;
    size: number;
    id: string;
    squadId: string;
    gridFootprint: GridFootprint;
  },
>(position: Vector2, units: T[], arenaHeight: number): T | null {
  if (units.length === 0 || arenaHeight <= 0) return null;

  const cellSize = arenaHeight / GRID_TOTAL_ROWS;

  // Group units by squadId
  const squadMap = new Map<string, T[]>();
  for (const unit of units) {
    const existing = squadMap.get(unit.squadId);
    if (existing) {
      existing.push(unit);
    } else {
      squadMap.set(unit.squadId, [unit]);
    }
  }

  // Check each squad's bounding box
  for (const [, squadUnits] of squadMap) {
    if (squadUnits.length === 0) continue;

    // Calculate squad centroid
    let sumX = 0;
    let sumY = 0;
    for (const unit of squadUnits) {
      sumX += unit.position.x;
      sumY += unit.position.y;
    }
    const centroidX = sumX / squadUnits.length;
    const centroidY = sumY / squadUnits.length;

    // Get footprint from first unit (all squad members have same footprint)
    const footprint = squadUnits[0].gridFootprint;

    // Calculate bounding box from centroid and footprint
    const halfWidth = (footprint.cols * cellSize) / 2;
    const halfHeight = (footprint.rows * cellSize) / 2;

    const minX = centroidX - halfWidth;
    const maxX = centroidX + halfWidth;
    const minY = centroidY - halfHeight;
    const maxY = centroidY + halfHeight;

    // Check if click is within bounding box
    if (position.x >= minX && position.x <= maxX && position.y >= minY && position.y <= maxY) {
      return squadUnits[0]; // Return first unit from squad
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

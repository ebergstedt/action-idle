/**
 * Box Select Controller
 *
 * Handles box/marquee selection logic for selecting multiple units.
 * Pure game logic - no React/browser dependencies.
 *
 * Godot equivalent: Could be part of an InputHandler or SelectionController node.
 */

import { Vector2 } from '../physics/Vector2';

export interface BoxSelectSession {
  /** Position where box selection started */
  startPos: Vector2;
  /** Current end position of the box */
  currentPos: Vector2;
}

export interface SelectionBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Starts a box selection session.
 */
export function startBoxSelect(startPos: Vector2): BoxSelectSession {
  return {
    startPos: startPos.clone(),
    currentPos: startPos.clone(),
  };
}

/**
 * Updates the box selection with new mouse position.
 */
export function updateBoxSelect(session: BoxSelectSession, currentPos: Vector2): BoxSelectSession {
  return {
    ...session,
    currentPos: currentPos.clone(),
  };
}

/**
 * Gets the normalized selection box (min/max regardless of drag direction).
 */
export function getSelectionBox(session: BoxSelectSession): SelectionBox {
  return {
    minX: Math.min(session.startPos.x, session.currentPos.x),
    maxX: Math.max(session.startPos.x, session.currentPos.x),
    minY: Math.min(session.startPos.y, session.currentPos.y),
    maxY: Math.max(session.startPos.y, session.currentPos.y),
  };
}

/**
 * Finds all units within the selection box.
 *
 * @param box - The selection box bounds
 * @param units - All units to check
 * @param team - Optional team filter (null = all teams)
 */
export function getUnitsInBox<
  T extends { position: Vector2; size: number; id: string; team: string },
>(box: SelectionBox, units: T[], team: string | null = null): string[] {
  const selectedIds: string[] = [];

  for (const unit of units) {
    // Filter by team if specified
    if (team !== null && unit.team !== team) continue;

    // Check if unit center is inside the box (with some tolerance for unit size)
    const unitLeft = unit.position.x - unit.size * 0.5;
    const unitRight = unit.position.x + unit.size * 0.5;
    const unitTop = unit.position.y - unit.size * 0.5;
    const unitBottom = unit.position.y + unit.size * 0.5;

    // Unit is selected if any part of it overlaps with the box
    const overlapsX = unitRight >= box.minX && unitLeft <= box.maxX;
    const overlapsY = unitBottom >= box.minY && unitTop <= box.maxY;

    if (overlapsX && overlapsY) {
      selectedIds.push(unit.id);
    }
  }

  return selectedIds;
}

/**
 * Checks if the box is large enough to be considered a real selection
 * (vs just a click).
 */
export function isBoxSelectActive(session: BoxSelectSession, minSize: number = 10): boolean {
  const width = Math.abs(session.currentPos.x - session.startPos.x);
  const height = Math.abs(session.currentPos.y - session.startPos.y);
  return width >= minSize || height >= minSize;
}

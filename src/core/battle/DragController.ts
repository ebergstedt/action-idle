/**
 * Drag Controller
 *
 * Handles multi-unit drag logic, position calculations, and overlap resolution.
 * Pure game logic - no React/browser dependencies.
 *
 * Godot equivalent: Could be part of a UnitController or InputHandler node.
 */

import { Vector2 } from '../physics/Vector2';
import { Unit } from './types';

export interface DragSession {
  /** The unit that was clicked to initiate the drag */
  anchorUnitId: string;
  /** Mouse position when drag started */
  startMousePos: Vector2;
  /** Initial positions of all units being dragged */
  initialPositions: Map<string, Vector2>;
  /** IDs of all units being dragged */
  draggedUnitIds: string[];
}

export interface DragBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface DragResult {
  moves: Array<{ unitId: string; position: Vector2 }>;
}

const UNIT_SPACING = 1.2;

/**
 * Starts a drag session.
 *
 * @param anchorUnitId - The unit that was clicked
 * @param mousePos - Current mouse position
 * @param unitIds - IDs of all units to drag (typically selected units)
 * @param units - All units (to get initial positions)
 */
export function startDrag(
  anchorUnitId: string,
  mousePos: Vector2,
  unitIds: string[],
  units: Unit[]
): DragSession {
  const initialPositions = new Map<string, Vector2>();

  for (const unitId of unitIds) {
    const unit = units.find((u) => u.id === unitId);
    if (unit) {
      initialPositions.set(unitId, unit.position.clone());
    }
  }

  return {
    anchorUnitId,
    startMousePos: mousePos.clone(),
    initialPositions,
    draggedUnitIds: unitIds,
  };
}

/**
 * Calculates new positions for dragged units.
 *
 * @param session - The drag session
 * @param currentMousePos - Current mouse position
 * @param bounds - Boundary constraints
 * @param allUnits - All units for overlap checking
 */
export function calculateDragPositions(
  session: DragSession,
  currentMousePos: Vector2,
  bounds: DragBounds,
  allUnits: Unit[]
): DragResult {
  const delta = currentMousePos.subtract(session.startMousePos);
  const moves: Array<{ unitId: string; position: Vector2 }> = [];

  if (session.draggedUnitIds.length === 0) {
    return { moves };
  }

  // First pass: calculate desired positions and find group bounds
  const desiredPositions = new Map<string, { pos: Vector2; size: number }>();
  let groupMinX = Infinity;
  let groupMaxX = -Infinity;
  let groupMinY = Infinity;
  let groupMaxY = -Infinity;

  for (const unitId of session.draggedUnitIds) {
    const initialPos = session.initialPositions.get(unitId);
    const unit = allUnits.find((u) => u.id === unitId);
    if (!initialPos || !unit) continue;

    const desired = initialPos.add(delta);
    desiredPositions.set(unitId, { pos: desired, size: unit.size });

    // Track group bounds including unit size
    groupMinX = Math.min(groupMinX, desired.x - unit.size);
    groupMaxX = Math.max(groupMaxX, desired.x + unit.size);
    groupMinY = Math.min(groupMinY, desired.y - unit.size);
    groupMaxY = Math.max(groupMaxY, desired.y + unit.size);
  }

  // Calculate adjustment to keep entire group in bounds
  let adjustX = 0;
  let adjustY = 0;

  if (groupMinX < bounds.minX) {
    adjustX = bounds.minX - groupMinX;
  } else if (groupMaxX > bounds.maxX) {
    adjustX = bounds.maxX - groupMaxX;
  }

  if (groupMinY < bounds.minY) {
    adjustY = bounds.minY - groupMinY;
  } else if (groupMaxY > bounds.maxY) {
    adjustY = bounds.maxY - groupMaxY;
  }

  // Get non-dragged units for overlap checking
  const staticUnits = allUnits.filter(
    (u) => !session.draggedUnitIds.includes(u.id) && u.team === 'player'
  );

  // Second pass: apply adjustment and resolve overlaps
  for (const unitId of session.draggedUnitIds) {
    const data = desiredPositions.get(unitId);
    if (!data) continue;

    let finalPos = new Vector2(data.pos.x + adjustX, data.pos.y + adjustY);

    // Resolve overlaps with static units (best effort)
    finalPos = resolveOverlaps(finalPos, data.size, staticUnits, 5);

    moves.push({ unitId, position: finalPos });
  }

  return { moves };
}

/**
 * Calculates position for a single unit drag.
 */
export function calculateSingleDragPosition(
  session: DragSession,
  currentMousePos: Vector2,
  bounds: DragBounds
): Vector2 | null {
  const initialPos = session.initialPositions.get(session.anchorUnitId);
  if (!initialPos) return null;

  const delta = currentMousePos.subtract(session.startMousePos);
  const desired = initialPos.add(delta);

  // Clamp to bounds
  return new Vector2(
    Math.max(bounds.minX, Math.min(bounds.maxX, desired.x)),
    Math.max(bounds.minY, Math.min(bounds.maxY, desired.y))
  );
}

/**
 * Resolves overlaps by pushing the unit away from static units.
 * Does NOT move the static units.
 */
function resolveOverlaps(
  pos: Vector2,
  size: number,
  staticUnits: Unit[],
  maxIterations: number
): Vector2 {
  let result = pos;

  for (let i = 0; i < maxIterations; i++) {
    let hasOverlap = false;
    let pushDir = new Vector2(0, 0);

    for (const other of staticUnits) {
      const diff = result.subtract(other.position);
      const dist = diff.magnitude();
      const minDist = (size + other.size) * UNIT_SPACING;

      if (dist < minDist && dist > 0.1) {
        hasOverlap = true;
        const overlap = minDist - dist;
        pushDir = pushDir.add(diff.normalize().multiply(overlap + 1));
      }
    }

    if (!hasOverlap) break;
    result = result.add(pushDir.multiply(0.5));
  }

  return result;
}

/**
 * Checks if a drag session is for multiple units.
 */
export function isMultiDrag(session: DragSession): boolean {
  return session.draggedUnitIds.length > 1;
}

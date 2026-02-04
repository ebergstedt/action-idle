/**
 * Grid Snap Service
 *
 * Pure functions for grid-based squad positioning and snapping.
 * Extracted from useCanvasInput.ts for Godot portability.
 *
 * Godot equivalent: Static functions in a GridSnapManager singleton
 */

import { Vector2 } from '../../physics/Vector2';
import type { ISelectable } from '../ISelectable';
import type { GridFootprint } from './GridTypes';
import { snapFootprintToGrid } from './GridManager';
import { validateSquadMoves } from '../DragController';
import { generateCastleObstacleGridBounds } from '../FormationManager';

// =============================================================================
// TYPES
// =============================================================================

/**
 * A unit move with ID and position.
 */
export interface UnitMove {
  unitId: string;
  position: Vector2;
}

/**
 * Input for the grid snap algorithm.
 */
export interface GridSnapInput {
  /** Proposed moves for units */
  moves: UnitMove[];
  /** All units in the game (for looking up squad info) */
  units: ISelectable[];
  /** Size of each grid cell in pixels */
  cellSize: number;
  /** Arena width in pixels (for obstacle generation) */
  arenaWidth: number;
  /** Arena height in pixels (for obstacle generation) */
  arenaHeight: number;
  /** Initial positions for reverting invalid moves (optional) */
  initialPositions?: Map<string, Vector2>;
}

/**
 * Result of snapping a squad centroid to the grid.
 */
export interface SquadSnapResult {
  /** Original centroid before snapping */
  centroid: Vector2;
  /** Snapped centroid position */
  snappedCentroid: Vector2;
  /** Delta between original and snapped */
  delta: Vector2;
}

// =============================================================================
// CENTROID CALCULATION
// =============================================================================

/**
 * Calculates the centroid (geometric center) of a group of positions.
 *
 * @param positions - Array of positions
 * @returns The centroid position
 */
export function calculateCentroid(positions: Vector2[]): Vector2 {
  if (positions.length === 0) {
    return Vector2.zero();
  }

  let sumX = 0;
  let sumY = 0;
  for (const pos of positions) {
    sumX += pos.x;
    sumY += pos.y;
  }

  return new Vector2(sumX / positions.length, sumY / positions.length);
}

// =============================================================================
// SQUAD SNAPPING
// =============================================================================

/**
 * Snaps a squad's centroid to the grid and returns the adjustment.
 *
 * When moving a squad, we want the entire squad to snap to the grid as a unit,
 * while maintaining the relative positions of individual units within the squad.
 *
 * Algorithm:
 * 1. Calculate the centroid (geometric center) of all units in the squad
 * 2. Snap the centroid to the nearest valid grid position for the squad's footprint
 * 3. Calculate the delta (offset) between original and snapped centroid
 *
 * @param squadUnits - Array of unit positions in the squad
 * @param footprint - The squad's grid footprint
 * @param cellSize - Size of each grid cell in pixels
 * @returns Snap result with centroid, snapped centroid, and delta
 */
export function snapSquadCentroidToGrid(
  squadUnits: Array<{ position: Vector2 }>,
  footprint: GridFootprint,
  cellSize: number
): SquadSnapResult {
  // Calculate centroid of all squad units
  const positions = squadUnits.map((unit) => unit.position);
  const centroid = calculateCentroid(positions);

  // Snap the centroid to the grid based on squad footprint
  const snappedCentroid = snapFootprintToGrid(centroid, footprint, cellSize);

  // Calculate the delta from original centroid to snapped centroid
  const delta = new Vector2(snappedCentroid.x - centroid.x, snappedCentroid.y - centroid.y);

  return { centroid, snappedCentroid, delta };
}

/**
 * Applies the grid snap delta to all units in a squad.
 *
 * @param squadUnits - Array of unit IDs and positions
 * @param delta - The delta to apply from centroid snapping
 * @returns New moves with snapped positions
 */
export function applySnapDeltaToSquad(
  squadUnits: Array<{ unitId: string; position: Vector2 }>,
  delta: Vector2
): UnitMove[] {
  return squadUnits.map((unit) => ({
    unitId: unit.unitId,
    position: new Vector2(unit.position.x + delta.x, unit.position.y + delta.y),
  }));
}

// =============================================================================
// MAIN GRID SNAP FUNCTION
// =============================================================================

/**
 * Applies grid snapping to a set of unit moves.
 * Groups units by squad and snaps each squad as a unit, preserving relative positions.
 * Also validates moves against other squads and obstacles (castles).
 *
 * @param input - Grid snap input configuration
 * @returns Validated and snapped moves
 */
export function applyGridSnapToMoves(input: GridSnapInput): UnitMove[] {
  const { moves, units, cellSize, arenaWidth, arenaHeight, initialPositions } = input;

  if (cellSize <= 0) return moves;

  // Collect dragged squad IDs for overlap validation
  const draggedSquadIds = new Set<string>();

  // Group moves by squadId
  const squadMoves = new Map<
    string,
    Array<{ unitId: string; position: Vector2; unit: ISelectable }>
  >();

  for (const move of moves) {
    const foundUnit = units.find((unit) => unit.id === move.unitId);
    if (!foundUnit) continue;

    const squadId = foundUnit.squadId;
    draggedSquadIds.add(squadId);

    if (!squadMoves.has(squadId)) {
      squadMoves.set(squadId, []);
    }
    squadMoves.get(squadId)!.push({ ...move, unit: foundUnit });
  }

  const snappedMoves: UnitMove[] = [];

  // Process each squad as a unit
  for (const [, squadUnits] of squadMoves) {
    if (squadUnits.length === 0) continue;

    // Get the footprint from any unit in the squad (they all have the same)
    const footprint = squadUnits[0].unit.gridFootprint;
    if (!footprint) {
      // No footprint, just return original positions
      for (const squadUnit of squadUnits) {
        snappedMoves.push({ unitId: squadUnit.unitId, position: squadUnit.position });
      }
      continue;
    }

    // Snap the squad centroid to the grid
    const snapResult = snapSquadCentroidToGrid(squadUnits, footprint, cellSize);

    // Apply the same delta to all units in the squad
    for (const squadUnit of squadUnits) {
      snappedMoves.push({
        unitId: squadUnit.unitId,
        position: new Vector2(
          squadUnit.position.x + snapResult.delta.x,
          squadUnit.position.y + snapResult.delta.y
        ),
      });
    }
  }

  // Generate castle obstacle bounds to prevent units from being placed inside castles
  const castleObstacleBounds = generateCastleObstacleGridBounds(arenaWidth, arenaHeight, cellSize);

  // Validate moves to prevent squad overlaps during deployment
  // Pass initial positions so invalid moves revert to drag start, not current frame
  const validatedMoves = validateSquadMoves(
    snappedMoves,
    units,
    cellSize,
    draggedSquadIds,
    initialPositions,
    castleObstacleBounds
  );

  return validatedMoves;
}

/**
 * Drag Controller
 *
 * Handles multi-unit drag logic, position calculations, and overlap resolution.
 * Pure game logic - no React/browser dependencies.
 *
 * Godot equivalent: Could be part of a UnitController or InputHandler node.
 */

import { Vector2 } from '../physics/Vector2';
import { ISelectable } from './ISelectable';
import type { GridFootprint, GridBounds, GridPosition } from './grid/GridTypes';
import {
  snapFootprintToGrid,
  doGridBoundsOverlap,
  isGridBoundsWithin,
  getFootprintGridPosition,
  getFootprintPixelCenter,
  getPlayerDeploymentBounds,
  getEnemyDeploymentBounds,
  findNonOverlappingGridPosition,
} from './grid/GridManager';

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
  units: ISelectable[]
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
  allUnits: ISelectable[]
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

  // Second pass: apply boundary adjustment to all dragged units
  // Note: Individual unit overlap resolution is NOT done here - squads move as units
  // and overlap prevention is handled by validateSquadMoves at the grid level
  for (const unitId of session.draggedUnitIds) {
    const data = desiredPositions.get(unitId);
    if (!data) continue;

    const finalPos = new Vector2(data.pos.x + adjustX, data.pos.y + adjustY);
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
 * Checks if a drag session is for multiple units.
 */
export function isMultiDrag(session: DragSession): boolean {
  return session.draggedUnitIds.length > 1;
}

// =============================================================================
// GRID SNAPPING
// =============================================================================

/**
 * Snaps a squad position to the grid.
 *
 * @param pos - Current pixel position (center of squad)
 * @param footprint - Squad footprint in grid cells
 * @param cellSize - Size of each grid cell in pixels
 * @returns Snapped pixel position (center of squad)
 */
export function snapSquadToGrid(pos: Vector2, footprint: GridFootprint, cellSize: number): Vector2 {
  return snapFootprintToGrid(pos, footprint, cellSize);
}

/**
 * Checks if a grid position is valid (within bounds and not overlapping).
 *
 * @param gridPos - Grid position (top-left of footprint)
 * @param footprint - Size of the footprint in grid cells
 * @param occupiedCells - List of already-occupied grid bounds
 * @param deploymentBounds - Valid deployment zone bounds
 * @returns True if position is valid
 */
export function isGridPositionValid(
  gridPos: GridPosition,
  footprint: GridFootprint,
  occupiedCells: GridBounds[],
  deploymentBounds: GridBounds
): boolean {
  const candidateBounds: GridBounds = {
    col: gridPos.col,
    row: gridPos.row,
    cols: footprint.cols,
    rows: footprint.rows,
  };

  // Check if within deployment bounds
  if (!isGridBoundsWithin(candidateBounds, deploymentBounds)) {
    return false;
  }

  // Check for overlaps with occupied cells
  for (const occ of occupiedCells) {
    if (doGridBoundsOverlap(candidateBounds, occ)) {
      return false;
    }
  }

  return true;
}

/**
 * Calculates drag positions with grid snapping.
 *
 * @param session - The drag session
 * @param currentMousePos - Current mouse position
 * @param bounds - Boundary constraints
 * @param allUnits - All units for overlap checking
 * @param cellSize - Size of each grid cell in pixels (0 to disable snapping)
 * @param footprints - Map of unit ID to grid footprint (for snapping)
 */
export function calculateDragPositionsWithGrid(
  session: DragSession,
  currentMousePos: Vector2,
  bounds: DragBounds,
  allUnits: ISelectable[],
  cellSize: number = 0,
  footprints: Map<string, GridFootprint> = new Map()
): DragResult {
  // First calculate positions using the standard method
  const result = calculateDragPositions(session, currentMousePos, bounds, allUnits);

  // If grid snapping is disabled, return as-is
  if (cellSize <= 0) {
    return result;
  }

  // Snap each unit's position to the grid
  const snappedMoves: Array<{ unitId: string; position: Vector2 }> = [];

  for (const move of result.moves) {
    const footprint = footprints.get(move.unitId);

    if (footprint) {
      // Snap to grid based on footprint
      const snappedPos = snapSquadToGrid(move.position, footprint, cellSize);

      // Clamp to bounds after snapping
      const clampedPos = new Vector2(
        Math.max(bounds.minX, Math.min(bounds.maxX, snappedPos.x)),
        Math.max(bounds.minY, Math.min(bounds.maxY, snappedPos.y))
      );

      snappedMoves.push({ unitId: move.unitId, position: clampedPos });
    } else {
      // No footprint, keep original position
      snappedMoves.push(move);
    }
  }

  return { moves: snappedMoves };
}

// =============================================================================
// SQUAD OVERLAP PREVENTION
// =============================================================================

/**
 * Gets the grid bounds for a squad given its centroid position.
 *
 * @param centroid - Pixel position of squad centroid
 * @param footprint - Squad footprint in grid cells
 * @param cellSize - Size of each grid cell in pixels
 * @returns Grid bounds for the squad
 */
export function getSquadGridBounds(
  centroid: Vector2,
  footprint: GridFootprint,
  cellSize: number
): GridBounds {
  const gridPos = getFootprintGridPosition(centroid, footprint, cellSize);
  return {
    col: gridPos.col,
    row: gridPos.row,
    cols: footprint.cols,
    rows: footprint.rows,
  };
}

/**
 * Collects grid bounds for all squads of a specific team, optionally excluding certain squad IDs.
 *
 * @param units - All units to check
 * @param team - Team to filter by
 * @param cellSize - Size of each grid cell in pixels
 * @param excludeSquadIds - Squad IDs to exclude (e.g., squads being dragged)
 * @returns Map of squadId to GridBounds
 */
export function collectSquadGridBounds(
  units: ISelectable[],
  team: 'player' | 'enemy',
  cellSize: number,
  excludeSquadIds: Set<string> = new Set()
): Map<string, GridBounds> {
  const squadBounds = new Map<string, GridBounds>();

  // Group units by squad
  const squadUnits = new Map<string, ISelectable[]>();
  for (const unit of units) {
    if (unit.team !== team) continue;
    if (excludeSquadIds.has(unit.squadId)) continue;

    if (!squadUnits.has(unit.squadId)) {
      squadUnits.set(unit.squadId, []);
    }
    squadUnits.get(unit.squadId)!.push(unit);
  }

  // Calculate bounds for each squad
  for (const [squadId, members] of squadUnits) {
    if (members.length === 0) continue;

    // Calculate centroid
    let centroidX = 0;
    let centroidY = 0;
    for (const unit of members) {
      centroidX += unit.position.x;
      centroidY += unit.position.y;
    }
    centroidX /= members.length;
    centroidY /= members.length;

    const footprint = members[0].gridFootprint;
    if (footprint) {
      const bounds = getSquadGridBounds(new Vector2(centroidX, centroidY), footprint, cellSize);
      squadBounds.set(squadId, bounds);
    }
  }

  return squadBounds;
}

/**
 * Checks if a squad move would cause an overlap with other squads or obstacles.
 *
 * @param proposedCentroid - Proposed pixel position for squad centroid
 * @param footprint - Squad footprint in grid cells
 * @param cellSize - Size of each grid cell in pixels
 * @param otherSquadBounds - Grid bounds of other squads to check against
 * @param deploymentBounds - Valid deployment zone bounds (optional)
 * @param obstacleBounds - Grid bounds of obstacles (castles, etc.) to check against (optional)
 * @returns True if the move is valid (no overlaps and within bounds)
 */
export function isSquadMoveValid(
  proposedCentroid: Vector2,
  footprint: GridFootprint,
  cellSize: number,
  otherSquadBounds: GridBounds[],
  deploymentBounds?: GridBounds,
  obstacleBounds?: GridBounds[]
): boolean {
  const proposedBounds = getSquadGridBounds(proposedCentroid, footprint, cellSize);

  // Check if within deployment bounds
  if (deploymentBounds && !isGridBoundsWithin(proposedBounds, deploymentBounds)) {
    return false;
  }

  // Check for overlaps with other squads
  for (const other of otherSquadBounds) {
    if (doGridBoundsOverlap(proposedBounds, other)) {
      return false;
    }
  }

  // Check for overlaps with obstacles (castles, etc.)
  if (obstacleBounds) {
    for (const obstacle of obstacleBounds) {
      if (doGridBoundsOverlap(proposedBounds, obstacle)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Validates and adjusts squad moves to prevent overlaps during deployment.
 * If a move would cause an overlap, the squad reverts to its initial position (drag start).
 *
 * @param moves - Proposed moves for units
 * @param units - All units (for looking up squad info)
 * @param cellSize - Size of each grid cell in pixels
 * @param draggedSquadIds - IDs of squads being dragged
 * @param initialPositions - Optional map of unit IDs to their positions at drag start
 * @param obstacleBounds - Optional array of obstacle bounds (castles, etc.) to check against
 * @returns Validated moves (overlapping moves reverted to initial positions)
 */
export function validateSquadMoves(
  moves: Array<{ unitId: string; position: Vector2 }>,
  units: ISelectable[],
  cellSize: number,
  draggedSquadIds: Set<string>,
  initialPositions?: Map<string, Vector2>,
  obstacleBounds?: GridBounds[]
): Array<{ unitId: string; position: Vector2 }> {
  // If cellSize is invalid, return initial positions to prevent any movement
  // This ensures we don't allow moves when validation can't run properly
  if (cellSize <= 0) {
    return moves.map((move) => ({
      unitId: move.unitId,
      position: initialPositions?.get(move.unitId) ?? move.position,
    }));
  }

  // Get deployment bounds
  const deploymentBounds = getPlayerDeploymentBounds();

  // Collect grid bounds of all non-dragged player squads
  const otherSquadBounds = collectSquadGridBounds(units, 'player', cellSize, draggedSquadIds);
  const otherBoundsArray = Array.from(otherSquadBounds.values());

  // Group moves by squad
  const squadMoves = new Map<
    string,
    Array<{ unitId: string; position: Vector2; originalPos: Vector2 }>
  >();

  for (const move of moves) {
    const unit = units.find((u) => u.id === move.unitId);
    if (!unit) continue;

    if (!squadMoves.has(unit.squadId)) {
      squadMoves.set(unit.squadId, []);
    }
    // Use initial position from drag start if available, otherwise fall back to current position
    const originalPos = initialPositions?.get(move.unitId) ?? unit.position;
    squadMoves.get(unit.squadId)!.push({
      unitId: move.unitId,
      position: move.position,
      originalPos,
    });
  }

  const validatedMoves: Array<{ unitId: string; position: Vector2 }> = [];

  // Validate each squad's move
  for (const [squadId, squadUnitMoves] of squadMoves) {
    if (squadUnitMoves.length === 0) continue;

    // Get footprint from units
    const firstUnit = units.find((u) => u.squadId === squadId);
    const footprint = firstUnit?.gridFootprint;

    if (!footprint) {
      // No footprint, allow the move
      for (const m of squadUnitMoves) {
        validatedMoves.push({ unitId: m.unitId, position: m.position });
      }
      continue;
    }

    // Calculate proposed centroid
    let proposedCentroidX = 0;
    let proposedCentroidY = 0;
    for (const m of squadUnitMoves) {
      proposedCentroidX += m.position.x;
      proposedCentroidY += m.position.y;
    }
    proposedCentroidX /= squadUnitMoves.length;
    proposedCentroidY /= squadUnitMoves.length;

    const proposedCentroid = new Vector2(proposedCentroidX, proposedCentroidY);

    // Check if move is valid (against other squads, bounds, and obstacles)
    if (
      isSquadMoveValid(
        proposedCentroid,
        footprint,
        cellSize,
        otherBoundsArray,
        deploymentBounds,
        obstacleBounds
      )
    ) {
      // Move is valid, apply it
      for (const m of squadUnitMoves) {
        validatedMoves.push({ unitId: m.unitId, position: m.position });
      }
    } else {
      // Move would cause overlap - find the closest valid position instead
      // Combine other squads and obstacles into one array for overlap checking
      const allOccupied = obstacleBounds
        ? [...otherBoundsArray, ...obstacleBounds]
        : otherBoundsArray;

      const closestGridPos = findNonOverlappingGridPosition(
        footprint,
        proposedCentroid,
        allOccupied,
        deploymentBounds,
        cellSize
      );

      if (closestGridPos) {
        // Found a valid position - calculate the new centroid and apply to all units
        const newCentroid = getFootprintPixelCenter(closestGridPos, footprint, cellSize);
        const deltaX = newCentroid.x - proposedCentroidX;
        const deltaY = newCentroid.y - proposedCentroidY;

        for (const m of squadUnitMoves) {
          validatedMoves.push({
            unitId: m.unitId,
            position: new Vector2(m.position.x + deltaX, m.position.y + deltaY),
          });
        }
      } else {
        // No valid position found at all - revert to initial positions as fallback
        for (const m of squadUnitMoves) {
          validatedMoves.push({ unitId: m.unitId, position: m.originalPos });
        }
      }
    }
  }

  return validatedMoves;
}

// =============================================================================
// SQUAD OVERLAP RESOLUTION
// =============================================================================

/** Maximum iterations for overlap resolution to prevent infinite loops */
const MAX_OVERLAP_RESOLUTION_ITERATIONS = 50;

/**
 * Squad info for overlap resolution.
 */
export interface SquadInfo {
  squadId: string;
  centroid: Vector2;
  footprint: GridFootprint;
  unitIds: string[];
}

/**
 * Collects squad information from units.
 *
 * @param units - All units
 * @param team - Team to filter by
 * @returns Array of squad info
 */
export function collectSquadInfo(units: ISelectable[], team: 'player' | 'enemy'): SquadInfo[] {
  const squadMap = new Map<
    string,
    { units: ISelectable[]; footprint: GridFootprint | undefined }
  >();

  for (const unit of units) {
    if (unit.team !== team) continue;

    if (!squadMap.has(unit.squadId)) {
      squadMap.set(unit.squadId, { units: [], footprint: unit.gridFootprint });
    }
    squadMap.get(unit.squadId)!.units.push(unit);
  }

  const squads: SquadInfo[] = [];
  for (const [squadId, data] of squadMap) {
    if (data.units.length === 0 || !data.footprint) continue;

    // Calculate centroid
    let centroidX = 0;
    let centroidY = 0;
    for (const unit of data.units) {
      centroidX += unit.position.x;
      centroidY += unit.position.y;
    }
    centroidX /= data.units.length;
    centroidY /= data.units.length;

    squads.push({
      squadId,
      centroid: new Vector2(centroidX, centroidY),
      footprint: data.footprint,
      unitIds: data.units.map((u) => u.id),
    });
  }

  return squads;
}

/**
 * Result of overlap resolution for a single squad.
 */
export interface SquadMoveResult {
  squadId: string;
  newCentroid: Vector2;
  unitMoves: Array<{ unitId: string; position: Vector2 }>;
}

/**
 * Resolves overlapping squads by moving them to nearby non-overlapping positions.
 * Uses a best-effort algorithm with a maximum iteration limit.
 *
 * @param units - All units (will be used to calculate current positions)
 * @param team - Team to resolve overlaps for ('player' or 'enemy')
 * @param cellSize - Size of each grid cell in pixels
 * @returns Array of moves to apply to resolve overlaps
 */
export function resolveSquadOverlaps(
  units: ISelectable[],
  team: 'player' | 'enemy',
  cellSize: number
): Array<{ unitId: string; position: Vector2 }> {
  if (cellSize <= 0) return [];

  const deploymentBounds =
    team === 'player' ? getPlayerDeploymentBounds() : getEnemyDeploymentBounds();
  const squads = collectSquadInfo(units, team);

  if (squads.length === 0) return [];

  // Track which squads need to move
  const movedSquads = new Map<string, Vector2>(); // squadId -> new centroid

  // Process squads iteratively until no overlaps remain or max iterations reached
  for (let iteration = 0; iteration < MAX_OVERLAP_RESOLUTION_ITERATIONS; iteration++) {
    let hadOverlap = false;

    for (const squad of squads) {
      // Get current centroid (possibly already moved)
      const currentCentroid = movedSquads.get(squad.squadId) || squad.centroid;
      const currentBounds = getSquadGridBounds(currentCentroid, squad.footprint, cellSize);

      // Check for overlap with any other squad's bounds
      let overlapsWithOther = false;
      for (const otherSquad of squads) {
        if (otherSquad.squadId === squad.squadId) continue;

        const otherCentroid = movedSquads.get(otherSquad.squadId) || otherSquad.centroid;
        const otherBounds = getSquadGridBounds(otherCentroid, otherSquad.footprint, cellSize);

        if (doGridBoundsOverlap(currentBounds, otherBounds)) {
          overlapsWithOther = true;
          break;
        }
      }

      if (overlapsWithOther) {
        hadOverlap = true;

        // Collect bounds of all OTHER squads (not this one)
        const otherBounds: GridBounds[] = [];
        for (const otherSquad of squads) {
          if (otherSquad.squadId === squad.squadId) continue;
          const otherCentroid = movedSquads.get(otherSquad.squadId) || otherSquad.centroid;
          otherBounds.push(getSquadGridBounds(otherCentroid, otherSquad.footprint, cellSize));
        }

        // Find a new position
        const newGridPos = findNonOverlappingGridPosition(
          squad.footprint,
          currentCentroid,
          otherBounds,
          deploymentBounds,
          cellSize
        );

        if (newGridPos) {
          const newCentroid = getFootprintPixelCenter(newGridPos, squad.footprint, cellSize);
          movedSquads.set(squad.squadId, newCentroid);
        }
        // If no position found, squad stays where it is (best effort)
      }
    }

    // If no overlaps found in this iteration, we're done
    if (!hadOverlap) break;
  }

  // Generate moves for all units in moved squads
  const moves: Array<{ unitId: string; position: Vector2 }> = [];

  for (const squad of squads) {
    const newCentroid = movedSquads.get(squad.squadId);
    if (!newCentroid) continue; // Squad didn't need to move

    // Calculate delta from original centroid
    const deltaX = newCentroid.x - squad.centroid.x;
    const deltaY = newCentroid.y - squad.centroid.y;

    // Apply delta to all units in the squad
    for (const unitId of squad.unitIds) {
      const unit = units.find((u) => u.id === unitId);
      if (unit) {
        moves.push({
          unitId,
          position: new Vector2(unit.position.x + deltaX, unit.position.y + deltaY),
        });
      }
    }
  }

  return moves;
}

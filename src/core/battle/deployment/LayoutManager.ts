/**
 * Layout Manager
 *
 * Pure functions for capturing and restoring ally squad positions across waves.
 * Stores positions as grid coordinates for resolution independence.
 *
 * Godot equivalent: Static functions in a LayoutManager singleton
 */

import { Vector2 } from '../../physics/Vector2';
import { DEFAULT_GRID_FOOTPRINT } from '../BattleConfig';
import { UnitEntity } from '../entities';
import { pixelToGrid, snapFootprintToGrid } from '../grid/GridManager';
import { IUnitRegistry } from '../units';
import type { SpawnPosition, UnitType } from '../FormationManager';

// =============================================================================
// TYPES
// =============================================================================

/**
 * A single squad's saved position in grid coordinates.
 */
export interface SavedSquadPlacement {
  /** Unit definition type (e.g., 'hound', 'fang') */
  type: string;
  /** Grid column of squad centroid */
  col: number;
  /** Grid row of squad centroid */
  row: number;
}

/**
 * Saved layout of all ally squads for restoring across waves.
 */
export interface SavedAllyLayout {
  placements: SavedSquadPlacement[];
}

// =============================================================================
// CAPTURE
// =============================================================================

/**
 * Capture the current positions of all mobile player units as a layout.
 * Groups units by squadId, computes centroid of each squad, converts to grid coords.
 *
 * @param playerUnits - Mobile (non-castle) player units
 * @param cellSize - Grid cell size in pixels
 * @returns Saved layout with one placement per squad
 */
export function captureAllyLayout(playerUnits: UnitEntity[], cellSize: number): SavedAllyLayout {
  if (cellSize <= 0) return { placements: [] };

  // Group units by squadId
  const squads = new Map<string, { type: string; positions: Vector2[] }>();

  for (const unit of playerUnits) {
    const existing = squads.get(unit.squadId);
    if (existing) {
      existing.positions.push(unit.position);
    } else {
      squads.set(unit.squadId, {
        type: unit.type,
        positions: [unit.position.clone()],
      });
    }
  }

  // Compute centroid of each squad and convert to grid coordinates
  const placements: SavedSquadPlacement[] = [];

  for (const [, squad] of squads) {
    const centroid = computeCentroid(squad.positions);
    const gridPos = pixelToGrid(centroid, cellSize);
    placements.push({
      type: squad.type,
      col: gridPos.col,
      row: gridPos.row,
    });
  }

  return { placements };
}

// =============================================================================
// MATCHING
// =============================================================================

/**
 * Match a new composition to saved layout positions using a 3-pass algorithm:
 * 1. Exact type match
 * 2. Role-based fallback (formationRole from registry)
 * 3. Any remaining unmatched
 *
 * Returns null if the new composition has more squads than saved positions.
 *
 * @param savedLayout - Previously saved layout
 * @param newComposition - New composition of unit types to spawn
 * @param registry - Unit registry for looking up formationRole
 * @returns Matched placements or null if matching fails
 */
export function mapCompositionToLayout(
  savedLayout: SavedAllyLayout,
  newComposition: string[],
  registry: IUnitRegistry
): SavedSquadPlacement[] | null {
  // More squads than saved positions → can't match, fall back
  if (newComposition.length > savedLayout.placements.length) {
    return null;
  }

  // Track which saved placements and composition entries are consumed
  const usedSaved = new Array(savedLayout.placements.length).fill(false);
  const usedComp = new Array(newComposition.length).fill(false);
  const result: (SavedSquadPlacement | null)[] = new Array(newComposition.length).fill(null);

  // Pass 1: Exact type match
  for (let ci = 0; ci < newComposition.length; ci++) {
    if (usedComp[ci]) continue;
    const compType = newComposition[ci];

    for (let si = 0; si < savedLayout.placements.length; si++) {
      if (usedSaved[si]) continue;
      if (savedLayout.placements[si].type === compType) {
        result[ci] = {
          type: compType,
          col: savedLayout.placements[si].col,
          row: savedLayout.placements[si].row,
        };
        usedSaved[si] = true;
        usedComp[ci] = true;
        break;
      }
    }
  }

  // Pass 2: Role-based fallback
  for (let ci = 0; ci < newComposition.length; ci++) {
    if (usedComp[ci]) continue;
    const compType = newComposition[ci];
    const compDef = registry.tryGet(compType);
    const compRole = compDef?.formationRole;

    for (let si = 0; si < savedLayout.placements.length; si++) {
      if (usedSaved[si]) continue;
      const savedDef = registry.tryGet(savedLayout.placements[si].type);
      if (compRole && savedDef?.formationRole === compRole) {
        result[ci] = {
          type: compType,
          col: savedLayout.placements[si].col,
          row: savedLayout.placements[si].row,
        };
        usedSaved[si] = true;
        usedComp[ci] = true;
        break;
      }
    }
  }

  // Pass 3: Any remaining unmatched → use any leftover saved position
  for (let ci = 0; ci < newComposition.length; ci++) {
    if (usedComp[ci]) continue;

    for (let si = 0; si < savedLayout.placements.length; si++) {
      if (usedSaved[si]) continue;
      result[ci] = {
        type: newComposition[ci],
        col: savedLayout.placements[si].col,
        row: savedLayout.placements[si].row,
      };
      usedSaved[si] = true;
      usedComp[ci] = true;
      break;
    }
  }

  // If any composition entry is still unmatched, fail
  if (result.some((r) => r === null)) {
    return null;
  }

  return result as SavedSquadPlacement[];
}

// =============================================================================
// APPLICATION
// =============================================================================

/**
 * Apply a saved layout to a new composition, returning spawn positions in pixel coords.
 * Returns null if matching fails (caller should fall back to deterministic formation).
 *
 * @param savedLayout - Previously saved layout
 * @param newComposition - New composition of unit types to spawn
 * @param registry - Unit registry for matching
 * @param cellSize - Grid cell size in pixels
 * @returns Array of SpawnPositions or null if matching fails
 */
export function applyLayoutToComposition(
  savedLayout: SavedAllyLayout,
  newComposition: string[],
  registry: IUnitRegistry,
  cellSize: number
): SpawnPosition[] | null {
  const matched = mapCompositionToLayout(savedLayout, newComposition, registry);
  if (!matched) return null;

  return matched.map((placement) => {
    // Convert grid coords back to pixel center
    const pixelPos = new Vector2(
      (placement.col + 0.5) * cellSize,
      (placement.row + 0.5) * cellSize
    );

    // Snap to grid based on unit's footprint for proper alignment
    const def = registry.tryGet(placement.type);
    const footprint = def?.gridFootprint || DEFAULT_GRID_FOOTPRINT;
    const snappedPos = snapFootprintToGrid(pixelPos, footprint, cellSize);

    return {
      type: placement.type as UnitType,
      position: snappedPos,
    };
  });
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Compute the centroid (average position) of a list of positions.
 */
function computeCentroid(positions: Vector2[]): Vector2 {
  if (positions.length === 0) return Vector2.zero();

  let sumX = 0;
  let sumY = 0;
  for (const pos of positions) {
    sumX += pos.x;
    sumY += pos.y;
  }
  return new Vector2(sumX / positions.length, sumY / positions.length);
}

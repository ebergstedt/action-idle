/**
 * Grid Manager
 *
 * Pure functions for grid-based positioning in the battle system.
 * Converts between pixel coordinates and grid cells.
 *
 * Godot equivalent: Static functions in a GridManager singleton
 */

import { Vector2 } from '../../physics/Vector2';
import {
  GRID_TOTAL_COLS,
  GRID_TOTAL_ROWS,
  GRID_FLANK_COLS,
  GRID_NO_MANS_LAND_ROWS,
  GRID_DEPLOYMENT_ROWS,
  GRID_DEPLOYMENT_COLS,
} from '../BattleConfig';
import type { GridPosition, GridFootprint, GridBounds, GridConfig } from './GridTypes';

// =============================================================================
// GRID CONFIGURATION
// =============================================================================

/**
 * Get the default grid configuration from BattleConfig constants.
 */
export function getGridConfig(): GridConfig {
  return {
    totalCols: GRID_TOTAL_COLS,
    totalRows: GRID_TOTAL_ROWS,
    flankCols: GRID_FLANK_COLS,
    noMansLandRows: GRID_NO_MANS_LAND_ROWS,
    deploymentRows: GRID_DEPLOYMENT_ROWS,
  };
}

// =============================================================================
// CELL SIZE CALCULATIONS
// =============================================================================

/**
 * Calculate the size of a single grid cell in pixels.
 * Cells are square, sized to fit the grid in the arena.
 *
 * @param arenaWidth - Arena width in pixels
 * @param arenaHeight - Arena height in pixels
 * @returns Cell size in pixels (same for width and height)
 */
export function calculateCellSize(arenaWidth: number, arenaHeight: number): number {
  // Use height as the reference since it's more constrained
  // Arena aspect ratio is designed to make cells square: height/width = 62/72
  const cellFromHeight = arenaHeight / GRID_TOTAL_ROWS;
  const cellFromWidth = arenaWidth / GRID_TOTAL_COLS;

  // Use the smaller to ensure grid fits
  return Math.min(cellFromHeight, cellFromWidth);
}

// =============================================================================
// COORDINATE CONVERSION
// =============================================================================

/**
 * Convert grid position to pixel coordinates (center of the cell).
 *
 * @param gridPos - Grid cell position
 * @param cellSize - Size of each cell in pixels
 * @returns Pixel coordinates at the center of the cell
 */
export function gridToPixel(gridPos: GridPosition, cellSize: number): Vector2 {
  // Center of the cell = (col + 0.5) * cellSize
  return new Vector2((gridPos.col + 0.5) * cellSize, (gridPos.row + 0.5) * cellSize);
}

/**
 * Convert grid bounds to pixel coordinates (center of the bounds).
 *
 * @param bounds - Grid bounds (position + size)
 * @param cellSize - Size of each cell in pixels
 * @returns Pixel coordinates at the center of the bounds
 */
export function gridBoundsToPixelCenter(bounds: GridBounds, cellSize: number): Vector2 {
  // Center = position + half of size
  return new Vector2(
    (bounds.col + bounds.cols / 2) * cellSize,
    (bounds.row + bounds.rows / 2) * cellSize
  );
}

/**
 * Convert pixel coordinates to grid position (floor to cell).
 *
 * @param pixel - Pixel coordinates
 * @param cellSize - Size of each cell in pixels
 * @returns Grid cell containing the pixel
 */
export function pixelToGrid(pixel: Vector2, cellSize: number): GridPosition {
  return {
    col: Math.floor(pixel.x / cellSize),
    row: Math.floor(pixel.y / cellSize),
  };
}

/**
 * Snap pixel coordinates to the center of the nearest grid cell.
 *
 * @param pixel - Pixel coordinates
 * @param cellSize - Size of each cell in pixels
 * @returns Pixel coordinates snapped to cell center
 */
export function snapToGridCenter(pixel: Vector2, cellSize: number): Vector2 {
  const gridPos = pixelToGrid(pixel, cellSize);
  return gridToPixel(gridPos, cellSize);
}

/**
 * Snap pixel coordinates to the center of a footprint placed at the nearest valid grid position.
 * The footprint is centered on the target pixel position.
 *
 * @param pixel - Target pixel coordinates (where footprint center should be)
 * @param footprint - Size of the footprint in grid cells
 * @param cellSize - Size of each cell in pixels
 * @returns Pixel coordinates for the footprint center, snapped to grid
 */
export function snapFootprintToGrid(
  pixel: Vector2,
  footprint: GridFootprint,
  cellSize: number
): Vector2 {
  // Convert pixel to grid, accounting for footprint size
  // The anchor point is the top-left of the footprint, so offset by half the footprint
  const halfCols = footprint.cols / 2;
  const halfRows = footprint.rows / 2;

  // Find the top-left cell that would center the footprint on this pixel
  const topLeftCol = Math.floor(pixel.x / cellSize - halfCols + 0.5);
  const topLeftRow = Math.floor(pixel.y / cellSize - halfRows + 0.5);

  // Convert back to pixel center of the footprint
  return new Vector2((topLeftCol + halfCols) * cellSize, (topLeftRow + halfRows) * cellSize);
}

// =============================================================================
// BOUNDS CHECKING
// =============================================================================

/**
 * Check if two grid bounds overlap.
 *
 * @param a - First bounds
 * @param b - Second bounds
 * @returns True if bounds overlap
 */
export function doGridBoundsOverlap(a: GridBounds, b: GridBounds): boolean {
  // No overlap if one is completely to the left, right, above, or below the other
  return !(
    a.col + a.cols <= b.col || // a is left of b
    b.col + b.cols <= a.col || // b is left of a
    a.row + a.rows <= b.row || // a is above b
    b.row + b.rows <= a.row // b is above a
  );
}

/**
 * Check if a grid bounds is entirely within another bounds.
 *
 * @param inner - Bounds to check
 * @param outer - Container bounds
 * @returns True if inner is entirely within outer
 */
export function isGridBoundsWithin(inner: GridBounds, outer: GridBounds): boolean {
  return (
    inner.col >= outer.col &&
    inner.row >= outer.row &&
    inner.col + inner.cols <= outer.col + outer.cols &&
    inner.row + inner.rows <= outer.row + outer.rows
  );
}

// =============================================================================
// DEPLOYMENT ZONE BOUNDS
// =============================================================================

/**
 * Get the grid bounds for the player's deployment zone (bottom of arena).
 *
 * @returns Grid bounds for player deployment
 */
export function getPlayerDeploymentBounds(): GridBounds {
  return {
    col: GRID_FLANK_COLS,
    row: GRID_DEPLOYMENT_ROWS + GRID_NO_MANS_LAND_ROWS, // After enemy zone + no man's land
    cols: GRID_DEPLOYMENT_COLS,
    rows: GRID_DEPLOYMENT_ROWS,
  };
}

/**
 * Get the grid bounds for the enemy's deployment zone (top of arena).
 *
 * @returns Grid bounds for enemy deployment
 */
export function getEnemyDeploymentBounds(): GridBounds {
  return {
    col: GRID_FLANK_COLS,
    row: 0,
    cols: GRID_DEPLOYMENT_COLS,
    rows: GRID_DEPLOYMENT_ROWS,
  };
}

/**
 * Get the grid bounds for the entire arena (all cells).
 *
 * @returns Grid bounds for entire arena
 */
export function getArenaBounds(): GridBounds {
  return {
    col: 0,
    row: 0,
    cols: GRID_TOTAL_COLS,
    rows: GRID_TOTAL_ROWS,
  };
}

// =============================================================================
// POSITION FINDING
// =============================================================================

/**
 * Find a non-overlapping grid position for a footprint within bounds.
 * Uses a spiral search pattern from the target position.
 *
 * @param footprint - Size of the unit footprint
 * @param targetPixel - Target pixel position to place near
 * @param occupied - List of already-occupied grid bounds
 * @param bounds - Deployment zone bounds to stay within
 * @param cellSize - Size of each cell in pixels
 * @returns Grid position for top-left of footprint, or null if none found
 */
export function findNonOverlappingGridPosition(
  footprint: GridFootprint,
  targetPixel: Vector2,
  occupied: GridBounds[],
  bounds: GridBounds,
  cellSize: number
): GridPosition | null {
  // Convert target pixel to grid position (top-left of footprint)
  const targetGrid = pixelToGrid(
    new Vector2(
      targetPixel.x - (footprint.cols * cellSize) / 2,
      targetPixel.y - (footprint.rows * cellSize) / 2
    ),
    cellSize
  );

  // Generate positions sorted by distance from target
  const positions = generateSortedGridPositions(targetGrid, footprint, bounds);

  for (const pos of positions) {
    const candidateBounds: GridBounds = {
      col: pos.col,
      row: pos.row,
      cols: footprint.cols,
      rows: footprint.rows,
    };

    // Check if within deployment bounds
    if (!isGridBoundsWithin(candidateBounds, bounds)) {
      continue;
    }

    // Check for overlaps with occupied bounds
    let overlaps = false;
    for (const occ of occupied) {
      if (doGridBoundsOverlap(candidateBounds, occ)) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      return pos;
    }
  }

  return null;
}

/**
 * Generate grid positions sorted by distance from a target.
 * Uses a spiral pattern expanding outward.
 *
 * @param target - Target grid position (top-left of footprint)
 * @param footprint - Size of the footprint (for stepping)
 * @param bounds - Bounds to generate positions within
 * @returns Array of grid positions sorted by distance
 */
export function generateSortedGridPositions(
  target: GridPosition,
  footprint: GridFootprint,
  bounds: GridBounds
): GridPosition[] {
  const positions: Array<{ pos: GridPosition; distSq: number }> = [];

  // Step by footprint size to avoid checking positions that would overlap anyway
  const stepCol = Math.max(1, footprint.cols);
  const stepRow = Math.max(1, footprint.rows);

  // Generate all valid positions within bounds
  for (let col = bounds.col; col <= bounds.col + bounds.cols - footprint.cols; col += stepCol) {
    for (let row = bounds.row; row <= bounds.row + bounds.rows - footprint.rows; row += stepRow) {
      const distSq = (col - target.col) ** 2 + (row - target.row) ** 2;
      positions.push({ pos: { col, row }, distSq });
    }
  }

  // Sort by distance
  positions.sort((a, b) => a.distSq - b.distSq);

  return positions.map((p) => p.pos);
}

/**
 * Clamp a grid position to ensure footprint stays within bounds.
 *
 * @param pos - Grid position (top-left of footprint)
 * @param footprint - Size of the footprint
 * @param bounds - Bounds to clamp within
 * @returns Clamped grid position
 */
export function clampGridPosition(
  pos: GridPosition,
  footprint: GridFootprint,
  bounds: GridBounds
): GridPosition {
  return {
    col: Math.max(bounds.col, Math.min(bounds.col + bounds.cols - footprint.cols, pos.col)),
    row: Math.max(bounds.row, Math.min(bounds.row + bounds.rows - footprint.rows, pos.row)),
  };
}

/**
 * Calculate the pixel center of a footprint given its grid position (top-left).
 *
 * @param pos - Grid position of footprint top-left
 * @param footprint - Size of the footprint
 * @param cellSize - Size of each cell in pixels
 * @returns Pixel coordinates of the footprint center
 */
export function getFootprintPixelCenter(
  pos: GridPosition,
  footprint: GridFootprint,
  cellSize: number
): Vector2 {
  return new Vector2(
    (pos.col + footprint.cols / 2) * cellSize,
    (pos.row + footprint.rows / 2) * cellSize
  );
}

/**
 * Get the grid position (top-left) from a footprint's pixel center.
 *
 * @param pixelCenter - Pixel coordinates of the footprint center
 * @param footprint - Size of the footprint
 * @param cellSize - Size of each cell in pixels
 * @returns Grid position of footprint top-left
 */
export function getFootprintGridPosition(
  pixelCenter: Vector2,
  footprint: GridFootprint,
  cellSize: number
): GridPosition {
  return {
    col: Math.floor(pixelCenter.x / cellSize - footprint.cols / 2 + 0.5),
    row: Math.floor(pixelCenter.y / cellSize - footprint.rows / 2 + 0.5),
  };
}

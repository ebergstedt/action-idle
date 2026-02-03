/**
 * Grid Types
 *
 * Type definitions for the grid-based deployment system.
 * Pure TypeScript - portable to Godot.
 *
 * Godot equivalent: Resource classes or typed dictionaries
 */

/**
 * Position on the battle grid (cell coordinates).
 */
export interface GridPosition {
  /** Column index (0 to GRID_TOTAL_COLS - 1) */
  col: number;
  /** Row index (0 to GRID_TOTAL_ROWS - 1) */
  row: number;
}

/**
 * Size of a unit's footprint on the grid.
 */
export interface GridFootprint {
  /** Width in grid cells */
  cols: number;
  /** Depth in grid cells */
  rows: number;
}

/**
 * Rectangular bounds on the grid (position + size).
 */
export interface GridBounds {
  /** Left column of the bounds */
  col: number;
  /** Top row of the bounds */
  row: number;
  /** Width in columns */
  cols: number;
  /** Height in rows */
  rows: number;
}

/**
 * Configuration for the battle grid.
 */
export interface GridConfig {
  /** Total columns in the grid */
  totalCols: number;
  /** Total rows in the grid */
  totalRows: number;
  /** Columns reserved for flanks on each side */
  flankCols: number;
  /** Rows for no man's land between deployment zones */
  noMansLandRows: number;
  /** Rows for each deployment zone */
  deploymentRows: number;
}

/**
 * Create GridBounds from a position and footprint.
 */
export function createGridBounds(pos: GridPosition, footprint: GridFootprint): GridBounds {
  return {
    col: pos.col,
    row: pos.row,
    cols: footprint.cols,
    rows: footprint.rows,
  };
}

/**
 * Check if a position is within grid bounds.
 */
export function isPositionInBounds(pos: GridPosition, bounds: GridBounds): boolean {
  return (
    pos.col >= bounds.col &&
    pos.col < bounds.col + bounds.cols &&
    pos.row >= bounds.row &&
    pos.row < bounds.row + bounds.rows
  );
}

/**
 * Grid Module
 *
 * Grid-based positioning system for battle deployment.
 * All exports are pure TypeScript - portable to Godot.
 */

export type { GridPosition, GridFootprint, GridBounds, GridConfig } from './GridTypes';
export { createGridBounds, isPositionInBounds } from './GridTypes';

export {
  // Configuration
  getGridConfig,
  // Cell size
  calculateCellSize,
  // Coordinate conversion
  gridToPixel,
  gridBoundsToPixelCenter,
  pixelToGrid,
  snapToGridCenter,
  snapFootprintToGrid,
  // Bounds checking
  doGridBoundsOverlap,
  isGridBoundsWithin,
  // Deployment zones
  getPlayerDeploymentBounds,
  getEnemyDeploymentBounds,
  getArenaBounds,
  // Position finding
  findNonOverlappingGridPosition,
  generateSortedGridPositions,
  clampGridPosition,
  getFootprintPixelCenter,
  getFootprintGridPosition,
} from './GridManager';

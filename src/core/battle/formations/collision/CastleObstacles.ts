/**
 * Castle Obstacles for Formation Placement
 *
 * Generates obstacle bounds for castles to prevent unit overlap.
 * Uses the reusable IObstacle system for consistent collision detection.
 */

import {
  CASTLE_BACK_DISTANCE_ROWS,
  CASTLE_EDGE_DISTANCE_COLS,
  CASTLE_GRID_COLS,
  CASTLE_GRID_ROWS,
  GRID_TOTAL_COLS,
  GRID_TOTAL_ROWS,
} from '../../BattleConfig';
import { calculateCellSize } from '../../grid/GridManager';
import type { SquadBounds, ArenaBounds } from '../../FormationManager';

/**
 * Generate obstacle bounds for all 4 castles (2 per team).
 *
 * Castle positions match BattleEngine.spawnCastles():
 * - Player castles: bottom zone, left and right (equal distance from edges)
 * - Enemy castles: top zone, left and right (equal distance from edges)
 *
 * Castles are just units now - no special padding.
 * Castles are 4x4 grid cells in size.
 *
 * @param bounds - Arena dimensions
 * @returns Array of SquadBounds representing castle obstacle areas
 */
export function generateCastleObstacles(bounds: ArenaBounds): SquadBounds[] {
  const { width, height } = bounds;
  const cellSize = calculateCellSize(width, height);

  // Castle grid dimensions (4x4 footprint)
  const castleSize = CASTLE_GRID_COLS; // 4

  // Horizontal positions: use pure grid-based positioning for exact alignment
  // Left castle: center at col 22 (occupies cols 20-23, 20 squares from left edge)
  const leftCol = CASTLE_EDGE_DISTANCE_COLS + castleSize / 2; // 20 + 2 = 22
  // Right castle: center at col 50 (occupies cols 48-51, 20 squares from right edge)
  const rightCol = GRID_TOTAL_COLS - CASTLE_EDGE_DISTANCE_COLS - castleSize / 2; // 72 - 20 - 2 = 50
  const leftX = leftCol * cellSize;
  const rightX = rightCol * cellSize;

  // Vertical positions: place castles at the back of deployment zones (10 squares from edge)
  // Enemy back is at top, center at row 12 (occupies rows 10-13)
  const enemyY = (CASTLE_BACK_DISTANCE_ROWS + castleSize / 2) * cellSize; // (10 + 2) * cellSize
  // Player back is at bottom, center at row 50 (occupies rows 48-51)
  const playerY = (GRID_TOTAL_ROWS - CASTLE_BACK_DISTANCE_ROWS - castleSize / 2) * cellSize; // (62 - 10 - 2) * cellSize

  // Castle size from grid footprint (4x4 cells) - no padding, just like regular units
  const castleWidth = CASTLE_GRID_COLS * cellSize;
  const castleHeight = CASTLE_GRID_ROWS * cellSize;

  // Generate bounds for all 4 castles
  const obstacles: SquadBounds[] = [
    // Player castles (bottom zone)
    {
      x: leftX - castleWidth / 2,
      y: playerY - castleHeight / 2,
      width: castleWidth,
      height: castleHeight,
    },
    {
      x: rightX - castleWidth / 2,
      y: playerY - castleHeight / 2,
      width: castleWidth,
      height: castleHeight,
    },
    // Enemy castles (top zone)
    {
      x: leftX - castleWidth / 2,
      y: enemyY - castleHeight / 2,
      width: castleWidth,
      height: castleHeight,
    },
    {
      x: rightX - castleWidth / 2,
      y: enemyY - castleHeight / 2,
      width: castleWidth,
      height: castleHeight,
    },
  ];

  return obstacles;
}

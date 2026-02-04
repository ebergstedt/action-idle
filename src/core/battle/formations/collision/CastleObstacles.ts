/**
 * Castle Obstacles for Formation Placement
 *
 * Generates obstacle bounds for castles to prevent unit overlap.
 * Uses the reusable IObstacle system for consistent collision detection.
 */

import {
  CASTLE_GRID_COLS,
  CASTLE_GRID_ROWS,
  GRID_FLANK_COLS,
  GRID_NO_MANS_LAND_ROWS,
  GRID_DEPLOYMENT_ROWS,
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

  // Horizontal positions: place castles at equal distance from arena edges
  // Use actual arena width for symmetric positioning
  const edgeOffset = (GRID_FLANK_COLS + castleSize / 2) * cellSize;
  const leftX = edgeOffset;
  const rightX = width - edgeOffset;

  // Vertical positions: center castles in deployment zones
  const enemyRow = Math.floor((GRID_DEPLOYMENT_ROWS - castleSize) / 2);
  const playerRow =
    GRID_DEPLOYMENT_ROWS +
    GRID_NO_MANS_LAND_ROWS +
    Math.floor((GRID_DEPLOYMENT_ROWS - castleSize) / 2);

  // Convert grid positions to pixel centers
  const enemyY = (enemyRow + castleSize / 2) * cellSize;
  const playerY = (playerRow + castleSize / 2) * cellSize;

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

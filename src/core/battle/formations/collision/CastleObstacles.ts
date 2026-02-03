/**
 * Castle Obstacles for Formation Placement
 *
 * Generates obstacle bounds for castles to prevent unit overlap.
 * Uses the reusable IObstacle system for consistent collision detection.
 */

import {
  CASTLE_GRID_COLS,
  CASTLE_GRID_ROWS,
  BASE_CASTLE_HORIZONTAL_MARGIN,
  BASE_OBSTACLE_PADDING,
  ZONE_HEIGHT_PERCENT,
  ZONE_MIDWAY_DIVISOR,
  GRID_TOTAL_ROWS,
  scaleValue,
} from '../../BattleConfig';
import type { SquadBounds, ArenaBounds } from '../../FormationManager';

/**
 * Generate obstacle bounds for all 4 castles (2 per team).
 *
 * Castle positions match BattleEngine.spawnCastles():
 * - Player castles: bottom zone, left and right flanks
 * - Enemy castles: top zone, left and right flanks
 *
 * Each castle bound includes padding to keep units at a safe distance.
 * Castles are 4x4 grid cells in size.
 *
 * @param bounds - Arena dimensions
 * @returns Array of SquadBounds representing castle obstacle areas
 */
export function generateCastleObstacles(bounds: ArenaBounds): SquadBounds[] {
  const { width, height } = bounds;
  const zoneHeight = height * ZONE_HEIGHT_PERCENT;
  const cellSize = height / GRID_TOTAL_ROWS;

  // Castle positions (same calculation as BattleEngine.spawnCastles)
  const castleMargin = scaleValue(BASE_CASTLE_HORIZONTAL_MARGIN, height);
  const leftX = castleMargin;
  const rightX = width - castleMargin;

  // Castle Y positions (centered in each zone)
  const playerY = height - zoneHeight / ZONE_MIDWAY_DIVISOR;
  const enemyY = zoneHeight / ZONE_MIDWAY_DIVISOR;

  // Castle size from grid footprint (4x4 cells) plus padding
  const castleWidth = CASTLE_GRID_COLS * cellSize;
  const castleHeight = CASTLE_GRID_ROWS * cellSize;
  const padding = scaleValue(BASE_OBSTACLE_PADDING, height);
  const obstacleWidth = castleWidth + padding * 2;
  const obstacleHeight = castleHeight + padding * 2;

  // Generate bounds for all 4 castles
  const obstacles: SquadBounds[] = [
    // Player castles (bottom zone)
    {
      x: leftX - obstacleWidth / 2,
      y: playerY - obstacleHeight / 2,
      width: obstacleWidth,
      height: obstacleHeight,
    },
    {
      x: rightX - obstacleWidth / 2,
      y: playerY - obstacleHeight / 2,
      width: obstacleWidth,
      height: obstacleHeight,
    },
    // Enemy castles (top zone)
    {
      x: leftX - obstacleWidth / 2,
      y: enemyY - obstacleHeight / 2,
      width: obstacleWidth,
      height: obstacleHeight,
    },
    {
      x: rightX - obstacleWidth / 2,
      y: enemyY - obstacleHeight / 2,
      width: obstacleWidth,
      height: obstacleHeight,
    },
  ];

  return obstacles;
}

/**
 * Castle Obstacles for Formation Placement
 *
 * Generates obstacle bounds for castles to prevent unit overlap.
 */

import {
  CASTLE_SIZE,
  BASE_CASTLE_HORIZONTAL_MARGIN,
  BASE_CASTLE_FORMATION_PADDING,
  ZONE_HEIGHT_PERCENT,
  ZONE_MIDWAY_DIVISOR,
  scaleValue,
} from '../../BattleConfig';
import { ArenaBounds, SquadBounds } from '../types';

/**
 * Generate obstacle bounds for all 4 castles (2 per team).
 *
 * Castle positions match BattleEngine.spawnCastles():
 * - Player castles: bottom zone, left and right flanks
 * - Enemy castles: top zone, left and right flanks
 *
 * Each castle bound includes padding to keep units at a safe distance.
 *
 * @param bounds - Arena dimensions
 * @returns Array of SquadBounds representing castle obstacle areas
 */
export function generateCastleObstacles(bounds: ArenaBounds): SquadBounds[] {
  const { width, height } = bounds;
  const zoneHeight = height * ZONE_HEIGHT_PERCENT;

  // Castle positions (same calculation as BattleEngine.spawnCastles)
  const castleMargin = scaleValue(BASE_CASTLE_HORIZONTAL_MARGIN, height);
  const leftX = castleMargin;
  const rightX = width - castleMargin;

  // Castle Y positions (centered in each zone)
  const playerY = height - zoneHeight / ZONE_MIDWAY_DIVISOR;
  const enemyY = zoneHeight / ZONE_MIDWAY_DIVISOR;

  // Castle size with padding
  const castleSize = scaleValue(CASTLE_SIZE, height);
  const padding = scaleValue(BASE_CASTLE_FORMATION_PADDING, height);
  const obstacleSize = (castleSize + padding) * 2; // Diameter + padding on all sides

  // Generate bounds for all 4 castles
  const obstacles: SquadBounds[] = [
    // Player castles (bottom zone)
    {
      x: leftX - obstacleSize / 2,
      y: playerY - obstacleSize / 2,
      width: obstacleSize,
      height: obstacleSize,
    },
    {
      x: rightX - obstacleSize / 2,
      y: playerY - obstacleSize / 2,
      width: obstacleSize,
      height: obstacleSize,
    },
    // Enemy castles (top zone)
    {
      x: leftX - obstacleSize / 2,
      y: enemyY - obstacleSize / 2,
      width: obstacleSize,
      height: obstacleSize,
    },
    {
      x: rightX - obstacleSize / 2,
      y: enemyY - obstacleSize / 2,
      width: obstacleSize,
      height: obstacleSize,
    },
  ];

  return obstacles;
}

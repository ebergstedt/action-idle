/**
 * Castle Obstacles for Formation Placement
 *
 * Generates obstacle bounds for castles to prevent unit overlap.
 */

import { ArenaBounds, SquadBounds } from '../types';

/**
 * Generate obstacle bounds for all 4 castles (2 per team).
 *
 * Currently disabled - returns empty array to allow units to be placed anywhere
 * in the deployment zone, including on top of castles.
 *
 * @param _bounds - Arena dimensions (unused)
 * @returns Empty array (castle obstacles disabled)
 */
export function generateCastleObstacles(_bounds: ArenaBounds): SquadBounds[] {
  // Castle obstacles disabled - allow deployment anywhere
  return [];
}

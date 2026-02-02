/**
 * Collision Detection Module
 *
 * Exports collision detection utilities for formation placement.
 */

export { calculateSquadFootprint } from './SquadFootprint';
export {
  boundsOverlap,
  generateSortedGridPositions,
  findNonOverlappingPosition,
} from './CollisionDetection';
export { generateCastleObstacles } from './CastleObstacles';

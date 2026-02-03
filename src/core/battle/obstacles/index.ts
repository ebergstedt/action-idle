/**
 * Obstacle System Exports
 */

export type { IObstacle, ObstacleBounds } from './Obstacle';
export {
  getObstacleBounds,
  isPointInObstacle,
  circleCollidesWithObstacle,
  boundsOverlap,
  calculateObstacleAvoidance,
} from './Obstacle';

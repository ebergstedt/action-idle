/**
 * Formations Module
 *
 * Modular formation system for unit placement.
 * Re-exports from specialized submodules.
 *
 * Godot equivalent: Formation resources and spawner scripts.
 */

// Type definitions
export type {
  UnitType,
  UnitPlacement,
  FormationTemplate,
  SpawnPosition,
  ArenaBounds,
  SquadFootprint,
  SquadBounds,
  SpreadType,
  RoleConfig,
  EnemyFormationPattern,
  RoleSwap,
} from './types';

// Patterns
export { DEFAULT_ENEMY_PATTERNS } from './patterns/EnemyPatterns';
export { DEFAULT_ALLIED_PATTERNS } from './patterns/AlliedPatterns';

// Collision detection
export { calculateSquadFootprint } from './collision/SquadFootprint';
export {
  boundsOverlap,
  generateSortedGridPositions,
  findNonOverlappingPosition,
} from './collision/CollisionDetection';
export { generateCastleObstacles } from './collision/CastleObstacles';

// Role mapping and pattern selection
export { ROLE_SWAPS, createRoleMapper } from './roles/RoleMapper';
export { selectPatternForWave, selectAlliedPatternForWave } from './roles/PatternSelector';

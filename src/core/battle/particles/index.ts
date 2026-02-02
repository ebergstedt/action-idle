/**
 * Particle Systems
 *
 * Core particle physics and spawning logic.
 * Godot-portable: Pure TypeScript with no React dependencies.
 */

export {
  processDustParticles,
  updateDustParticles,
  spawnDustParticles,
  isUnitMoving,
  createDustSpawnState,
} from './DustParticleSystem';

export type { DustParticle, DustSpawnUnit, DustSpawnState } from './DustParticleSystem';

export {
  processInkSplatters,
  updateInkSplatters,
  spawnHitSplatters,
  spawnDeathSplatters,
  createInkSpawnState,
  clearInkSpawnState,
} from './InkSplatterSystem';

export type { InkSplatter, InkSpawnUnit, InkSpawnState } from './InkSplatterSystem';

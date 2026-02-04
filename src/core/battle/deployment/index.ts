/**
 * Deployment Module
 *
 * Pure TypeScript functions for battle deployment.
 * All exports are Godot-portable.
 */

export type { WaveSpawnConfig, SpawnBounds } from './DeploymentService';
export { spawnWaveUnits, resolveAllOverlaps, resolvePlayerOverlaps } from './DeploymentService';

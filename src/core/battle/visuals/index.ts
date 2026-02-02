/**
 * Visual Systems
 *
 * Core logic for visual effects and feedback.
 * Godot-portable: Pure TypeScript with no React dependencies.
 */

export {
  calculateGhostHealth,
  processGhostHealth,
  createGhostHealthMap,
} from './GhostHealthSystem';

export type { GhostHealthState, GhostHealthUnit, GhostHealthMap } from './GhostHealthSystem';

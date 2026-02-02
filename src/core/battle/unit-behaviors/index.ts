/**
 * Unit Behaviors Module
 *
 * Extracted subsystems from UnitEntity for better testability and reusability.
 * All functions are pure - they take state and return new state.
 *
 * Godot equivalent: Reusable behavior scripts/functions for unit AI.
 */

// Types
export type {
  TargetableUnit,
  TargetingContext,
  TargetingResult,
  CombatUnit,
  CombatContext,
  MovableUnit,
  AllyData,
  MovementContext,
  VisualState,
  VisualResult,
} from './types';

// Visual Effects System
export {
  decayVisualOffset,
  advanceWalkAnimation,
  resetWalkAnimation,
  applyKnockback,
  applyLunge,
  updateVisualEffects,
} from './VisualEffects';

// Targeting System
export {
  getAggroRadius,
  isDeepInEnemyZone,
  areAllEnemyCastlesDestroyed,
  findDamageableInAggroRadius,
  findNearestDamageable,
  findClosestEnemyCastle,
  updateTargeting,
} from './TargetingSystem';

// Combat System
export type { CombatUpdateResult } from './CombatSystem';
export {
  getAttackMode,
  getMaxRange,
  isInMeleeMode,
  isMeleeAttack,
  isInRange,
  calculateModifiedDamage,
  getAttackDirection,
  getAttackCooldown,
  updateCombat,
} from './CombatSystem';

// Movement System
export type { MovementResult } from './MovementSystem';
export {
  getForwardDirection,
  calculateMarchDirection,
  calculateAllyAvoidance,
  calculatePathAvoidance,
  clampSpeed,
  marchForward,
  moveTowardTarget,
} from './MovementSystem';

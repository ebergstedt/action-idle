/**
 * Battle Types
 *
 * This file contains:
 * 1. Re-exports of the new unit system types (UnitDefinition, UnitInstance, etc.)
 * 2. Legacy types (Unit, Projectile, BattleState) for React rendering compatibility
 *
 * The legacy types are used by React components for rendering. They are NOT
 * needed for the core battle logic, which uses the entity system directly.
 *
 * Godot migration: Ignore the legacy types - they only exist for React.
 */

import { Vector2 } from '../physics/Vector2';
import { MAX_UNIT_SCALE, MIN_UNIT_SCALE, REFERENCE_ARENA_HEIGHT } from './BattleConfig';
import type { UnitTeam as UnitTeamType } from './units/types';

// =============================================================================
// NEW UNIT SYSTEM TYPES - Use these for all new code
// =============================================================================

export type {
  UnitTeam,
  UnitCategory,
  UnitShape,
  UnitInstance,
  UnitDefinition,
} from './units/types';
export type { AttackModeStats, BaseStats, ComputedStats } from './units/types';

// =============================================================================
// LEGACY TYPES - For React rendering compatibility only
// =============================================================================

// Local alias for use in this file
type UnitTeam = UnitTeamType;

/**
 * Legacy unit type identifier.
 * @deprecated Use UnitDefinition.id instead
 */
export type UnitType = 'warrior' | 'archer' | 'knight';

/**
 * Legacy attack type.
 * @deprecated Use 'melee' | 'ranged' directly
 */
export type AttackType = 'melee' | 'ranged';

/**
 * Legacy attack mode stats.
 * @deprecated Use AttackModeStats from './units/types' instead
 */
export interface AttackMode {
  damage: number;
  attackSpeed: number;
  range: number;
}

/**
 * Legacy unit stats interface.
 * @deprecated Use BaseStats from './units/types' instead
 */
export interface UnitStats {
  maxHealth: number;
  moveSpeed: number;
  melee: AttackMode | null;
  ranged: AttackMode | null;
}

/**
 * Legacy modifier interface for React rendering.
 * Simplified version of ActiveModifier for display purposes.
 */
export interface LegacyModifier {
  id: string;
  sourceId: string;
  remainingDuration: number;
}

/**
 * Legacy unit interface for React rendering.
 * This is a snapshot of a unit's state, NOT the live entity.
 *
 * @deprecated For new code, use UnitEntity from './entities' directly.
 * This type exists only for React components that render battle state.
 */
export interface Unit {
  id: string;
  type: UnitType;
  team: UnitTeam;
  position: Vector2;
  health: number;
  stats: UnitStats;
  target: Unit | null;
  attackCooldown: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  size: number;
  shuffleDirection: Vector2 | null;
  shuffleTimer: number;
  activeModifiers: LegacyModifier[];
}

/**
 * Legacy projectile interface for React rendering.
 *
 * @deprecated For new code, use ProjectileEntity from './entities' directly.
 */
export interface Projectile {
  id: string;
  position: Vector2;
  target: Vector2;
  speed: number;
  damage: number;
  sourceTeam: UnitTeam;
  color: string;
}

/**
 * Legacy castle interface for React rendering.
 */
export interface Castle {
  id: string;
  team: UnitTeam;
  position: Vector2;
  health: number;
  maxHealth: number;
  size: number;
  color: string;
}

/**
 * Legacy shockwave interface for React rendering.
 */
export interface Shockwave {
  id: string;
  position: Vector2;
  currentRadius: number;
  maxRadius: number;
  sourceTeam: UnitTeam;
  color: string;
}

/**
 * Battle outcome after battle ends.
 */
export type BattleOutcome = 'pending' | 'player_victory' | 'enemy_victory' | 'draw';

/**
 * Legacy battle state for React rendering.
 * Contains snapshots of all units and projectiles.
 *
 * @deprecated For new code, use BattleWorld from './entities' directly.
 */
export interface BattleState {
  units: Unit[];
  projectiles: Projectile[];
  castles: Castle[];
  shockwaves: Shockwave[];
  isRunning: boolean;
  hasStarted: boolean;
  waveNumber: number;
  outcome: BattleOutcome;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate scaled unit size based on arena dimensions.
 * Used by both entity system and React rendering.
 */
export function getScaledUnitSize(baseSize: number, arenaHeight: number): number {
  const scale = Math.max(
    MIN_UNIT_SCALE,
    Math.min(MAX_UNIT_SCALE, arenaHeight / REFERENCE_ARENA_HEIGHT)
  );
  return Math.round(baseSize * scale);
}

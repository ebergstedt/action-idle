/**
 * Battle Types
 *
 * This file contains:
 * 1. Re-exports of the new unit system types (UnitDefinition, UnitInstance, etc.)
 * 2. Render data types (UnitRenderData, ProjectileRenderData, etc.) - DTOs for React rendering
 *
 * The render data types are snapshots of entity state for the React rendering layer.
 * They are NOT needed for core battle logic, which uses the entity system directly.
 *
 * Godot migration: Ignore the render data types - they only exist for React.
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
// RENDER DATA TYPES - DTOs for React rendering layer
// =============================================================================

// Local alias for use in this file
type UnitTeam = UnitTeamType;

/**
 * Render data unit type identifier.
 * @deprecated Use UnitDefinition.id instead
 */
export type UnitType = 'warrior' | 'archer' | 'knight';

/**
 * Render data attack type.
 * @deprecated Use 'melee' | 'ranged' directly
 */
export type AttackType = 'melee' | 'ranged';

/**
 * Render data attack mode stats.
 * @deprecated Use AttackModeStats from './units/types' instead
 */
export interface AttackMode {
  damage: number;
  attackSpeed: number;
  range: number;
}

/**
 * Render data unit stats interface.
 * @deprecated Use BaseStats from './units/types' instead
 */
export interface UnitStats {
  maxHealth: number;
  moveSpeed: number;
  melee: AttackMode | null;
  ranged: AttackMode | null;
}

/**
 * Modifier render data for React rendering.
 * Simplified version of ActiveModifier for display purposes.
 */
export interface ModifierRenderData {
  id: string;
  sourceId: string;
  remainingDuration: number;
}

/**
 * Unit render data for React rendering.
 * This is a snapshot of a unit's state, NOT the live entity.
 *
 * @deprecated For new code, use UnitEntity from './entities' directly.
 * This type exists only for React components that render battle state.
 */
export interface UnitRenderData {
  id: string;
  type: UnitType;
  team: UnitTeam;
  position: Vector2;
  health: number;
  stats: UnitStats;
  target: UnitRenderData | null;
  attackCooldown: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  size: number;
  shuffleDirection: Vector2 | null;
  shuffleTimer: number;
  activeModifiers: ModifierRenderData[];
  /** Visual offset for melee lunge/knockback effects */
  visualOffset: Vector2;
}

/**
 * Projectile render data for React rendering.
 *
 * @deprecated For new code, use ProjectileEntity from './entities' directly.
 */
export interface ProjectileRenderData {
  id: string;
  position: Vector2;
  target: Vector2;
  speed: number;
  damage: number;
  sourceTeam: UnitTeam;
  color: string;
}

/**
 * Castle render data for React rendering.
 */
export interface CastleRenderData {
  id: string;
  team: UnitTeam;
  position: Vector2;
  health: number;
  maxHealth: number;
  size: number;
  color: string;
}

/**
 * Shockwave render data for React rendering.
 */
export interface ShockwaveRenderData {
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
 * Battle state for React rendering.
 * Contains snapshots of all units and projectiles.
 *
 * @deprecated For new code, use BattleWorld from './entities' directly.
 */
export interface BattleState {
  units: UnitRenderData[];
  projectiles: ProjectileRenderData[];
  castles: CastleRenderData[];
  shockwaves: ShockwaveRenderData[];
  isRunning: boolean;
  hasStarted: boolean;
  waveNumber: number;
  outcome: BattleOutcome;
}

// =============================================================================
// TYPE ALIASES FOR BACKWARD COMPATIBILITY
// =============================================================================

/**
 * @deprecated Use UnitRenderData instead
 */
export type Unit = UnitRenderData;

/**
 * @deprecated Use ProjectileRenderData instead
 */
export type Projectile = ProjectileRenderData;

/**
 * @deprecated Use CastleRenderData instead
 */
export type Castle = CastleRenderData;

/**
 * @deprecated Use ShockwaveRenderData instead
 */
export type Shockwave = ShockwaveRenderData;

/**
 * @deprecated Use ModifierRenderData instead
 */
export type LegacyModifier = ModifierRenderData;

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

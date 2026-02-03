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
import { GRID_TOTAL_ROWS, UNIT_SIZE_CELL_FRACTION } from './BattleConfig';
import type { UnitTeam as UnitTeamType, UnitShape as UnitShapeType } from './units/types';
import type { DamageNumberRenderData } from './entities/DamageNumberEntity';
import type { GridFootprint } from './grid/GridTypes';

// Re-export for convenience
export type { DamageNumberRenderData } from './entities/DamageNumberEntity';

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
export type UnitType = string;

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
  /** Projectile speed override (uses BASE_PROJECTILE_SPEED if not set) */
  projectileSpeed?: number;
  /** Splash/AoE damage radius (0 or undefined = single target) */
  splashRadius?: number;
}

/**
 * Render data unit stats interface.
 * @deprecated Use BaseStats from './units/types' instead
 */
export interface UnitStats {
  maxHealth: number;
  moveSpeed: number;
  attackInterval?: number; // seconds between attacks (from Mechabellum)
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
  /** Squad identifier - units spawned together share the same squadId */
  squadId: string;
  position: Vector2;
  health: number;
  stats: UnitStats;
  target: UnitRenderData | null;
  attackCooldown: number;
  color: string;
  shape: UnitShapeType;
  size: number;
  shuffleDirection: Vector2 | null;
  shuffleTimer: number;
  activeModifiers: ModifierRenderData[];
  /** Visual offset for melee lunge/knockback effects */
  visualOffset: Vector2;
  /** Timer for hit flash effect (> 0 means unit should flash) */
  hitFlashTimer: number;
  /** Timer for death fade effect (>= 0 means dying, -1 means alive) */
  deathFadeTimer: number;
  /** Walk animation elapsed time in seconds (generic, used by animation system) */
  walkAnimationTime: number;
  /** Walk animation type ID (e.g., 'bounce', 'none') */
  walkAnimation: string;
  /** Target position for aiming laser (null if not aiming or no laser) */
  aimingAt: Vector2 | null;
  /** Grid footprint for deployment positioning (from unit definition) */
  gridFootprint: GridFootprint;
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
  /** Grid footprint (cols x rows) for collision and rendering */
  gridFootprint: GridFootprint;
  /** @deprecated Use gridFootprint instead. Kept for backwards compatibility. */
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
 * Result of handling a battle outcome.
 * Returned by BattleEngine.handleBattleOutcome().
 */
export interface BattleOutcomeResult {
  /** The outcome that was handled */
  outcome: BattleOutcome;
  /** Wave number before the transition */
  previousWave: number;
  /** Wave number after the transition */
  newWave: number;
  /** Gold earned (0 on defeat/draw) */
  goldEarned: number;
  /** Whether the wave number changed */
  waveChanged: boolean;
}

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
  damageNumbers: DamageNumberRenderData[];
  isRunning: boolean;
  hasStarted: boolean;
  waveNumber: number;
  highestWave: number;
  gold: number;
  outcome: BattleOutcome;
  /** Current time scale (1.0 = normal, 6.0 = max with idle speed-up) */
  timeScale: number;
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
 * Calculate unit size (radius) based on grid cell size and unit's grid footprint.
 * Each unit fits within its unitGridSize with padding.
 *
 * The `size` value is used as a radius in rendering (e.g., ctx.arc uses radius),
 * so we divide by 2 to get the radius from the desired diameter.
 *
 * @param unitGridCols - How many grid columns the unit occupies (default 1)
 * @param arenaHeight - Current arena height in pixels
 * @returns Unit size (radius) in pixels
 */
export function getScaledUnitSize(unitGridCols: number, arenaHeight: number): number {
  const cellSize = arenaHeight / GRID_TOTAL_ROWS;
  // Unit visual size is based on how many cells it spans
  const gridCols = unitGridCols || 1;
  // Diameter = cellSize * gridCols * fraction, radius = diameter / 2
  return Math.round((cellSize * gridCols * UNIT_SIZE_CELL_FRACTION) / 2);
}

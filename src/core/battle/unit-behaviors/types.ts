/**
 * Unit Behaviors Type Definitions
 *
 * Minimal interfaces for the extracted behavior systems.
 * These types allow pure functions to operate on unit-like objects.
 *
 * Godot equivalent: Type definitions for behavior script parameters.
 */

import { Vector2 } from '../../physics/Vector2';
import { IDamageable } from '../IEntity';
import { EntityBounds } from '../BoundsEnforcer';
import { UnitTeam, UnitStats } from '../types';
import type { IObstacle } from '../obstacles/Obstacle';

/**
 * Minimal unit interface for targeting system.
 * Represents the data needed for target acquisition.
 */
export interface TargetableUnit {
  readonly id: string;
  readonly team: UnitTeam;
  readonly position: Vector2;
  readonly size: number;
  target: IDamageable | null;
  seekMode: boolean;
  retargetCooldown: number;
}

/**
 * Context for targeting operations.
 * Provides world queries and configuration.
 */
export interface TargetingContext {
  /** Get enemy damageables (units and castles) */
  getEnemyDamageables(): readonly IDamageable[];
  /** Get enemy castles specifically */
  getEnemyCastles(): readonly IDamageable[];
  /** Get initial castle count for a team */
  getInitialCastleCount(team: UnitTeam): number;
  /** Arena bounds for zone detection */
  bounds: EntityBounds | null;
  /** Arena height for scaling */
  arenaHeight: number;
}

/**
 * Result of targeting update.
 */
export interface TargetingResult {
  target: IDamageable | null;
  seekMode: boolean;
  retargetCooldown: number;
}

/**
 * Minimal unit interface for combat system.
 */
export interface CombatUnit {
  readonly id: string;
  readonly team: UnitTeam;
  readonly position: Vector2;
  readonly size: number;
  readonly stats: UnitStats;
  attackCooldown: number;
  target: IDamageable | null;
  visualOffset: Vector2;
}

/**
 * Context for combat operations.
 */
export interface CombatContext {
  /** Get arena height for scaling */
  arenaHeight: number;
  /** Spawn a projectile */
  spawnProjectile: (
    position: Vector2,
    target: Vector2,
    damage: number,
    team: UnitTeam,
    sourceUnit: CombatUnit,
    color: string,
    projectileSpeed?: number,
    splashRadius?: number
  ) => void;
}

/**
 * Minimal unit interface for movement system.
 */
export interface MovableUnit {
  readonly id: string;
  readonly team: UnitTeam;
  position: Vector2;
  readonly size: number;
  target: IDamageable | null;
  shuffleDirection: Vector2 | null;
  shuffleTimer: number;
  walkAnimationTime: number;
  /** Get collision size after modifiers */
  getCollisionSize(): number;
  /** Get movement speed after modifiers */
  getModifiedMoveSpeed(): number;
}

/**
 * Ally data for avoidance calculations.
 */
export interface AllyData {
  readonly id: string;
  readonly position: Vector2;
  readonly health: number;
  /** Get collision size after modifiers */
  getCollisionSize(): number;
}

/**
 * Context for movement operations.
 */
export interface MovementContext {
  /** Get all allied units */
  getAllies(): readonly AllyData[];
  /** Get enemy castles (for march direction) */
  getEnemyCastles(): readonly IDamageable[];
  /** Check if any enemy castle has been destroyed */
  hasAnyEnemyCastleBeenDestroyed(): boolean;
  /** Get all obstacles for movement avoidance */
  getObstacles(): readonly IObstacle[];
  /** Arena bounds for boundary enforcement */
  bounds: EntityBounds | null;
  /** Arena height for scaling */
  arenaHeight: number;
}

/**
 * Visual state for a unit.
 */
export interface VisualState {
  visualOffset: Vector2;
  walkAnimationTime: number;
}

/**
 * Result of visual effects update.
 */
export interface VisualResult {
  visualOffset: Vector2;
  walkAnimationTime: number;
}

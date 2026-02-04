/**
 * Battle World Interface
 *
 * Defines the query interface that battle entities use to interact with the world.
 * This is what entities see - they don't know about BattleEngine internals.
 *
 * Godot equivalent: Methods on parent node or autoload that entities can call.
 */

import { Vector2 } from '../../physics/Vector2';
import { EntityBounds } from '../BoundsEnforcer';
import { IDamageable } from '../IEntity';
import { UnitTeam } from '../units/types';
import { IEntityWorld } from './BaseEntity';
import { UnitEntity } from './UnitEntity';

/**
 * Combat helper interface for path blocking checks.
 */
export interface ICombatHelpers {
  /** Check if path between two points is blocked by units */
  isPathBlocked(from: Vector2, to: Vector2, excludeUnit: UnitEntity): boolean;
}

/**
 * World state interface for bounds and ID generation.
 */
export interface IWorldState {
  /** Get current arena bounds */
  getArenaBounds(): EntityBounds | null;

  /** Get next unique modifier ID */
  getNextModifierId(): number;
}

/**
 * Query interface for battle entities.
 * Extends IEntityWorld with battle-specific queries.
 */
export interface IBattleWorld extends IEntityWorld, ICombatHelpers, IWorldState {
  // === Unit Queries ===

  /** Get all units (including castles) */
  getUnits(): readonly UnitEntity[];

  /** Get a unit by its ID */
  getUnitById(id: string): UnitEntity | undefined;

  /** Get all units belonging to a team */
  getUnitsByTeam(team: UnitTeam): UnitEntity[];

  /** Get all enemy units of a given unit (excludes stationary) */
  getEnemiesOf(unit: UnitEntity): UnitEntity[];

  /** Get all allied units of a given unit (excludes self, excludes stationary) */
  getAlliesOf(unit: UnitEntity): UnitEntity[];

  // === Castle Queries ===

  /** Get all castles (stationary units) */
  getCastles(): readonly UnitEntity[];

  /** Get castles belonging to a specific team */
  getCastlesByTeam(team: UnitTeam): UnitEntity[];

  /** Get enemy castles relative to a given unit */
  getEnemyCastlesOf(unit: UnitEntity): UnitEntity[];

  /** Get the initial castle count for a team (for tracking destruction) */
  getInitialCastleCount(team: UnitTeam): number;

  // === Damageable Queries ===

  /** Get all damageable entities (units and castles) */
  getDamageables(): readonly IDamageable[];

  /** Get all enemy damageables relative to a given entity */
  getEnemyDamageablesOf(entity: IDamageable): IDamageable[];

  // === Entity Spawning ===

  /**
   * Spawn a projectile.
   *
   * @param position - Starting position
   * @param target - Target position
   * @param damage - Damage on hit
   * @param sourceTeam - Team that fired the projectile
   * @param sourceUnit - Unit that fired (for attribution)
   * @param color - Visual color
   * @param projectileSpeed - Optional speed override
   * @param splashRadius - Optional AoE radius
   */
  spawnProjectile(
    position: Vector2,
    target: Vector2,
    damage: number,
    sourceTeam: UnitTeam,
    sourceUnit: UnitEntity | null,
    color: string,
    projectileSpeed?: number,
    splashRadius?: number
  ): void;

  /**
   * Spawn a floating damage number.
   *
   * @param position - Position to spawn at
   * @param amount - Damage amount to display
   * @param sourceTeam - Team that dealt the damage (for coloring)
   */
  spawnDamageNumber(position: Vector2, amount: number, sourceTeam: UnitTeam): void;
}

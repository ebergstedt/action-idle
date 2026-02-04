/**
 * Battle World Interface
 *
 * Defines the query interface that battle entities use to interact with the world.
 * This is what entities see - they don't know about BattleEngine internals.
 *
 * Composed from focused interfaces for better separation of concerns:
 * - IUnitQueries: Unit lookups by ID, team, relationships
 * - ICastleQueries: Castle-specific queries
 * - IDamageableQueries: Generic damageable queries
 * - IEntitySpawner: Spawning projectiles and damage numbers
 *
 * Godot equivalent: Methods on parent node or autoload that entities can call.
 */

import { Vector2 } from '../../physics/Vector2';
import { EntityBounds } from '../BoundsEnforcer';
import { IEntityWorld } from './BaseEntity';
import { IUnitQueries } from './IUnitQueries';
import { ICastleQueries } from './ICastleQueries';
import { IDamageableQueries } from './IDamageableQueries';
import { IEntitySpawner } from './IEntitySpawner';
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
 *
 * Composed from focused interfaces:
 * - IUnitQueries: getUnits, getUnitById, getUnitsByTeam, getEnemiesOf, getAlliesOf
 * - ICastleQueries: getCastles, getCastlesByTeam, getEnemyCastlesOf, getInitialCastleCount
 * - IDamageableQueries: getDamageables, getEnemyDamageablesOf
 * - IEntitySpawner: spawnProjectile, spawnDamageNumber
 * - ICombatHelpers: isPathBlocked
 * - IWorldState: getArenaBounds, getNextModifierId
 */
export interface IBattleWorld
  extends
    IEntityWorld,
    IUnitQueries,
    ICastleQueries,
    IDamageableQueries,
    IEntitySpawner,
    ICombatHelpers,
    IWorldState {}

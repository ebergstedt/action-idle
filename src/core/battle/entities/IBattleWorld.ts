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
 * Query interface for battle entities.
 * Extends IEntityWorld with battle-specific queries.
 */
export interface IBattleWorld extends IEntityWorld {
  // Damageable queries (all units including stationary)
  getDamageables(): readonly IDamageable[];
  getEnemyDamageablesOf(entity: IDamageable): IDamageable[];

  // Unit queries
  getUnits(): readonly UnitEntity[];
  getUnitById(id: string): UnitEntity | undefined;
  getUnitsByTeam(team: UnitTeam): UnitEntity[];
  getEnemiesOf(unit: UnitEntity): UnitEntity[];
  getAlliesOf(unit: UnitEntity): UnitEntity[];

  // Castle queries (stationary units)
  getCastles(): readonly UnitEntity[];
  getCastlesByTeam(team: UnitTeam): UnitEntity[];
  getEnemyCastlesOf(unit: UnitEntity): UnitEntity[];
  getInitialCastleCount(team: UnitTeam): number;

  // Combat helpers
  isPathBlocked(from: Vector2, to: Vector2, excludeUnit: UnitEntity): boolean;

  // Projectile spawning
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

  // Damage number spawning
  spawnDamageNumber(position: Vector2, amount: number, sourceTeam: UnitTeam): void;

  // Bounds
  getArenaBounds(): EntityBounds | null;

  // ID generation
  getNextModifierId(): number;
}

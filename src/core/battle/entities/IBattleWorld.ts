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
import { UnitTeam } from '../units/types';
import { IEntityWorld } from './BaseEntity';
import { UnitEntity } from './UnitEntity';

/**
 * Query interface for battle entities.
 * Extends IEntityWorld with battle-specific queries.
 */
export interface IBattleWorld extends IEntityWorld {
  // Unit queries
  getUnits(): readonly UnitEntity[];
  getUnitById(id: string): UnitEntity | undefined;
  getUnitsByTeam(team: UnitTeam): UnitEntity[];
  getEnemiesOf(unit: UnitEntity): UnitEntity[];
  getAlliesOf(unit: UnitEntity): UnitEntity[];

  // Combat helpers
  isPathBlocked(from: Vector2, to: Vector2, excludeUnit: UnitEntity): boolean;

  // Projectile spawning
  spawnProjectile(
    position: Vector2,
    target: Vector2,
    damage: number,
    sourceTeam: UnitTeam,
    color: string
  ): void;

  // Bounds
  getArenaBounds(): EntityBounds | null;
}

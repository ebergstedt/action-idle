/**
 * Entity Spawner Interface
 *
 * Interface for spawning combat-related entities.
 * Separates spawning concerns from query concerns.
 *
 * Godot equivalent: Factory methods on battle scene or spawner node.
 */

import { Vector2 } from '../../physics/Vector2';
import { UnitTeam } from '../units/types';
import { UnitEntity } from './UnitEntity';

/**
 * Interface for spawning combat entities.
 */
export interface IEntitySpawner {
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

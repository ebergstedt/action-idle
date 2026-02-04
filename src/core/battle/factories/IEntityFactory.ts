/**
 * Entity Factory Interfaces
 *
 * Defines interfaces for entity creation to enable dependency injection.
 * This allows tests to mock entity creation and supports the DIP.
 *
 * Godot equivalent: Factory pattern for scene instantiation.
 */

import { Vector2 } from '../../physics/Vector2';
import { UnitEntity, UnitData } from '../entities/UnitEntity';
import { ProjectileEntity, ProjectileData } from '../entities/ProjectileEntity';

/**
 * Factory interface for creating unit entities.
 * Note: Castles are now created as stationary units (moveSpeed: 0),
 * so they use IUnitEntityFactory instead of a separate factory.
 */
export interface IUnitEntityFactory {
  /**
   * Create a new unit entity.
   * @param id - Unique identifier
   * @param position - Initial position
   * @param data - Unit data
   */
  createUnit(id: string, position: Vector2, data: UnitData): UnitEntity;
}

/**
 * Factory interface for creating projectile entities.
 */
export interface IProjectileEntityFactory {
  /**
   * Create a new projectile entity.
   * @param id - Unique identifier
   * @param position - Initial position
   * @param data - Projectile data
   */
  createProjectile(id: string, position: Vector2, data: ProjectileData): ProjectileEntity;
}

/**
 * Combined factory interface for all entity types.
 */
export interface IEntityFactory extends IUnitEntityFactory, IProjectileEntityFactory {}

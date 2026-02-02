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
import { CastleEntity, CastleData } from '../entities/CastleEntity';
import { ProjectileEntity, ProjectileData } from '../entities/ProjectileEntity';

/**
 * Factory interface for creating unit entities.
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
 * Factory interface for creating castle entities.
 */
export interface ICastleEntityFactory {
  /**
   * Create a new castle entity.
   * @param id - Unique identifier
   * @param position - Initial position
   * @param data - Castle data
   */
  createCastle(id: string, position: Vector2, data: CastleData): CastleEntity;
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
export interface IEntityFactory
  extends IUnitEntityFactory, ICastleEntityFactory, IProjectileEntityFactory {}

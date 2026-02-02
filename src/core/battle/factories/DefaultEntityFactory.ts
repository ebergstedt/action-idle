/**
 * Default Entity Factory
 *
 * Default implementation of entity factories that creates actual entity instances.
 * Used in production code; tests can provide mock implementations.
 *
 * Godot equivalent: Standard scene instantiation.
 */

import { Vector2 } from '../../physics/Vector2';
import { UnitEntity, UnitData } from '../entities/UnitEntity';
import { CastleEntity, CastleData } from '../entities/CastleEntity';
import { ProjectileEntity, ProjectileData } from '../entities/ProjectileEntity';
import {
  IEntityFactory,
  IUnitEntityFactory,
  ICastleEntityFactory,
  IProjectileEntityFactory,
} from './IEntityFactory';

/**
 * Default unit factory - creates standard UnitEntity instances.
 */
export class DefaultUnitFactory implements IUnitEntityFactory {
  createUnit(id: string, position: Vector2, data: UnitData): UnitEntity {
    return new UnitEntity(id, position, data);
  }
}

/**
 * Default castle factory - creates standard CastleEntity instances.
 */
export class DefaultCastleFactory implements ICastleEntityFactory {
  createCastle(id: string, position: Vector2, data: CastleData): CastleEntity {
    return new CastleEntity(id, position, data);
  }
}

/**
 * Default projectile factory - creates standard ProjectileEntity instances.
 */
export class DefaultProjectileFactory implements IProjectileEntityFactory {
  createProjectile(id: string, position: Vector2, data: ProjectileData): ProjectileEntity {
    return new ProjectileEntity(id, position, data);
  }
}

/**
 * Default combined factory - creates all entity types.
 */
export class DefaultEntityFactory implements IEntityFactory {
  private unitFactory = new DefaultUnitFactory();
  private castleFactory = new DefaultCastleFactory();
  private projectileFactory = new DefaultProjectileFactory();

  createUnit(id: string, position: Vector2, data: UnitData): UnitEntity {
    return this.unitFactory.createUnit(id, position, data);
  }

  createCastle(id: string, position: Vector2, data: CastleData): CastleEntity {
    return this.castleFactory.createCastle(id, position, data);
  }

  createProjectile(id: string, position: Vector2, data: ProjectileData): ProjectileEntity {
    return this.projectileFactory.createProjectile(id, position, data);
  }
}

/**
 * Singleton instance of the default entity factory.
 * Use this when you don't need custom factory behavior.
 */
export const defaultEntityFactory = new DefaultEntityFactory();

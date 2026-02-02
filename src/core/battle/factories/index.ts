/**
 * Entity Factories Module
 *
 * Factory interfaces and implementations for entity creation.
 * Enables dependency injection for testing and extensibility.
 */

// Factory interfaces
export type {
  IEntityFactory,
  IUnitEntityFactory,
  ICastleEntityFactory,
  IProjectileEntityFactory,
} from './IEntityFactory';

// Default implementations
export {
  DefaultEntityFactory,
  DefaultUnitFactory,
  DefaultCastleFactory,
  DefaultProjectileFactory,
  defaultEntityFactory,
} from './DefaultEntityFactory';

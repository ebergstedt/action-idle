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
  IProjectileEntityFactory,
} from './IEntityFactory';

// Default implementations
export {
  DefaultEntityFactory,
  DefaultUnitFactory,
  DefaultProjectileFactory,
  defaultEntityFactory,
} from './DefaultEntityFactory';

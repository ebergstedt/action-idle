/**
 * Battle Entities Module
 *
 * Godot-style entity system where each entity handles its own behavior.
 * Maps to Godot's Scene/Node pattern with _process(delta).
 *
 * Usage:
 * - BattleWorld is the entity manager (like Godot's main scene)
 * - UnitEntity and ProjectileEntity are self-updating entities
 * - Entities communicate via events (like Godot signals)
 */

// Core entity types and interfaces
export { EventEmitter, WorldEventEmitter } from './EventEmitter';
export { BaseEntity, type IEntityWorld } from './BaseEntity';

// Battle world interface
export type { IBattleWorld } from './IBattleWorld';

export type { EntityKind } from '../IEntity';

// Entity implementations
export { UnitEntity, type UnitData } from './UnitEntity';
export { ProjectileEntity, type ProjectileData, createProjectile } from './ProjectileEntity';
export { ShockwaveEntity, type ShockwaveData, createShockwave } from './ShockwaveEntity';
export {
  DamageNumberEntity,
  type DamageNumberData,
  type DamageNumberRenderData,
} from './DamageNumberEntity';

// Entity manager
export { BattleWorld } from './BattleWorld';

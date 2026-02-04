/**
 * Entity Interface
 *
 * Base interface for game entities with lifecycle methods.
 * Maps directly to Godot's Node lifecycle (_ready, _process, queue_free).
 *
 * Godot equivalent:
 * - init() → _ready()
 * - update(delta) → _process(delta)
 * - destroy() → queue_free()
 */

import { Vector2 } from '../physics/Vector2';

import { UnitTeam } from './units/types';
import type { TemporaryModifier } from './modifiers/TemporaryModifier';

/**
 * Discriminant for entity types.
 * Used instead of instanceof checks for DIP compliance.
 *
 * Godot equivalent: Node.get_class() or custom "type" property on nodes.
 */
export type EntityKind = 'unit' | 'castle' | 'projectile' | 'shockwave' | 'damage_number';

/**
 * Interface for entities that can take damage (units, castles, etc.).
 * Allows projectiles and other damage sources to treat all targets uniformly.
 *
 * Godot equivalent: A shared interface/class for anything with health.
 */
export interface IDamageable {
  /** Unique identifier */
  readonly id: string;

  /** Which team this entity belongs to */
  readonly team: UnitTeam;

  /** Current health */
  readonly health: number;

  /** Position in world space */
  position: Vector2;

  /** Size for collision detection */
  readonly size: number;

  /**
   * Apply damage to this entity.
   * @param amount - Damage to apply
   * @param attacker - The entity that dealt the damage (optional)
   */
  takeDamage(amount: number, attacker?: IEntity): void;

  /** Whether this entity is destroyed/dead */
  isDestroyed(): boolean;
}

/**
 * Extended interface for damageable entities that can be melee targets.
 * Includes knockback and modifier support for melee combat.
 *
 * Godot equivalent: Interface for units (not castles/structures).
 */
export interface IMeleeTarget extends IDamageable {
  /**
   * Apply a knockback offset (visual effect from melee hit).
   * @param direction - Direction of knockback
   * @param distance - Distance to knock back
   */
  applyKnockback(direction: Vector2, distance: number): void;

  /**
   * Queue a modifier to be applied after a delay.
   * Used for delayed effects like defender's melee engagement debuff.
   * @param modifier - The modifier to apply
   * @param delay - Delay in seconds before applying
   */
  queueModifier(modifier: TemporaryModifier, delay: number): void;
}

/**
 * Lifecycle interface for game entities.
 * Implement this for entities that need their own update logic.
 */
export interface IEntity {
  /** Unique identifier */
  readonly id: string;

  /**
   * Entity type discriminant.
   * Use this instead of instanceof for type checking.
   * @example entity.kind === 'unit'
   */
  readonly kind: EntityKind;

  /** Position in world space */
  position: Vector2;

  /**
   * Called when entity is added to the world.
   * Godot: _ready()
   */
  init(): void;

  /**
   * Called every frame while entity is active.
   * Godot: _process(delta)
   *
   * @param delta - Time elapsed since last frame (seconds)
   */
  update(delta: number): void;

  /**
   * Called when entity is removed from the world.
   * Godot: queue_free()
   */
  destroy(): void;

  /**
   * Whether this entity should be removed.
   * Checked by the engine after update().
   */
  isDestroyed(): boolean;
}

// =============================================================================
// TYPED EVENT SYSTEM
// =============================================================================

/**
 * Event types that entities can emit.
 * Maps to Godot signals.
 */
export type EntityEventType = 'spawned' | 'destroyed' | 'damaged' | 'attacked' | 'killed' | 'moved';

/**
 * World-level event types.
 */
export type WorldEventType = 'entity_added' | 'entity_removed';

/**
 * All event types combined.
 */
export type AllEventTypes = EntityEventType | WorldEventType;

// --- Typed Event Payloads ---

/**
 * Base event with common fields.
 */
interface BaseEntityEvent<T extends EntityEventType> {
  type: T;
  entity: IEntity;
}

/**
 * Entity was spawned into the world.
 */
export type SpawnedEvent = BaseEntityEvent<'spawned'>;

/**
 * Entity was destroyed/removed.
 */
export type DestroyedEvent = BaseEntityEvent<'destroyed'>;

/**
 * Entity took damage.
 * - entity: The unit that was damaged
 * - attacker: Who dealt the damage (optional, e.g., environmental damage)
 */
export interface DamagedEvent extends BaseEntityEvent<'damaged'> {
  attacker?: IEntity;
  amount: number;
  previousHealth: number;
  currentHealth: number;
}

/**
 * Entity performed an attack.
 * - entity: The attacker
 * - target: Who was attacked
 */
export interface AttackedEvent extends BaseEntityEvent<'attacked'> {
  target: IEntity;
  damage: number;
  attackMode: 'melee' | 'ranged';
}

/**
 * Entity was killed.
 * - entity: The unit that died
 * - killer: Who killed them (optional)
 */
export interface KilledEvent extends BaseEntityEvent<'killed'> {
  killer?: IEntity;
}

/**
 * Entity moved.
 */
export interface MovedEvent extends BaseEntityEvent<'moved'> {
  delta: Vector2;
  previousPosition: Vector2;
}

/**
 * Discriminated union of all entity events.
 */
export type EntityEvent =
  | SpawnedEvent
  | DestroyedEvent
  | DamagedEvent
  | AttackedEvent
  | KilledEvent
  | MovedEvent;

// --- World Events ---

/**
 * Entity was added to the world.
 */
export interface EntityAddedEvent {
  type: 'entity_added';
  entity: IEntity;
}

/**
 * Entity was removed from the world.
 */
export interface EntityRemovedEvent {
  type: 'entity_removed';
  entity: IEntity;
}

/**
 * All world events.
 */
export type WorldEvent = EntityAddedEvent | EntityRemovedEvent;

// --- Event Listeners ---

/**
 * Type-safe event listener map for entity events.
 */
export interface EntityEventMap {
  spawned: SpawnedEvent;
  destroyed: DestroyedEvent;
  damaged: DamagedEvent;
  attacked: AttackedEvent;
  killed: KilledEvent;
  moved: MovedEvent;
}

/**
 * Type-safe event listener map for world events.
 */
export interface WorldEventMap {
  entity_added: EntityAddedEvent;
  entity_removed: EntityRemovedEvent;
}

/**
 * Generic event listener callback.
 */
export type EventListener<T> = (event: T) => void;

/**
 * Untyped listener (for backward compatibility).
 * @deprecated Use typed listeners instead
 */
export type EntityEventListener = (event: EntityEvent) => void;

/**
 * Interface for entities that can emit events.
 * Maps to Godot's signal system.
 */
export interface IEventEmitter {
  /**
   * Subscribe to an entity event (type-safe).
   * Godot: connect("signal_name", callable)
   */
  on<K extends EntityEventType>(event: K, listener: EventListener<EntityEventMap[K]>): void;

  /**
   * Unsubscribe from an entity event.
   * Godot: disconnect("signal_name", callable)
   */
  off<K extends EntityEventType>(event: K, listener: EventListener<EntityEventMap[K]>): void;

  /**
   * Emit an event to all listeners.
   * Godot: emit_signal("signal_name", args)
   */
  emit(event: EntityEvent): void;
}

/**
 * Interface for worlds that emit events.
 */
export interface IWorldEventEmitter {
  /**
   * Subscribe to a world event.
   */
  onWorld<K extends WorldEventType>(event: K, listener: EventListener<WorldEventMap[K]>): void;

  /**
   * Unsubscribe from a world event.
   */
  offWorld<K extends WorldEventType>(event: K, listener: EventListener<WorldEventMap[K]>): void;
}

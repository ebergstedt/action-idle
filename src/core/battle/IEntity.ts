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

/**
 * Lifecycle interface for game entities.
 * Implement this for entities that need their own update logic.
 */
export interface IEntity {
  /** Unique identifier */
  readonly id: string;

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

/**
 * Event types that entities can emit.
 * Maps to Godot signals.
 */
export type EntityEventType =
  | 'spawned'
  | 'destroyed'
  | 'damaged'
  | 'healed'
  | 'attacked'
  | 'killed'
  | 'moved';

/**
 * Event data for entity events.
 */
export interface EntityEvent {
  type: EntityEventType;
  source: IEntity;
  target?: IEntity;
  data?: Record<string, unknown>;
}

/**
 * Event listener callback.
 */
export type EntityEventListener = (event: EntityEvent) => void;

/**
 * Interface for entities that can emit events.
 * Maps to Godot's signal system.
 */
export interface IEventEmitter {
  /**
   * Subscribe to entity events.
   * Godot: connect("signal_name", callable)
   */
  on(event: EntityEventType, listener: EntityEventListener): void;

  /**
   * Unsubscribe from entity events.
   * Godot: disconnect("signal_name", callable)
   */
  off(event: EntityEventType, listener: EntityEventListener): void;

  /**
   * Emit an event to all listeners.
   * Godot: emit_signal("signal_name", args)
   */
  emit(event: EntityEvent): void;
}

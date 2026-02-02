/**
 * Base Entity
 *
 * Abstract base class for game entities with lifecycle methods.
 * Provides common functionality that all entities share.
 *
 * Godot equivalent: Node2D base class with _ready(), _process(), queue_free()
 */

import { Vector2 } from '../../physics/Vector2';
import {
  IEntity,
  IEventEmitter,
  EntityEvent,
  EntityEventType,
  EntityEventMap,
  EventListener,
  EntityKind,
} from '../IEntity';
import { EventEmitter } from './EventEmitter';

/**
 * Reference to the world for entity queries.
 * Godot equivalent: get_tree() / get_parent()
 */
export interface IEntityWorld {
  /** Get all entities */
  getEntities(): readonly IEntity[];

  /** Query for specific entity types */
  query<T extends IEntity>(predicate: (entity: IEntity) => entity is T): T[];
}

/**
 * Abstract base entity with common functionality.
 */
export abstract class BaseEntity implements IEntity, IEventEmitter {
  public readonly id: string;
  public abstract readonly kind: EntityKind;
  public position: Vector2;

  protected _destroyed = false;
  protected world: IEntityWorld | null = null;
  private eventEmitter = new EventEmitter();

  constructor(id: string, position: Vector2) {
    this.id = id;
    this.position = position;
  }

  /**
   * Set the world reference for entity queries.
   * Called by BattleWorld when entity is added.
   */
  setWorld(world: IEntityWorld | null): void {
    this.world = world;
  }

  // IEntity implementation

  /**
   * Called when entity is added to the world.
   * Override to add initialization logic.
   */
  init(): void {
    this.emit({ type: 'spawned', entity: this });
  }

  /**
   * Called every frame. Override to add update logic.
   */
  abstract update(delta: number): void;

  /**
   * Called when entity is removed from the world.
   * Emits 'destroyed' event and clears all listeners.
   *
   * Note: This can be called on entities that were already marked destroyed
   * via markDestroyed() (e.g., from takeDamage). In that case, we still need
   * to emit the 'destroyed' event and clear listeners.
   */
  destroy(): void {
    // Only emit 'destroyed' and clear listeners once
    if (this._cleanedUp) return;
    this._cleanedUp = true;
    this._destroyed = true;
    this.emit({ type: 'destroyed', entity: this });
    this.eventEmitter.clearAllListeners();
    this.world = null;
  }

  /** Tracks whether cleanup (destroy event + listener clearing) has been done */
  private _cleanedUp = false;

  /**
   * Whether this entity should be removed.
   */
  isDestroyed(): boolean {
    return this._destroyed;
  }

  // IEventEmitter implementation (delegated to EventEmitter)

  on<K extends EntityEventType>(event: K, listener: EventListener<EntityEventMap[K]>): void {
    this.eventEmitter.on(event, listener);
  }

  off<K extends EntityEventType>(event: K, listener: EventListener<EntityEventMap[K]>): void {
    this.eventEmitter.off(event, listener);
  }

  emit(event: EntityEvent): void {
    this.eventEmitter.emit(event);
  }

  /**
   * Mark this entity for destruction.
   * Will be removed on next world update.
   */
  protected markDestroyed(): void {
    this._destroyed = true;
  }
}

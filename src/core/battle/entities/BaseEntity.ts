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
  EntityEventListener,
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
    this.emit({ type: 'spawned', source: this });
  }

  /**
   * Called every frame. Override to add update logic.
   */
  abstract update(delta: number): void;

  /**
   * Called when entity is removed from the world.
   */
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this.emit({ type: 'destroyed', source: this });
    this.eventEmitter.clearAllListeners();
    this.world = null;
  }

  /**
   * Whether this entity should be removed.
   */
  isDestroyed(): boolean {
    return this._destroyed;
  }

  // IEventEmitter implementation (delegated to EventEmitter)

  on(event: EntityEventType, listener: EntityEventListener): void {
    this.eventEmitter.on(event, listener);
  }

  off(event: EntityEventType, listener: EntityEventListener): void {
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

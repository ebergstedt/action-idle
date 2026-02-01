/**
 * Event Emitter
 *
 * Type-safe implementation of event emitting for entities.
 * Maps directly to Godot's signal system.
 *
 * Godot equivalent: Object.connect(), Object.disconnect(), Object.emit_signal()
 */

import {
  EntityEvent,
  EntityEventType,
  EntityEventMap,
  EventListener,
  IEventEmitter,
  WorldEvent,
  WorldEventType,
  WorldEventMap,
  IWorldEventEmitter,
} from '../IEntity';

/**
 * Type-safe event emitter for entity events.
 */
export class EventEmitter implements IEventEmitter {
  private listeners: Map<EntityEventType, Set<EventListener<EntityEvent>>> = new Map();

  /**
   * Subscribe to an event (type-safe).
   * Godot: object.connect("signal_name", callable)
   */
  on<K extends EntityEventType>(event: K, listener: EventListener<EntityEventMap[K]>): void {
    let eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      eventListeners = new Set();
      this.listeners.set(event, eventListeners);
    }
    // Cast is safe because we enforce type safety at the interface level
    eventListeners.add(listener as EventListener<EntityEvent>);
  }

  /**
   * Unsubscribe from an event.
   * Godot: object.disconnect("signal_name", callable)
   */
  off<K extends EntityEventType>(event: K, listener: EventListener<EntityEventMap[K]>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener as EventListener<EntityEvent>);
    }
  }

  /**
   * Emit an event to all listeners.
   * Godot: object.emit_signal("signal_name", args)
   */
  emit(event: EntityEvent): void {
    const eventListeners = this.listeners.get(event.type);
    if (eventListeners) {
      for (const listener of eventListeners) {
        listener(event);
      }
    }
  }

  /**
   * Remove all listeners.
   * Call this in destroy() to prevent memory leaks.
   */
  clearAllListeners(): void {
    this.listeners.clear();
  }
}

/**
 * Event emitter for world-level events.
 */
export class WorldEventEmitter implements IWorldEventEmitter {
  private listeners: Map<WorldEventType, Set<EventListener<WorldEvent>>> = new Map();

  /**
   * Subscribe to a world event.
   */
  onWorld<K extends WorldEventType>(event: K, listener: EventListener<WorldEventMap[K]>): void {
    let eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      eventListeners = new Set();
      this.listeners.set(event, eventListeners);
    }
    eventListeners.add(listener as EventListener<WorldEvent>);
  }

  /**
   * Unsubscribe from a world event.
   */
  offWorld<K extends WorldEventType>(event: K, listener: EventListener<WorldEventMap[K]>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener as EventListener<WorldEvent>);
    }
  }

  /**
   * Emit a world event.
   */
  emitWorld(event: WorldEvent): void {
    const eventListeners = this.listeners.get(event.type);
    if (eventListeners) {
      for (const listener of eventListeners) {
        listener(event);
      }
    }
  }

  /**
   * Remove all listeners.
   */
  clearAllListeners(): void {
    this.listeners.clear();
  }
}

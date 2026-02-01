/**
 * Event Emitter
 *
 * Simple implementation of IEventEmitter for entities.
 * Maps directly to Godot's signal system.
 *
 * Godot equivalent: Object.connect(), Object.disconnect(), Object.emit_signal()
 */

import { EntityEvent, EntityEventListener, EntityEventType, IEventEmitter } from '../IEntity';

/**
 * Base event emitter implementation.
 * Entities can extend or compose this to gain signal capabilities.
 */
export class EventEmitter implements IEventEmitter {
  private listeners: Map<EntityEventType, Set<EntityEventListener>> = new Map();

  /**
   * Subscribe to an event.
   * Godot: object.connect("signal_name", callable)
   */
  on(event: EntityEventType, listener: EntityEventListener): void {
    let eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      eventListeners = new Set();
      this.listeners.set(event, eventListeners);
    }
    eventListeners.add(listener);
  }

  /**
   * Unsubscribe from an event.
   * Godot: object.disconnect("signal_name", callable)
   */
  off(event: EntityEventType, listener: EntityEventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
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

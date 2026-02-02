/**
 * EventEmitter Tests
 *
 * Tests for the event emitter system that maps to Godot signals.
 * Verifies subscription, emission, and cleanup behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter, WorldEventEmitter } from '../../../../src/core/battle/entities/EventEmitter';
import { SpawnedEvent, DamagedEvent, WorldEvent } from '../../../../src/core/battle/IEntity';
import { Vector2 } from '../../../../src/core/physics/Vector2';

// Mock entity for testing
const createMockEntity = (id: string = 'test_entity') => ({
  id,
  position: new Vector2(0, 0),
  init: vi.fn(),
  update: vi.fn(),
  destroy: vi.fn(),
  isDestroyed: vi.fn(() => false),
});

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('on() - subscribe to events', () => {
    it('should register a listener for an event type', () => {
      const listener = vi.fn();
      emitter.on('spawned', listener);

      const event: SpawnedEvent = { type: 'spawned', entity: createMockEntity() };
      emitter.emit(event);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(event);
    });

    it('should allow multiple listeners for the same event type', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      emitter.on('spawned', listener1);
      emitter.on('spawned', listener2);

      const event: SpawnedEvent = { type: 'spawned', entity: createMockEntity() };
      emitter.emit(event);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should handle different event types independently', () => {
      const spawnedListener = vi.fn();
      const damagedListener = vi.fn();
      emitter.on('spawned', spawnedListener);
      emitter.on('damaged', damagedListener);

      const spawnedEvent: SpawnedEvent = { type: 'spawned', entity: createMockEntity() };
      emitter.emit(spawnedEvent);

      expect(spawnedListener).toHaveBeenCalledTimes(1);
      expect(damagedListener).not.toHaveBeenCalled();
    });
  });

  describe('off() - unsubscribe from events', () => {
    it('should remove a listener for an event type', () => {
      const listener = vi.fn();
      emitter.on('spawned', listener);

      const event: SpawnedEvent = { type: 'spawned', entity: createMockEntity() };
      emitter.emit(event);
      expect(listener).toHaveBeenCalledTimes(1);

      emitter.off('spawned', listener);
      emitter.emit(event);
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should not affect other listeners when removing one', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      emitter.on('spawned', listener1);
      emitter.on('spawned', listener2);

      emitter.off('spawned', listener1);

      const event: SpawnedEvent = { type: 'spawned', entity: createMockEntity() };
      emitter.emit(event);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should handle removing a listener that was never added', () => {
      const listener = vi.fn();
      // Should not throw
      expect(() => emitter.off('spawned', listener)).not.toThrow();
    });
  });

  describe('emit() - emit events', () => {
    it('should emit events with correct payload', () => {
      const listener = vi.fn();
      emitter.on('damaged', listener);

      const mockEntity = createMockEntity();
      const mockAttacker = createMockEntity('attacker');
      const event: DamagedEvent = {
        type: 'damaged',
        entity: mockEntity,
        attacker: mockAttacker,
        amount: 50,
        previousHealth: 100,
        currentHealth: 50,
      };

      emitter.emit(event);

      expect(listener).toHaveBeenCalledWith(event);
      const receivedEvent = listener.mock.calls[0][0] as DamagedEvent;
      expect(receivedEvent.amount).toBe(50);
      expect(receivedEvent.previousHealth).toBe(100);
      expect(receivedEvent.currentHealth).toBe(50);
    });

    it('should handle emitting with no listeners', () => {
      const event: SpawnedEvent = { type: 'spawned', entity: createMockEntity() };
      // Should not throw
      expect(() => emitter.emit(event)).not.toThrow();
    });

    it('should call listeners in registration order', () => {
      const callOrder: number[] = [];
      const listener1 = vi.fn(() => callOrder.push(1));
      const listener2 = vi.fn(() => callOrder.push(2));
      const listener3 = vi.fn(() => callOrder.push(3));

      emitter.on('spawned', listener1);
      emitter.on('spawned', listener2);
      emitter.on('spawned', listener3);

      const event: SpawnedEvent = { type: 'spawned', entity: createMockEntity() };
      emitter.emit(event);

      expect(callOrder).toEqual([1, 2, 3]);
    });
  });

  describe('clearAllListeners() - cleanup', () => {
    it('should remove all listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      emitter.on('spawned', listener1);
      emitter.on('damaged', listener2);

      emitter.clearAllListeners();

      const spawnedEvent: SpawnedEvent = { type: 'spawned', entity: createMockEntity() };
      const damagedEvent: DamagedEvent = {
        type: 'damaged',
        entity: createMockEntity(),
        amount: 10,
        previousHealth: 100,
        currentHealth: 90,
      };

      emitter.emit(spawnedEvent);
      emitter.emit(damagedEvent);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should allow new listeners after clearing', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      emitter.on('spawned', listener1);

      emitter.clearAllListeners();

      emitter.on('spawned', listener2);

      const event: SpawnedEvent = { type: 'spawned', entity: createMockEntity() };
      emitter.emit(event);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });
});

describe('WorldEventEmitter', () => {
  let emitter: WorldEventEmitter;

  beforeEach(() => {
    emitter = new WorldEventEmitter();
  });

  describe('onWorld() - subscribe to world events', () => {
    it('should register a listener for entity_added event', () => {
      const listener = vi.fn();
      emitter.onWorld('entity_added', listener);

      const event: WorldEvent = { type: 'entity_added', entity: createMockEntity() };
      emitter.emitWorld(event);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(event);
    });

    it('should register a listener for entity_removed event', () => {
      const listener = vi.fn();
      emitter.onWorld('entity_removed', listener);

      const event: WorldEvent = { type: 'entity_removed', entity: createMockEntity() };
      emitter.emitWorld(event);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(event);
    });
  });

  describe('offWorld() - unsubscribe from world events', () => {
    it('should remove a listener', () => {
      const listener = vi.fn();
      emitter.onWorld('entity_added', listener);

      emitter.offWorld('entity_added', listener);

      const event: WorldEvent = { type: 'entity_added', entity: createMockEntity() };
      emitter.emitWorld(event);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('clearAllListeners() - cleanup', () => {
    it('should remove all world event listeners', () => {
      const addedListener = vi.fn();
      const removedListener = vi.fn();
      emitter.onWorld('entity_added', addedListener);
      emitter.onWorld('entity_removed', removedListener);

      emitter.clearAllListeners();

      emitter.emitWorld({ type: 'entity_added', entity: createMockEntity() });
      emitter.emitWorld({ type: 'entity_removed', entity: createMockEntity() });

      expect(addedListener).not.toHaveBeenCalled();
      expect(removedListener).not.toHaveBeenCalled();
    });
  });
});

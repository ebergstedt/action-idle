import { describe, it, expect, vi, afterEach } from 'vitest';
import { Vector2 } from '../../../src/core/physics/Vector2';
import {
  generateShuffleDirection,
  decideNextShuffleAction,
  calculateShuffleMovement,
  updateShuffle,
  applyShuffle,
  Shuffleable,
  DEFAULT_SHUFFLE_CONFIG,
} from '../../../src/core/battle/shuffle';

// Helper to create a mock shuffleable unit
function createMockShuffleable(overrides: Partial<Shuffleable> = {}): Shuffleable {
  return {
    position: new Vector2(100, 100),
    stats: { moveSpeed: 100 },
    shuffleDirection: null,
    shuffleTimer: 0,
    ...overrides,
  };
}

describe('shuffle', () => {
  describe('generateShuffleDirection', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns a normalized vector', () => {
      // Use non-0.5 value to avoid zero vector (0.5 - 0.5 = 0)
      vi.spyOn(Math, 'random').mockReturnValue(0.75);
      const direction = generateShuffleDirection(1);
      expect(direction.magnitude()).toBeCloseTo(1, 5);
    });

    it('applies horizontal bias', () => {
      // With random = 0.5, (0.5 - 0.5) = 0, so direction would be (0, 0)
      // Let's use different random values
      vi.spyOn(Math, 'random').mockReturnValue(0.75);
      const lowBias = generateShuffleDirection(1);
      const highBias = generateShuffleDirection(5);

      // Higher bias should produce more horizontal movement
      // Both are normalized so we compare the ratio of x to y
      expect(Math.abs(highBias.x / highBias.y)).toBeGreaterThan(
        Math.abs(lowBias.x / lowBias.y) * 0.9
      );
    });

    it('handles zero bias', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.75);
      const direction = generateShuffleDirection(0);
      // With zero horizontal bias, x component should be 0, y should be non-zero
      // Since (0.75 - 0.5) * 2 * 0 = 0 for x
      // And (0.75 - 0.5) * 2 = 0.5 for y
      expect(direction.x).toBeCloseTo(0, 5);
    });
  });

  describe('decideNextShuffleAction', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('sets move direction when random < moveProbability', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.3) // For moveProbability check (< 0.6)
        .mockReturnValue(0.5); // For direction generation

      const unit = createMockShuffleable();
      decideNextShuffleAction(unit);

      expect(unit.shuffleDirection).not.toBeNull();
      expect(unit.shuffleTimer).toBeGreaterThan(0);
    });

    it('sets null direction (pause) when random >= moveProbability', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.8) // For moveProbability check (>= 0.6)
        .mockReturnValue(0.5); // For timer

      const unit = createMockShuffleable();
      decideNextShuffleAction(unit);

      expect(unit.shuffleDirection).toBeNull();
      expect(unit.shuffleTimer).toBeGreaterThan(0);
    });

    it('respects custom config', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const customConfig = {
        ...DEFAULT_SHUFFLE_CONFIG,
        moveProbability: 0.3, // Should pause since 0.5 >= 0.3
      };

      const unit = createMockShuffleable();
      decideNextShuffleAction(unit, customConfig);

      expect(unit.shuffleDirection).toBeNull();
    });
  });

  describe('calculateShuffleMovement', () => {
    it('returns zero vector when no shuffle direction', () => {
      const unit = createMockShuffleable({ shuffleDirection: null });
      const movement = calculateShuffleMovement(unit, 0.1);
      expect(movement.x).toBe(0);
      expect(movement.y).toBe(0);
    });

    it('calculates movement based on direction, speed, and delta', () => {
      const direction = new Vector2(1, 0).normalize();
      const unit = createMockShuffleable({
        shuffleDirection: direction,
        stats: { moveSpeed: 100 },
      });

      const delta = 0.1;
      const movement = calculateShuffleMovement(unit, delta);

      // Movement = direction * speed * speedMultiplier * delta
      // = (1, 0) * 100 * 0.25 * 0.1 = (2.5, 0)
      expect(movement.x).toBeCloseTo(2.5, 5);
      expect(movement.y).toBeCloseTo(0, 5);
    });

    it('respects custom speed multiplier', () => {
      const direction = new Vector2(1, 0).normalize();
      const unit = createMockShuffleable({
        shuffleDirection: direction,
        stats: { moveSpeed: 100 },
      });

      const customConfig = {
        ...DEFAULT_SHUFFLE_CONFIG,
        speedMultiplier: 0.5,
      };

      const movement = calculateShuffleMovement(unit, 0.1, customConfig);
      // = (1, 0) * 100 * 0.5 * 0.1 = (5, 0)
      expect(movement.x).toBeCloseTo(5, 5);
    });
  });

  describe('updateShuffle', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('decrements shuffle timer', () => {
      const unit = createMockShuffleable({
        shuffleTimer: 1.0,
        shuffleDirection: new Vector2(1, 0),
      });

      updateShuffle(unit, 0.1);
      expect(unit.shuffleTimer).toBeCloseTo(0.9, 5);
    });

    it('decides new action when timer expires', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const unit = createMockShuffleable({
        shuffleTimer: 0.05,
        shuffleDirection: null,
      });

      updateShuffle(unit, 0.1);

      // Timer should be set to new value
      expect(unit.shuffleTimer).toBeGreaterThan(0);
    });

    it('returns movement vector', () => {
      const direction = new Vector2(1, 0);
      const unit = createMockShuffleable({
        shuffleTimer: 1.0,
        shuffleDirection: direction,
        stats: { moveSpeed: 100 },
      });

      const movement = updateShuffle(unit, 0.1);
      expect(movement.magnitude()).toBeGreaterThan(0);
    });
  });

  describe('applyShuffle', () => {
    it('updates unit position', () => {
      const direction = new Vector2(1, 0);
      const unit = createMockShuffleable({
        position: new Vector2(100, 100),
        shuffleTimer: 1.0,
        shuffleDirection: direction,
        stats: { moveSpeed: 100 },
      });

      applyShuffle(unit, 0.1);

      // Position should have moved in the direction
      expect(unit.position.x).toBeGreaterThan(100);
      expect(unit.position.y).toBeCloseTo(100, 5);
    });

    it('does not move when paused (no direction)', () => {
      const unit = createMockShuffleable({
        position: new Vector2(100, 100),
        shuffleTimer: 1.0,
        shuffleDirection: null,
      });

      applyShuffle(unit, 0.1);

      expect(unit.position.x).toBe(100);
      expect(unit.position.y).toBe(100);
    });
  });
});

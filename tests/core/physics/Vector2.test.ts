import { describe, it, expect } from 'vitest';
import { Vector2 } from '../../../src/core/physics/Vector2';

describe('Vector2', () => {
  describe('constructor', () => {
    it('creates a vector with given x and y', () => {
      const v = new Vector2(3, 4);
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
    });

    it('defaults to (0, 0) when no arguments provided', () => {
      const v = new Vector2();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });
  });

  describe('static methods', () => {
    it('zero() returns a zero vector', () => {
      const v = Vector2.zero();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });

    it('from() creates a vector from an object with x and y', () => {
      const v = Vector2.from({ x: 5, y: 10 });
      expect(v.x).toBe(5);
      expect(v.y).toBe(10);
    });
  });

  describe('clone', () => {
    it('creates an independent copy', () => {
      const v1 = new Vector2(3, 4);
      const v2 = v1.clone();
      expect(v2.x).toBe(3);
      expect(v2.y).toBe(4);
      // Modify original, clone should be unaffected
      v1.x = 10;
      expect(v2.x).toBe(3);
    });
  });

  describe('add', () => {
    it('adds two vectors', () => {
      const v1 = new Vector2(1, 2);
      const v2 = new Vector2(3, 4);
      const result = v1.add(v2);
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('does not mutate original vectors', () => {
      const v1 = new Vector2(1, 2);
      const v2 = new Vector2(3, 4);
      v1.add(v2);
      expect(v1.x).toBe(1);
      expect(v1.y).toBe(2);
    });
  });

  describe('subtract', () => {
    it('subtracts two vectors', () => {
      const v1 = new Vector2(5, 7);
      const v2 = new Vector2(2, 3);
      const result = v1.subtract(v2);
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });
  });

  describe('multiply', () => {
    it('multiplies by a scalar', () => {
      const v = new Vector2(3, 4);
      const result = v.multiply(2);
      expect(result.x).toBe(6);
      expect(result.y).toBe(8);
    });

    it('handles negative scalars', () => {
      const v = new Vector2(3, 4);
      const result = v.multiply(-1);
      expect(result.x).toBe(-3);
      expect(result.y).toBe(-4);
    });

    it('handles zero scalar', () => {
      const v = new Vector2(3, 4);
      const result = v.multiply(0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('divide', () => {
    it('divides by a scalar', () => {
      const v = new Vector2(6, 8);
      const result = v.divide(2);
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('returns zero vector when dividing by zero', () => {
      const v = new Vector2(6, 8);
      const result = v.divide(0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('magnitude', () => {
    it('calculates the length of a vector', () => {
      const v = new Vector2(3, 4);
      expect(v.magnitude()).toBe(5);
    });

    it('returns 0 for zero vector', () => {
      const v = Vector2.zero();
      expect(v.magnitude()).toBe(0);
    });
  });

  describe('magnitudeSquared', () => {
    it('calculates the squared length', () => {
      const v = new Vector2(3, 4);
      expect(v.magnitudeSquared()).toBe(25);
    });
  });

  describe('normalize', () => {
    it('returns a unit vector', () => {
      const v = new Vector2(3, 4);
      const normalized = v.normalize();
      expect(normalized.magnitude()).toBeCloseTo(1, 5);
      expect(normalized.x).toBeCloseTo(0.6, 5);
      expect(normalized.y).toBeCloseTo(0.8, 5);
    });

    it('returns zero vector when normalizing zero vector', () => {
      const v = Vector2.zero();
      const normalized = v.normalize();
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
    });
  });

  describe('distanceTo', () => {
    it('calculates distance between two points', () => {
      const v1 = new Vector2(0, 0);
      const v2 = new Vector2(3, 4);
      expect(v1.distanceTo(v2)).toBe(5);
    });

    it('is commutative', () => {
      const v1 = new Vector2(1, 2);
      const v2 = new Vector2(4, 6);
      expect(v1.distanceTo(v2)).toBe(v2.distanceTo(v1));
    });
  });

  describe('distanceSquaredTo', () => {
    it('calculates squared distance between two points', () => {
      const v1 = new Vector2(0, 0);
      const v2 = new Vector2(3, 4);
      expect(v1.distanceSquaredTo(v2)).toBe(25);
    });
  });

  describe('dot', () => {
    it('calculates dot product', () => {
      const v1 = new Vector2(1, 2);
      const v2 = new Vector2(3, 4);
      expect(v1.dot(v2)).toBe(11); // 1*3 + 2*4
    });

    it('returns 0 for perpendicular vectors', () => {
      const v1 = new Vector2(1, 0);
      const v2 = new Vector2(0, 1);
      expect(v1.dot(v2)).toBe(0);
    });

    it('returns negative for opposing vectors', () => {
      const v1 = new Vector2(1, 0);
      const v2 = new Vector2(-1, 0);
      expect(v1.dot(v2)).toBe(-1);
    });
  });

  describe('lerp', () => {
    it('interpolates between two vectors at t=0', () => {
      const v1 = new Vector2(0, 0);
      const v2 = new Vector2(10, 10);
      const result = v1.lerp(v2, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('interpolates between two vectors at t=1', () => {
      const v1 = new Vector2(0, 0);
      const v2 = new Vector2(10, 10);
      const result = v1.lerp(v2, 1);
      expect(result.x).toBe(10);
      expect(result.y).toBe(10);
    });

    it('interpolates between two vectors at t=0.5', () => {
      const v1 = new Vector2(0, 0);
      const v2 = new Vector2(10, 10);
      const result = v1.lerp(v2, 0.5);
      expect(result.x).toBe(5);
      expect(result.y).toBe(5);
    });
  });

  describe('equals', () => {
    it('returns true for identical vectors', () => {
      const v1 = new Vector2(3, 4);
      const v2 = new Vector2(3, 4);
      expect(v1.equals(v2)).toBe(true);
    });

    it('returns false for different vectors', () => {
      const v1 = new Vector2(3, 4);
      const v2 = new Vector2(3, 5);
      expect(v1.equals(v2)).toBe(false);
    });

    it('uses epsilon for floating point comparison', () => {
      const v1 = new Vector2(3, 4);
      const v2 = new Vector2(3.00001, 4.00001);
      expect(v1.equals(v2)).toBe(true);
    });

    it('respects custom epsilon', () => {
      const v1 = new Vector2(3, 4);
      const v2 = new Vector2(3.1, 4.1);
      expect(v1.equals(v2, 0.2)).toBe(true);
      expect(v1.equals(v2, 0.05)).toBe(false);
    });
  });

  describe('toString', () => {
    it('returns formatted string representation', () => {
      const v = new Vector2(3.14159, 2.71828);
      expect(v.toString()).toBe('(3.14, 2.72)');
    });
  });
});

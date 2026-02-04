import { describe, it, expect } from 'vitest';
import { Vector2 } from '../../../../src/core/physics/Vector2';
import {
  getForwardDirection,
  calculateMarchDirection,
  calculateAllyAvoidance,
  calculatePathAvoidance,
  clampSpeed,
  marchForward,
  moveTowardTarget,
} from '../../../../src/core/battle/unit-behaviors/MovementSystem';
import { REFERENCE_ARENA_HEIGHT } from '../../../../src/core/battle/BattleConfig';
import { IDamageable } from '../../../../src/core/battle/IEntity';
import { AllyData, MovementContext } from '../../../../src/core/battle/unit-behaviors/types';

// Mock ally data for testing
function createMockAlly(
  id: string,
  x: number,
  y: number,
  health: number = 100,
  collisionSize: number = 10
): AllyData {
  return {
    id,
    position: new Vector2(x, y),
    health,
    getCollisionSize: () => collisionSize,
  };
}

// Mock damageable for castles
function createMockCastle(
  id: string,
  x: number,
  y: number,
  health: number = 100,
  destroyed: boolean = false
): IDamageable {
  return {
    id,
    position: new Vector2(x, y),
    health,
    size: 20,
    isDestroyed: () => destroyed,
  };
}

// Mock movement context for testing
function createMockContext(
  options: Partial<{
    allies: AllyData[];
    enemyCastles: IDamageable[];
    hasAnyEnemyCastleBeenDestroyed: boolean;
    bounds: { width: number; height: number; margin?: number } | null;
    arenaHeight: number;
  }> = {}
): MovementContext {
  return {
    getAllies: () => options.allies ?? [],
    getEnemyCastles: () => options.enemyCastles ?? [],
    hasAnyEnemyCastleBeenDestroyed: () => options.hasAnyEnemyCastleBeenDestroyed ?? false,
    getObstacles: () => [],
    bounds: options.bounds ?? { width: 800, height: REFERENCE_ARENA_HEIGHT },
    arenaHeight: options.arenaHeight ?? REFERENCE_ARENA_HEIGHT,
  };
}

describe('MovementSystem', () => {
  describe('getForwardDirection', () => {
    it('should return upward direction for player team', () => {
      const dir = getForwardDirection('player');

      expect(dir.x).toBe(0);
      expect(dir.y).toBe(-1);
    });

    it('should return downward direction for enemy team', () => {
      const dir = getForwardDirection('enemy');

      expect(dir.x).toBe(0);
      expect(dir.y).toBe(1);
    });
  });

  describe('calculateMarchDirection', () => {
    it('should return forward direction when no castle destroyed', () => {
      const context = createMockContext({
        hasAnyEnemyCastleBeenDestroyed: false,
        enemyCastles: [createMockCastle('castle_1', 400, 50)],
      });

      const dir = calculateMarchDirection(new Vector2(400, 400), 'player', context);

      expect(dir.x).toBe(0);
      expect(dir.y).toBe(-1);
    });

    it('should march toward closest castle after first destruction', () => {
      const castle = createMockCastle('castle_1', 400, 50, 100, false);
      const context = createMockContext({
        hasAnyEnemyCastleBeenDestroyed: true,
        enemyCastles: [castle],
      });

      const dir = calculateMarchDirection(new Vector2(200, 400), 'player', context);

      // Should point toward castle at (400, 50) from (200, 400)
      expect(dir.x).toBeGreaterThan(0); // Right
      expect(dir.y).toBeLessThan(0); // Up
    });

    it('should select closest castle when multiple exist', () => {
      const farCastle = createMockCastle('castle_1', 100, 50, 100, false);
      const closeCastle = createMockCastle('castle_2', 400, 100, 100, false);
      const context = createMockContext({
        hasAnyEnemyCastleBeenDestroyed: true,
        enemyCastles: [farCastle, closeCastle],
      });

      const dir = calculateMarchDirection(new Vector2(400, 400), 'player', context);

      // Should point more upward toward close castle at (400, 100)
      expect(dir.x).toBeCloseTo(0);
      expect(dir.y).toBeLessThan(0);
    });

    it('should fall back to forward when all castles destroyed', () => {
      const destroyedCastle = createMockCastle('castle_1', 400, 50, 0, true);
      const context = createMockContext({
        hasAnyEnemyCastleBeenDestroyed: true,
        enemyCastles: [destroyedCastle],
      });

      const dir = calculateMarchDirection(new Vector2(400, 400), 'player', context);

      expect(dir.x).toBe(0);
      expect(dir.y).toBe(-1);
    });

    it('should handle being very close to castle', () => {
      const castle = createMockCastle('castle_1', 400, 50, 100, false);
      const context = createMockContext({
        hasAnyEnemyCastleBeenDestroyed: true,
        enemyCastles: [castle],
      });

      // Position very close to castle (within MIN_MOVE_DISTANCE)
      const dir = calculateMarchDirection(new Vector2(400, 50.5), 'player', context);

      // Should fall back to forward direction
      expect(dir.x).toBe(0);
      expect(dir.y).toBe(-1);
    });
  });

  describe('calculateAllyAvoidance', () => {
    it('should return zero vector when no allies', () => {
      const avoidance = calculateAllyAvoidance(
        new Vector2(400, 400),
        'unit_1',
        10,
        [],
        REFERENCE_ARENA_HEIGHT
      );

      expect(avoidance.x).toBe(0);
      expect(avoidance.y).toBe(0);
    });

    it('should return zero vector when allies are far away', () => {
      const farAlly = createMockAlly('ally_1', 100, 100);
      const avoidance = calculateAllyAvoidance(
        new Vector2(400, 400),
        'unit_1',
        10,
        [farAlly],
        REFERENCE_ARENA_HEIGHT
      );

      expect(avoidance.magnitude()).toBeCloseTo(0, 5);
    });

    it('should push away from nearby allies', () => {
      const nearAlly = createMockAlly('ally_1', 415, 400);
      const avoidance = calculateAllyAvoidance(
        new Vector2(400, 400),
        'unit_1',
        10,
        [nearAlly],
        REFERENCE_ARENA_HEIGHT
      );

      // Should push left (away from ally at x=415)
      expect(avoidance.x).toBeLessThan(0);
    });

    it('should ignore self', () => {
      const self = createMockAlly('unit_1', 400, 400);
      const avoidance = calculateAllyAvoidance(
        new Vector2(400, 400),
        'unit_1',
        10,
        [self],
        REFERENCE_ARENA_HEIGHT
      );

      expect(avoidance.magnitude()).toBe(0);
    });

    it('should ignore dead allies', () => {
      const deadAlly = createMockAlly('ally_1', 405, 400, 0);
      const avoidance = calculateAllyAvoidance(
        new Vector2(400, 400),
        'unit_1',
        10,
        [deadAlly],
        REFERENCE_ARENA_HEIGHT
      );

      expect(avoidance.magnitude()).toBe(0);
    });

    it('should combine avoidance from multiple nearby allies', () => {
      const allyLeft = createMockAlly('ally_1', 385, 400);
      const allyRight = createMockAlly('ally_2', 415, 400);
      const avoidance = calculateAllyAvoidance(
        new Vector2(400, 400),
        'unit_1',
        10,
        [allyLeft, allyRight],
        REFERENCE_ARENA_HEIGHT
      );

      // Symmetric allies should mostly cancel out horizontally
      expect(Math.abs(avoidance.x)).toBeLessThan(1);
    });

    it('should scale with arena height', () => {
      const nearAlly = createMockAlly('ally_1', 410, 400);
      const smallArena = calculateAllyAvoidance(
        new Vector2(400, 400),
        'unit_1',
        10,
        [nearAlly],
        REFERENCE_ARENA_HEIGHT * 0.5
      );
      const largeArena = calculateAllyAvoidance(
        new Vector2(400, 400),
        'unit_1',
        10,
        [nearAlly],
        REFERENCE_ARENA_HEIGHT * 1.5
      );

      // Larger arena = stronger avoidance force (scaled)
      expect(largeArena.magnitude()).toBeGreaterThan(smallArena.magnitude());
    });
  });

  describe('calculatePathAvoidance', () => {
    it('should return zero when no allies in path', () => {
      const avoidance = calculatePathAvoidance(
        new Vector2(400, 400),
        'unit_1',
        10,
        new Vector2(0, -1),
        [],
        REFERENCE_ARENA_HEIGHT
      );

      expect(avoidance.magnitude()).toBe(0);
    });

    it('should avoid ally directly in path', () => {
      // Ally must be within avoidDist = (10+10)*0.8*1.2 = 19.2
      // So distance must be < 19.2
      const blockerAlly = createMockAlly('ally_1', 400, 385); // 15 units ahead, within avoidDist
      const avoidance = calculatePathAvoidance(
        new Vector2(400, 400),
        'unit_1',
        10,
        new Vector2(0, -1), // Moving up
        [blockerAlly],
        REFERENCE_ARENA_HEIGHT
      );

      // Should push to the side (perpendicular to move direction)
      expect(avoidance.x).not.toBe(0);
    });

    it('should not avoid ally perpendicular to path', () => {
      const sideAlly = createMockAlly('ally_1', 420, 400); // To the side
      const avoidance = calculatePathAvoidance(
        new Vector2(400, 400),
        'unit_1',
        10,
        new Vector2(0, -1), // Moving up
        [sideAlly],
        REFERENCE_ARENA_HEIGHT
      );

      // Ally is not blocking the path (dot product will be low)
      expect(avoidance.magnitude()).toBeLessThan(1);
    });

    it('should ignore self', () => {
      const self = createMockAlly('unit_1', 400, 400);
      const avoidance = calculatePathAvoidance(
        new Vector2(400, 400),
        'unit_1',
        10,
        new Vector2(0, -1),
        [self],
        REFERENCE_ARENA_HEIGHT
      );

      expect(avoidance.magnitude()).toBe(0);
    });

    it('should ignore dead allies', () => {
      const deadAlly = createMockAlly('ally_1', 400, 385, 0);
      const avoidance = calculatePathAvoidance(
        new Vector2(400, 400),
        'unit_1',
        10,
        new Vector2(0, -1),
        [deadAlly],
        REFERENCE_ARENA_HEIGHT
      );

      expect(avoidance.magnitude()).toBe(0);
    });
  });

  describe('clampSpeed', () => {
    it('should not modify vector below max speed', () => {
      const velocity = new Vector2(30, 0);
      const clamped = clampSpeed(velocity, 50);

      expect(clamped.x).toBe(30);
      expect(clamped.y).toBe(0);
    });

    it('should clamp vector exceeding max speed', () => {
      const velocity = new Vector2(100, 0);
      const clamped = clampSpeed(velocity, 50);

      expect(clamped.magnitude()).toBeCloseTo(50);
      expect(clamped.x).toBeCloseTo(50);
    });

    it('should preserve direction when clamping', () => {
      const velocity = new Vector2(60, 80); // Magnitude = 100
      const clamped = clampSpeed(velocity, 50);

      expect(clamped.magnitude()).toBeCloseTo(50);
      // Direction should be preserved (3:4 ratio)
      expect(clamped.x / clamped.y).toBeCloseTo(0.75);
    });

    it('should handle zero vector', () => {
      const velocity = Vector2.zero();
      const clamped = clampSpeed(velocity, 50);

      expect(clamped.x).toBe(0);
      expect(clamped.y).toBe(0);
    });
  });

  describe('marchForward', () => {
    it('should move player unit upward', () => {
      const context = createMockContext();
      const result = marchForward(new Vector2(400, 400), 'player', 'unit_1', 10, 50, context, 1.0);

      expect(result.position.y).toBeLessThan(400);
      expect(result.position.x).toBeCloseTo(400);
      expect(result.didMove).toBe(true);
      expect(result.isWalking).toBe(true);
    });

    it('should move enemy unit downward', () => {
      const context = createMockContext();
      const result = marchForward(new Vector2(400, 100), 'enemy', 'unit_1', 10, 50, context, 1.0);

      expect(result.position.y).toBeGreaterThan(100);
      expect(result.position.x).toBeCloseTo(400);
    });

    it('should apply movement speed correctly', () => {
      const context = createMockContext();
      const result = marchForward(
        new Vector2(400, 400),
        'player',
        'unit_1',
        10,
        100, // 100 px/s
        context,
        0.5 // 0.5 seconds
      );

      // Should move ~50 pixels
      expect(result.position.distanceTo(new Vector2(400, 400))).toBeCloseTo(50, 0);
    });

    it('should record previous position', () => {
      const context = createMockContext();
      const startPos = new Vector2(400, 400);
      const result = marchForward(startPos, 'player', 'unit_1', 10, 50, context, 1.0);

      expect(result.previousPosition.x).toBe(400);
      expect(result.previousPosition.y).toBe(400);
    });

    it('should apply ally avoidance', () => {
      const nearAlly = createMockAlly('ally_1', 400, 380);
      const context = createMockContext({ allies: [nearAlly] });

      const result = marchForward(new Vector2(400, 400), 'player', 'unit_1', 10, 50, context, 0.1);

      // Should be pushed sideways due to ally avoidance
      // (exact direction depends on avoidance calculation)
      expect(result.didMove).toBe(true);
    });
  });

  describe('moveTowardTarget', () => {
    it('should move toward target position', () => {
      const context = createMockContext();
      const result = moveTowardTarget(
        new Vector2(400, 400),
        new Vector2(400, 300), // Target above
        'unit_1',
        10,
        50,
        context,
        1.0
      );

      expect(result.position.y).toBeLessThan(400);
      expect(result.didMove).toBe(true);
      expect(result.isWalking).toBe(true);
    });

    it('should not move when already at target', () => {
      const context = createMockContext();
      const result = moveTowardTarget(
        new Vector2(400, 400),
        new Vector2(400, 400.5), // Within MIN_MOVE_DISTANCE
        'unit_1',
        10,
        50,
        context,
        1.0
      );

      expect(result.didMove).toBe(false);
      expect(result.isWalking).toBe(false);
      expect(result.position.x).toBe(400);
      expect(result.position.y).toBe(400);
    });

    it('should move diagonally when target is diagonal', () => {
      const context = createMockContext();
      const result = moveTowardTarget(
        new Vector2(400, 400),
        new Vector2(500, 300), // Diagonal up-right
        'unit_1',
        10,
        50,
        context,
        1.0
      );

      expect(result.position.x).toBeGreaterThan(400);
      expect(result.position.y).toBeLessThan(400);
    });

    it('should apply path avoidance when allies block', () => {
      const blockerAlly = createMockAlly('ally_1', 400, 350);
      const context = createMockContext({ allies: [blockerAlly] });

      const result = moveTowardTarget(
        new Vector2(400, 400),
        new Vector2(400, 200), // Target directly above, past blocker
        'unit_1',
        10,
        50,
        context,
        0.1
      );

      // Should still move, potentially with lateral offset
      expect(result.didMove).toBe(true);
    });

    it('should clamp to max speed', () => {
      const context = createMockContext();
      const result = moveTowardTarget(
        new Vector2(0, 0),
        new Vector2(1000, 0), // Far target
        'unit_1',
        10,
        50, // Max 50 px/s
        context,
        1.0
      );

      // Should move at most 50 pixels
      expect(result.position.distanceTo(new Vector2(0, 0))).toBeLessThanOrEqual(51);
    });

    it('should record movement delta', () => {
      const context = createMockContext();
      const result = moveTowardTarget(
        new Vector2(400, 400),
        new Vector2(400, 300),
        'unit_1',
        10,
        50,
        context,
        0.5
      );

      expect(result.movementDelta.y).toBeLessThan(0);
      expect(result.movementDelta.magnitude()).toBeGreaterThan(0);
    });
  });
});

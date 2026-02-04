import { describe, it, expect } from 'vitest';
import { Vector2 } from '../../../../src/core/physics/Vector2';
import {
  getAggroRadius,
  isDeepInEnemyZone,
  areAllEnemyCastlesDestroyed,
  findDamageableInAggroRadius,
  findNearestDamageable,
  findClosestEnemyCastle,
  updateTargeting,
} from '../../../../src/core/battle/unit-behaviors/TargetingSystem';
import {
  REFERENCE_ARENA_HEIGHT,
  BASE_AGGRO_RADIUS,
  ZONE_HEIGHT_PERCENT,
  ZONE_MIDWAY_DIVISOR,
  TARGET_SWITCH_COOLDOWN_SECONDS,
} from '../../../../src/core/battle/BattleConfig';
import { IDamageable } from '../../../../src/core/battle/IEntity';
import { TargetingContext, TargetableUnit } from '../../../../src/core/battle/unit-behaviors/types';
import { UnitTeam } from '../../../../src/core/battle/types';

// Mock damageable for testing
function createMockDamageable(
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
    size: 10,
    isDestroyed: () => destroyed,
  };
}

// Mock targetable unit for testing
function createMockTargetableUnit(
  id: string,
  team: UnitTeam,
  x: number,
  y: number,
  options: Partial<{
    target: IDamageable | null;
    seekMode: boolean;
    retargetCooldown: number;
  }> = {}
): TargetableUnit {
  return {
    id,
    team,
    position: new Vector2(x, y),
    size: 10,
    target: options.target ?? null,
    seekMode: options.seekMode ?? false,
    retargetCooldown: options.retargetCooldown ?? 0,
  };
}

// Mock targeting context for testing
function createMockContext(
  options: Partial<{
    enemyDamageables: IDamageable[];
    enemyCastles: IDamageable[];
    initialCastleCount: number;
    bounds: { width: number; height: number } | null;
    arenaHeight: number;
  }> = {}
): TargetingContext {
  const enemyCastles = options.enemyCastles ?? [];
  return {
    getEnemyDamageables: () => options.enemyDamageables ?? [],
    getEnemyCastles: () => enemyCastles,
    getInitialCastleCount: () => options.initialCastleCount ?? enemyCastles.length,
    bounds: options.bounds ?? { width: 800, height: REFERENCE_ARENA_HEIGHT },
    arenaHeight: options.arenaHeight ?? REFERENCE_ARENA_HEIGHT,
  };
}

describe('TargetingSystem', () => {
  describe('getAggroRadius', () => {
    it('should return base aggro radius at reference height', () => {
      const radius = getAggroRadius(REFERENCE_ARENA_HEIGHT);
      expect(radius).toBe(BASE_AGGRO_RADIUS);
    });

    it('should scale aggro radius with arena height', () => {
      const smallArena = getAggroRadius(REFERENCE_ARENA_HEIGHT * 0.5);
      const largeArena = getAggroRadius(REFERENCE_ARENA_HEIGHT * 1.5);

      expect(smallArena).toBeLessThan(BASE_AGGRO_RADIUS);
      expect(largeArena).toBeGreaterThan(BASE_AGGRO_RADIUS);
    });
  });

  describe('isDeepInEnemyZone', () => {
    const bounds = { width: 800, height: REFERENCE_ARENA_HEIGHT };
    const zoneHeight = bounds.height * ZONE_HEIGHT_PERCENT;
    const threshold = zoneHeight / ZONE_MIDWAY_DIVISOR;

    it('should return false without bounds', () => {
      const result = isDeepInEnemyZone({ x: 400, y: 50 }, 'player', null);
      expect(result).toBe(false);
    });

    it('should detect player unit deep in enemy zone (top of arena)', () => {
      // Player's enemy zone is at the top (Y = 0)
      // Deep means Y < zoneHeight / 2
      const deepY = threshold - 10;
      const result = isDeepInEnemyZone({ x: 400, y: deepY }, 'player', bounds);
      expect(result).toBe(true);
    });

    it('should not detect player unit not deep in enemy zone', () => {
      const notDeepY = threshold + 50;
      const result = isDeepInEnemyZone({ x: 400, y: notDeepY }, 'player', bounds);
      expect(result).toBe(false);
    });

    it('should detect enemy unit deep in player zone (bottom of arena)', () => {
      // Enemy's enemy zone is at the bottom (Y = height)
      // Deep means Y > height - zoneHeight / 2
      const deepY = bounds.height - threshold + 10;
      const result = isDeepInEnemyZone({ x: 400, y: deepY }, 'enemy', bounds);
      expect(result).toBe(true);
    });

    it('should not detect enemy unit not deep in player zone', () => {
      const notDeepY = bounds.height - threshold - 50;
      const result = isDeepInEnemyZone({ x: 400, y: notDeepY }, 'enemy', bounds);
      expect(result).toBe(false);
    });
  });

  describe('areAllEnemyCastlesDestroyed', () => {
    it('should return false when enemy castles exist', () => {
      const castle = createMockDamageable('castle_1', 400, 50, 100, false);
      const context = createMockContext({
        enemyCastles: [castle],
        initialCastleCount: 1,
      });

      const result = areAllEnemyCastlesDestroyed('player', context);
      expect(result).toBe(false);
    });

    it('should return true when all enemy castles are destroyed', () => {
      const castle = createMockDamageable('castle_1', 400, 50, 0, true);
      const context = createMockContext({
        enemyCastles: [castle],
        initialCastleCount: 1,
      });

      const result = areAllEnemyCastlesDestroyed('player', context);
      expect(result).toBe(true);
    });

    it('should return false when there were no initial castles', () => {
      const context = createMockContext({
        enemyCastles: [],
        initialCastleCount: 0,
      });

      const result = areAllEnemyCastlesDestroyed('player', context);
      expect(result).toBe(false);
    });

    it('should return true when some castles destroyed, all dead', () => {
      const castle1 = createMockDamageable('castle_1', 200, 50, 0, true);
      const castle2 = createMockDamageable('castle_2', 600, 50, 0, true);
      const context = createMockContext({
        enemyCastles: [castle1, castle2],
        initialCastleCount: 2,
      });

      const result = areAllEnemyCastlesDestroyed('player', context);
      expect(result).toBe(true);
    });

    it('should return false when some castles still alive', () => {
      const castle1 = createMockDamageable('castle_1', 200, 50, 0, true);
      const castle2 = createMockDamageable('castle_2', 600, 50, 50, false);
      const context = createMockContext({
        enemyCastles: [castle1, castle2],
        initialCastleCount: 2,
      });

      const result = areAllEnemyCastlesDestroyed('player', context);
      expect(result).toBe(false);
    });
  });

  describe('findDamageableInAggroRadius', () => {
    it('should return null when no enemies exist', () => {
      const result = findDamageableInAggroRadius({ x: 400, y: 300 }, [], 150);
      expect(result).toBeNull();
    });

    it('should return null when enemies are outside aggro radius', () => {
      const enemy = createMockDamageable('enemy_1', 400, 0);
      const result = findDamageableInAggroRadius({ x: 400, y: 300 }, [enemy], 150);
      expect(result).toBeNull();
    });

    it('should find nearest enemy within aggro radius', () => {
      const enemy1 = createMockDamageable('enemy_1', 400, 200); // 100 away
      const enemy2 = createMockDamageable('enemy_2', 400, 250); // 50 away
      const result = findDamageableInAggroRadius({ x: 400, y: 300 }, [enemy1, enemy2], 150);
      expect(result).toBe(enemy2);
    });

    it('should ignore dead enemies', () => {
      const deadEnemy = createMockDamageable('enemy_dead', 400, 280, 0);
      const aliveEnemy = createMockDamageable('enemy_alive', 400, 200, 100);
      const result = findDamageableInAggroRadius({ x: 400, y: 300 }, [deadEnemy, aliveEnemy], 150);
      expect(result).toBe(aliveEnemy);
    });

    it('should return null when all enemies in radius are dead', () => {
      const deadEnemy = createMockDamageable('enemy_dead', 400, 280, 0);
      const result = findDamageableInAggroRadius({ x: 400, y: 300 }, [deadEnemy], 150);
      expect(result).toBeNull();
    });
  });

  describe('findNearestDamageable', () => {
    it('should return null when no enemies exist', () => {
      const result = findNearestDamageable({ x: 400, y: 300 }, []);
      expect(result).toBeNull();
    });

    it('should find nearest enemy regardless of distance', () => {
      const enemy1 = createMockDamageable('enemy_1', 400, 0); // 300 away
      const enemy2 = createMockDamageable('enemy_2', 400, 100); // 200 away
      const result = findNearestDamageable({ x: 400, y: 300 }, [enemy1, enemy2]);
      expect(result).toBe(enemy2);
    });

    it('should ignore dead enemies', () => {
      const deadEnemy = createMockDamageable('enemy_dead', 400, 299, 0);
      const aliveEnemy = createMockDamageable('enemy_alive', 0, 0, 100);
      const result = findNearestDamageable({ x: 400, y: 300 }, [deadEnemy, aliveEnemy]);
      expect(result).toBe(aliveEnemy);
    });
  });

  describe('findClosestEnemyCastle', () => {
    it('should return null when no castles exist', () => {
      const result = findClosestEnemyCastle({ x: 400, y: 300 }, []);
      expect(result).toBeNull();
    });

    it('should find closest castle', () => {
      const castle1 = createMockDamageable('castle_1', 200, 50);
      const castle2 = createMockDamageable('castle_2', 400, 50);
      const result = findClosestEnemyCastle({ x: 400, y: 300 }, [castle1, castle2]);
      expect(result).toBe(castle2);
    });

    it('should ignore destroyed castles', () => {
      const destroyedCastle = createMockDamageable('castle_1', 400, 100, 0, true);
      const aliveCastle = createMockDamageable('castle_2', 200, 50, 100, false);
      const result = findClosestEnemyCastle({ x: 400, y: 300 }, [destroyedCastle, aliveCastle]);
      expect(result).toBe(aliveCastle);
    });

    it('should ignore castles with zero health', () => {
      const deadCastle = createMockDamageable('castle_1', 400, 100, 0, false);
      const aliveCastle = createMockDamageable('castle_2', 200, 50, 100, false);
      const result = findClosestEnemyCastle({ x: 400, y: 300 }, [deadCastle, aliveCastle]);
      expect(result).toBe(aliveCastle);
    });
  });

  describe('updateTargeting', () => {
    it('should clear dead target', () => {
      const deadTarget = createMockDamageable('target', 400, 200, 0);
      const unit = createMockTargetableUnit('unit_1', 'player', 400, 400, {
        target: deadTarget,
        retargetCooldown: 5,
      });
      const context = createMockContext({ enemyDamageables: [] });

      const result = updateTargeting(unit, context);

      expect(result.target).toBeNull();
      expect(result.retargetCooldown).toBe(0);
    });

    it('should clear destroyed target', () => {
      const destroyedTarget = createMockDamageable('target', 400, 200, 100, true);
      const unit = createMockTargetableUnit('unit_1', 'player', 400, 400, {
        target: destroyedTarget,
      });
      const context = createMockContext({ enemyDamageables: [] });

      const result = updateTargeting(unit, context);

      expect(result.target).toBeNull();
    });

    it('should enter seek mode when all enemy castles destroyed', () => {
      const unit = createMockTargetableUnit('unit_1', 'player', 400, 400, {
        seekMode: false,
      });
      const destroyedCastle = createMockDamageable('castle', 400, 50, 0, true);
      const context = createMockContext({
        enemyCastles: [destroyedCastle],
        initialCastleCount: 1,
        enemyDamageables: [],
      });

      const result = updateTargeting(unit, context);

      expect(result.seekMode).toBe(true);
    });

    it('should enter seek mode when deep in enemy zone', () => {
      const bounds = { width: 800, height: REFERENCE_ARENA_HEIGHT };
      // Player unit deep in enemy zone (top of arena)
      const unit = createMockTargetableUnit('unit_1', 'player', 400, 10, {
        seekMode: false,
      });
      const context = createMockContext({
        bounds,
        enemyCastles: [createMockDamageable('castle', 400, 50, 100)],
        initialCastleCount: 1,
        enemyDamageables: [],
      });

      const result = updateTargeting(unit, context);

      expect(result.seekMode).toBe(true);
    });

    it('should acquire target within aggro radius', () => {
      const enemy = createMockDamageable('enemy_1', 400, 300);
      const unit = createMockTargetableUnit('unit_1', 'player', 400, 400);
      const context = createMockContext({
        enemyDamageables: [enemy],
        enemyCastles: [],
        initialCastleCount: 0,
      });

      const result = updateTargeting(unit, context);

      expect(result.target).toBe(enemy);
    });

    it('should not acquire target outside aggro radius when not in seek mode', () => {
      const farEnemy = createMockDamageable('enemy_1', 400, 0); // Very far
      const unit = createMockTargetableUnit('unit_1', 'player', 400, 500);
      const context = createMockContext({
        enemyDamageables: [farEnemy],
        enemyCastles: [],
        initialCastleCount: 0,
      });

      const result = updateTargeting(unit, context);

      expect(result.target).toBeNull();
    });

    it('should acquire target at any distance in seek mode', () => {
      const farEnemy = createMockDamageable('enemy_1', 400, 0);
      const unit = createMockTargetableUnit('unit_1', 'player', 400, 500, {
        seekMode: true,
      });
      const context = createMockContext({
        enemyDamageables: [farEnemy],
        enemyCastles: [],
        initialCastleCount: 0,
      });

      const result = updateTargeting(unit, context);

      expect(result.target).toBe(farEnemy);
      expect(result.retargetCooldown).toBe(TARGET_SWITCH_COOLDOWN_SECONDS);
    });

    it('should keep existing valid target when not in seek mode', () => {
      const currentTarget = createMockDamageable('target', 400, 300, 100);
      const closerEnemy = createMockDamageable('closer', 400, 350, 100);
      const unit = createMockTargetableUnit('unit_1', 'player', 400, 400, {
        target: currentTarget,
        seekMode: false,
      });
      const context = createMockContext({
        enemyDamageables: [currentTarget, closerEnemy],
        enemyCastles: [],
        initialCastleCount: 0,
      });

      const result = updateTargeting(unit, context);

      expect(result.target).toBe(currentTarget);
    });

    it('should switch to closer target in seek mode when cooldown expired', () => {
      const currentTarget = createMockDamageable('target', 400, 200, 100); // 200 away
      const closerEnemy = createMockDamageable('closer', 400, 350, 100); // 50 away
      const unit = createMockTargetableUnit('unit_1', 'player', 400, 400, {
        target: currentTarget,
        seekMode: true,
        retargetCooldown: 0,
      });
      const context = createMockContext({
        enemyDamageables: [currentTarget, closerEnemy],
        enemyCastles: [],
        initialCastleCount: 0,
      });

      const result = updateTargeting(unit, context);

      // Should switch because closer is significantly closer (< 70% of current distance)
      expect(result.target).toBe(closerEnemy);
      expect(result.retargetCooldown).toBe(TARGET_SWITCH_COOLDOWN_SECONDS);
    });

    it('should not switch target in seek mode when cooldown active', () => {
      const currentTarget = createMockDamageable('target', 400, 200, 100);
      const closerEnemy = createMockDamageable('closer', 400, 399, 100);
      const unit = createMockTargetableUnit('unit_1', 'player', 400, 400, {
        target: currentTarget,
        seekMode: true,
        retargetCooldown: 1.5,
      });
      const context = createMockContext({
        enemyDamageables: [currentTarget, closerEnemy],
        enemyCastles: [],
        initialCastleCount: 0,
      });

      const result = updateTargeting(unit, context);

      expect(result.target).toBe(currentTarget);
      expect(result.retargetCooldown).toBe(1.5);
    });

    it('should not switch target if new target is not significantly closer', () => {
      const currentTarget = createMockDamageable('target', 400, 300, 100); // 100 away
      // 80 away - not < 70% of 100, so not significantly closer
      const slightlyCloser = createMockDamageable('closer', 400, 320, 100);
      const unit = createMockTargetableUnit('unit_1', 'player', 400, 400, {
        target: currentTarget,
        seekMode: true,
        retargetCooldown: 0,
      });
      const context = createMockContext({
        enemyDamageables: [currentTarget, slightlyCloser],
        enemyCastles: [],
        initialCastleCount: 0,
      });

      const result = updateTargeting(unit, context);

      // Should keep current because 80 is not < 70 (100 * 0.7)
      expect(result.target).toBe(currentTarget);
    });

    it('should preserve seek mode once activated', () => {
      const unit = createMockTargetableUnit('unit_1', 'player', 400, 300, {
        seekMode: true,
      });
      const castle = createMockDamageable('castle', 400, 50, 100);
      const context = createMockContext({
        bounds: { width: 800, height: REFERENCE_ARENA_HEIGHT },
        enemyCastles: [castle],
        initialCastleCount: 1,
        enemyDamageables: [],
      });

      const result = updateTargeting(unit, context);

      expect(result.seekMode).toBe(true);
    });
  });
});

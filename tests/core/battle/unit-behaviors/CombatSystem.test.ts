import { describe, it, expect } from 'vitest';
import { Vector2 } from '../../../../src/core/physics/Vector2';
import {
  getAttackMode,
  getMaxRange,
  isInMeleeMode,
  isMeleeAttack,
  isInRange,
  calculateModifiedDamage,
  getAttackDirection,
  getAttackCooldown,
  updateCombat,
} from '../../../../src/core/battle/unit-behaviors/CombatSystem';
import {
  MELEE_SIZE_MULTIPLIER,
  MELEE_RANGE_BUFFER,
  MELEE_ATTACK_RANGE_THRESHOLD,
} from '../../../../src/core/battle/BattleConfig';
import { AttackMode, UnitStats } from '../../../../src/core/battle/types';
import { IDamageable } from '../../../../src/core/battle/IEntity';

// Helper to create mock attack modes
function createMeleeAttack(
  damage: number = 50,
  range: number = 20,
  attackSpeed: number = 1
): AttackMode {
  return { damage, range, attackSpeed };
}

function createRangedAttack(
  damage: number = 30,
  range: number = 100,
  attackSpeed: number = 1.5
): AttackMode {
  return { damage, range, attackSpeed };
}

// Helper to create unit stats
function createStats(options: {
  melee?: AttackMode | null;
  ranged?: AttackMode | null;
  attackInterval?: number;
}): UnitStats {
  return {
    maxHealth: 100,
    moveSpeed: 50,
    size: 10,
    melee: options.melee ?? null,
    ranged: options.ranged ?? null,
    attackInterval: options.attackInterval,
  };
}

// Helper to create mock damageable
function createMockDamageable(x: number, y: number, size: number = 10): IDamageable {
  return {
    id: 'target',
    position: new Vector2(x, y),
    health: 100,
    size,
    isDestroyed: () => false,
  };
}

describe('CombatSystem', () => {
  describe('getAttackMode', () => {
    it('should return melee when in melee range and unit has melee attack', () => {
      const melee = createMeleeAttack(50, 20);
      const stats = createStats({ melee });
      const unitSize = 10;
      const meleeRange = melee.range + unitSize * MELEE_SIZE_MULTIPLIER + MELEE_RANGE_BUFFER;

      const result = getAttackMode(stats, unitSize, meleeRange - 5);

      expect(result).toBe(melee);
    });

    it('should return ranged when outside melee range and unit has ranged attack', () => {
      const melee = createMeleeAttack(50, 20);
      const ranged = createRangedAttack(30, 100);
      const stats = createStats({ melee, ranged });
      const unitSize = 10;
      const meleeRange = melee.range + unitSize * MELEE_SIZE_MULTIPLIER + MELEE_RANGE_BUFFER;

      const result = getAttackMode(stats, unitSize, meleeRange + 10);

      expect(result).toBe(ranged);
    });

    it('should return ranged when no melee attack', () => {
      const ranged = createRangedAttack(30, 100);
      const stats = createStats({ ranged });

      const result = getAttackMode(stats, 10, 50);

      expect(result).toBe(ranged);
    });

    it('should fall back to melee when outside melee range but no ranged attack', () => {
      const melee = createMeleeAttack(50, 20);
      const stats = createStats({ melee });

      const result = getAttackMode(stats, 10, 200);

      expect(result).toBe(melee);
    });

    it('should return null when unit has no attacks', () => {
      const stats = createStats({});

      const result = getAttackMode(stats, 10, 50);

      expect(result).toBeNull();
    });
  });

  describe('getMaxRange', () => {
    it('should return ranged range when unit has ranged attack', () => {
      const ranged = createRangedAttack(30, 150);
      const stats = createStats({ ranged });

      expect(getMaxRange(stats)).toBe(150);
    });

    it('should return melee range when unit only has melee', () => {
      const melee = createMeleeAttack(50, 25);
      const stats = createStats({ melee });

      expect(getMaxRange(stats)).toBe(25);
    });

    it('should prefer ranged range over melee', () => {
      const melee = createMeleeAttack(50, 25);
      const ranged = createRangedAttack(30, 100);
      const stats = createStats({ melee, ranged });

      expect(getMaxRange(stats)).toBe(100);
    });

    it('should return 0 when unit has no attacks', () => {
      const stats = createStats({});

      expect(getMaxRange(stats)).toBe(0);
    });
  });

  describe('isInMeleeMode', () => {
    it('should return true when within melee range', () => {
      const melee = createMeleeAttack(50, 20);
      const stats = createStats({ melee });
      const unitSize = 10;
      const meleeRange = melee.range + unitSize * MELEE_SIZE_MULTIPLIER + MELEE_RANGE_BUFFER;

      expect(isInMeleeMode(stats, unitSize, meleeRange - 5)).toBe(true);
    });

    it('should return false when outside melee range', () => {
      const melee = createMeleeAttack(50, 20);
      const stats = createStats({ melee });
      const unitSize = 10;
      const meleeRange = melee.range + unitSize * MELEE_SIZE_MULTIPLIER + MELEE_RANGE_BUFFER;

      expect(isInMeleeMode(stats, unitSize, meleeRange + 10)).toBe(false);
    });

    it('should return false when no melee attack', () => {
      const ranged = createRangedAttack(30, 100);
      const stats = createStats({ ranged });

      expect(isInMeleeMode(stats, 10, 5)).toBe(false);
    });
  });

  describe('isMeleeAttack', () => {
    it('should return true for short range attacks', () => {
      const melee = createMeleeAttack(50, MELEE_ATTACK_RANGE_THRESHOLD);

      expect(isMeleeAttack(melee)).toBe(true);
    });

    it('should return false for long range attacks', () => {
      const ranged = createRangedAttack(30, MELEE_ATTACK_RANGE_THRESHOLD + 1);

      expect(isMeleeAttack(ranged)).toBe(false);
    });

    it('should use threshold constant for classification', () => {
      const atThreshold = { damage: 50, range: MELEE_ATTACK_RANGE_THRESHOLD, attackSpeed: 1 };
      const justAbove = { damage: 50, range: MELEE_ATTACK_RANGE_THRESHOLD + 1, attackSpeed: 1 };

      expect(isMeleeAttack(atThreshold)).toBe(true);
      expect(isMeleeAttack(justAbove)).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('should return true when target is within effective range', () => {
      const attackerPos = new Vector2(100, 100);
      const attackerSize = 10;
      const target = createMockDamageable(120, 100, 10);
      const attackMode = createRangedAttack(30, 50);

      // Distance is 20, effective range is 50 + 10 + 10 = 70
      expect(isInRange(attackerPos, attackerSize, target, attackMode)).toBe(true);
    });

    it('should return false when target is outside effective range', () => {
      const attackerPos = new Vector2(100, 100);
      const attackerSize = 10;
      const target = createMockDamageable(200, 100, 10);
      const attackMode = createRangedAttack(30, 50);

      // Distance is 100, effective range is 50 + 10 + 10 = 70
      expect(isInRange(attackerPos, attackerSize, target, attackMode)).toBe(false);
    });

    it('should account for attacker and target sizes', () => {
      const attackerPos = new Vector2(100, 100);
      const attackMode = { damage: 30, range: 10, attackSpeed: 1 };

      // Large units can hit from further away
      const largeTarget = createMockDamageable(150, 100, 30);
      // Distance is 50, effective range is 10 + 10 + 30 = 50
      expect(isInRange(attackerPos, 10, largeTarget, attackMode)).toBe(true);

      const smallTarget = createMockDamageable(150, 100, 5);
      // Distance is 50, effective range is 10 + 10 + 5 = 25
      expect(isInRange(attackerPos, 10, smallTarget, attackMode)).toBe(false);
    });
  });

  describe('calculateModifiedDamage', () => {
    it('should apply damage multiplier correctly', () => {
      expect(calculateModifiedDamage(100, 1.5)).toBe(150);
      expect(calculateModifiedDamage(100, 0.5)).toBe(50);
      expect(calculateModifiedDamage(100, 1.0)).toBe(100);
    });

    it('should round to integer', () => {
      expect(calculateModifiedDamage(100, 1.33)).toBe(133);
      expect(calculateModifiedDamage(100, 1.337)).toBe(134); // Rounds
    });

    it('should handle zero multiplier', () => {
      expect(calculateModifiedDamage(100, 0)).toBe(0);
    });
  });

  describe('getAttackDirection', () => {
    it('should return normalized direction to target', () => {
      const attacker = new Vector2(0, 0);
      const target = new Vector2(100, 0);

      const dir = getAttackDirection(attacker, target);

      expect(dir.x).toBeCloseTo(1);
      expect(dir.y).toBeCloseTo(0);
    });

    it('should handle diagonal directions', () => {
      const attacker = new Vector2(0, 0);
      const target = new Vector2(100, 100);

      const dir = getAttackDirection(attacker, target);

      expect(dir.x).toBeCloseTo(Math.SQRT1_2);
      expect(dir.y).toBeCloseTo(Math.SQRT1_2);
    });

    it('should return default direction when positions overlap', () => {
      const pos = new Vector2(100, 100);

      const dir = getAttackDirection(pos, pos);

      expect(dir.x).toBe(0);
      expect(dir.y).toBe(-1); // Default upward direction
    });

    it('should return default direction for very small distances', () => {
      const attacker = new Vector2(100, 100);
      const target = new Vector2(100.0001, 100.0001);

      const dir = getAttackDirection(attacker, target, 0.001);

      expect(dir.x).toBe(0);
      expect(dir.y).toBe(-1);
    });
  });

  describe('getAttackCooldown', () => {
    it('should use attackInterval from stats when available', () => {
      const stats = createStats({ attackInterval: 0.5 });
      const attackMode = createMeleeAttack(50, 20, 2); // attackSpeed = 2

      expect(getAttackCooldown(stats, attackMode)).toBe(0.5);
    });

    it('should calculate from attackSpeed when no interval specified', () => {
      const stats = createStats({});
      const attackMode = createMeleeAttack(50, 20, 2); // attackSpeed = 2

      expect(getAttackCooldown(stats, attackMode)).toBe(0.5); // 1 / 2
    });

    it('should handle different attack speeds', () => {
      const stats = createStats({});

      expect(getAttackCooldown(stats, { damage: 10, range: 10, attackSpeed: 1 })).toBe(1);
      expect(getAttackCooldown(stats, { damage: 10, range: 10, attackSpeed: 4 })).toBe(0.25);
    });
  });

  describe('updateCombat', () => {
    const baseStats = createStats({
      melee: createMeleeAttack(50, 20, 2),
      ranged: createRangedAttack(30, 100, 1.5),
    });

    it('should decrease cooldown over time', () => {
      const result = updateCombat(1.0, 0.1, new Vector2(0, 0), 10, baseStats, null);

      expect(result.attackCooldown).toBeCloseTo(0.9);
      expect(result.didAttack).toBe(false);
    });

    it('should not attack without target', () => {
      const result = updateCombat(0, 0.1, new Vector2(0, 0), 10, baseStats, null);

      expect(result.didAttack).toBe(false);
      expect(result.damage).toBe(0);
    });

    it('should not attack when target out of range', () => {
      const target = createMockDamageable(500, 0);
      const result = updateCombat(0, 0.1, new Vector2(0, 0), 10, baseStats, target);

      expect(result.didAttack).toBe(false);
    });

    it('should not attack when cooldown active', () => {
      const target = createMockDamageable(30, 0, 10); // In range
      const result = updateCombat(0.5, 0.1, new Vector2(0, 0), 10, baseStats, target);

      expect(result.didAttack).toBe(false);
      expect(result.attackCooldown).toBeCloseTo(0.4);
    });

    it('should attack when in range and cooldown ready', () => {
      // Place target far enough to use ranged attack
      // getAttackMode uses melee if within: melee.range + unitSize * MELEE_SIZE_MULTIPLIER + MELEE_RANGE_BUFFER
      // = 20 + 10 * 2 + 20 = 60
      // So we need distance > 60 to use ranged
      const target = createMockDamageable(80, 0, 10);
      // Distance is 80, > 60 so ranged mode
      // Ranged effective range: range 100 + attacker 10 + target 10 = 120
      // 80 <= 120, so in range
      const result = updateCombat(0, 0.1, new Vector2(0, 0), 10, baseStats, target);

      expect(result.didAttack).toBe(true);
      expect(result.damage).toBe(30); // Ranged damage
      expect(result.attackMode).toBe(baseStats.ranged);
      expect(result.isMelee).toBe(false);
    });

    it('should use melee when target is close', () => {
      const target = createMockDamageable(20, 0, 10);
      // Distance 20 is within melee range
      const result = updateCombat(0, 0.1, new Vector2(0, 0), 10, baseStats, target);

      expect(result.didAttack).toBe(true);
      expect(result.damage).toBe(50); // Melee damage
      expect(result.attackMode).toBe(baseStats.melee);
      expect(result.isMelee).toBe(true);
    });

    it('should reset cooldown after attack', () => {
      // Use distance that allows attack (within effective range but triggers melee)
      const target = createMockDamageable(30, 0, 10);
      // Distance 30, melee effective range = 20 + 10 + 10 = 40
      // 30 <= 40, so in melee range
      const result = updateCombat(0, 0.1, new Vector2(0, 0), 10, baseStats, target);

      expect(result.didAttack).toBe(true);
      expect(result.attackCooldown).toBeGreaterThan(0);
    });

    it('should apply damage multiplier', () => {
      // Place target in melee range for reliable attack
      const target = createMockDamageable(30, 0, 10);
      const result = updateCombat(0, 0.1, new Vector2(0, 0), 10, baseStats, target, 2.0);

      expect(result.didAttack).toBe(true);
      expect(result.damage).toBe(100); // 50 (melee) * 2.0
    });

    it('should handle units with no attack modes', () => {
      const noAttackStats = createStats({});
      const target = createMockDamageable(20, 0, 10);

      const result = updateCombat(0, 0.1, new Vector2(0, 0), 10, noAttackStats, target);

      expect(result.didAttack).toBe(false);
      expect(result.attackMode).toBeNull();
    });

    it('should handle negative cooldown (floor at attack)', () => {
      // Place target in melee range for reliable attack
      const target = createMockDamageable(30, 0, 10);
      const result = updateCombat(-0.5, 0.1, new Vector2(0, 0), 10, baseStats, target);

      // Cooldown should tick, then attack should occur
      expect(result.didAttack).toBe(true);
    });
  });
});

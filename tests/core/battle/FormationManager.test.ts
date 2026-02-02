/**
 * FormationManager Tests
 *
 * Tests for deterministic enemy formation system.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateDeterministicEnemyPositions,
  getEnemyCompositionForWave,
  getAvailableUnitsForWave,
  getUnitRole,
  selectPatternForWave,
  DEFAULT_ENEMY_PATTERNS,
  ArenaBounds,
  UnitType,
} from '../../../src/core/battle/FormationManager';
import { UnitRegistry } from '../../../src/core/battle/units/UnitRegistry';
import { UnitDefinition, FormationRole } from '../../../src/core/battle/units/types';
import { createSeededRandom } from '../../../src/core/utils/Random';

// Test unit definitions
const testWarrior: UnitDefinition = {
  id: 'warrior',
  name: 'Test Warrior',
  description: 'Test unit',
  category: 'infantry',
  tier: 1,
  formationRole: 'front',
  wavePermit: 1,
  baseStats: {
    maxHealth: 100,
    moveSpeed: 10,
    armor: 0,
    melee: { damage: 10, attackSpeed: 1, range: 15 },
    ranged: null,
  },
  visuals: { shape: 'square', baseSize: 10, colorKey: 'warrior' },
  innateAbilities: [],
  unlockRequirements: [],
};

const testArcher: UnitDefinition = {
  id: 'archer',
  name: 'Test Archer',
  description: 'Test unit',
  category: 'ranged',
  tier: 1,
  formationRole: 'back',
  wavePermit: 1,
  baseStats: {
    maxHealth: 50,
    moveSpeed: 8,
    armor: 0,
    melee: null,
    ranged: { damage: 15, attackSpeed: 1, range: 100 },
  },
  visuals: { shape: 'triangle', baseSize: 8, colorKey: 'archer' },
  innateAbilities: [],
  unlockRequirements: [],
};

const testKnight: UnitDefinition = {
  id: 'knight',
  name: 'Test Knight',
  description: 'Test unit',
  category: 'cavalry',
  tier: 1,
  formationRole: 'flank',
  wavePermit: 3,
  baseStats: {
    maxHealth: 80,
    moveSpeed: 15,
    armor: 0,
    melee: { damage: 12, attackSpeed: 1.5, range: 15 },
    ranged: null,
  },
  visuals: { shape: 'circle', baseSize: 9, colorKey: 'knight' },
  innateAbilities: [],
  unlockRequirements: [],
};

const testBounds: ArenaBounds = {
  width: 600,
  height: 400,
  zoneHeightPercent: 0.375,
};

describe('FormationManager', () => {
  let registry: UnitRegistry;

  beforeEach(() => {
    registry = new UnitRegistry();
    registry.registerAll([testWarrior, testArcher, testKnight]);
  });

  describe('createSeededRandom', () => {
    it('produces consistent sequence for same seed', () => {
      const random1 = createSeededRandom(42);
      const random2 = createSeededRandom(42);

      const seq1 = [random1(), random1(), random1(), random1(), random1()];
      const seq2 = [random2(), random2(), random2(), random2(), random2()];

      expect(seq1).toEqual(seq2);
    });

    it('produces different sequences for different seeds', () => {
      const random1 = createSeededRandom(42);
      const random2 = createSeededRandom(43);

      const seq1 = [random1(), random1(), random1()];
      const seq2 = [random2(), random2(), random2()];

      expect(seq1).not.toEqual(seq2);
    });

    it('produces values in range [0, 1)', () => {
      const random = createSeededRandom(12345);

      for (let i = 0; i < 1000; i++) {
        const val = random();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe('getUnitRole', () => {
    it('returns correct role for each unit type', () => {
      expect(getUnitRole(testWarrior)).toBe('front');
      expect(getUnitRole(testArcher)).toBe('back');
      expect(getUnitRole(testKnight)).toBe('flank');
    });
  });

  describe('getAvailableUnitsForWave', () => {
    it('returns only units with wavePermit <= waveNumber', () => {
      // Wave 1: only warrior and archer (wavePermit 1)
      const wave1Units = getAvailableUnitsForWave(1, registry);
      expect(wave1Units).toHaveLength(2);
      expect(wave1Units.map((u) => u.id).sort()).toEqual(['archer', 'warrior']);

      // Wave 2: still only warrior and archer
      const wave2Units = getAvailableUnitsForWave(2, registry);
      expect(wave2Units).toHaveLength(2);

      // Wave 3: all units including knight (wavePermit 3)
      const wave3Units = getAvailableUnitsForWave(3, registry);
      expect(wave3Units).toHaveLength(3);
      expect(wave3Units.map((u) => u.id).sort()).toEqual(['archer', 'knight', 'warrior']);
    });
  });

  describe('getEnemyCompositionForWave', () => {
    it('uses data-driven composition when registry provided', () => {
      // Wave 1: no knights (wavePermit 3)
      const wave1Comp = getEnemyCompositionForWave(1, registry);
      expect(wave1Comp.filter((t) => t === 'knight')).toHaveLength(0);
      expect(wave1Comp.filter((t) => t === 'warrior').length).toBeGreaterThan(0);
      expect(wave1Comp.filter((t) => t === 'archer').length).toBeGreaterThan(0);

      // Wave 3: knights should appear
      const wave3Comp = getEnemyCompositionForWave(3, registry);
      expect(wave3Comp.filter((t) => t === 'knight').length).toBeGreaterThan(0);
    });

    it('falls back to legacy behavior without registry', () => {
      // Legacy fallback uses 'hound', 'fang', 'crawler' unit types
      const wave1Comp = getEnemyCompositionForWave(1);
      expect(wave1Comp.filter((t) => t === 'crawler')).toHaveLength(0);

      const wave3Comp = getEnemyCompositionForWave(3);
      expect(wave3Comp.filter((t) => t === 'crawler').length).toBeGreaterThan(0);
    });
  });

  describe('selectPatternForWave', () => {
    it('cycles through patterns based on wave number', () => {
      // Create a random that always returns > 0.2 (no variation)
      const deterministicRandom = () => 0.5;

      const pattern1 = selectPatternForWave(1, deterministicRandom);
      const pattern2 = selectPatternForWave(2, deterministicRandom);
      const pattern6 = selectPatternForWave(6, deterministicRandom);

      expect(pattern1.id).toBe(DEFAULT_ENEMY_PATTERNS[0].id);
      expect(pattern2.id).toBe(DEFAULT_ENEMY_PATTERNS[1].id);
      // Wave 6 should cycle back (5 patterns)
      expect(pattern6.id).toBe(DEFAULT_ENEMY_PATTERNS[0].id);
    });

    it('can select different pattern with variation chance', () => {
      // Create a random that triggers variation (< 0.2)
      let callCount = 0;
      const variationRandom = () => {
        callCount++;
        // First call triggers variation, second picks pattern index
        return callCount === 1 ? 0.1 : 0.5;
      };

      const pattern = selectPatternForWave(1, variationRandom);
      // With random() = 0.5 for index, should pick pattern 2 (0.5 * 5 = 2.5 -> 2)
      expect(pattern.id).toBe(DEFAULT_ENEMY_PATTERNS[2].id);
    });
  });

  describe('calculateDeterministicEnemyPositions', () => {
    it('produces identical positions for same wave number', () => {
      const composition: UnitType[] = ['warrior', 'warrior', 'archer', 'archer'];

      const positions1 = calculateDeterministicEnemyPositions(composition, registry, testBounds, 1);
      const positions2 = calculateDeterministicEnemyPositions(composition, registry, testBounds, 1);

      expect(positions1).toHaveLength(positions2.length);
      for (let i = 0; i < positions1.length; i++) {
        expect(positions1[i].type).toBe(positions2[i].type);
        expect(positions1[i].position.x).toBeCloseTo(positions2[i].position.x);
        expect(positions1[i].position.y).toBeCloseTo(positions2[i].position.y);
      }
    });

    it('produces different positions for different wave numbers', () => {
      const composition: UnitType[] = ['warrior', 'warrior', 'archer', 'archer'];

      const positions1 = calculateDeterministicEnemyPositions(composition, registry, testBounds, 1);
      const positions5 = calculateDeterministicEnemyPositions(composition, registry, testBounds, 5);

      // Should have same count but different positions
      expect(positions1).toHaveLength(positions5.length);

      // At least some positions should differ
      let hasDifference = false;
      for (let i = 0; i < positions1.length; i++) {
        if (
          Math.abs(positions1[i].position.x - positions5[i].position.x) > 1 ||
          Math.abs(positions1[i].position.y - positions5[i].position.y) > 1
        ) {
          hasDifference = true;
          break;
        }
      }
      expect(hasDifference).toBe(true);
    });

    it('returns empty array for empty composition', () => {
      const positions = calculateDeterministicEnemyPositions([], registry, testBounds, 1);
      expect(positions).toHaveLength(0);
    });

    it('positions all units within arena bounds', () => {
      const composition: UnitType[] = [
        'warrior',
        'warrior',
        'warrior',
        'archer',
        'archer',
        'archer',
        'knight',
        'knight',
      ];

      const positions = calculateDeterministicEnemyPositions(composition, registry, testBounds, 5);

      const zoneHeight = testBounds.height * testBounds.zoneHeightPercent;

      for (const spawn of positions) {
        // X should be within arena width (with some margin)
        expect(spawn.position.x).toBeGreaterThan(0);
        expect(spawn.position.x).toBeLessThan(testBounds.width);

        // Y should be within enemy zone (top portion of arena)
        expect(spawn.position.y).toBeGreaterThan(0);
        expect(spawn.position.y).toBeLessThan(zoneHeight);
      }
    });

    it('groups units by formation role', () => {
      // Large composition to ensure clear grouping
      const composition: UnitType[] = [
        'warrior',
        'warrior',
        'warrior',
        'archer',
        'archer',
        'archer',
        'knight',
        'knight',
      ];

      const positions = calculateDeterministicEnemyPositions(composition, registry, testBounds, 1);

      // Group positions by type
      const warriors = positions.filter((p) => p.type === 'warrior');
      const archers = positions.filter((p) => p.type === 'archer');
      const knights = positions.filter((p) => p.type === 'knight');

      expect(warriors).toHaveLength(3);
      expect(archers).toHaveLength(3);
      expect(knights).toHaveLength(2);

      // Front units (warriors) should generally have lower Y (closer to enemy = top)
      // Back units (archers) should have higher Y
      const avgWarriorY = warriors.reduce((sum, p) => sum + p.position.y, 0) / warriors.length;
      const avgArcherY = archers.reduce((sum, p) => sum + p.position.y, 0) / archers.length;

      // Warriors (front) should be positioned before archers (back) in Y
      expect(avgWarriorY).toBeLessThan(avgArcherY);
    });
  });

  describe('DEFAULT_ENEMY_PATTERNS', () => {
    it('has 5 distinct patterns', () => {
      expect(DEFAULT_ENEMY_PATTERNS).toHaveLength(5);

      const ids = DEFAULT_ENEMY_PATTERNS.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });

    it('each pattern has valid role configurations', () => {
      const roles: FormationRole[] = ['front', 'back', 'flank'];

      for (const pattern of DEFAULT_ENEMY_PATTERNS) {
        for (const role of roles) {
          const config = pattern[role];
          expect(config.yPosition).toBeGreaterThanOrEqual(0);
          expect(config.yPosition).toBeLessThanOrEqual(1);
          expect(config.widthFraction).toBeGreaterThan(0);
          expect(config.widthFraction).toBeLessThanOrEqual(1);
          expect(['line', 'wedge', 'scattered', 'wide', 'left', 'right']).toContain(config.spread);
        }
      }
    });
  });
});

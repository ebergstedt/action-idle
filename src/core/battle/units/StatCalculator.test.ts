import { describe, it, expect } from 'vitest';
import {
  computeStat,
  computeAllStats,
  cloneBaseStats,
  calculateDamageAfterArmor,
} from './StatCalculator';
import { createActiveModifier } from '../modifiers/ModifierCalculator';
import { Modifier } from '../modifiers/types';
import { BaseStats } from './types';

describe('StatCalculator', () => {
  const baseStats: BaseStats = {
    maxHealth: 100,
    moveSpeed: 80,
    armor: 0,
    melee: { damage: 15, attackSpeed: 1.0, range: 35 },
    ranged: null,
  };

  describe('computeStat', () => {
    it('returns base value when no modifiers', () => {
      const result = computeStat(baseStats, 'maxHealth', []);
      expect(result).toBe(100);
    });

    it('applies modifiers to top-level stats', () => {
      const modifier: Modifier = {
        id: 'health_flat',
        target: 'maxHealth',
        type: 'flat',
        value: 50,
      };
      const active = createActiveModifier(modifier, 'upgrade', 'u1');

      const result = computeStat(baseStats, 'maxHealth', [active]);
      expect(result).toBe(150);
    });

    it('applies modifiers to nested attack stats', () => {
      const modifier: Modifier = {
        id: 'damage_percent',
        target: 'melee.damage',
        type: 'percent',
        value: 0.2,
      };
      const active = createActiveModifier(modifier, 'upgrade', 'u1');

      const result = computeStat(baseStats, 'melee.damage', [active]);
      expect(result).toBe(18); // 15 * 1.2
    });

    it('returns 0 for non-existent attack mode stats', () => {
      const result = computeStat(baseStats, 'ranged.damage', []);
      expect(result).toBe(0); // ranged is null
    });
  });

  describe('computeAllStats', () => {
    it('computes all stats without modifiers', () => {
      const computed = computeAllStats(baseStats, []);

      expect(computed.maxHealth).toBe(100);
      expect(computed.moveSpeed).toBe(80);
      expect(computed.armor).toBe(0);
      expect(computed.melee?.damage).toBe(15);
      expect(computed.melee?.attackSpeed).toBe(1.0);
      expect(computed.melee?.range).toBe(35);
      expect(computed.ranged).toBeNull();
    });

    it('applies multiple modifiers to different stats', () => {
      const healthMod: Modifier = { id: 'h', target: 'maxHealth', type: 'flat', value: 25 };
      const speedMod: Modifier = { id: 's', target: 'moveSpeed', type: 'percent', value: 0.1 };
      const damageMod: Modifier = { id: 'd', target: 'melee.damage', type: 'flat', value: 5 };

      const modifiers = [
        createActiveModifier(healthMod, 'upgrade', 'u1'),
        createActiveModifier(speedMod, 'upgrade', 'u2'),
        createActiveModifier(damageMod, 'upgrade', 'u3'),
      ];

      const computed = computeAllStats(baseStats, modifiers);

      expect(computed.maxHealth).toBe(125);
      expect(computed.moveSpeed).toBe(88); // 80 * 1.1
      expect(computed.melee?.damage).toBe(20);
    });

    it('preserves null attack modes', () => {
      const computed = computeAllStats(baseStats, []);
      expect(computed.ranged).toBeNull();
    });

    it('computes stats for both attack modes when present', () => {
      const dualStats: BaseStats = {
        ...baseStats,
        ranged: { damage: 25, attackSpeed: 0.8, range: 200 },
      };

      const meleeDamageMod: Modifier = {
        id: 'md',
        target: 'melee.damage',
        type: 'flat',
        value: 10,
      };
      const rangedDamageMod: Modifier = {
        id: 'rd',
        target: 'ranged.damage',
        type: 'flat',
        value: 5,
      };

      const modifiers = [
        createActiveModifier(meleeDamageMod, 'upgrade', 'u1'),
        createActiveModifier(rangedDamageMod, 'upgrade', 'u2'),
      ];

      const computed = computeAllStats(dualStats, modifiers);

      expect(computed.melee?.damage).toBe(25); // 15 + 10
      expect(computed.ranged?.damage).toBe(30); // 25 + 5
    });
  });

  describe('cloneBaseStats', () => {
    it('creates a deep copy of base stats', () => {
      const cloned = cloneBaseStats(baseStats);

      expect(cloned).toEqual(baseStats);
      expect(cloned).not.toBe(baseStats);
      expect(cloned.melee).not.toBe(baseStats.melee);
    });

    it('preserves null values', () => {
      const cloned = cloneBaseStats(baseStats);
      expect(cloned.ranged).toBeNull();
    });
  });

  describe('calculateDamageAfterArmor', () => {
    it('reduces damage by armor amount', () => {
      const result = calculateDamageAfterArmor(20, 5);
      expect(result).toBe(15);
    });

    it('returns minimum of 1 damage', () => {
      const result = calculateDamageAfterArmor(5, 10);
      expect(result).toBe(1);
    });

    it('returns full damage when armor is 0', () => {
      const result = calculateDamageAfterArmor(25, 0);
      expect(result).toBe(25);
    });
  });
});

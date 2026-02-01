import { describe, it, expect } from 'vitest';
import {
  calculateCost,
  calculateProduction,
  calculateTotalProduction,
  calculateCurrencyGain,
  canAffordUpgrade,
} from './Formulas';
import { Decimal } from '../utils/BigNumber';
import { GameState } from '../types/GameState';
import { UpgradeDefinition } from '../types/Upgrade';

describe('Formulas', () => {
  describe('calculateCost', () => {
    it('returns base cost at level 0', () => {
      const cost = calculateCost(100, 1.15, 0);
      expect(cost.eq(100)).toBe(true);
    });

    it('applies cost multiplier at level 1', () => {
      const cost = calculateCost(100, 1.15, 1);
      expect(cost.toNumber()).toBeCloseTo(115, 1);
    });

    it('applies exponential scaling at higher levels', () => {
      const cost = calculateCost(100, 1.15, 10);
      // 100 * 1.15^10 ≈ 404.56
      expect(cost.toNumber()).toBeCloseTo(404.56, 0);
    });

    it('handles decimal base costs', () => {
      const cost = calculateCost(15.5, 1.15, 0);
      expect(cost.toNumber()).toBeCloseTo(15.5, 1);
    });
  });

  describe('calculateProduction', () => {
    it('returns 0 at level 0', () => {
      const production = calculateProduction(10, 0);
      expect(production.eq(0)).toBe(true);
    });

    it('returns base production at level 1', () => {
      const production = calculateProduction(10, 1);
      expect(production.eq(10)).toBe(true);
    });

    it('scales linearly with level', () => {
      const production = calculateProduction(10, 5);
      expect(production.eq(50)).toBe(true);
    });

    it('handles decimal base production', () => {
      const production = calculateProduction(0.1, 10);
      expect(production.toNumber()).toBeCloseTo(1, 5);
    });
  });

  describe('calculateTotalProduction', () => {
    const testUpgrades: UpgradeDefinition[] = [
      {
        id: 'a',
        name: 'A',
        description: '',
        baseCost: 10,
        costMultiplier: 1.15,
        baseProduction: 1,
      },
      {
        id: 'b',
        name: 'B',
        description: '',
        baseCost: 10,
        costMultiplier: 1.15,
        baseProduction: 5,
      },
    ];

    it('returns 0 when all upgrades are at level 0', () => {
      const state: GameState = {
        currency: new Decimal(0),
        totalEarned: new Decimal(0),
        upgrades: { a: { level: 0, unlocked: true }, b: { level: 0, unlocked: true } },
        lastTick: Date.now(),
      };
      const total = calculateTotalProduction(state, testUpgrades);
      expect(total.eq(0)).toBe(true);
    });

    it('sums production from all upgrades', () => {
      const state: GameState = {
        currency: new Decimal(0),
        totalEarned: new Decimal(0),
        upgrades: { a: { level: 2, unlocked: true }, b: { level: 3, unlocked: true } },
        lastTick: Date.now(),
      };
      // a: 1 * 2 = 2, b: 5 * 3 = 15, total = 17
      const total = calculateTotalProduction(state, testUpgrades);
      expect(total.eq(17)).toBe(true);
    });
  });

  describe('calculateCurrencyGain', () => {
    it('returns 0 when delta is 0', () => {
      const gain = calculateCurrencyGain(new Decimal(100), 0);
      expect(gain.eq(0)).toBe(true);
    });

    it('calculates gain over 1 second', () => {
      const gain = calculateCurrencyGain(new Decimal(10), 1);
      expect(gain.eq(10)).toBe(true);
    });

    it('calculates gain over fractional seconds', () => {
      const gain = calculateCurrencyGain(new Decimal(100), 0.5);
      expect(gain.eq(50)).toBe(true);
    });
  });

  describe('canAffordUpgrade', () => {
    it('returns true when currency equals cost', () => {
      expect(canAffordUpgrade(new Decimal(100), new Decimal(100))).toBe(true);
    });

    it('returns true when currency exceeds cost', () => {
      expect(canAffordUpgrade(new Decimal(150), new Decimal(100))).toBe(true);
    });

    it('returns false when currency is less than cost', () => {
      expect(canAffordUpgrade(new Decimal(99), new Decimal(100))).toBe(false);
    });

    it('handles very large numbers', () => {
      expect(canAffordUpgrade(new Decimal('1e100'), new Decimal('1e99'))).toBe(true);
    });
  });
});

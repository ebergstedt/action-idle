import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../../../src/core/engine/GameEngine';
import { Decimal } from '../../../src/core/utils/BigNumber';
import { UpgradeDefinition } from '../../../src/core/types/Upgrade';

const testUpgrades: UpgradeDefinition[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'Auto-clicks',
    baseCost: 15,
    costMultiplier: 1.15,
    baseProduction: 0.1,
  },
  {
    id: 'worker',
    name: 'Worker',
    description: 'Produces currency',
    baseCost: 100,
    costMultiplier: 1.15,
    baseProduction: 1,
  },
];

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(testUpgrades);
  });

  describe('initialization', () => {
    it('creates initial state with zero currency', () => {
      const state = engine.getState();
      expect(state.currency.eq(0)).toBe(true);
    });

    it('initializes all upgrades at level 0', () => {
      const state = engine.getState();
      expect(state.upgrades['cursor'].level).toBe(0);
      expect(state.upgrades['worker'].level).toBe(0);
    });

    it('marks all upgrades as unlocked', () => {
      const state = engine.getState();
      expect(state.upgrades['cursor'].unlocked).toBe(true);
      expect(state.upgrades['worker'].unlocked).toBe(true);
    });
  });

  describe('tick', () => {
    it('does not add currency when production is 0', () => {
      engine.tick(1);
      expect(engine.getState().currency.eq(0)).toBe(true);
    });

    it('adds currency based on production and delta', () => {
      // Give currency and buy a worker
      engine.addCurrency(new Decimal(100));
      engine.purchaseUpgrade('worker');

      const currencyBefore = engine.getState().currency;
      engine.tick(1);
      const currencyAfter = engine.getState().currency;

      // Worker produces 1/s, so after 1s we should have 1 more
      expect(currencyAfter.sub(currencyBefore).eq(1)).toBe(true);
    });

    it('handles fractional delta correctly', () => {
      engine.addCurrency(new Decimal(100));
      engine.purchaseUpgrade('worker');

      const currencyBefore = engine.getState().currency;
      engine.tick(0.5);
      const currencyAfter = engine.getState().currency;

      expect(currencyAfter.sub(currencyBefore).eq(0.5)).toBe(true);
    });

    it('updates totalEarned', () => {
      engine.addCurrency(new Decimal(100));
      engine.purchaseUpgrade('worker');

      const totalBefore = engine.getState().totalEarned;
      engine.tick(1);
      const totalAfter = engine.getState().totalEarned;

      expect(totalAfter.sub(totalBefore).eq(1)).toBe(true);
    });
  });

  describe('purchaseUpgrade', () => {
    it('returns false when cannot afford', () => {
      const result = engine.purchaseUpgrade('cursor');
      expect(result).toBe(false);
    });

    it('returns true and deducts cost when can afford', () => {
      engine.addCurrency(new Decimal(15));
      const result = engine.purchaseUpgrade('cursor');

      expect(result).toBe(true);
      expect(engine.getState().currency.eq(0)).toBe(true);
      expect(engine.getState().upgrades['cursor'].level).toBe(1);
    });

    it('increases upgrade level', () => {
      engine.addCurrency(new Decimal(1000));

      engine.purchaseUpgrade('cursor');
      expect(engine.getState().upgrades['cursor'].level).toBe(1);

      engine.purchaseUpgrade('cursor');
      expect(engine.getState().upgrades['cursor'].level).toBe(2);
    });

    it('returns false for unknown upgrade', () => {
      engine.addCurrency(new Decimal(1000));
      const result = engine.purchaseUpgrade('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getUpgradeCost', () => {
    it('returns base cost at level 0', () => {
      const cost = engine.getUpgradeCost('cursor');
      expect(cost.eq(15)).toBe(true);
    });

    it('returns scaled cost at higher levels', () => {
      engine.addCurrency(new Decimal(1000));
      engine.purchaseUpgrade('cursor');

      const cost = engine.getUpgradeCost('cursor');
      expect(cost.toNumber()).toBeCloseTo(17.25, 1);
    });

    it('returns Infinity for unknown upgrade', () => {
      const cost = engine.getUpgradeCost('nonexistent');
      expect(cost.eq(Infinity)).toBe(true);
    });
  });

  describe('getProductionPerSecond', () => {
    it('returns 0 with no upgrades purchased', () => {
      expect(engine.getProductionPerSecond().eq(0)).toBe(true);
    });

    it('sums production from all purchased upgrades', () => {
      engine.addCurrency(new Decimal(1000));
      engine.purchaseUpgrade('cursor'); // 0.1/s
      engine.purchaseUpgrade('worker'); // 1/s

      expect(engine.getProductionPerSecond().toNumber()).toBeCloseTo(1.1, 5);
    });
  });

  describe('addCurrency', () => {
    it('adds to current currency', () => {
      engine.addCurrency(new Decimal(50));
      expect(engine.getState().currency.eq(50)).toBe(true);
    });

    it('adds to totalEarned', () => {
      engine.addCurrency(new Decimal(50));
      expect(engine.getState().totalEarned.eq(50)).toBe(true);
    });

    it('accumulates multiple additions', () => {
      engine.addCurrency(new Decimal(50));
      engine.addCurrency(new Decimal(25));
      expect(engine.getState().currency.eq(75)).toBe(true);
    });
  });

  describe('setState', () => {
    it('replaces current state', () => {
      const newState = {
        currency: new Decimal(999),
        totalEarned: new Decimal(999),
        upgrades: {
          cursor: { level: 10, unlocked: true },
          worker: { level: 5, unlocked: true },
        },
        lastTick: Date.now(),
      };

      engine.setState(newState);

      expect(engine.getState().currency.eq(999)).toBe(true);
      expect(engine.getState().upgrades['cursor'].level).toBe(10);
    });
  });
});

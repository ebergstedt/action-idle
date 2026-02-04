/**
 * Assembly Manager Tests
 *
 * Tests for pure functions in AssemblyManager.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BattleUpgradeRegistry } from '../../../src/core/battle/upgrades/BattleUpgradeRegistry';
import {
  createInitialState,
  canAfford,
  addGold,
  subtractGold,
  updateHighestWave,
  selectUnitType,
  purchaseUpgrade,
  serializeState,
  deserializeState,
  isValidSerializedState,
} from '../../../src/core/assembly';

describe('AssemblyManager', () => {
  let registry: BattleUpgradeRegistry;

  beforeEach(() => {
    registry = new BattleUpgradeRegistry();
    // Register test upgrades
    registry.register({
      id: 'test_upgrade_1',
      name: 'Test Upgrade 1',
      description: 'Test upgrade',
      scope: 'global',
      upgradeType: 'stat_modifier',
      modifiers: [],
      baseCost: 100,
      costMultiplier: 1.5,
      maxLevel: 5,
      prerequisites: [],
    });
    registry.register({
      id: 'test_upgrade_2',
      name: 'Test Upgrade 2',
      description: 'Test upgrade with prerequisite',
      scope: 'unit_type',
      targetId: 'hound',
      upgradeType: 'stat_modifier',
      modifiers: [],
      baseCost: 50,
      costMultiplier: 1.2,
      maxLevel: 10,
      prerequisites: [{ type: 'upgrade', targetId: 'test_upgrade_1', level: 2 }],
    });
  });

  describe('createInitialState', () => {
    it('should create state with zero gold', () => {
      const state = createInitialState(registry);
      expect(state.gold).toBe(0);
    });

    it('should create state with all upgrades at level 0', () => {
      const state = createInitialState(registry);
      expect(state.upgradeStates['test_upgrade_1'].level).toBe(0);
      expect(state.upgradeStates['test_upgrade_2'].level).toBe(0);
    });

    it('should create state with null selectedUnitType', () => {
      const state = createInitialState(registry);
      expect(state.selectedUnitType).toBeNull();
    });

    it('should create state with highestWave of 1', () => {
      const state = createInitialState(registry);
      expect(state.highestWave).toBe(1);
    });
  });

  describe('canAfford', () => {
    it('should return true when gold >= cost', () => {
      const state = createInitialState(registry);
      state.gold = 100;
      expect(canAfford(state, 100)).toBe(true);
      expect(canAfford(state, 50)).toBe(true);
    });

    it('should return false when gold < cost', () => {
      const state = createInitialState(registry);
      state.gold = 50;
      expect(canAfford(state, 100)).toBe(false);
    });
  });

  describe('addGold', () => {
    it('should add gold to state', () => {
      const state = createInitialState(registry);
      const newState = addGold(state, 100);
      expect(newState.gold).toBe(100);
    });

    it('should not modify original state', () => {
      const state = createInitialState(registry);
      addGold(state, 100);
      expect(state.gold).toBe(0);
    });

    it('should return same state for zero or negative amount', () => {
      const state = createInitialState(registry);
      state.gold = 50;
      expect(addGold(state, 0)).toBe(state);
      expect(addGold(state, -10)).toBe(state);
    });
  });

  describe('subtractGold', () => {
    it('should subtract gold from state', () => {
      const state = createInitialState(registry);
      state.gold = 100;
      const newState = subtractGold(state, 30);
      expect(newState.gold).toBe(70);
    });

    it('should not go below zero', () => {
      const state = createInitialState(registry);
      state.gold = 50;
      const newState = subtractGold(state, 100);
      expect(newState.gold).toBe(0);
    });

    it('should return same state for zero or negative amount', () => {
      const state = createInitialState(registry);
      state.gold = 50;
      expect(subtractGold(state, 0)).toBe(state);
      expect(subtractGold(state, -10)).toBe(state);
    });
  });

  describe('updateHighestWave', () => {
    it('should update highest wave when new wave is higher', () => {
      const state = createInitialState(registry);
      const newState = updateHighestWave(state, 5);
      expect(newState.highestWave).toBe(5);
    });

    it('should not update when new wave is lower or equal', () => {
      const state = createInitialState(registry);
      state.highestWave = 5;
      expect(updateHighestWave(state, 3)).toBe(state);
      expect(updateHighestWave(state, 5)).toBe(state);
    });
  });

  describe('selectUnitType', () => {
    it('should set selected unit type', () => {
      const state = createInitialState(registry);
      const newState = selectUnitType(state, 'hound');
      expect(newState.selectedUnitType).toBe('hound');
    });

    it('should allow setting to null', () => {
      const state = createInitialState(registry);
      state.selectedUnitType = 'hound';
      const newState = selectUnitType(state, null);
      expect(newState.selectedUnitType).toBeNull();
    });

    it('should return same state if already selected', () => {
      const state = createInitialState(registry);
      state.selectedUnitType = 'hound';
      expect(selectUnitType(state, 'hound')).toBe(state);
    });
  });

  describe('purchaseUpgrade', () => {
    it('should purchase upgrade when affordable', () => {
      const state = createInitialState(registry);
      state.gold = 200;
      const newState = purchaseUpgrade(state, registry, 'test_upgrade_1');
      expect(newState.upgradeStates['test_upgrade_1'].level).toBe(1);
      expect(newState.gold).toBe(100); // 200 - 100 baseCost
    });

    it('should not purchase when insufficient gold', () => {
      const state = createInitialState(registry);
      state.gold = 50;
      const newState = purchaseUpgrade(state, registry, 'test_upgrade_1');
      expect(newState).toBe(state);
    });

    it('should not purchase when prerequisite not met', () => {
      const state = createInitialState(registry);
      state.gold = 500;
      // test_upgrade_2 requires test_upgrade_1 at level 2
      const newState = purchaseUpgrade(state, registry, 'test_upgrade_2');
      expect(newState).toBe(state);
    });

    it('should purchase after prerequisite is met', () => {
      let state = createInitialState(registry);
      state.gold = 1000;

      // Purchase test_upgrade_1 twice to reach level 2
      state = purchaseUpgrade(state, registry, 'test_upgrade_1');
      state = purchaseUpgrade(state, registry, 'test_upgrade_1');
      expect(state.upgradeStates['test_upgrade_1'].level).toBe(2);

      // Now test_upgrade_2 should be purchasable
      const newState = purchaseUpgrade(state, registry, 'test_upgrade_2');
      expect(newState.upgradeStates['test_upgrade_2'].level).toBe(1);
    });
  });

  describe('serialization', () => {
    it('should serialize state correctly', () => {
      const state = createInitialState(registry);
      state.gold = 500;
      state.highestWave = 10;
      state.selectedUnitType = 'hound'; // Should not be serialized

      const serialized = serializeState(state);

      expect(serialized.gold).toBe(500);
      expect(serialized.highestWave).toBe(10);
      expect(serialized.version).toBe(1);
      expect((serialized as Record<string, unknown>).selectedUnitType).toBeUndefined();
    });

    it('should deserialize state correctly', () => {
      const serialized = {
        gold: 500,
        upgradeStates: {
          test_upgrade_1: { upgradeId: 'test_upgrade_1', level: 3, totalSpent: 250 },
        },
        highestWave: 10,
        version: 1,
      };

      const state = deserializeState(serialized, registry);

      expect(state.gold).toBe(500);
      expect(state.highestWave).toBe(10);
      expect(state.selectedUnitType).toBeNull(); // Default
      expect(state.upgradeStates['test_upgrade_1'].level).toBe(3);
      // New upgrade added to registry should have initial state
      expect(state.upgradeStates['test_upgrade_2'].level).toBe(0);
    });

    it('should validate serialized state correctly', () => {
      expect(
        isValidSerializedState({
          gold: 100,
          upgradeStates: {},
          highestWave: 5,
          version: 1,
        })
      ).toBe(true);

      expect(isValidSerializedState(null)).toBe(false);
      expect(isValidSerializedState({})).toBe(false);
      expect(isValidSerializedState({ gold: 'not a number' })).toBe(false);
    });
  });
});

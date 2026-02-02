/**
 * ModifierManager Tests
 *
 * Tests for the centralized modifier management system.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ModifierManager } from '../../../../src/core/battle/modifiers/ModifierManager';
import { TemporaryModifier } from '../../../../src/core/battle/modifiers/TemporaryModifier';

describe('ModifierManager', () => {
  let manager: ModifierManager;

  beforeEach(() => {
    manager = new ModifierManager('player');
  });

  describe('applyModifier', () => {
    it('should add a modifier to active modifiers', () => {
      const modifier: TemporaryModifier = {
        id: 'mod_1',
        sourceId: 'test_source',
        sourceTeam: 'enemy',
        moveSpeedMod: -0.5,
        damageMod: 0,
        collisionSizeMod: 0,
        remainingDuration: 1.0,
      };

      manager.applyModifier(modifier);

      expect(manager.getActiveModifiers()).toHaveLength(1);
      expect(manager.getActiveModifiers()[0]).toBe(modifier);
    });

    it('should refresh duration for modifier from same source instead of stacking', () => {
      const modifier1: TemporaryModifier = {
        id: 'mod_1',
        sourceId: 'test_source',
        sourceTeam: 'enemy',
        moveSpeedMod: -0.5,
        damageMod: 0,
        collisionSizeMod: 0,
        remainingDuration: 1.0,
      };

      const modifier2: TemporaryModifier = {
        id: 'mod_2',
        sourceId: 'test_source', // Same source
        sourceTeam: 'enemy',
        moveSpeedMod: -0.5,
        damageMod: 0,
        collisionSizeMod: 0,
        remainingDuration: 2.0,
      };

      manager.applyModifier(modifier1);
      manager.applyModifier(modifier2);

      expect(manager.getActiveModifiers()).toHaveLength(1);
      expect(manager.getActiveModifiers()[0].remainingDuration).toBe(2.0);
    });
  });

  describe('queueModifier', () => {
    it('should add a modifier to pending queue', () => {
      const modifier: TemporaryModifier = {
        id: 'mod_1',
        sourceId: 'test_source',
        sourceTeam: 'enemy',
        moveSpeedMod: -0.5,
        damageMod: 0,
        collisionSizeMod: 0,
        remainingDuration: 1.0,
      };

      manager.queueModifier(modifier, 0.5);

      expect(manager.getPendingModifiers()).toHaveLength(1);
      expect(manager.getPendingModifiers()[0].delay).toBe(0.5);
      expect(manager.getActiveModifiers()).toHaveLength(0);
    });
  });

  describe('tick', () => {
    it('should decrement active modifier durations', () => {
      const modifier: TemporaryModifier = {
        id: 'mod_1',
        sourceId: 'test_source',
        sourceTeam: 'enemy',
        moveSpeedMod: -0.5,
        damageMod: 0,
        collisionSizeMod: 0,
        remainingDuration: 1.0,
      };

      manager.applyModifier(modifier);
      manager.tick(0.3);

      expect(manager.getActiveModifiers()[0].remainingDuration).toBeCloseTo(0.7);
    });

    it('should remove expired active modifiers', () => {
      const modifier: TemporaryModifier = {
        id: 'mod_1',
        sourceId: 'test_source',
        sourceTeam: 'enemy',
        moveSpeedMod: -0.5,
        damageMod: 0,
        collisionSizeMod: 0,
        remainingDuration: 0.5,
      };

      manager.applyModifier(modifier);
      manager.tick(0.6);

      expect(manager.getActiveModifiers()).toHaveLength(0);
    });

    it('should apply pending modifiers after delay expires', () => {
      const modifier: TemporaryModifier = {
        id: 'mod_1',
        sourceId: 'test_source',
        sourceTeam: 'enemy',
        moveSpeedMod: -0.5,
        damageMod: 0,
        collisionSizeMod: 0,
        remainingDuration: 1.0,
      };

      manager.queueModifier(modifier, 0.2);
      expect(manager.getPendingModifiers()).toHaveLength(1);
      expect(manager.getActiveModifiers()).toHaveLength(0);

      manager.tick(0.3);

      expect(manager.getPendingModifiers()).toHaveLength(0);
      expect(manager.getActiveModifiers()).toHaveLength(1);
    });
  });

  describe('getMoveSpeedMultiplier', () => {
    it('should return 1 with no modifiers', () => {
      expect(manager.getMoveSpeedMultiplier()).toBe(1);
    });

    it('should calculate multiplicative speed reduction', () => {
      const modifier: TemporaryModifier = {
        id: 'mod_1',
        sourceId: 'test_source',
        sourceTeam: 'enemy',
        moveSpeedMod: -0.5,
        damageMod: 0,
        collisionSizeMod: 0,
        remainingDuration: 1.0,
      };

      manager.applyModifier(modifier);

      expect(manager.getMoveSpeedMultiplier()).toBe(0.5);
    });

    it('should stack multiple modifiers multiplicatively', () => {
      manager.applyModifier({
        id: 'mod_1',
        sourceId: 'source_1',
        sourceTeam: 'enemy',
        moveSpeedMod: -0.5,
        damageMod: 0,
        collisionSizeMod: 0,
        remainingDuration: 1.0,
      });
      manager.applyModifier({
        id: 'mod_2',
        sourceId: 'source_2',
        sourceTeam: 'enemy',
        moveSpeedMod: -0.5,
        damageMod: 0,
        collisionSizeMod: 0,
        remainingDuration: 1.0,
      });

      // 0.5 * 0.5 = 0.25
      expect(manager.getMoveSpeedMultiplier()).toBe(0.25);
    });
  });

  describe('getCollisionSizeMultiplier', () => {
    it('should return 1 with no modifiers', () => {
      expect(manager.getCollisionSizeMultiplier()).toBe(1);
    });

    it('should calculate collision size increase', () => {
      manager.applyModifier({
        id: 'mod_1',
        sourceId: 'melee_engagement',
        sourceTeam: 'enemy',
        moveSpeedMod: -0.5,
        damageMod: 0,
        collisionSizeMod: 0.3,
        remainingDuration: 1.0,
      });

      expect(manager.getCollisionSizeMultiplier()).toBe(1.3);
    });
  });

  describe('removeModifiersLinkedToUnit', () => {
    it('should remove active modifiers linked to the specified unit', () => {
      manager.applyModifier({
        id: 'mod_1',
        sourceId: 'melee_engagement',
        sourceTeam: 'enemy',
        moveSpeedMod: -0.5,
        damageMod: 0,
        collisionSizeMod: 0,
        remainingDuration: 1.0,
        linkedUnitId: 'enemy_1',
      });
      manager.applyModifier({
        id: 'mod_2',
        sourceId: 'other_source',
        sourceTeam: 'enemy',
        moveSpeedMod: -0.3,
        damageMod: 0,
        collisionSizeMod: 0,
        remainingDuration: 1.0,
      });

      const removed = manager.removeModifiersLinkedToUnit('enemy_1');

      expect(removed).toBe(true);
      expect(manager.getActiveModifiers()).toHaveLength(1);
      expect(manager.getActiveModifiers()[0].sourceId).toBe('other_source');
    });

    it('should remove pending modifiers linked to the specified unit', () => {
      manager.queueModifier(
        {
          id: 'mod_1',
          sourceId: 'melee_engagement',
          sourceTeam: 'enemy',
          moveSpeedMod: -0.5,
          damageMod: 0,
          remainingDuration: 1.0,
          linkedUnitId: 'enemy_1',
        },
        0.2
      );

      const removed = manager.removeModifiersLinkedToUnit('enemy_1');

      expect(removed).toBe(true);
      expect(manager.getPendingModifiers()).toHaveLength(0);
    });

    it('should return false if no modifiers were linked', () => {
      manager.applyModifier({
        id: 'mod_1',
        sourceId: 'other_source',
        sourceTeam: 'enemy',
        moveSpeedMod: -0.5,
        damageMod: 0,
        collisionSizeMod: 0,
        remainingDuration: 1.0,
      });

      const removed = manager.removeModifiersLinkedToUnit('enemy_1');

      expect(removed).toBe(false);
      expect(manager.getActiveModifiers()).toHaveLength(1);
    });
  });

  describe('clearEnemyDebuffs', () => {
    it('should remove modifiers from enemy team', () => {
      manager.applyModifier({
        id: 'mod_1',
        sourceId: 'enemy_debuff',
        sourceTeam: 'enemy',
        moveSpeedMod: -0.5,
        damageMod: 0,
        collisionSizeMod: 0,
        remainingDuration: 1.0,
      });
      manager.applyModifier({
        id: 'mod_2',
        sourceId: 'friendly_buff',
        sourceTeam: 'player', // Same as owner
        moveSpeedMod: 0.2,
        damageMod: 0,
        collisionSizeMod: 0,
        remainingDuration: 1.0,
      });

      manager.clearEnemyDebuffs();

      expect(manager.getActiveModifiers()).toHaveLength(1);
      expect(manager.getActiveModifiers()[0].sourceId).toBe('friendly_buff');
    });
  });

  describe('toRenderData', () => {
    it('should return simplified modifier data for rendering', () => {
      manager.applyModifier({
        id: 'mod_1',
        sourceId: 'test_source',
        sourceTeam: 'enemy',
        moveSpeedMod: -0.5,
        damageMod: -0.3,
        collisionSizeMod: 0,
        remainingDuration: 1.5,
        linkedUnitId: 'some_unit',
      });

      const renderData = manager.toRenderData();

      expect(renderData).toHaveLength(1);
      expect(renderData[0]).toEqual({
        id: 'mod_1',
        sourceId: 'test_source',
        remainingDuration: 1.5,
      });
      // Should not include internal fields
      expect(renderData[0]).not.toHaveProperty('linkedUnitId');
      expect(renderData[0]).not.toHaveProperty('moveSpeedMod');
    });
  });
});

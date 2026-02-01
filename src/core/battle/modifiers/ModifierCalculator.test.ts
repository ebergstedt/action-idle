import { describe, it, expect } from 'vitest';
import {
  calculateModifiedStat,
  groupModifiersByTarget,
  resolveStackingGroups,
  tickModifiers,
  createActiveModifier,
  addOrStackModifier,
  removeModifiersBySource,
} from './ModifierCalculator';
import { ActiveModifier, Modifier } from './types';

describe('ModifierCalculator', () => {
  describe('calculateModifiedStat', () => {
    it('returns base value when no modifiers', () => {
      const result = calculateModifiedStat(100, []);
      expect(result.final).toBe(100);
      expect(result.flatBonus).toBe(0);
      expect(result.percentBonus).toBe(0);
      expect(result.multiplier).toBe(1);
    });

    it('applies flat modifiers', () => {
      const modifier: Modifier = {
        id: 'test_flat',
        target: 'maxHealth',
        type: 'flat',
        value: 50,
      };
      const active = createActiveModifier(modifier, 'upgrade', 'upgrade_1');

      const result = calculateModifiedStat(100, [active]);
      expect(result.final).toBe(150);
      expect(result.flatBonus).toBe(50);
    });

    it('applies percent modifiers', () => {
      const modifier: Modifier = {
        id: 'test_percent',
        target: 'maxHealth',
        type: 'percent',
        value: 0.5, // +50%
      };
      const active = createActiveModifier(modifier, 'upgrade', 'upgrade_1');

      const result = calculateModifiedStat(100, [active]);
      expect(result.final).toBe(150);
      expect(result.percentBonus).toBe(0.5);
    });

    it('applies multiply modifiers', () => {
      const modifier: Modifier = {
        id: 'test_multiply',
        target: 'maxHealth',
        type: 'multiply',
        value: 2, // x2
      };
      const active = createActiveModifier(modifier, 'buff', 'buff_1');

      const result = calculateModifiedStat(100, [active]);
      expect(result.final).toBe(200);
      expect(result.multiplier).toBe(2);
    });

    it('applies formula: (Base + Flat) * (1 + Percent) * Multiply', () => {
      const flat: Modifier = { id: 'flat', target: 'maxHealth', type: 'flat', value: 50 };
      const percent: Modifier = { id: 'percent', target: 'maxHealth', type: 'percent', value: 0.2 };
      const multiply: Modifier = {
        id: 'multiply',
        target: 'maxHealth',
        type: 'multiply',
        value: 1.5,
      };

      const modifiers: ActiveModifier[] = [
        createActiveModifier(flat, 'upgrade', 'u1'),
        createActiveModifier(percent, 'upgrade', 'u2'),
        createActiveModifier(multiply, 'buff', 'b1'),
      ];

      // (100 + 50) * (1 + 0.2) * 1.5 = 150 * 1.2 * 1.5 = 270
      const result = calculateModifiedStat(100, modifiers);
      expect(result.final).toBe(270);
    });

    it('respects stacks', () => {
      const modifier: Modifier = {
        id: 'stackable',
        target: 'maxHealth',
        type: 'flat',
        value: 10,
      };
      const active = createActiveModifier(modifier, 'ability', 'bloodlust', undefined, 5);

      // 10 * 5 stacks = 50 flat bonus
      const result = calculateModifiedStat(100, [active]);
      expect(result.final).toBe(150);
    });

    it('does not allow negative final values', () => {
      const modifier: Modifier = {
        id: 'debuff',
        target: 'maxHealth',
        type: 'flat',
        value: -200,
      };
      const active = createActiveModifier(modifier, 'debuff', 'curse');

      const result = calculateModifiedStat(100, [active]);
      expect(result.final).toBe(0);
    });
  });

  describe('resolveStackingGroups', () => {
    it('keeps all modifiers without stacking groups', () => {
      const mod1: Modifier = { id: 'm1', target: 'maxHealth', type: 'flat', value: 10 };
      const mod2: Modifier = { id: 'm2', target: 'maxHealth', type: 'flat', value: 20 };

      const active1 = createActiveModifier(mod1, 'upgrade', 'u1');
      const active2 = createActiveModifier(mod2, 'upgrade', 'u2');

      const resolved = resolveStackingGroups([active1, active2]);
      expect(resolved).toHaveLength(2);
    });

    it('keeps only highest value in same stacking group', () => {
      const mod1: Modifier = {
        id: 'm1',
        target: 'maxHealth',
        type: 'flat',
        value: 10,
        stackingGroup: 'armor_buff',
      };
      const mod2: Modifier = {
        id: 'm2',
        target: 'maxHealth',
        type: 'flat',
        value: 25,
        stackingGroup: 'armor_buff',
      };

      const active1 = createActiveModifier(mod1, 'buff', 'b1');
      const active2 = createActiveModifier(mod2, 'buff', 'b2');

      const resolved = resolveStackingGroups([active1, active2]);
      expect(resolved).toHaveLength(1);
      expect(resolved[0].modifier.value).toBe(25);
    });
  });

  describe('groupModifiersByTarget', () => {
    it('groups modifiers by target stat', () => {
      const mod1: Modifier = { id: 'm1', target: 'maxHealth', type: 'flat', value: 10 };
      const mod2: Modifier = { id: 'm2', target: 'moveSpeed', type: 'flat', value: 5 };
      const mod3: Modifier = { id: 'm3', target: 'maxHealth', type: 'percent', value: 0.1 };

      const modifiers = [
        createActiveModifier(mod1, 'upgrade', 'u1'),
        createActiveModifier(mod2, 'upgrade', 'u2'),
        createActiveModifier(mod3, 'upgrade', 'u3'),
      ];

      const grouped = groupModifiersByTarget(modifiers);

      expect(grouped['maxHealth']).toHaveLength(2);
      expect(grouped['moveSpeed']).toHaveLength(1);
    });
  });

  describe('tickModifiers', () => {
    it('decrements duration of temporary modifiers', () => {
      const modifier: Modifier = { id: 'm1', target: 'maxHealth', type: 'flat', value: 10 };
      const active = createActiveModifier(modifier, 'buff', 'b1', 5, 1); // 5 second duration

      const [remaining] = tickModifiers([active], 1);

      expect(remaining).toHaveLength(1);
      expect(remaining[0].duration).toBe(4);
    });

    it('removes expired modifiers', () => {
      const modifier: Modifier = { id: 'm1', target: 'maxHealth', type: 'flat', value: 10 };
      const active = createActiveModifier(modifier, 'buff', 'b1', 1, 1); // 1 second duration

      const [remaining, expired] = tickModifiers([active], 2);

      expect(remaining).toHaveLength(0);
      expect(expired).toHaveLength(1);
    });

    it('keeps permanent modifiers', () => {
      const modifier: Modifier = { id: 'm1', target: 'maxHealth', type: 'flat', value: 10 };
      const active = createActiveModifier(modifier, 'upgrade', 'u1'); // No duration = permanent

      const [remaining] = tickModifiers([active], 100);

      expect(remaining).toHaveLength(1);
      expect(remaining[0].duration).toBeUndefined();
    });
  });

  describe('addOrStackModifier', () => {
    it('adds new modifier when not present', () => {
      const modifier: Modifier = { id: 'm1', target: 'maxHealth', type: 'flat', value: 10 };
      const active = createActiveModifier(modifier, 'ability', 'a1', 3, 1);

      const result = addOrStackModifier([], active);

      expect(result).toHaveLength(1);
      expect(result[0].stacks).toBe(1);
    });

    it('stacks existing modifier with same id and source', () => {
      const modifier: Modifier = { id: 'm1', target: 'maxHealth', type: 'flat', value: 10 };
      const existing = createActiveModifier(modifier, 'ability', 'a1', 3, 2);
      const newMod = createActiveModifier(modifier, 'ability', 'a1', 3, 1);

      const result = addOrStackModifier([existing], newMod);

      expect(result).toHaveLength(1);
      expect(result[0].stacks).toBe(3);
    });

    it('respects max stacks', () => {
      const modifier: Modifier = { id: 'm1', target: 'maxHealth', type: 'flat', value: 10 };
      const existing = createActiveModifier(modifier, 'ability', 'a1', 3, 4);
      const newMod = createActiveModifier(modifier, 'ability', 'a1', 3, 2);

      const result = addOrStackModifier([existing], newMod, 5);

      expect(result[0].stacks).toBe(5); // Capped at 5
    });
  });

  describe('removeModifiersBySource', () => {
    it('removes all modifiers with matching source ID', () => {
      const mod1: Modifier = { id: 'm1', target: 'maxHealth', type: 'flat', value: 10 };
      const mod2: Modifier = { id: 'm2', target: 'moveSpeed', type: 'flat', value: 5 };

      const modifiers = [
        createActiveModifier(mod1, 'ability', 'bloodlust'),
        createActiveModifier(mod2, 'ability', 'bloodlust'),
        createActiveModifier(mod1, 'upgrade', 'warrior_health_1'),
      ];

      const result = removeModifiersBySource(modifiers, 'bloodlust');

      expect(result).toHaveLength(1);
      expect(result[0].sourceId).toBe('warrior_health_1');
    });
  });
});

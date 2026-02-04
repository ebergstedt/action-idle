import { describe, it, expect, beforeEach } from 'vitest';
import { UnitRegistry } from '../../../../src/core/battle/units/UnitRegistry';
import { UnitDefinition } from '../../../../src/core/battle/units/types';

describe('UnitRegistry', () => {
  let registry: UnitRegistry;

  const warriorDef: UnitDefinition = {
    id: 'warrior',
    name: 'Warrior',
    description: 'A melee fighter',
    category: 'infantry',
    tier: 1,
    baseStats: {
      maxHealth: 100,
      moveSpeed: 80,
      armor: 0,
      melee: { damage: 15, attackSpeed: 1.0, range: 35 },
      ranged: null,
    },
    visuals: { shape: 'square', baseSize: 20, colorKey: 'warrior' },
    innateAbilities: [],
    unlockRequirements: [],
  };

  const archerDef: UnitDefinition = {
    id: 'archer',
    name: 'Archer',
    description: 'A ranged attacker',
    category: 'ranged',
    tier: 1,
    baseStats: {
      maxHealth: 50,
      moveSpeed: 60,
      armor: 0,
      melee: { damage: 8, attackSpeed: 0.6, range: 35 },
      ranged: { damage: 25, attackSpeed: 0.8, range: 200 },
    },
    visuals: { shape: 'triangle', baseSize: 16, colorKey: 'archer' },
    innateAbilities: [],
    unlockRequirements: [],
  };

  const eliteWarriorDef: UnitDefinition = {
    id: 'elite_warrior',
    name: 'Elite Warrior',
    description: 'An advanced warrior',
    category: 'infantry',
    tier: 2,
    baseStats: {
      maxHealth: 150,
      moveSpeed: 90,
      armor: 5,
      melee: { damage: 25, attackSpeed: 1.2, range: 35 },
      ranged: null,
    },
    visuals: { shape: 'square', baseSize: 22, colorKey: 'warrior' },
    innateAbilities: ['battle_hardened'],
    unlockRequirements: [{ type: 'upgrade', targetId: 'warrior_elite_unlock' }],
  };

  beforeEach(() => {
    registry = new UnitRegistry();
  });

  describe('register', () => {
    it('registers a unit definition', () => {
      registry.register(warriorDef);

      expect(registry.has('warrior')).toBe(true);
      expect(registry.get('warrior')).toEqual(warriorDef);
    });
  });

  describe('registerAll', () => {
    it('registers multiple definitions at once', () => {
      registry.registerAll([warriorDef, archerDef, eliteWarriorDef]);

      expect(registry.getAll()).toHaveLength(3);
    });
  });

  describe('get', () => {
    it('returns the definition by ID', () => {
      registry.register(warriorDef);

      const result = registry.get('warrior');
      expect(result.id).toBe('warrior');
    });

    it('throws error for non-existent ID', () => {
      expect(() => registry.get('nonexistent')).toThrow('Unit definition not found: nonexistent');
    });
  });

  describe('tryGet', () => {
    it('returns the definition if found', () => {
      registry.register(warriorDef);

      expect(registry.tryGet('warrior')).toEqual(warriorDef);
    });

    it('returns undefined if not found', () => {
      expect(registry.tryGet('nonexistent')).toBeUndefined();
    });
  });

  describe('getUnlocked', () => {
    beforeEach(() => {
      registry.registerAll([warriorDef, archerDef, eliteWarriorDef]);
    });

    it('includes tier 1 units by default', () => {
      const unlocked = registry.getUnlocked(new Set());

      expect(unlocked).toHaveLength(2);
      expect(unlocked.map((u) => u.id)).toContain('warrior');
      expect(unlocked.map((u) => u.id)).toContain('archer');
    });

    it('includes explicitly unlocked higher tier units', () => {
      const unlocked = registry.getUnlocked(new Set(['elite_warrior']));

      expect(unlocked).toHaveLength(3);
      expect(unlocked.map((u) => u.id)).toContain('elite_warrior');
    });
  });

  describe('getAllIds', () => {
    it('returns all registered IDs', () => {
      registry.registerAll([warriorDef, archerDef]);

      const ids = registry.getAllIds();
      expect(ids).toContain('warrior');
      expect(ids).toContain('archer');
    });
  });

  describe('clear', () => {
    it('removes all definitions', () => {
      registry.registerAll([warriorDef, archerDef]);
      registry.clear();

      expect(registry.getAll()).toHaveLength(0);
      expect(registry.has('warrior')).toBe(false);
    });
  });
});

/**
 * BattleWorld Tests
 *
 * Tests for the entity manager that handles battle entities.
 * Covers entity lifecycle, world events, and queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BattleWorld } from '../../../../src/core/battle/entities/BattleWorld';
import { UnitEntity, UnitData } from '../../../../src/core/battle/entities/UnitEntity';
import { Vector2 } from '../../../../src/core/physics/Vector2';

// Helper to create a UnitEntity
function createUnit(id: string, position: Vector2, data: UnitData): UnitEntity {
  return new UnitEntity(id, position, data);
}

// Helper to create minimal unit data for testing
function createTestUnitData(overrides: Partial<UnitData> = {}): UnitData {
  return {
    type: 'warrior',
    team: 'player',
    health: 100,
    stats: {
      maxHealth: 100,
      moveSpeed: 50,
      melee: { damage: 10, attackSpeed: 1, range: 35 },
      ranged: null,
    },
    color: '#ff0000',
    shape: 'circle',
    size: 15,
    squadId: 'squad_1',
    target: null,
    attackCooldown: 0,
    shuffleDirection: null,
    shuffleTimer: 0,
    seekMode: false,
    retargetCooldown: 0,
    activeModifiers: [],
    pendingModifiers: [],
    visualOffset: new Vector2(0, 0),
    hitFlashTimer: 0,
    deathFadeTimer: -1,
    walkAnimationTime: 0,
    walkAnimation: 'bounce',
    ...overrides,
  };
}

describe('BattleWorld', () => {
  let world: BattleWorld;

  beforeEach(() => {
    world = new BattleWorld();
  });

  describe('Entity Management', () => {
    describe('addUnit()', () => {
      it('should add a unit to the world', () => {
        const unit = createUnit('unit_1', new Vector2(100, 100), createTestUnitData());
        world.addUnit(unit);

        expect(world.getUnits()).toHaveLength(1);
        expect(world.getUnits()[0]).toBe(unit);
      });

      it('should call init() on the unit', () => {
        const unit = createUnit('unit_1', new Vector2(100, 100), createTestUnitData());
        const initSpy = vi.spyOn(unit, 'init');

        world.addUnit(unit);

        expect(initSpy).toHaveBeenCalledTimes(1);
      });

      it('should emit entity_added world event', () => {
        const listener = vi.fn();
        world.onWorld('entity_added', listener);

        const unit = createUnit('unit_1', new Vector2(100, 100), createTestUnitData());
        world.addUnit(unit);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({
          type: 'entity_added',
          entity: unit,
        });
      });

      it('should set world reference on the unit', () => {
        const unit = createUnit('unit_1', new Vector2(100, 100), createTestUnitData());
        world.addUnit(unit);

        // The unit should have access to the world for queries
        // This is verified implicitly - if setWorld wasn't called, unit queries would fail
        expect(world.getUnitById('unit_1')).toBe(unit);
      });
    });

    describe('removeUnit()', () => {
      it('should remove a unit from the world', () => {
        const unit = createUnit('unit_1', new Vector2(100, 100), createTestUnitData());
        world.addUnit(unit);
        expect(world.getUnits()).toHaveLength(1);

        world.removeUnit(unit);
        expect(world.getUnits()).toHaveLength(0);
      });

      it('should call destroy() on the unit', () => {
        const unit = createUnit('unit_1', new Vector2(100, 100), createTestUnitData());
        world.addUnit(unit);
        const destroySpy = vi.spyOn(unit, 'destroy');

        world.removeUnit(unit);

        expect(destroySpy).toHaveBeenCalledTimes(1);
      });

      it('should emit entity_removed world event', () => {
        const unit = createUnit('unit_1', new Vector2(100, 100), createTestUnitData());
        world.addUnit(unit);

        const listener = vi.fn();
        world.onWorld('entity_removed', listener);

        world.removeUnit(unit);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({
          type: 'entity_removed',
          entity: unit,
        });
      });

      it('should handle removing a unit that is not in the world', () => {
        const unit = createUnit('unit_1', new Vector2(100, 100), createTestUnitData());
        // Don't add the unit to the world

        // Should not throw
        expect(() => world.removeUnit(unit)).not.toThrow();
      });
    });

    describe('clear()', () => {
      it('should remove all entities', () => {
        const unit1 = createUnit('unit_1', new Vector2(100, 100), createTestUnitData());
        const unit2 = createUnit(
          'unit_2',
          new Vector2(200, 200),
          createTestUnitData({ team: 'enemy' })
        );
        world.addUnit(unit1);
        world.addUnit(unit2);

        world.clear();

        expect(world.getUnits()).toHaveLength(0);
      });

      it('should call destroy() on all entities', () => {
        const unit1 = createUnit('unit_1', new Vector2(100, 100), createTestUnitData());
        const unit2 = createUnit('unit_2', new Vector2(200, 200), createTestUnitData());
        world.addUnit(unit1);
        world.addUnit(unit2);

        const destroy1 = vi.spyOn(unit1, 'destroy');
        const destroy2 = vi.spyOn(unit2, 'destroy');

        world.clear();

        expect(destroy1).toHaveBeenCalledTimes(1);
        expect(destroy2).toHaveBeenCalledTimes(1);
      });

      it('should emit entity_removed for each entity', () => {
        const unit1 = createUnit('unit_1', new Vector2(100, 100), createTestUnitData());
        const unit2 = createUnit('unit_2', new Vector2(200, 200), createTestUnitData());
        world.addUnit(unit1);
        world.addUnit(unit2);

        const listener = vi.fn();
        world.onWorld('entity_removed', listener);

        world.clear();

        expect(listener).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Unit Queries', () => {
    describe('getUnitById()', () => {
      it('should return a unit by its ID', () => {
        const unit = createUnit('unit_1', new Vector2(100, 100), createTestUnitData());
        world.addUnit(unit);

        expect(world.getUnitById('unit_1')).toBe(unit);
      });

      it('should return undefined for non-existent ID', () => {
        expect(world.getUnitById('non_existent')).toBeUndefined();
      });
    });

    describe('getUnitsByTeam()', () => {
      it('should return units filtered by team', () => {
        const player1 = createUnit(
          'player_1',
          new Vector2(100, 100),
          createTestUnitData({ team: 'player' })
        );
        const player2 = createUnit(
          'player_2',
          new Vector2(150, 100),
          createTestUnitData({ team: 'player' })
        );
        const enemy1 = createUnit(
          'enemy_1',
          new Vector2(100, 50),
          createTestUnitData({ team: 'enemy' })
        );
        world.addUnit(player1);
        world.addUnit(player2);
        world.addUnit(enemy1);

        const playerUnits = world.getUnitsByTeam('player');
        const enemyUnits = world.getUnitsByTeam('enemy');

        expect(playerUnits).toHaveLength(2);
        expect(enemyUnits).toHaveLength(1);
        expect(playerUnits).toContain(player1);
        expect(playerUnits).toContain(player2);
        expect(enemyUnits).toContain(enemy1);
      });

      it('should not include destroyed units', () => {
        const unit1 = createUnit('unit_1', new Vector2(100, 100), createTestUnitData());
        const unit2 = createUnit('unit_2', new Vector2(150, 100), createTestUnitData());
        world.addUnit(unit1);
        world.addUnit(unit2);

        // Deal lethal damage - this starts death fade, not immediate destroy
        unit1.takeDamage(1000);
        // Fast-forward death fade by updating with large delta
        // DEATH_FADE_DURATION is 0.4s, so 0.5s should complete it
        world.update(0.5);

        // After update, dead unit should be removed
        const units = world.getUnitsByTeam('player');
        expect(units).toHaveLength(1);
        expect(units[0]).toBe(unit2);
      });
    });

    describe('getEnemiesOf()', () => {
      it('should return units of the opposite team', () => {
        const player = createUnit(
          'player_1',
          new Vector2(100, 100),
          createTestUnitData({ team: 'player' })
        );
        const enemy = createUnit(
          'enemy_1',
          new Vector2(100, 50),
          createTestUnitData({ team: 'enemy' })
        );
        world.addUnit(player);
        world.addUnit(enemy);

        const enemies = world.getEnemiesOf(player);

        expect(enemies).toHaveLength(1);
        expect(enemies[0]).toBe(enemy);
      });
    });

    describe('getAlliesOf()', () => {
      it('should return units of the same team excluding self', () => {
        const player1 = createUnit(
          'player_1',
          new Vector2(100, 100),
          createTestUnitData({ team: 'player' })
        );
        const player2 = createUnit(
          'player_2',
          new Vector2(150, 100),
          createTestUnitData({ team: 'player' })
        );
        world.addUnit(player1);
        world.addUnit(player2);

        const allies = world.getAlliesOf(player1);

        expect(allies).toHaveLength(1);
        expect(allies[0]).toBe(player2);
        expect(allies).not.toContain(player1);
      });
    });

    describe('getUnitCount()', () => {
      it('should return total unit count when no team specified', () => {
        world.addUnit(
          createUnit('player_1', new Vector2(100, 100), createTestUnitData({ team: 'player' }))
        );
        world.addUnit(
          createUnit('enemy_1', new Vector2(100, 50), createTestUnitData({ team: 'enemy' }))
        );
        world.addUnit(
          createUnit('enemy_2', new Vector2(150, 50), createTestUnitData({ team: 'enemy' }))
        );

        expect(world.getUnitCount()).toBe(3);
      });

      it('should return unit count for a specific team', () => {
        world.addUnit(
          createUnit('player_1', new Vector2(100, 100), createTestUnitData({ team: 'player' }))
        );
        world.addUnit(
          createUnit('enemy_1', new Vector2(100, 50), createTestUnitData({ team: 'enemy' }))
        );
        world.addUnit(
          createUnit('enemy_2', new Vector2(150, 50), createTestUnitData({ team: 'enemy' }))
        );

        expect(world.getUnitCount('player')).toBe(1);
        expect(world.getUnitCount('enemy')).toBe(2);
      });
    });
  });

  describe('World Events', () => {
    describe('onWorld() / offWorld()', () => {
      it('should allow subscribing and unsubscribing to world events', () => {
        const listener = vi.fn();
        world.onWorld('entity_added', listener);

        const unit = createUnit('unit_1', new Vector2(100, 100), createTestUnitData());
        world.addUnit(unit);
        expect(listener).toHaveBeenCalledTimes(1);

        world.offWorld('entity_added', listener);

        const unit2 = createUnit('unit_2', new Vector2(150, 100), createTestUnitData());
        world.addUnit(unit2);
        expect(listener).toHaveBeenCalledTimes(1); // Not called again
      });
    });
  });

  describe('Battle State', () => {
    describe('isBattleOver()', () => {
      it('should return not over when both sides have units', () => {
        world.addUnit(
          createUnit('player_1', new Vector2(100, 100), createTestUnitData({ team: 'player' }))
        );
        world.addUnit(
          createUnit('enemy_1', new Vector2(100, 50), createTestUnitData({ team: 'enemy' }))
        );

        const result = world.isBattleOver();

        expect(result.over).toBe(false);
        expect(result.winner).toBeNull();
      });

      it('should return player victory when only player has units and no castles exist', () => {
        world.addUnit(
          createUnit('player_1', new Vector2(100, 100), createTestUnitData({ team: 'player' }))
        );
        // No enemy units

        const result = world.isBattleOver();

        expect(result.over).toBe(true);
        expect(result.winner).toBe('player');
      });

      it('should return enemy victory when only enemy has units and no castles exist', () => {
        world.addUnit(
          createUnit('enemy_1', new Vector2(100, 50), createTestUnitData({ team: 'enemy' }))
        );
        // No player units

        const result = world.isBattleOver();

        expect(result.over).toBe(true);
        expect(result.winner).toBe('enemy');
      });

      it('should return draw when no units remain', () => {
        // No units at all

        const result = world.isBattleOver();

        expect(result.over).toBe(true);
        expect(result.winner).toBeNull();
      });
    });
  });

  describe('Update Loop', () => {
    describe('update()', () => {
      it('should update all entities', () => {
        const unit1 = createUnit('unit_1', new Vector2(100, 100), createTestUnitData());
        const unit2 = createUnit('unit_2', new Vector2(150, 100), createTestUnitData());
        world.addUnit(unit1);
        world.addUnit(unit2);

        const update1 = vi.spyOn(unit1, 'update');
        const update2 = vi.spyOn(unit2, 'update');

        world.update(0.016); // ~60fps delta

        expect(update1).toHaveBeenCalledWith(0.016);
        expect(update2).toHaveBeenCalledWith(0.016);
      });

      it('should remove destroyed entities after update', () => {
        const unit1 = createUnit(
          'unit_1',
          new Vector2(100, 100),
          createTestUnitData({ health: 1 })
        );
        const unit2 = createUnit('unit_2', new Vector2(150, 100), createTestUnitData());
        world.addUnit(unit1);
        world.addUnit(unit2);

        // Kill unit1 - starts death fade (DEATH_FADE_DURATION = 0.4s)
        unit1.takeDamage(100);

        // After lethal damage, unit is 'dying' but not 'destroyed' yet
        expect(unit1.isDying).toBe(true);

        // Update with enough time to complete death fade
        world.update(0.5);

        // Now unit should be destroyed and removed
        expect(unit1.isDestroyed()).toBe(true);
        expect(world.getUnits()).toHaveLength(1);
        expect(world.getUnits()[0]).toBe(unit2);
      });

      it('should emit entity_removed when cleaning up destroyed units', () => {
        const unit = createUnit('unit_1', new Vector2(100, 100), createTestUnitData({ health: 1 }));
        world.addUnit(unit);

        const listener = vi.fn();
        world.onWorld('entity_removed', listener);

        // Kill the unit - starts death fade
        unit.takeDamage(100);

        // Update with enough time to complete death fade (0.4s)
        world.update(0.5);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({
          type: 'entity_removed',
          entity: unit,
        });
      });
    });
  });

  describe('Arena Bounds', () => {
    it('should store and retrieve arena bounds', () => {
      const bounds = { width: 800, height: 600, zoneHeightPercent: 0.25 };
      world.setArenaBounds(bounds);

      expect(world.getArenaBounds()).toEqual(bounds);
    });

    it('should return null if bounds not set', () => {
      expect(world.getArenaBounds()).toBeNull();
    });
  });
});

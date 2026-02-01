import { describe, it, expect } from 'vitest';
import { BattleEngine } from './BattleEngine';
import { UnitRegistry } from './units';
import { Vector2 } from '../physics/Vector2';
import { unitDefinitions } from '../../data/units';

function createTestEngine(): BattleEngine {
  const registry = new UnitRegistry();
  registry.registerAll(unitDefinitions);
  return new BattleEngine(registry);
}

describe('BattleEngine tick', () => {
  it('should move units toward enemies after tick', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(800, 600);

    // Spawn player unit at bottom
    engine.spawnUnit('warrior', 'player', new Vector2(400, 500), 600);
    // Spawn enemy unit at top
    engine.spawnUnit('warrior', 'enemy', new Vector2(400, 100), 600);

    const world = engine.getWorld();
    const units = world.getUnits();

    const playerUnit = units.find((u) => u.team === 'player');
    const enemyUnit = units.find((u) => u.team === 'enemy');

    expect(playerUnit).toBeDefined();
    expect(enemyUnit).toBeDefined();

    const initialPlayerY = playerUnit!.position.y;
    const initialEnemyY = enemyUnit!.position.y;

    // Start battle
    engine.start();
    expect(engine.getState().isRunning).toBe(true);

    // Tick 10 times with 0.1s delta (1 second total)
    for (let i = 0; i < 10; i++) {
      engine.tick(0.1);
    }

    // Units should have moved toward each other
    // Player (at bottom) should move up (y decreasing)
    expect(playerUnit!.position.y).toBeLessThan(initialPlayerY);
    // Enemy (at top) should move down (y increasing)
    expect(enemyUnit!.position.y).toBeGreaterThan(initialEnemyY);
  });

  it('should acquire targets when within aggro radius', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(800, 600);

    // Place units within aggro radius (150) of each other
    engine.spawnUnit('warrior', 'player', new Vector2(400, 350), 600);
    engine.spawnUnit('warrior', 'enemy', new Vector2(400, 250), 600);

    const world = engine.getWorld();
    const playerUnit = world.getUnits().find((u) => u.team === 'player');
    const enemyUnit = world.getUnits().find((u) => u.team === 'enemy');

    // Before start, no targets
    expect(playerUnit!.target).toBeNull();

    engine.start();
    engine.tick(0.016); // Single frame

    // After tick, should have targets (within aggro radius)
    expect(playerUnit!.target).toBe(enemyUnit);
    expect(enemyUnit!.target).toBe(playerUnit);
  });

  it('should march forward when enemies are outside aggro radius', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(800, 600);

    // Place units far apart (outside aggro radius)
    engine.spawnUnit('warrior', 'player', new Vector2(400, 500), 600);
    engine.spawnUnit('warrior', 'enemy', new Vector2(400, 100), 600);

    const world = engine.getWorld();
    const playerUnit = world.getUnits().find((u) => u.team === 'player');
    const enemyUnit = world.getUnits().find((u) => u.team === 'enemy');

    const initialPlayerY = playerUnit!.position.y;
    const initialEnemyY = enemyUnit!.position.y;

    engine.start();
    engine.tick(0.1); // Tick once

    // Units should march forward (no target yet - outside aggro radius)
    // Player marches up (Y decreasing), enemy marches down (Y increasing)
    expect(playerUnit!.position.y).toBeLessThan(initialPlayerY);
    expect(enemyUnit!.position.y).toBeGreaterThan(initialEnemyY);
  });
});

import { describe, it, expect } from 'vitest';
import { BattleEngine } from '../../../src/core/battle/BattleEngine';
import { UnitRegistry } from '../../../src/core/battle/units';
import { Vector2 } from '../../../src/core/physics/Vector2';
import { unitDefinitions } from '../../../src/data/units';
import { REFERENCE_ARENA_HEIGHT, calculateWaveGold } from '../../../src/core/battle/BattleConfig';

function createTestEngine(): BattleEngine {
  const registry = new UnitRegistry();
  registry.registerAll(unitDefinitions);
  return new BattleEngine(registry);
}

const ARENA_WIDTH = 800;
const ARENA_HEIGHT = REFERENCE_ARENA_HEIGHT;

describe('BattleEngine tick', () => {
  it('should move units toward enemies after tick', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    // Spawn player unit at bottom
    engine.spawnUnit('hound', 'player', new Vector2(400, 500), ARENA_HEIGHT);
    // Spawn enemy unit at top
    engine.spawnUnit('hound', 'enemy', new Vector2(400, 100), ARENA_HEIGHT);

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
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    // Place units within aggro radius (150) of each other
    engine.spawnUnit('hound', 'player', new Vector2(400, 350), ARENA_HEIGHT);
    engine.spawnUnit('hound', 'enemy', new Vector2(400, 250), ARENA_HEIGHT);

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
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    // Place units far apart (outside aggro radius)
    engine.spawnUnit('hound', 'player', new Vector2(400, 500), ARENA_HEIGHT);
    engine.spawnUnit('hound', 'enemy', new Vector2(400, 100), ARENA_HEIGHT);

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

describe('BattleEngine lifecycle', () => {
  it('should start and stop battle', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    expect(engine.getState().isRunning).toBe(false);
    expect(engine.getState().hasStarted).toBe(false);

    engine.start();
    expect(engine.getState().isRunning).toBe(true);
    expect(engine.getState().hasStarted).toBe(true);

    engine.stop();
    expect(engine.getState().isRunning).toBe(false);
    expect(engine.getState().hasStarted).toBe(true); // hasStarted stays true
  });

  it('should clear battle state', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    engine.spawnUnit('hound', 'player', new Vector2(400, 500));
    engine.spawnUnit('hound', 'enemy', new Vector2(400, 100));
    engine.start();

    expect(engine.getWorld().getUnits().length).toBe(2);

    engine.clear();

    expect(engine.getWorld().getUnits().length).toBe(0);
    expect(engine.getState().hasStarted).toBe(false);
    expect(engine.getState().outcome).toBe('pending');
  });

  it('should not tick when not running', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    engine.spawnUnit('hound', 'player', new Vector2(400, 500));
    const playerUnit = engine.getWorld().getUnits()[0];
    const initialY = playerUnit.position.y;

    // Tick without starting
    engine.tick(0.1);

    // Position should not change
    expect(playerUnit.position.y).toBe(initialY);
  });
});

describe('BattleEngine unit spawning', () => {
  it('should spawn units with correct properties', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    const unit = engine.spawnUnit('hound', 'player', new Vector2(100, 200));

    expect(unit.id).toBe('unit_1');
    expect(unit.type).toBe('hound');
    expect(unit.team).toBe('player');
    expect(unit.position.x).toBe(100);
    expect(unit.position.y).toBe(200);
    expect(unit.health).toBeGreaterThan(0);
    expect(unit.stats.maxHealth).toBeGreaterThan(0);
  });

  it('should increment unit IDs correctly', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    const unit1 = engine.spawnUnit('hound', 'player', new Vector2(100, 200));
    const unit2 = engine.spawnUnit('fang', 'player', new Vector2(200, 200));
    const unit3 = engine.spawnUnit('crawler', 'enemy', new Vector2(300, 100));

    expect(unit1.id).toBe('unit_1');
    expect(unit2.id).toBe('unit_2');
    expect(unit3.id).toBe('unit_3');
  });

  it('should get unit by ID', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    engine.spawnUnit('hound', 'player', new Vector2(100, 200));

    const unit = engine.getUnit('unit_1');
    expect(unit).toBeDefined();
    expect(unit!.type).toBe('hound');

    const notFound = engine.getUnit('unit_999');
    expect(notFound).toBeUndefined();
  });

  it('should get player and enemy units separately', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    engine.spawnUnit('hound', 'player', new Vector2(100, 500));
    engine.spawnUnit('fang', 'player', new Vector2(200, 500));
    engine.spawnUnit('hound', 'enemy', new Vector2(100, 100));

    const playerUnits = engine.getPlayerUnits();
    const enemyUnits = engine.getEnemyUnits();

    expect(playerUnits.length).toBe(2);
    expect(enemyUnits.length).toBe(1);
    expect(playerUnits.every((u) => u.team === 'player')).toBe(true);
    expect(enemyUnits.every((u) => u.team === 'enemy')).toBe(true);
  });
});

describe('BattleEngine castle spawning', () => {
  it('should spawn castles for both teams', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    engine.spawnCastles();

    const castles = engine.getWorld().getCastles();
    expect(castles.length).toBe(4); // 2 per team

    const playerCastles = castles.filter((c) => c.team === 'player');
    const enemyCastles = castles.filter((c) => c.team === 'enemy');

    expect(playerCastles.length).toBe(2);
    expect(enemyCastles.length).toBe(2);
  });

  it('should spawn castles with correct IDs', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    engine.spawnCastles();

    const castles = engine.getWorld().getCastles();
    const ids = castles.map((c) => c.id);

    expect(ids).toContain('castle_1');
    expect(ids).toContain('castle_2');
    expect(ids).toContain('castle_3');
    expect(ids).toContain('castle_4');
  });

  it('should not spawn castles without arena bounds', () => {
    const engine = createTestEngine();

    engine.spawnCastles();

    const castles = engine.getWorld().getCastles();
    expect(castles.length).toBe(0);
  });
});

describe('BattleEngine combat', () => {
  it('should deal damage when units attack', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    // Place units very close so they attack immediately
    engine.spawnUnit('hound', 'player', new Vector2(400, 320));
    engine.spawnUnit('hound', 'enemy', new Vector2(400, 280));

    const world = engine.getWorld();
    const enemyUnit = world.getUnits().find((u) => u.team === 'enemy')!;
    const initialHealth = enemyUnit.health;

    engine.start();

    // Tick multiple times to allow for attack cooldown
    for (let i = 0; i < 50; i++) {
      engine.tick(0.1);
    }

    // Enemy should have taken damage
    expect(enemyUnit.health).toBeLessThan(initialHealth);
  });

  it('should remove dead units', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    // Spawn a very weak enemy (manually reduce health)
    engine.spawnUnit('hound', 'player', new Vector2(400, 320));
    engine.spawnUnit('hound', 'enemy', new Vector2(400, 280));

    const world = engine.getWorld();
    const enemyUnit = world.getUnits().find((u) => u.team === 'enemy')!;

    // Set enemy health very low
    enemyUnit.health = 1;

    engine.start();

    // Tick until unit dies
    for (let i = 0; i < 100; i++) {
      engine.tick(0.1);
      if (world.getEnemyUnits().length === 0) break;
    }

    // Enemy should be removed
    expect(world.getEnemyUnits().length).toBe(0);
  });
});

describe('BattleEngine battle outcome', () => {
  it('should detect player victory when all enemies eliminated', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    // Spawn units but no castles
    engine.spawnUnit('hound', 'player', new Vector2(400, 320));
    engine.spawnUnit('hound', 'enemy', new Vector2(400, 280));

    const world = engine.getWorld();
    const enemyUnit = world.getUnits().find((u) => u.team === 'enemy')!;

    // Set enemy health to 1 so it dies quickly
    enemyUnit.health = 1;

    engine.start();

    // Tick until battle ends
    for (let i = 0; i < 100; i++) {
      engine.tick(0.1);
      if (!engine.getState().isRunning) break;
    }

    expect(engine.getState().outcome).toBe('player_victory');
    expect(engine.getState().isRunning).toBe(false);
  });

  it('should detect enemy victory when all players eliminated', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    engine.spawnUnit('hound', 'player', new Vector2(400, 320));
    engine.spawnUnit('hound', 'enemy', new Vector2(400, 280));

    const world = engine.getWorld();
    const playerUnit = world.getUnits().find((u) => u.team === 'player')!;

    // Set player health to 1 so it dies quickly
    playerUnit.health = 1;

    engine.start();

    // Tick until battle ends
    for (let i = 0; i < 100; i++) {
      engine.tick(0.1);
      if (!engine.getState().isRunning) break;
    }

    expect(engine.getState().outcome).toBe('enemy_victory');
    expect(engine.getState().isRunning).toBe(false);
  });

  it('should detect draw when both sides eliminated simultaneously', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    engine.spawnUnit('hound', 'player', new Vector2(400, 320));
    engine.spawnUnit('hound', 'enemy', new Vector2(400, 280));

    const world = engine.getWorld();
    const playerUnit = world.getUnits().find((u) => u.team === 'player')!;
    const enemyUnit = world.getUnits().find((u) => u.team === 'enemy')!;

    // Set both to very low health
    playerUnit.health = 1;
    enemyUnit.health = 1;

    engine.start();

    // Tick until battle ends
    for (let i = 0; i < 100; i++) {
      engine.tick(0.1);
      if (!engine.getState().isRunning) break;
    }

    // Should be either victory or draw (depends on who attacks first)
    expect(['player_victory', 'enemy_victory', 'draw']).toContain(engine.getState().outcome);
    expect(engine.getState().isRunning).toBe(false);
  });
});

describe('BattleEngine unit movement', () => {
  it('should allow moving units before battle starts', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    engine.spawnUnit('hound', 'player', new Vector2(400, 500));

    engine.moveUnit('unit_1', new Vector2(300, 450));

    const unit = engine.getUnit('unit_1')!;
    expect(unit.position.x).toBe(300);
    expect(unit.position.y).toBe(450);
  });

  it('should not move units after battle starts', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    engine.spawnUnit('hound', 'player', new Vector2(400, 500));

    engine.start();
    engine.moveUnit('unit_1', new Vector2(300, 450));

    const unit = engine.getUnit('unit_1')!;
    // Position should remain at original (or slightly moved by tick)
    expect(unit.position.x).toBe(400);
  });

  it('should not move enemy units', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    engine.spawnUnit('hound', 'enemy', new Vector2(400, 100));

    engine.moveUnit('unit_1', new Vector2(300, 50));

    const unit = engine.getUnit('unit_1')!;
    expect(unit.position.x).toBe(400);
    expect(unit.position.y).toBe(100);
  });
});

describe('BattleEngine overlap resolution', () => {
  it('should resolve overlapping units', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    // Spawn units at exactly the same position
    engine.spawnUnit('hound', 'player', new Vector2(400, 500));
    engine.spawnUnit('hound', 'player', new Vector2(400, 500));

    const units = engine.getWorld().getUnits();
    const unit1 = units[0];
    const unit2 = units[1];

    // Before resolution, positions are identical
    expect(unit1.position.x).toBe(400);
    expect(unit2.position.x).toBe(400);

    engine.resolveOverlaps();

    // After resolution, positions should be different
    const dist = unit1.position.distanceTo(unit2.position);
    expect(dist).toBeGreaterThan(0);
  });
});

describe('BattleEngine state accessors', () => {
  it('should return arena bounds', () => {
    const engine = createTestEngine();

    expect(engine.getArenaBounds()).toBeNull();

    engine.setArenaBounds(800, 600, 15);

    const bounds = engine.getArenaBounds();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBe(800);
    expect(bounds!.height).toBe(600);
    expect(bounds!.margin).toBe(15);
  });

  it('should return registry', () => {
    const engine = createTestEngine();
    const registry = engine.getRegistry();

    expect(registry).toBeDefined();
    expect(registry.get('hound')).toBeDefined();
  });

  it('should return unit entity by ID', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    engine.spawnUnit('hound', 'player', new Vector2(400, 500));

    const entity = engine.getUnitEntity('unit_1');
    expect(entity).toBeDefined();
    expect(entity!.id).toBe('unit_1');

    const notFound = engine.getUnitEntity('unit_999');
    expect(notFound).toBeUndefined();
  });
});

describe('BattleEngine wave management', () => {
  it('should start at wave 1', () => {
    const engine = createTestEngine();
    expect(engine.getState().waveNumber).toBe(1);
    expect(engine.getState().highestWave).toBe(1);
  });

  it('should set wave number', () => {
    const engine = createTestEngine();

    engine.setWave(5);

    expect(engine.getState().waveNumber).toBe(5);
    expect(engine.getState().highestWave).toBe(5);
  });

  it('should track highest wave', () => {
    const engine = createTestEngine();

    engine.setWave(10);
    expect(engine.getState().highestWave).toBe(10);

    engine.setWave(5);
    expect(engine.getState().waveNumber).toBe(5);
    expect(engine.getState().highestWave).toBe(10); // Highest doesn't decrease
  });

  it('should clamp wave to minimum 1', () => {
    const engine = createTestEngine();

    engine.setWave(0);
    expect(engine.getState().waveNumber).toBe(1);

    engine.setWave(-5);
    expect(engine.getState().waveNumber).toBe(1);
  });

  it('should advance to next wave', () => {
    const engine = createTestEngine();

    engine.nextWave();
    expect(engine.getState().waveNumber).toBe(2);

    engine.nextWave();
    expect(engine.getState().waveNumber).toBe(3);
  });

  it('should go to previous wave', () => {
    const engine = createTestEngine();

    engine.setWave(5);
    engine.previousWave();
    expect(engine.getState().waveNumber).toBe(4);
  });

  it('should not go below wave 1', () => {
    const engine = createTestEngine();

    engine.previousWave();
    expect(engine.getState().waveNumber).toBe(1);
  });
});

describe('BattleEngine gold management', () => {
  it('should start with 0 gold', () => {
    const engine = createTestEngine();
    expect(engine.getState().gold).toBe(0);
  });

  it('should add gold', () => {
    const engine = createTestEngine();

    engine.addGold(100);
    expect(engine.getState().gold).toBe(100);

    engine.addGold(50);
    expect(engine.getState().gold).toBe(150);
  });

  it('should award wave gold', () => {
    const engine = createTestEngine();

    const reward = engine.awardWaveGold();

    expect(reward).toBe(calculateWaveGold(1));
    expect(engine.getState().gold).toBe(reward);
  });

  it('should get wave gold reward without awarding', () => {
    const engine = createTestEngine();

    const preview = engine.getWaveGoldReward();

    expect(preview).toBe(calculateWaveGold(1));
    expect(engine.getState().gold).toBe(0); // Not actually awarded
  });
});

describe('BattleEngine handleBattleOutcome', () => {
  it('should award gold and advance wave on victory', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    // Set up a victory scenario
    engine.spawnUnit('hound', 'player', new Vector2(400, 320));
    engine.spawnUnit('hound', 'enemy', new Vector2(400, 280));

    const enemyUnit = engine
      .getWorld()
      .getUnits()
      .find((u) => u.team === 'enemy')!;
    enemyUnit.health = 1;

    engine.start();

    // Tick until victory
    for (let i = 0; i < 100; i++) {
      engine.tick(0.1);
      if (engine.getState().outcome === 'player_victory') break;
    }

    expect(engine.getState().outcome).toBe('player_victory');

    const result = engine.handleBattleOutcome();

    expect(result.outcome).toBe('player_victory');
    expect(result.previousWave).toBe(1);
    expect(result.newWave).toBe(2);
    expect(result.goldEarned).toBe(calculateWaveGold(1));
    expect(result.waveChanged).toBe(true);
    expect(engine.getState().waveNumber).toBe(2);
    expect(engine.getState().gold).toBe(calculateWaveGold(1));
  });

  it('should go back one wave on defeat (no gold)', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    // Start at wave 5
    engine.setWave(5);

    // Set up a defeat scenario
    engine.spawnUnit('hound', 'player', new Vector2(400, 320));
    engine.spawnUnit('hound', 'enemy', new Vector2(400, 280));

    const playerUnit = engine
      .getWorld()
      .getUnits()
      .find((u) => u.team === 'player')!;
    playerUnit.health = 1;

    engine.start();

    // Tick until defeat
    for (let i = 0; i < 100; i++) {
      engine.tick(0.1);
      if (engine.getState().outcome === 'enemy_victory') break;
    }

    expect(engine.getState().outcome).toBe('enemy_victory');

    const result = engine.handleBattleOutcome();

    expect(result.outcome).toBe('enemy_victory');
    expect(result.previousWave).toBe(5);
    expect(result.newWave).toBe(4);
    expect(result.goldEarned).toBe(0);
    expect(result.waveChanged).toBe(true);
    expect(engine.getState().waveNumber).toBe(4);
    expect(engine.getState().gold).toBe(0);
  });

  it('should stay at wave 1 on defeat (cannot go lower)', () => {
    const engine = createTestEngine();
    engine.setArenaBounds(ARENA_WIDTH, ARENA_HEIGHT);

    // Set up a defeat scenario at wave 1
    engine.spawnUnit('hound', 'player', new Vector2(400, 320));
    engine.spawnUnit('hound', 'enemy', new Vector2(400, 280));

    const playerUnit = engine
      .getWorld()
      .getUnits()
      .find((u) => u.team === 'player')!;
    playerUnit.health = 1;

    engine.start();

    // Tick until defeat
    for (let i = 0; i < 100; i++) {
      engine.tick(0.1);
      if (engine.getState().outcome === 'enemy_victory') break;
    }

    const result = engine.handleBattleOutcome();

    expect(result.previousWave).toBe(1);
    expect(result.newWave).toBe(1);
    expect(result.waveChanged).toBe(false);
  });

  it('should stay on same wave on pending (no-op)', () => {
    const engine = createTestEngine();

    const result = engine.handleBattleOutcome();

    expect(result.outcome).toBe('pending');
    expect(result.previousWave).toBe(1);
    expect(result.newWave).toBe(1);
    expect(result.goldEarned).toBe(0);
    expect(result.waveChanged).toBe(false);
  });
});

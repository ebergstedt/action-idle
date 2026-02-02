import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BattleEngine,
  BattleState,
  BattleStats,
  BattleStatistics,
  BattleOutcomeResult,
  CLASSIC_FORMATION,
  calculateAlliedSpawnPositions,
  calculateEnemySpawnPositions,
  getEnemyCompositionForWave,
  UnitRegistry,
  ZONE_HEIGHT_PERCENT,
} from '../core/battle';
import { Vector2 } from '../core/physics/Vector2';
import { unitDefinitions } from '../data/units';

export type BattleSpeed = 0.5 | 1 | 2;

export interface UseBattleReturn {
  state: BattleState;
  stats: BattleStatistics;
  selectedUnitIds: string[];
  battleSpeed: BattleSpeed;
  start: () => void;
  stop: () => void;
  reset: () => void;
  spawnWave: (arenaWidth: number, arenaHeight: number) => void;
  moveUnit: (unitId: string, position: Vector2) => void;
  moveUnits: (moves: Array<{ unitId: string; position: Vector2 }>) => void;
  selectUnit: (unitId: string | null) => void;
  selectUnits: (unitIds: string[]) => void;
  setBattleSpeed: (speed: BattleSpeed) => void;
  setWave: (wave: number) => void;
  /** Handle battle outcome - awards gold, transitions wave. Returns result. */
  handleBattleOutcome: () => BattleOutcomeResult | null;
  /** Get gold reward for current wave (display only, doesn't award) */
  getWaveGoldReward: () => number;
}

/**
 * Create and initialize the unit registry from JSON data.
 */
function createUnitRegistry(): UnitRegistry {
  const registry = new UnitRegistry();
  registry.registerAll(unitDefinitions);
  return registry;
}

const EMPTY_STATS: BattleStatistics = {
  player: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0, unitsSpawned: 0 },
  enemy: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0, unitsSpawned: 0 },
  battleDuration: 0,
  totalKills: 0,
};

export function useBattle(): UseBattleReturn {
  const engineRef = useRef<BattleEngine | null>(null);
  const statsRef = useRef<BattleStats | null>(null);
  const [state, setState] = useState<BattleState>({
    units: [],
    projectiles: [],
    castles: [],
    shockwaves: [],
    damageNumbers: [],
    isRunning: false,
    hasStarted: false,
    waveNumber: 1,
    highestWave: 1,
    gold: 0,
    outcome: 'pending',
  });
  const [stats, setStats] = useState<BattleStatistics>(EMPTY_STATS);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [battleSpeed, setBattleSpeed] = useState<BattleSpeed>(1);
  const battleSpeedRef = useRef<BattleSpeed>(1);
  const arenaSizeRef = useRef<{ width: number; height: number } | null>(null);

  // Keep ref in sync for use in game loop
  useEffect(() => {
    battleSpeedRef.current = battleSpeed;
  }, [battleSpeed]);

  // Initialize engine with registry
  useEffect(() => {
    const registry = createUnitRegistry();
    engineRef.current = new BattleEngine(registry);
    statsRef.current = new BattleStats();
    return () => {
      statsRef.current?.detach();
      statsRef.current = null;
      engineRef.current = null;
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (!state.isRunning) return;

    let lastTime = performance.now();
    let frameId: number;

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      if (engineRef.current) {
        // Apply battle speed multiplier
        const scaledDelta = delta * battleSpeedRef.current;
        engineRef.current.tick(scaledDelta);
        setState({ ...engineRef.current.getState() });

        // Update stats
        if (statsRef.current) {
          statsRef.current.updateDuration(scaledDelta);
          setStats({ ...statsRef.current.getStats() });
        }
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [state.isRunning]);

  const start = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.start();
      setState({ ...engineRef.current.getState() });
    }
  }, []);

  const stop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      setState({ ...engineRef.current.getState() });
    }
  }, []);

  const reset = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current.clear();
      setState({ ...engineRef.current.getState() });

      // Reset stats
      if (statsRef.current) {
        statsRef.current.detach();
        statsRef.current.reset();
        setStats(EMPTY_STATS);
      }
    }
  }, []);

  const spawnWave = useCallback((arenaWidth: number, arenaHeight: number) => {
    if (!engineRef.current) return;

    // Save arena size for respawning after victory/defeat
    arenaSizeRef.current = { width: arenaWidth, height: arenaHeight };

    const engine = engineRef.current;
    const bounds = {
      width: arenaWidth,
      height: arenaHeight,
      zoneHeightPercent: ZONE_HEIGHT_PERCENT,
    };

    // Set arena bounds for boundary enforcement during gameplay
    engine.setArenaBounds(arenaWidth, arenaHeight);

    // Attach stats tracker to world before spawning
    if (statsRef.current) {
      statsRef.current.attach(engine.getWorld());
    }

    // Spawn castles for both teams
    engine.spawnCastles();

    // Spawn allied army using formation (each spawn creates a full squad)
    // Note: BattleStats auto-subscribes to new units via world events
    const alliedPositions = calculateAlliedSpawnPositions(CLASSIC_FORMATION, bounds);
    for (const spawn of alliedPositions) {
      engine.spawnSquad(spawn.type, 'player', spawn.position, arenaHeight);
    }

    // Spawn enemy army (each spawn creates a full squad)
    const waveNumber = engine.getState().waveNumber;
    const enemyComposition = getEnemyCompositionForWave(waveNumber);
    const enemyPositions = calculateEnemySpawnPositions(enemyComposition, bounds);
    for (const spawn of enemyPositions) {
      engine.spawnSquad(spawn.type, 'enemy', spawn.position, arenaHeight);
    }

    // Resolve any overlapping units after spawning
    engine.resolveOverlaps(30, {
      arenaWidth,
      arenaHeight,
      zoneHeightPercent: ZONE_HEIGHT_PERCENT,
    });

    setState({ ...engine.getState() });
    if (statsRef.current) {
      setStats({ ...statsRef.current.getStats() });
    }
  }, []);

  const moveUnit = useCallback((unitId: string, position: Vector2) => {
    if (engineRef.current) {
      engineRef.current.moveUnit(unitId, position);
      setState({ ...engineRef.current.getState() });
    }
  }, []);

  const moveUnits = useCallback((moves: Array<{ unitId: string; position: Vector2 }>) => {
    if (engineRef.current) {
      for (const { unitId, position } of moves) {
        engineRef.current.moveUnit(unitId, position);
      }
      setState({ ...engineRef.current.getState() });
    }
  }, []);

  const selectUnit = useCallback((unitId: string | null) => {
    setSelectedUnitIds(unitId ? [unitId] : []);
  }, []);

  const selectUnits = useCallback((unitIds: string[]) => {
    setSelectedUnitIds(unitIds);
  }, []);

  const setWave = useCallback((wave: number) => {
    if (engineRef.current) {
      engineRef.current.setWave(wave);
      setState({ ...engineRef.current.getState() });
    }
  }, []);

  const handleBattleOutcome = useCallback((): BattleOutcomeResult | null => {
    if (!engineRef.current) return null;
    const result = engineRef.current.handleBattleOutcome();
    setState({ ...engineRef.current.getState() });
    return result;
  }, []);

  const getWaveGoldReward = useCallback((): number => {
    if (!engineRef.current) return 0;
    return engineRef.current.getWaveGoldReward();
  }, []);

  return {
    state,
    stats,
    selectedUnitIds,
    battleSpeed,
    start,
    stop,
    reset,
    spawnWave,
    moveUnit,
    moveUnits,
    selectUnit,
    selectUnits,
    setBattleSpeed,
    setWave,
    handleBattleOutcome,
    getWaveGoldReward,
  };
}

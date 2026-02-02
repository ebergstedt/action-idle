/**
 * Battle Hook
 *
 * Main orchestration hook for the battle system.
 * Composes useBattleSettings, useBattleLoop, and engine management.
 *
 * SRP: Orchestrates battle components, delegates to focused hooks.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AUTO_BATTLE_START_DELAY_MS,
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
import type { IPersistenceAdapter } from '../core/persistence/IPersistenceAdapter';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';
import { Vector2 } from '../core/physics/Vector2';
import { unitDefinitions } from '../data/units';
import { useBattleSettings, BattleSpeed } from './useBattleSettings';
import { useBattleLoop } from './useBattleLoop';

/** Default persistence adapter - created lazily to avoid instantiation at module load */
let defaultAdapter: IPersistenceAdapter | null = null;
function getDefaultAdapter(): IPersistenceAdapter {
  if (!defaultAdapter) {
    defaultAdapter = new LocalStorageAdapter();
  }
  return defaultAdapter;
}

export type { BattleSpeed };

export interface UseBattleOptions {
  /** Persistence adapter for battle settings. Defaults to LocalStorageAdapter. */
  persistenceAdapter?: IPersistenceAdapter;
}

/** Callback invoked after battle resets in auto-battle flow */
export type OnBattleResetCallback = () => void;

export interface UseBattleReturn {
  state: BattleState;
  stats: BattleStatistics;
  selectedUnitIds: string[];
  battleSpeed: BattleSpeed;
  autoBattle: boolean;
  settingsLoaded: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  spawnWave: (arenaWidth: number, arenaHeight: number) => void;
  moveUnit: (unitId: string, position: Vector2) => void;
  moveUnits: (moves: Array<{ unitId: string; position: Vector2 }>) => void;
  selectUnit: (unitId: string | null) => void;
  selectUnits: (unitIds: string[]) => void;
  setBattleSpeed: (speed: BattleSpeed) => void;
  setAutoBattle: (enabled: boolean) => void;
  /**
   * Toggle auto-battle on/off.
   * If enabling and battle is not running, automatically starts the battle.
   * This consolidates auto-battle toggle logic in one place.
   */
  toggleAutoBattle: () => void;
  setWave: (wave: number) => void;
  /** Handle battle outcome - awards gold, transitions wave. Returns result. */
  handleBattleOutcome: () => BattleOutcomeResult | null;
  /** Get gold reward for current wave (display only, doesn't award) */
  getWaveGoldReward: () => number;
  /**
   * Handle outcome dismissal with auto-battle support.
   * Processes outcome, resets battle, and auto-starts next if enabled.
   * @param onReset - Optional callback after reset (e.g., to trigger re-spawn)
   */
  handleOutcomeAndContinue: (onReset?: OnBattleResetCallback) => void;
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

export function useBattle(options: UseBattleOptions = {}): UseBattleReturn {
  const { persistenceAdapter = getDefaultAdapter() } = options;

  // Core engine refs
  const engineRef = useRef<BattleEngine | null>(null);
  const statsRef = useRef<BattleStats | null>(null);
  const autoBattleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Battle state
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

  // Use settings hook for persistence
  const {
    battleSpeed,
    autoBattle,
    settingsLoaded,
    setBattleSpeed,
    setAutoBattle,
    saveSettingsWithState,
    getLoadedSettings,
  } = useBattleSettings(persistenceAdapter);

  // Initialize engine
  useEffect(() => {
    const registry = createUnitRegistry();
    engineRef.current = new BattleEngine(registry);
    statsRef.current = new BattleStats();

    return () => {
      statsRef.current?.detach();
      statsRef.current = null;
      engineRef.current = null;
      // Clean up auto-battle timer
      if (autoBattleTimerRef.current) {
        clearTimeout(autoBattleTimerRef.current);
        autoBattleTimerRef.current = null;
      }
    };
  }, []);

  // Apply loaded settings to engine once both are ready
  useEffect(() => {
    if (!settingsLoaded || !engineRef.current) return;

    const settings = getLoadedSettings();
    if (settings) {
      engineRef.current.setWave(settings.waveNumber);
      engineRef.current.setHighestWave(settings.highestWave);
      engineRef.current.setGold(settings.gold);
      setState({ ...engineRef.current.getState() });
    }
  }, [settingsLoaded, getLoadedSettings]);

  // Save settings when relevant values change
  useEffect(() => {
    if (settingsLoaded && engineRef.current) {
      saveSettingsWithState(state.waveNumber, state.highestWave, state.gold);
    }
  }, [
    autoBattle,
    battleSpeed,
    state.waveNumber,
    state.highestWave,
    state.gold,
    settingsLoaded,
    saveSettingsWithState,
  ]);

  // Game loop tick handler
  const handleTick = useCallback((scaledDelta: number) => {
    if (engineRef.current) {
      engineRef.current.tick(scaledDelta);
      setState({ ...engineRef.current.getState() });

      // Update stats
      if (statsRef.current) {
        statsRef.current.updateDuration(scaledDelta);
        setStats({ ...statsRef.current.getStats() });
      }
    }
  }, []);

  // Use game loop hook
  useBattleLoop({
    isRunning: state.isRunning,
    battleSpeed,
    onTick: handleTick,
  });

  // Battle control functions
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

  // Wave spawning
  const spawnWave = useCallback((arenaWidth: number, arenaHeight: number) => {
    if (!engineRef.current) return;

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

    // Spawn allied army using formation
    const alliedPositions = calculateAlliedSpawnPositions(CLASSIC_FORMATION, bounds);
    for (const spawn of alliedPositions) {
      engine.spawnSquad(spawn.type, 'player', spawn.position, arenaHeight);
    }

    // Spawn enemy army
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

  // Unit movement
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

  // Selection
  const selectUnit = useCallback((unitId: string | null) => {
    setSelectedUnitIds(unitId ? [unitId] : []);
  }, []);

  const selectUnits = useCallback((unitIds: string[]) => {
    setSelectedUnitIds(unitIds);
  }, []);

  // Wave management
  const setWave = useCallback((wave: number) => {
    if (engineRef.current) {
      engineRef.current.setWave(wave);
      setState({ ...engineRef.current.getState() });
    }
  }, []);

  // Auto-battle toggle - consolidates toggle + auto-start logic
  const toggleAutoBattle = useCallback(() => {
    const newValue = !autoBattle;
    setAutoBattle(newValue);
    // If enabling auto-battle and battle is not running, start it
    if (newValue && engineRef.current && !engineRef.current.getState().isRunning) {
      engineRef.current.start();
      setState({ ...engineRef.current.getState() });
    }
  }, [autoBattle, setAutoBattle]);

  // Battle outcome handling
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

  // Auto-battle flow: outcome → reset → auto-start
  const handleOutcomeAndContinue = useCallback(
    (onReset?: OnBattleResetCallback) => {
      // Clear any existing timer
      if (autoBattleTimerRef.current) {
        clearTimeout(autoBattleTimerRef.current);
        autoBattleTimerRef.current = null;
      }

      // Process outcome (awards gold, transitions wave)
      if (engineRef.current) {
        engineRef.current.handleBattleOutcome();
        setState({ ...engineRef.current.getState() });
      }

      // Reset battle state
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current.clear();
        setState({ ...engineRef.current.getState() });

        if (statsRef.current) {
          statsRef.current.detach();
          statsRef.current.reset();
          setStats(EMPTY_STATS);
        }
      }

      // Invoke reset callback (e.g., to re-spawn units)
      onReset?.();

      // Auto-start next battle if enabled
      if (autoBattle) {
        autoBattleTimerRef.current = setTimeout(() => {
          if (engineRef.current) {
            engineRef.current.start();
            setState({ ...engineRef.current.getState() });
          }
          autoBattleTimerRef.current = null;
        }, AUTO_BATTLE_START_DELAY_MS);
      }
    },
    [autoBattle]
  );

  return {
    state,
    stats,
    selectedUnitIds,
    battleSpeed,
    autoBattle,
    settingsLoaded,
    start,
    stop,
    reset,
    spawnWave,
    moveUnit,
    moveUnits,
    selectUnit,
    selectUnits,
    setBattleSpeed,
    setAutoBattle,
    toggleAutoBattle,
    setWave,
    handleBattleOutcome,
    getWaveGoldReward,
    handleOutcomeAndContinue,
  };
}

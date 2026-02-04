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
  calculateDeterministicAlliedPositions,
  calculateDeterministicEnemyPositions,
  getDefaultAlliedComposition,
  getEnemyCompositionForWave,
  UnitRegistry,
  ZONE_HEIGHT_PERCENT,
} from '../core/battle';
import type { IPersistenceAdapter } from '../core/persistence/IPersistenceAdapter';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';
import { Vector2 } from '../core/physics/Vector2';
import { calculateCellSize, snapFootprintToGrid } from '../core/battle/grid/GridManager';
import { resolveSquadOverlaps } from '../core/battle/DragController';
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
  player: {
    kills: 0,
    deaths: 0,
    damageDealt: 0,
    damageTaken: 0,
    unitsSpawned: 0,
    attacksPerformed: 0,
    meleeAttacks: 0,
    rangedAttacks: 0,
  },
  enemy: {
    kills: 0,
    deaths: 0,
    damageDealt: 0,
    damageTaken: 0,
    unitsSpawned: 0,
    attacksPerformed: 0,
    meleeAttacks: 0,
    rangedAttacks: 0,
  },
  battleDuration: 0,
  totalKills: 0,
};

export function useBattle(options: UseBattleOptions = {}): UseBattleReturn {
  const { persistenceAdapter = getDefaultAdapter() } = options;

  // Core engine refs
  const engineRef = useRef<BattleEngine | null>(null);
  const statsRef = useRef<BattleStats | null>(null);
  const autoBattleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arenaDimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

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
    timeScale: 1,
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

  // Sync battle speed to engine (for additive speed calculation)
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setBattleSpeed(battleSpeed);
    }
  }, [battleSpeed]);

  // Use game loop hook
  useBattleLoop({
    isRunning: state.isRunning,
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

    const waveNumber = engine.getState().waveNumber;
    const registry = engine.getRegistry();
    const cellSize = calculateCellSize(arenaWidth, arenaHeight);

    // Spawn allied army using deterministic formation with collision detection
    const alliedComposition = getDefaultAlliedComposition();
    const alliedPositions = calculateDeterministicAlliedPositions(
      alliedComposition,
      registry,
      bounds,
      waveNumber
    );
    for (const spawn of alliedPositions) {
      // Snap position to grid based on unit's footprint
      const def = registry.tryGet(spawn.type);
      const footprint = def?.gridFootprint || { cols: 2, rows: 2 };
      const snappedPos = snapFootprintToGrid(spawn.position, footprint, cellSize);
      engine.spawnSquad(spawn.type, 'player', snappedPos, arenaHeight);
    }

    // Spawn enemy army using deterministic formation (varies by wave)
    const enemyComposition = getEnemyCompositionForWave(waveNumber, registry);
    const enemyPositions = calculateDeterministicEnemyPositions(
      enemyComposition,
      registry,
      bounds,
      waveNumber
    );
    for (const spawn of enemyPositions) {
      // Snap position to grid based on unit's footprint
      const def = registry.tryGet(spawn.type);
      const footprint = def?.gridFootprint || { cols: 2, rows: 2 };
      const snappedPos = snapFootprintToGrid(spawn.position, footprint, cellSize);
      engine.spawnSquad(spawn.type, 'enemy', snappedPos, arenaHeight);
    }

    // Resolve any overlapping squads after spawning (best-effort algorithm)
    // Exclude castles (stationary units) - they have fixed positions and shouldn't be moved
    const currentState = engine.getState();
    const unitsForResolution = currentState.units
      .filter((u) => u.type !== 'castle')
      .map((u) => ({
        id: u.id,
        type: u.type,
        position: u.position,
        size: u.size,
        team: u.team,
        squadId: u.squadId,
        gridFootprint: u.gridFootprint,
      }));

    // Resolve player squad overlaps
    const playerMoves = resolveSquadOverlaps(unitsForResolution, 'player', cellSize);
    for (const move of playerMoves) {
      engine.moveUnit(move.unitId, move.position);
    }

    // Resolve enemy squad overlaps
    const enemyMoves = resolveSquadOverlaps(unitsForResolution, 'enemy', cellSize);
    for (const move of enemyMoves) {
      engine.moveUnit(move.unitId, move.position);
    }

    // Store arena dimensions for later use in moveUnits
    arenaDimensionsRef.current = { width: arenaWidth, height: arenaHeight };

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
      const engine = engineRef.current;

      for (const { unitId, position } of moves) {
        engine.moveUnit(unitId, position);
      }

      // During deployment phase, resolve any overlaps caused by the move
      const currentState = engine.getState();
      const { width: arenaW, height: arenaH } = arenaDimensionsRef.current;
      if (!currentState.hasStarted && arenaW > 0 && arenaH > 0) {
        const cellSize = calculateCellSize(arenaW, arenaH);
        const unitsForResolution = currentState.units.map((u) => ({
          id: u.id,
          type: u.type,
          position: u.position,
          size: u.size,
          team: u.team,
          squadId: u.squadId,
          gridFootprint: u.gridFootprint,
        }));

        // Resolve player squad overlaps
        const resolutionMoves = resolveSquadOverlaps(unitsForResolution, 'player', cellSize);
        for (const move of resolutionMoves) {
          engine.moveUnit(move.unitId, move.position);
        }
      }

      setState({ ...engine.getState() });
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

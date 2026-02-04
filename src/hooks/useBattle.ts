/**
 * Battle Hook
 *
 * Main orchestration hook for the battle system.
 * Composes focused sub-hooks for engine, selection, controls, deployment, and outcome.
 *
 * SRP: Orchestrates battle components, delegates to focused hooks.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { IPersistenceAdapter } from '../core/persistence/IPersistenceAdapter';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';
import { BattleState, BattleStatistics, BattleOutcomeResult } from '../core/battle';
import { Vector2 } from '../core/physics/Vector2';
import { useBattleSettings, BattleSpeed } from './useBattleSettings';
import { useBattleLoop } from './useBattleLoop';
import { useAutoBattleTimer } from './useAutoBattleTimer';
import {
  useBattleEngine,
  useBattleSelection,
  useBattleControls,
  useBattleDeployment,
  useBattleOutcome,
} from './battle';

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
  toggleAutoBattle: () => void;
  setWave: (wave: number) => void;
  handleBattleOutcome: () => BattleOutcomeResult | null;
  getWaveGoldReward: () => number;
  handleOutcomeAndContinue: (onReset?: OnBattleResetCallback) => void;
}

export function useBattle(options: UseBattleOptions = {}): UseBattleReturn {
  const { persistenceAdapter = getDefaultAdapter() } = options;

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

  // Core engine management - define first so other hooks can reference it
  // Note: We pass a stable callback that reads from ref, avoiding effect re-runs
  const cancelAutoStartRef = useRef<() => void>(() => {});
  const onEngineCleanup = useCallback(() => cancelAutoStartRef.current(), []);
  const engine = useBattleEngine(onEngineCleanup);

  // Auto-battle timer hook - uses engine refs directly
  const handleAutoStart = useCallback(() => {
    if (engine.engineRef.current) {
      engine.engineRef.current.start();
      engine.syncState();
    }
  }, [engine.engineRef, engine.syncState]);

  const { scheduleAutoStart, cancelAutoStart } = useAutoBattleTimer(autoBattle, handleAutoStart);

  // Store cancelAutoStart in ref so engine cleanup can call it
  useEffect(() => {
    cancelAutoStartRef.current = cancelAutoStart;
  }, [cancelAutoStart]);

  // Selection state
  const selection = useBattleSelection();

  // Battle controls
  const controls = useBattleControls({
    engineRef: engine.engineRef,
    syncState: engine.syncState,
    resetStats: engine.resetStats,
  });

  // Deployment operations
  const deployment = useBattleDeployment({
    engineRef: engine.engineRef,
    statsRef: engine.statsRef,
    syncState: engine.syncState,
    syncStats: engine.syncStats,
  });

  // Outcome handling
  const outcome = useBattleOutcome({
    engineRef: engine.engineRef,
    syncState: engine.syncState,
    performReset: controls.reset,
    scheduleAutoStart,
  });

  // Apply loaded settings to engine once both are ready
  useEffect(() => {
    if (!settingsLoaded || !engine.engineRef.current) return;

    const settings = getLoadedSettings();
    if (settings) {
      engine.engineRef.current.setWave(settings.waveNumber);
      engine.engineRef.current.setHighestWave(settings.highestWave);
      engine.engineRef.current.setGold(settings.gold);
      engine.syncState();
    }
  }, [settingsLoaded, getLoadedSettings, engine.engineRef, engine.syncState]);

  // Save settings when relevant values change
  useEffect(() => {
    if (settingsLoaded && engine.engineRef.current) {
      saveSettingsWithState(engine.state.waveNumber, engine.state.highestWave, engine.state.gold);
    }
  }, [
    autoBattle,
    battleSpeed,
    engine.state.waveNumber,
    engine.state.highestWave,
    engine.state.gold,
    settingsLoaded,
    saveSettingsWithState,
  ]);

  // Game loop tick handler
  const handleTick = useCallback(
    (scaledDelta: number) => {
      if (engine.engineRef.current) {
        engine.engineRef.current.tick(scaledDelta);
        engine.syncState();

        if (engine.statsRef.current) {
          engine.statsRef.current.updateDuration(scaledDelta);
          engine.syncStats();
        }
      }
    },
    [engine.engineRef, engine.statsRef, engine.syncState, engine.syncStats]
  );

  // Sync battle speed to engine
  useEffect(() => {
    if (engine.engineRef.current) {
      engine.engineRef.current.setBattleSpeed(battleSpeed);
    }
  }, [battleSpeed, engine.engineRef]);

  // Game loop
  useBattleLoop({
    isRunning: engine.state.isRunning,
    onTick: handleTick,
  });

  // Auto-battle toggle - consolidates toggle + auto-start logic
  const toggleAutoBattle = useCallback(() => {
    const newValue = !autoBattle;
    setAutoBattle(newValue);
    if (newValue && engine.engineRef.current && !engine.engineRef.current.getState().isRunning) {
      engine.engineRef.current.start();
      engine.syncState();
    }
  }, [autoBattle, setAutoBattle, engine.engineRef, engine.syncState]);

  return {
    state: engine.state,
    stats: engine.stats,
    selectedUnitIds: selection.selectedUnitIds,
    battleSpeed,
    autoBattle,
    settingsLoaded,
    start: controls.start,
    stop: controls.stop,
    reset: controls.reset,
    spawnWave: deployment.spawnWave,
    moveUnit: deployment.moveUnit,
    moveUnits: deployment.moveUnits,
    selectUnit: selection.selectUnit,
    selectUnits: selection.selectUnits,
    setBattleSpeed,
    setAutoBattle,
    toggleAutoBattle,
    setWave: controls.setWave,
    handleBattleOutcome: outcome.handleBattleOutcome,
    getWaveGoldReward: outcome.getWaveGoldReward,
    handleOutcomeAndContinue: outcome.handleOutcomeAndContinue,
  };
}

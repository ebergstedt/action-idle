/**
 * Battle Hook
 *
 * Main orchestration hook for the battle system.
 * Composes focused sub-hooks for engine, selection, controls, deployment, and outcome.
 *
 * SRP: Orchestrates battle components, delegates to focused hooks.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
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
  stayMode: boolean;
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
  toggleStayMode: () => void;
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

  // Stay mode - repeats same wave without progressing
  const [stayMode, setStayMode] = useState(false);
  const stayModeRef = useRef(stayMode);
  useEffect(() => {
    stayModeRef.current = stayMode;
  }, [stayMode]);

  // Core engine management - define first so other hooks can reference it
  // Note: We pass a stable callback that reads from ref, avoiding effect re-runs
  const cancelAutoStartRef = useRef<() => void>(() => {});
  const onEngineCleanup = useCallback(() => cancelAutoStartRef.current(), []);
  const {
    engineRef,
    statsRef,
    state: engineState,
    stats: engineStats,
    syncState,
    syncStats,
    resetStats,
  } = useBattleEngine(onEngineCleanup);

  // Auto-battle timer hook - uses engine refs directly
  const handleAutoStart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.start();
      syncState();
    }
  }, [engineRef, syncState]);

  const { scheduleAutoStart, cancelAutoStart } = useAutoBattleTimer(autoBattle, handleAutoStart);

  // Store cancelAutoStart in ref so engine cleanup can call it
  useEffect(() => {
    cancelAutoStartRef.current = cancelAutoStart;
  }, [cancelAutoStart]);

  // Selection state
  const selection = useBattleSelection();

  // Battle controls
  const controls = useBattleControls({
    engineRef,
    syncState,
    resetStats,
  });

  // Deployment operations
  const deployment = useBattleDeployment({
    engineRef,
    statsRef,
    syncState,
    syncStats,
  });

  // Outcome handling
  const outcome = useBattleOutcome({
    engineRef,
    syncState,
    performReset: controls.reset,
    scheduleAutoStart,
    stayModeRef,
  });

  // Apply loaded settings to engine once both are ready
  useEffect(() => {
    if (!settingsLoaded || !engineRef.current) return;

    const settings = getLoadedSettings();
    if (settings) {
      engineRef.current.setWave(settings.waveNumber);
      engineRef.current.setHighestWave(settings.highestWave);
      engineRef.current.setGold(settings.gold);
      syncState();
    }
  }, [settingsLoaded, getLoadedSettings, engineRef, syncState]);

  // Save settings when relevant values change
  useEffect(() => {
    if (settingsLoaded && engineRef.current) {
      saveSettingsWithState(engineState.waveNumber, engineState.highestWave, engineState.gold);
    }
  }, [
    autoBattle,
    battleSpeed,
    engineRef,
    engineState.waveNumber,
    engineState.highestWave,
    engineState.gold,
    settingsLoaded,
    saveSettingsWithState,
  ]);

  // Game loop tick handler
  const handleTick = useCallback(
    (scaledDelta: number) => {
      if (engineRef.current) {
        engineRef.current.tick(scaledDelta);
        syncState();

        if (statsRef.current) {
          statsRef.current.updateDuration(scaledDelta);
          syncStats();
        }
      }
    },
    [engineRef, statsRef, syncState, syncStats]
  );

  // Sync battle speed to engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setBattleSpeed(battleSpeed);
    }
  }, [battleSpeed, engineRef]);

  // Game loop
  useBattleLoop({
    isRunning: engineState.isRunning,
    onTick: handleTick,
  });

  // Auto-battle toggle - consolidates toggle + auto-start logic
  const toggleAutoBattle = useCallback(() => {
    const newValue = !autoBattle;
    setAutoBattle(newValue);
    if (newValue && engineRef.current && !engineRef.current.getState().isRunning) {
      engineRef.current.start();
      syncState();
    }
  }, [autoBattle, setAutoBattle, engineRef, syncState]);

  // Stay mode toggle - repeat same wave without progressing
  const toggleStayMode = useCallback(() => {
    setStayMode((prev) => !prev);
  }, []);

  return {
    state: engineState,
    stats: engineStats,
    selectedUnitIds: selection.selectedUnitIds,
    battleSpeed,
    autoBattle,
    stayMode,
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
    toggleStayMode,
    setWave: controls.setWave,
    handleBattleOutcome: outcome.handleBattleOutcome,
    getWaveGoldReward: outcome.getWaveGoldReward,
    handleOutcomeAndContinue: outcome.handleOutcomeAndContinue,
  };
}

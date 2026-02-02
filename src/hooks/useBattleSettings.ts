/**
 * Battle Settings Hook
 *
 * Manages battle settings persistence (autoBattle, battleSpeed, wave, gold).
 * Handles loading from and saving to persistence adapter.
 *
 * SRP: Only responsible for settings state and persistence.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  BattleSettingsData,
  loadBattleSettings,
  saveBattleSettings,
} from '../core/battle/BattleSettings';
import type { IPersistenceAdapter } from '../core/persistence/IPersistenceAdapter';

export type BattleSpeed = 0.5 | 1 | 2;

export interface BattleSettingsState {
  battleSpeed: BattleSpeed;
  autoBattle: boolean;
  settingsLoaded: boolean;
}

export interface UseBattleSettingsReturn extends BattleSettingsState {
  setBattleSpeed: (speed: BattleSpeed) => void;
  setAutoBattle: (enabled: boolean) => void;
  /** Save current settings with engine state (waveNumber, highestWave, gold) */
  saveSettingsWithState: (waveNumber: number, highestWave: number, gold: number) => void;
  /** Get initial settings once loaded (for engine initialization) */
  getLoadedSettings: () => BattleSettingsData | null;
}

/**
 * Hook for managing battle settings persistence.
 *
 * @param adapter - Persistence adapter for save/load
 * @returns Settings state and control functions
 */
export function useBattleSettings(adapter: IPersistenceAdapter): UseBattleSettingsReturn {
  const [battleSpeed, setBattleSpeedState] = useState<BattleSpeed>(1);
  const [autoBattle, setAutoBattleState] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const loadedSettingsRef = useRef<BattleSettingsData | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadBattleSettings(adapter)
      .then((settings) => {
        setAutoBattleState(settings.autoBattle);
        setBattleSpeedState(settings.battleSpeed as BattleSpeed);
        loadedSettingsRef.current = settings;
        setSettingsLoaded(true);
      })
      .catch((err) => {
        // Log error but proceed with defaults to avoid blocking the app
        console.error('Failed to load battle settings:', err);
        setSettingsLoaded(true);
      });
  }, [adapter]);

  const setBattleSpeed = useCallback((speed: BattleSpeed) => {
    setBattleSpeedState(speed);
  }, []);

  const setAutoBattle = useCallback((enabled: boolean) => {
    setAutoBattleState(enabled);
  }, []);

  const saveSettingsWithState = useCallback(
    (waveNumber: number, highestWave: number, gold: number) => {
      if (!settingsLoaded) return;

      const settings: BattleSettingsData = {
        version: 1,
        autoBattle,
        battleSpeed,
        waveNumber,
        highestWave,
        gold,
      };
      saveBattleSettings(adapter, settings).catch((err) => {
        console.error('Failed to save settings:', err);
      });
    },
    [adapter, autoBattle, battleSpeed, settingsLoaded]
  );

  const getLoadedSettings = useCallback((): BattleSettingsData | null => {
    return loadedSettingsRef.current;
  }, []);

  return {
    battleSpeed,
    autoBattle,
    settingsLoaded,
    setBattleSpeed,
    setAutoBattle,
    saveSettingsWithState,
    getLoadedSettings,
  };
}

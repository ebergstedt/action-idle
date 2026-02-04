/**
 * Assembly Hook
 *
 * Manages assembly state with persistence.
 * Handles loading/saving upgrade states and VEST.
 *
 * SRP: Only responsible for assembly state and persistence.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { BattleUpgradeRegistry } from '../core/battle/upgrades/BattleUpgradeRegistry';
import { BattleUpgradeStates } from '../core/battle/upgrades/types';
import type { IPersistenceAdapter } from '../core/persistence/IPersistenceAdapter';
import {
  AssemblyState,
  createInitialState,
  purchaseUpgrade,
  selectUnitType,
  addVest,
  updateHighestWave,
  serializeState,
  deserializeState,
  isValidSerializedState,
} from '../core/assembly';

/** Save key for assembly state */
const ASSEMBLY_SAVE_KEY = 'action_idle_assembly';

/** Debounce delay for auto-save (ms) */
const SAVE_DEBOUNCE_MS = 1000;

export interface UseAssemblyOptions {
  /** Persistence adapter for saving state */
  persistenceAdapter: IPersistenceAdapter;
  /** Battle upgrade registry (must be initialized) */
  upgradeRegistry: BattleUpgradeRegistry;
}

export interface UseAssemblyReturn {
  /** Current assembly state */
  state: AssemblyState;
  /** Whether state has been loaded from persistence */
  loaded: boolean;
  /** Currently selected unit type */
  selectedUnitType: string | null;
  /** Current upgrade states (convenience accessor) */
  upgradeStates: BattleUpgradeStates;
  /** Current VEST amount */
  vest: number;
  /** Highest wave reached */
  highestWave: number;
  /** Select a unit type for viewing upgrades */
  selectUnit: (unitType: string | null) => void;
  /** Purchase an upgrade (returns true if successful) */
  purchase: (upgradeId: string) => boolean;
  /** Add VEST from battle rewards */
  earnVest: (amount: number) => void;
  /** Update highest wave reached */
  setHighestWave: (wave: number) => void;
  /** Force save (typically called before navigation) */
  save: () => Promise<void>;
}

/**
 * Hook for managing assembly state with persistence.
 */
export function useAssembly(options: UseAssemblyOptions): UseAssemblyReturn {
  const { persistenceAdapter, upgradeRegistry } = options;

  const [state, setState] = useState<AssemblyState>(() => createInitialState(upgradeRegistry));
  const [loaded, setLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);

  // Keep ref in sync for save operations
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load state on mount
  useEffect(() => {
    async function loadState() {
      try {
        const data = await persistenceAdapter.load(ASSEMBLY_SAVE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          if (isValidSerializedState(parsed)) {
            const loaded = deserializeState(parsed, upgradeRegistry);
            setState(loaded);
          }
        }
      } catch (err) {
        console.error('Failed to load assembly state:', err);
      } finally {
        setLoaded(true);
      }
    }
    loadState();
  }, [persistenceAdapter, upgradeRegistry]);

  // Debounced auto-save when state changes
  useEffect(() => {
    if (!loaded) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule save
    saveTimeoutRef.current = setTimeout(() => {
      const serialized = serializeState(stateRef.current);
      persistenceAdapter.save(ASSEMBLY_SAVE_KEY, JSON.stringify(serialized)).catch((err) => {
        console.error('Failed to save assembly state:', err);
      });
      saveTimeoutRef.current = null;
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, loaded, persistenceAdapter]);

  // Manual save function
  const save = useCallback(async () => {
    // Cancel pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const serialized = serializeState(stateRef.current);
    await persistenceAdapter.save(ASSEMBLY_SAVE_KEY, JSON.stringify(serialized));
  }, [persistenceAdapter]);

  // Select unit type
  const selectUnit = useCallback((unitType: string | null) => {
    setState((prev) => selectUnitType(prev, unitType));
  }, []);

  // Purchase upgrade
  const purchase = useCallback(
    (upgradeId: string): boolean => {
      let purchased = false;
      setState((prev) => {
        const newState = purchaseUpgrade(prev, upgradeRegistry, upgradeId);
        purchased = newState !== prev;
        return newState;
      });
      return purchased;
    },
    [upgradeRegistry]
  );

  // Earn VEST from battle
  const earnVest = useCallback((amount: number) => {
    setState((prev) => addVest(prev, amount));
  }, []);

  // Update highest wave
  const setHighestWave = useCallback((wave: number) => {
    setState((prev) => updateHighestWave(prev, wave));
  }, []);

  return {
    state,
    loaded,
    selectedUnitType: state.selectedUnitType,
    upgradeStates: state.upgradeStates,
    vest: state.vest,
    highestWave: state.highestWave,
    selectUnit,
    purchase,
    earnVest,
    setHighestWave,
    save,
  };
}

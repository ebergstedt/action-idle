import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { GameEngine } from '../core/engine/GameEngine';
import { GameState } from '../core/types/GameState';
import { UpgradeDefinition } from '../core/types/Upgrade';
import { SaveManager } from '../core/persistence/SaveManager';
import { IPersistenceAdapter } from '../core/persistence/IPersistenceAdapter';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';
import { Decimal } from '../core/utils/BigNumber';
import { useGameLoop } from './useGameLoop';
import { AUTOSAVE_INTERVAL_MS, MAX_OFFLINE_TIME_SECONDS } from '../core/battle/BattleConfig';
import upgradesData from '../data/upgrades.json';

export interface GameStateHook {
  state: GameState;
  upgrades: readonly UpgradeDefinition[];
  productionPerSecond: Decimal;
  purchaseUpgrade: (upgradeId: string) => boolean;
  addCurrency: (amount: Decimal) => void;
  getUpgradeCost: (upgradeId: string) => Decimal;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
  resetGame: () => Promise<void>;
}

export interface UseGameStateOptions {
  /** Persistence adapter for save/load. Defaults to LocalStorageAdapter. */
  persistenceAdapter?: IPersistenceAdapter;
}

/** Default persistence adapter - created lazily */
let defaultAdapter: IPersistenceAdapter | null = null;
function getDefaultAdapter(): IPersistenceAdapter {
  if (!defaultAdapter) {
    defaultAdapter = new LocalStorageAdapter();
  }
  return defaultAdapter;
}

/**
 * Main hook that bridges the core game engine with React.
 * Handles the game loop, state updates, and save/load operations.
 */
export function useGameState(options: UseGameStateOptions = {}): GameStateHook {
  const { persistenceAdapter = getDefaultAdapter() } = options;

  // Memoize engine and saveManager to ensure stable references
  const engine = useMemo(() => new GameEngine(upgradesData as UpgradeDefinition[]), []);
  const saveManager = useMemo(() => new SaveManager(persistenceAdapter), [persistenceAdapter]);

  const lastSaveRef = useRef<number>(Date.now());

  // React state that triggers re-renders
  const [state, setState] = useState<GameState>(() => engine.getState());
  const [productionPerSecond, setProductionPerSecond] = useState<Decimal>(() =>
    engine.getProductionPerSecond()
  );

  // Sync React state with engine state
  const syncState = useCallback(() => {
    setState({ ...engine.getState() });
    setProductionPerSecond(engine.getProductionPerSecond());
  }, [engine]);

  // Game tick handler
  const handleTick = useCallback(
    (delta: number) => {
      engine.tick(delta);
      syncState();

      // Autosave check
      const now = Date.now();
      if (now - lastSaveRef.current >= AUTOSAVE_INTERVAL_MS) {
        lastSaveRef.current = now;
        saveManager.saveGame(engine.getState()).catch(console.error);
      }
    },
    [engine, saveManager, syncState]
  );

  // Start the game loop
  useGameLoop(handleTick, true);

  // Load saved game on mount
  useEffect(() => {
    const loadSave = async () => {
      const savedState = await saveManager.loadGame();
      if (savedState) {
        engine.setState(savedState);

        // Calculate offline earnings (capped by MAX_OFFLINE_TIME_SECONDS)
        const now = Date.now();
        const offlineMs = now - savedState.lastTick;
        const offlineSec = Math.min(offlineMs / 1000, MAX_OFFLINE_TIME_SECONDS);

        if (offlineSec > 1) {
          engine.tick(offlineSec);
        }

        syncState();
      }
    };

    loadSave().catch(console.error);
  }, [engine, saveManager, syncState]);

  // Public API
  const purchaseUpgrade = useCallback(
    (upgradeId: string): boolean => {
      const success = engine.purchaseUpgrade(upgradeId);
      if (success) {
        syncState();
      }
      return success;
    },
    [engine, syncState]
  );

  const addCurrency = useCallback(
    (amount: Decimal): void => {
      engine.addCurrency(amount);
      syncState();
    },
    [engine, syncState]
  );

  const getUpgradeCost = useCallback(
    (upgradeId: string): Decimal => {
      return engine.getUpgradeCost(upgradeId);
    },
    [engine]
  );

  const saveGame = useCallback(async (): Promise<void> => {
    await saveManager.saveGame(engine.getState());
  }, [engine, saveManager]);

  const loadGame = useCallback(async (): Promise<void> => {
    const savedState = await saveManager.loadGame();
    if (savedState) {
      engine.setState(savedState);
      syncState();
    }
  }, [engine, saveManager, syncState]);

  const resetGame = useCallback(async (): Promise<void> => {
    await saveManager.deleteSave();
    engine.reset();
    syncState();
  }, [engine, saveManager, syncState]);

  return {
    state,
    upgrades: engine.getUpgradeDefinitions(),
    productionPerSecond,
    purchaseUpgrade,
    addCurrency,
    getUpgradeCost,
    saveGame,
    loadGame,
    resetGame,
  };
}

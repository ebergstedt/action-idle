/**
 * Battle Engine Hook
 *
 * Manages the BattleEngine and BattleStats lifecycle.
 * Single responsibility: engine creation, destruction, and state synchronization.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BattleEngine,
  BattleStats,
  BattleState,
  BattleStatistics,
  UnitRegistry,
} from '../../core/battle';
import { unitDefinitions } from '../../data/units';

/** Empty stats constant for initial/reset state */
export const EMPTY_STATS: BattleStatistics = {
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

/** Initial battle state */
const INITIAL_STATE: BattleState = {
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
  simulationTime: 0,
};

/**
 * Create and initialize the unit registry from JSON data.
 */
function createUnitRegistry(): UnitRegistry {
  const registry = new UnitRegistry();
  registry.registerAll(unitDefinitions);
  return registry;
}

export interface UseBattleEngineReturn {
  /** Current battle state */
  state: BattleState;
  /** Battle statistics */
  stats: BattleStatistics;
  /** Reference to the engine (for direct operations) */
  engineRef: React.RefObject<BattleEngine | null>;
  /** Reference to the stats tracker */
  statsRef: React.RefObject<BattleStats | null>;
  /** Sync React state from engine */
  syncState: () => void;
  /** Sync stats from tracker */
  syncStats: () => void;
  /** Reset stats to empty */
  resetStats: () => void;
}

/**
 * Manages the BattleEngine lifecycle and state synchronization.
 *
 * @param onCleanup - Optional cleanup callback when engine is destroyed
 */
export function useBattleEngine(onCleanup?: () => void): UseBattleEngineReturn {
  const engineRef = useRef<BattleEngine | null>(null);
  const statsRef = useRef<BattleStats | null>(null);

  const [state, setState] = useState<BattleState>(INITIAL_STATE);
  const [stats, setStats] = useState<BattleStatistics>(EMPTY_STATS);

  // Initialize engine on mount
  useEffect(() => {
    const registry = createUnitRegistry();
    engineRef.current = new BattleEngine(registry);
    statsRef.current = new BattleStats();

    return () => {
      statsRef.current?.detach();
      statsRef.current = null;
      engineRef.current = null;
      onCleanup?.();
    };
  }, [onCleanup]);

  // Sync React state from engine
  const syncState = useCallback(() => {
    if (engineRef.current) {
      setState({ ...engineRef.current.getState() });
    }
  }, []);

  // Sync stats from tracker
  const syncStats = useCallback(() => {
    if (statsRef.current) {
      setStats({ ...statsRef.current.getStats() });
    }
  }, []);

  // Reset stats to empty
  const resetStats = useCallback(() => {
    if (statsRef.current) {
      statsRef.current.detach();
      statsRef.current.reset();
      setStats(EMPTY_STATS);
    }
  }, []);

  return {
    state,
    stats,
    engineRef,
    statsRef,
    syncState,
    syncStats,
    resetStats,
  };
}

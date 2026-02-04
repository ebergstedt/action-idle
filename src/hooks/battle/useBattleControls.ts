/**
 * Battle Controls Hook
 *
 * Provides battle control operations: start, stop, reset, setWave.
 * Single responsibility: controlling battle lifecycle.
 */

import { useCallback } from 'react';
import { BattleEngine } from '../../core/battle';

export interface UseBattleControlsOptions {
  /** Reference to the battle engine */
  engineRef: React.RefObject<BattleEngine | null>;
  /** Callback to sync state after operations */
  syncState: () => void;
  /** Callback to reset stats */
  resetStats: () => void;
}

export interface UseBattleControlsReturn {
  /** Start the battle */
  start: () => void;
  /** Stop the battle */
  stop: () => void;
  /** Reset the battle (stop, clear, reset stats) */
  reset: () => void;
  /** Set the current wave number */
  setWave: (wave: number) => void;
}

/**
 * Provides battle control operations.
 */
export function useBattleControls({
  engineRef,
  syncState,
  resetStats,
}: UseBattleControlsOptions): UseBattleControlsReturn {
  const start = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.start();
      syncState();
    }
  }, [engineRef, syncState]);

  const stop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      syncState();
    }
  }, [engineRef, syncState]);

  const reset = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current.clear();
      syncState();
      resetStats();
    }
  }, [engineRef, syncState, resetStats]);

  const setWave = useCallback(
    (wave: number) => {
      if (engineRef.current) {
        engineRef.current.setWave(wave);
        syncState();
      }
    },
    [engineRef, syncState]
  );

  return {
    start,
    stop,
    reset,
    setWave,
  };
}

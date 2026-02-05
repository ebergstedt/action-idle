/**
 * Battle Outcome Hook
 *
 * Handles battle outcome processing, gold rewards, and auto-battle flow.
 * Single responsibility: outcome handling and wave transitions.
 */

import { useCallback } from 'react';
import { BattleEngine, BattleOutcomeResult } from '../../core/battle';

export interface UseBattleOutcomeOptions {
  /** Reference to the battle engine */
  engineRef: React.RefObject<BattleEngine | null>;
  /** Callback to sync state after operations */
  syncState: () => void;
  /** Callback to perform full reset (stop, clear, reset stats) */
  performReset: () => void;
  /** Callback to schedule auto-start (from useAutoBattleTimer) */
  scheduleAutoStart: (onReset?: () => void) => void;
  /** Reference to stay mode flag (repeat same wave without progressing) */
  stayModeRef: React.RefObject<boolean>;
}

export interface UseBattleOutcomeReturn {
  /** Handle battle outcome - awards gold, transitions wave. Returns result. */
  handleBattleOutcome: () => BattleOutcomeResult | null;
  /** Get gold reward for current wave (display only, doesn't award) */
  getWaveGoldReward: () => number;
  /**
   * Handle outcome dismissal with auto-battle support.
   * Processes outcome, resets battle, and auto-starts next if enabled.
   * @param onReset - Optional callback after reset (e.g., to trigger re-spawn)
   */
  handleOutcomeAndContinue: (onReset?: () => void) => void;
}

/**
 * Handles battle outcome processing.
 */
export function useBattleOutcome({
  engineRef,
  syncState,
  performReset,
  scheduleAutoStart,
  stayModeRef,
}: UseBattleOutcomeOptions): UseBattleOutcomeReturn {
  const handleBattleOutcome = useCallback((): BattleOutcomeResult | null => {
    if (!engineRef.current) return null;
    const result = engineRef.current.handleBattleOutcome(stayModeRef.current ?? false);
    syncState();
    return result;
  }, [engineRef, syncState, stayModeRef]);

  const getWaveGoldReward = useCallback((): number => {
    if (!engineRef.current) return 0;
    return engineRef.current.getWaveGoldReward();
  }, [engineRef]);

  const handleOutcomeAndContinue = useCallback(
    (onReset?: () => void) => {
      // Process outcome (awards gold, transitions wave - unless stay mode)
      if (engineRef.current) {
        engineRef.current.handleBattleOutcome(stayModeRef.current ?? false);
        syncState();
      }

      // Reset battle state
      performReset();

      // Schedule auto-start (calls onReset immediately, then auto-starts if enabled)
      scheduleAutoStart(onReset);
    },
    [engineRef, syncState, performReset, scheduleAutoStart, stayModeRef]
  );

  return {
    handleBattleOutcome,
    getWaveGoldReward,
    handleOutcomeAndContinue,
  };
}

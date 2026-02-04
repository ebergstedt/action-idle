/**
 * Auto Battle Timer Hook
 *
 * Manages the timer for auto-starting battles in auto-battle mode.
 * Extracted from useBattle.ts for better separation of concerns.
 */

import { useRef, useCallback, useEffect } from 'react';
import { AUTO_BATTLE_START_DELAY_MS } from '../core/battle';

/**
 * Return type for the useAutoBattleTimer hook.
 */
export interface UseAutoBattleTimerReturn {
  /**
   * Schedules an auto-start timer if auto-battle is enabled.
   * @param onReset - Optional callback to invoke before the auto-start (e.g., for re-spawning)
   */
  scheduleAutoStart: (onReset?: () => void) => void;

  /**
   * Cancels any pending auto-start timer.
   */
  cancelAutoStart: () => void;
}

/**
 * Hook for managing auto-battle timing.
 *
 * @param autoBattle - Whether auto-battle mode is enabled
 * @param onAutoStart - Callback when auto-start triggers
 * @returns Timer control functions
 */
export function useAutoBattleTimer(
  autoBattle: boolean,
  onAutoStart: () => void
): UseAutoBattleTimerReturn {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const cancelAutoStart = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleAutoStart = useCallback(
    (onReset?: () => void) => {
      // Clear any existing timer
      cancelAutoStart();

      // Invoke reset callback immediately
      onReset?.();

      // Schedule auto-start if enabled
      if (autoBattle) {
        timerRef.current = setTimeout(() => {
          onAutoStart();
          timerRef.current = null;
        }, AUTO_BATTLE_START_DELAY_MS);
      }
    },
    [autoBattle, onAutoStart, cancelAutoStart]
  );

  return {
    scheduleAutoStart,
    cancelAutoStart,
  };
}

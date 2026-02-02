/**
 * Auto-Battle Countdown Hook
 *
 * Manages the countdown timer for auto-battle mode.
 * Extracted from WaxSealOverlay for SRP compliance.
 *
 * SRP: Only handles countdown timing logic.
 */

import { useEffect, useState, useRef } from 'react';
import type { BattleOutcome } from '../core/battle';
import { AUTO_BATTLE_COUNTDOWN_SECONDS } from '../core/battle/BattleConfig';

export interface UseAutoBattleCountdownOptions {
  /** Whether auto-battle is enabled */
  autoBattle: boolean;
  /** Current battle outcome */
  outcome: BattleOutcome;
  /** Whether the overlay is ready for countdown (e.g., animation complete) */
  isReady: boolean;
  /** Callback when countdown reaches zero */
  onComplete: () => void;
}

export interface UseAutoBattleCountdownReturn {
  /** Current countdown value in seconds */
  countdown: number;
}

/**
 * Hook for managing auto-battle countdown timer.
 *
 * Starts countdown when:
 * - Auto-battle is enabled
 * - Outcome is not pending
 * - isReady is true (e.g., stamp animation complete)
 *
 * Calls onComplete when countdown reaches zero.
 */
export function useAutoBattleCountdown({
  autoBattle,
  outcome,
  isReady,
  onComplete,
}: UseAutoBattleCountdownOptions): UseAutoBattleCountdownReturn {
  const [countdown, setCountdown] = useState(AUTO_BATTLE_COUNTDOWN_SECONDS);
  const countdownRef = useRef(AUTO_BATTLE_COUNTDOWN_SECONDS);
  const hasTriggeredRef = useRef(false);

  // Reset refs when outcome changes to pending
  useEffect(() => {
    if (outcome === 'pending') {
      countdownRef.current = AUTO_BATTLE_COUNTDOWN_SECONDS;
      hasTriggeredRef.current = false;
      setCountdown(AUTO_BATTLE_COUNTDOWN_SECONDS);
    }
  }, [outcome]);

  // Run countdown timer
  useEffect(() => {
    if (!autoBattle || outcome === 'pending' || !isReady) {
      return;
    }

    // Reset countdown state when starting
    countdownRef.current = AUTO_BATTLE_COUNTDOWN_SECONDS;
    setCountdown(AUTO_BATTLE_COUNTDOWN_SECONDS);

    const intervalId = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);

      if (countdownRef.current <= 0 && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        clearInterval(intervalId);
        onComplete();
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [autoBattle, outcome, isReady, onComplete]);

  return { countdown };
}

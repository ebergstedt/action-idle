/**
 * Ink Splatter Hook
 *
 * React integration layer for the ink splatter system.
 * Delegates physics and spawning logic to core module.
 *
 * SRP: Only manages React state, delegates logic to core.
 */

import { useRef, useCallback, useEffect } from 'react';
import type { UnitRenderData } from '../../../core/battle';
import {
  processInkSplatters,
  createInkSpawnState,
  clearInkSpawnState,
  type InkSplatter,
  type InkSpawnState,
} from '../../../core/battle/particles';

// Re-export InkSplatter type for consumers
export type { InkSplatter };

/**
 * Hook to manage ink splatter particles for unit deaths.
 * Splatters are permanent until clearSplatters is called (on game reset).
 */
export function useInkSplatter(): {
  splatters: InkSplatter[];
  updateSplatters: (units: UnitRenderData[], hasStarted: boolean, delta: number) => InkSplatter[];
  clearSplatters: () => void;
} {
  const splattersRef = useRef<InkSplatter[]>([]);
  const spawnStateRef = useRef<InkSpawnState>(createInkSpawnState());
  const wasStartedRef = useRef(false);

  const clearSplatters = useCallback(() => {
    splattersRef.current = [];
    clearInkSpawnState(spawnStateRef.current);
    wasStartedRef.current = false;
  }, []);

  // Clean up on unmount to prevent memory leaks
  useEffect(() => {
    // Capture refs at effect time for safe cleanup
    const splatters = splattersRef;
    const spawnState = spawnStateRef;
    return () => {
      splatters.current = [];
      clearInkSpawnState(spawnState.current);
    };
  }, []);

  const updateSplatters = useCallback(
    (units: UnitRenderData[], hasStarted: boolean, delta: number): InkSplatter[] => {
      // Clear splatters when game resets (hasStarted transitions from true to false)
      if (wasStartedRef.current && !hasStarted) {
        clearSplatters();
      }
      wasStartedRef.current = hasStarted;

      // Delegate to core particle system
      splattersRef.current = processInkSplatters(
        units,
        splattersRef.current,
        spawnStateRef.current,
        delta
      );

      return splattersRef.current;
    },
    [clearSplatters]
  );

  return {
    get splatters() {
      return splattersRef.current;
    },
    updateSplatters,
    clearSplatters,
  };
}

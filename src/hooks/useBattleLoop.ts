/**
 * Battle Loop Hook
 *
 * Manages the game loop using requestAnimationFrame.
 * Calls tick functions at the appropriate rate with battle speed scaling.
 *
 * SRP: Only responsible for frame timing and update dispatch.
 */

import { useEffect, useRef } from 'react';
import type { BattleSpeed } from './useBattleSettings';

export interface UseBattleLoopProps {
  /** Whether the loop should be running */
  isRunning: boolean;
  /** Current battle speed multiplier */
  battleSpeed: BattleSpeed;
  /** Called each frame with delta time in seconds (already speed-scaled) */
  onTick: (scaledDelta: number) => void;
}

/**
 * Hook for managing the battle game loop.
 *
 * @param props - Loop configuration
 */
export function useBattleLoop({ isRunning, battleSpeed, onTick }: UseBattleLoopProps): void {
  // Keep battleSpeed in ref to avoid recreating the loop on speed changes
  const battleSpeedRef = useRef<BattleSpeed>(battleSpeed);

  useEffect(() => {
    battleSpeedRef.current = battleSpeed;
  }, [battleSpeed]);

  useEffect(() => {
    if (!isRunning) return;

    let lastTime = performance.now();
    let frameId: number;

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Apply battle speed multiplier
      const scaledDelta = delta * battleSpeedRef.current;
      onTick(scaledDelta);

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isRunning, onTick]);
}

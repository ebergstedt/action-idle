/**
 * Battle Loop Hook
 *
 * Manages the game loop using requestAnimationFrame.
 * Passes raw delta time to tick function (speed scaling is handled by BattleEngine).
 *
 * SRP: Only responsible for frame timing and update dispatch.
 */

import { useEffect } from 'react';

export interface UseBattleLoopProps {
  /** Whether the loop should be running */
  isRunning: boolean;
  /** Called each frame with raw delta time in seconds */
  onTick: (delta: number) => void;
}

/**
 * Hook for managing the battle game loop.
 *
 * @param props - Loop configuration
 */
export function useBattleLoop({ isRunning, onTick }: UseBattleLoopProps): void {
  useEffect(() => {
    if (!isRunning) return;

    let lastTime = performance.now();
    let frameId: number;

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      onTick(delta);

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isRunning, onTick]);
}

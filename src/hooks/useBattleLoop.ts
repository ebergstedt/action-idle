/**
 * Battle Loop Hook
 *
 * Manages the game loop using requestAnimationFrame.
 * Passes raw delta time to tick function (speed scaling is handled by BattleEngine).
 *
 * SRP: Only responsible for frame timing and update dispatch.
 */

import { useEffect, useRef } from 'react';

export interface UseBattleLoopProps {
  /** Whether the loop should be running */
  isRunning: boolean;
  /** Called each frame with raw delta time in seconds */
  onTick: (delta: number) => void;
}

/**
 * Hook for managing the battle game loop.
 *
 * Uses a ref to store the callback to avoid recreating the loop
 * when the callback reference changes (same pattern as useGameLoop).
 *
 * @param props - Loop configuration
 */
export function useBattleLoop({ isRunning, onTick }: UseBattleLoopProps): void {
  const onTickRef = useRef(onTick);

  // Keep callback ref updated without triggering effect
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!isRunning) return;

    let lastTime = performance.now();
    let frameId: number;

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      onTickRef.current(delta);

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isRunning]);
}

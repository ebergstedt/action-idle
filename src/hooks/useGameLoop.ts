import { useEffect, useRef } from 'react';

/**
 * Custom hook that runs a game loop using requestAnimationFrame.
 * Calculates delta time between frames and calls the provided tick function.
 *
 * @param onTick - Callback function that receives delta time in seconds
 * @param isRunning - Whether the game loop should be active
 */
export function useGameLoop(onTick: (delta: number) => void, isRunning: boolean = true): void {
  const lastTimeRef = useRef<number>(performance.now());
  const frameRef = useRef<number>(0);
  const onTickRef = useRef(onTick);

  // Keep callback ref updated without triggering effect
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const loop = (currentTime: number) => {
      const lastTime = lastTimeRef.current;
      const deltaMs = currentTime - lastTime;
      const deltaSec = deltaMs / 1000;

      // Cap delta to prevent huge jumps (e.g., after tab sleep)
      const cappedDelta = Math.min(deltaSec, 1);

      lastTimeRef.current = currentTime;
      onTickRef.current(cappedDelta);

      frameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [isRunning]);
}

/**
 * Arena Sizing Hook
 *
 * Manages arena size calculation based on container dimensions.
 * Handles ResizeObserver and size stability detection.
 *
 * SRP: Only responsible for arena sizing calculations.
 */

import { useEffect, useRef, useState, RefObject } from 'react';
import {
  MIN_ARENA_WIDTH,
  MAX_ARENA_WIDTH,
  MIN_ARENA_HEIGHT,
  ARENA_ASPECT_RATIO,
  ARENA_SIZE_STABLE_DELAY_MS,
  DEFAULT_ARENA_WIDTH,
  DEFAULT_ARENA_HEIGHT,
  ARENA_CONTAINER_PADDING_V,
  ARENA_CONTAINER_PADDING_H,
} from '../core/battle/BattleConfig';

export interface ArenaSize {
  width: number;
  height: number;
}

export interface UseArenaSizingReturn {
  /** Current calculated arena size */
  arenaSize: ArenaSize;
  /** Whether the size has stabilized (no resize events for delay period) */
  isArenaSizeStable: boolean;
  /** Ref to attach to the container element */
  containerRef: RefObject<HTMLDivElement>;
}

/**
 * Hook for calculating arena size from container dimensions.
 *
 * Uses ResizeObserver to track container size changes and
 * calculates arena dimensions respecting aspect ratio and min sizes.
 *
 * @returns Arena size state and container ref
 */
export function useArenaSizing(): UseArenaSizingReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeStableTimeoutRef = useRef<number | null>(null);
  const initialTimeoutRef = useRef<number | null>(null);

  const [arenaSize, setArenaSize] = useState<ArenaSize>({
    width: DEFAULT_ARENA_WIDTH,
    height: DEFAULT_ARENA_HEIGHT,
  });
  const [isArenaSizeStable, setIsArenaSizeStable] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const availableHeight = rect.height - ARENA_CONTAINER_PADDING_V;
        const availableWidth = rect.width - ARENA_CONTAINER_PADDING_H;

        // Constrain width between min and max
        const width = Math.min(MAX_ARENA_WIDTH, Math.max(MIN_ARENA_WIDTH, availableWidth));
        const height = Math.max(
          MIN_ARENA_HEIGHT,
          Math.min(availableHeight, width * ARENA_ASPECT_RATIO)
        );

        setArenaSize({ width, height });

        // Mark size as stable after a short delay
        if (sizeStableTimeoutRef.current) {
          clearTimeout(sizeStableTimeoutRef.current);
        }
        sizeStableTimeoutRef.current = window.setTimeout(() => {
          setIsArenaSizeStable(true);
        }, ARENA_SIZE_STABLE_DELAY_MS);
      }
    };

    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Initial size calculation
    initialTimeoutRef.current = window.setTimeout(updateSize, 0);

    return () => {
      observer.disconnect();
      if (sizeStableTimeoutRef.current) {
        clearTimeout(sizeStableTimeoutRef.current);
      }
      if (initialTimeoutRef.current) {
        clearTimeout(initialTimeoutRef.current);
      }
    };
  }, []);

  return {
    arenaSize,
    isArenaSizeStable,
    containerRef,
  };
}

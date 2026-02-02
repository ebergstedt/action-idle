/**
 * Dust Particles Hook
 *
 * React integration layer for the dust particle system.
 * Delegates physics and spawning logic to core module.
 *
 * SRP: Only manages React state, delegates logic to core.
 */

import { useRef, useCallback } from 'react';
import type { UnitRenderData } from '../../../core/battle';
import { PARTICLE_FRAME_DELTA } from '../../../core/battle/BattleConfig';
import {
  processDustParticles,
  createDustSpawnState,
  type DustParticle,
  type DustSpawnState,
} from '../../../core/battle/particles';

// Re-export DustParticle type for consumers
export type { DustParticle };

/**
 * Hook to manage dust particles for moving units.
 * Returns functions to update particles and get current particle list.
 */
export function useDustParticles(): {
  particles: DustParticle[];
  updateParticles: (units: UnitRenderData[], isRunning: boolean) => DustParticle[];
} {
  const dustParticlesRef = useRef<DustParticle[]>([]);
  const spawnStateRef = useRef<DustSpawnState>(createDustSpawnState());

  const updateParticles = useCallback(
    (units: UnitRenderData[], isRunning: boolean): DustParticle[] => {
      if (!isRunning) {
        return dustParticlesRef.current;
      }

      // Delegate to core particle system
      dustParticlesRef.current = processDustParticles(
        units,
        dustParticlesRef.current,
        spawnStateRef.current,
        performance.now(),
        PARTICLE_FRAME_DELTA
      );

      return dustParticlesRef.current;
    },
    []
  );

  return {
    get particles() {
      return dustParticlesRef.current;
    },
    updateParticles,
  };
}

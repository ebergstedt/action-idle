/**
 * Dust Particles Hook
 *
 * Manages dust particle spawning and updating for unit movement effects.
 */

import { useRef, useCallback } from 'react';
import type { UnitRenderData } from '../../../core/battle';
import {
  DUST_SPAWN_INTERVAL,
  DUST_PARTICLE_LIFETIME,
  PARTICLE_FRAME_DELTA,
  DUST_PARTICLE_GRAVITY,
  DUST_MOVEMENT_THRESHOLD,
  DUST_SPAWN_Y_OFFSET,
  DUST_HORIZONTAL_VELOCITY_RANGE,
  DUST_UPWARD_VELOCITY_BASE,
  DUST_UPWARD_VELOCITY_RANDOM,
} from '../../../core/battle/BattleConfig';
import type { DustParticle } from '../rendering';

/**
 * Hook to manage dust particles for moving units.
 * Returns functions to update particles and get current particle list.
 */
export function useDustParticles(): {
  particles: DustParticle[];
  updateParticles: (units: UnitRenderData[], isRunning: boolean) => DustParticle[];
} {
  const dustParticlesRef = useRef<DustParticle[]>([]);
  const lastDustSpawnRef = useRef<Map<string, number>>(new Map());
  const prevPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const updateParticles = useCallback(
    (units: UnitRenderData[], isRunning: boolean): DustParticle[] => {
      if (!isRunning) {
        return dustParticlesRef.current;
      }

      const now = performance.now();

      // Spawn dust for moving units
      for (const unit of units) {
        if (unit.deathFadeTimer >= 0) continue; // Skip dying units

        // Check if unit moved since last frame
        const prevPos = prevPositionsRef.current.get(unit.id);
        const dx = prevPos ? Math.abs(unit.position.x - prevPos.x) : 0;
        const dy = prevPos ? Math.abs(unit.position.y - prevPos.y) : 0;
        const isMoving = dx > DUST_MOVEMENT_THRESHOLD || dy > DUST_MOVEMENT_THRESHOLD;

        // Update stored position
        prevPositionsRef.current.set(unit.id, {
          x: unit.position.x,
          y: unit.position.y,
        });

        if (isMoving) {
          const lastSpawn = lastDustSpawnRef.current.get(unit.id) ?? 0;
          if (now - lastSpawn > DUST_SPAWN_INTERVAL * 1000) {
            // Spawn 2-3 dust particles below and behind the unit
            const particleCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < particleCount; i++) {
              dustParticlesRef.current.push({
                x: unit.position.x + (Math.random() - 0.5) * unit.size * 2,
                y: unit.position.y + unit.size + DUST_SPAWN_Y_OFFSET,
                vx: (Math.random() - 0.5) * DUST_HORIZONTAL_VELOCITY_RANGE,
                vy: -Math.random() * DUST_UPWARD_VELOCITY_RANDOM - DUST_UPWARD_VELOCITY_BASE,
                lifetime: DUST_PARTICLE_LIFETIME,
                maxLifetime: DUST_PARTICLE_LIFETIME,
              });
            }
            lastDustSpawnRef.current.set(unit.id, now);
          }
        }
      }

      // Update existing particles
      dustParticlesRef.current = dustParticlesRef.current.filter((p) => {
        p.lifetime -= PARTICLE_FRAME_DELTA;
        p.x += p.vx * PARTICLE_FRAME_DELTA;
        p.y += p.vy * PARTICLE_FRAME_DELTA;
        p.vy += DUST_PARTICLE_GRAVITY * PARTICLE_FRAME_DELTA;
        return p.lifetime > 0;
      });

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

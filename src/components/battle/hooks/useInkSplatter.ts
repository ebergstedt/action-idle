/**
 * Ink Splatter Hook
 *
 * Spawns ink splatter particles when units die.
 * Creates a hand-drawn aesthetic with sepia ink spots on the parchment.
 */

import { useRef, useCallback } from 'react';
import type { UnitRenderData } from '../../../core/battle';
import {
  INK_SPLATTER_COUNT,
  INK_SPLATTER_SIZE_MIN,
  INK_SPLATTER_SIZE_MAX,
  INK_SPLATTER_SPREAD,
  INK_SPLATTER_LIFETIME,
  INK_HIT_SPLATTER_COUNT,
  INK_HIT_SPLATTER_SIZE_MIN,
  INK_HIT_SPLATTER_SIZE_MAX,
  INK_HIT_SPLATTER_DISTANCE,
  INK_HIT_SPLATTER_SPREAD,
  INK_HIT_SPLATTER_SPEED,
  INK_SPLATTER_GRAVITY,
} from '../../../core/battle/BattleConfig';

/**
 * Generate a random number with approximately normal distribution.
 * Uses Box-Muller transform. Returns value centered around 0 with stdDev of 1.
 */
function randomNormal(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Generate a random multiplier with normal distribution.
 * Mean of 0.8, with rare high values for far-flying splatters.
 * Clamped to minimum of 0.3 to avoid negative/tiny values.
 */
function randomSpeedMultiplier(): number {
  // Normal distribution centered at 0.8 with stdDev of 0.25
  // ~68% between 0.55-1.05 (close), ~95% between 0.3-1.3, rare outliers go further
  const multiplier = 0.8 + randomNormal() * 0.25;
  return Math.max(0.3, multiplier);
}

/**
 * Ink splatter particle - can be in-flight or landed.
 */
export interface InkSplatter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  lifetime: number;
  maxLifetime: number;
  landed: boolean;
  targetY: number; // Y position where splatter lands
}

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
  const deadUnitsRef = useRef<Set<string>>(new Set());
  const prevHealthRef = useRef<Map<string, number>>(new Map());
  const wasStartedRef = useRef(false);

  const clearSplatters = useCallback(() => {
    splattersRef.current = [];
    deadUnitsRef.current.clear();
    prevHealthRef.current.clear();
  }, []);

  const updateSplatters = useCallback(
    (units: UnitRenderData[], hasStarted: boolean, delta: number): InkSplatter[] => {
      // Clear splatters when game resets (hasStarted goes from true to false)
      if (wasStartedRef.current && !hasStarted) {
        clearSplatters();
      }
      wasStartedRef.current = hasStarted;

      for (const unit of units) {
        const prevHealth = prevHealthRef.current.get(unit.id);
        const isDying = unit.deathFadeTimer >= 0;
        const wasAlreadyDead = deadUnitsRef.current.has(unit.id);

        // Check for hit (health decreased) - spawn directional splatters with velocity
        if (prevHealth !== undefined && unit.health < prevHealth && !isDying) {
          // Determine splatter direction from visualOffset (knockback direction)
          const offsetX = unit.visualOffset?.x ?? 0;
          const offsetY = unit.visualOffset?.y ?? 0;
          const offsetMag = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

          let baseAngle: number;
          if (offsetMag > 0.1) {
            // Splatter in the direction of knockback (away from attacker)
            baseAngle = Math.atan2(offsetY, offsetX);
          } else {
            // No clear direction, use random
            baseAngle = Math.random() * Math.PI * 2;
          }

          // Spawn hit splatters as projectiles
          for (let i = 0; i < INK_HIT_SPLATTER_COUNT; i++) {
            const angle = baseAngle + (Math.random() - 0.5) * INK_HIT_SPLATTER_SPREAD;
            // Normal distribution: most land close, some fly far
            const speedMultiplier = randomSpeedMultiplier();
            const speed = INK_HIT_SPLATTER_SPEED * speedMultiplier;
            const targetDistance = INK_HIT_SPLATTER_DISTANCE * speedMultiplier;

            splattersRef.current.push({
              x: unit.position.x,
              y: unit.position.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 70, // Upward arc
              size:
                INK_HIT_SPLATTER_SIZE_MIN +
                Math.random() * (INK_HIT_SPLATTER_SIZE_MAX - INK_HIT_SPLATTER_SIZE_MIN),
              rotation: Math.random() * Math.PI * 2,
              lifetime: INK_SPLATTER_LIFETIME,
              maxLifetime: INK_SPLATTER_LIFETIME,
              landed: false,
              targetY: unit.position.y + Math.sin(angle) * targetDistance + 10,
            });
          }
        }

        // Check for death - spawn large splatters (already landed)
        if (isDying && !wasAlreadyDead) {
          deadUnitsRef.current.add(unit.id);

          for (let i = 0; i < INK_SPLATTER_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * INK_SPLATTER_SPREAD;

            splattersRef.current.push({
              x: unit.position.x + Math.cos(angle) * distance,
              y: unit.position.y + Math.sin(angle) * distance,
              vx: 0,
              vy: 0,
              size:
                INK_SPLATTER_SIZE_MIN +
                Math.random() * (INK_SPLATTER_SIZE_MAX - INK_SPLATTER_SIZE_MIN),
              rotation: Math.random() * Math.PI * 2,
              lifetime: INK_SPLATTER_LIFETIME,
              maxLifetime: INK_SPLATTER_LIFETIME,
              landed: true,
              targetY: unit.position.y,
            });
          }
        }

        // Update previous health
        prevHealthRef.current.set(unit.id, unit.health);
      }

      // Update physics for in-flight splatters
      for (const splatter of splattersRef.current) {
        if (!splatter.landed) {
          // Apply velocity
          splatter.x += splatter.vx * delta;
          splatter.y += splatter.vy * delta;

          // Apply gravity
          splatter.vy += INK_SPLATTER_GRAVITY * delta;

          // Check if landed (reached target Y or falling down past it)
          if (splatter.vy > 0 && splatter.y >= splatter.targetY) {
            splatter.landed = true;
            splatter.y = splatter.targetY;
            splatter.vx = 0;
            splatter.vy = 0;
          }
        }
      }

      // Clean up units that are no longer in the array
      const currentUnitIds = new Set(units.map((u) => u.id));
      for (const id of deadUnitsRef.current) {
        if (!currentUnitIds.has(id)) {
          deadUnitsRef.current.delete(id);
        }
      }
      for (const id of prevHealthRef.current.keys()) {
        if (!currentUnitIds.has(id)) {
          prevHealthRef.current.delete(id);
        }
      }

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

/**
 * Ink Splatter Hook
 *
 * Spawns ink splatter particles when units die.
 * Creates a hand-drawn aesthetic with sepia ink spots on the parchment.
 */

import { useRef, useCallback, useEffect } from 'react';
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
  INK_HIT_SPLATTER_UPWARD_VELOCITY,
  INK_SPLATTER_GRAVITY,
  INK_SPEED_MULTIPLIER_MEAN,
  INK_SPEED_MULTIPLIER_STDDEV,
  INK_SPEED_MULTIPLIER_MIN,
  INK_KNOCKBACK_DIRECTION_THRESHOLD,
} from '../../../core/battle/BattleConfig';
import { randomMultiplier } from '../../../core/utils/Random';

/**
 * Generate a random speed multiplier with normal distribution.
 * Uses configured mean with rare high values for far-flying splatters.
 */
function randomSpeedMultiplier(): number {
  return randomMultiplier(
    INK_SPEED_MULTIPLIER_MEAN,
    INK_SPEED_MULTIPLIER_STDDEV,
    INK_SPEED_MULTIPLIER_MIN
  );
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
    wasStartedRef.current = false;
  }, []);

  // Clean up on unmount to prevent memory leaks
  useEffect(() => {
    // Capture refs at effect time for safe cleanup
    const splatters = splattersRef;
    const deadUnits = deadUnitsRef;
    const prevHealth = prevHealthRef;
    return () => {
      splatters.current = [];
      deadUnits.current.clear();
      prevHealth.current.clear();
    };
  }, []);

  const updateSplatters = useCallback(
    (units: UnitRenderData[], hasStarted: boolean, delta: number): InkSplatter[] => {
      // Clear splatters when game resets (hasStarted transitions from true to false)
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
          if (offsetMag > INK_KNOCKBACK_DIRECTION_THRESHOLD) {
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
              vy: Math.sin(angle) * speed + INK_HIT_SPLATTER_UPWARD_VELOCITY,
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

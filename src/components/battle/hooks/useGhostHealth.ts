/**
 * Ghost Health Hook
 *
 * Tracks ghost health for damage visualization.
 * Ghost health shows a trailing red bar that slowly catches up to actual health.
 */

import { useRef, useCallback } from 'react';
import type { UnitRenderData } from '../../../core/battle';
import {
  GHOST_HEALTH_DECAY_RATE,
  GHOST_HEALTH_SNAP_THRESHOLD,
} from '../../../core/battle/BattleConfig';

/**
 * Ghost health state for a single unit.
 */
interface GhostHealthState {
  ghostHealth: number;
  lastHealth: number;
}

/**
 * Hook to manage ghost health state for all units.
 * Returns a function to update ghost health and the current ghost health map.
 */
export function useGhostHealth(): {
  getGhostHealth: (unit: UnitRenderData) => number;
  updateGhostHealth: (units: UnitRenderData[]) => Map<string, number>;
  cleanupRemovedUnits: (currentUnitIds: Set<string>) => void;
} {
  const ghostHealthRef = useRef<Map<string, GhostHealthState>>(new Map());

  const cleanupRemovedUnits = useCallback((currentUnitIds: Set<string>) => {
    for (const id of ghostHealthRef.current.keys()) {
      if (!currentUnitIds.has(id)) {
        ghostHealthRef.current.delete(id);
      }
    }
  }, []);

  const getGhostHealth = useCallback((unit: UnitRenderData): number => {
    const ghostState = ghostHealthRef.current.get(unit.id);

    if (!ghostState) {
      // New unit - initialize ghost health to current health
      ghostHealthRef.current.set(unit.id, {
        ghostHealth: unit.health,
        lastHealth: unit.health,
      });
      return unit.health;
    }

    if (unit.health < ghostState.lastHealth) {
      // Damage taken - ghost stays at previous health, will decay
      ghostHealthRef.current.set(unit.id, {
        ghostHealth: ghostState.ghostHealth,
        lastHealth: unit.health,
      });
      return ghostState.ghostHealth;
    }

    if (unit.health > ghostState.lastHealth) {
      // Healed - snap ghost to current health
      ghostHealthRef.current.set(unit.id, {
        ghostHealth: unit.health,
        lastHealth: unit.health,
      });
      return unit.health;
    }

    // No health change - decay ghost toward current
    const diff = ghostState.ghostHealth - unit.health;
    if (diff > GHOST_HEALTH_SNAP_THRESHOLD) {
      const newGhostHealth = ghostState.ghostHealth - diff * GHOST_HEALTH_DECAY_RATE;
      ghostHealthRef.current.set(unit.id, {
        ghostHealth: newGhostHealth,
        lastHealth: unit.health,
      });
      return newGhostHealth;
    }

    // Close enough - snap to current
    ghostHealthRef.current.set(unit.id, {
      ghostHealth: unit.health,
      lastHealth: unit.health,
    });
    return unit.health;
  }, []);

  const updateGhostHealth = useCallback(
    (units: UnitRenderData[]): Map<string, number> => {
      const result = new Map<string, number>();

      // Cleanup removed units first
      const currentUnitIds = new Set(units.map((u) => u.id));
      cleanupRemovedUnits(currentUnitIds);

      // Update ghost health for all units
      for (const unit of units) {
        result.set(unit.id, getGhostHealth(unit));
      }

      return result;
    },
    [getGhostHealth, cleanupRemovedUnits]
  );

  return {
    getGhostHealth,
    updateGhostHealth,
    cleanupRemovedUnits,
  };
}

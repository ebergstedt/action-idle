/**
 * Ghost Health Hook
 *
 * React integration layer for the ghost health system.
 * Delegates calculation logic to core module.
 *
 * SRP: Only manages React state, delegates logic to core.
 */

import { useRef, useCallback } from 'react';
import type { UnitRenderData } from '../../../core/battle';
import {
  processGhostHealth,
  calculateGhostHealth,
  createGhostHealthMap,
  type GhostHealthMap,
} from '../../../core/battle/visuals';

/**
 * Hook to manage ghost health state for all units.
 * Returns a function to update ghost health and the current ghost health map.
 */
export function useGhostHealth(): {
  getGhostHealth: (unit: UnitRenderData) => number;
  updateGhostHealth: (units: UnitRenderData[]) => Map<string, number>;
  cleanupRemovedUnits: (currentUnitIds: Set<string>) => void;
} {
  const ghostHealthRef = useRef<GhostHealthMap>(createGhostHealthMap());

  const cleanupRemovedUnits = useCallback((currentUnitIds: Set<string>) => {
    for (const id of ghostHealthRef.current.keys()) {
      if (!currentUnitIds.has(id)) {
        ghostHealthRef.current.delete(id);
      }
    }
  }, []);

  const getGhostHealth = useCallback((unit: UnitRenderData): number => {
    const ghostState = ghostHealthRef.current.get(unit.id);
    const { ghostHealth, newState } = calculateGhostHealth(unit, ghostState);
    ghostHealthRef.current.set(unit.id, newState);
    return ghostHealth;
  }, []);

  const updateGhostHealth = useCallback((units: UnitRenderData[]): Map<string, number> => {
    return processGhostHealth(units, ghostHealthRef.current);
  }, []);

  return {
    getGhostHealth,
    updateGhostHealth,
    cleanupRemovedUnits,
  };
}

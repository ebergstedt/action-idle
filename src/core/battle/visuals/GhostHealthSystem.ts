/**
 * Ghost Health System
 *
 * Core logic for ghost health calculation (damage visualization).
 * Ghost health shows a trailing red bar that slowly catches up to actual health.
 *
 * Godot-portable: Uses pure functions and simple data structures.
 */

import { GHOST_HEALTH_DECAY_RATE, GHOST_HEALTH_SNAP_THRESHOLD } from '../BattleConfig';

/**
 * Ghost health state for a single unit.
 */
export interface GhostHealthState {
  ghostHealth: number;
  lastHealth: number;
}

/**
 * Unit data needed for ghost health calculation.
 */
export interface GhostHealthUnit {
  id: string;
  health: number;
}

/**
 * State for tracking ghost health for all units.
 */
export type GhostHealthMap = Map<string, GhostHealthState>;

/**
 * Create initial ghost health map.
 */
export function createGhostHealthMap(): GhostHealthMap {
  return new Map();
}

/**
 * Calculate ghost health for a unit.
 * Returns the ghost health value to display.
 */
export function calculateGhostHealth(
  unit: GhostHealthUnit,
  ghostState: GhostHealthState | undefined
): { ghostHealth: number; newState: GhostHealthState } {
  if (!ghostState) {
    // New unit - initialize ghost health to current health
    return {
      ghostHealth: unit.health,
      newState: {
        ghostHealth: unit.health,
        lastHealth: unit.health,
      },
    };
  }

  if (unit.health < ghostState.lastHealth) {
    // Damage taken - ghost stays at previous health, will decay
    return {
      ghostHealth: ghostState.ghostHealth,
      newState: {
        ghostHealth: ghostState.ghostHealth,
        lastHealth: unit.health,
      },
    };
  }

  if (unit.health > ghostState.lastHealth) {
    // Healed - snap ghost to current health
    return {
      ghostHealth: unit.health,
      newState: {
        ghostHealth: unit.health,
        lastHealth: unit.health,
      },
    };
  }

  // No health change - decay ghost toward current
  const diff = ghostState.ghostHealth - unit.health;
  if (diff > GHOST_HEALTH_SNAP_THRESHOLD) {
    const newGhostHealth = ghostState.ghostHealth - diff * GHOST_HEALTH_DECAY_RATE;
    return {
      ghostHealth: newGhostHealth,
      newState: {
        ghostHealth: newGhostHealth,
        lastHealth: unit.health,
      },
    };
  }

  // Close enough - snap to current
  return {
    ghostHealth: unit.health,
    newState: {
      ghostHealth: unit.health,
      lastHealth: unit.health,
    },
  };
}

/**
 * Update ghost health for all units and return display values.
 */
export function processGhostHealth(
  units: GhostHealthUnit[],
  stateMap: GhostHealthMap
): Map<string, number> {
  const result = new Map<string, number>();

  // Cleanup removed units first
  const currentUnitIds = new Set(units.map((u) => u.id));
  for (const id of stateMap.keys()) {
    if (!currentUnitIds.has(id)) {
      stateMap.delete(id);
    }
  }

  // Update ghost health for all units
  for (const unit of units) {
    const ghostState = stateMap.get(unit.id);
    const { ghostHealth, newState } = calculateGhostHealth(unit, ghostState);
    stateMap.set(unit.id, newState);
    result.set(unit.id, ghostHealth);
  }

  return result;
}

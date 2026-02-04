/**
 * Assembly Manager
 *
 * Pure functions for managing Assembly state.
 * Godot-portable: No React/browser dependencies.
 */

import { BattleUpgradeRegistry } from '../battle/upgrades/BattleUpgradeRegistry';
import { UpgradePrerequisiteContext } from '../battle/upgrades/types';
import { AssemblyState, SerializedAssemblyState, ASSEMBLY_STATE_VERSION } from './AssemblyState';

/**
 * Creates the initial assembly state.
 */
export function createInitialState(registry: BattleUpgradeRegistry): AssemblyState {
  return {
    gold: 0,
    upgradeStates: registry.createInitialStates(),
    selectedUnitType: null,
    highestWave: 1,
  };
}

/**
 * Checks if the player can afford a given cost.
 */
export function canAfford(state: AssemblyState, cost: number): boolean {
  return state.gold >= cost;
}

/**
 * Adds gold to the state.
 * Returns a new state object (pure function).
 */
export function addGold(state: AssemblyState, amount: number): AssemblyState {
  if (amount <= 0) return state;
  return {
    ...state,
    gold: state.gold + amount,
  };
}

/**
 * Subtracts gold from the state.
 * Returns a new state object (pure function).
 * Does not allow negative gold.
 */
export function subtractGold(state: AssemblyState, amount: number): AssemblyState {
  if (amount <= 0) return state;
  return {
    ...state,
    gold: Math.max(0, state.gold - amount),
  };
}

/**
 * Updates the highest wave reached.
 * Returns a new state object (pure function).
 */
export function updateHighestWave(state: AssemblyState, wave: number): AssemblyState {
  if (wave <= state.highestWave) return state;
  return {
    ...state,
    highestWave: wave,
  };
}

/**
 * Selects a unit type for viewing upgrades.
 * Returns a new state object (pure function).
 */
export function selectUnitType(state: AssemblyState, unitType: string | null): AssemblyState {
  if (state.selectedUnitType === unitType) return state;
  return {
    ...state,
    selectedUnitType: unitType,
  };
}

/**
 * Purchases an upgrade if affordable.
 * Returns a new state object with updated gold and upgrade level.
 * Returns the same state if the purchase cannot be made.
 */
export function purchaseUpgrade(
  state: AssemblyState,
  registry: BattleUpgradeRegistry,
  upgradeId: string
): AssemblyState {
  const currentLevel = registry.getLevel(state.upgradeStates, upgradeId);

  // Build prerequisite context
  const context = buildPrerequisiteContext(state);

  // Calculate cost and check if purchasable
  const costResult = registry.calculateCost(upgradeId, currentLevel, context, state.gold);

  if (!costResult.canPurchase) {
    return state;
  }

  // Apply the upgrade and deduct gold
  const newUpgradeStates = registry.applyUpgrade(state.upgradeStates, upgradeId, costResult.cost);

  return {
    ...state,
    gold: state.gold - costResult.cost,
    upgradeStates: newUpgradeStates,
  };
}

/**
 * Builds the prerequisite context from the current state.
 */
export function buildPrerequisiteContext(state: AssemblyState): UpgradePrerequisiteContext {
  // Convert upgrade states to levels map
  const upgradeLevels: Record<string, number> = {};
  for (const [id, upgradeState] of Object.entries(state.upgradeStates)) {
    upgradeLevels[id] = upgradeState.level;
  }

  return {
    upgradeLevels,
    waveNumber: state.highestWave,
    unitCounts: {}, // Unit counts are not tracked in assembly state
  };
}

/**
 * Serializes assembly state for persistence.
 */
export function serializeState(state: AssemblyState): SerializedAssemblyState {
  return {
    gold: state.gold,
    upgradeStates: state.upgradeStates,
    highestWave: state.highestWave,
    version: ASSEMBLY_STATE_VERSION,
  };
}

/**
 * Deserializes assembly state from persistence.
 * Merges with current registry to handle new upgrades.
 */
export function deserializeState(
  data: SerializedAssemblyState,
  registry: BattleUpgradeRegistry
): AssemblyState {
  // Start with initial state to ensure all upgrades exist
  const initialStates = registry.createInitialStates();

  // Merge saved states with initial (preserves any new upgrades added)
  const mergedUpgradeStates = { ...initialStates };
  for (const [id, savedState] of Object.entries(data.upgradeStates)) {
    if (mergedUpgradeStates[id]) {
      mergedUpgradeStates[id] = savedState;
    }
  }

  return {
    gold: data.gold ?? 0,
    upgradeStates: mergedUpgradeStates,
    selectedUnitType: null,
    highestWave: data.highestWave ?? 1,
  };
}

/**
 * Validates serialized state structure.
 */
export function isValidSerializedState(data: unknown): data is SerializedAssemblyState {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.gold === 'number' &&
    typeof obj.upgradeStates === 'object' &&
    obj.upgradeStates !== null &&
    typeof obj.highestWave === 'number' &&
    typeof obj.version === 'number'
  );
}

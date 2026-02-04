/**
 * Assembly State Interface
 *
 * Defines the state for the Assembly menu where players purchase upgrades.
 * Godot-portable: No React/browser dependencies.
 */

import { BattleUpgradeStates } from '../battle/upgrades/types';

/**
 * Assembly state - persisted between sessions.
 */
export interface AssemblyState {
  /** Currency earned from battles */
  vest: number;

  /** All upgrade purchase states */
  upgradeStates: BattleUpgradeStates;

  /** Currently selected unit type in the UI (not persisted) */
  selectedUnitType: string | null;

  /** Highest wave reached (for prerequisite checks) */
  highestWave: number;
}

/**
 * Serializable version of AssemblyState for persistence.
 * Excludes transient UI state like selectedUnitType.
 */
export interface SerializedAssemblyState {
  vest: number;
  upgradeStates: BattleUpgradeStates;
  highestWave: number;
  version: number;
}

/** Current save format version */
export const ASSEMBLY_STATE_VERSION = 1;

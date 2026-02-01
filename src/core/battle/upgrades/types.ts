/**
 * Battle Upgrade System Types
 *
 * Defines upgrades that affect battle units through modifiers and abilities.
 * Separate from the economy upgrade system (src/core/engine).
 *
 * Godot-portable: No React/browser dependencies.
 */

import { Modifier } from '../modifiers/types';

/**
 * Scope of an upgrade - what it affects.
 */
export type UpgradeScope =
  | 'global' // Affects all units
  | 'unit_type' // Affects a specific unit type (e.g., 'warrior')
  | 'unit_category'; // Affects a category (e.g., 'infantry')

/**
 * What type of effect the upgrade provides.
 */
export type UpgradeType =
  | 'stat_modifier' // Adds stat modifiers
  | 'ability_grant' // Grants an ability
  | 'unlock_unit'; // Unlocks a new unit type

/**
 * Prerequisite for purchasing an upgrade.
 */
export interface UpgradePrerequisite {
  type: 'upgrade' | 'wave' | 'unit_count';

  /** ID of required upgrade, or wave number as string */
  targetId: string;

  /** For 'upgrade': minimum level required */
  level?: number;

  /** For 'unit_count': how many units of the type */
  count?: number;
}

/**
 * Battle Upgrade Definition - loaded from JSON.
 */
export interface BattleUpgradeDefinition {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Description for tooltips */
  description: string;

  /** What this upgrade affects */
  scope: UpgradeScope;

  /** For non-global: the unit type or category ID */
  targetId?: string;

  /** What type of upgrade this is */
  upgradeType: UpgradeType;

  /** For stat_modifier: the modifiers to apply per level */
  modifiers?: Modifier[];

  /** For ability_grant: the ability ID to grant */
  abilityId?: string;

  /** For unlock_unit: the unit ID to unlock */
  unlockUnitId?: string;

  /** Base cost in currency */
  baseCost: number;

  /** Cost multiplier per level */
  costMultiplier: number;

  /** Maximum level (0 = unlimited) */
  maxLevel: number;

  /** Prerequisites to purchase */
  prerequisites: UpgradePrerequisite[];

  /** Icon identifier for UI */
  icon?: string;
}

/**
 * Runtime state of an upgrade.
 */
export interface BattleUpgradeState {
  /** Reference to upgrade definition ID */
  upgradeId: string;

  /** Current level (0 = not purchased) */
  level: number;

  /** Total currency spent on this upgrade */
  totalSpent: number;
}

/**
 * Collection of all upgrade states.
 */
export interface BattleUpgradeStates {
  [upgradeId: string]: BattleUpgradeState;
}

/**
 * Result of calculating upgrade cost.
 */
export interface UpgradeCostResult {
  /** Cost for the next level */
  cost: number;

  /** Whether the upgrade can be purchased (prerequisites met, not maxed) */
  canPurchase: boolean;

  /** Reason if can't purchase */
  reason?: 'max_level' | 'prerequisite_not_met' | 'insufficient_funds';

  /** Missing prerequisite details if applicable */
  missingPrerequisite?: {
    type: UpgradePrerequisite['type'];
    targetId: string;
    required: number;
    current: number;
  };
}

/**
 * Context for checking upgrade prerequisites.
 */
export interface UpgradePrerequisiteContext {
  /** Current upgrade levels */
  upgradeLevels: Record<string, number>;

  /** Current wave number */
  waveNumber: number;

  /** Unit counts by type */
  unitCounts: Record<string, number>;
}

/**
 * Computed modifiers from all purchased upgrades for a specific unit.
 */
export interface ComputedUpgradeModifiers {
  /** Unit type this is for */
  unitType: string;

  /** All modifiers that apply */
  modifiers: Modifier[];

  /** Ability IDs granted by upgrades */
  grantedAbilities: string[];
}

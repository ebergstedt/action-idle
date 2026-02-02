/**
 * Battle Upgrade Registry Interface
 *
 * Defines the contract for upgrade definition lookup.
 * Implementations can be swapped for Godot (Resource-based).
 *
 * Godot-portable: Interface only, no dependencies.
 */

import {
  BattleUpgradeDefinition,
  BattleUpgradeStates,
  UpgradeCostResult,
  UpgradePrerequisiteContext,
  UpgradeScope,
} from './types';

/**
 * Interface for battle upgrade definition registry.
 * Provides lookup, filtering, and cost calculation.
 */
export interface IBattleUpgradeRegistry {
  /**
   * Gets an upgrade definition by ID.
   * @throws Error if not found
   */
  get(id: string): BattleUpgradeDefinition;

  /**
   * Gets an upgrade definition by ID, or undefined if not found.
   */
  tryGet(id: string): BattleUpgradeDefinition | undefined;

  /**
   * Checks if an upgrade definition exists.
   */
  has(id: string): boolean;

  /**
   * Gets all upgrade definitions.
   */
  getAll(): BattleUpgradeDefinition[];

  /**
   * Gets upgrade definitions by scope.
   */
  getByScope(scope: UpgradeScope): BattleUpgradeDefinition[];

  /**
   * Gets upgrade definitions that target a specific unit type or category.
   */
  getByTarget(targetId: string): BattleUpgradeDefinition[];

  /**
   * Gets all upgrades that affect a given unit type.
   * Includes global, unit_type (exact match), and unit_category (category match).
   */
  getUpgradesForUnit(unitType: string, unitCategory: string): BattleUpgradeDefinition[];

  /**
   * Calculates the cost of the next level of an upgrade.
   */
  calculateCost(
    upgradeId: string,
    currentLevel: number,
    context: UpgradePrerequisiteContext,
    currency: number
  ): UpgradeCostResult;

  /**
   * Creates initial upgrade states for all upgrades.
   */
  createInitialStates(): BattleUpgradeStates;

  /**
   * Applies a level-up to an upgrade state.
   */
  applyUpgrade(states: BattleUpgradeStates, upgradeId: string, cost: number): BattleUpgradeStates;

  /**
   * Gets the current level of an upgrade from states.
   */
  getLevel(states: BattleUpgradeStates, upgradeId: string): number;
}

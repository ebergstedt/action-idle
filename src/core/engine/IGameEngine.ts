/**
 * Game Engine Interface
 *
 * Defines the contract for the idle game engine.
 * Godot implements this interface for the economy system.
 *
 * Godot equivalent: Autoload singleton or main game node.
 */

import { Decimal } from '../utils/BigNumber';
import { GameState } from '../types/GameState';
import { UpgradeDefinition } from '../types/Upgrade';

/**
 * Core game engine interface.
 * All time-based calculations use explicit delta parameter.
 */
export interface IGameEngine {
  /**
   * Process a game tick.
   * Godot: Called from _process(delta)
   *
   * @param delta - Time elapsed in seconds
   */
  tick(delta: number): void;

  /**
   * Attempt to purchase an upgrade.
   * @returns true if purchase was successful
   */
  purchaseUpgrade(upgradeId: string): boolean;

  /**
   * Get the current cost of an upgrade.
   */
  getUpgradeCost(upgradeId: string): Decimal;

  /**
   * Get the total production per second.
   */
  getProductionPerSecond(): Decimal;

  /**
   * Get a read-only copy of the current state.
   */
  getState(): Readonly<GameState>;

  /**
   * Replace the current state (used for loading saves).
   */
  setState(state: GameState): void;

  /**
   * Get all upgrade definitions.
   */
  getUpgradeDefinitions(): readonly UpgradeDefinition[];

  /**
   * Add currency directly (e.g., from manual clicks).
   */
  addCurrency(amount: Decimal): void;
}

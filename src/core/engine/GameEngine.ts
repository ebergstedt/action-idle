import { Decimal } from '../utils/BigNumber';
import { GameState, UpgradeState } from '../types/GameState';
import { UpgradeDefinition } from '../types/Upgrade';
import {
  calculateCost,
  calculateTotalProduction,
  calculateCurrencyGain,
  canAffordUpgrade,
} from './Formulas';
import { IGameEngine } from './IGameEngine';

/**
 * The core game engine.
 * Pure TypeScript with no framework dependencies.
 * All time-based calculations use explicit delta parameter.
 *
 * Godot equivalent: Autoload singleton managing economy state.
 */
export class GameEngine implements IGameEngine {
  private state: GameState;
  private upgrades: UpgradeDefinition[];

  constructor(upgrades: UpgradeDefinition[], initialState?: GameState) {
    this.upgrades = upgrades;
    this.state = initialState ?? this.createInitialState();
  }

  /**
   * Creates a fresh game state.
   */
  private createInitialState(): GameState {
    const upgradeStates: Record<string, UpgradeState> = {};
    for (const upgrade of this.upgrades) {
      upgradeStates[upgrade.id] = {
        level: 0,
        unlocked: true, // All upgrades start unlocked for now
      };
    }

    return {
      currency: new Decimal(0),
      totalEarned: new Decimal(0),
      upgrades: upgradeStates,
      lastTick: Date.now(),
    };
  }

  /**
   * Processes a game tick.
   * @param delta - Time elapsed in seconds
   */
  tick(delta: number): void {
    const production = this.getProductionPerSecond();
    const gained = calculateCurrencyGain(production, delta);

    this.state.currency = this.state.currency.add(gained);
    this.state.totalEarned = this.state.totalEarned.add(gained);
    this.state.lastTick = Date.now();
  }

  /**
   * Attempts to purchase an upgrade.
   * @returns true if purchase was successful
   */
  purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.find((u) => u.id === upgradeId);
    if (!upgrade) {
      console.warn(`Upgrade not found: ${upgradeId}`);
      return false;
    }

    const upgradeState = this.state.upgrades[upgradeId];
    if (!upgradeState || !upgradeState.unlocked) {
      return false;
    }

    const cost = this.getUpgradeCost(upgradeId);
    if (!canAffordUpgrade(this.state.currency, cost)) {
      return false;
    }

    this.state.currency = this.state.currency.sub(cost);
    upgradeState.level += 1;

    return true;
  }

  /**
   * Gets the current cost of an upgrade.
   */
  getUpgradeCost(upgradeId: string): Decimal {
    const upgrade = this.upgrades.find((u) => u.id === upgradeId);
    if (!upgrade) {
      return new Decimal(Infinity);
    }

    const level = this.state.upgrades[upgradeId]?.level ?? 0;
    return calculateCost(upgrade.baseCost, upgrade.costMultiplier, level);
  }

  /**
   * Gets the total production per second.
   */
  getProductionPerSecond(): Decimal {
    return calculateTotalProduction(this.state, this.upgrades);
  }

  /**
   * Gets a read-only copy of the current state.
   */
  getState(): Readonly<GameState> {
    return this.state;
  }

  /**
   * Replaces the current state (used for loading saves).
   */
  setState(state: GameState): void {
    this.state = state;
  }

  /**
   * Gets all upgrade definitions.
   */
  getUpgradeDefinitions(): readonly UpgradeDefinition[] {
    return this.upgrades;
  }

  /**
   * Adds currency directly (e.g., from manual clicks).
   */
  addCurrency(amount: Decimal): void {
    this.state.currency = this.state.currency.add(amount);
    this.state.totalEarned = this.state.totalEarned.add(amount);
  }
}

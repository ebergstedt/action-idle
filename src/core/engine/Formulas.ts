import { Decimal } from '../utils/BigNumber';
import { GameState } from '../types/GameState';
import { UpgradeDefinition } from '../types/Upgrade';

/**
 * Calculates the cost of an upgrade at a given level.
 * Formula: Cost = Base * Multiplier^Level
 */
export function calculateCost(baseCost: number, costMultiplier: number, level: number): Decimal {
  return new Decimal(baseCost).mul(new Decimal(costMultiplier).pow(level));
}

/**
 * Calculates the production per second of an upgrade at a given level.
 * Formula: Production = BaseProduction * Level
 */
export function calculateProduction(baseProduction: number, level: number): Decimal {
  return new Decimal(baseProduction).mul(level);
}

/**
 * Calculates the total production per second across all upgrades.
 */
export function calculateTotalProduction(state: GameState, upgrades: UpgradeDefinition[]): Decimal {
  let total = new Decimal(0);

  for (const upgrade of upgrades) {
    const upgradeState = state.upgrades[upgrade.id];
    if (upgradeState && upgradeState.level > 0) {
      total = total.add(calculateProduction(upgrade.baseProduction, upgradeState.level));
    }
  }

  return total;
}

/**
 * Calculates currency gained over a time period (delta).
 * Formula: Gained = ProductionPerSecond * Delta
 */
export function calculateCurrencyGain(productionPerSecond: Decimal, delta: number): Decimal {
  return productionPerSecond.mul(delta);
}

/**
 * Checks if the player can afford an upgrade.
 */
export function canAffordUpgrade(currency: Decimal, cost: Decimal): boolean {
  return currency.gte(cost);
}

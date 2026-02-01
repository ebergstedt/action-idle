/**
 * Battle Data Loader
 *
 * Aggregates and loads all battle-related data into registries.
 */

import { unitRegistry, UnitRegistry } from '../../core/battle/units';
import { abilityRegistry, AbilityRegistry } from '../../core/battle/abilities';
import { battleUpgradeRegistry, BattleUpgradeRegistry } from '../../core/battle/upgrades';

import { unitDefinitions } from '../units';
import { abilityDefinitions } from '../abilities';
import { battleUpgradeDefinitions } from '../battle-upgrades';

/**
 * Initializes all battle registries with data from JSON files.
 * Call this once at application startup.
 */
export function initializeBattleData(): void {
  unitRegistry.registerAll(unitDefinitions);
  abilityRegistry.registerAll(abilityDefinitions);
  battleUpgradeRegistry.registerAll(battleUpgradeDefinitions);
}

/**
 * Creates fresh registry instances with data loaded.
 * Useful for testing or isolated contexts.
 */
export function createBattleRegistries(): {
  units: UnitRegistry;
  abilities: AbilityRegistry;
  upgrades: BattleUpgradeRegistry;
} {
  const units = new UnitRegistry();
  const abilities = new AbilityRegistry();
  const upgrades = new BattleUpgradeRegistry();

  units.registerAll(unitDefinitions);
  abilities.registerAll(abilityDefinitions);
  upgrades.registerAll(battleUpgradeDefinitions);

  return { units, abilities, upgrades };
}

// Re-export singleton instances for convenience
export { unitRegistry, abilityRegistry, battleUpgradeRegistry };

// Re-export definitions for direct access
export { unitDefinitions } from '../units';
export { abilityDefinitions } from '../abilities';
export { battleUpgradeDefinitions } from '../battle-upgrades';

/**
 * Battle Data Loader
 *
 * Aggregates and loads all battle-related data into registries.
 * This is the application layer that creates singleton instances.
 * Core modules only export classes, not instances.
 */

import { UnitRegistry } from '../../core/battle/units';
import { AbilityRegistry } from '../../core/battle/abilities';
import { BattleUpgradeRegistry } from '../../core/battle/upgrades';

import { unitDefinitions } from '../units';
import { abilityDefinitions } from '../abilities';
import { battleUpgradeDefinitions } from '../battle-upgrades';

// Application-level singleton instances (created in data layer, not core)
export const unitRegistry = new UnitRegistry();
export const abilityRegistry = new AbilityRegistry();
export const battleUpgradeRegistry = new BattleUpgradeRegistry();

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

// Re-export definitions for direct access
export { unitDefinitions } from '../units';
export { abilityDefinitions } from '../abilities';
export { battleUpgradeDefinitions } from '../battle-upgrades';

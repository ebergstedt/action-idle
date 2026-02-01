/**
 * Battle Upgrade Data Loader
 *
 * Aggregates all battle upgrade definitions from JSON files.
 */

import type { BattleUpgradeDefinition } from '../../core/battle/upgrades/types';

import globalUpgrades from './global.json';
import warriorUpgrades from './warrior.json';
import archerUpgrades from './archer.json';
import knightUpgrades from './knight.json';

/**
 * All battle upgrade definitions loaded from JSON.
 */
export const battleUpgradeDefinitions: BattleUpgradeDefinition[] = [
  ...(globalUpgrades as BattleUpgradeDefinition[]),
  ...(warriorUpgrades as BattleUpgradeDefinition[]),
  ...(archerUpgrades as BattleUpgradeDefinition[]),
  ...(knightUpgrades as BattleUpgradeDefinition[]),
];

/**
 * Battle upgrade definitions indexed by ID for quick lookup.
 */
export const battleUpgradeDefinitionsById: Record<string, BattleUpgradeDefinition> =
  Object.fromEntries(battleUpgradeDefinitions.map((def) => [def.id, def]));

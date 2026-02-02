/**
 * Battle Upgrade Data Loader
 *
 * Aggregates all battle upgrade definitions from JSON files.
 */

import type { BattleUpgradeDefinition } from '../../core/battle/upgrades/types';

import globalUpgrades from './global.json';
import houndUpgrades from './hound.json';
import fangUpgrades from './fang.json';
import crawlerUpgrades from './crawler.json';

/**
 * All battle upgrade definitions loaded from JSON.
 */
export const battleUpgradeDefinitions: BattleUpgradeDefinition[] = [
  ...(globalUpgrades as BattleUpgradeDefinition[]),
  ...(houndUpgrades as BattleUpgradeDefinition[]),
  ...(fangUpgrades as BattleUpgradeDefinition[]),
  ...(crawlerUpgrades as BattleUpgradeDefinition[]),
];

/**
 * Battle upgrade definitions indexed by ID for quick lookup.
 */
export const battleUpgradeDefinitionsById: Record<string, BattleUpgradeDefinition> =
  Object.fromEntries(battleUpgradeDefinitions.map((def) => [def.id, def]));

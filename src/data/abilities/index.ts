/**
 * Ability Data Loader
 *
 * Aggregates all ability definitions from JSON files.
 */

import type { AbilityDefinition } from '../../core/battle/abilities/types';

import commonAbilities from './common.json';

/**
 * All ability definitions loaded from JSON.
 */
export const abilityDefinitions: AbilityDefinition[] = commonAbilities as AbilityDefinition[];

/**
 * Ability definitions indexed by ID for quick lookup.
 */
export const abilityDefinitionsById: Record<string, AbilityDefinition> = Object.fromEntries(
  abilityDefinitions.map((def) => [def.id, def])
);

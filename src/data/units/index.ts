/**
 * Unit Data Loader
 *
 * Aggregates all unit definitions from JSON files.
 */

import type { UnitDefinition } from '../../core/battle/units/types';

import warriorData from './warrior.json';
import archerData from './archer.json';
import knightData from './knight.json';

/**
 * All unit definitions loaded from JSON.
 */
export const unitDefinitions: UnitDefinition[] = [
  warriorData as UnitDefinition,
  archerData as UnitDefinition,
  knightData as UnitDefinition,
];

/**
 * Unit definitions indexed by ID for quick lookup.
 */
export const unitDefinitionsById: Record<string, UnitDefinition> = Object.fromEntries(
  unitDefinitions.map((def) => [def.id, def])
);

/**
 * Unit Data Loader
 *
 * Aggregates all unit definitions from JSON files.
 */

import type { UnitDefinition } from '../../core/battle/units/types';

import houndData from './hound.json';
import fangData from './fang.json';
import crawlerData from './crawler.json';
import arclightData from './arclight.json';
import marksmanData from './marksman.json';
import voidEyeData from './void_eye.json';
import castleData from './castle.json';

/**
 * All unit definitions loaded from JSON.
 * Includes both mobile units and stationary units (castles).
 */
export const unitDefinitions: UnitDefinition[] = [
  houndData as UnitDefinition,
  fangData as UnitDefinition,
  crawlerData as UnitDefinition,
  arclightData as UnitDefinition,
  marksmanData as UnitDefinition,
  voidEyeData as UnitDefinition,
  castleData as UnitDefinition,
];

/**
 * Unit definitions indexed by ID for quick lookup.
 */
export const unitDefinitionsById: Record<string, UnitDefinition> = Object.fromEntries(
  unitDefinitions.map((def) => [def.id, def])
);

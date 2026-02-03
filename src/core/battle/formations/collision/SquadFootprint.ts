/**
 * Squad Footprint Calculation
 *
 * Calculates the bounding box (footprint) of a squad for collision detection.
 * Includes padding for spacing between squads.
 */

import {
  BASE_SQUAD_UNIT_SPACING,
  SQUAD_MAX_COLUMNS,
  BASE_SQUAD_PADDING_H,
  BASE_SQUAD_PADDING_V,
  scaleValue,
} from '../../BattleConfig';
import { UnitDefinition } from '../../units/types';
import { SquadFootprint } from '../types';
import { getScaledUnitSize } from '../../types';

/**
 * Calculates the footprint (bounding box) of a squad.
 *
 * The footprint includes:
 * 1. Base dimensions: (cols-1)*spacing + unitSize for each axis
 * 2. Padding: Added to all sides for spacing between squads
 *
 * @param definition - Unit definition containing squadSize and visuals.baseSize
 * @param arenaHeight - Current arena height for scaling calculations
 * @returns Footprint with padding included
 */
export function calculateSquadFootprint(
  definition: UnitDefinition,
  arenaHeight: number
): SquadFootprint {
  const squadSize = definition.baseStats.squadSize ?? 1;
  const spacing = scaleValue(BASE_SQUAD_UNIT_SPACING, arenaHeight);
  const unitGridCols = definition.unitGridSize?.cols ?? 1;
  const unitSize = getScaledUnitSize(unitGridCols, arenaHeight);
  const paddingH = scaleValue(BASE_SQUAD_PADDING_H, arenaHeight);
  const paddingV = scaleValue(BASE_SQUAD_PADDING_V, arenaHeight);

  if (squadSize <= 1) {
    // Single unit: just unit size plus padding on all sides
    return {
      width: unitSize + paddingH * 2,
      height: unitSize + paddingV * 2,
    };
  }

  const cols = Math.min(squadSize, SQUAD_MAX_COLUMNS);
  const rows = Math.ceil(squadSize / cols);

  // Squad bounds: from center of top-left unit to center of bottom-right unit, plus unit radius
  // Then add padding on all sides for spacing between squads
  const baseWidth = (cols - 1) * spacing + unitSize;
  const baseHeight = (rows - 1) * spacing + unitSize;

  return {
    width: baseWidth + paddingH * 2,
    height: baseHeight + paddingV * 2,
  };
}

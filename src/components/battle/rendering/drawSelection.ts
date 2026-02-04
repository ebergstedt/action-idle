/**
 * Selection Drawing Functions
 *
 * Renders box selection rectangle and squad selection outlines.
 * Extracted from BattleCanvas for better organization.
 */

import { ARENA_COLORS } from '../../../core/theme/colors';
import type { UnitRenderData } from '../../../core/battle/types';

/**
 * Selection box bounds.
 */
export interface SelectionBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Draw box selection rectangle (for marquee/drag selection).
 */
export function drawSelectionBox(ctx: CanvasRenderingContext2D, box: SelectionBox): void {
  const width = box.maxX - box.minX;
  const height = box.maxY - box.minY;

  ctx.save();

  // Semi-transparent fill
  ctx.fillStyle = ARENA_COLORS.boxSelectFill;
  ctx.fillRect(box.minX, box.minY, width, height);

  // Border
  ctx.strokeStyle = ARENA_COLORS.selectionRing;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(box.minX, box.minY, width, height);

  ctx.restore();
}

/**
 * Draw selection outlines around selected squads.
 * Groups selected units by squadId and draws a rectangle based on the squad's grid footprint.
 * Uses the same footprint-based bounds calculation as collision detection for consistency.
 *
 * @param ctx - Canvas rendering context
 * @param units - All units in the battle
 * @param selectedUnitIds - IDs of currently selected units
 * @param isDragging - Whether units are being dragged
 * @param cellSize - Size of each grid cell in pixels (required for grid-aligned outline)
 */
export function drawSquadSelections(
  ctx: CanvasRenderingContext2D,
  units: UnitRenderData[],
  selectedUnitIds: string[],
  isDragging: boolean,
  cellSize: number
): void {
  if (selectedUnitIds.length === 0 || cellSize <= 0) return;

  // Group selected units by squadId
  const squadUnits = new Map<string, UnitRenderData[]>();

  for (const unit of units) {
    if (selectedUnitIds.includes(unit.id)) {
      const squadId = unit.squadId;
      if (!squadUnits.has(squadId)) {
        squadUnits.set(squadId, []);
      }
      squadUnits.get(squadId)!.push(unit);
    }
  }

  ctx.save();

  // Draw selection rectangle for each squad
  for (const [, squadMembers] of squadUnits) {
    if (squadMembers.length === 0) continue;

    // Get footprint from the first unit (all units in squad have same footprint)
    const footprint = squadMembers[0].gridFootprint;

    // Calculate squad centroid from unit positions (same as collision detection)
    let centroidX = 0;
    let centroidY = 0;
    for (const unit of squadMembers) {
      centroidX += unit.position.x + unit.visualOffset.x;
      centroidY += unit.position.y + unit.visualOffset.y;
    }
    centroidX /= squadMembers.length;
    centroidY /= squadMembers.length;

    // Calculate grid position from centroid and footprint (same formula as getFootprintGridPosition)
    const halfCols = footprint.cols / 2;
    const halfRows = footprint.rows / 2;
    const gridCol = Math.floor(centroidX / cellSize - halfCols + 0.5);
    const gridRow = Math.floor(centroidY / cellSize - halfRows + 0.5);

    // Convert to pixel coordinates using footprint dimensions (exact grid alignment)
    const minX = gridCol * cellSize;
    const minY = gridRow * cellSize;
    const width = footprint.cols * cellSize;
    const height = footprint.rows * cellSize;

    // Draw selection rectangle - sharp corners, exact grid size
    ctx.strokeStyle = ARENA_COLORS.selectionRing;
    ctx.lineWidth = isDragging ? 1 : 2;
    ctx.globalAlpha = isDragging ? 0.7 : 1;
    ctx.strokeRect(minX, minY, width, height);
  }

  ctx.restore();
}

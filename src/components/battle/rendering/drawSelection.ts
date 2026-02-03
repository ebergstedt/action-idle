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

    // Find the bounding box of all unit positions (in pixels)
    // Include unit size to get actual bounds, not just center points
    let unitMinX = Infinity;
    let unitMinY = Infinity;
    let unitMaxX = -Infinity;
    let unitMaxY = -Infinity;

    for (const unit of squadMembers) {
      const x = unit.position.x + unit.visualOffset.x;
      const y = unit.position.y + unit.visualOffset.y;
      const halfSize = unit.size;
      unitMinX = Math.min(unitMinX, x - halfSize);
      unitMinY = Math.min(unitMinY, y - halfSize);
      unitMaxX = Math.max(unitMaxX, x + halfSize);
      unitMaxY = Math.max(unitMaxY, y + halfSize);
    }

    // Convert to grid cells and snap to cell boundaries
    // Floor for min (expand outward), Ceil for max (expand outward)
    const gridMinCol = Math.floor(unitMinX / cellSize);
    const gridMinRow = Math.floor(unitMinY / cellSize);
    const gridMaxColRaw = Math.ceil(unitMaxX / cellSize);
    const gridMaxRowRaw = Math.ceil(unitMaxY / cellSize);

    // Ensure minimum 1 cell size in each dimension
    const gridMaxCol = gridMaxColRaw <= gridMinCol ? gridMinCol + 1 : gridMaxColRaw;
    const gridMaxRow = gridMaxRowRaw <= gridMinRow ? gridMinRow + 1 : gridMaxRowRaw;

    // Convert back to pixel coordinates (snapped to grid)
    let minX = gridMinCol * cellSize;
    let minY = gridMinRow * cellSize;
    let maxX = gridMaxCol * cellSize;
    let maxY = gridMaxRow * cellSize;

    // Add small padding around the selection
    const padding = 2;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Draw selection rectangle
    ctx.strokeStyle = ARENA_COLORS.selectionRing;
    ctx.lineWidth = isDragging ? 2 : 3;
    ctx.globalAlpha = isDragging ? 0.7 : 1;

    // Draw rounded rectangle
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(minX + radius, minY);
    ctx.lineTo(maxX - radius, minY);
    ctx.quadraticCurveTo(maxX, minY, maxX, minY + radius);
    ctx.lineTo(maxX, maxY - radius);
    ctx.quadraticCurveTo(maxX, maxY, maxX - radius, maxY);
    ctx.lineTo(minX + radius, maxY);
    ctx.quadraticCurveTo(minX, maxY, minX, maxY - radius);
    ctx.lineTo(minX, minY + radius);
    ctx.quadraticCurveTo(minX, minY, minX + radius, minY);
    ctx.closePath();
    ctx.stroke();

    // Add glow effect
    ctx.shadowColor = ARENA_COLORS.selectionRing;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

/**
 * Selection Drawing Functions
 *
 * Renders box selection rectangle.
 * Extracted from BattleCanvas for better organization.
 */

import { ARENA_COLORS } from '../../../core/theme/colors';

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
 * Draw box selection rectangle.
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

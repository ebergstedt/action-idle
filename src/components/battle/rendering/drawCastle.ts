/**
 * Castle Drawing Functions
 *
 * Renders castles and their health bars.
 * Castles are 4x4 grid cells in size.
 * Extracted from BattleCanvas for better organization.
 */

import type { CastleRenderData } from '../../../core/battle';
import { ARENA_COLORS, UI_COLORS, CASTLE_COLORS } from '../../../core/theme/colors';

/**
 * Draw castle structure.
 * Castle size is determined by its gridFootprint and the cellSize.
 */
export function drawCastle(
  ctx: CanvasRenderingContext2D,
  castle: CastleRenderData,
  cellSize: number
): void {
  const { position, color, gridFootprint } = castle;

  // Calculate actual pixel size from grid footprint
  // Use the smaller dimension for a square-ish castle
  const castleWidth = gridFootprint.cols * cellSize;
  const castleHeight = gridFootprint.rows * cellSize;
  const halfWidth = castleWidth / 2;
  const halfHeight = castleHeight / 2;

  ctx.save();
  ctx.translate(position.x, position.y);

  // Castle base - larger filled rectangle
  ctx.fillStyle = color;
  ctx.strokeStyle = UI_COLORS.black;
  ctx.lineWidth = 3;

  // Draw castle as a fortified structure (pentagon shape for tower look)
  ctx.beginPath();
  // Bottom left
  ctx.moveTo(-halfWidth, halfHeight);
  // Bottom right
  ctx.lineTo(halfWidth, halfHeight);
  // Right wall
  ctx.lineTo(halfWidth, -halfHeight * 0.3);
  // Right battlement
  ctx.lineTo(halfWidth * 0.6, -halfHeight);
  // Top
  ctx.lineTo(0, -halfHeight * 0.6);
  // Left battlement
  ctx.lineTo(-halfWidth * 0.6, -halfHeight);
  // Left wall
  ctx.lineTo(-halfWidth, -halfHeight * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Castle door/gate
  ctx.fillStyle = CASTLE_COLORS.door;
  const doorWidth = castleWidth * 0.25;
  const doorHeight = castleHeight * 0.4;
  ctx.fillRect(-doorWidth / 2, halfHeight - doorHeight, doorWidth, doorHeight);
  ctx.strokeRect(-doorWidth / 2, halfHeight - doorHeight, doorWidth, doorHeight);

  ctx.restore();
}

/**
 * Draw castle health bar.
 */
export function drawCastleHealthBar(
  ctx: CanvasRenderingContext2D,
  castle: CastleRenderData,
  cellSize: number
): void {
  const { position, gridFootprint, health, maxHealth } = castle;

  // Calculate actual pixel size from grid footprint
  const castleWidth = gridFootprint.cols * cellSize;
  const castleHeight = gridFootprint.rows * cellSize;
  const halfHeight = castleHeight / 2;

  ctx.save();
  ctx.translate(position.x, position.y);

  const barWidth = castleWidth * 1.5;
  const barHeight = 8;
  const barY = -halfHeight - 20;

  // Background
  ctx.fillStyle = ARENA_COLORS.healthBarBg;
  ctx.fillRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

  // Fill
  const healthPercent = health / maxHealth;
  ctx.fillStyle =
    healthPercent > 0.5
      ? ARENA_COLORS.healthHigh
      : healthPercent > 0.25
        ? ARENA_COLORS.healthMedium
        : ARENA_COLORS.healthLow;
  ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);

  ctx.restore();
}

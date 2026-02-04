/**
 * Castle Drawing Functions
 *
 * Renders castles (command posts) and their health bars.
 * AC6-inspired industrial mech aesthetic.
 * Castles are 4x4 grid cells in size.
 */

import type { CastleRenderData } from '../../../core/battle';
import { ARENA_COLORS, UI_COLORS, CASTLE_COLORS } from '../../../core/theme/colors';

/**
 * Draw castle structure as an industrial command post.
 * AC6-inspired angular, geometric design.
 */
export function drawCastle(
  ctx: CanvasRenderingContext2D,
  castle: CastleRenderData,
  cellSize: number
): void {
  const { position, color, gridFootprint } = castle;

  // Calculate actual pixel size from grid footprint
  const castleWidth = gridFootprint.cols * cellSize;
  const castleHeight = gridFootprint.rows * cellSize;
  const halfWidth = castleWidth / 2;
  const halfHeight = castleHeight / 2;

  ctx.save();

  // Round position to nearest pixel for crisp rendering
  const x = Math.round(position.x);
  const y = Math.round(position.y);
  ctx.translate(x, y);

  // Round dimensions to ensure pixel-perfect alignment
  const roundedHalfWidth = Math.round(halfWidth);
  const roundedHalfHeight = Math.round(halfHeight);
  const roundedWidth = roundedHalfWidth * 2;
  const roundedHeight = roundedHalfHeight * 2;

  // Main structure - fills full 4x4 grid footprint
  ctx.fillStyle = color;

  // Draw base platform (full rectangle matching grid footprint)
  ctx.fillRect(-roundedHalfWidth, -roundedHalfHeight, roundedWidth, roundedHeight);

  // Draw border inside the footprint (inset by half lineWidth to stay within grid)
  ctx.strokeStyle = UI_COLORS.metalDark;
  ctx.lineWidth = 2;
  const borderInset = 1; // Half of lineWidth to keep stroke inside
  ctx.strokeRect(
    -roundedHalfWidth + borderInset,
    -roundedHalfHeight + borderInset,
    roundedWidth - borderInset * 2,
    roundedHeight - borderInset * 2
  );

  // Inner panel - darker recessed area
  const inset = Math.round(Math.min(roundedWidth, roundedHeight) * 0.15);
  ctx.fillStyle = CASTLE_COLORS.door;
  ctx.fillRect(
    -roundedHalfWidth + inset,
    -roundedHalfHeight + inset,
    roundedWidth - inset * 2,
    roundedHeight - inset * 2
  );

  // Central core circle
  const coreSize = Math.round(Math.min(roundedWidth, roundedHeight) * 0.25);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = CASTLE_COLORS.accent;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Yellow accent border around the whole structure
  ctx.strokeStyle = CASTLE_COLORS.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(
    -roundedHalfWidth + 2,
    -roundedHalfHeight + 2,
    roundedWidth - 4,
    roundedHeight - 4
  );

  // Corner details - small yellow squares
  const cornerSize = Math.round(Math.min(roundedWidth, roundedHeight) * 0.12);
  ctx.fillStyle = CASTLE_COLORS.accent;

  // Top-left corner
  ctx.fillRect(-roundedHalfWidth, -roundedHalfHeight, cornerSize, cornerSize);
  // Top-right corner
  ctx.fillRect(roundedHalfWidth - cornerSize, -roundedHalfHeight, cornerSize, cornerSize);
  // Bottom-left corner
  ctx.fillRect(-roundedHalfWidth, roundedHalfHeight - cornerSize, cornerSize, cornerSize);
  // Bottom-right corner
  ctx.fillRect(
    roundedHalfWidth - cornerSize,
    roundedHalfHeight - cornerSize,
    cornerSize,
    cornerSize
  );

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

  const barWidth = castleWidth * 1.2;
  const barHeight = 6;
  const barY = -halfHeight - 16;

  // Background
  ctx.fillStyle = UI_COLORS.metalDark;
  ctx.fillRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

  // Fill - uniform yellow with damage indicators
  const healthPercent = health / maxHealth;
  ctx.fillStyle =
    healthPercent > 0.5
      ? CASTLE_COLORS.accent // Yellow - healthy
      : healthPercent > 0.25
        ? ARENA_COLORS.healthMedium
        : ARENA_COLORS.healthLow;
  ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);

  ctx.restore();
}

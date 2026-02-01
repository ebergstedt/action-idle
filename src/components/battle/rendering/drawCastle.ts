/**
 * Castle Drawing Functions
 *
 * Renders castles and their health bars.
 * Extracted from BattleCanvas for better organization.
 */

import type { CastleRenderData } from '../../../core/battle';
import { ARENA_COLORS, UI_COLORS, CASTLE_COLORS } from '../../../core/theme/colors';

/**
 * Draw castle structure.
 */
export function drawCastle(ctx: CanvasRenderingContext2D, castle: CastleRenderData): void {
  const { position, color, size } = castle;

  ctx.save();
  ctx.translate(position.x, position.y);

  // Castle base - larger filled rectangle
  ctx.fillStyle = color;
  ctx.strokeStyle = UI_COLORS.black;
  ctx.lineWidth = 3;

  // Draw castle as a fortified structure (pentagon shape for tower look)
  const halfSize = size;
  ctx.beginPath();
  // Bottom left
  ctx.moveTo(-halfSize, halfSize);
  // Bottom right
  ctx.lineTo(halfSize, halfSize);
  // Right wall
  ctx.lineTo(halfSize, -halfSize * 0.3);
  // Right battlement
  ctx.lineTo(halfSize * 0.6, -halfSize);
  // Top
  ctx.lineTo(0, -halfSize * 0.6);
  // Left battlement
  ctx.lineTo(-halfSize * 0.6, -halfSize);
  // Left wall
  ctx.lineTo(-halfSize, -halfSize * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Castle door/gate
  ctx.fillStyle = CASTLE_COLORS.door;
  const doorWidth = size * 0.4;
  const doorHeight = size * 0.6;
  ctx.fillRect(-doorWidth / 2, halfSize - doorHeight, doorWidth, doorHeight);
  ctx.strokeRect(-doorWidth / 2, halfSize - doorHeight, doorWidth, doorHeight);

  ctx.restore();
}

/**
 * Draw castle health bar.
 */
export function drawCastleHealthBar(ctx: CanvasRenderingContext2D, castle: CastleRenderData): void {
  const { position, size, health, maxHealth } = castle;

  ctx.save();
  ctx.translate(position.x, position.y);

  const barWidth = size * 3;
  const barHeight = 8;
  const barY = -size - 25;

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

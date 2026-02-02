/**
 * Laser Drawing Functions
 *
 * Renders aiming lasers for sniper units.
 */

import type { UnitRenderData } from '../../../core/battle';
import { getTeamColor } from '../../../core/theme/colors';

/**
 * Draw aiming laser from unit to target.
 * Very thin line in the team's color.
 */
export function drawAimingLaser(ctx: CanvasRenderingContext2D, unit: UnitRenderData): void {
  if (!unit.aimingAt) return;

  const { position, visualOffset, team } = unit;

  // Apply visual offset to match unit body position
  const startX = position.x + (visualOffset?.x ?? 0);
  const startY = position.y + (visualOffset?.y ?? 0);

  const endX = unit.aimingAt.x;
  const endY = unit.aimingAt.y;

  const teamColor = getTeamColor(team);

  ctx.save();

  // Draw main laser line (very thin)
  ctx.strokeStyle = teamColor;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.7;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Draw a subtle glow effect
  ctx.strokeStyle = teamColor;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.2;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.restore();
}

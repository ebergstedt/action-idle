/**
 * Laser Drawing Functions
 *
 * Renders aiming lasers for sniper units.
 */

import type { UnitRenderData } from '../../../core/battle';
import { getTeamColor } from '../../../core/theme/colors';

/** Radius of the aim progress dot */
const AIM_DOT_RADIUS = 3;

/**
 * Draw aiming laser from unit to target.
 * Very thin line in the team's color with a dot showing aim progress.
 */
export function drawAimingLaser(ctx: CanvasRenderingContext2D, unit: UnitRenderData): void {
  if (!unit.aimingAt) return;

  const { position, visualOffset, team, aimProgress } = unit;

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

  // Draw aim progress dot traveling along the laser
  if (aimProgress > 0) {
    const dotX = startX + (endX - startX) * aimProgress;
    const dotY = startY + (endY - startY) * aimProgress;

    // Dot gets brighter as it approaches the target
    ctx.fillStyle = teamColor;
    ctx.globalAlpha = 0.5 + aimProgress * 0.5; // 0.5 → 1.0

    ctx.beginPath();
    ctx.arc(dotX, dotY, AIM_DOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Glow around the dot
    ctx.globalAlpha = 0.2 + aimProgress * 0.2; // 0.2 → 0.4
    ctx.beginPath();
    ctx.arc(dotX, dotY, AIM_DOT_RADIUS * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

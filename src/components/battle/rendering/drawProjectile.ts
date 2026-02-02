/**
 * Projectile Drawing Functions
 *
 * Renders projectiles with gradient trails.
 * Extracted from BattleCanvas for better organization.
 */

import type { ProjectileRenderData } from '../../../core/battle';
import {
  BASE_PROJECTILE_TRAIL_LENGTH,
  PROJECTILE_TRAIL_WIDTH,
  PROJECTILE_HEAD_RADIUS,
  scaleValue,
} from '../../../core/battle/BattleConfig';

/**
 * Draw projectile with gradient trail.
 */
export function drawProjectile(
  ctx: CanvasRenderingContext2D,
  proj: ProjectileRenderData,
  arenaHeight: number
): void {
  const { position, target, color } = proj;

  // Calculate direction toward target
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Normalize direction (or default to up if at target)
  const dirX = dist > 0.1 ? dx / dist : 0;
  const dirY = dist > 0.1 ? dy / dist : -1;

  // Trail extends backward from projectile
  const trailLength = scaleValue(BASE_PROJECTILE_TRAIL_LENGTH, arenaHeight);
  const trailEndX = position.x - dirX * trailLength;
  const trailEndY = position.y - dirY * trailLength;

  ctx.save();

  // Draw trail as gradient line
  const gradient = ctx.createLinearGradient(trailEndX, trailEndY, position.x, position.y);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(1, color);

  ctx.strokeStyle = gradient;
  ctx.lineWidth = PROJECTILE_TRAIL_WIDTH;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(trailEndX, trailEndY);
  ctx.lineTo(position.x, position.y);
  ctx.stroke();

  // Draw projectile head
  ctx.translate(position.x, position.y);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  ctx.beginPath();
  ctx.arc(0, 0, PROJECTILE_HEAD_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

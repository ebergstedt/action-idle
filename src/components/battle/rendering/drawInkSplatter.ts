/**
 * Debris Drawing Functions
 *
 * Renders debris particles for unit destruction.
 * Creates metallic debris with team-colored tints.
 */

import { INK_SPLATTER_OPACITY } from '../../../core/battle/BattleConfig';
import { hexToRgba, getTeamColor } from '../../../core/theme/colors';
import type { InkSplatter } from '../../../core/battle/particles';

/**
 * Draw a single debris chunk.
 * Uses an irregular shape with team-colored tint.
 */
function drawDebrisChunk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  alpha: number,
  team: 'player' | 'enemy'
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Team-colored debris with transparency
  const teamColor = getTeamColor(team);
  ctx.fillStyle = hexToRgba(teamColor, alpha * INK_SPLATTER_OPACITY);

  // Draw irregular debris shape using bezier curves
  ctx.beginPath();
  const points = 6;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const nextAngle = ((i + 1) / points) * Math.PI * 2;

    // Vary radius for each point to create irregular shape
    const r1 = size * (0.7 + Math.sin(angle * 3) * 0.3);
    const r2 = size * (0.7 + Math.sin(nextAngle * 3) * 0.3);

    const x1 = Math.cos(angle) * r1;
    const y1 = Math.sin(angle) * r1;
    const x2 = Math.cos(nextAngle) * r2;
    const y2 = Math.sin(nextAngle) * r2;

    // Control point for curve
    const midAngle = (angle + nextAngle) / 2;
    const ctrlR = size * (0.9 + Math.cos(midAngle * 5) * 0.2);
    const cx = Math.cos(midAngle) * ctrlR;
    const cy = Math.sin(midAngle) * ctrlR;

    if (i === 0) {
      ctx.moveTo(x1, y1);
    }
    ctx.quadraticCurveTo(cx, cy, x2, y2);
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draw a small debris fragment (in-flight).
 */
function drawDebrisFragment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  team: 'player' | 'enemy'
): void {
  ctx.save();

  // Team-colored debris
  const teamColor = getTeamColor(team);
  ctx.fillStyle = hexToRgba(teamColor, INK_SPLATTER_OPACITY);

  // Simple circle for in-flight fragments
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw all debris particles.
 * In-flight debris is drawn as small fragments.
 * Landed debris is drawn as irregular chunks.
 */
export function drawInkSplatters(ctx: CanvasRenderingContext2D, splatters: InkSplatter[]): void {
  for (const splatter of splatters) {
    if (splatter.landed) {
      drawDebrisChunk(
        ctx,
        splatter.x,
        splatter.y,
        splatter.size,
        splatter.rotation,
        1,
        splatter.team
      );
    } else {
      drawDebrisFragment(ctx, splatter.x, splatter.y, splatter.size, splatter.team);
    }
  }
}

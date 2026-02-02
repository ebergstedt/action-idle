/**
 * Ink Splatter Drawing Functions
 *
 * Renders ink splatter particles for unit deaths.
 * Creates irregular blob shapes like spilled ink on parchment.
 */

import { INK_SPLATTER_OPACITY } from '../../../core/battle/BattleConfig';
import { UI_COLORS } from '../../../core/theme/colors';
import type { InkSplatter } from '../../../core/battle/particles';

/**
 * Draw a single ink splatter blob.
 * Uses an irregular shape to look like spilled ink.
 */
function drawInkBlob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  alpha: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Dark ink color for better visibility
  ctx.fillStyle = UI_COLORS.inkBlack;
  ctx.globalAlpha = alpha * INK_SPLATTER_OPACITY;

  // Draw irregular blob shape using bezier curves
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
 * Draw a small ink droplet (in-flight splatter).
 */
function drawInkDroplet(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.fillStyle = UI_COLORS.inkBlack;
  ctx.globalAlpha = INK_SPLATTER_OPACITY;

  // Simple circle for in-flight droplets
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw all ink splatters.
 * In-flight splatters are drawn as small droplets.
 * Landed splatters are drawn as irregular blobs.
 */
export function drawInkSplatters(ctx: CanvasRenderingContext2D, splatters: InkSplatter[]): void {
  for (const splatter of splatters) {
    if (splatter.landed) {
      drawInkBlob(ctx, splatter.x, splatter.y, splatter.size, splatter.rotation, 1);
    } else {
      drawInkDroplet(ctx, splatter.x, splatter.y, splatter.size);
    }
  }
  ctx.globalAlpha = 1;
}

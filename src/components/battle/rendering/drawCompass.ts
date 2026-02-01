/**
 * Compass Rose Drawing
 *
 * Decorative compass rose for the arena corner.
 * Styled to match the medieval parchment aesthetic.
 */

import { UI_COLORS } from '../../../core/theme/colors';

/**
 * Draw a decorative compass rose.
 */
export function drawCompassRose(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.save();
  ctx.translate(x, y);

  const inkColor = UI_COLORS.inkBrown;
  const lightInk = UI_COLORS.inkFaded;

  // Outer decorative ring
  ctx.strokeStyle = lightInk;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  // Cardinal direction points (N, E, S, W) - longer
  ctx.fillStyle = inkColor;
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 1.5;

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 - Math.PI / 2; // Start from North
    drawCompassPoint(ctx, angle, size * 0.8, size * 0.15, true);
  }

  // Intercardinal points (NE, SE, SW, NW) - shorter
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4 - Math.PI / 2;
    drawCompassPoint(ctx, angle, size * 0.55, size * 0.1, false);
  }

  // Small tick marks for 16-point compass
  ctx.strokeStyle = lightInk;
  ctx.lineWidth = 1;
  for (let i = 0; i < 16; i++) {
    if (i % 2 === 1) {
      // Skip cardinal and intercardinal
      const angle = (i * Math.PI) / 8 - Math.PI / 2;
      const innerR = size * 0.7;
      const outerR = size * 0.8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.stroke();
    }
  }

  // Center decoration - small circle
  ctx.fillStyle = inkColor;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Center ring
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
  ctx.stroke();

  // "N" label
  ctx.fillStyle = inkColor;
  ctx.font = `bold ${Math.round(size * 0.2)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', 0, -size * 0.65);

  ctx.restore();
}

/**
 * Draw a single compass point (diamond/arrow shape).
 */
function drawCompassPoint(
  ctx: CanvasRenderingContext2D,
  angle: number,
  length: number,
  width: number,
  filled: boolean
): void {
  ctx.save();
  ctx.rotate(angle);

  // Diamond shape pointing outward
  ctx.beginPath();
  ctx.moveTo(0, -length); // Tip
  ctx.lineTo(-width, 0); // Left
  ctx.lineTo(0, length * 0.2); // Inner
  ctx.lineTo(width, 0); // Right
  ctx.closePath();

  if (filled) {
    // Half dark, half light for 3D effect
    ctx.save();
    ctx.clip();
    ctx.fillStyle = UI_COLORS.inkBrown;
    ctx.fillRect(-width, -length, width, length * 1.2);
    ctx.fillStyle = UI_COLORS.inkFaded;
    ctx.fillRect(0, -length, width, length * 1.2);
    ctx.restore();
    ctx.stroke();
  } else {
    ctx.stroke();
  }

  ctx.restore();
}

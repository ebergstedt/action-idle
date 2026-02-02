/**
 * Effects Drawing Functions
 *
 * Renders shockwaves, damage numbers, and other visual effects.
 * Extracted from BattleCanvas for better organization.
 */

import type { ShockwaveRenderData, DamageNumberRenderData } from '../../../core/battle';
import {
  BASE_DAMAGE_NUMBER_FONT_SIZE,
  SHOCKWAVE_MIN_RENDER_RADIUS,
  SHOCKWAVE_RING_THICKNESS,
  SHOCKWAVE_GLOW_WIDTH,
  SHOCKWAVE_HIGHLIGHT_WIDTH,
  scaleValue,
} from '../../../core/battle/BattleConfig';
import { ARENA_COLORS, hexToRgba } from '../../../core/theme/colors';

/**
 * Draw shockwave effect (expanding ring from castle destruction).
 * Uses the team color of the attacking team.
 */
export function drawShockwave(
  ctx: CanvasRenderingContext2D,
  shockwave: ShockwaveRenderData,
  arenaWidth: number,
  arenaHeight: number
): void {
  const { position, currentRadius, color } = shockwave;

  // Don't draw if radius is too small (prevents negative radius issues)
  if (currentRadius < SHOCKWAVE_MIN_RENDER_RADIUS) return;

  ctx.save();

  // Clip to arena bounds so shockwave doesn't render outside
  ctx.beginPath();
  ctx.rect(0, 0, arenaWidth, arenaHeight);
  ctx.clip();

  ctx.translate(position.x, position.y);

  // Derive glow colors from the team color
  const glowColor = hexToRgba(color, 0.3);
  const highlightColor = hexToRgba(color, 0.6);

  // Outer glow
  ctx.beginPath();
  ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = SHOCKWAVE_RING_THICKNESS + SHOCKWAVE_GLOW_WIDTH;
  ctx.globalAlpha = 1;
  ctx.stroke();

  // Main ring
  ctx.beginPath();
  ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = SHOCKWAVE_RING_THICKNESS;
  ctx.globalAlpha = 1;
  ctx.stroke();

  // Inner highlight
  ctx.beginPath();
  ctx.arc(0, 0, currentRadius - SHOCKWAVE_RING_THICKNESS / 2, 0, Math.PI * 2);
  ctx.strokeStyle = highlightColor;
  ctx.lineWidth = SHOCKWAVE_HIGHLIGHT_WIDTH;
  ctx.globalAlpha = 1;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw floating damage number.
 */
export function drawDamageNumber(
  ctx: CanvasRenderingContext2D,
  damageNumber: DamageNumberRenderData,
  arenaHeight: number
): void {
  const { position, amount, progress } = damageNumber;

  // Fade out as progress increases (0 = just spawned, 1 = about to disappear)
  const opacity = 1 - progress;
  if (opacity <= 0) return;

  // Scale font based on arena size
  const fontSize = scaleValue(BASE_DAMAGE_NUMBER_FONT_SIZE, arenaHeight);

  ctx.save();
  ctx.translate(position.x, position.y);

  // Scale up slightly at start, then normal
  const scaleProgress = Math.min(progress * 4, 1); // Quick scale-in over first 25% of lifetime
  const scale = 1 + (1 - scaleProgress) * 0.3; // Start at 1.3x, settle to 1x
  ctx.scale(scale, scale);

  ctx.globalAlpha = opacity;
  ctx.font = `bold ${Math.round(fontSize)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw text with outline for readability
  const text = String(amount);

  // Outline
  ctx.strokeStyle = ARENA_COLORS.damageNumberOutline;
  ctx.lineWidth = 3;
  ctx.strokeText(text, 0, 0);

  // Fill - red for all damage
  ctx.fillStyle = ARENA_COLORS.damageNumber;
  ctx.fillText(text, 0, 0);

  ctx.restore();
}

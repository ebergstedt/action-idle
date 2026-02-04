/**
 * Unit Drawing Functions
 *
 * Renders unit shadows, bodies, health bars, and debuff indicators.
 * Extracted from BattleCanvas for better organization.
 */

import type { UnitRenderData } from '../../../core/battle';
import {
  HIT_FLASH_DURATION,
  DEATH_FADE_DURATION,
  UNIT_SHADOW_OFFSET,
  UNIT_SHADOW_OPACITY,
} from '../../../core/battle/BattleConfig';
import { computeWalkAnimationState } from '../../../core/battle/animations';
import { ARENA_COLORS, UI_COLORS, getOppositeTeam, getTeamColor } from '../../../core/theme/colors';

/**
 * Draw unit shadow beneath the unit.
 * Shadow stays on the ground (no bounce offset) but scales with squash.
 */
export function drawUnitShadow(ctx: CanvasRenderingContext2D, unit: UnitRenderData): void {
  const { position, shape, size, visualOffset, deathFadeTimer, walkAnimation, walkAnimationTime } =
    unit;

  // Calculate death fade effect (shadows also fade with unit)
  const isDying = deathFadeTimer >= 0;
  const deathProgress = isDying ? 1 - deathFadeTimer / DEATH_FADE_DURATION : 0;
  const deathOpacity = isDying ? 1 - deathProgress : 1;
  const deathScale = isDying ? 1 - deathProgress * 0.3 : 1;

  // Shadow stays on the ground (no bounceY offset), but stretches with squash
  const renderX = position.x + (visualOffset?.x ?? 0) + UNIT_SHADOW_OFFSET;
  const renderY = position.y + (visualOffset?.y ?? 0) + UNIT_SHADOW_OFFSET;

  // Compute animation state from time and type
  const animState = computeWalkAnimationState(walkAnimation, walkAnimationTime, size);
  const animScaleX = animState.scaleX;

  ctx.save();
  ctx.translate(renderX, renderY);

  // Apply death scale and animation horizontal stretch to shadow
  const finalScaleX = deathScale * animScaleX;
  const finalScaleY = deathScale; // Shadow doesn't squash vertically
  if (finalScaleX !== 1 || finalScaleY !== 1) {
    ctx.scale(finalScaleX, finalScaleY);
  }

  ctx.fillStyle = ARENA_COLORS.unitShadow;
  ctx.globalAlpha = UNIT_SHADOW_OPACITY * deathOpacity;

  switch (shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'square':
      ctx.fillRect(-size, -size, size * 2, size * 2);
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(-size, size);
      ctx.lineTo(size, size);
      ctx.closePath();
      ctx.fill();
      break;
    case 'triangle_down':
      ctx.beginPath();
      ctx.moveTo(0, size);
      ctx.lineTo(-size, -size);
      ctx.lineTo(size, -size);
      ctx.closePath();
      ctx.fill();
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size, 0);
      ctx.closePath();
      ctx.fill();
      break;
  }

  ctx.restore();
}

/**
 * Draw the unit body with hit flash and walk animation.
 * Note: Selection is now drawn as a squad outline, not individual unit rings.
 */
export function drawUnitBody(
  ctx: CanvasRenderingContext2D,
  unit: UnitRenderData,
  _isSelected: boolean,
  isBeingDragged: boolean
): void {
  const {
    position,
    color,
    shape,
    size,
    visualOffset,
    deathFadeTimer,
    walkAnimation,
    walkAnimationTime,
  } = unit;

  // Calculate death fade effect
  const isDying = deathFadeTimer >= 0;
  const deathProgress = isDying ? 1 - deathFadeTimer / DEATH_FADE_DURATION : 0;
  const deathOpacity = isDying ? 1 - deathProgress : 1;
  const deathScale = isDying ? 1 - deathProgress * 0.3 : 1; // Shrink to 70% at death

  // Compute walk animation state from time and type
  const animState = computeWalkAnimationState(walkAnimation, walkAnimationTime, size);
  const bounceY = animState.offsetY;
  const animScaleX = animState.scaleX;
  const animScaleY = animState.scaleY;

  // Apply visual offset (lunge/knockback) and bounce to rendered position
  const renderX = position.x + (visualOffset?.x ?? 0);
  const renderY = position.y + (visualOffset?.y ?? 0) + bounceY;

  ctx.save();
  ctx.translate(renderX, renderY);

  // Apply death scale combined with animation squash/stretch
  const finalScaleX = deathScale * animScaleX;
  const finalScaleY = deathScale * animScaleY;
  if (finalScaleX !== 1 || finalScaleY !== 1) {
    ctx.scale(finalScaleX, finalScaleY);
  }

  // Unit shape
  const baseAlpha = isBeingDragged ? 0.8 : 1;
  ctx.globalAlpha = baseAlpha * deathOpacity;
  ctx.fillStyle = color;
  ctx.strokeStyle = UI_COLORS.black;
  // Scale border width with unit size (min 0.5, proportional to size)
  ctx.lineWidth = Math.max(0.5, size * 0.15);

  switch (shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'square':
      ctx.fillRect(-size, -size, size * 2, size * 2);
      ctx.strokeRect(-size, -size, size * 2, size * 2);
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(-size, size);
      ctx.lineTo(size, size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'triangle_down':
      ctx.beginPath();
      ctx.moveTo(0, size);
      ctx.lineTo(-size, -size);
      ctx.lineTo(size, -size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
  }

  // Hit flash overlay - white flash when unit takes damage
  const hitFlashTimer = unit.hitFlashTimer ?? 0;
  if (hitFlashTimer > 0) {
    const flashIntensity = hitFlashTimer / HIT_FLASH_DURATION;
    ctx.fillStyle = ARENA_COLORS.hitFlash;
    ctx.globalAlpha = flashIntensity * 0.7; // Max 70% opacity for the flash

    switch (shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.fillRect(-size, -size, size * 2, size * 2);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size, size);
        ctx.lineTo(size, size);
        ctx.closePath();
        ctx.fill();
        break;
      case 'triangle_down':
        ctx.beginPath();
        ctx.moveTo(0, size);
        ctx.lineTo(-size, -size);
        ctx.lineTo(size, -size);
        ctx.closePath();
        ctx.fill();
        break;
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();
        ctx.fill();
        break;
    }
  }

  ctx.restore();
}

/**
 * Draw unit health bar with ghost health effect.
 * Health bar width and height scale with unit's visual size (based on individual unit grid size).
 */
export function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  unit: UnitRenderData,
  ghostHealth: number
): void {
  const { position, size, health, stats, visualOffset } = unit;

  // Apply visual offset to match unit body position
  const renderX = position.x + (visualOffset?.x ?? 0);
  const renderY = position.y + (visualOffset?.y ?? 0);

  ctx.save();
  ctx.translate(renderX, renderY);

  // Health bar width matches unit's visual diameter (size is radius)
  const barWidth = size * 2;

  // Health bar height: 3px baseline, thin and proportional to unit size
  const barHeight = Math.max(2, size * 0.3);

  // Position above unit with small gap
  const barY = -size - 8;

  // Background
  ctx.fillStyle = ARENA_COLORS.healthBarBg;
  ctx.fillRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

  // Ghost health bar (shows damage taken as dark red trailing effect)
  const ghostPercent = ghostHealth / stats.maxHealth;
  if (ghostPercent > health / stats.maxHealth) {
    ctx.fillStyle = ARENA_COLORS.healthGhost;
    ctx.fillRect(-barWidth / 2, barY, barWidth * ghostPercent, barHeight);
  }

  // Current health fill
  const healthPercent = health / stats.maxHealth;
  ctx.fillStyle =
    healthPercent > 0.5
      ? ARENA_COLORS.healthHigh
      : healthPercent > 0.25
        ? ARENA_COLORS.healthMedium
        : ARENA_COLORS.healthLow;
  ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);

  ctx.restore();
}

/**
 * Draw debuff indicator above unit (e.g., shockwave debuff).
 * Debuff color is the ENEMY team's color (the team that caused the debuff).
 */
export function drawDebuffIndicator(ctx: CanvasRenderingContext2D, unit: UnitRenderData): void {
  // Only draw if unit has shockwave debuff
  const hasShockwaveDebuff = unit.activeModifiers.some(
    (m) => m.sourceId === 'castle_death_shockwave'
  );
  if (!hasShockwaveDebuff) return;

  const { position, size, visualOffset, team } = unit;

  // Apply visual offset to match unit body position
  const renderX = position.x + (visualOffset?.x ?? 0);
  const renderY = position.y + (visualOffset?.y ?? 0);

  ctx.save();
  ctx.translate(renderX, renderY);

  // Position above health bar
  const iconY = -size - 32;
  const iconSize = 8;

  // Debuff color is the enemy team's color (the team that caused the debuff)
  const enemyTeam = getOppositeTeam(team);
  const debuffColor = getTeamColor(enemyTeam);

  // Draw a small skull-like icon (simplified as X in circle)
  ctx.fillStyle = debuffColor;
  ctx.strokeStyle = UI_COLORS.white;
  ctx.lineWidth = 1.5;

  // Circle background
  ctx.beginPath();
  ctx.arc(0, iconY, iconSize, 0, Math.PI * 2);
  ctx.fill();

  // X mark inside
  ctx.beginPath();
  ctx.moveTo(-iconSize * 0.5, iconY - iconSize * 0.5);
  ctx.lineTo(iconSize * 0.5, iconY + iconSize * 0.5);
  ctx.moveTo(iconSize * 0.5, iconY - iconSize * 0.5);
  ctx.lineTo(-iconSize * 0.5, iconY + iconSize * 0.5);
  ctx.stroke();

  ctx.restore();
}

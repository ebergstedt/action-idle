/**
 * Battle Renderer
 *
 * Main rendering orchestrator for the battle canvas.
 * Coordinates all drawing operations in the correct order.
 */

import type { BattleState } from '../../../core/battle';
import { ZONE_HEIGHT_PERCENT } from '../../../core/battle';
import { DUST_PARTICLE_SIZE } from '../../../core/battle/BattleConfig';
import { ARENA_COLORS } from '../../../core/theme/colors';
import {
  getSelectionBox,
  isBoxSelectActive,
  BoxSelectSession,
} from '../../../core/battle/BoxSelectController';

import { drawUnitShadow, drawUnitBody, drawHealthBar, drawDebuffIndicator } from './drawUnit';
import { drawProjectile } from './drawProjectile';
import { drawCastle, drawCastleHealthBar } from './drawCastle';
import { drawShockwave, drawDamageNumber } from './drawEffects';
import { drawSelectionBox } from './drawSelection';

/**
 * Dust particle for movement effects.
 */
export interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifetime: number;
  maxLifetime: number;
}

/**
 * Render context passed to the main render function.
 */
export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  state: BattleState;
  selectedUnitIds: string[];
  draggedUnitIds: string[];
  isDragging: boolean;
  boxSelectSession: BoxSelectSession | null;
  ghostHealthMap: Map<string, number>;
  dustParticles: DustParticle[];
}

/**
 * Draw the arena background and grid lines.
 */
function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  // Clear and draw background
  ctx.fillStyle = ARENA_COLORS.background;
  ctx.fillRect(0, 0, width, height);

  // Grid lines
  ctx.strokeStyle = ARENA_COLORS.gridLine;
  ctx.lineWidth = 1;
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

/**
 * Draw spawn zones (enemy at top, ally at bottom).
 */
function drawSpawnZones(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const zoneHeight = height * ZONE_HEIGHT_PERCENT;

  // Enemy zone (top)
  ctx.fillStyle = ARENA_COLORS.enemyZoneFill;
  ctx.fillRect(0, 0, width, zoneHeight);
  ctx.strokeStyle = ARENA_COLORS.enemyZoneBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, zoneHeight);
  ctx.lineTo(width, zoneHeight);
  ctx.stroke();

  // Allied zone (bottom)
  ctx.fillStyle = ARENA_COLORS.allyZoneFill;
  ctx.fillRect(0, height - zoneHeight, width, zoneHeight);
  ctx.strokeStyle = ARENA_COLORS.allyZoneBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, height - zoneHeight);
  ctx.lineTo(width, height - zoneHeight);
  ctx.stroke();
}

/**
 * Draw dust particles.
 */
function drawDustParticles(ctx: CanvasRenderingContext2D, particles: DustParticle[]): void {
  for (const particle of particles) {
    const alpha = particle.lifetime / particle.maxLifetime;
    ctx.fillStyle = ARENA_COLORS.dustParticle;
    ctx.globalAlpha = alpha * 0.8;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, DUST_PARTICLE_SIZE, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * Main render function - draws entire battle scene.
 */
export function renderBattle(context: RenderContext): void {
  const {
    ctx,
    width,
    height,
    state,
    selectedUnitIds,
    draggedUnitIds,
    isDragging,
    boxSelectSession,
    ghostHealthMap,
    dustParticles,
  } = context;

  // 1. Background and zones
  drawBackground(ctx, width, height);
  drawSpawnZones(ctx, width, height);

  // 2. Shockwaves (draw early so other elements appear on top)
  for (const shockwave of state.shockwaves) {
    drawShockwave(ctx, shockwave, width, height);
  }

  // 3. Castles (draw before units so units appear on top)
  for (const castle of state.castles) {
    drawCastle(ctx, castle);
  }

  // 4. Projectiles
  for (const proj of state.projectiles) {
    drawProjectile(ctx, proj, height);
  }

  // 5. Unit shadows (drawn first so they're behind all units)
  for (const unit of state.units) {
    drawUnitShadow(ctx, unit);
  }

  // 6. Unit bodies
  for (const unit of state.units) {
    const isSelected = selectedUnitIds.includes(unit.id);
    const isBeingDragged = isDragging && draggedUnitIds.includes(unit.id);
    drawUnitBody(ctx, unit, isSelected, isBeingDragged);
  }

  // 7. Dust particles (after units so they're visible)
  drawDustParticles(ctx, dustParticles);

  // 8. Health bars for units (skip dying units)
  for (const unit of state.units) {
    if (unit.deathFadeTimer < 0) {
      const ghostHealth = ghostHealthMap.get(unit.id) ?? unit.health;
      drawHealthBar(ctx, unit, ghostHealth);
    }
  }

  // 9. Debuff indicators (above health bars, skip dying units)
  for (const unit of state.units) {
    if (unit.deathFadeTimer < 0) {
      drawDebuffIndicator(ctx, unit);
    }
  }

  // 10. Health bars for castles
  for (const castle of state.castles) {
    drawCastleHealthBar(ctx, castle);
  }

  // 11. Damage numbers (above everything else)
  for (const damageNumber of state.damageNumbers) {
    drawDamageNumber(ctx, damageNumber, height);
  }

  // 12. Box selection rectangle
  if (boxSelectSession && isBoxSelectActive(boxSelectSession)) {
    const box = getSelectionBox(boxSelectSession);
    drawSelectionBox(ctx, box);
  }
}

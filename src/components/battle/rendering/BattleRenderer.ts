/**
 * Battle Renderer
 *
 * Main rendering orchestrator for the battle canvas.
 * Coordinates all drawing operations in the correct order.
 */

import type { BattleState } from '../../../core/battle';
import { ZONE_HEIGHT_PERCENT } from '../../../core/battle';
import { ARENA_COLORS } from '../../../core/theme/colors';
import {
  getSelectionBox,
  isBoxSelectActive,
  BoxSelectSession,
} from '../../../core/battle/BoxSelectController';

import {
  drawUnitShadow,
  drawUnitBody,
  drawHealthBar,
  drawDebuffIndicator,
  drawSquadLevels,
} from './drawUnit';
import { drawProjectile } from './drawProjectile';
import { drawCastle, drawCastleHealthBar } from './drawCastle';
import { drawShockwave } from './drawEffects';
import { drawSelectionBox, drawSquadSelections } from './drawSelection';
import { drawParchmentBackground, drawVignette } from './drawBackground';
import { drawInkSplatters } from './drawInkSplatter';
import { drawAimingLaser } from './drawLaser';
import { drawBackgroundGrid, drawFlankZones } from './drawGrid';
import { calculateCellSize } from '../../../core/battle/grid/GridManager';
import type { InkSplatter } from '../../../core/battle/particles';

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
  inkSplatters: InkSplatter[];
}

/**
 * Draw spawn zones (enemy at top, ally at bottom).
 * Only fills the zones with color, no border lines.
 */
function drawSpawnZones(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const zoneHeight = height * ZONE_HEIGHT_PERCENT;

  // Enemy zone (top) - fill only
  ctx.fillStyle = ARENA_COLORS.enemyZoneFill;
  ctx.fillRect(0, 0, width, zoneHeight);

  // Allied zone (bottom) - fill only
  ctx.fillStyle = ARENA_COLORS.allyZoneFill;
  ctx.fillRect(0, height - zoneHeight, width, zoneHeight);
}

// Dust particles disabled for AC6 aesthetic

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
    inkSplatters,
  } = context;

  // Calculate cell size once for grid-based rendering
  const cellSize = calculateCellSize(width, height);

  // 1. Parchment background with noise texture and grid
  drawParchmentBackground(ctx, width, height);

  // 2. Spawn zones
  drawSpawnZones(ctx, width, height);

  // 2.5. Faint background grid (only during deployment when units selected) and flank zones
  const showGrid = !state.hasStarted && selectedUnitIds.length > 0;
  if (showGrid) {
    drawBackgroundGrid(ctx, width, cellSize);
    drawFlankZones(ctx, width, height, cellSize, 0.1);
  }

  // 3. Ink splatters (on the ground, behind everything else)
  drawInkSplatters(ctx, inkSplatters);

  // 4. Shockwaves (draw early so other elements appear on top)
  for (const shockwave of state.shockwaves) {
    drawShockwave(ctx, shockwave, width, height);
  }

  // 5. Castles (draw before units so units appear on top)
  for (const castle of state.castles) {
    drawCastle(ctx, castle, cellSize);
  }

  // 6. Projectiles
  for (const proj of state.projectiles) {
    drawProjectile(ctx, proj, height);
  }

  // Filter out castle-type units (they're rendered separately via state.castles)
  const mobileUnits = state.units.filter((u) => u.type !== 'castle');

  // 7. Aiming lasers (drawn before units so they appear underneath)
  for (const unit of mobileUnits) {
    if (unit.aimingAt) {
      drawAimingLaser(ctx, unit);
    }
  }

  // 8. Unit shadows (drawn first so they're behind all units)
  for (const unit of mobileUnits) {
    drawUnitShadow(ctx, unit);
  }

  // 8. Unit bodies
  for (const unit of mobileUnits) {
    const isBeingDragged = isDragging && draggedUnitIds.includes(unit.id);
    drawUnitBody(ctx, unit, isBeingDragged);
  }

  // 8.25. Squad level indicators (planning phase only)
  if (!state.hasStarted) {
    drawSquadLevels(ctx, mobileUnits);
  }

  // 8.5. Squad selection outlines (after unit bodies, before dust)
  // Use all units (including castles) for selection visuals
  drawSquadSelections(ctx, state.units, selectedUnitIds, isDragging, cellSize);

  // 9. Dust particles disabled (removed for AC6 aesthetic)
  // drawDustParticles(ctx, dustParticles);

  // 10. Health bars for units (only show if damaged, skip dying units)
  for (const unit of mobileUnits) {
    if (unit.deathFadeTimer < 0 && unit.health < unit.stats.maxHealth) {
      const ghostHealth = ghostHealthMap.get(unit.id) ?? unit.health;
      drawHealthBar(ctx, unit, ghostHealth);
    }
  }

  // 11. Debuff indicators (above health bars, skip dying units)
  for (const unit of mobileUnits) {
    if (unit.deathFadeTimer < 0) {
      drawDebuffIndicator(ctx, unit);
    }
  }

  // 12. Health bars for castles (only show if damaged)
  for (const castle of state.castles) {
    if (castle.health < castle.maxHealth) {
      drawCastleHealthBar(ctx, castle, cellSize);
    }
  }

  // 13. Damage numbers (disabled - too noisy with many units)
  // for (const damageNumber of state.damageNumbers) {
  //   drawDamageNumber(ctx, damageNumber, height);
  // }

  // 14. Vignette effect (darkens edges, drawn over everything)
  drawVignette(ctx, width, height);

  // 15. Box selection rectangle (drawn last, above vignette)
  if (boxSelectSession && isBoxSelectActive(boxSelectSession)) {
    const box = getSelectionBox(boxSelectSession);
    drawSelectionBox(ctx, box);
  }
}

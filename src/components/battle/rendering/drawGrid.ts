/**
 * Grid Overlay Drawing Functions
 *
 * Renders the deployment grid overlay during the deployment phase.
 * Shows valid placement cells and footprint previews.
 */

import {
  GRID_TOTAL_COLS,
  GRID_TOTAL_ROWS,
  GRID_FLANK_COLS,
  GRID_NO_MANS_LAND_ROWS,
  GRID_DEPLOYMENT_ROWS,
} from '../../../core/battle/BattleConfig';
import { ARENA_COLORS, hexToRgba } from '../../../core/theme/colors';
import type { GridPosition, GridFootprint } from '../../../core/battle/grid/GridTypes';

/**
 * Draw the deployment grid overlay.
 * Shows valid placement cells for the specified team.
 *
 * @param ctx - Canvas rendering context
 * @param arenaWidth - Arena width in pixels
 * @param arenaHeight - Arena height in pixels
 * @param cellSize - Size of each grid cell in pixels
 * @param team - Which team's deployment zone to highlight
 * @param alpha - Opacity of the grid (0-1)
 */
export function drawDeploymentGrid(
  ctx: CanvasRenderingContext2D,
  _arenaWidth: number,
  _arenaHeight: number,
  cellSize: number,
  team: 'player' | 'enemy',
  alpha: number = 0.3
): void {
  if (cellSize <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Calculate deployment zone bounds
  const startCol = GRID_FLANK_COLS;
  const endCol = GRID_TOTAL_COLS - GRID_FLANK_COLS;

  let startRow: number;
  let endRow: number;

  if (team === 'enemy') {
    startRow = 0;
    endRow = GRID_DEPLOYMENT_ROWS;
  } else {
    startRow = GRID_DEPLOYMENT_ROWS + GRID_NO_MANS_LAND_ROWS;
    endRow = GRID_TOTAL_ROWS;
  }

  // Draw grid lines
  ctx.strokeStyle = ARENA_COLORS.gridLine;
  ctx.lineWidth = 1;

  // Vertical lines
  for (let col = startCol; col <= endCol; col++) {
    const x = col * cellSize;
    ctx.beginPath();
    ctx.moveTo(x, startRow * cellSize);
    ctx.lineTo(x, endRow * cellSize);
    ctx.stroke();
  }

  // Horizontal lines
  for (let row = startRow; row <= endRow; row++) {
    const y = row * cellSize;
    ctx.beginPath();
    ctx.moveTo(startCol * cellSize, y);
    ctx.lineTo(endCol * cellSize, y);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw a footprint preview on the grid.
 * Shows where a unit would be placed, with color indicating validity.
 *
 * @param ctx - Canvas rendering context
 * @param gridPos - Grid position (top-left of footprint)
 * @param footprint - Size of the footprint in grid cells
 * @param cellSize - Size of each grid cell in pixels
 * @param isValid - Whether the position is valid (green) or invalid (red)
 */
export function drawFootprintPreview(
  ctx: CanvasRenderingContext2D,
  gridPos: GridPosition,
  footprint: GridFootprint,
  cellSize: number,
  isValid: boolean
): void {
  if (cellSize <= 0) return;

  const x = gridPos.col * cellSize;
  const y = gridPos.row * cellSize;
  const width = footprint.cols * cellSize;
  const height = footprint.rows * cellSize;

  ctx.save();

  // Fill with semi-transparent color
  const color = isValid ? '#22c55e' : '#ef4444'; // green or red
  ctx.fillStyle = hexToRgba(color, 0.3);
  ctx.fillRect(x, y, width, height);

  // Draw border
  ctx.strokeStyle = hexToRgba(color, 0.8);
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  ctx.restore();
}

/**
 * Draw the no man's land zone.
 * Shows the area between deployment zones where units can't be placed.
 *
 * @param ctx - Canvas rendering context
 * @param arenaWidth - Arena width in pixels
 * @param cellSize - Size of each grid cell in pixels
 * @param alpha - Opacity of the overlay (0-1)
 */
export function drawNoMansLand(
  ctx: CanvasRenderingContext2D,
  arenaWidth: number,
  cellSize: number,
  alpha: number = 0.2
): void {
  if (cellSize <= 0) return;

  const startRow = GRID_DEPLOYMENT_ROWS;
  const endRow = GRID_DEPLOYMENT_ROWS + GRID_NO_MANS_LAND_ROWS;

  const y = startRow * cellSize;
  const height = (endRow - startRow) * cellSize;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = ARENA_COLORS.noMansLand || '#8b5a2b';
  ctx.fillRect(0, y, arenaWidth, height);
  ctx.restore();
}

/**
 * Draw the flank zones.
 * Shows the areas on the sides where units can't be placed.
 *
 * @param ctx - Canvas rendering context
 * @param arenaWidth - Arena width in pixels
 * @param arenaHeight - Arena height in pixels
 * @param cellSize - Size of each grid cell in pixels
 * @param alpha - Opacity of the overlay (0-1)
 */
export function drawFlankZones(
  ctx: CanvasRenderingContext2D,
  arenaWidth: number,
  arenaHeight: number,
  cellSize: number,
  alpha: number = 0.15
): void {
  if (cellSize <= 0) return;

  const flankWidth = GRID_FLANK_COLS * cellSize;
  const rightX = arenaWidth - flankWidth;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = ARENA_COLORS.flankZone || '#654321';

  // Left flank
  ctx.fillRect(0, 0, flankWidth, arenaHeight);

  // Right flank
  ctx.fillRect(rightX, 0, flankWidth, arenaHeight);

  ctx.restore();
}

/**
 * Draw all deployment zone overlays.
 * Combines flank zones, no man's land, and deployment grids.
 *
 * @param ctx - Canvas rendering context
 * @param arenaWidth - Arena width in pixels
 * @param arenaHeight - Arena height in pixels
 * @param cellSize - Size of each grid cell in pixels
 */
export function drawDeploymentOverlay(
  ctx: CanvasRenderingContext2D,
  arenaWidth: number,
  arenaHeight: number,
  cellSize: number
): void {
  // Draw zone backgrounds
  drawFlankZones(ctx, arenaWidth, arenaHeight, cellSize, 0.1);

  // Draw deployment grids for both teams
  drawDeploymentGrid(ctx, arenaWidth, arenaHeight, cellSize, 'player', 0.25);
  drawDeploymentGrid(ctx, arenaWidth, arenaHeight, cellSize, 'enemy', 0.15);
}

/**
 * Draw a faint background grid across the entire playable area.
 * This is visible at all times to help visualize the grid system.
 * Excludes the no man's land zone in the middle.
 *
 * @param ctx - Canvas rendering context
 * @param arenaWidth - Arena width in pixels
 * @param arenaHeight - Arena height in pixels
 * @param cellSize - Size of each grid cell in pixels
 * @param alpha - Opacity of the grid lines (0-1)
 */
export function drawBackgroundGrid(
  ctx: CanvasRenderingContext2D,
  arenaWidth: number,
  _arenaHeight: number,
  cellSize: number,
  alpha: number = 0.35
): void {
  if (cellSize <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#000000'; // Black grid lines
  ctx.lineWidth = 1;

  // Grid boundaries
  const numCols = Math.ceil(arenaWidth / cellSize);

  // No man's land zone (exclude from grid)
  const noMansLandStartRow = GRID_DEPLOYMENT_ROWS;
  const noMansLandEndRow = GRID_DEPLOYMENT_ROWS + GRID_NO_MANS_LAND_ROWS;

  // Enemy deployment zone: rows 0 to GRID_DEPLOYMENT_ROWS
  // No man's land: rows GRID_DEPLOYMENT_ROWS to GRID_DEPLOYMENT_ROWS + GRID_NO_MANS_LAND_ROWS
  // Allied deployment zone: rows after no man's land to GRID_TOTAL_ROWS

  // Vertical lines - draw in two segments (above and below no man's land)
  for (let col = 0; col <= numCols; col++) {
    const x = col * cellSize;

    // Enemy zone segment (top)
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, noMansLandStartRow * cellSize);
    ctx.stroke();

    // Allied zone segment (bottom)
    ctx.beginPath();
    ctx.moveTo(x, noMansLandEndRow * cellSize);
    ctx.lineTo(x, GRID_TOTAL_ROWS * cellSize);
    ctx.stroke();
  }

  // Horizontal lines - skip no man's land rows entirely (including boundaries)
  for (let row = 0; row <= GRID_TOTAL_ROWS; row++) {
    // Skip all lines in and around no man's land
    if (row >= noMansLandStartRow && row <= noMansLandEndRow) continue;

    const y = row * cellSize;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(arenaWidth, y);
    ctx.stroke();
  }

  ctx.restore();
}

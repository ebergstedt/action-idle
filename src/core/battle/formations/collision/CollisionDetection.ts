/**
 * Collision Detection for Formation Placement
 *
 * Grid-based collision detection system that ensures squads never overlap.
 */

import { FORMATION_GRID_STEP } from '../../BattleConfig';
import { SquadBounds, SquadFootprint } from '../types';

/**
 * Check if two axis-aligned bounding boxes overlap.
 *
 * Uses the separating axis theorem simplified for AABBs:
 * Two boxes DON'T overlap if there's a gap on any axis.
 * They DO overlap if there's no gap on both axes.
 *
 * @param a - First bounding box
 * @param b - Second bounding box
 * @param padding - Extra spacing to enforce between boxes (usually 0 since padding is in footprint)
 * @returns true if boxes overlap (collision), false if no overlap
 */
export function boundsOverlap(a: SquadBounds, b: SquadBounds, padding: number = 0): boolean {
  return !(
    a.x + a.width + padding <= b.x ||
    b.x + b.width + padding <= a.x ||
    a.y + a.height + padding <= b.y ||
    b.y + b.height + padding <= a.y
  );
}

/**
 * Generate all valid grid positions within a zone, sorted by distance from target.
 *
 * @param targetX - Desired X position (we want to be as close as possible)
 * @param targetY - Desired Y position
 * @param zoneLeft - Left boundary of valid placement area
 * @param zoneRight - Right boundary
 * @param zoneTop - Top boundary
 * @param zoneBottom - Bottom boundary
 * @param gridStep - Distance between grid points
 * @returns Array of positions sorted by distance from target
 */
export function generateSortedGridPositions(
  targetX: number,
  targetY: number,
  zoneLeft: number,
  zoneRight: number,
  zoneTop: number,
  zoneBottom: number,
  gridStep: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number; dist: number }[] = [];

  // Generate all grid positions within the zone
  for (let x = zoneLeft; x <= zoneRight; x += gridStep) {
    for (let y = zoneTop; y <= zoneBottom; y += gridStep) {
      const dx = x - targetX;
      const dy = y - targetY;
      positions.push({ x, y, dist: dx * dx + dy * dy });
    }
  }

  // Sort by distance from target (closest first)
  positions.sort((a, b) => a.dist - b.dist);

  return positions.map(({ x, y }) => ({ x, y }));
}

/**
 * Find a valid position for a squad that doesn't overlap with existing placements.
 *
 * Algorithm:
 * 1. Get all grid positions sorted by distance from target
 * 2. Try each position in order (closest first)
 * 3. Check if placing the squad here would collide with any placed squad
 * 4. Return the first non-colliding position
 *
 * @param footprint - Size of the squad to place (with padding)
 * @param targetX - Ideal X position (center of squad)
 * @param targetY - Ideal Y position (center of squad)
 * @param placedSquads - Already-placed squads to avoid
 * @param zoneLeft - Left boundary
 * @param zoneRight - Right boundary
 * @param zoneTop - Top boundary
 * @param zoneBottom - Bottom boundary
 * @param padding - Extra padding (usually 0, padding is in footprint)
 * @returns Valid position as close to target as possible
 */
export function findNonOverlappingPosition(
  footprint: SquadFootprint,
  targetX: number,
  targetY: number,
  placedSquads: SquadBounds[],
  zoneLeft: number,
  zoneRight: number,
  zoneTop: number,
  zoneBottom: number,
  padding: number
): { x: number; y: number } {
  const gridStep = FORMATION_GRID_STEP;

  // Generate grid positions sorted by distance from target
  const gridPositions = generateSortedGridPositions(
    targetX,
    targetY,
    zoneLeft + footprint.width / 2,
    zoneRight - footprint.width / 2,
    zoneTop + footprint.height / 2,
    zoneBottom - footprint.height / 2,
    gridStep
  );

  // Try each grid position in order of distance
  for (const pos of gridPositions) {
    const candidate: SquadBounds = {
      x: pos.x - footprint.width / 2,
      y: pos.y - footprint.height / 2,
      width: footprint.width,
      height: footprint.height,
    };

    // Check for overlap with all placed squads
    const hasOverlap = placedSquads.some((placed) => boundsOverlap(candidate, placed, padding));

    if (!hasOverlap) {
      return { x: pos.x, y: pos.y };
    }
  }

  // Fallback: return target position (shouldn't happen with proper zone sizing)
  return { x: targetX, y: targetY };
}

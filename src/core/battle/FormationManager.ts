/**
 * Formation Manager
 *
 * Handles unit formation templates and spawn positioning for both allied and enemy armies.
 * Pure game logic - no React/browser dependencies.
 *
 * Godot equivalent: Resource files for formations, spawner node.
 *
 * =============================================================================
 * DESIGN DECISIONS & REASONING
 * =============================================================================
 *
 * 1. WHY DETERMINISTIC FORMATIONS?
 *    -----------------------------------------------------------------
 *    Decision: Use seeded random (wave number as seed) instead of true random.
 *
 *    Reasoning:
 *    - Reproducibility: Same wave always produces same formation for debugging
 *    - Fairness: Players can't "reroll" to get easier formations
 *    - Testing: Unit tests can verify exact expected positions
 *    - Replay: Could support replays or sharing formations
 *
 *    Implementation: createSeededRandom(waveNumber) produces consistent
 *    pseudo-random sequence. Enemy/allied seeds are offset to differ.
 *
 * 2. WHY GRID-BASED COLLISION DETECTION?
 *    -----------------------------------------------------------------
 *    Decision: Place squads on a discrete grid and check for overlap.
 *
 *    Reasoning:
 *    - Squads vary in size (1-unit vs 9-unit squads have different footprints)
 *    - Simple percentage-based spacing doesn't account for actual sizes
 *    - Need guaranteed non-overlap regardless of squad composition
 *
 *    Alternative considered: Physics-based separation (push overlapping squads apart)
 *    Rejected because: Results in unpredictable final positions, harder to control
 *
 *    Implementation: generateSortedGridPositions() creates candidate positions,
 *    sorted by distance from target. findNonOverlappingPosition() tries each
 *    until finding one that doesn't collide with placed squads.
 *
 * 3. WHY BUILD PADDING INTO FOOTPRINTS?
 *    -----------------------------------------------------------------
 *    Decision: Include spacing padding in the squad footprint calculation itself.
 *
 *    Reasoning:
 *    - Simpler collision detection (no separate padding parameter needed)
 *    - Padding is visually part of the squad's "claimed space"
 *    - Easier to adjust - change one constant (BASE_SQUAD_PADDING_H/V)
 *
 *    Alternative considered: Add padding during collision checks
 *    Rejected because: Easy to forget, leads to inconsistent spacing
 *
 *    Implementation: calculateSquadFootprint() adds paddingH*2 and paddingV*2
 *    to the base dimensions.
 *
 * 4. WHY ROLE-BASED FORMATION PATTERNS?
 *    -----------------------------------------------------------------
 *    Decision: Group units by role (front/back/flank), then position by pattern.
 *
 *    Reasoning:
 *    - Decouples unit types from positions (warrior doesn't know where it goes)
 *    - Patterns can be designed independently of unit composition
 *    - Easy to add new units without changing formation logic
 *    - Supports role swapping for variety
 *
 *    Alternative considered: Hard-coded positions per unit type
 *    Rejected because: Inflexible, doesn't scale with new unit types
 *
 *    Implementation: Units have formationRole in their definition.
 *    Patterns define RoleConfig for each role. Units are grouped by role,
 *    then each group is positioned according to its RoleConfig.
 *
 * 5. WHY ROLE SWAPPING?
 *    -----------------------------------------------------------------
 *    Decision: 35% chance to swap roles (e.g., front↔back) for enemy formations.
 *
 *    Reasoning:
 *    - Prevents predictable "hounds always in front" pattern
 *    - Creates tactical variety (sometimes fangs lead, sometimes hang back)
 *    - More interesting for the player to face varied challenges
 *    - Still deterministic (same wave = same swap decision)
 *
 *    Implementation: createRoleMapper() produces a mapping function.
 *    When grouping units, we apply: groupedRole = roleMapper(unit.formationRole)
 *
 * 6. WHY FIXED ALLIED FORMATIONS?
 *    -----------------------------------------------------------------
 *    Decision: Allied formation is always CLASSIC_FORMATION, not varied.
 *
 *    Reasoning:
 *    - Player expects consistent starting position for their army
 *    - Allows player to develop strategies around known formation
 *    - Variety comes from enemy formations, not own army
 *    - Player can manually reposition before battle starts
 *
 *    Note: calculateDeterministicAlliedPositions() exists if varied allied
 *    formations are desired in the future.
 *
 * 7. WHY SPREAD TYPES (line, wide, left, right)?
 *    -----------------------------------------------------------------
 *    Decision: Define horizontal distribution algorithms as SpreadType enum.
 *
 *    Reasoning:
 *    - Different tactical formations need different spreads
 *    - 'wide' creates pincer formations (units on both edges)
 *    - 'left'/'right' creates hammer formations (concentrated on one side)
 *    - 'line' is the standard even distribution
 *
 *    Implementation: Each SpreadType has specific placement logic in the
 *    position calculation functions.
 *
 * =============================================================================
 * COORDINATE SYSTEM
 * =============================================================================
 *
 * The arena uses standard screen coordinates (Y increases downward):
 *
 *     Y = 0  ┌─────────────────────────────┐  ← Top of screen
 *            │     ENEMY DEPLOYMENT ZONE    │
 *            │   (zoneHeightPercent of H)   │
 *            │                              │
 *            │  yPosition 0 = enemy front   │  ← Closest to player
 *            │  yPosition 1 = enemy back    │  ← Furthest from player
 *            ├──────────────────────────────┤
 *            │       NEUTRAL ZONE           │
 *            ├──────────────────────────────┤
 *            │     ALLIED DEPLOYMENT ZONE   │
 *            │                              │
 *            │  yPosition 0 = allied front  │  ← Closest to enemy
 *            │  yPosition 1 = allied back   │  ← Furthest from enemy
 *     Y = H  └─────────────────────────────┘  ← Bottom of screen
 *
 * Key: yPosition is a fraction (0-1) within the deployment zone, where 0 is
 * the "front" (toward the enemy) and 1 is the "back" (away from enemy).
 *
 * =============================================================================
 * FORMATION ROLES (from units/types.ts)
 * =============================================================================
 *
 * - FRONT: Melee units (hounds) - naturally positioned closest to enemy
 * - BACK:  Ranged units (fangs) - naturally positioned behind for protection
 * - FLANK: Mobile units (crawlers) - naturally positioned on sides for maneuvers
 *
 * Note: Role swapping can override these natural positions for variety.
 *
 * =============================================================================
 * ALGORITHM OVERVIEW
 * =============================================================================
 *
 * calculateDeterministicEnemyPositions():
 *
 * 1. Create seeded RNG from wave number
 * 2. Select formation pattern (cycles with 20% variation chance)
 * 3. Determine role swap (35% chance)
 * 4. Group units by (potentially swapped) role
 * 5. Shuffle each group for variety
 * 6. For each role group:
 *    a. Calculate target Y from pattern's yPosition
 *    b. Calculate footprints for all squads
 *    c. Determine starting X from spread type
 *    d. For each squad:
 *       - Find non-overlapping position via grid search
 *       - Record placed bounds
 *       - Add to result positions
 * 7. Return all spawn positions
 *
 * =============================================================================
 * USAGE
 * =============================================================================
 *
 * Enemy (varies by wave):
 *   const composition = getEnemyCompositionForWave(waveNumber, registry);
 *   const positions = calculateDeterministicEnemyPositions(
 *     composition, registry, bounds, waveNumber
 *   );
 *
 * Allied (fixed classic formation):
 *   const positions = calculateAlliedSpawnPositions(CLASSIC_FORMATION, bounds);
 *
 * =============================================================================
 * GODOT MIGRATION
 * =============================================================================
 *
 * - Patterns → Resource files (.tres)
 * - Seeded RNG → RandomNumberGenerator with seed
 * - Grid search → Same algorithm, GDScript syntax
 * - FormationRole → String enum or StringName
 */

import { Vector2 } from '../physics/Vector2';
import { createSeededRandom, shuffle } from '../utils/Random';
import { UnitDefinition, FormationRole } from './units/types';
import { IUnitRegistry } from './units/IUnitRegistry';
import {
  FORMATION_SPAWN_MARGIN,
  FORMATION_WIDTH_SCALE,
  FORMATION_HEIGHT_SCALE,
  FORMATION_CENTER_OFFSET,
  ENEMY_SPAWN_MAX_COLS,
  ENEMY_SPAWN_JITTER,
  calculateEnemyCount,
  BASE_SQUAD_UNIT_SPACING,
  SQUAD_MAX_COLUMNS,
  BASE_SQUAD_PADDING_H,
  BASE_SQUAD_PADDING_V,
  FORMATION_GRID_STEP,
  FORMATION_WEDGE_Y_FACTOR,
  scaleValue,
  PATTERN_VARIATION_CHANCE,
  ROLE_SWAP_CHANCE,
  LEGACY_ENEMY_KNIGHT_RATIO,
  LEGACY_ENEMY_ARCHER_RATIO,
  ENEMY_ROLE_FRONT_RATIO,
  ENEMY_ROLE_BACK_RATIO,
} from './BattleConfig';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Unit types currently supported in formations.
 * Matches the unit IDs in /src/data/units/*.json
 */
export type UnitType = 'hound' | 'fang' | 'crawler' | 'arclight' | 'marksman' | 'void_eye';

/**
 * A unit placement within a legacy FormationTemplate.
 * Uses normalized coordinates relative to formation center.
 * @deprecated New formations use role-based patterns instead.
 */
export interface UnitPlacement {
  type: UnitType;
  /** Position relative to formation center. X: -1 to 1 (left to right), Y: 0 to 1 (front to back) */
  relativePosition: Vector2;
}

/**
 * Legacy formation template with fixed unit positions.
 * @deprecated Use EnemyFormationPattern with calculateDeterministicEnemyPositions instead.
 */
export interface FormationTemplate {
  id: string;
  name: string;
  placements: UnitPlacement[];
}

/**
 * Final calculated spawn position for a unit.
 * This is the output of all formation calculations.
 */
export interface SpawnPosition {
  type: UnitType;
  /** Absolute position in arena coordinates (pixels) */
  position: Vector2;
}

/**
 * Arena dimensions needed for formation calculations.
 */
export interface ArenaBounds {
  width: number;
  height: number;
  /** Fraction of arena height for each deployment zone (0-1) */
  zoneHeightPercent: number;
}

/**
 * Dimensions of a squad's footprint for collision detection.
 * INCLUDES padding for spacing between squads.
 *
 * Why padding is included:
 * - Simplifies collision detection (no separate padding parameter)
 * - Ensures consistent spacing regardless of where collision check happens
 * - Footprint represents the "claimed space" of the squad
 */
export interface SquadFootprint {
  /** Total width including padding on both sides */
  width: number;
  /** Total height including padding on top and bottom */
  height: number;
}

/**
 * Axis-aligned bounding box for a placed squad.
 * Used for collision detection during placement.
 */
export interface SquadBounds {
  x: number; // Left edge (absolute pixel coordinate)
  y: number; // Top edge (absolute pixel coordinate)
  width: number;
  height: number;
}

// =============================================================================
// FOOTPRINT & COLLISION DETECTION
// =============================================================================
// These functions implement the grid-based placement system that ensures
// squads never overlap, regardless of their sizes.

/**
 * Calculates the footprint (bounding box) of a squad.
 *
 * The footprint includes:
 * 1. Base dimensions: (cols-1)*spacing + unitSize for each axis
 * 2. Padding: Added to all sides for spacing between squads
 *
 * Example for 6-unit squad (3 cols × 2 rows, unitSize=10, spacing=18, padding=12):
 *   Base width  = (3-1)*18 + 10 = 46px
 *   Base height = (2-1)*18 + 10 = 28px
 *   With padding: width=46+24=70px, height=28+20=48px
 *
 * Why padding is built-in:
 * - Collision detection doesn't need separate padding logic
 * - Guaranteed consistent spacing across all placement code
 * - Single source of truth for squad spacing
 *
 * @param definition - Unit definition containing squadSize and visuals.baseSize
 * @param arenaHeight - Current arena height for scaling calculations
 * @returns Footprint with padding included
 */
export function calculateSquadFootprint(
  definition: UnitDefinition,
  arenaHeight: number
): SquadFootprint {
  const squadSize = definition.baseStats.squadSize ?? 1;
  const spacing = scaleValue(BASE_SQUAD_UNIT_SPACING, arenaHeight);
  const unitSize = scaleValue(definition.visuals.baseSize, arenaHeight);
  const paddingH = scaleValue(BASE_SQUAD_PADDING_H, arenaHeight);
  const paddingV = scaleValue(BASE_SQUAD_PADDING_V, arenaHeight);

  if (squadSize <= 1) {
    // Single unit: just unit size plus padding on all sides
    return {
      width: unitSize + paddingH * 2,
      height: unitSize + paddingV * 2,
    };
  }

  const cols = Math.min(squadSize, SQUAD_MAX_COLUMNS);
  const rows = Math.ceil(squadSize / cols);

  // Squad bounds: from center of top-left unit to center of bottom-right unit, plus unit radius
  // Then add padding on all sides for spacing between squads
  const baseWidth = (cols - 1) * spacing + unitSize;
  const baseHeight = (rows - 1) * spacing + unitSize;

  return {
    width: baseWidth + paddingH * 2,
    height: baseHeight + paddingV * 2,
  };
}

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
function boundsOverlap(a: SquadBounds, b: SquadBounds, padding: number = 0): boolean {
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
 * Why a grid instead of continuous positions?
 * - Discrete positions make collision detection predictable
 * - 15px grid step balances precision vs performance
 * - Sorted by distance ensures we find closest valid position first
 *
 * Algorithm:
 * 1. Generate all (x,y) positions on the grid within zone bounds
 * 2. Calculate squared distance from target for each
 * 3. Sort by distance (ascending)
 * 4. Return positions without distances
 *
 * @param targetX - Desired X position (we want to be as close as possible)
 * @param targetY - Desired Y position
 * @param zoneLeft - Left boundary of valid placement area
 * @param zoneRight - Right boundary
 * @param zoneTop - Top boundary
 * @param zoneBottom - Bottom boundary
 * @param gridStep - Distance between grid points (15px default)
 * @returns Array of positions sorted by distance from target
 */
function generateSortedGridPositions(
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
 * This is the core of the collision detection system:
 * 1. Get all grid positions sorted by distance from target
 * 2. Try each position in order (closest first)
 * 3. Check if placing the squad here would collide with any placed squad
 * 4. Return the first non-colliding position
 *
 * Why "closest first"?
 * - Maintains formation shape as much as possible
 * - Only deviates from target when necessary
 * - Produces visually coherent results
 *
 * Performance note: For typical formations (10-15 squads), this is fast enough.
 * For larger formations, consider spatial partitioning (quadtree).
 *
 * @param footprint - Size of the squad to place (with padding)
 * @param targetX - Ideal X position (center of squad)
 * @param targetY - Ideal Y position (center of squad)
 * @param placedSquads - Already-placed squads to avoid
 * @param zoneLeft/Right/Top/Bottom - Valid placement boundaries
 * @param padding - Extra padding (usually 0, padding is in footprint)
 * @returns Valid position as close to target as possible
 */
function findNonOverlappingPosition(
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
  // Grid step size - smaller = more precision but slower
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

// =============================================================================
// ENEMY FORMATION PATTERNS
// =============================================================================

/**
 * Spread type for positioning units within a formation area.
 * - line: Even horizontal spread
 * - wedge: V-shape with edges pushed back
 * - scattered: Randomized positions
 * - wide: Split between left and right flanks
 * - left: Grouped on the left side
 * - right: Grouped on the right side
 */
export type SpreadType = 'line' | 'wedge' | 'scattered' | 'wide' | 'left' | 'right';

/**
 * Configuration for how each role is positioned within a pattern.
 */
export interface RoleConfig {
  /** Y position as fraction of zone (0 = top/front, 1 = bottom/back) */
  yPosition: number;
  /** Spread algorithm for X positioning */
  spread: SpreadType;
  /** Width multiplier (fraction of available width) */
  widthFraction: number;
}

/**
 * Enemy formation pattern defining where each role group is positioned.
 */
export interface EnemyFormationPattern {
  id: string;
  name: string;
  front: RoleConfig;
  back: RoleConfig;
  flank: RoleConfig;
}

/**
 * Default enemy formation patterns.
 * Selected based on wave number with occasional random variation.
 *
 * Pattern design notes:
 * - yPosition: 0 = very front (aggressive), 1 = very back (defensive)
 * - Front role: melee units, should be toward enemy
 * - Back role: ranged units, should be protected behind front
 * - Flank role: mobile units on the sides
 */
export const DEFAULT_ENEMY_PATTERNS: EnemyFormationPattern[] = [
  {
    id: 'battle_line',
    name: 'Battle Line',
    // Classic wide formation using full arena width
    front: { yPosition: 0.15, spread: 'line', widthFraction: 0.9 },
    back: { yPosition: 0.5, spread: 'line', widthFraction: 0.95 },
    flank: { yPosition: 0.32, spread: 'wide', widthFraction: 0.98 },
  },
  {
    id: 'left_hammer',
    name: 'Left Hammer',
    // Heavy left flank - all crawlers on left, fangs spread wide
    front: { yPosition: 0.2, spread: 'line', widthFraction: 0.95 },
    back: { yPosition: 0.55, spread: 'wide', widthFraction: 0.9 },
    flank: { yPosition: 0.12, spread: 'left', widthFraction: 0.45 },
  },
  {
    id: 'right_hammer',
    name: 'Right Hammer',
    // Heavy right flank - all crawlers on right, fangs spread wide
    front: { yPosition: 0.2, spread: 'line', widthFraction: 0.95 },
    back: { yPosition: 0.55, spread: 'wide', widthFraction: 0.9 },
    flank: { yPosition: 0.12, spread: 'right', widthFraction: 0.45 },
  },
  {
    id: 'refused_flank',
    name: 'Refused Flank',
    // Strong left, weak right - diagonal formation
    front: { yPosition: 0.1, spread: 'left', widthFraction: 0.6 },
    back: { yPosition: 0.4, spread: 'line', widthFraction: 0.9 },
    flank: { yPosition: 0.25, spread: 'right', widthFraction: 0.35 },
  },
  {
    id: 'wide_envelopment',
    name: 'Wide Envelopment',
    // Spread across entire width, flanks pushed forward
    front: { yPosition: 0.25, spread: 'line', widthFraction: 0.7 },
    back: { yPosition: 0.55, spread: 'line', widthFraction: 0.95 },
    flank: { yPosition: 0.08, spread: 'wide', widthFraction: 0.98 },
  },
];

// =============================================================================
// FORMATION VARIETY SYSTEM
// =============================================================================
// These constants and functions control how formations vary between waves.
// The goal is unpredictability while maintaining tactical coherence.

// PATTERN_VARIATION_CHANCE imported from BattleConfig

// ROLE_SWAP_CHANCE imported from BattleConfig

/**
 * Available role swap configurations.
 *
 * Design rationale:
 * - Empty swap (no change) is included for 25% "normal" chance when swap triggers
 * - front↔back: Most impactful - melee/ranged positions swap
 * - front↔flank: Warriors go to sides, crawlers go center
 * - back↔flank: Archers spread to flanks, crawlers group behind
 *
 * Not included: All three roles swapping (too chaotic, loses formation identity)
 */
type RoleSwap = { from: FormationRole; to: FormationRole };
const ROLE_SWAPS: RoleSwap[][] = [
  [], // No swap (identity mapping)
  [{ from: 'front', to: 'back' }], // Swap front and back
  [{ from: 'front', to: 'flank' }], // Swap front and flank
  [{ from: 'back', to: 'flank' }], // Swap back and flank
];

/**
 * Creates a role mapping function from a swap configuration.
 *
 * How it works:
 * 1. Start with identity mapping (front→front, back→back, flank→flank)
 * 2. For each swap in the config, exchange the mappings
 * 3. Return a function that applies the final mapping
 *
 * Example: [{from: 'front', to: 'back'}]
 * Result: front→back, back→front, flank→flank
 *
 * @param swaps - Array of role exchanges to apply
 * @returns Function that maps original role to (possibly swapped) role
 */
function createRoleMapper(swaps: RoleSwap[]): (originalRole: FormationRole) => FormationRole {
  if (swaps.length === 0) {
    return (role) => role;
  }

  const mapping: Record<FormationRole, FormationRole> = {
    front: 'front',
    back: 'back',
    flank: 'flank',
  };

  for (const swap of swaps) {
    const temp = mapping[swap.from];
    mapping[swap.from] = mapping[swap.to];
    mapping[swap.to] = temp;
  }

  return (role) => mapping[role];
}

// =============================================================================
// ALLIED FORMATION PATTERNS
// =============================================================================

/**
 * Allied formation patterns.
 * Y positions are inverted from enemy patterns:
 * - yPosition 0 = front (toward enemy, top of ally zone)
 * - yPosition 1 = back (away from enemy, bottom of ally zone)
 */
export const DEFAULT_ALLIED_PATTERNS: EnemyFormationPattern[] = [
  {
    id: 'classic_line',
    name: 'Classic Battle Line',
    // Warriors front, Archers back, Knights on flanks
    front: { yPosition: 0.15, spread: 'line', widthFraction: 0.85 },
    back: { yPosition: 0.6, spread: 'line', widthFraction: 0.9 },
    flank: { yPosition: 0.35, spread: 'wide', widthFraction: 0.95 },
  },
  {
    id: 'defensive',
    name: 'Defensive Formation',
    // Archers front (will kite), Warriors middle as wall, Knights back as reserve
    front: { yPosition: 0.5, spread: 'line', widthFraction: 0.8 },
    back: { yPosition: 0.15, spread: 'line', widthFraction: 0.9 },
    flank: { yPosition: 0.7, spread: 'wide', widthFraction: 0.9 },
  },
  {
    id: 'cavalry_charge',
    name: 'Cavalry Charge',
    // Knights front (aggressive), Warriors middle support, Archers back
    front: { yPosition: 0.35, spread: 'line', widthFraction: 0.85 },
    back: { yPosition: 0.65, spread: 'line', widthFraction: 0.9 },
    flank: { yPosition: 0.1, spread: 'line', widthFraction: 0.7 },
  },
  {
    id: 'left_heavy',
    name: 'Left Heavy',
    // Concentrate forces on left flank
    front: { yPosition: 0.2, spread: 'left', widthFraction: 0.6 },
    back: { yPosition: 0.55, spread: 'line', widthFraction: 0.85 },
    flank: { yPosition: 0.1, spread: 'left', widthFraction: 0.4 },
  },
  {
    id: 'right_heavy',
    name: 'Right Heavy',
    // Concentrate forces on right flank
    front: { yPosition: 0.2, spread: 'right', widthFraction: 0.6 },
    back: { yPosition: 0.55, spread: 'line', widthFraction: 0.85 },
    flank: { yPosition: 0.1, spread: 'right', widthFraction: 0.4 },
  },
];

/**
 * Selects an allied formation pattern for a given wave number.
 */
export function selectAlliedPatternForWave(
  waveNumber: number,
  random: () => number
): EnemyFormationPattern {
  const patternCount = DEFAULT_ALLIED_PATTERNS.length;

  // Base selection: cycle through patterns
  let patternIndex = (waveNumber - 1) % patternCount;

  // 20% chance to pick a different pattern for variety
  if (random() < PATTERN_VARIATION_CHANCE) {
    patternIndex = Math.floor(random() * patternCount);
  }

  return DEFAULT_ALLIED_PATTERNS[patternIndex];
}

// Legacy formation template (kept for backward compatibility)
/**
 * Classic battle formation with all T1 units.
 * 12 squads total: 2 Hounds (front), 2 Fangs (back), 2 Crawlers (flanks),
 * 2 Arclights (back), 2 Marksmen (back), 2 Void Eyes (flanks)
 * @deprecated Use calculateDeterministicAlliedPositions instead
 */
export const CLASSIC_FORMATION: FormationTemplate = {
  id: 'classic',
  name: 'Classic Battle Line',
  placements: [
    // Front line - 2 Hounds (melee tanks)
    { type: 'hound', relativePosition: new Vector2(-0.15, 0) },
    { type: 'hound', relativePosition: new Vector2(0.15, 0) },
    // Back line - 2 Fangs (ranged swarm)
    { type: 'fang', relativePosition: new Vector2(-0.25, 0.5) },
    { type: 'fang', relativePosition: new Vector2(0.25, 0.5) },
    // Back line - 2 Arclights (artillery)
    { type: 'arclight', relativePosition: new Vector2(-0.1, 0.65) },
    { type: 'arclight', relativePosition: new Vector2(0.1, 0.65) },
    // Back line - 2 Marksmen (snipers)
    { type: 'marksman', relativePosition: new Vector2(-0.35, 0.55) },
    { type: 'marksman', relativePosition: new Vector2(0.35, 0.55) },
    // Flanks - 2 Crawlers (fast melee swarm)
    { type: 'crawler', relativePosition: new Vector2(-0.5, 0.25) },
    { type: 'crawler', relativePosition: new Vector2(0.5, 0.25) },
    // Flanks - 2 Void Eyes (scouts)
    { type: 'void_eye', relativePosition: new Vector2(-0.45, 0.1) },
    { type: 'void_eye', relativePosition: new Vector2(0.45, 0.1) },
  ],
};

/**
 * Calculates spawn positions for allied units.
 * @deprecated Use calculateDeterministicAlliedPositions for varied formations.
 */
export function calculateAlliedSpawnPositions(
  formation: FormationTemplate,
  bounds: ArenaBounds
): SpawnPosition[] {
  const zoneHeight = bounds.height * bounds.zoneHeightPercent;
  const allyZoneTop = bounds.height - zoneHeight;

  const centerX = bounds.width / 2;
  const centerY =
    allyZoneTop +
    FORMATION_SPAWN_MARGIN +
    (zoneHeight - FORMATION_SPAWN_MARGIN * 2) * FORMATION_CENTER_OFFSET;

  // Scale factor based on arena size
  const scaleX = (bounds.width - FORMATION_SPAWN_MARGIN * 2) * FORMATION_WIDTH_SCALE;
  const scaleY = (zoneHeight - FORMATION_SPAWN_MARGIN * 2) * FORMATION_HEIGHT_SCALE;

  return formation.placements.map((placement) => ({
    type: placement.type,
    position: new Vector2(
      centerX + placement.relativePosition.x * scaleX,
      centerY + placement.relativePosition.y * scaleY
    ),
  }));
}

/**
 * Gets the default allied composition with all T1 units.
 * 12 squads: 2 of each T1 unit type
 */
export function getDefaultAlliedComposition(): UnitType[] {
  return [
    'hound',
    'hound',
    'fang',
    'fang',
    'arclight',
    'arclight',
    'marksman',
    'marksman',
    'crawler',
    'crawler',
    'void_eye',
    'void_eye',
  ];
}

/**
 * Calculates deterministic allied spawn positions based on wave number.
 * Same wave number always produces the same formation.
 * Uses the same grid-based collision detection as enemy formations.
 */
export function calculateDeterministicAlliedPositions(
  composition: UnitType[],
  registry: IUnitRegistry,
  bounds: ArenaBounds,
  waveNumber: number
): SpawnPosition[] {
  if (composition.length === 0) return [];

  // Create seeded random generator (offset by large number to differ from enemy seed)
  const random = createSeededRandom(waveNumber + 10000);

  // Select formation pattern
  const pattern = selectAlliedPatternForWave(waveNumber, random);

  // Calculate zone boundaries (ally zone is at bottom)
  const zoneHeight = bounds.height * bounds.zoneHeightPercent;
  const allyZoneTop = bounds.height - zoneHeight + FORMATION_SPAWN_MARGIN;
  const allyZoneBottom = bounds.height - FORMATION_SPAWN_MARGIN;
  const availableHeight = allyZoneBottom - allyZoneTop;
  const availableWidth = bounds.width - FORMATION_SPAWN_MARGIN * 2;
  const centerX = bounds.width / 2;

  // Group composition by role
  const grouped: Record<FormationRole, { type: UnitType; def: UnitDefinition }[]> = {
    front: [],
    back: [],
    flank: [],
  };

  for (const unitType of composition) {
    const def = registry.tryGet(unitType);
    if (def) {
      grouped[def.formationRole].push({ type: unitType, def });
    }
  }

  // Shuffle each group deterministically for variety within the formation
  shuffle(grouped.front, random);
  shuffle(grouped.back, random);
  shuffle(grouped.flank, random);

  const positions: SpawnPosition[] = [];
  const placedSquads: SquadBounds[] = [];

  // Zone boundaries for collision detection
  const zoneLeft = FORMATION_SPAWN_MARGIN;
  const zoneRight = bounds.width - FORMATION_SPAWN_MARGIN;
  const zoneTop = allyZoneTop;
  const zoneBottom = allyZoneBottom;

  // No extra padding needed - padding is built into squad footprints
  const minPadding = 0;

  // Position each role group using grid-based placement with collision detection
  const roles: FormationRole[] = ['front', 'back', 'flank'];

  for (const role of roles) {
    const config = pattern[role];
    const units = grouped[role];
    if (units.length === 0) continue;

    // Calculate target Y position for this role (ally zone)
    const targetY = allyZoneTop + availableHeight * config.yPosition;

    // Calculate footprints for all units in this role (padding already included)
    const footprints = units.map((u) => calculateSquadFootprint(u.def, bounds.height));

    // Calculate total width needed - footprints already include padding
    let totalWidth = 0;
    for (const fp of footprints) {
      totalWidth += fp.width;
    }

    // Handle 'wide' spread specially - split units between left and right flanks
    if (config.spread === 'wide') {
      const leftCount = Math.ceil(units.length / 2);
      const rightCount = units.length - leftCount;

      // Place left flank units
      let leftX = zoneLeft + footprints[0].width / 2;
      for (let i = 0; i < leftCount; i++) {
        const fp = footprints[i];
        const validPos = findNonOverlappingPosition(
          fp,
          leftX,
          targetY,
          placedSquads,
          zoneLeft,
          zoneRight,
          zoneTop,
          zoneBottom,
          minPadding
        );
        placedSquads.push({
          x: validPos.x - fp.width / 2,
          y: validPos.y - fp.height / 2,
          width: fp.width,
          height: fp.height,
        });
        positions.push({ type: units[i].type, position: new Vector2(validPos.x, validPos.y) });
        leftX += fp.width + minPadding;
      }

      // Place right flank units
      let rightX = zoneRight - footprints[leftCount]?.width / 2 || 0;
      for (let i = 0; i < rightCount; i++) {
        const idx = leftCount + i;
        const fp = footprints[idx];
        const validPos = findNonOverlappingPosition(
          fp,
          rightX,
          targetY,
          placedSquads,
          zoneLeft,
          zoneRight,
          zoneTop,
          zoneBottom,
          minPadding
        );
        placedSquads.push({
          x: validPos.x - fp.width / 2,
          y: validPos.y - fp.height / 2,
          width: fp.width,
          height: fp.height,
        });
        positions.push({ type: units[idx].type, position: new Vector2(validPos.x, validPos.y) });
        rightX -= fp.width + minPadding;
      }
      continue;
    }

    // Determine starting X based on spread type
    let startX: number;
    if (config.spread === 'left') {
      startX = zoneLeft + footprints[0].width / 2;
    } else if (config.spread === 'right') {
      startX = zoneRight - totalWidth + footprints[0].width / 2;
    } else {
      // Center
      startX = centerX - totalWidth / 2 + footprints[0].width / 2;
    }

    // Place each unit with collision detection
    let currentX = startX;

    for (let i = 0; i < units.length; i++) {
      const fp = footprints[i];

      // Calculate target position
      const targetCenterX = currentX;
      let targetCenterY = targetY;

      // Apply spread-specific Y modifications
      if (config.spread === 'wedge') {
        const distFromCenter = Math.abs(targetCenterX - centerX) / (availableWidth / 2);
        targetCenterY += distFromCenter * availableHeight * FORMATION_WEDGE_Y_FACTOR;
      }

      // Find non-overlapping position using grid system
      const validPos = findNonOverlappingPosition(
        fp,
        targetCenterX,
        targetCenterY,
        placedSquads,
        zoneLeft,
        zoneRight,
        zoneTop,
        zoneBottom,
        minPadding
      );

      // Record this squad's bounds
      placedSquads.push({
        x: validPos.x - fp.width / 2,
        y: validPos.y - fp.height / 2,
        width: fp.width,
        height: fp.height,
      });

      // Add to positions
      positions.push({
        type: units[i].type,
        position: new Vector2(validPos.x, validPos.y),
      });

      // Move to next position (using actual footprint width)
      currentX += fp.width + minPadding;
    }
  }

  return positions;
}

// =============================================================================
// LEGACY RANDOM ENEMY SPAWNING (for backward compatibility)
// =============================================================================

/**
 * Generates random enemy spawn positions in a grid with jitter.
 * @deprecated Use calculateDeterministicEnemyPositions for deterministic formations.
 */
export function calculateEnemySpawnPositions(
  composition: UnitType[],
  bounds: ArenaBounds
): SpawnPosition[] {
  const zoneHeight = bounds.height * bounds.zoneHeightPercent;

  const enemyZoneTop = FORMATION_SPAWN_MARGIN;
  const enemyZoneBottom = zoneHeight - FORMATION_SPAWN_MARGIN;

  const availableWidth = bounds.width - FORMATION_SPAWN_MARGIN * 2;
  const availableHeight = enemyZoneBottom - enemyZoneTop;

  // Grid layout
  const cols = Math.min(ENEMY_SPAWN_MAX_COLS, composition.length);
  const rows = Math.ceil(composition.length / cols);
  const cellWidth = availableWidth / cols;
  const cellHeight = availableHeight / Math.max(rows, 1);

  // Shuffle for variety
  const shuffled = [...composition].sort(() => Math.random() - 0.5);

  return shuffled.map((type, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    // Base position in grid cell center
    const baseX = FORMATION_SPAWN_MARGIN + col * cellWidth + cellWidth / 2;
    const baseY = enemyZoneTop + row * cellHeight + cellHeight / 2;

    // Add jitter
    const jitterX = (Math.random() - 0.5) * cellWidth * ENEMY_SPAWN_JITTER;
    const jitterY = (Math.random() - 0.5) * cellHeight * ENEMY_SPAWN_JITTER;

    return {
      type,
      position: new Vector2(baseX + jitterX, baseY + jitterY),
    };
  });
}

/**
 * Default enemy composition for wave 1.
 * 12 squads: 2 of each T1 unit type
 */
export function getDefaultEnemyComposition(): UnitType[] {
  return [
    'hound',
    'hound',
    'fang',
    'fang',
    'arclight',
    'arclight',
    'marksman',
    'marksman',
    'crawler',
    'crawler',
    'void_eye',
    'void_eye',
  ];
}

// =============================================================================
// DATA-DRIVEN ENEMY COMPOSITION & FORMATION
// =============================================================================

/**
 * Gets all unit definitions available for a given wave number.
 * Filters by wavePermit property.
 */
export function getAvailableUnitsForWave(
  waveNumber: number,
  registry: IUnitRegistry
): UnitDefinition[] {
  return registry.getAll().filter((def) => def.wavePermit <= waveNumber);
}

/**
 * Gets the formation role from a unit definition.
 */
export function getUnitRole(definition: UnitDefinition): FormationRole {
  return definition.formationRole;
}

/**
 * Scales enemy composition based on wave number using data-driven unit availability.
 * Uses wavePermit from unit definitions instead of hardcoded wave thresholds.
 */
export function getEnemyCompositionForWave(
  waveNumber: number,
  registry?: IUnitRegistry
): UnitType[] {
  const totalEnemies = calculateEnemyCount(waveNumber);
  const composition: UnitType[] = [];

  // If no registry provided, use legacy fixed ratios
  if (!registry) {
    // Legacy fallback: fixed percentages from BattleConfig
    const hasCrawlers = waveNumber >= 3;
    const crawlerCount = hasCrawlers ? Math.floor(totalEnemies * LEGACY_ENEMY_KNIGHT_RATIO) : 0;
    const fangCount = Math.floor(totalEnemies * LEGACY_ENEMY_ARCHER_RATIO);
    const houndCount = totalEnemies - crawlerCount - fangCount;

    for (let i = 0; i < houndCount; i++) composition.push('hound');
    for (let i = 0; i < fangCount; i++) composition.push('fang');
    for (let i = 0; i < crawlerCount; i++) composition.push('crawler');

    return composition;
  }

  // Data-driven approach: use available units from registry
  const availableUnits = getAvailableUnitsForWave(waveNumber, registry);

  if (availableUnits.length === 0) {
    // Fallback if no units available (shouldn't happen)
    for (let i = 0; i < totalEnemies; i++) composition.push('hound');
    return composition;
  }

  // Group by role
  const frontUnits = availableUnits.filter((u) => u.formationRole === 'front');
  const backUnits = availableUnits.filter((u) => u.formationRole === 'back');
  const flankUnits = availableUnits.filter((u) => u.formationRole === 'flank');

  // Calculate counts based on available roles
  // Base distribution from BattleConfig (40% front, 40% back, 20% flank)
  let frontCount = Math.floor(totalEnemies * ENEMY_ROLE_FRONT_RATIO);
  let backCount = Math.floor(totalEnemies * ENEMY_ROLE_BACK_RATIO);
  let flankCount = totalEnemies - frontCount - backCount;

  // Adjust if roles are unavailable
  if (flankUnits.length === 0) {
    // No flank units: redistribute to front/back
    frontCount += Math.floor(flankCount / 2);
    backCount += flankCount - Math.floor(flankCount / 2);
    flankCount = 0;
  }
  if (backUnits.length === 0) {
    // No back units: add to front
    frontCount += backCount;
    backCount = 0;
  }
  if (frontUnits.length === 0) {
    // No front units: add to back
    backCount += frontCount;
    frontCount = 0;
  }

  // Add units from each role
  for (let i = 0; i < frontCount && frontUnits.length > 0; i++) {
    const unit = frontUnits[i % frontUnits.length];
    composition.push(unit.id as UnitType);
  }
  for (let i = 0; i < backCount && backUnits.length > 0; i++) {
    const unit = backUnits[i % backUnits.length];
    composition.push(unit.id as UnitType);
  }
  for (let i = 0; i < flankCount && flankUnits.length > 0; i++) {
    const unit = flankUnits[i % flankUnits.length];
    composition.push(unit.id as UnitType);
  }

  return composition;
}

/**
 * Selects a formation pattern for a given wave number.
 * Uses deterministic selection with occasional random variation.
 */
export function selectPatternForWave(
  waveNumber: number,
  random: () => number
): EnemyFormationPattern {
  const patternCount = DEFAULT_ENEMY_PATTERNS.length;

  // Base selection: cycle through patterns
  let patternIndex = (waveNumber - 1) % patternCount;

  // 20% chance to pick a different pattern for variety
  if (random() < PATTERN_VARIATION_CHANCE) {
    patternIndex = Math.floor(random() * patternCount);
  }

  return DEFAULT_ENEMY_PATTERNS[patternIndex];
}

/**
 * Position with both X and Y offsets for formation placement.
 */
/**
 * Calculates deterministic enemy spawn positions based on wave number.
 * Same wave number always produces the same formation.
 */
export function calculateDeterministicEnemyPositions(
  composition: UnitType[],
  registry: IUnitRegistry,
  bounds: ArenaBounds,
  waveNumber: number
): SpawnPosition[] {
  if (composition.length === 0) return [];

  // Create seeded random generator
  const random = createSeededRandom(waveNumber);

  // Select formation pattern
  const pattern = selectPatternForWave(waveNumber, random);

  // Determine if roles should be swapped (35% chance for variety)
  let roleMapper: (role: FormationRole) => FormationRole = (role) => role;
  if (random() < ROLE_SWAP_CHANCE) {
    // Pick a random swap configuration
    const swapIndex = Math.floor(random() * ROLE_SWAPS.length);
    roleMapper = createRoleMapper(ROLE_SWAPS[swapIndex]);
  }

  // Calculate zone boundaries
  const zoneHeight = bounds.height * bounds.zoneHeightPercent;
  const enemyZoneTop = FORMATION_SPAWN_MARGIN;
  const enemyZoneBottom = zoneHeight - FORMATION_SPAWN_MARGIN;
  const availableHeight = enemyZoneBottom - enemyZoneTop;
  const availableWidth = bounds.width - FORMATION_SPAWN_MARGIN * 2;
  const centerX = bounds.width / 2;

  // Group composition by role (with potential role swapping for variety)
  const grouped: Record<FormationRole, { type: UnitType; def: UnitDefinition }[]> = {
    front: [],
    back: [],
    flank: [],
  };

  for (const unitType of composition) {
    const def = registry.tryGet(unitType);
    if (def) {
      // Apply role swap if active (e.g., hounds might go to 'back' position)
      const mappedRole = roleMapper(def.formationRole);
      grouped[mappedRole].push({ type: unitType, def });
    }
  }

  // Shuffle each group deterministically for variety within the formation
  shuffle(grouped.front, random);
  shuffle(grouped.back, random);
  shuffle(grouped.flank, random);

  const positions: SpawnPosition[] = [];
  const placedSquads: SquadBounds[] = []; // Track all placed squad boundaries

  // Zone boundaries for collision detection
  const zoneLeft = FORMATION_SPAWN_MARGIN;
  const zoneRight = bounds.width - FORMATION_SPAWN_MARGIN;
  const zoneTop = enemyZoneTop;
  const zoneBottom = enemyZoneBottom;

  // No extra padding needed - padding is built into squad footprints
  const minPadding = 0;

  // Position each role group using grid-based placement with collision detection
  const roles: FormationRole[] = ['front', 'back', 'flank'];

  for (const role of roles) {
    const config = pattern[role];
    const units = grouped[role];
    if (units.length === 0) continue;

    // Calculate target Y position for this role
    const targetY = enemyZoneTop + availableHeight * config.yPosition;

    // Calculate footprints for all units in this role (padding already included)
    const footprints = units.map((u) => calculateSquadFootprint(u.def, bounds.height));

    // Calculate total width needed - footprints already include padding
    let totalWidth = 0;
    for (const fp of footprints) {
      totalWidth += fp.width;
    }

    // Handle 'wide' spread specially - split units between left and right flanks
    if (config.spread === 'wide') {
      const leftCount = Math.ceil(units.length / 2);
      const rightCount = units.length - leftCount;

      // Place left flank units
      let leftX = zoneLeft + footprints[0].width / 2;
      for (let i = 0; i < leftCount; i++) {
        const fp = footprints[i];
        const validPos = findNonOverlappingPosition(
          fp,
          leftX,
          targetY,
          placedSquads,
          zoneLeft,
          zoneRight,
          zoneTop,
          zoneBottom,
          minPadding
        );
        placedSquads.push({
          x: validPos.x - fp.width / 2,
          y: validPos.y - fp.height / 2,
          width: fp.width,
          height: fp.height,
        });
        positions.push({ type: units[i].type, position: new Vector2(validPos.x, validPos.y) });
        leftX += fp.width + minPadding;
      }

      // Place right flank units
      let rightX = zoneRight - footprints[leftCount]?.width / 2 || 0;
      for (let i = 0; i < rightCount; i++) {
        const idx = leftCount + i;
        const fp = footprints[idx];
        const validPos = findNonOverlappingPosition(
          fp,
          rightX,
          targetY,
          placedSquads,
          zoneLeft,
          zoneRight,
          zoneTop,
          zoneBottom,
          minPadding
        );
        placedSquads.push({
          x: validPos.x - fp.width / 2,
          y: validPos.y - fp.height / 2,
          width: fp.width,
          height: fp.height,
        });
        positions.push({ type: units[idx].type, position: new Vector2(validPos.x, validPos.y) });
        rightX -= fp.width + minPadding;
      }
      continue; // Skip normal placement for 'wide'
    }

    // Determine starting X based on spread type
    let startX: number;
    if (config.spread === 'left') {
      startX = zoneLeft + footprints[0].width / 2;
    } else if (config.spread === 'right') {
      startX = zoneRight - totalWidth + footprints[0].width / 2;
    } else {
      // Center
      startX = centerX - totalWidth / 2 + footprints[0].width / 2;
    }

    // Place each unit with collision detection
    let currentX = startX;

    for (let i = 0; i < units.length; i++) {
      const fp = footprints[i];

      // Calculate target position
      const targetCenterX = currentX;
      let targetCenterY = targetY;

      // Apply spread-specific Y modifications
      if (config.spread === 'wedge') {
        const distFromCenter = Math.abs(targetCenterX - centerX) / (availableWidth / 2);
        targetCenterY += distFromCenter * availableHeight * FORMATION_WEDGE_Y_FACTOR;
      }

      // Find non-overlapping position using grid system
      const validPos = findNonOverlappingPosition(
        fp,
        targetCenterX,
        targetCenterY,
        placedSquads,
        zoneLeft,
        zoneRight,
        zoneTop,
        zoneBottom,
        minPadding
      );

      // Record this squad's bounds
      placedSquads.push({
        x: validPos.x - fp.width / 2,
        y: validPos.y - fp.height / 2,
        width: fp.width,
        height: fp.height,
      });

      // Add to positions
      positions.push({
        type: units[i].type,
        position: new Vector2(validPos.x, validPos.y),
      });

      // Move to next position (using actual footprint width)
      currentX += fp.width + minPadding;
    }
  }

  return positions;
}

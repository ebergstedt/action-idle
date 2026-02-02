/**
 * Formation Manager
 *
 * Handles unit formation templates and spawn positioning.
 * Pure game logic - no React/browser dependencies.
 *
 * Godot equivalent: Resource files for formations, spawner node.
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
  scaleValue,
} from './BattleConfig';

export type UnitType = 'warrior' | 'archer' | 'knight';

export interface UnitPlacement {
  type: UnitType;
  relativePosition: Vector2; // Position relative to formation center (0-1 normalized)
}

export interface FormationTemplate {
  id: string;
  name: string;
  placements: UnitPlacement[];
}

export interface SpawnPosition {
  type: UnitType;
  position: Vector2;
}

export interface ArenaBounds {
  width: number;
  height: number;
  zoneHeightPercent: number;
}

/**
 * Dimensions of a squad's footprint for spacing calculations.
 */
export interface SquadFootprint {
  width: number;
  height: number;
}

/**
 * Exact boundaries of a placed squad (top-left corner + dimensions).
 */
export interface SquadBounds {
  x: number; // Left edge
  y: number; // Top edge
  width: number;
  height: number;
}

/**
 * Calculates the footprint (bounding box) of a squad based on unit definition.
 * This is the exact space the squad occupies plus padding for spacing between squads.
 * The padding is built into the footprint so collision detection automatically maintains spacing.
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
 * Check if two squad bounds overlap (with optional padding).
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
 * This ensures we always find the closest valid position.
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
 * Uses a grid-based search, starting from the target position and expanding outward.
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
  const gridStep = 15;

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
    // Heavy left flank - all knights on left, archers spread wide
    front: { yPosition: 0.2, spread: 'line', widthFraction: 0.95 },
    back: { yPosition: 0.55, spread: 'wide', widthFraction: 0.9 },
    flank: { yPosition: 0.12, spread: 'left', widthFraction: 0.45 },
  },
  {
    id: 'right_hammer',
    name: 'Right Hammer',
    // Heavy right flank - all knights on right, archers spread wide
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

/**
 * Chance to pick a different pattern than the cycle (for variety).
 */
const PATTERN_VARIATION_CHANCE = 0.2;

/**
 * Chance to swap front/back roles in enemy formation (for variety).
 * This makes warriors sometimes appear in the back and archers in front.
 */
const ROLE_SWAP_CHANCE = 0.35;

/**
 * Role swap configurations for enemy variety.
 * Each swap defines which roles to exchange.
 */
type RoleSwap = { from: FormationRole; to: FormationRole };
const ROLE_SWAPS: RoleSwap[][] = [
  [], // No swap
  [{ from: 'front', to: 'back' }], // Swap front and back
  [{ from: 'front', to: 'flank' }], // Swap front and flank
  [{ from: 'back', to: 'flank' }], // Swap back and flank
];

/**
 * Applies role swaps to create a modified role mapping.
 * Returns a function that maps original roles to swapped roles.
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
 * Classic battle formation: Warriors front, Archers back, Knights on flanks.
 * 10 squads total: 4 Hounds, 4 Fangs, 2 Crawlers
 * @deprecated Use calculateDeterministicAlliedPositions instead
 */
export const CLASSIC_FORMATION: FormationTemplate = {
  id: 'classic',
  name: 'Classic Battle Line',
  placements: [
    // Front line - 4 Hounds (warriors)
    { type: 'warrior', relativePosition: new Vector2(-0.3, 0) },
    { type: 'warrior', relativePosition: new Vector2(-0.1, 0) },
    { type: 'warrior', relativePosition: new Vector2(0.1, 0) },
    { type: 'warrior', relativePosition: new Vector2(0.3, 0) },
    // Back line - 4 Fangs (archers)
    { type: 'archer', relativePosition: new Vector2(-0.3, 0.5) },
    { type: 'archer', relativePosition: new Vector2(-0.1, 0.5) },
    { type: 'archer', relativePosition: new Vector2(0.1, 0.5) },
    { type: 'archer', relativePosition: new Vector2(0.3, 0.5) },
    // Flanks - 2 Crawlers (knights)
    { type: 'knight', relativePosition: new Vector2(-0.5, 0.25) },
    { type: 'knight', relativePosition: new Vector2(0.5, 0.25) },
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
 * Gets the default allied composition.
 * 10 squads: 4 Warriors (front), 4 Archers (back), 2 Knights (flank)
 */
export function getDefaultAlliedComposition(): UnitType[] {
  return [
    'warrior',
    'warrior',
    'warrior',
    'warrior',
    'archer',
    'archer',
    'archer',
    'archer',
    'knight',
    'knight',
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
        targetCenterY += distFromCenter * availableHeight * 0.1;
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
 * 10 squads: 4 Hounds, 4 Fangs, 2 Crawlers
 */
export function getDefaultEnemyComposition(): UnitType[] {
  return [
    'warrior',
    'warrior',
    'warrior',
    'warrior',
    'archer',
    'archer',
    'archer',
    'archer',
    'knight',
    'knight',
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
    // Legacy fallback: fixed percentages
    const hasKnights = waveNumber >= 3;
    const knightCount = hasKnights ? Math.floor(totalEnemies * 0.2) : 0;
    const archerCount = Math.floor(totalEnemies * 0.4);
    const warriorCount = totalEnemies - knightCount - archerCount;

    for (let i = 0; i < warriorCount; i++) composition.push('warrior');
    for (let i = 0; i < archerCount; i++) composition.push('archer');
    for (let i = 0; i < knightCount; i++) composition.push('knight');

    return composition;
  }

  // Data-driven approach: use available units from registry
  const availableUnits = getAvailableUnitsForWave(waveNumber, registry);

  if (availableUnits.length === 0) {
    // Fallback if no units available (shouldn't happen)
    for (let i = 0; i < totalEnemies; i++) composition.push('warrior');
    return composition;
  }

  // Group by role
  const frontUnits = availableUnits.filter((u) => u.formationRole === 'front');
  const backUnits = availableUnits.filter((u) => u.formationRole === 'back');
  const flankUnits = availableUnits.filter((u) => u.formationRole === 'flank');

  // Calculate counts based on available roles
  // Base distribution: 40% front, 40% back, 20% flank
  let frontCount = Math.floor(totalEnemies * 0.4);
  let backCount = Math.floor(totalEnemies * 0.4);
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
      // Apply role swap if active (e.g., warriors might go to 'back' position)
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
        targetCenterY += distFromCenter * availableHeight * 0.1;
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

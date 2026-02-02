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
  FORMATION_JITTER_X,
  FORMATION_JITTER_Y,
  FORMATION_MAX_UNITS_PER_ROW,
  FORMATION_ROW_SPACING,
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
 * Calculates the footprint (bounding box) of a squad based on unit definition.
 * Used to determine proper spacing between squads in formations.
 */
export function calculateSquadFootprint(
  definition: UnitDefinition,
  arenaHeight: number
): SquadFootprint {
  const squadSize = definition.baseStats.squadSize ?? 1;
  const spacing = scaleValue(BASE_SQUAD_UNIT_SPACING, arenaHeight);
  const unitSize = scaleValue(definition.baseStats.size, arenaHeight);

  if (squadSize <= 1) {
    return { width: unitSize, height: unitSize };
  }

  const cols = Math.min(squadSize, SQUAD_MAX_COLUMNS);
  const rows = Math.ceil(squadSize / cols);

  // Grid dimensions plus unit size on edges
  const width = (cols - 1) * spacing + unitSize;
  const height = (rows - 1) * spacing + unitSize;

  return { width, height };
}

// =============================================================================
// ENEMY FORMATION PATTERNS
// =============================================================================

/**
 * Spread type for positioning units within a formation area.
 */
export type SpreadType = 'line' | 'wedge' | 'scattered' | 'clustered' | 'wide';

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
    // Classic formation: melee front, ranged back, flankers on sides
    front: { yPosition: 0.15, spread: 'line', widthFraction: 0.65 },
    back: { yPosition: 0.55, spread: 'line', widthFraction: 0.55 },
    flank: { yPosition: 0.35, spread: 'wide', widthFraction: 0.95 },
  },
  {
    id: 'defensive',
    name: 'Defensive',
    // Pulled back, ranged clustered and protected
    front: { yPosition: 0.3, spread: 'line', widthFraction: 0.7 },
    back: { yPosition: 0.65, spread: 'clustered', widthFraction: 0.45 },
    flank: { yPosition: 0.45, spread: 'wide', widthFraction: 0.9 },
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    // Wedge formation pushing forward
    front: { yPosition: 0.1, spread: 'wedge', widthFraction: 0.55 },
    back: { yPosition: 0.4, spread: 'line', widthFraction: 0.5 },
    flank: { yPosition: 0.2, spread: 'wide', widthFraction: 0.85 },
  },
  {
    id: 'pincer',
    name: 'Pincer',
    // Strong flanks with center held back
    front: { yPosition: 0.35, spread: 'clustered', widthFraction: 0.4 },
    back: { yPosition: 0.6, spread: 'line', widthFraction: 0.5 },
    flank: { yPosition: 0.15, spread: 'wide', widthFraction: 0.98 },
  },
  {
    id: 'echelon',
    name: 'Echelon',
    // Staggered diagonal formation
    front: { yPosition: 0.2, spread: 'wedge', widthFraction: 0.7 },
    back: { yPosition: 0.5, spread: 'wedge', widthFraction: 0.6 },
    flank: { yPosition: 0.35, spread: 'wide', widthFraction: 0.92 },
  },
];

/**
 * Chance to pick a different pattern than the cycle (for variety).
 */
const PATTERN_VARIATION_CHANCE = 0.2;

// =============================================================================
// ALLIED FORMATION (unchanged)
// =============================================================================

/**
 * Classic battle formation: Warriors front, Archers back, Knights on flanks.
 * 10 squads total: 4 Hounds, 4 Fangs, 2 Crawlers
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
interface FormationPosition {
  x: number;
  yOffset: number; // Offset from base Y (positive = deeper into zone)
}

/**
 * Calculates positions for a group of units using the specified spread type.
 * Returns X positions and Y offsets for multi-row/depth formations.
 */
function calculateSpreadPositions(
  count: number,
  centerX: number,
  availableWidth: number,
  availableDepth: number,
  spread: SpreadType,
  random: () => number
): FormationPosition[] {
  if (count === 0) return [];
  if (count === 1) return [{ x: centerX, yOffset: 0 }];

  const positions: FormationPosition[] = [];
  const halfWidth = availableWidth / 2;

  switch (spread) {
    case 'line': {
      // Multi-row line formation
      const unitsPerRow = Math.min(count, FORMATION_MAX_UNITS_PER_ROW);
      const numRows = Math.ceil(count / unitsPerRow);
      const rowDepth = availableDepth * FORMATION_ROW_SPACING;

      let unitIndex = 0;
      for (let row = 0; row < numRows; row++) {
        const unitsInThisRow = Math.min(unitsPerRow, count - unitIndex);
        const rowSpacing = availableWidth / (unitsInThisRow + 1);
        const yOffset = row * rowDepth;

        for (let i = 0; i < unitsInThisRow; i++) {
          positions.push({
            x: centerX - halfWidth + rowSpacing * (i + 1),
            yOffset,
          });
          unitIndex++;
        }
      }
      break;
    }

    case 'wedge': {
      // V-shape pointing forward: center units at front, edges pushed back
      const unitsPerRow = Math.min(count, FORMATION_MAX_UNITS_PER_ROW);
      const numRows = Math.ceil(count / unitsPerRow);
      const rowDepth = availableDepth * FORMATION_ROW_SPACING;

      let unitIndex = 0;
      for (let row = 0; row < numRows; row++) {
        const unitsInThisRow = Math.min(unitsPerRow, count - unitIndex);
        const rowSpacing = availableWidth / (unitsInThisRow + 1);
        const baseYOffset = row * rowDepth;

        for (let i = 0; i < unitsInThisRow; i++) {
          const x = centerX - halfWidth + rowSpacing * (i + 1);
          // Distance from center determines depth (edges pushed back)
          const distFromCenter = Math.abs(x - centerX) / halfWidth;
          const wedgeOffset = distFromCenter * availableDepth * 0.15;
          positions.push({
            x,
            yOffset: baseYOffset + wedgeOffset,
          });
          unitIndex++;
        }
      }
      break;
    }

    case 'scattered': {
      // Grid with controlled randomness
      const unitsPerRow = Math.min(count, FORMATION_MAX_UNITS_PER_ROW);
      const numRows = Math.ceil(count / unitsPerRow);
      const rowDepth = availableDepth * FORMATION_ROW_SPACING * 1.5;

      let unitIndex = 0;
      for (let row = 0; row < numRows; row++) {
        const unitsInThisRow = Math.min(unitsPerRow, count - unitIndex);
        const rowSpacing = availableWidth / (unitsInThisRow + 1);

        for (let i = 0; i < unitsInThisRow; i++) {
          const baseX = centerX - halfWidth + rowSpacing * (i + 1);
          const jitterX = (random() - 0.5) * rowSpacing * 0.5;
          const jitterY = (random() - 0.5) * rowDepth * 0.4;
          positions.push({
            x: baseX + jitterX,
            yOffset: row * rowDepth + jitterY,
          });
          unitIndex++;
        }
      }
      break;
    }

    case 'clustered': {
      // Tight rectangular block
      const clusterWidth = availableWidth * 0.4;
      const clusterHalf = clusterWidth / 2;
      const unitsPerRow = Math.min(count, 4);
      const numRows = Math.ceil(count / unitsPerRow);
      const rowDepth = availableDepth * 0.08;

      let unitIndex = 0;
      for (let row = 0; row < numRows; row++) {
        const unitsInThisRow = Math.min(unitsPerRow, count - unitIndex);
        const rowSpacing = clusterWidth / (unitsInThisRow + 1);

        for (let i = 0; i < unitsInThisRow; i++) {
          positions.push({
            x: centerX - clusterHalf + rowSpacing * (i + 1),
            yOffset: row * rowDepth,
          });
          unitIndex++;
        }
      }
      break;
    }

    case 'wide': {
      // Split units between left and right flanks
      const leftCount = Math.ceil(count / 2);
      const rightCount = count - leftCount;

      // Left flank
      const leftRows = Math.ceil(leftCount / 3);
      const leftRowDepth = availableDepth * FORMATION_ROW_SPACING;
      let leftIndex = 0;
      for (let row = 0; row < leftRows; row++) {
        const unitsInRow = Math.min(3, leftCount - leftIndex);
        const flankWidth = halfWidth * 0.35;
        const rowSpacing = flankWidth / (unitsInRow + 1);
        const leftEdge = centerX - halfWidth * 0.9;

        for (let i = 0; i < unitsInRow; i++) {
          positions.push({
            x: leftEdge + rowSpacing * (i + 1),
            yOffset: row * leftRowDepth,
          });
          leftIndex++;
        }
      }

      // Right flank
      const rightRows = Math.ceil(rightCount / 3);
      const rightRowDepth = availableDepth * FORMATION_ROW_SPACING;
      let rightIndex = 0;
      for (let row = 0; row < rightRows; row++) {
        const unitsInRow = Math.min(3, rightCount - rightIndex);
        const flankWidth = halfWidth * 0.35;
        const rowSpacing = flankWidth / (unitsInRow + 1);
        const rightEdge = centerX + halfWidth * 0.55;

        for (let i = 0; i < unitsInRow; i++) {
          positions.push({
            x: rightEdge + rowSpacing * (i + 1),
            yOffset: row * rightRowDepth,
          });
          rightIndex++;
        }
      }
      break;
    }
  }

  return positions;
}

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

  // Calculate zone boundaries
  const zoneHeight = bounds.height * bounds.zoneHeightPercent;
  const enemyZoneTop = FORMATION_SPAWN_MARGIN;
  const enemyZoneBottom = zoneHeight - FORMATION_SPAWN_MARGIN;
  const availableHeight = enemyZoneBottom - enemyZoneTop;
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

  // Position each role group according to the pattern
  const roles: FormationRole[] = ['front', 'back', 'flank'];

  for (const role of roles) {
    const config = pattern[role];
    const units = grouped[role];
    if (units.length === 0) continue;

    // Calculate base Y position for this role
    const baseY = enemyZoneTop + availableHeight * config.yPosition;

    // Calculate positions using spread algorithm (now includes Y offsets)
    const roleWidth = availableWidth * config.widthFraction;
    const roleDepth = availableHeight * 0.3; // Depth available for multi-row formations
    const spreadPositions = calculateSpreadPositions(
      units.length,
      centerX,
      roleWidth,
      roleDepth,
      config.spread,
      random
    );

    // Create spawn positions with reduced jitter
    for (let i = 0; i < units.length; i++) {
      const pos = spreadPositions[i];
      const unitSpacing = roleWidth / Math.max(units.length, 1);
      const jitterX = (random() - 0.5) * unitSpacing * FORMATION_JITTER_X;
      const jitterY = (random() - 0.5) * roleDepth * 0.1 * FORMATION_JITTER_Y;

      positions.push({
        type: units[i].type,
        position: new Vector2(pos.x + jitterX, baseY + pos.yOffset + jitterY),
      });
    }
  }

  return positions;
}

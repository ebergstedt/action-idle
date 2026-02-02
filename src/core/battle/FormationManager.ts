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
 */
export const DEFAULT_ENEMY_PATTERNS: EnemyFormationPattern[] = [
  {
    id: 'battle_line',
    name: 'Battle Line',
    front: { yPosition: 0.2, spread: 'line', widthFraction: 0.7 },
    back: { yPosition: 0.7, spread: 'line', widthFraction: 0.6 },
    flank: { yPosition: 0.4, spread: 'wide', widthFraction: 0.95 },
  },
  {
    id: 'defensive',
    name: 'Defensive',
    front: { yPosition: 0.3, spread: 'scattered', widthFraction: 0.8 },
    back: { yPosition: 0.6, spread: 'clustered', widthFraction: 0.4 },
    flank: { yPosition: 0.5, spread: 'wide', widthFraction: 0.9 },
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    front: { yPosition: 0.1, spread: 'wedge', widthFraction: 0.6 },
    back: { yPosition: 0.5, spread: 'line', widthFraction: 0.5 },
    flank: { yPosition: 0.25, spread: 'wide', widthFraction: 0.85 },
  },
  {
    id: 'ambush',
    name: 'Ambush',
    front: { yPosition: 0.4, spread: 'scattered', widthFraction: 0.5 },
    back: { yPosition: 0.8, spread: 'clustered', widthFraction: 0.3 },
    flank: { yPosition: 0.3, spread: 'wide', widthFraction: 0.98 },
  },
  {
    id: 'skirmish',
    name: 'Skirmish',
    front: { yPosition: 0.25, spread: 'scattered', widthFraction: 0.85 },
    back: { yPosition: 0.6, spread: 'scattered', widthFraction: 0.7 },
    flank: { yPosition: 0.45, spread: 'scattered', widthFraction: 0.9 },
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
 * Calculates X positions for a group of units using the specified spread type.
 */
function calculateSpreadPositions(
  count: number,
  centerX: number,
  availableWidth: number,
  spread: SpreadType,
  random: () => number
): number[] {
  if (count === 0) return [];
  if (count === 1) return [centerX];

  const positions: number[] = [];
  const halfWidth = availableWidth / 2;

  switch (spread) {
    case 'line': {
      // Evenly spaced line
      const spacing = availableWidth / (count + 1);
      for (let i = 0; i < count; i++) {
        positions.push(centerX - halfWidth + spacing * (i + 1));
      }
      break;
    }

    case 'wedge': {
      // V-shape pointing forward (toward enemy)
      // Center units forward, edge units back
      const spacing = availableWidth / (count + 1);
      for (let i = 0; i < count; i++) {
        const x = centerX - halfWidth + spacing * (i + 1);
        positions.push(x);
      }
      break;
    }

    case 'scattered': {
      // Random positions within the width
      for (let i = 0; i < count; i++) {
        const baseX = centerX - halfWidth + (availableWidth / (count + 1)) * (i + 1);
        const jitter = (random() - 0.5) * (availableWidth / count) * 0.8;
        positions.push(baseX + jitter);
      }
      break;
    }

    case 'clustered': {
      // Tight group near center
      const clusterWidth = availableWidth * 0.5;
      const clusterHalf = clusterWidth / 2;
      const spacing = clusterWidth / (count + 1);
      for (let i = 0; i < count; i++) {
        positions.push(centerX - clusterHalf + spacing * (i + 1));
      }
      break;
    }

    case 'wide': {
      // Units at the edges
      if (count <= 2) {
        positions.push(centerX - halfWidth * 0.8);
        if (count === 2) positions.push(centerX + halfWidth * 0.8);
      } else {
        // Distribute with emphasis on edges
        const edgeUnits = Math.floor(count / 2);
        const centerUnits = count - edgeUnits * 2;

        // Left edge
        for (let i = 0; i < Math.ceil(edgeUnits / 2); i++) {
          const t = (i + 1) / (Math.ceil(edgeUnits / 2) + 1);
          positions.push(centerX - halfWidth + halfWidth * 0.3 * t);
        }

        // Center (if any)
        if (centerUnits > 0) {
          positions.push(centerX);
        }

        // Right edge
        for (let i = 0; i < Math.floor(edgeUnits / 2); i++) {
          const t = (i + 1) / (Math.floor(edgeUnits / 2) + 1);
          positions.push(centerX + halfWidth - halfWidth * 0.3 * t);
        }

        // Fill remaining
        while (positions.length < count) {
          positions.push(centerX + (random() - 0.5) * availableWidth * 0.6);
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

    // Calculate Y position for this role
    const baseY = enemyZoneTop + availableHeight * config.yPosition;

    // Calculate X positions using spread algorithm
    const roleWidth = availableWidth * config.widthFraction;
    const xPositions = calculateSpreadPositions(
      units.length,
      centerX,
      roleWidth,
      config.spread,
      random
    );

    // Create spawn positions with jitter
    for (let i = 0; i < units.length; i++) {
      const jitterX =
        (random() - 0.5) * (roleWidth / Math.max(units.length, 1)) * FORMATION_JITTER_X;
      const jitterY = (random() - 0.5) * (availableHeight * 0.2) * FORMATION_JITTER_Y;

      positions.push({
        type: units[i].type,
        position: new Vector2(xPositions[i] + jitterX, baseY + jitterY),
      });
    }
  }

  return positions;
}

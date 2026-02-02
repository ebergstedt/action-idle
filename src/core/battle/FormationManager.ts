/**
 * Formation Manager
 *
 * Handles unit formation templates and spawn positioning.
 * Pure game logic - no React/browser dependencies.
 *
 * Godot equivalent: Resource files for formations, spawner node.
 */

import { Vector2 } from '../physics/Vector2';
import {
  FORMATION_SPAWN_MARGIN,
  FORMATION_WIDTH_SCALE,
  FORMATION_HEIGHT_SCALE,
  FORMATION_CENTER_OFFSET,
  ENEMY_SPAWN_MAX_COLS,
  ENEMY_SPAWN_JITTER,
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
 * Classic battle formation: Warriors front, Archers back, Knights on flanks.
 */
export const CLASSIC_FORMATION: FormationTemplate = {
  id: 'classic',
  name: 'Classic Battle Line',
  placements: [
    // Front line - 8 Warriors (y = 0 is front)
    { type: 'warrior', relativePosition: new Vector2(-0.35, 0) },
    { type: 'warrior', relativePosition: new Vector2(-0.25, 0) },
    { type: 'warrior', relativePosition: new Vector2(-0.15, 0) },
    { type: 'warrior', relativePosition: new Vector2(-0.05, 0) },
    { type: 'warrior', relativePosition: new Vector2(0.05, 0) },
    { type: 'warrior', relativePosition: new Vector2(0.15, 0) },
    { type: 'warrior', relativePosition: new Vector2(0.25, 0) },
    { type: 'warrior', relativePosition: new Vector2(0.35, 0) },
    // Back line - 8 Archers
    { type: 'archer', relativePosition: new Vector2(-0.35, 0.5) },
    { type: 'archer', relativePosition: new Vector2(-0.25, 0.5) },
    { type: 'archer', relativePosition: new Vector2(-0.15, 0.5) },
    { type: 'archer', relativePosition: new Vector2(-0.05, 0.5) },
    { type: 'archer', relativePosition: new Vector2(0.05, 0.5) },
    { type: 'archer', relativePosition: new Vector2(0.15, 0.5) },
    { type: 'archer', relativePosition: new Vector2(0.25, 0.5) },
    { type: 'archer', relativePosition: new Vector2(0.35, 0.5) },
    // Flanks - 4 Knights
    { type: 'knight', relativePosition: new Vector2(-0.5, 0.15) },
    { type: 'knight', relativePosition: new Vector2(-0.5, 0.35) },
    { type: 'knight', relativePosition: new Vector2(0.5, 0.15) },
    { type: 'knight', relativePosition: new Vector2(0.5, 0.35) },
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

/**
 * Generates random enemy spawn positions in a grid with jitter.
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
 */
export function getDefaultEnemyComposition(): UnitType[] {
  return [
    'warrior',
    'warrior',
    'warrior',
    'warrior',
    'warrior',
    'warrior',
    'warrior',
    'warrior',
    'archer',
    'archer',
    'archer',
    'archer',
    'archer',
    'archer',
    'knight',
    'knight',
    'knight',
    'knight',
    'knight',
    'knight',
  ];
}

/**
 * Scales enemy composition based on wave number.
 * Future: Add more/stronger enemies as waves progress.
 */
export function getEnemyCompositionForWave(_waveNumber: number): UnitType[] {
  // For now, same composition every wave
  // Future: scale difficulty
  return getDefaultEnemyComposition();
}

/**
 * Formation Manager
 *
 * Handles unit formation templates and spawn positioning.
 * Pure game logic - no React/browser dependencies.
 *
 * Godot equivalent: Resource files for formations, spawner node.
 */

import { Vector2 } from '../physics/Vector2';

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
    // Front line - 4 Warriors (y = 0 is front)
    { type: 'warrior', relativePosition: new Vector2(-0.3, 0) },
    { type: 'warrior', relativePosition: new Vector2(-0.1, 0) },
    { type: 'warrior', relativePosition: new Vector2(0.1, 0) },
    { type: 'warrior', relativePosition: new Vector2(0.3, 0) },
    // Back line - 4 Archers
    { type: 'archer', relativePosition: new Vector2(-0.3, 0.5) },
    { type: 'archer', relativePosition: new Vector2(-0.1, 0.5) },
    { type: 'archer', relativePosition: new Vector2(0.1, 0.5) },
    { type: 'archer', relativePosition: new Vector2(0.3, 0.5) },
    // Flanks - 2 Knights
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
  const margin = 30;

  const centerX = bounds.width / 2;
  const centerY = allyZoneTop + margin + (zoneHeight - margin * 2) * 0.3; // Front of ally zone

  // Scale factor based on arena size
  const scaleX = (bounds.width - margin * 2) * 0.4;
  const scaleY = (zoneHeight - margin * 2) * 0.6;

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
  const margin = 30;

  const enemyZoneTop = margin;
  const enemyZoneBottom = zoneHeight - margin;

  const availableWidth = bounds.width - margin * 2;
  const availableHeight = enemyZoneBottom - enemyZoneTop;

  // Grid layout
  const cols = Math.min(4, composition.length);
  const rows = Math.ceil(composition.length / cols);
  const cellWidth = availableWidth / cols;
  const cellHeight = availableHeight / Math.max(rows, 1);

  // Shuffle for variety
  const shuffled = [...composition].sort(() => Math.random() - 0.5);

  return shuffled.map((type, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    // Base position in grid cell center
    const baseX = margin + col * cellWidth + cellWidth / 2;
    const baseY = enemyZoneTop + row * cellHeight + cellHeight / 2;

    // Add jitter (30% of cell size)
    const jitterX = (Math.random() - 0.5) * cellWidth * 0.6;
    const jitterY = (Math.random() - 0.5) * cellHeight * 0.6;

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
    'archer',
    'archer',
    'archer',
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

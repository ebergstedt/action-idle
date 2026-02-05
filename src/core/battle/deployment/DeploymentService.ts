/**
 * Deployment Service
 *
 * Pure functions for spawning and deploying units during battle setup.
 * Extracted from useBattle.ts for Godot portability and better separation of concerns.
 *
 * Godot equivalent: Static functions in a DeploymentManager singleton
 */

import { BattleEngine } from '../BattleEngine';
import { ZONE_HEIGHT_PERCENT } from '../BattleConfig';
import {
  calculateDeterministicAlliedPositions,
  calculateDeterministicEnemyPositions,
  getDefaultAlliedComposition,
  getEnemyCompositionForWave,
} from '../FormationManager';
import { calculateCellSize, snapFootprintToGrid } from '../grid/GridManager';
import { resolveSquadOverlaps } from '../DragController';
import { createSeededRandom } from '../../utils/Random';

// =============================================================================
// LEVEL SCALING
// =============================================================================

/** Waves between each bonus level for enemies */
const WAVES_PER_BONUS_LEVEL = 5;

/**
 * Calculates total bonus levels available for enemies at a given wave.
 * Enemies get 1 extra level to distribute every 5 waves.
 *
 * @param waveNumber - Current wave number
 * @returns Total bonus levels to distribute (0 for waves 1-4, 1 for waves 5-9, etc.)
 */
export function calculateEnemyBonusLevels(waveNumber: number): number {
  return Math.floor((waveNumber - 1) / WAVES_PER_BONUS_LEVEL);
}

/**
 * Distributes bonus levels across enemy squads deterministically.
 * Biased towards equal distribution but can sometimes stack levels.
 *
 * @param squadCount - Number of enemy squads
 * @param bonusLevels - Total bonus levels to distribute
 * @param waveNumber - Wave number for deterministic seeding
 * @returns Array of levels for each squad (base level 1 + bonus)
 */
export function distributeEnemyLevels(
  squadCount: number,
  bonusLevels: number,
  waveNumber: number
): number[] {
  // All squads start at level 1
  const levels = new Array(squadCount).fill(1);

  if (bonusLevels <= 0 || squadCount <= 0) {
    return levels;
  }

  // Use seeded random for deterministic distribution
  const random = createSeededRandom(waveNumber * 7919 + 1337);

  // Distribute bonus levels
  for (let i = 0; i < bonusLevels; i++) {
    // 70% chance to pick the squad with lowest level (equal distribution bias)
    // 30% chance to pick a random squad (allows stacking)
    const useLowest = random() < 0.7;

    let targetIndex: number;
    if (useLowest) {
      // Find squad(s) with minimum level
      const minLevel = Math.min(...levels);
      const minIndices = levels
        .map((level, idx) => (level === minLevel ? idx : -1))
        .filter((idx) => idx >= 0);
      // Pick randomly among the lowest
      targetIndex = minIndices[Math.floor(random() * minIndices.length)];
    } else {
      // Pick any random squad
      targetIndex = Math.floor(random() * squadCount);
    }

    levels[targetIndex]++;
  }

  return levels;
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Configuration for spawning a wave of units.
 */
export interface WaveSpawnConfig {
  /** Current wave number (affects enemy composition) */
  waveNumber: number;
  /** Arena width in pixels */
  arenaWidth: number;
  /** Arena height in pixels */
  arenaHeight: number;
}

/**
 * Bounds configuration for spawning.
 */
export interface SpawnBounds {
  width: number;
  height: number;
  zoneHeightPercent: number;
}

// =============================================================================
// SPAWNING
// =============================================================================

/**
 * Spawns all units for a wave (allies and enemies).
 * Does NOT resolve overlaps - call resolveAllOverlaps separately.
 *
 * @param engine - The battle engine instance
 * @param config - Wave spawn configuration
 */
export function spawnWaveUnits(engine: BattleEngine, config: WaveSpawnConfig): void {
  const { waveNumber, arenaWidth, arenaHeight } = config;

  const bounds: SpawnBounds = {
    width: arenaWidth,
    height: arenaHeight,
    zoneHeightPercent: ZONE_HEIGHT_PERCENT,
  };

  // Set arena bounds for boundary enforcement during gameplay
  engine.setArenaBounds(arenaWidth, arenaHeight);

  // Spawn castles for both teams
  engine.spawnCastles();

  const registry = engine.getRegistry();
  const cellSize = calculateCellSize(arenaWidth, arenaHeight);

  // Spawn allied army using deterministic formation with collision detection
  const alliedComposition = getDefaultAlliedComposition();
  const alliedPositions = calculateDeterministicAlliedPositions(
    alliedComposition,
    registry,
    bounds,
    waveNumber
  );
  for (const spawn of alliedPositions) {
    // Snap position to grid based on unit's footprint
    const def = registry.tryGet(spawn.type);
    const footprint = def?.gridFootprint || { cols: 2, rows: 2 };
    const snappedPos = snapFootprintToGrid(spawn.position, footprint, cellSize);
    engine.spawnSquad(spawn.type, 'player', snappedPos, arenaHeight);
  }

  // Spawn enemy army using deterministic formation (varies by wave)
  const enemyComposition = getEnemyCompositionForWave(waveNumber, registry);
  const enemyPositions = calculateDeterministicEnemyPositions(
    enemyComposition,
    registry,
    bounds,
    waveNumber
  );

  // Calculate level distribution for enemy squads
  const bonusLevels = calculateEnemyBonusLevels(waveNumber);
  const enemyLevels = distributeEnemyLevels(enemyPositions.length, bonusLevels, waveNumber);

  for (let i = 0; i < enemyPositions.length; i++) {
    const spawn = enemyPositions[i];
    const level = enemyLevels[i];

    // Snap position to grid based on unit's footprint
    const def = registry.tryGet(spawn.type);
    const footprint = def?.gridFootprint || { cols: 2, rows: 2 };
    const snappedPos = snapFootprintToGrid(spawn.position, footprint, cellSize);
    engine.spawnSquad(spawn.type, 'enemy', snappedPos, arenaHeight, level);
  }
}

// =============================================================================
// OVERLAP RESOLUTION
// =============================================================================

/**
 * Resolves squad overlaps for both teams.
 * Should be called after spawning units.
 *
 * @param engine - The battle engine instance
 * @param arenaWidth - Arena width in pixels
 * @param arenaHeight - Arena height in pixels
 */
export function resolveAllOverlaps(
  engine: BattleEngine,
  arenaWidth: number,
  arenaHeight: number
): void {
  const cellSize = calculateCellSize(arenaWidth, arenaHeight);
  const currentState = engine.getState();

  // Exclude castles (stationary units) - they have fixed positions and shouldn't be moved
  const unitsForResolution = currentState.units
    .filter((u) => u.type !== 'castle')
    .map((u) => ({
      id: u.id,
      type: u.type,
      position: u.position,
      size: u.size,
      team: u.team,
      squadId: u.squadId,
      gridFootprint: u.gridFootprint,
    }));

  // Resolve player squad overlaps
  const playerMoves = resolveSquadOverlaps(unitsForResolution, 'player', cellSize);
  for (const move of playerMoves) {
    engine.moveUnit(move.unitId, move.position);
  }

  // Resolve enemy squad overlaps
  const enemyMoves = resolveSquadOverlaps(unitsForResolution, 'enemy', cellSize);
  for (const move of enemyMoves) {
    engine.moveUnit(move.unitId, move.position);
  }
}

/**
 * Resolves squad overlaps for player units only.
 * Used during deployment when dragging units.
 *
 * @param engine - The battle engine instance
 * @param arenaWidth - Arena width in pixels
 * @param arenaHeight - Arena height in pixels
 */
export function resolvePlayerOverlaps(
  engine: BattleEngine,
  arenaWidth: number,
  arenaHeight: number
): void {
  const cellSize = calculateCellSize(arenaWidth, arenaHeight);
  const currentState = engine.getState();

  const unitsForResolution = currentState.units.map((u) => ({
    id: u.id,
    type: u.type,
    position: u.position,
    size: u.size,
    team: u.team,
    squadId: u.squadId,
    gridFootprint: u.gridFootprint,
  }));

  // Resolve player squad overlaps only
  const resolutionMoves = resolveSquadOverlaps(unitsForResolution, 'player', cellSize);
  for (const move of resolutionMoves) {
    engine.moveUnit(move.unitId, move.position);
  }
}

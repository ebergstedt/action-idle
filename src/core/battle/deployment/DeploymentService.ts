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
  for (const spawn of enemyPositions) {
    // Snap position to grid based on unit's footprint
    const def = registry.tryGet(spawn.type);
    const footprint = def?.gridFootprint || { cols: 2, rows: 2 };
    const snappedPos = snapFootprintToGrid(spawn.position, footprint, cellSize);
    engine.spawnSquad(spawn.type, 'enemy', snappedPos, arenaHeight);
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

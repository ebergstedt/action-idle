/**
 * Battle Deployment Hook
 *
 * Manages wave spawning and unit movement during deployment phase.
 * Single responsibility: spawning units and moving them before battle starts.
 */

import { useCallback, useRef } from 'react';
import {
  BattleEngine,
  BattleStats,
  spawnWaveUnits,
  resolveAllOverlaps,
  resolvePlayerOverlaps,
} from '../../core/battle';
import { Vector2 } from '../../core/physics/Vector2';

export interface UseBattleDeploymentOptions {
  /** Reference to the battle engine */
  engineRef: React.RefObject<BattleEngine | null>;
  /** Reference to the stats tracker */
  statsRef: React.RefObject<BattleStats | null>;
  /** Callback to sync state after operations */
  syncState: () => void;
  /** Callback to sync stats after operations */
  syncStats: () => void;
}

export interface UseBattleDeploymentReturn {
  /** Spawn all units for the current wave */
  spawnWave: (arenaWidth: number, arenaHeight: number) => void;
  /** Move a single unit during deployment */
  moveUnit: (unitId: string, position: Vector2) => void;
  /** Move multiple units during deployment (with overlap resolution) */
  moveUnits: (moves: Array<{ unitId: string; position: Vector2 }>) => void;
}

/**
 * Manages wave spawning and unit deployment.
 */
export function useBattleDeployment({
  engineRef,
  statsRef,
  syncState,
  syncStats,
}: UseBattleDeploymentOptions): UseBattleDeploymentReturn {
  // Store arena dimensions for overlap resolution during moveUnits
  const arenaDimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const spawnWave = useCallback(
    (arenaWidth: number, arenaHeight: number) => {
      if (!engineRef.current) return;

      const engine = engineRef.current;
      const waveNumber = engine.getState().waveNumber;

      // Attach stats tracker to world before spawning
      if (statsRef.current) {
        statsRef.current.attach(engine.getWorld());
      }

      // Spawn all units for the wave
      spawnWaveUnits(engine, { waveNumber, arenaWidth, arenaHeight });

      // Resolve any overlapping squads after spawning
      resolveAllOverlaps(engine, arenaWidth, arenaHeight);

      // Store arena dimensions for later use in moveUnits
      arenaDimensionsRef.current = { width: arenaWidth, height: arenaHeight };

      syncState();
      syncStats();
    },
    [engineRef, statsRef, syncState, syncStats]
  );

  const moveUnit = useCallback(
    (unitId: string, position: Vector2) => {
      if (engineRef.current) {
        engineRef.current.moveUnit(unitId, position);
        syncState();
      }
    },
    [engineRef, syncState]
  );

  const moveUnits = useCallback(
    (moves: Array<{ unitId: string; position: Vector2 }>) => {
      if (!engineRef.current) return;

      const engine = engineRef.current;

      for (const { unitId, position } of moves) {
        engine.moveUnit(unitId, position);
      }

      // During deployment phase, resolve any overlaps caused by the move
      const currentState = engine.getState();
      const { width: arenaW, height: arenaH } = arenaDimensionsRef.current;
      if (!currentState.hasStarted && arenaW > 0 && arenaH > 0) {
        resolvePlayerOverlaps(engine, arenaW, arenaH);
      }

      syncState();
    },
    [engineRef, syncState]
  );

  return {
    spawnWave,
    moveUnit,
    moveUnits,
  };
}

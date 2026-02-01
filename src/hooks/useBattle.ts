import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BattleEngine,
  BattleState,
  CLASSIC_FORMATION,
  calculateAlliedSpawnPositions,
  calculateEnemySpawnPositions,
  getEnemyCompositionForWave,
} from '../core/battle';
import { Vector2 } from '../core/physics/Vector2';

const ZONE_HEIGHT_PERCENT = 0.25; // Must match BattleCanvas

export type BattleSpeed = 0.5 | 1 | 5;

export interface UseBattleReturn {
  state: BattleState;
  selectedUnitIds: string[];
  battleSpeed: BattleSpeed;
  start: () => void;
  stop: () => void;
  reset: () => void;
  spawnWave: (arenaWidth: number, arenaHeight: number) => void;
  moveUnit: (unitId: string, position: Vector2) => void;
  moveUnits: (moves: Array<{ unitId: string; position: Vector2 }>) => void;
  selectUnit: (unitId: string | null) => void;
  selectUnits: (unitIds: string[]) => void;
  setBattleSpeed: (speed: BattleSpeed) => void;
}

export function useBattle(): UseBattleReturn {
  const engineRef = useRef<BattleEngine | null>(null);
  const [state, setState] = useState<BattleState>({
    units: [],
    projectiles: [],
    isRunning: false,
    hasStarted: false,
    waveNumber: 1,
  });
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [battleSpeed, setBattleSpeed] = useState<BattleSpeed>(1);
  const battleSpeedRef = useRef<BattleSpeed>(1);

  // Keep ref in sync for use in game loop
  useEffect(() => {
    battleSpeedRef.current = battleSpeed;
  }, [battleSpeed]);

  // Initialize engine
  useEffect(() => {
    engineRef.current = new BattleEngine();
    return () => {
      engineRef.current = null;
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (!state.isRunning) return;

    let lastTime = performance.now();
    let frameId: number;

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      if (engineRef.current) {
        // Apply battle speed multiplier
        const scaledDelta = delta * battleSpeedRef.current;
        engineRef.current.tick(scaledDelta);
        setState({ ...engineRef.current.getState() });
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [state.isRunning]);

  const start = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.start();
      setState({ ...engineRef.current.getState() });
    }
  }, []);

  const stop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      setState({ ...engineRef.current.getState() });
    }
  }, []);

  const reset = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current.clear();
      setState({ ...engineRef.current.getState() });
    }
  }, []);

  const spawnWave = useCallback((arenaWidth: number, arenaHeight: number) => {
    if (!engineRef.current) return;

    const engine = engineRef.current;
    const bounds = {
      width: arenaWidth,
      height: arenaHeight,
      zoneHeightPercent: ZONE_HEIGHT_PERCENT,
    };

    // Spawn allied army using formation
    const alliedPositions = calculateAlliedSpawnPositions(CLASSIC_FORMATION, bounds);
    for (const spawn of alliedPositions) {
      engine.spawnUnit(spawn.type, 'player', spawn.position, arenaHeight);
    }

    // Spawn enemy army
    const waveNumber = engine.getState().waveNumber;
    const enemyComposition = getEnemyCompositionForWave(waveNumber);
    const enemyPositions = calculateEnemySpawnPositions(enemyComposition, bounds);
    for (const spawn of enemyPositions) {
      engine.spawnUnit(spawn.type, 'enemy', spawn.position, arenaHeight);
    }

    // Resolve any overlapping units after spawning
    engine.resolveOverlaps(30, {
      arenaWidth,
      arenaHeight,
      zoneHeightPercent: ZONE_HEIGHT_PERCENT,
    });

    setState({ ...engine.getState() });
  }, []);

  const moveUnit = useCallback((unitId: string, position: Vector2) => {
    if (engineRef.current) {
      engineRef.current.moveUnit(unitId, position);
      setState({ ...engineRef.current.getState() });
    }
  }, []);

  const moveUnits = useCallback((moves: Array<{ unitId: string; position: Vector2 }>) => {
    if (engineRef.current) {
      for (const { unitId, position } of moves) {
        engineRef.current.moveUnit(unitId, position);
      }
      setState({ ...engineRef.current.getState() });
    }
  }, []);

  const selectUnit = useCallback((unitId: string | null) => {
    setSelectedUnitIds(unitId ? [unitId] : []);
  }, []);

  const selectUnits = useCallback((unitIds: string[]) => {
    setSelectedUnitIds(unitIds);
  }, []);

  return {
    state,
    selectedUnitIds,
    battleSpeed,
    start,
    stop,
    reset,
    spawnWave,
    moveUnit,
    moveUnits,
    selectUnit,
    selectUnits,
    setBattleSpeed,
  };
}

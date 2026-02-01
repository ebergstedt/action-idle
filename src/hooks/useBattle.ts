import { useCallback, useEffect, useRef, useState } from 'react';
import { BattleEngine, BattleState, UnitType } from '../core/battle';
import { Vector2 } from '../core/physics/Vector2';

const ZONE_HEIGHT_PERCENT = 0.25; // Must match BattleCanvas

export interface UseBattleReturn {
  state: BattleState;
  selectedUnitId: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
  spawnWave: (arenaWidth: number, arenaHeight: number) => void;
  moveUnit: (unitId: string, position: Vector2) => void;
  selectUnit: (unitId: string | null) => void;
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
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

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
        engineRef.current.tick(delta);
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
    const zoneHeight = arenaHeight * ZONE_HEIGHT_PERCENT;

    // Spawn player units in allied zone (bottom)
    const playerTypes: UnitType[] = ['warrior', 'warrior', 'archer', 'knight'];
    const playerSpacing = arenaWidth / (playerTypes.length + 1);
    const allyZoneCenter = arenaHeight - zoneHeight / 2;

    playerTypes.forEach((type, i) => {
      const x = playerSpacing * (i + 1);
      const y = allyZoneCenter;
      engine.spawnUnit(type, 'player', new Vector2(x, y), arenaHeight);
    });

    // Spawn enemy units in enemy zone (top)
    const enemyTypes: UnitType[] = ['warrior', 'archer', 'warrior'];
    const enemySpacing = arenaWidth / (enemyTypes.length + 1);
    const enemyZoneCenter = zoneHeight / 2;

    enemyTypes.forEach((type, i) => {
      const x = enemySpacing * (i + 1);
      const y = enemyZoneCenter;
      engine.spawnUnit(type, 'enemy', new Vector2(x, y), arenaHeight);
    });

    setState({ ...engine.getState() });
  }, []);

  const moveUnit = useCallback((unitId: string, position: Vector2) => {
    if (engineRef.current) {
      engineRef.current.moveUnit(unitId, position);
      setState({ ...engineRef.current.getState() });
    }
  }, []);

  const selectUnit = useCallback((unitId: string | null) => {
    setSelectedUnitId(unitId);
  }, []);

  return {
    state,
    selectedUnitId,
    start,
    stop,
    reset,
    spawnWave,
    moveUnit,
    selectUnit,
  };
}

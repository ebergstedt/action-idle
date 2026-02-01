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

    // Unit spacing based on arena size
    const unitSpacing = Math.max(35, arenaWidth / 30);

    // === ALLIED ARMY - Classic battle formation (10 units max) ===
    // Front (toward enemy): Warriors (melee infantry)
    // Back (toward our side): Archers (ranged)
    // Flanks: Knights (cavalry)

    const allyZoneTop = arenaHeight - zoneHeight + 30;
    const centerX = arenaWidth / 2;

    // Front line - 4 Warriors closest to enemy (lower Y = closer to top/enemy)
    const frontLineY = allyZoneTop + unitSpacing * 0.5;
    const warriorCount = 4;
    const warriorStartX = centerX - ((warriorCount - 1) * unitSpacing) / 2;

    for (let i = 0; i < warriorCount; i++) {
      const x = warriorStartX + i * unitSpacing;
      engine.spawnUnit('warrior', 'player', new Vector2(x, frontLineY), arenaHeight);
    }

    // Back line - 4 Archers behind warriors (higher Y = further from enemy)
    const backLineY = frontLineY + unitSpacing;
    const archerCount = 4;
    const archerStartX = centerX - ((archerCount - 1) * unitSpacing) / 2;

    for (let i = 0; i < archerCount; i++) {
      const x = archerStartX + i * unitSpacing;
      engine.spawnUnit('archer', 'player', new Vector2(x, backLineY), arenaHeight);
    }

    // Flanks - Knights (cavalry) on left and right sides
    const flankY = (frontLineY + backLineY) / 2; // Between front and back
    const flankOffset = unitSpacing * 3; // Distance from center to flanks

    // Left flank - 1 Knight
    engine.spawnUnit('knight', 'player', new Vector2(centerX - flankOffset, flankY), arenaHeight);

    // Right flank - 1 Knight
    engine.spawnUnit('knight', 'player', new Vector2(centerX + flankOffset, flankY), arenaHeight);

    // === ENEMY ARMY - Randomized positions (10 units max) ===

    const enemyZoneTop = 30;
    const enemyZoneBottom = zoneHeight - 30;

    // Enemy composition: 4 warriors, 3 archers, 3 knights = 10 total
    const enemyComposition: UnitType[] = [
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

    // Shuffle enemy composition for variety
    const shuffled = [...enemyComposition].sort(() => Math.random() - 0.5);

    // Spawn enemies in a loose grid with randomization
    const margin = 80;
    const availableWidth = arenaWidth - margin * 2;
    const availableHeight = enemyZoneBottom - enemyZoneTop;

    // Create a grid-based spawn with jitter for natural look
    const cols = 4;
    const rows = 3;
    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;

    shuffled.forEach((type, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      // Base position in grid cell center
      const baseX = margin + col * cellWidth + cellWidth / 2;
      const baseY = enemyZoneTop + row * cellHeight + cellHeight / 2;

      // Add randomization within cell (30% of cell size)
      const jitterX = (Math.random() - 0.5) * cellWidth * 0.6;
      const jitterY = (Math.random() - 0.5) * cellHeight * 0.6;

      const x = baseX + jitterX;
      const y = baseY + jitterY;

      engine.spawnUnit(type, 'enemy', new Vector2(x, y), arenaHeight);
    });

    // Resolve any overlapping units after spawning (with zone clamping)
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

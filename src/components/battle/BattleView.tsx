/**
 * Battle View Component
 *
 * Main container for the battle system.
 * Orchestrates canvas, overlays, and control panel.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useBattle } from '../../hooks/useBattle';
import { BattleCanvas } from './BattleCanvas';
import { WaxSealOverlay } from './WaxSealOverlay';
import { UnitInfoPanel } from './UnitInfoPanel';
import { ControlsPanel } from './ControlsPanel';
import {
  MIN_ARENA_WIDTH,
  MIN_ARENA_HEIGHT,
  ARENA_ASPECT_RATIO,
} from '../../core/battle/BattleConfig';
import { UI_COLORS } from '../../core/theme/colors';

// Parchment theme styles
const styles = {
  panelBg: { backgroundColor: UI_COLORS.parchmentShadow },
};

export function BattleView() {
  const {
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
    setWave,
    handleBattleOutcome,
    getWaveGoldReward,
  } = useBattle();

  const containerRef = useRef<HTMLDivElement>(null);
  const [arenaSize, setArenaSize] = useState({ width: 600, height: 600 });

  const [isArenaSizeStable, setIsArenaSizeStable] = useState(false);
  const hasSpawnedRef = useRef(false);
  const sizeStableTimeoutRef = useRef<number | null>(null);

  // Calculate arena size based on container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const availableHeight = rect.height - 10;
        const availableWidth = rect.width - 20;

        const width = Math.max(MIN_ARENA_WIDTH, availableWidth);
        const height = Math.max(
          MIN_ARENA_HEIGHT,
          Math.min(availableHeight, width * ARENA_ASPECT_RATIO)
        );

        setArenaSize({ width, height });

        // Mark size as stable after a short delay
        if (sizeStableTimeoutRef.current) {
          clearTimeout(sizeStableTimeoutRef.current);
        }
        sizeStableTimeoutRef.current = window.setTimeout(() => {
          setIsArenaSizeStable(true);
        }, 100);
      }
    };

    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    setTimeout(updateSize, 0);

    return () => {
      observer.disconnect();
      if (sizeStableTimeoutRef.current) {
        clearTimeout(sizeStableTimeoutRef.current);
      }
    };
  }, []);

  // Auto-spawn units once arena size is stable
  useEffect(() => {
    if (isArenaSizeStable && state.units.length === 0 && !hasSpawnedRef.current) {
      hasSpawnedRef.current = true;
      spawnWave(arenaSize.width, arenaSize.height);
    }
  }, [isArenaSizeStable, arenaSize, state.units.length, spawnWave]);

  // Only show unit info panel if exactly one unit is selected
  const selectedUnit =
    selectedUnitIds.length === 1 ? state.units.find((u) => u.id === selectedUnitIds[0]) : null;

  const handleStartBattle = useCallback(() => {
    start();
  }, [start]);

  const handleReset = useCallback(() => {
    reset();
    hasSpawnedRef.current = false;
  }, [reset]);

  // Handle outcome dismiss - delegates to engine for gold/wave logic, then resets
  const handleOutcomeDismiss = useCallback(() => {
    handleBattleOutcome();
    handleReset();
  }, [handleBattleOutcome, handleReset]);

  return (
    <div className="flex gap-4 h-full">
      {/* Left side - Arena */}
      <div
        ref={containerRef}
        className="flex-[2] flex flex-col items-center justify-center gap-2 min-w-0 relative"
      >
        <BattleCanvas
          state={state}
          width={arenaSize.width}
          height={arenaSize.height}
          onUnitMove={moveUnit}
          onUnitsMove={moveUnits}
          selectedUnitIds={selectedUnitIds}
          onSelectUnit={selectUnit}
          onSelectUnits={selectUnits}
        />
        {/* Victory/Defeat Overlay */}
        <WaxSealOverlay
          outcome={state.outcome}
          goldEarned={state.outcome === 'player_victory' ? getWaveGoldReward() : 0}
          waveNumber={state.waveNumber}
          onDismiss={handleOutcomeDismiss}
        />
      </div>

      {/* Right side - Info Panel */}
      <div className="w-80 flex-shrink-0 rounded-lg p-5 overflow-y-auto" style={styles.panelBg}>
        {selectedUnit ? (
          <UnitInfoPanel unit={selectedUnit} onDeselect={() => selectUnits([])} />
        ) : (
          <ControlsPanel
            isRunning={state.isRunning}
            hasStarted={state.hasStarted}
            battleSpeed={battleSpeed}
            waveNumber={state.waveNumber}
            highestWave={state.highestWave}
            gold={state.gold}
            onStart={handleStartBattle}
            onStop={stop}
            onReset={handleReset}
            onSpeedChange={setBattleSpeed}
            onWaveChange={setWave}
          />
        )}
      </div>
    </div>
  );
}

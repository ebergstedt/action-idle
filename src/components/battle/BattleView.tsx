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
  ARENA_SIZE_STABLE_DELAY_MS,
  DEFAULT_ARENA_WIDTH,
  DEFAULT_ARENA_HEIGHT,
  ARENA_CONTAINER_PADDING_V,
  ARENA_CONTAINER_PADDING_H,
} from '../../core/battle/BattleConfig';
import { getUniformSelectionUnit } from '../../core/battle/SelectionManager';
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
    autoBattle,
    settingsLoaded,
    start,
    stop,
    reset,
    spawnWave,
    moveUnit,
    moveUnits,
    selectUnit,
    selectUnits,
    setBattleSpeed,
    setAutoBattle,
    setWave,
    getWaveGoldReward,
    handleOutcomeAndContinue,
  } = useBattle();

  const containerRef = useRef<HTMLDivElement>(null);
  const [arenaSize, setArenaSize] = useState({
    width: DEFAULT_ARENA_WIDTH,
    height: DEFAULT_ARENA_HEIGHT,
  });

  const [isArenaSizeStable, setIsArenaSizeStable] = useState(false);
  const hasSpawnedRef = useRef(false);
  const sizeStableTimeoutRef = useRef<number | null>(null);

  // Calculate arena size based on container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const availableHeight = rect.height - ARENA_CONTAINER_PADDING_V;
        const availableWidth = rect.width - ARENA_CONTAINER_PADDING_H;

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
        }, ARENA_SIZE_STABLE_DELAY_MS);
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

  // Auto-spawn units once arena size is stable and settings are loaded
  useEffect(() => {
    if (isArenaSizeStable && settingsLoaded && state.units.length === 0 && !hasSpawnedRef.current) {
      hasSpawnedRef.current = true;
      spawnWave(arenaSize.width, arenaSize.height);
    }
  }, [isArenaSizeStable, settingsLoaded, arenaSize, state.units.length, spawnWave]);

  // Show unit info panel for squad selection (all selected units same type/team)
  // Uses core function to determine if selection is uniform
  const selectedUnit = getUniformSelectionUnit(selectedUnitIds, state.units);

  const handleStartBattle = useCallback(() => {
    start();
  }, [start]);

  const handleReset = useCallback(() => {
    reset();
    hasSpawnedRef.current = false;
  }, [reset]);

  const handleAutoBattleToggle = useCallback(() => {
    const newValue = !autoBattle;
    setAutoBattle(newValue);
    // If enabling auto-battle and not currently running, start the battle
    if (newValue && !state.isRunning) {
      start();
    }
  }, [autoBattle, setAutoBattle, state.isRunning, start]);

  // Handle outcome dismiss - delegates to hook for outcome processing and auto-battle flow
  const handleOutcomeDismiss = useCallback(() => {
    handleOutcomeAndContinue(() => {
      // Reset spawned ref so units can spawn again
      hasSpawnedRef.current = false;
    });
  }, [handleOutcomeAndContinue]);

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
          autoBattle={autoBattle}
          onDismiss={handleOutcomeDismiss}
        />
      </div>

      {/* Right side - Info Panel */}
      <div className="w-80 flex-shrink-0 rounded-lg p-5 overflow-y-auto" style={styles.panelBg}>
        {selectedUnit ? (
          <UnitInfoPanel
            unit={selectedUnit}
            squadCount={selectedUnitIds.length}
            onDeselect={() => selectUnits([])}
          />
        ) : (
          <ControlsPanel
            isRunning={state.isRunning}
            hasStarted={state.hasStarted}
            battleSpeed={battleSpeed}
            waveNumber={state.waveNumber}
            highestWave={state.highestWave}
            gold={state.gold}
            autoBattle={autoBattle}
            onStart={handleStartBattle}
            onStop={stop}
            onReset={handleReset}
            onSpeedChange={setBattleSpeed}
            onWaveChange={setWave}
            onAutoBattleToggle={handleAutoBattleToggle}
          />
        )}
      </div>
    </div>
  );
}

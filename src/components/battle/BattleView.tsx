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

  // Auto-spawn units once arena size is stable and settings are loaded
  useEffect(() => {
    if (isArenaSizeStable && settingsLoaded && state.units.length === 0 && !hasSpawnedRef.current) {
      hasSpawnedRef.current = true;
      spawnWave(arenaSize.width, arenaSize.height);
    }
  }, [isArenaSizeStable, settingsLoaded, arenaSize, state.units.length, spawnWave]);

  // Show unit info panel for squad selection (all selected units same type/team)
  const selectedUnit = (() => {
    if (selectedUnitIds.length === 0) return null;

    // Get all selected units
    const selectedUnits = state.units.filter((u) => selectedUnitIds.includes(u.id));
    if (selectedUnits.length === 0) return null;

    // Check if all selected units are same type and team (squad)
    const firstUnit = selectedUnits[0];
    const isSquadSelection = selectedUnits.every(
      (u) => u.type === firstUnit.type && u.team === firstUnit.team
    );

    // Show panel for squad selection (same type/team) - use first unit as representative
    return isSquadSelection ? firstUnit : null;
  })();

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

  // Handle outcome dismiss - delegates to engine for gold/wave logic, then resets
  // If auto-battle is enabled, automatically starts the next battle
  const handleOutcomeDismiss = useCallback(() => {
    handleBattleOutcome();
    handleReset();

    // Auto-start next battle if auto-battle is enabled
    if (autoBattle) {
      // Small delay to let the reset/spawn complete
      setTimeout(() => {
        start();
      }, 100);
    }
  }, [handleBattleOutcome, handleReset, autoBattle, start]);

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

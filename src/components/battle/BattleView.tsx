/**
 * Battle View Component
 *
 * Main container for the battle system.
 * Orchestrates canvas, overlays, and control panel.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useBattle } from '../../hooks/useBattle';
import { useArenaSizing } from '../../hooks/useArenaSizing';
import { BattleCanvas } from './BattleCanvas';
import { WaxSealOverlay } from './WaxSealOverlay';
import { UnitInfoPanel } from './UnitInfoPanel';
import { ControlsPanel } from './ControlsPanel';
import { getUniformSelectionUnit } from '../../core/battle/SelectionManager';
import { UI_COLORS } from '../../core/theme/colors';
import { BattleUpgradeStates } from '../../core/battle/upgrades/types';

// Industrial theme styles
const styles = {
  panelBg: { backgroundColor: UI_COLORS.panelLight },
};

export interface BattleViewProps {
  /** Upgrade states from assembly (for applying modifiers) */
  upgradeStates?: BattleUpgradeStates;
  /** Callback when returning to assembly with gold earned and new highest wave */
  onReturnToAssembly?: (goldEarned: number, highestWave: number) => void;
}

export function BattleView({ upgradeStates: _upgradeStates, onReturnToAssembly }: BattleViewProps) {
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
    toggleAutoBattle,
    setWave,
    getWaveGoldReward,
    handleOutcomeAndContinue,
  } = useBattle();

  // Use extracted arena sizing hook (SRP: sizing logic in one place)
  const { arenaSize, isArenaSizeStable, containerRef } = useArenaSizing();
  const hasSpawnedRef = useRef(false);

  // Reset key for triggering zoom reset
  const [zoomResetKey, setZoomResetKey] = useState(0);

  // Track gold earned during this battle session
  const [sessionGoldEarned, setSessionGoldEarned] = useState(0);

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
    setZoomResetKey((prev) => prev + 1);
  }, [reset]);

  // Handle wave change - updates wave and respawns units with new formation
  const handleWaveChange = useCallback(
    (wave: number) => {
      setWave(wave);
      reset();
      hasSpawnedRef.current = false;
      // No zoom reset needed - just changing formation
    },
    [setWave, reset]
  );

  // Handle outcome dismiss - delegates to hook for outcome processing and auto-battle flow
  const handleOutcomeDismiss = useCallback(() => {
    // Track gold earned before continuing
    if (state.outcome === 'player_victory') {
      const goldReward = getWaveGoldReward();
      setSessionGoldEarned((prev) => prev + goldReward);
    }

    handleOutcomeAndContinue(() => {
      // Reset spawned ref so units can spawn again
      hasSpawnedRef.current = false;
      // Reset zoom for new battle
      setZoomResetKey((prev) => prev + 1);
    });
  }, [handleOutcomeAndContinue, state.outcome, getWaveGoldReward]);

  // Handle return to assembly
  const handleReturnToAssembly = useCallback(() => {
    if (onReturnToAssembly) {
      onReturnToAssembly(sessionGoldEarned, state.highestWave);
    }
  }, [onReturnToAssembly, sessionGoldEarned, state.highestWave]);

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
          resetKey={zoomResetKey}
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
            sessionGoldEarned={sessionGoldEarned}
            onStart={handleStartBattle}
            onStop={stop}
            onReset={handleReset}
            onSpeedChange={setBattleSpeed}
            onWaveChange={handleWaveChange}
            onAutoBattleToggle={toggleAutoBattle}
            onReturnToAssembly={onReturnToAssembly ? handleReturnToAssembly : undefined}
          />
        )}
      </div>
    </div>
  );
}

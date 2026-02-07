/**
 * Battle View Component
 *
 * Main container for the battle system.
 * Orchestrates canvas, overlays, and control panel.
 * AC6-inspired styling with battleground backdrop.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useBattle } from '../../hooks/useBattle';
import { useArenaSizing } from '../../hooks/useArenaSizing';
import { BattleCanvas } from './BattleCanvas';
import { BattleOutcomeOverlay } from './BattleOutcomeOverlay';
import { BattleTimer } from './BattleTimer';
import { UnitInfoPanel } from './UnitInfoPanel';
import { ControlsPanel } from './ControlsPanel';
import { Panel3D } from '../ui/Panel3D';
import { getUniformSelectionUnit } from '../../core/battle/SelectionManager';
import { UI_COLORS, hexToRgba } from '../../core/theme/colors';
import battlegroundBg from '../../assets/battleground1.png';

export interface BattleViewProps {
  /** Current VEST from assembly */
  vest?: number;
  /** Callback when returning to assembly with VEST earned and new highest wave */
  onReturnToAssembly?: (vestEarned: number, highestWave: number) => void;
  /** Record a clear time for a wave. Returns whether it was a new record. */
  onRecordTime?: (wave: number, simTime: number) => boolean;
  /** Check if a time would be a new record for a wave */
  isNewRecord?: (wave: number, simTime: number) => boolean;
}

export function BattleView({
  vest = 0,
  onReturnToAssembly,
  onRecordTime,
  isNewRecord,
}: BattleViewProps) {
  const {
    state,
    selectedUnitIds,
    battleSpeed,
    autoBattle,
    stayMode,
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
    toggleStayMode,
    setWave,
    getWaveGoldReward,
    handleOutcomeAndContinue,
  } = useBattle();

  // Use extracted arena sizing hook (SRP: sizing logic in one place)
  const { arenaSize, isArenaSizeStable, containerRef } = useArenaSizing();
  const hasSpawnedRef = useRef(false);

  // Reset key for triggering zoom reset
  const [zoomResetKey, setZoomResetKey] = useState(0);

  // Track VEST earned during this battle session
  const [sessionVestEarned, setSessionVestEarned] = useState(0);

  // Track battle duration and record status for outcome overlay
  const [outcomeDuration, setOutcomeDuration] = useState<number | undefined>(undefined);
  const [outcomeIsRecord, setOutcomeIsRecord] = useState(false);

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

  // Capture duration and record status when battle ends
  const prevOutcomeRef = useRef(state.outcome);
  useEffect(() => {
    if (prevOutcomeRef.current === 'pending' && state.outcome !== 'pending') {
      const simTime = state.simulationTime;
      setOutcomeDuration(simTime);
      if (state.outcome === 'player_victory' && isNewRecord) {
        setOutcomeIsRecord(isNewRecord(state.waveNumber, simTime));
      } else {
        setOutcomeIsRecord(false);
      }
    } else if (state.outcome === 'pending') {
      setOutcomeDuration(undefined);
      setOutcomeIsRecord(false);
    }
    prevOutcomeRef.current = state.outcome;
  }, [state.outcome, state.simulationTime, state.waveNumber, isNewRecord]);

  // Handle outcome dismiss - delegates to hook for outcome processing and auto-battle flow
  const handleOutcomeDismiss = useCallback(() => {
    // Track VEST earned and record time before continuing
    if (state.outcome === 'player_victory') {
      const vestReward = getWaveGoldReward();
      setSessionVestEarned((prev) => prev + vestReward);
      if (onRecordTime && outcomeDuration !== undefined) {
        onRecordTime(state.waveNumber, outcomeDuration);
      }
    }

    handleOutcomeAndContinue(() => {
      // Reset spawned ref so units can spawn again
      hasSpawnedRef.current = false;
      // Reset zoom for new battle
      setZoomResetKey((prev) => prev + 1);
    });
  }, [
    handleOutcomeAndContinue,
    state.outcome,
    state.waveNumber,
    getWaveGoldReward,
    onRecordTime,
    outcomeDuration,
  ]);

  // Handle return to assembly
  const handleReturnToAssembly = useCallback(() => {
    if (onReturnToAssembly) {
      onReturnToAssembly(sessionVestEarned, state.highestWave);
    }
  }, [onReturnToAssembly, sessionVestEarned, state.highestWave]);

  return (
    <div
      className="flex h-full relative"
      style={{
        backgroundImage: `url(${battlegroundBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: hexToRgba(UI_COLORS.black, 0.3) }}
      />

      {/* Content layer */}
      <div className="relative z-10 flex gap-4 h-full w-full p-4">
        {/* Left side - Arena */}
        <div
          ref={containerRef}
          className="flex-[2] flex flex-col items-center justify-center gap-2 min-w-0 relative"
        >
          <BattleTimer simulationTime={state.simulationTime} hasStarted={state.hasStarted} />
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
          <BattleOutcomeOverlay
            outcome={state.outcome}
            vestEarned={state.outcome === 'player_victory' ? getWaveGoldReward() : 0}
            waveNumber={state.waveNumber}
            autoBattle={autoBattle}
            stayMode={stayMode}
            battleDuration={outcomeDuration}
            isNewRecord={outcomeIsRecord}
            onDismiss={handleOutcomeDismiss}
          />
        </div>

        {/* Right side - Info Panel */}
        <Panel3D className="w-72 flex-shrink-0 overflow-y-auto">
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
              vest={vest}
              autoBattle={autoBattle}
              stayMode={stayMode}
              sessionVestEarned={sessionVestEarned}
              onStart={handleStartBattle}
              onStop={stop}
              onReset={handleReset}
              onSpeedChange={setBattleSpeed}
              onWaveChange={handleWaveChange}
              onAutoBattleToggle={toggleAutoBattle}
              onStayModeToggle={toggleStayMode}
              onReturnToAssembly={onReturnToAssembly ? handleReturnToAssembly : undefined}
            />
          )}
        </Panel3D>
      </div>
    </div>
  );
}

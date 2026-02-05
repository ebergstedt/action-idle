/**
 * Controls Panel Component
 *
 * Battle control panel with VEST display, wave selector,
 * start/stop/reset buttons, and speed controls.
 * AC6-inspired minimal styling.
 */

import { BattleSpeed } from '../../hooks/useBattle';
import { UI_COLORS } from '../../core/theme/colors';
import { formatNumber } from '../../core/utils/BigNumber';
import { Decimal } from '../../core/utils/BigNumber';
import { Button3D } from '../ui/Button3D';

interface ControlsPanelProps {
  isRunning: boolean;
  hasStarted: boolean;
  battleSpeed: BattleSpeed;
  waveNumber: number;
  highestWave: number;
  vest: number;
  autoBattle: boolean;
  sessionVestEarned?: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: BattleSpeed) => void;
  onWaveChange: (wave: number) => void;
  onAutoBattleToggle: () => void;
  onReturnToAssembly?: () => void;
}

export function ControlsPanel({
  isRunning,
  hasStarted,
  battleSpeed,
  waveNumber,
  highestWave,
  vest,
  autoBattle,
  sessionVestEarned = 0,
  onStart,
  onStop,
  onReset,
  onSpeedChange,
  onWaveChange,
  onAutoBattleToggle,
  onReturnToAssembly,
}: ControlsPanelProps) {
  const speeds: BattleSpeed[] = [0.5, 1, 2];
  // Show current vest + session earnings for real-time update
  const totalVest = vest + sessionVestEarned;
  const formattedVest = formatNumber(new Decimal(totalVest));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="text-sm font-medium tracking-widest mb-4 pb-2"
        style={{
          color: UI_COLORS.accentPrimary,
          borderBottom: `1px solid ${UI_COLORS.metalDark}`,
        }}
      >
        BATTLE
      </div>

      {/* VEST & Wave Info */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span
            className="text-sm uppercase tracking-wide"
            style={{ color: UI_COLORS.textPrimary }}
          >
            VEST
          </span>
          <span className="font-mono font-bold" style={{ color: UI_COLORS.accentPrimary }}>
            {formattedVest}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span
            className="text-sm uppercase tracking-wide"
            style={{ color: UI_COLORS.textPrimary }}
          >
            WAVE
          </span>
          <span className="font-mono font-bold" style={{ color: UI_COLORS.textPrimary }}>
            {waveNumber}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm uppercase tracking-wide" style={{ color: UI_COLORS.white }}>
            BEST
          </span>
          <span className="font-mono" style={{ color: UI_COLORS.white }}>
            {highestWave}
          </span>
        </div>
      </div>

      {/* Wave Selector */}
      <div
        className="flex items-center gap-2 mb-4 pb-4"
        style={{ borderBottom: `1px solid ${UI_COLORS.metalDark}` }}
      >
        <Button3D
          size="xs"
          color={UI_COLORS.metalDark}
          textColor={UI_COLORS.textPrimary}
          onClick={() => onWaveChange(waveNumber - 1)}
          disabled={waveNumber <= 1 || hasStarted}
        >
          −
        </Button3D>
        <div
          className="flex-1 text-center text-sm uppercase tracking-wide"
          style={{ color: UI_COLORS.white }}
        >
          SELECT WAVE
        </div>
        <Button3D
          size="xs"
          color={UI_COLORS.metalDark}
          textColor={UI_COLORS.textPrimary}
          onClick={() => onWaveChange(waveNumber + 1)}
          disabled={hasStarted || waveNumber >= highestWave}
        >
          +
        </Button3D>
      </div>

      {/* Battle Controls */}
      <div className="space-y-2 mb-4">
        {!isRunning ? (
          <Button3D size="sm" onClick={onStart} className="w-full">
            {hasStarted ? 'RESUME' : 'START'}
          </Button3D>
        ) : (
          <Button3D size="sm" color={UI_COLORS.warningOrange} onClick={onStop} className="w-full">
            PAUSE
          </Button3D>
        )}

        <div className="flex gap-2">
          <Button3D
            size="sm"
            color={UI_COLORS.metalDark}
            textColor={UI_COLORS.textPrimary}
            onClick={onReset}
            className="flex-1"
          >
            RESET
          </Button3D>
          <Button3D
            size="sm"
            color={autoBattle ? UI_COLORS.accentSecondary : UI_COLORS.metalDark}
            textColor={autoBattle ? UI_COLORS.white : UI_COLORS.textPrimary}
            onClick={onAutoBattleToggle}
            className="flex-1"
          >
            AUTO
          </Button3D>
        </div>
      </div>

      {/* Speed Control */}
      <div className="mb-4 pb-4" style={{ borderBottom: `1px solid ${UI_COLORS.metalDark}` }}>
        <div
          className="text-sm font-medium tracking-widest mb-2"
          style={{ color: UI_COLORS.white }}
        >
          SPEED
        </div>
        <div className="flex gap-1">
          {speeds.map((speed) => (
            <Button3D
              key={speed}
              size="xs"
              color={battleSpeed === speed ? UI_COLORS.accentPrimary : UI_COLORS.metalDark}
              textColor={battleSpeed === speed ? UI_COLORS.black : UI_COLORS.white}
              onClick={() => onSpeedChange(speed)}
              className="flex-1"
            >
              {speed}X
            </Button3D>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Return to Assembly */}
      {onReturnToAssembly && (
        <div>
          {sessionVestEarned > 0 && (
            <div
              className="text-sm mb-2 text-center uppercase tracking-wide"
              style={{ color: UI_COLORS.white }}
            >
              EARNED: <span style={{ color: UI_COLORS.accentPrimary }}>+{sessionVestEarned}V</span>
            </div>
          )}
          <Button3D
            size="sm"
            color={UI_COLORS.accentSecondary}
            textColor={UI_COLORS.white}
            onClick={onReturnToAssembly}
            className="w-full"
          >
            ASSEMBLY
          </Button3D>
        </div>
      )}
    </div>
  );
}

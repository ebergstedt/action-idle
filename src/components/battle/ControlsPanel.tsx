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
          <span className="text-sm uppercase tracking-wide" style={{ color: UI_COLORS.textMuted }}>
            BEST
          </span>
          <span className="font-mono" style={{ color: UI_COLORS.textMuted }}>
            {highestWave}
          </span>
        </div>
      </div>

      {/* Wave Selector */}
      <div
        className="flex items-center gap-2 mb-4 pb-4"
        style={{ borderBottom: `1px solid ${UI_COLORS.metalDark}` }}
      >
        <button
          onClick={() => onWaveChange(waveNumber - 1)}
          disabled={waveNumber <= 1 || hasStarted}
          className="px-3 py-1 font-bold disabled:opacity-30"
          style={{
            backgroundColor: UI_COLORS.metalDark,
            color: UI_COLORS.textPrimary,
          }}
        >
          -
        </button>
        <div
          className="flex-1 text-center text-sm uppercase tracking-wide"
          style={{ color: UI_COLORS.textMuted }}
        >
          SELECT WAVE
        </div>
        <button
          onClick={() => onWaveChange(waveNumber + 1)}
          disabled={hasStarted}
          className="px-3 py-1 font-bold disabled:opacity-30"
          style={{
            backgroundColor: UI_COLORS.metalDark,
            color: UI_COLORS.textPrimary,
          }}
        >
          +
        </button>
      </div>

      {/* Battle Controls */}
      <div className="space-y-2 mb-4">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="w-full py-2 font-bold uppercase tracking-wide"
            style={{
              backgroundColor: UI_COLORS.accentPrimary,
              color: UI_COLORS.black,
            }}
          >
            {hasStarted ? 'RESUME' : 'START'}
          </button>
        ) : (
          <button
            onClick={onStop}
            className="w-full py-2 font-bold uppercase tracking-wide"
            style={{
              backgroundColor: UI_COLORS.warningOrange,
              color: UI_COLORS.black,
            }}
          >
            PAUSE
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="flex-1 py-2 font-medium uppercase tracking-wide"
            style={{
              backgroundColor: UI_COLORS.metalDark,
              color: UI_COLORS.textPrimary,
            }}
          >
            RESET
          </button>
          <button
            onClick={onAutoBattleToggle}
            className="flex-1 py-2 font-medium uppercase tracking-wide"
            style={{
              backgroundColor: autoBattle ? UI_COLORS.accentSecondary : UI_COLORS.metalDark,
              color: autoBattle ? UI_COLORS.white : UI_COLORS.textPrimary,
            }}
          >
            AUTO
          </button>
        </div>
      </div>

      {/* Speed Control */}
      <div className="mb-4 pb-4" style={{ borderBottom: `1px solid ${UI_COLORS.metalDark}` }}>
        <div
          className="text-sm font-medium tracking-widest mb-2"
          style={{ color: UI_COLORS.textMuted }}
        >
          SPEED
        </div>
        <div className="flex gap-1">
          {speeds.map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className="flex-1 py-1 font-mono text-sm"
              style={{
                backgroundColor: battleSpeed === speed ? UI_COLORS.accentPrimary : 'transparent',
                color: battleSpeed === speed ? UI_COLORS.black : UI_COLORS.textMuted,
                borderLeft: battleSpeed === speed ? 'none' : `1px solid ${UI_COLORS.metalDark}`,
              }}
            >
              {speed}X
            </button>
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
              style={{ color: UI_COLORS.textMuted }}
            >
              EARNED: <span style={{ color: UI_COLORS.accentPrimary }}>+{sessionVestEarned}V</span>
            </div>
          )}
          <button
            onClick={onReturnToAssembly}
            className="w-full py-2 font-bold uppercase tracking-widest"
            style={{
              backgroundColor: UI_COLORS.accentSecondary,
              color: UI_COLORS.white,
            }}
          >
            ASSEMBLY
          </button>
        </div>
      )}
    </div>
  );
}

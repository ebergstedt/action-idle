/**
 * Controls Panel Component
 *
 * Battle control panel with VEST display, wave selector,
 * start/stop/reset buttons, and speed controls.
 * AC6-inspired industrial styling with uppercase text.
 */

import { BattleSpeed } from '../../hooks/useBattle';
import { UI_COLORS, ARENA_COLORS, hexToRgba } from '../../core/theme/colors';
import { formatNumber } from '../../core/utils/BigNumber';
import { Decimal } from '../../core/utils/BigNumber';

// Industrial theme styles
const styles = {
  text: { color: UI_COLORS.textPrimary },
  textFaded: { color: UI_COLORS.textSecondary },
  buttonSecondary: {
    backgroundColor: UI_COLORS.metalDark,
    color: UI_COLORS.textPrimary,
  },
};

interface ControlsPanelProps {
  isRunning: boolean;
  hasStarted: boolean;
  battleSpeed: BattleSpeed;
  waveNumber: number;
  highestWave: number;
  gold: number;
  autoBattle: boolean;
  sessionGoldEarned?: number;
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
  gold,
  autoBattle,
  sessionGoldEarned = 0,
  onStart,
  onStop,
  onReset,
  onSpeedChange,
  onWaveChange,
  onAutoBattleToggle,
  onReturnToAssembly,
}: ControlsPanelProps) {
  const speeds: BattleSpeed[] = [0.5, 1, 2];

  // Format gold using the standard number formatter for consistency
  const formattedGold = formatNumber(new Decimal(gold));

  return (
    <div className="flex flex-col gap-4" style={styles.text}>
      {/* VEST Display */}
      <div
        className="p-3 rounded-lg"
        style={{ backgroundColor: hexToRgba(UI_COLORS.accentPrimary, 0.2) }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-sm font-semibold uppercase tracking-widest"
            style={styles.textFaded}
          >
            VEST
          </span>
          <span className="text-xl font-bold font-mono" style={{ color: UI_COLORS.accentPrimary }}>
            {formattedGold}
          </span>
        </div>
      </div>

      {/* Wave Display & Selector */}
      <div
        className="p-3 rounded-lg"
        style={{ backgroundColor: hexToRgba(UI_COLORS.metalDark, 0.5) }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-sm font-semibold uppercase tracking-widest"
            style={styles.textFaded}
          >
            WAVE
          </span>
          <span className="text-lg font-bold font-mono" style={{ color: UI_COLORS.textPrimary }}>
            {waveNumber}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onWaveChange(waveNumber - 1)}
            disabled={waveNumber <= 1 || hasStarted}
            className="px-3 py-1 rounded font-bold text-lg disabled:opacity-30"
            style={styles.buttonSecondary}
          >
            -
          </button>
          <div
            className="flex-1 text-center text-sm uppercase tracking-wide"
            style={styles.textFaded}
          >
            BEST: {highestWave}
          </div>
          <button
            onClick={() => onWaveChange(waveNumber + 1)}
            disabled={hasStarted}
            className="px-3 py-1 rounded font-bold text-lg disabled:opacity-30"
            style={styles.buttonSecondary}
          >
            +
          </button>
        </div>
      </div>

      {/* Battle Controls */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              onClick={onStart}
              className="flex-1 px-4 py-2 rounded font-semibold uppercase tracking-wide hover:opacity-90"
              style={{
                backgroundColor: ARENA_COLORS.healthHigh,
                color: UI_COLORS.white,
              }}
            >
              {hasStarted ? 'RESUME' : 'START'}
            </button>
          ) : (
            <button
              onClick={onStop}
              className="flex-1 px-4 py-2 rounded font-semibold uppercase tracking-wide hover:opacity-90"
              style={{
                backgroundColor: ARENA_COLORS.healthMedium,
                color: UI_COLORS.black,
              }}
            >
              PAUSE
            </button>
          )}

          {/* Auto-Battle Toggle */}
          <button
            onClick={onAutoBattleToggle}
            className="px-3 py-2 rounded font-semibold uppercase tracking-wide hover:opacity-90"
            title={autoBattle ? 'Disable Auto-Battle' : 'Enable Auto-Battle'}
            style={{
              backgroundColor: autoBattle ? ARENA_COLORS.healthHigh : UI_COLORS.metalDark,
              color: autoBattle ? UI_COLORS.white : UI_COLORS.textPrimary,
              border: autoBattle ? `2px solid ${UI_COLORS.white}` : '2px solid transparent',
            }}
          >
            AUTO
          </button>
        </div>

        <button
          onClick={onReset}
          className="w-full px-4 py-2 rounded font-semibold uppercase tracking-wide hover:opacity-90"
          style={styles.buttonSecondary}
        >
          RESET
        </button>
      </div>

      {/* Battle Speed Control */}
      <div className="pt-4" style={{ borderTop: `1px solid ${UI_COLORS.metalDark}` }}>
        <h4
          className="text-sm font-semibold mb-2 uppercase tracking-widest"
          style={styles.textFaded}
        >
          SPEED
        </h4>
        <div className="flex gap-2">
          {speeds.map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className="flex-1 px-3 py-1.5 rounded font-semibold text-sm transition-all uppercase"
              style={{
                backgroundColor:
                  battleSpeed === speed ? UI_COLORS.accentPrimary : UI_COLORS.metalDark,
                color: battleSpeed === speed ? UI_COLORS.black : UI_COLORS.textPrimary,
                border:
                  battleSpeed === speed
                    ? `2px solid ${UI_COLORS.accentPrimary}`
                    : '2px solid transparent',
              }}
            >
              {speed}X
            </button>
          ))}
        </div>
      </div>

      {/* Return to Assembly */}
      {onReturnToAssembly && (
        <div className="pt-4" style={{ borderTop: `1px solid ${UI_COLORS.metalDark}` }}>
          {sessionGoldEarned > 0 && (
            <div
              className="text-sm mb-2 text-center uppercase tracking-wide"
              style={styles.textFaded}
            >
              EARNED: <span style={{ color: UI_COLORS.accentPrimary }}>+{sessionGoldEarned}V</span>
            </div>
          )}
          <button
            onClick={onReturnToAssembly}
            className="w-full px-4 py-3 rounded font-bold uppercase tracking-widest hover:opacity-90"
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

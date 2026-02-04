/**
 * Controls Panel Component
 *
 * Battle control panel with gold display, wave selector,
 * start/stop/reset buttons, and speed controls.
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
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: BattleSpeed) => void;
  onWaveChange: (wave: number) => void;
  onAutoBattleToggle: () => void;
}

export function ControlsPanel({
  isRunning,
  hasStarted,
  battleSpeed,
  waveNumber,
  highestWave,
  gold,
  autoBattle,
  onStart,
  onStop,
  onReset,
  onSpeedChange,
  onWaveChange,
  onAutoBattleToggle,
}: ControlsPanelProps) {
  const speeds: BattleSpeed[] = [0.5, 1, 2];

  // Format gold using the standard number formatter for consistency
  const formattedGold = formatNumber(new Decimal(gold));

  return (
    <div className="flex flex-col gap-4" style={styles.text}>
      {/* Gold Display */}
      <div
        className="p-3 rounded-lg"
        style={{ backgroundColor: hexToRgba(UI_COLORS.accentPrimary, 0.2) }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={styles.textFaded}>
            Gold
          </span>
          <span className="text-xl font-bold" style={{ color: UI_COLORS.accentPrimary }}>
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
          <span className="text-sm font-semibold" style={styles.textFaded}>
            Wave
          </span>
          <span className="text-lg font-bold" style={{ color: UI_COLORS.textPrimary }}>
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
          <div className="flex-1 text-center text-sm" style={styles.textFaded}>
            Best: {highestWave}
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
              className="flex-1 px-4 py-2 rounded font-semibold hover:opacity-90"
              style={{
                backgroundColor: ARENA_COLORS.healthHigh,
                color: UI_COLORS.white,
              }}
            >
              {hasStarted ? 'Resume' : 'Start Battle'}
            </button>
          ) : (
            <button
              onClick={onStop}
              className="flex-1 px-4 py-2 rounded font-semibold hover:opacity-90"
              style={{
                backgroundColor: ARENA_COLORS.healthMedium,
                color: UI_COLORS.black,
              }}
            >
              Pause
            </button>
          )}

          {/* Auto-Battle Toggle */}
          <button
            onClick={onAutoBattleToggle}
            className="px-3 py-2 rounded font-semibold hover:opacity-90"
            title={autoBattle ? 'Disable Auto-Battle' : 'Enable Auto-Battle'}
            style={{
              backgroundColor: autoBattle ? ARENA_COLORS.healthHigh : UI_COLORS.metalDark,
              color: autoBattle ? UI_COLORS.white : UI_COLORS.textPrimary,
              border: autoBattle ? `2px solid ${UI_COLORS.white}` : '2px solid transparent',
            }}
          >
            Auto
          </button>
        </div>

        <button
          onClick={onReset}
          className="w-full px-4 py-2 rounded font-semibold hover:opacity-90"
          style={styles.buttonSecondary}
        >
          Reset
        </button>
      </div>

      {/* Battle Speed Control */}
      <div className="pt-4" style={{ borderTop: `1px solid ${UI_COLORS.metalDark}` }}>
        <h4 className="text-sm font-semibold mb-2" style={styles.textFaded}>
          Battle Speed
        </h4>
        <div className="flex gap-2">
          {speeds.map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className="flex-1 px-3 py-1.5 rounded font-semibold text-sm transition-all"
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
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

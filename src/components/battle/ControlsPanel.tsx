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
import { MapLegend } from './MapLegend';

// Parchment theme styles
const styles = {
  text: { color: UI_COLORS.black },
  textFaded: { color: UI_COLORS.black },
  buttonSecondary: {
    backgroundColor: UI_COLORS.parchmentDark,
    color: UI_COLORS.black,
  },
};

interface ControlsPanelProps {
  isRunning: boolean;
  hasStarted: boolean;
  battleSpeed: BattleSpeed;
  waveNumber: number;
  highestWave: number;
  gold: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: BattleSpeed) => void;
  onWaveChange: (wave: number) => void;
}

export function ControlsPanel({
  isRunning,
  hasStarted,
  battleSpeed,
  waveNumber,
  highestWave,
  gold,
  onStart,
  onStop,
  onReset,
  onSpeedChange,
  onWaveChange,
}: ControlsPanelProps) {
  const speeds: BattleSpeed[] = [0.5, 1, 2];

  // Format gold using the standard number formatter for consistency
  const formattedGold = formatNumber(new Decimal(gold));

  return (
    <div className="flex flex-col gap-4" style={styles.text}>
      {/* Gold Display */}
      <div
        className="p-3 rounded-lg"
        style={{ backgroundColor: hexToRgba(UI_COLORS.goldPrimary, 0.2) }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={styles.textFaded}>
            Gold
          </span>
          <span className="text-xl font-bold" style={{ color: UI_COLORS.black }}>
            {formattedGold}
          </span>
        </div>
      </div>

      {/* Wave Display & Selector */}
      <div
        className="p-3 rounded-lg"
        style={{ backgroundColor: hexToRgba(UI_COLORS.parchmentDark, 0.3) }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={styles.textFaded}>
            Wave
          </span>
          <span className="text-lg font-bold" style={{ color: UI_COLORS.black }}>
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
        {!isRunning ? (
          <button
            onClick={onStart}
            className="w-full px-4 py-2 rounded font-semibold hover:opacity-90"
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
            className="w-full px-4 py-2 rounded font-semibold hover:opacity-90"
            style={{
              backgroundColor: ARENA_COLORS.healthMedium,
              color: UI_COLORS.inkBlack,
            }}
          >
            Pause
          </button>
        )}

        <button
          onClick={onReset}
          className="w-full px-4 py-2 rounded font-semibold hover:opacity-90"
          style={styles.buttonSecondary}
        >
          Reset
        </button>
      </div>

      {/* Battle Speed Control */}
      <div className="pt-4" style={{ borderTop: `1px solid ${UI_COLORS.parchmentDark}` }}>
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
                  battleSpeed === speed ? UI_COLORS.goldPrimary : UI_COLORS.parchmentDark,
                color: UI_COLORS.black,
                border:
                  battleSpeed === speed
                    ? `2px solid ${UI_COLORS.goldDark}`
                    : '2px solid transparent',
              }}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Map Legend */}
      <MapLegend className="mt-4" />

      {!hasStarted && (
        <div className="text-sm mt-2" style={{ color: UI_COLORS.black }}>
          Tip: Drag allied units to reposition before starting
        </div>
      )}
    </div>
  );
}

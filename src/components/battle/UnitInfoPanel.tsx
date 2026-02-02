/**
 * Unit Info Panel Component
 *
 * Displays detailed information about a selected unit.
 * Shows health, stats, active modifiers, and position.
 */

import { UnitRenderData } from '../../core/battle';
import { UI_COLORS, ARENA_COLORS } from '../../core/theme/colors';
import { calculateDPS } from '../../core/battle/BattleConfig';
import { ModifierDisplay } from './ModifierDisplay';

// Parchment theme styles
const styles = {
  text: { color: UI_COLORS.black },
  textFaded: { color: UI_COLORS.black },
  textDark: { color: UI_COLORS.black },
  healthBarBg: { backgroundColor: UI_COLORS.black },
};

/**
 * Calculate health as a percentage (0-100).
 */
function calculateHealthPercent(health: number, maxHealth: number): number {
  return Math.round((health / maxHealth) * 100);
}

interface UnitInfoPanelProps {
  unit: UnitRenderData;
  onDeselect: () => void;
}

export function UnitInfoPanel({ unit, onDeselect }: UnitInfoPanelProps) {
  const healthPercent = calculateHealthPercent(unit.health, unit.stats.maxHealth);

  return (
    <div className="flex flex-col gap-4" style={styles.text}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold capitalize" style={{ color: unit.color }}>
          {unit.type}
        </h3>
        <button onClick={onDeselect} className="text-sm hover:underline" style={styles.textFaded}>
          Close
        </button>
      </div>

      <div className="text-sm">
        <span
          className="px-2 py-0.5 rounded text-sm"
          style={{
            backgroundColor:
              unit.team === 'player' ? ARENA_COLORS.healthHigh : ARENA_COLORS.healthLow,
            color: UI_COLORS.white,
          }}
        >
          {unit.team === 'player' ? 'Allied' : 'Enemy'}
        </span>
      </div>

      {/* Health bar */}
      <div>
        <div className="flex justify-between text-sm mb-1" style={styles.textFaded}>
          <span>Health</span>
          <span>
            {Math.round(unit.health)} / {unit.stats.maxHealth}
          </span>
        </div>
        <div className="h-3 rounded overflow-hidden" style={styles.healthBarBg}>
          <div
            className="h-full transition-all"
            style={{
              width: `${healthPercent}%`,
              backgroundColor:
                healthPercent > 50
                  ? ARENA_COLORS.healthHigh
                  : healthPercent > 25
                    ? ARENA_COLORS.healthMedium
                    : ARENA_COLORS.healthLow,
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2 text-sm">
        {/* Melee Attack */}
        {unit.stats.melee && (
          <div
            className="pb-2 mb-2"
            style={{ borderBottom: `1px solid ${UI_COLORS.parchmentDark}` }}
          >
            <div className="text-sm mb-1" style={styles.textFaded}>
              Melee Attack
            </div>
            <div className="flex justify-between">
              <span style={styles.textFaded}>Damage</span>
              <span style={styles.textDark}>{unit.stats.melee.damage}</span>
            </div>
            <div className="flex justify-between">
              <span style={styles.textFaded}>Speed</span>
              <span style={styles.textDark}>{unit.stats.melee.attackSpeed}/s</span>
            </div>
            <div className="flex justify-between">
              <span style={styles.textFaded}>DPS</span>
              <span style={{ color: UI_COLORS.black, fontWeight: 'bold' }}>
                {calculateDPS(unit.stats.melee.damage, unit.stats.melee.attackSpeed).toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* Ranged Attack */}
        {unit.stats.ranged && (
          <div
            className="pb-2 mb-2"
            style={{ borderBottom: `1px solid ${UI_COLORS.parchmentDark}` }}
          >
            <div className="text-sm mb-1" style={styles.textFaded}>
              Ranged Attack
            </div>
            <div className="flex justify-between">
              <span style={styles.textFaded}>Damage</span>
              <span style={styles.textDark}>{unit.stats.ranged.damage}</span>
            </div>
            <div className="flex justify-between">
              <span style={styles.textFaded}>Speed</span>
              <span style={styles.textDark}>{unit.stats.ranged.attackSpeed}/s</span>
            </div>
            <div className="flex justify-between">
              <span style={styles.textFaded}>Range</span>
              <span style={styles.textDark}>{unit.stats.ranged.range}px</span>
            </div>
            <div className="flex justify-between">
              <span style={styles.textFaded}>DPS</span>
              <span style={{ color: UI_COLORS.black, fontWeight: 'bold' }}>
                {calculateDPS(unit.stats.ranged.damage, unit.stats.ranged.attackSpeed).toFixed(1)}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <span style={styles.textFaded}>Move Speed</span>
          <span style={styles.textDark}>{unit.stats.moveSpeed}</span>
        </div>
      </div>

      {/* Active Modifiers (Buffs/Debuffs) */}
      {unit.activeModifiers.length > 0 && (
        <div className="pt-2" style={{ borderTop: `1px solid ${UI_COLORS.parchmentDark}` }}>
          <div className="text-sm mb-2" style={styles.textFaded}>
            Active Effects
          </div>
          <div className="space-y-2">
            {unit.activeModifiers.map((mod) => (
              <ModifierDisplay
                key={mod.id}
                sourceId={mod.sourceId}
                remainingDuration={mod.remainingDuration}
              />
            ))}
          </div>
        </div>
      )}

      {/* Position */}
      <div
        className="text-sm pt-2"
        style={{ ...styles.textFaded, borderTop: `1px solid ${UI_COLORS.parchmentDark}` }}
      >
        Position: ({Math.round(unit.position.x)}, {Math.round(unit.position.y)})
      </div>
    </div>
  );
}

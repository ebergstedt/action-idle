/**
 * Unit Info Panel Component
 *
 * Displays detailed information about a selected unit.
 * Shows health, stats, active modifiers, and position.
 */

import { UnitRenderData, calculateHealthPercent } from '../../core/battle';
import { UI_COLORS, ARENA_COLORS } from '../../core/theme/colors';
import { calculateDPS } from '../../core/battle/BattleConfig';
import { ModifierDisplay } from './ModifierDisplay';

// Industrial theme styles
const styles = {
  text: { color: UI_COLORS.textPrimary },
  textFaded: { color: UI_COLORS.textSecondary },
  textDark: { color: UI_COLORS.textPrimary },
  healthBarBg: { backgroundColor: UI_COLORS.panelDark },
};

// ─────────────────────────────────────────────────────────────────────────────
// Extracted Components (reduce nesting and DRY violations)
// ─────────────────────────────────────────────────────────────────────────────

/** Single stat row with label and value */
function StatRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string | number;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span style={styles.textFaded}>{label}</span>
      <span style={bold ? { color: UI_COLORS.textPrimary, fontWeight: 'bold' } : styles.textDark}>
        {value}
      </span>
    </div>
  );
}

/** Attack stats section (melee or ranged) */
function AttackStatsSection({
  title,
  damage,
  attackSpeed,
  range,
}: {
  title: string;
  damage: number;
  attackSpeed: number;
  range?: number;
}) {
  const dps = calculateDPS(damage, attackSpeed);
  return (
    <div className="pb-2 mb-2" style={{ borderBottom: `1px solid ${UI_COLORS.metalDark}` }}>
      <div className="text-sm mb-1" style={styles.textFaded}>
        {title}
      </div>
      <StatRow label="Damage" value={damage} />
      <StatRow label="Speed" value={`${attackSpeed}/s`} />
      {range !== undefined && <StatRow label="Range" value={`${range}px`} />}
      <StatRow label="DPS" value={dps.toFixed(1)} bold />
    </div>
  );
}

interface UnitInfoPanelProps {
  unit: UnitRenderData;
  squadCount?: number;
  onDeselect: () => void;
}

export function UnitInfoPanel({ unit, squadCount = 1, onDeselect }: UnitInfoPanelProps) {
  const healthPercent = calculateHealthPercent(unit.health, unit.stats.maxHealth);

  return (
    <div className="flex flex-col gap-4" style={styles.text}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold capitalize" style={{ color: unit.color }}>
          {unit.type}
          {squadCount > 1 && (
            <span className="text-sm font-normal ml-2" style={styles.textFaded}>
              ({squadCount} units)
            </span>
          )}
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
          {unit.team === 'player' ? 'Allied' : 'Hostile'}
        </span>
      </div>

      {/* Health bar */}
      <div>
        <div className="flex justify-between text-sm mb-1" style={styles.textFaded}>
          <span>AP</span>
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
        {unit.stats.melee && (
          <AttackStatsSection
            title="Melee Attack"
            damage={unit.stats.melee.damage}
            attackSpeed={unit.stats.melee.attackSpeed}
          />
        )}

        {unit.stats.ranged && (
          <AttackStatsSection
            title="Ranged Attack"
            damage={unit.stats.ranged.damage}
            attackSpeed={unit.stats.ranged.attackSpeed}
            range={unit.stats.ranged.range}
          />
        )}

        <StatRow label="Boost Speed" value={unit.stats.moveSpeed} />
      </div>

      {/* Active Modifiers (Buffs/Debuffs) */}
      {unit.activeModifiers.length > 0 && (
        <div className="pt-2" style={{ borderTop: `1px solid ${UI_COLORS.metalDark}` }}>
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
        style={{ ...styles.textFaded, borderTop: `1px solid ${UI_COLORS.metalDark}` }}
      >
        Position: ({Math.round(unit.position.x)}, {Math.round(unit.position.y)})
      </div>
    </div>
  );
}

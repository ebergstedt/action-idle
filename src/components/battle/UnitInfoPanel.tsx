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
import { unitRegistry } from '../../data/battle';

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

/** Single stat row with label and value - matches garage styling */
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
    <div className="flex justify-between items-center py-0.5">
      <span className="uppercase tracking-wide text-sm" style={styles.text}>
        {label}
      </span>
      <span
        className="font-mono"
        style={bold ? { color: UI_COLORS.textPrimary, fontWeight: 'bold' } : styles.text}
      >
        {value}
      </span>
    </div>
  );
}

/** Section header - matches garage styling */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-sm font-medium tracking-widest mb-2 mt-4 first:mt-0"
      style={{ color: UI_COLORS.accentSecondary }}
    >
      {children}
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
      <SectionHeader>{title.toUpperCase()}</SectionHeader>
      <StatRow label="DAMAGE" value={damage} />
      <StatRow label="RATE" value={`${attackSpeed}/s`} />
      {range !== undefined && <StatRow label="RANGE" value={range} />}
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
  const unitDefinition = unitRegistry.tryGet(unit.type);

  return (
    <div className="flex flex-col gap-4" style={styles.text}>
      <div>
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
        {unitDefinition?.description && (
          <p
            className="mt-2 mb-2 pb-2"
            style={{ ...styles.textFaded, borderBottom: `1px solid ${UI_COLORS.metalDark}` }}
          >
            {unitDefinition.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
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
        <span
          className="px-2 py-0.5 rounded text-sm font-mono"
          style={{
            backgroundColor: UI_COLORS.metalDark,
            color: UI_COLORS.accentPrimary,
          }}
        >
          LV {unit.level}
        </span>
      </div>

      {/* Health bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="uppercase tracking-wide text-sm" style={styles.text}>
            HP
          </span>
          <span className="font-mono" style={styles.text}>
            {Math.round(unit.health).toLocaleString()} / {unit.stats.maxHealth.toLocaleString()}
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
      <div className="space-y-2">
        {unit.stats.melee && (
          <AttackStatsSection
            title="Melee"
            damage={unit.stats.melee.damage}
            attackSpeed={unit.stats.melee.attackSpeed}
          />
        )}

        {unit.stats.ranged && (
          <AttackStatsSection
            title="Ranged"
            damage={unit.stats.ranged.damage}
            attackSpeed={unit.stats.ranged.attackSpeed}
            range={unit.stats.ranged.range}
          />
        )}

        <SectionHeader>MOBILITY</SectionHeader>
        <StatRow label="SPEED" value={unit.stats.moveSpeed} />
      </div>

      {/* Active Modifiers (Buffs/Debuffs) */}
      {unit.activeModifiers.length > 0 && (
        <div className="pt-2" style={{ borderTop: `1px solid ${UI_COLORS.metalDark}` }}>
          <SectionHeader>EFFECTS</SectionHeader>
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
      <div className="pt-2" style={{ borderTop: `1px solid ${UI_COLORS.metalDark}` }}>
        <StatRow
          label="POSITION"
          value={`${Math.round(unit.position.x)}, ${Math.round(unit.position.y)}`}
        />
      </div>
    </div>
  );
}

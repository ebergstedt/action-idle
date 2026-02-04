/**
 * Unit Stats Panel Component
 *
 * Center panel showing detailed stats for selected unit.
 * AC6-inspired industrial styling with monospace stat displays.
 */

import { UI_COLORS } from '../../core/theme/colors';
import { unitRegistry } from '../../data/battle';
import { UnitDefinition } from '../../core/battle/units/types';

interface UnitStatsPanelProps {
  /** Currently selected unit type */
  selectedUnitType: string | null;
}

/** Format stat value for display */
function formatStat(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString();
}

/** Stat row component */
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span style={{ color: UI_COLORS.textSecondary }}>{label}</span>
      <span className="font-mono" style={{ color: UI_COLORS.textPrimary }}>
        {value}
      </span>
    </div>
  );
}

export function UnitStatsPanel({ selectedUnitType }: UnitStatsPanelProps) {
  // Get unit definition
  const unit: UnitDefinition | undefined = selectedUnitType
    ? unitRegistry.tryGet(selectedUnitType)
    : undefined;

  if (!unit) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div style={{ color: UI_COLORS.textMuted }}>Select a unit to view stats</div>
      </div>
    );
  }

  const { baseStats } = unit;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="text-sm font-bold tracking-widest mb-4 pb-2"
        style={{
          color: UI_COLORS.textSecondary,
          borderBottom: `1px solid ${UI_COLORS.metalDark}`,
        }}
      >
        UNIT DETAILS
      </div>

      {/* Unit name and description */}
      <div className="mb-4">
        <div
          className="text-xl font-bold tracking-wide mb-1"
          style={{ color: UI_COLORS.accentPrimary }}
        >
          {unit.name}
        </div>
        <div className="text-sm" style={{ color: UI_COLORS.textSecondary }}>
          {unit.description}
        </div>
      </div>

      {/* Stats grid */}
      <div
        className="p-4 rounded mb-4"
        style={{
          backgroundColor: UI_COLORS.panelBase,
          border: `1px solid ${UI_COLORS.metalDark}`,
        }}
      >
        <div
          className="text-sm font-medium tracking-wide mb-3"
          style={{ color: UI_COLORS.accentSecondary }}
        >
          BASE STATS
        </div>

        <div className="space-y-1">
          <StatRow label="Health" value={formatStat(baseStats.maxHealth)} />
          <StatRow label="Squad Size" value={formatStat(baseStats.squadSize)} />
          <StatRow label="Move Speed" value={formatStat(baseStats.moveSpeed)} />
          <StatRow label="Armor" value={formatStat(baseStats.armor)} />
          <StatRow label="Attack Interval" value={`${baseStats.attackInterval}s`} />
        </div>
      </div>

      {/* Ranged stats */}
      {baseStats.ranged && (
        <div
          className="p-4 rounded mb-4"
          style={{
            backgroundColor: UI_COLORS.panelBase,
            border: `1px solid ${UI_COLORS.metalDark}`,
          }}
        >
          <div
            className="text-sm font-medium tracking-wide mb-3"
            style={{ color: UI_COLORS.accentSecondary }}
          >
            RANGED ATTACK
          </div>

          <div className="space-y-1">
            <StatRow label="Damage" value={formatStat(baseStats.ranged.damage)} />
            <StatRow label="Range" value={formatStat(baseStats.ranged.range)} />
            <StatRow label="Attack Speed" value={`${baseStats.ranged.attackSpeed}s`} />
            {baseStats.ranged.splashRadius && (
              <StatRow label="Splash Radius" value={formatStat(baseStats.ranged.splashRadius)} />
            )}
          </div>
        </div>
      )}

      {/* Melee stats */}
      {baseStats.melee && (
        <div
          className="p-4 rounded mb-4"
          style={{
            backgroundColor: UI_COLORS.panelBase,
            border: `1px solid ${UI_COLORS.metalDark}`,
          }}
        >
          <div
            className="text-sm font-medium tracking-wide mb-3"
            style={{ color: UI_COLORS.accentSecondary }}
          >
            MELEE ATTACK
          </div>

          <div className="space-y-1">
            <StatRow label="Damage" value={formatStat(baseStats.melee.damage)} />
            <StatRow label="Range" value={formatStat(baseStats.melee.range)} />
            <StatRow label="Attack Speed" value={`${baseStats.melee.attackSpeed}s`} />
          </div>
        </div>
      )}

      {/* Unit info */}
      <div
        className="p-4 rounded"
        style={{
          backgroundColor: UI_COLORS.panelBase,
          border: `1px solid ${UI_COLORS.metalDark}`,
        }}
      >
        <div
          className="text-sm font-medium tracking-wide mb-3"
          style={{ color: UI_COLORS.accentSecondary }}
        >
          INFO
        </div>

        <div className="space-y-1">
          <StatRow label="Category" value={unit.category.toUpperCase()} />
          <StatRow label="Tier" value={`T${unit.tier}`} />
          <StatRow label="Role" value={unit.formationRole.toUpperCase()} />
        </div>
      </div>

      {/* Abilities section */}
      {unit.innateAbilities && unit.innateAbilities.length > 0 && (
        <div
          className="p-4 rounded mt-4"
          style={{
            backgroundColor: UI_COLORS.panelBase,
            border: `1px solid ${UI_COLORS.metalDark}`,
          }}
        >
          <div
            className="text-sm font-medium tracking-wide mb-3"
            style={{ color: UI_COLORS.accentTertiary }}
          >
            ABILITIES
          </div>

          <div className="space-y-1">
            {unit.innateAbilities.map((ability) => (
              <div key={ability} style={{ color: UI_COLORS.textPrimary }}>
                {ability}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No abilities state */}
      {(!unit.innateAbilities || unit.innateAbilities.length === 0) && (
        <div
          className="p-4 rounded mt-4"
          style={{
            backgroundColor: UI_COLORS.panelBase,
            border: `1px solid ${UI_COLORS.metalDark}`,
          }}
        >
          <div
            className="text-sm font-medium tracking-wide mb-3"
            style={{ color: UI_COLORS.accentTertiary }}
          >
            ABILITIES
          </div>

          <div style={{ color: UI_COLORS.textMuted }}>No innate abilities</div>
        </div>
      )}
    </div>
  );
}

/**
 * Unit Stats Panel Component
 *
 * Center panel showing detailed stats for selected unit.
 * AC6-inspired minimal styling with clean stat displays.
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

/** Stat row component - minimal AC6 style */
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="uppercase tracking-wide text-sm" style={{ color: UI_COLORS.textPrimary }}>
        {label}
      </span>
      <span className="font-mono" style={{ color: UI_COLORS.textPrimary }}>
        {value}
      </span>
    </div>
  );
}

/** Section header */
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

export function UnitStatsPanel({ selectedUnitType }: UnitStatsPanelProps) {
  // Get unit definition
  const unit: UnitDefinition | undefined = selectedUnitType
    ? unitRegistry.tryGet(selectedUnitType)
    : undefined;

  if (!unit) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="uppercase tracking-wide" style={{ color: UI_COLORS.textMuted }}>
          Select a unit to view stats
        </div>
      </div>
    );
  }

  const { baseStats } = unit;

  return (
    <div className="flex flex-col h-full">
      {/* Unit name */}
      <div
        className="text-2xl font-bold tracking-wide uppercase mb-1"
        style={{ color: UI_COLORS.accentPrimary }}
      >
        {unit.name}
      </div>

      {/* Description */}
      <div
        className="text-sm mb-4 pb-4"
        style={{
          color: UI_COLORS.textSecondary,
          borderBottom: `1px solid ${UI_COLORS.metalDark}`,
        }}
      >
        {unit.description}
      </div>

      {/* Stats sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Base Stats */}
        <SectionHeader>SPEC</SectionHeader>
        <StatRow label="HP" value={formatStat(baseStats.maxHealth)} />
        <StatRow label="SQUAD" value={formatStat(baseStats.squadSize)} />
        <StatRow label="SPEED" value={formatStat(baseStats.moveSpeed)} />
        <StatRow label="ARMOR" value={formatStat(baseStats.armor)} />

        {/* Ranged stats */}
        {baseStats.ranged && (
          <>
            <SectionHeader>RANGED</SectionHeader>
            <StatRow label="DAMAGE" value={formatStat(baseStats.ranged.damage)} />
            <StatRow label="RANGE" value={formatStat(baseStats.ranged.range)} />
            <StatRow label="RATE" value={`${baseStats.ranged.attackSpeed}/s`} />
            {baseStats.ranged.splashRadius && (
              <StatRow label="SPLASH" value={formatStat(baseStats.ranged.splashRadius)} />
            )}
          </>
        )}

        {/* Melee stats */}
        {baseStats.melee && (
          <>
            <SectionHeader>MELEE</SectionHeader>
            <StatRow label="DAMAGE" value={formatStat(baseStats.melee.damage)} />
            <StatRow label="RANGE" value={formatStat(baseStats.melee.range)} />
            <StatRow label="RATE" value={`${baseStats.melee.attackSpeed}/s`} />
          </>
        )}

        {/* Classification */}
        <SectionHeader>CLASS</SectionHeader>
        <StatRow label="TYPE" value={unit.category.toUpperCase()} />
        <StatRow label="TIER" value={`T${unit.tier}`} />
        <StatRow label="ROLE" value={unit.formationRole.toUpperCase()} />
      </div>
    </div>
  );
}

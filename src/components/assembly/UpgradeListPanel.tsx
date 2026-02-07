/**
 * Upgrade List Panel Component
 *
 * Displays upgrades for the selected unit type.
 * Shows global upgrades and unit-specific upgrades.
 */

import { UI_COLORS } from '../../core/theme/colors';
import { BattleUpgradeStates } from '../../core/battle/upgrades/types';
import { battleUpgradeRegistry } from '../../data/battle';
import { buildPrerequisiteContext, AssemblyState } from '../../core/assembly';
import { UpgradeSection } from './UpgradeSection';

interface UpgradeListPanelProps {
  /** Currently selected unit type (null for global view) */
  selectedUnitType: string | null;
  /** Current upgrade states */
  upgradeStates: BattleUpgradeStates;
  /** Current vest amount */
  vest: number;
  /** Highest wave reached (for prerequisites) */
  highestWave: number;
  /** Called when an upgrade is purchased */
  onPurchase: (upgradeId: string) => void;
}

export function UpgradeListPanel({
  selectedUnitType,
  upgradeStates,
  vest,
  highestWave,
  onPurchase,
}: UpgradeListPanelProps) {
  // Get upgrades for the selected unit type
  const unitUpgrades = selectedUnitType ? battleUpgradeRegistry.getByTarget(selectedUnitType) : [];
  const globalUpgrades = battleUpgradeRegistry.getByScope('global');

  // Build prerequisite context
  const assemblyState: AssemblyState = {
    vest,
    upgradeStates,
    selectedUnitType,
    highestWave,
  };
  const context = buildPrerequisiteContext(assemblyState);

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
        UPGRADES
      </div>

      {/* Scrollable content */}
      <div className="flex-1 scrollable space-y-4">
        {/* Unit-specific upgrades (only when unit is selected) */}
        {selectedUnitType && (
          <UpgradeSection
            title="UNIT UPGRADES"
            titleColor={UI_COLORS.accentSecondary}
            upgrades={unitUpgrades}
            upgradeStates={upgradeStates}
            context={context}
            vest={vest}
            onPurchase={onPurchase}
          />
        )}

        {/* Global upgrades section */}
        {selectedUnitType ? (
          <UpgradeSection
            title="GLOBAL UPGRADES"
            titleColor={UI_COLORS.accentTertiary}
            upgrades={globalUpgrades}
            upgradeStates={upgradeStates}
            context={context}
            vest={vest}
            onPurchase={onPurchase}
            className="mt-4"
          />
        ) : (
          <UpgradeSection
            title="GLOBAL UPGRADES"
            titleColor={UI_COLORS.accentTertiary}
            upgrades={globalUpgrades}
            upgradeStates={upgradeStates}
            context={context}
            vest={vest}
            onPurchase={onPurchase}
          />
        )}

        {/* Empty state */}
        {unitUpgrades.length === 0 && globalUpgrades.length === 0 && !selectedUnitType && (
          <div className="text-sm uppercase tracking-wide" style={{ color: UI_COLORS.white }}>
            Select a unit to view upgrades
          </div>
        )}
      </div>
    </div>
  );
}

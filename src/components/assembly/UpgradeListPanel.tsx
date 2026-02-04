/**
 * Upgrade List Panel Component
 *
 * Displays upgrades for the selected unit type.
 * Shows global upgrades and unit-specific upgrades.
 */

import { UI_COLORS } from '../../core/theme/colors';
import { BattleUpgradeStates, BattleUpgradeDefinition } from '../../core/battle/upgrades/types';
import { battleUpgradeRegistry } from '../../data/battle';
import { buildPrerequisiteContext, AssemblyState } from '../../core/assembly';
import { UpgradeCard } from './UpgradeCard';

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
  let upgrades: BattleUpgradeDefinition[];
  let sectionTitle: string;

  if (selectedUnitType) {
    // Get unit-specific upgrades
    const unitUpgrades = battleUpgradeRegistry.getByTarget(selectedUnitType);
    upgrades = unitUpgrades;
    sectionTitle = 'UNIT UPGRADES';
  } else {
    // Show global upgrades when no unit selected
    upgrades = battleUpgradeRegistry.getByScope('global');
    sectionTitle = 'GLOBAL UPGRADES';
  }

  // Also get global upgrades to show in a separate section
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
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Unit-specific upgrades */}
        {selectedUnitType && upgrades.length > 0 && (
          <div>
            <div
              className="text-sm font-medium tracking-wide mb-2"
              style={{ color: UI_COLORS.accentSecondary }}
            >
              {sectionTitle}
            </div>
            <div className="space-y-2">
              {upgrades.map((upgrade) => {
                const level = battleUpgradeRegistry.getLevel(upgradeStates, upgrade.id);
                const costResult = battleUpgradeRegistry.calculateCost(
                  upgrade.id,
                  level,
                  context,
                  vest
                );
                return (
                  <UpgradeCard
                    key={upgrade.id}
                    upgrade={upgrade}
                    level={level}
                    costResult={costResult}
                    onPurchase={() => onPurchase(upgrade.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Global upgrades section */}
        {selectedUnitType && globalUpgrades.length > 0 && (
          <div>
            <div
              className="text-sm font-medium tracking-wide mb-2 mt-4"
              style={{ color: UI_COLORS.accentTertiary }}
            >
              GLOBAL UPGRADES
            </div>
            <div className="space-y-2">
              {globalUpgrades.map((upgrade) => {
                const level = battleUpgradeRegistry.getLevel(upgradeStates, upgrade.id);
                const costResult = battleUpgradeRegistry.calculateCost(
                  upgrade.id,
                  level,
                  context,
                  vest
                );
                return (
                  <UpgradeCard
                    key={upgrade.id}
                    upgrade={upgrade}
                    level={level}
                    costResult={costResult}
                    onPurchase={() => onPurchase(upgrade.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Show global upgrades when no unit selected */}
        {!selectedUnitType && globalUpgrades.length > 0 && (
          <div>
            <div
              className="text-sm font-medium tracking-wide mb-2"
              style={{ color: UI_COLORS.accentTertiary }}
            >
              {sectionTitle}
            </div>
            <div className="space-y-2">
              {globalUpgrades.map((upgrade) => {
                const level = battleUpgradeRegistry.getLevel(upgradeStates, upgrade.id);
                const costResult = battleUpgradeRegistry.calculateCost(
                  upgrade.id,
                  level,
                  context,
                  vest
                );
                return (
                  <UpgradeCard
                    key={upgrade.id}
                    upgrade={upgrade}
                    level={level}
                    costResult={costResult}
                    onPurchase={() => onPurchase(upgrade.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {upgrades.length === 0 && !selectedUnitType && (
          <div className="text-sm uppercase tracking-wide" style={{ color: UI_COLORS.textMuted }}>
            Select a unit to view upgrades
          </div>
        )}
      </div>
    </div>
  );
}

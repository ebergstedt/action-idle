/**
 * Upgrade Section Component
 *
 * Reusable component for rendering a section of upgrades.
 * Extracts duplicate rendering logic from UpgradeListPanel.
 */

import {
  BattleUpgradeStates,
  BattleUpgradeDefinition,
  UpgradePrerequisiteContext,
} from '../../core/battle/upgrades/types';
import { battleUpgradeRegistry } from '../../data/battle';
import { UpgradeCard } from './UpgradeCard';

interface UpgradeSectionProps {
  /** Section title (e.g., "UNIT UPGRADES", "GLOBAL UPGRADES") */
  title: string;
  /** Color for the section title */
  titleColor: string;
  /** Upgrades to display in this section */
  upgrades: BattleUpgradeDefinition[];
  /** Current upgrade states for calculating levels */
  upgradeStates: BattleUpgradeStates;
  /** Prerequisite context for cost calculation */
  context: UpgradePrerequisiteContext;
  /** Current vest amount for cost calculation */
  vest: number;
  /** Called when an upgrade is purchased */
  onPurchase: (upgradeId: string) => void;
  /** Optional additional class names */
  className?: string;
}

/**
 * Renders a section of upgrade cards with a title.
 */
export function UpgradeSection({
  title,
  titleColor,
  upgrades,
  upgradeStates,
  context,
  vest,
  onPurchase,
  className = '',
}: UpgradeSectionProps) {
  if (upgrades.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="text-sm font-medium tracking-wide mb-2" style={{ color: titleColor }}>
        {title}
      </div>
      <div className="space-y-2">
        {upgrades.map((upgrade) => {
          const level = battleUpgradeRegistry.getLevel(upgradeStates, upgrade.id);
          const costResult = battleUpgradeRegistry.calculateCost(upgrade.id, level, context, vest);
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
  );
}

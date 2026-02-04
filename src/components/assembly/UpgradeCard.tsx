/**
 * Upgrade Card Component
 *
 * Displays a single upgrade with cost, level, and buy button.
 * AC6-inspired industrial styling.
 */

import { UI_COLORS } from '../../core/theme/colors';
import { BattleUpgradeDefinition, UpgradeCostResult } from '../../core/battle/upgrades/types';

interface UpgradeCardProps {
  /** Upgrade definition */
  upgrade: BattleUpgradeDefinition;
  /** Current upgrade level */
  level: number;
  /** Cost calculation result */
  costResult: UpgradeCostResult;
  /** Called when buy button is clicked */
  onPurchase: () => void;
}

export function UpgradeCard({ upgrade, level, costResult, onPurchase }: UpgradeCardProps) {
  const isMaxed = costResult.reason === 'max_level';
  const canAfford = costResult.canPurchase;
  const isLocked = costResult.reason === 'prerequisite_not_met';

  // Determine button state and text
  let buttonText: string;
  let buttonStyle: React.CSSProperties;

  if (isMaxed) {
    buttonText = 'MAX';
    buttonStyle = {
      backgroundColor: UI_COLORS.metalDark,
      color: UI_COLORS.textMuted,
      cursor: 'default',
    };
  } else if (isLocked) {
    buttonText = 'LOCKED';
    buttonStyle = {
      backgroundColor: UI_COLORS.metalDark,
      color: UI_COLORS.textMuted,
      cursor: 'default',
    };
  } else if (!canAfford) {
    buttonText = `${costResult.cost}g`;
    buttonStyle = {
      backgroundColor: UI_COLORS.metalDark,
      color: UI_COLORS.warningRed,
      cursor: 'not-allowed',
    };
  } else {
    buttonText = `${costResult.cost}g`;
    buttonStyle = {
      backgroundColor: UI_COLORS.accentPrimary,
      color: UI_COLORS.black,
      cursor: 'pointer',
    };
  }

  // Prerequisite tooltip
  let prereqText: string | null = null;
  if (isLocked && costResult.missingPrerequisite) {
    const prereq = costResult.missingPrerequisite;
    if (prereq.type === 'upgrade') {
      prereqText = `Requires: ${prereq.targetId} Lv.${prereq.required}`;
    } else if (prereq.type === 'wave') {
      prereqText = `Requires: Wave ${prereq.required}`;
    }
  }

  return (
    <div
      className="p-3 rounded"
      style={{
        backgroundColor: UI_COLORS.panelBase,
        border: `1px solid ${UI_COLORS.metalDark}`,
        opacity: isLocked ? 0.6 : 1,
      }}
    >
      {/* Header row */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div
            className="text-sm font-medium tracking-wide"
            style={{ color: UI_COLORS.textPrimary }}
          >
            {upgrade.name}
          </div>
          {upgrade.maxLevel > 0 && (
            <div className="text-sm" style={{ color: UI_COLORS.textSecondary }}>
              Level {level}/{upgrade.maxLevel}
            </div>
          )}
        </div>
        <button
          className="px-3 py-1 text-sm font-bold rounded transition-opacity"
          style={buttonStyle}
          onClick={canAfford && !isMaxed && !isLocked ? onPurchase : undefined}
          disabled={!canAfford || isMaxed || isLocked}
        >
          {buttonText}
        </button>
      </div>

      {/* Description */}
      <div className="text-sm" style={{ color: UI_COLORS.textMuted }}>
        {upgrade.description}
      </div>

      {/* Prerequisite warning */}
      {prereqText && (
        <div className="mt-2 text-sm" style={{ color: UI_COLORS.warningOrange }}>
          {prereqText}
        </div>
      )}
    </div>
  );
}

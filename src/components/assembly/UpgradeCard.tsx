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
    buttonText = `${costResult.cost}V`;
    buttonStyle = {
      backgroundColor: UI_COLORS.metalDark,
      color: UI_COLORS.warningRed,
      cursor: 'not-allowed',
    };
  } else {
    buttonText = `${costResult.cost}V`;
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
      className="py-2 px-3"
      style={{
        opacity: isLocked ? 0.5 : 1,
        borderLeft: `2px solid ${isLocked ? UI_COLORS.metalDark : canAfford ? UI_COLORS.accentPrimary : UI_COLORS.textMuted}`,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      {/* Header row */}
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium tracking-wide uppercase"
              style={{ color: UI_COLORS.textPrimary }}
            >
              {upgrade.name}
            </span>
            {upgrade.maxLevel > 0 && (
              <span className="text-sm font-mono" style={{ color: UI_COLORS.textMuted }}>
                {level}/{upgrade.maxLevel}
              </span>
            )}
          </div>
        </div>
        <button
          className="px-2 py-0.5 text-sm font-bold transition-opacity uppercase tracking-wide"
          style={buttonStyle}
          onClick={canAfford && !isMaxed && !isLocked ? onPurchase : undefined}
          disabled={!canAfford || isMaxed || isLocked}
        >
          {buttonText}
        </button>
      </div>

      {/* Prerequisite warning */}
      {prereqText && (
        <div className="mt-1 text-sm tracking-wide" style={{ color: UI_COLORS.warningOrange }}>
          {prereqText}
        </div>
      )}
    </div>
  );
}

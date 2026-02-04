/**
 * Upgrade Card Component
 *
 * Displays a single upgrade with cost, level, and buy button.
 * AC6-inspired industrial styling.
 */

import { UI_COLORS } from '../../core/theme/colors';
import { BattleUpgradeDefinition, UpgradeCostResult } from '../../core/battle/upgrades/types';
import { Button3D } from '../ui/Button3D';

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
  let buttonColor: string;
  let buttonTextColor: string;
  const isDisabled = !canAfford || isMaxed || isLocked;

  if (isMaxed) {
    buttonText = 'MAX';
    buttonColor = UI_COLORS.metalDark;
    buttonTextColor = UI_COLORS.textMuted;
  } else if (isLocked) {
    buttonText = 'LOCKED';
    buttonColor = UI_COLORS.metalDark;
    buttonTextColor = UI_COLORS.textMuted;
  } else if (!canAfford) {
    buttonText = `${costResult.cost}V`;
    buttonColor = UI_COLORS.metalDark;
    buttonTextColor = UI_COLORS.warningRed;
  } else {
    buttonText = `${costResult.cost}V`;
    buttonColor = UI_COLORS.accentPrimary;
    buttonTextColor = UI_COLORS.black;
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
        <Button3D
          size="xs"
          color={buttonColor}
          textColor={buttonTextColor}
          onClick={isDisabled ? undefined : onPurchase}
          disabled={isDisabled}
        >
          {buttonText}
        </Button3D>
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

import { Decimal, formatNumber } from '../../core/utils/BigNumber';
import { UpgradeDefinition } from '../../core/types/Upgrade';
import { DARK_THEME } from '../../core/theme/colors';

interface UpgradeButtonProps {
  upgrade: UpgradeDefinition;
  level: number;
  cost: Decimal;
  canAfford: boolean;
  onPurchase: () => void;
}

export function UpgradeButton({ upgrade, level, cost, canAfford, onPurchase }: UpgradeButtonProps) {
  return (
    <button
      onClick={onPurchase}
      disabled={!canAfford}
      className={`
        w-full p-4 rounded-lg text-left transition-colors duration-150
        ${
          canAfford
            ? 'bg-gray-700 hover:bg-gray-600 cursor-pointer'
            : 'bg-gray-800 opacity-60 cursor-not-allowed'
        }
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-semibold text-lg">
            {upgrade.name}
            {level > 0 && <span className="ml-2 text-sm text-gray-400">Lv. {level}</span>}
          </div>
          <div className="text-sm text-gray-400 mt-1">{upgrade.description}</div>
          <div className="text-sm mt-2" style={{ color: DARK_THEME.success }}>
            +{upgrade.baseProduction}/sec each
          </div>
        </div>
        <div className="text-right ml-4">
          <div
            className="font-bold"
            style={{ color: canAfford ? DARK_THEME.accentGold : DARK_THEME.textDisabled }}
          >
            {formatNumber(cost)}
          </div>
        </div>
      </div>
    </button>
  );
}

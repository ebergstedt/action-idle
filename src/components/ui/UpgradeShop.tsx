import { GameState } from '../../core/types/GameState';
import { UpgradeDefinition } from '../../core/types/Upgrade';
import { Decimal } from '../../core/utils/BigNumber';
import { UpgradeButton } from './UpgradeButton';

interface UpgradeShopProps {
  upgrades: readonly UpgradeDefinition[];
  state: GameState;
  getUpgradeCost: (upgradeId: string) => Decimal;
  onPurchase: (upgradeId: string) => void;
}

export function UpgradeShop({ upgrades, state, getUpgradeCost, onPurchase }: UpgradeShopProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-200">Upgrades</h2>
      <div className="space-y-2">
        {upgrades.map((upgrade) => {
          const upgradeState = state.upgrades[upgrade.id];
          const level = upgradeState?.level ?? 0;
          const cost = getUpgradeCost(upgrade.id);
          const canAfford = state.currency.gte(cost);

          return (
            <UpgradeButton
              key={upgrade.id}
              upgrade={upgrade}
              level={level}
              cost={cost}
              canAfford={canAfford}
              onPurchase={() => onPurchase(upgrade.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

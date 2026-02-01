import { useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';
import { Decimal } from '../core/utils/BigNumber';
import { StatsDisplay } from './ui/StatsDisplay';
import { UpgradeShop } from './ui/UpgradeShop';

const CLICK_VALUE = new Decimal(1);

function App() {
  const {
    state,
    upgrades,
    productionPerSecond,
    purchaseUpgrade,
    addCurrency,
    getUpgradeCost,
    saveGame,
    resetGame,
  } = useGameState();

  const handleManualClick = useCallback(() => {
    addCurrency(CLICK_VALUE);
  }, [addCurrency]);

  const handleSave = useCallback(async () => {
    await saveGame();
  }, [saveGame]);

  const handleReset = useCallback(async () => {
    if (window.confirm('Are you sure you want to reset? All progress will be lost.')) {
      await resetGame();
    }
  }, [resetGame]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">Action Idle</h1>
        </header>

        <div className="space-y-6">
          <StatsDisplay
            currency={state.currency}
            productionPerSecond={productionPerSecond}
            onManualClick={handleManualClick}
          />

          <UpgradeShop
            upgrades={upgrades}
            state={state}
            getUpgradeCost={getUpgradeCost}
            onPurchase={purchaseUpgrade}
          />

          <div className="flex gap-2 justify-center">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Save Game
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-900 hover:bg-red-800 rounded text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

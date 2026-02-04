/**
 * App Root Component
 *
 * Handles page routing between Assembly (home) and Battle scenes.
 * Godot mapping: Main scene with scene switching logic.
 */

import { useState, useCallback, useEffect } from 'react';
import { BattleView } from './battle';
import { AssemblyPage } from './assembly';
import { UI_COLORS } from '../core/theme/colors';
import { useAssembly } from '../hooks/useAssembly';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';
import { initializeBattleData, battleUpgradeRegistry } from '../data/battle';

/** Current page/scene in the app */
type AppPage = 'assembly' | 'battle';

// Initialize registries on module load
initializeBattleData();

// Create persistence adapter (singleton)
const persistenceAdapter = new LocalStorageAdapter();

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('assembly');

  // Assembly state management
  const assembly = useAssembly({
    persistenceAdapter,
    upgradeRegistry: battleUpgradeRegistry,
  });

  // Navigation handlers
  const handleLaunchBattle = useCallback(async () => {
    // Save assembly state before transitioning
    await assembly.save();
    setCurrentPage('battle');
  }, [assembly]);

  const handleReturnToAssembly = useCallback(
    async (goldEarned: number, newHighestWave: number) => {
      // Award gold from battle
      if (goldEarned > 0) {
        assembly.earnGold(goldEarned);
      }
      // Update highest wave if needed
      if (newHighestWave > assembly.highestWave) {
        assembly.setHighestWave(newHighestWave);
      }
      setCurrentPage('assembly');
    },
    [assembly]
  );

  // Auto-select first unit type if none selected
  useEffect(() => {
    if (assembly.loaded && !assembly.selectedUnitType) {
      assembly.selectUnit('hound');
    }
  }, [assembly.loaded, assembly.selectedUnitType, assembly.selectUnit]);

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{
        backgroundColor: UI_COLORS.panelDark,
        color: UI_COLORS.textPrimary,
      }}
    >
      <main className="flex-1 p-4 overflow-hidden">
        {currentPage === 'assembly' ? (
          <AssemblyPage
            gold={assembly.gold}
            upgradeStates={assembly.upgradeStates}
            selectedUnitType={assembly.selectedUnitType}
            highestWave={assembly.highestWave}
            onSelectUnit={assembly.selectUnit}
            onPurchase={assembly.purchase}
            onLaunchBattle={handleLaunchBattle}
          />
        ) : (
          <BattleView
            upgradeStates={assembly.upgradeStates}
            onReturnToAssembly={handleReturnToAssembly}
          />
        )}
      </main>
    </div>
  );
}

export default App;

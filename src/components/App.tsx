/**
 * App Root Component
 *
 * Handles page routing between Hangar sections and Battle.
 * Godot mapping: Main scene with scene switching logic.
 */

import { useState, useCallback, useEffect } from 'react';
import { BattleView } from './battle';
import { GarageContent } from './assembly';
import { HangarPage, HangarSection } from './hangar';
import { UI_COLORS } from '../core/theme/colors';
import { useAssembly } from '../hooks/useAssembly';
import { useDossier } from '../hooks/useDossier';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';
import { initializeBattleData, battleUpgradeRegistry } from '../data/battle';
import { Panel3D } from './ui/Panel3D';
import { DossierContent } from './hangar/DossierContent';

/** Current page/scene in the app */
type AppPage = 'hangar' | 'battle';

// Initialize registries on module load
initializeBattleData();

// Create persistence adapter (singleton)
const persistenceAdapter = new LocalStorageAdapter();

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('hangar');
  const [hangarSection, setHangarSection] = useState<HangarSection>('garage');

  // Assembly state management
  const assembly = useAssembly({
    persistenceAdapter,
    upgradeRegistry: battleUpgradeRegistry,
  });

  // Dossier state management (fastest clear times)
  const dossier = useDossier({ persistenceAdapter });

  // Navigation handlers
  const handleLaunchBattle = useCallback(async () => {
    // Save assembly state before transitioning
    await assembly.save();
    setCurrentPage('battle');
  }, [assembly]);

  const handleReturnToAssembly = useCallback(
    async (vestEarned: number, newHighestWave: number) => {
      // Award VEST from battle
      if (vestEarned > 0) {
        assembly.earnVest(vestEarned);
      }
      // Update highest wave if needed
      if (newHighestWave > assembly.highestWave) {
        assembly.setHighestWave(newHighestWave);
      }
      setCurrentPage('hangar');
      setHangarSection('garage');
    },
    [assembly]
  );

  // Handle section selection
  const handleSelectSection = useCallback((section: HangarSection) => {
    setHangarSection(section);
  }, []);

  // Auto-select first unit type if none selected
  const { loaded, selectedUnitType, selectUnit } = assembly;
  useEffect(() => {
    if (loaded && !selectedUnitType) {
      selectUnit('hound');
    }
  }, [loaded, selectedUnitType, selectUnit]);

  // Render content based on current hangar section
  const renderHangarContent = () => {
    switch (hangarSection) {
      case 'garage':
        return (
          <GarageContent
            selectedUnitType={assembly.selectedUnitType}
            onSelectUnit={assembly.selectUnit}
          />
        );
      case 'assembly':
        return (
          <Panel3D className="h-full flex items-center justify-center">
            <div style={{ color: UI_COLORS.textSecondary }}>ASSEMBLY - Coming Soon</div>
          </Panel3D>
        );
      case 'dossier':
        return (
          <DossierContent
            dossierData={dossier.dossierData}
            highestWave={assembly.highestWave}
            totalVestPerSecond={dossier.totalVestPerSecond}
          />
        );
      case 'virtuality':
        return (
          <Panel3D className="h-full flex items-center justify-center">
            <div style={{ color: UI_COLORS.textSecondary }}>VIRTUALITY - Coming Soon</div>
          </Panel3D>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{
        backgroundColor: UI_COLORS.panelDark,
        color: UI_COLORS.textPrimary,
      }}
    >
      <main className="flex-1 p-4 overflow-hidden">
        {currentPage === 'hangar' ? (
          <HangarPage
            currentSection={hangarSection}
            onSelectSection={handleSelectSection}
            vest={assembly.vest}
            vestPerSecond={dossier.totalVestPerSecond}
            highestWave={assembly.highestWave}
            onSortie={handleLaunchBattle}
          >
            {renderHangarContent()}
          </HangarPage>
        ) : (
          <BattleView
            vest={assembly.vest}
            onReturnToAssembly={handleReturnToAssembly}
            onRecordTime={dossier.recordTime}
            isNewRecord={dossier.isNewRecord}
          />
        )}
      </main>
    </div>
  );
}

export default App;

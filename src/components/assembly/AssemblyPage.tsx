/**
 * Assembly Page Component
 *
 * Main menu screen for purchasing unit upgrades.
 * AC6-inspired industrial mech aesthetic with 3-column layout.
 */

import { UI_COLORS } from '../../core/theme/colors';
import { BattleUpgradeStates } from '../../core/battle/upgrades/types';
import { UnitSelector } from './UnitSelector';
import { UnitStatsPanel } from './UnitStatsPanel';
import { UpgradeListPanel } from './UpgradeListPanel';

interface AssemblyPageProps {
  /** Current gold amount */
  gold: number;
  /** Current upgrade states */
  upgradeStates: BattleUpgradeStates;
  /** Currently selected unit type */
  selectedUnitType: string | null;
  /** Highest wave reached */
  highestWave: number;
  /** Called when a unit is selected */
  onSelectUnit: (unitType: string) => void;
  /** Called when an upgrade is purchased */
  onPurchase: (upgradeId: string) => boolean;
  /** Called when launch battle button is clicked */
  onLaunchBattle: () => void;
}

export function AssemblyPage({
  gold,
  upgradeStates,
  selectedUnitType,
  highestWave,
  onSelectUnit,
  onPurchase,
  onLaunchBattle,
}: AssemblyPageProps) {
  const handlePurchase = (upgradeId: string) => {
    onPurchase(upgradeId);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Main content - 3 column layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left panel - Unit selector */}
        <div
          className="w-48 flex-shrink-0 rounded-lg p-4 overflow-hidden"
          style={{
            backgroundColor: UI_COLORS.panelLight,
            border: `1px solid ${UI_COLORS.metalDark}`,
          }}
        >
          <UnitSelector selectedUnitType={selectedUnitType} onSelectUnit={onSelectUnit} />
        </div>

        {/* Center panel - Unit stats */}
        <div
          className="flex-1 rounded-lg p-4 overflow-y-auto"
          style={{
            backgroundColor: UI_COLORS.panelLight,
            border: `1px solid ${UI_COLORS.metalDark}`,
          }}
        >
          <UnitStatsPanel selectedUnitType={selectedUnitType} />
        </div>

        {/* Right panel - Upgrades */}
        <div
          className="w-80 flex-shrink-0 rounded-lg p-4 overflow-hidden"
          style={{
            backgroundColor: UI_COLORS.panelLight,
            border: `1px solid ${UI_COLORS.metalDark}`,
          }}
        >
          <UpgradeListPanel
            selectedUnitType={selectedUnitType}
            upgradeStates={upgradeStates}
            gold={gold}
            highestWave={highestWave}
            onPurchase={handlePurchase}
          />
        </div>
      </div>

      {/* Bottom bar - Gold display and Sortie button */}
      <div
        className="h-16 flex-shrink-0 rounded-lg px-6 flex items-center justify-between"
        style={{
          backgroundColor: UI_COLORS.panelLight,
          border: `1px solid ${UI_COLORS.metalDark}`,
        }}
      >
        {/* VEST display */}
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-bold tracking-widest"
            style={{ color: UI_COLORS.textSecondary }}
          >
            VEST
          </span>
          <span className="text-xl font-bold font-mono" style={{ color: UI_COLORS.accentPrimary }}>
            {gold.toLocaleString()}
          </span>
        </div>

        {/* Wave display */}
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-bold tracking-widest"
            style={{ color: UI_COLORS.textSecondary }}
          >
            HIGHEST WAVE
          </span>
          <span className="text-lg font-bold font-mono" style={{ color: UI_COLORS.textPrimary }}>
            {highestWave}
          </span>
        </div>

        {/* Sortie button */}
        <button
          className="px-8 py-3 text-lg font-bold tracking-widest rounded transition-all hover:scale-105"
          style={{
            backgroundColor: UI_COLORS.accentPrimary,
            color: UI_COLORS.black,
            boxShadow: `0 0 20px ${UI_COLORS.accentPrimary}40`,
          }}
          onClick={onLaunchBattle}
        >
          SORTIE
        </button>
      </div>
    </div>
  );
}

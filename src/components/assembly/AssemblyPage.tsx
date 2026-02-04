/**
 * Assembly Page Component
 *
 * Main menu screen for purchasing unit upgrades.
 * AC6-inspired industrial mech aesthetic with hangar background.
 */

import { UI_COLORS } from '../../core/theme/colors';
import { BattleUpgradeStates } from '../../core/battle/upgrades/types';
import { UnitSelector } from './UnitSelector';
import { UnitStatsPanel } from './UnitStatsPanel';
import { UpgradeListPanel } from './UpgradeListPanel';
import hangarBg from '../../assets/hangar.png';

interface AssemblyPageProps {
  /** Current VEST amount */
  vest: number;
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

// Semi-transparent panel style - AC6 inspired
const panelStyle = {
  backgroundColor: 'rgba(15, 18, 22, 0.92)',
  backdropFilter: 'blur(4px)',
};

export function AssemblyPage({
  vest,
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
    <div
      className="flex flex-col h-full relative"
      style={{
        backgroundImage: `url(${hangarBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }} />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-full p-4 gap-4">
        {/* Main content - 3 column layout */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left panel - Unit selector */}
          <div className="w-52 flex-shrink-0 p-4 overflow-hidden" style={panelStyle}>
            <UnitSelector selectedUnitType={selectedUnitType} onSelectUnit={onSelectUnit} />
          </div>

          {/* Center panel - Unit stats */}
          <div className="flex-1 p-4 overflow-y-auto" style={panelStyle}>
            <UnitStatsPanel selectedUnitType={selectedUnitType} />
          </div>

          {/* Right panel - Upgrades */}
          <div className="w-80 flex-shrink-0 p-4 overflow-hidden" style={panelStyle}>
            <UpgradeListPanel
              selectedUnitType={selectedUnitType}
              upgradeStates={upgradeStates}
              vest={vest}
              highestWave={highestWave}
              onPurchase={handlePurchase}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="h-14 flex-shrink-0 px-6 flex items-center justify-between"
          style={panelStyle}
        >
          {/* VEST display */}
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium tracking-widest"
              style={{ color: UI_COLORS.textSecondary }}
            >
              VEST
            </span>
            <span
              className="text-xl font-bold font-mono"
              style={{ color: UI_COLORS.accentPrimary }}
            >
              {vest.toLocaleString()}
            </span>
          </div>

          {/* Wave display */}
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium tracking-widest"
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
            className="px-8 py-2 text-lg font-bold tracking-widest transition-all hover:brightness-110"
            style={{
              backgroundColor: UI_COLORS.accentPrimary,
              color: UI_COLORS.black,
            }}
            onClick={onLaunchBattle}
          >
            SORTIE
          </button>
        </div>
      </div>
    </div>
  );
}

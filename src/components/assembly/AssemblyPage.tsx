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
import { Button3D } from '../ui/Button3D';
import { Panel3D } from '../ui/Panel3D';
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
          <Panel3D className="w-52 flex-shrink-0 overflow-hidden">
            <UnitSelector selectedUnitType={selectedUnitType} onSelectUnit={onSelectUnit} />
          </Panel3D>

          {/* Center panel - Unit stats */}
          <Panel3D className="flex-1 overflow-y-auto">
            <UnitStatsPanel selectedUnitType={selectedUnitType} />
          </Panel3D>

          {/* Right panel - Upgrades */}
          <Panel3D className="w-80 flex-shrink-0 overflow-hidden">
            <UpgradeListPanel
              selectedUnitType={selectedUnitType}
              upgradeStates={upgradeStates}
              vest={vest}
              highestWave={highestWave}
              onPurchase={handlePurchase}
            />
          </Panel3D>
        </div>

        {/* Bottom bar */}
        <Panel3D
          className="h-14 flex-shrink-0 flex items-center justify-between px-4"
          padding="none"
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
          <Button3D size="lg" onClick={onLaunchBattle}>
            SORTIE
          </Button3D>
        </Panel3D>
      </div>
    </div>
  );
}

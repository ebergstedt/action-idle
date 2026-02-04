/**
 * Garage Content Component
 *
 * Content for the Garage section - unit selection and stats.
 * Used within HangarPage.
 */

import { UnitSelector } from './UnitSelector';
import { UnitStatsPanel } from './UnitStatsPanel';
import { Panel3D } from '../ui/Panel3D';
import { PanelTransition } from '../ui/PanelTransition';

interface GarageContentProps {
  /** Currently selected unit type */
  selectedUnitType: string | null;
  /** Called when a unit is selected */
  onSelectUnit: (unitType: string) => void;
}

export function GarageContent({ selectedUnitType, onSelectUnit }: GarageContentProps) {
  return (
    <div className="flex h-full gap-4">
      {/* Left panel - Unit selector */}
      <Panel3D className="w-52 flex-shrink-0">
        <UnitSelector selectedUnitType={selectedUnitType} onSelectUnit={onSelectUnit} />
      </Panel3D>

      {/* Right panel - Unit stats (narrower) */}
      <Panel3D className="w-80 flex-shrink-0">
        <PanelTransition transitionKey={selectedUnitType || 'none'}>
          <UnitStatsPanel selectedUnitType={selectedUnitType} />
        </PanelTransition>
      </Panel3D>
    </div>
  );
}

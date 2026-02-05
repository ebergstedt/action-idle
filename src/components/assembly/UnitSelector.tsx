/**
 * Unit Selector Component
 *
 * Left panel showing list of available units.
 * AC6-inspired styling with left border highlight on selection.
 */

import { UI_COLORS, hexToRgba } from '../../core/theme/colors';
import { unitRegistry } from '../../data/battle';

interface UnitSelectorProps {
  /** Currently selected unit type */
  selectedUnitType: string | null;
  /** Called when a unit is selected */
  onSelectUnit: (unitType: string) => void;
}

export function UnitSelector({ selectedUnitType, onSelectUnit }: UnitSelectorProps) {
  // Get all units from registry
  const units = unitRegistry.getAll();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="text-sm font-medium tracking-widest mb-4 pb-2"
        style={{
          color: UI_COLORS.accentPrimary,
          borderBottom: `1px solid ${UI_COLORS.metalDark}`,
        }}
      >
        GARAGE
      </div>

      {/* Unit list */}
      <div className="flex-1 overflow-y-auto">
        {units.map((unit) => {
          const isSelected = selectedUnitType === unit.id;
          return (
            <button
              key={unit.id}
              className="w-full text-left px-3 py-2 transition-colors"
              style={{
                backgroundColor: isSelected
                  ? hexToRgba(UI_COLORS.accentSecondary, 0.1)
                  : 'transparent',
                color: isSelected ? UI_COLORS.accentPrimary : UI_COLORS.textPrimary,
                borderLeft: isSelected
                  ? `2px solid ${UI_COLORS.accentPrimary}`
                  : '2px solid transparent',
              }}
              onClick={() => onSelectUnit(unit.id)}
            >
              <div className="font-medium tracking-wide uppercase">{unit.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

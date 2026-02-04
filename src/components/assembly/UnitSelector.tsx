/**
 * Unit Selector Component
 *
 * Left panel showing list of available units.
 * AC6-inspired industrial styling.
 */

import { UI_COLORS } from '../../core/theme/colors';
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
        className="text-sm font-bold tracking-widest mb-4 pb-2"
        style={{
          color: UI_COLORS.textSecondary,
          borderBottom: `1px solid ${UI_COLORS.metalDark}`,
        }}
      >
        UNIT SELECT
      </div>

      {/* Unit list */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {units.map((unit) => {
          const isSelected = selectedUnitType === unit.id;
          return (
            <button
              key={unit.id}
              className="w-full text-left px-3 py-2 rounded transition-colors"
              style={{
                backgroundColor: isSelected ? UI_COLORS.panelHighlight : 'transparent',
                color: isSelected ? UI_COLORS.accentPrimary : UI_COLORS.textPrimary,
                border: isSelected
                  ? `1px solid ${UI_COLORS.accentPrimary}`
                  : '1px solid transparent',
              }}
              onClick={() => onSelectUnit(unit.id)}
            >
              <div className="font-medium tracking-wide">{unit.name}</div>
              <div className="text-sm" style={{ color: UI_COLORS.textMuted }}>
                {unit.category.charAt(0).toUpperCase() + unit.category.slice(1)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Battle Selection Hook
 *
 * Manages unit selection state.
 * Single responsibility: tracking which units are selected.
 */

import { useCallback, useState } from 'react';

export interface UseBattleSelectionReturn {
  /** Currently selected unit IDs */
  selectedUnitIds: string[];
  /** Select a single unit (or deselect all with null) */
  selectUnit: (unitId: string | null) => void;
  /** Select multiple units */
  selectUnits: (unitIds: string[]) => void;
  /** Clear all selections */
  clearSelection: () => void;
}

/**
 * Manages unit selection state.
 */
export function useBattleSelection(): UseBattleSelectionReturn {
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

  const selectUnit = useCallback((unitId: string | null) => {
    setSelectedUnitIds(unitId ? [unitId] : []);
  }, []);

  const selectUnits = useCallback((unitIds: string[]) => {
    setSelectedUnitIds(unitIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedUnitIds([]);
  }, []);

  return {
    selectedUnitIds,
    selectUnit,
    selectUnits,
    clearSelection,
  };
}

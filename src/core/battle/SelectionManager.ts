/**
 * Selection Manager
 *
 * Manages unit selection state and multi-select logic.
 * Pure game logic - no React/browser dependencies.
 *
 * Godot equivalent: A singleton or autoload that tracks selected units.
 */

import { ISelectable } from './ISelectable';

export interface SelectionState {
  selectedIds: string[];
}

/**
 * Creates initial selection state.
 */
export function createSelectionState(): SelectionState {
  return { selectedIds: [] };
}

/**
 * Selects a single unit, clearing previous selection.
 */
export function selectUnit(_state: SelectionState, unitId: string | null): SelectionState {
  return { selectedIds: unitId ? [unitId] : [] };
}

/**
 * Selects multiple units.
 */
export function selectUnits(_state: SelectionState, unitIds: string[]): SelectionState {
  return { selectedIds: [...unitIds] };
}

/**
 * Adds a unit to the current selection.
 */
export function addToSelection(state: SelectionState, unitId: string): SelectionState {
  if (state.selectedIds.includes(unitId)) return state;
  return { selectedIds: [...state.selectedIds, unitId] };
}

/**
 * Removes a unit from the current selection.
 */
export function removeFromSelection(state: SelectionState, unitId: string): SelectionState {
  return { selectedIds: state.selectedIds.filter((id) => id !== unitId) };
}

/**
 * Toggles a unit's selection state.
 */
export function toggleSelection(state: SelectionState, unitId: string): SelectionState {
  if (state.selectedIds.includes(unitId)) {
    return removeFromSelection(state, unitId);
  }
  return addToSelection(state, unitId);
}

/**
 * Clears all selection.
 */
export function clearSelection(): SelectionState {
  return { selectedIds: [] };
}

/**
 * Checks if a unit is selected.
 */
export function isSelected(state: SelectionState, unitId: string): boolean {
  return state.selectedIds.includes(unitId);
}

/**
 * Gets count of selected units.
 */
export function getSelectionCount(state: SelectionState): number {
  return state.selectedIds.length;
}

/**
 * Selects all units matching a predicate.
 */
export function selectAllMatching(
  units: ISelectable[],
  predicate: (unit: ISelectable) => boolean
): SelectionState {
  const matching = units.filter(predicate).map((u) => u.id);
  return { selectedIds: matching };
}

/**
 * Selects all units of the same type and team as the given unit.
 */
export function selectAllOfType(units: ISelectable[], referenceUnit: ISelectable): SelectionState {
  return selectAllMatching(
    units,
    (u) => u.type === referenceUnit.type && u.team === referenceUnit.team
  );
}

/**
 * Selects all units in the same squad as the given unit.
 */
export function selectSquad(units: ISelectable[], referenceUnit: ISelectable): SelectionState {
  return selectAllMatching(units, (u) => u.squadId === referenceUnit.squadId);
}

/**
 * Expands a selection to include all units from any squads that have at least one unit selected.
 * This ensures squad-based selection - you can't select individual units from a squad.
 *
 * @param selectedIds - Currently selected unit IDs (may be partial squad selection)
 * @param units - All available units
 * @returns Selection state with all squad members included
 */
export function expandSelectionToSquads(
  selectedIds: string[],
  units: ISelectable[]
): SelectionState {
  if (selectedIds.length === 0) return { selectedIds: [] };

  // Find all squad IDs that have at least one selected unit
  const affectedSquadIds = new Set<string>();
  for (const id of selectedIds) {
    const unit = units.find((u) => u.id === id);
    if (unit) {
      affectedSquadIds.add(unit.squadId);
    }
  }

  // Select all units from affected squads
  const expandedIds = units.filter((u) => affectedSquadIds.has(u.squadId)).map((u) => u.id);

  return { selectedIds: expandedIds };
}

/**
 * Filters selection to only include units that still exist.
 */
export function pruneSelection(
  state: SelectionState,
  existingUnitIds: Set<string>
): SelectionState {
  const pruned = state.selectedIds.filter((id) => existingUnitIds.has(id));
  if (pruned.length === state.selectedIds.length) return state;
  return { selectedIds: pruned };
}

/**
 * Check if all selected units are the same type and team (uniform selection).
 * Returns the representative unit if uniform, null otherwise.
 *
 * @param selectedIds - Currently selected unit IDs
 * @param units - All available units
 * @returns The first selected unit if all selected are same type/team, null otherwise
 */
export function getUniformSelectionUnit<T extends ISelectable>(
  selectedIds: string[],
  units: T[]
): T | null {
  if (selectedIds.length === 0) return null;

  // Get all selected units
  const selectedUnits = units.filter((u) => selectedIds.includes(u.id));
  if (selectedUnits.length === 0) return null;

  // Check if all selected units are same type and team
  const firstUnit = selectedUnits[0];
  const isUniform = selectedUnits.every(
    (u) => u.type === firstUnit.type && u.team === firstUnit.team
  );

  return isUniform ? firstUnit : null;
}

/**
 * Filters selected unit IDs to only include units of a specific team.
 * Useful for drag operations that should only affect player units.
 *
 * @param selectedIds - Currently selected unit IDs
 * @param units - All available units
 * @param team - Team to filter by ('player' or 'enemy')
 * @returns Array of unit IDs that belong to the specified team
 */
export function filterSelectionByTeam<T extends ISelectable>(
  selectedIds: string[],
  units: T[],
  team: 'player' | 'enemy'
): string[] {
  return selectedIds.filter((id) => {
    const unit = units.find((u) => u.id === id);
    return unit?.team === team;
  });
}

/**
 * Checks if a unit can be repositioned/moved by the player.
 * Some unit types (like castles) are stationary and cannot be moved.
 *
 * @param unit - The unit to check
 * @returns True if the unit can be moved, false otherwise
 */
export function isUnitMovable(unit: ISelectable): boolean {
  // Castles are stationary structures that cannot be repositioned
  if (unit.type === 'castle') return false;
  return true;
}

/**
 * Filters unit IDs to only include units that can be moved.
 * Excludes stationary units like castles.
 *
 * @param unitIds - Unit IDs to filter
 * @param units - All available units
 * @returns Array of unit IDs that can be moved
 */
export function filterMovableUnits<T extends ISelectable>(unitIds: string[], units: T[]): string[] {
  return unitIds.filter((id) => {
    const unit = units.find((u) => u.id === id);
    return unit && isUnitMovable(unit);
  });
}

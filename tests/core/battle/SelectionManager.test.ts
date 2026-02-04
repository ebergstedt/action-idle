import { describe, it, expect } from 'vitest';
import {
  createSelectionState,
  selectUnit,
  selectUnits,
  addToSelection,
  removeFromSelection,
  toggleSelection,
  clearSelection,
  isSelected,
  getSelectionCount,
  selectAllMatching,
  selectAllOfType,
  selectSquad,
  expandSelectionToSquads,
  pruneSelection,
  getUniformSelectionUnit,
  filterSelectionByTeam,
  isUnitMovable,
  filterMovableUnits,
} from '../../../src/core/battle/SelectionManager';
import type { ISelectable } from '../../../src/core/battle/ISelectable';

// Helper to create mock units
function createMockUnit(overrides: Partial<ISelectable> = {}): ISelectable {
  return {
    id: 'unit_1',
    type: 'hound',
    team: 'player',
    squadId: 'squad_1',
    position: { x: 0, y: 0 },
    size: 10,
    ...overrides,
  };
}

describe('SelectionManager', () => {
  describe('createSelectionState', () => {
    it('creates empty selection state', () => {
      const state = createSelectionState();
      expect(state.selectedIds).toEqual([]);
    });
  });

  describe('selectUnit', () => {
    it('selects a single unit', () => {
      const state = createSelectionState();
      const newState = selectUnit(state, 'unit_1');
      expect(newState.selectedIds).toEqual(['unit_1']);
    });

    it('clears previous selection', () => {
      const state = { selectedIds: ['unit_1', 'unit_2'] };
      const newState = selectUnit(state, 'unit_3');
      expect(newState.selectedIds).toEqual(['unit_3']);
    });

    it('clears selection when null is passed', () => {
      const state = { selectedIds: ['unit_1'] };
      const newState = selectUnit(state, null);
      expect(newState.selectedIds).toEqual([]);
    });
  });

  describe('selectUnits', () => {
    it('selects multiple units', () => {
      const state = createSelectionState();
      const newState = selectUnits(state, ['unit_1', 'unit_2', 'unit_3']);
      expect(newState.selectedIds).toEqual(['unit_1', 'unit_2', 'unit_3']);
    });

    it('replaces previous selection', () => {
      const state = { selectedIds: ['unit_a'] };
      const newState = selectUnits(state, ['unit_1', 'unit_2']);
      expect(newState.selectedIds).toEqual(['unit_1', 'unit_2']);
    });
  });

  describe('addToSelection', () => {
    it('adds a unit to selection', () => {
      const state = { selectedIds: ['unit_1'] };
      const newState = addToSelection(state, 'unit_2');
      expect(newState.selectedIds).toEqual(['unit_1', 'unit_2']);
    });

    it('does not add duplicates', () => {
      const state = { selectedIds: ['unit_1'] };
      const newState = addToSelection(state, 'unit_1');
      expect(newState.selectedIds).toEqual(['unit_1']);
      expect(newState).toBe(state); // Same reference
    });
  });

  describe('removeFromSelection', () => {
    it('removes a unit from selection', () => {
      const state = { selectedIds: ['unit_1', 'unit_2'] };
      const newState = removeFromSelection(state, 'unit_1');
      expect(newState.selectedIds).toEqual(['unit_2']);
    });

    it('handles removing non-existent unit', () => {
      const state = { selectedIds: ['unit_1'] };
      const newState = removeFromSelection(state, 'unit_999');
      expect(newState.selectedIds).toEqual(['unit_1']);
    });
  });

  describe('toggleSelection', () => {
    it('adds unit if not selected', () => {
      const state = { selectedIds: ['unit_1'] };
      const newState = toggleSelection(state, 'unit_2');
      expect(newState.selectedIds).toContain('unit_2');
    });

    it('removes unit if already selected', () => {
      const state = { selectedIds: ['unit_1', 'unit_2'] };
      const newState = toggleSelection(state, 'unit_1');
      expect(newState.selectedIds).not.toContain('unit_1');
      expect(newState.selectedIds).toContain('unit_2');
    });
  });

  describe('clearSelection', () => {
    it('returns empty selection', () => {
      const state = clearSelection();
      expect(state.selectedIds).toEqual([]);
    });
  });

  describe('isSelected', () => {
    it('returns true for selected unit', () => {
      const state = { selectedIds: ['unit_1', 'unit_2'] };
      expect(isSelected(state, 'unit_1')).toBe(true);
    });

    it('returns false for non-selected unit', () => {
      const state = { selectedIds: ['unit_1'] };
      expect(isSelected(state, 'unit_2')).toBe(false);
    });
  });

  describe('getSelectionCount', () => {
    it('returns number of selected units', () => {
      const state = { selectedIds: ['unit_1', 'unit_2', 'unit_3'] };
      expect(getSelectionCount(state)).toBe(3);
    });

    it('returns 0 for empty selection', () => {
      const state = createSelectionState();
      expect(getSelectionCount(state)).toBe(0);
    });
  });

  describe('selectAllMatching', () => {
    it('selects units matching predicate', () => {
      const units = [
        createMockUnit({ id: 'unit_1', team: 'player' }),
        createMockUnit({ id: 'unit_2', team: 'enemy' }),
        createMockUnit({ id: 'unit_3', team: 'player' }),
      ];
      const state = selectAllMatching(units, (u) => u.team === 'player');
      expect(state.selectedIds).toEqual(['unit_1', 'unit_3']);
    });
  });

  describe('selectAllOfType', () => {
    it('selects all units of same type and team', () => {
      const units = [
        createMockUnit({ id: 'unit_1', type: 'hound', team: 'player' }),
        createMockUnit({ id: 'unit_2', type: 'fang', team: 'player' }),
        createMockUnit({ id: 'unit_3', type: 'hound', team: 'player' }),
        createMockUnit({ id: 'unit_4', type: 'hound', team: 'enemy' }),
      ];
      const reference = units[0];
      const state = selectAllOfType(units, reference);
      expect(state.selectedIds).toEqual(['unit_1', 'unit_3']);
    });
  });

  describe('selectSquad', () => {
    it('selects all units in the same squad', () => {
      const units = [
        createMockUnit({ id: 'unit_1', squadId: 'squad_a' }),
        createMockUnit({ id: 'unit_2', squadId: 'squad_b' }),
        createMockUnit({ id: 'unit_3', squadId: 'squad_a' }),
      ];
      const reference = units[0];
      const state = selectSquad(units, reference);
      expect(state.selectedIds).toEqual(['unit_1', 'unit_3']);
    });
  });

  describe('expandSelectionToSquads', () => {
    it('expands selection to include all squad members', () => {
      const units = [
        createMockUnit({ id: 'unit_1', squadId: 'squad_a' }),
        createMockUnit({ id: 'unit_2', squadId: 'squad_a' }),
        createMockUnit({ id: 'unit_3', squadId: 'squad_b' }),
      ];
      // Only unit_1 selected, but should expand to include unit_2 (same squad)
      const state = expandSelectionToSquads(['unit_1'], units);
      expect(state.selectedIds).toContain('unit_1');
      expect(state.selectedIds).toContain('unit_2');
      expect(state.selectedIds).not.toContain('unit_3');
    });

    it('returns empty selection for empty input', () => {
      const units = [createMockUnit({ id: 'unit_1' })];
      const state = expandSelectionToSquads([], units);
      expect(state.selectedIds).toEqual([]);
    });
  });

  describe('pruneSelection', () => {
    it('removes non-existent units from selection', () => {
      const state = { selectedIds: ['unit_1', 'unit_2', 'unit_3'] };
      const existingIds = new Set(['unit_1', 'unit_3']);
      const newState = pruneSelection(state, existingIds);
      expect(newState.selectedIds).toEqual(['unit_1', 'unit_3']);
    });

    it('returns same state if no pruning needed', () => {
      const state = { selectedIds: ['unit_1', 'unit_2'] };
      const existingIds = new Set(['unit_1', 'unit_2', 'unit_3']);
      const newState = pruneSelection(state, existingIds);
      expect(newState).toBe(state);
    });
  });

  describe('getUniformSelectionUnit', () => {
    it('returns unit when all selected are same type and team', () => {
      const units = [
        createMockUnit({ id: 'unit_1', type: 'hound', team: 'player' }),
        createMockUnit({ id: 'unit_2', type: 'hound', team: 'player' }),
      ];
      const result = getUniformSelectionUnit(['unit_1', 'unit_2'], units);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('hound');
    });

    it('returns null when types differ', () => {
      const units = [
        createMockUnit({ id: 'unit_1', type: 'hound', team: 'player' }),
        createMockUnit({ id: 'unit_2', type: 'fang', team: 'player' }),
      ];
      const result = getUniformSelectionUnit(['unit_1', 'unit_2'], units);
      expect(result).toBeNull();
    });

    it('returns null when teams differ', () => {
      const units = [
        createMockUnit({ id: 'unit_1', type: 'hound', team: 'player' }),
        createMockUnit({ id: 'unit_2', type: 'hound', team: 'enemy' }),
      ];
      const result = getUniformSelectionUnit(['unit_1', 'unit_2'], units);
      expect(result).toBeNull();
    });

    it('returns null for empty selection', () => {
      const units = [createMockUnit({ id: 'unit_1' })];
      const result = getUniformSelectionUnit([], units);
      expect(result).toBeNull();
    });
  });

  describe('filterSelectionByTeam', () => {
    it('filters to only player units', () => {
      const units = [
        createMockUnit({ id: 'unit_1', team: 'player' }),
        createMockUnit({ id: 'unit_2', team: 'enemy' }),
        createMockUnit({ id: 'unit_3', team: 'player' }),
      ];
      const result = filterSelectionByTeam(['unit_1', 'unit_2', 'unit_3'], units, 'player');
      expect(result).toEqual(['unit_1', 'unit_3']);
    });

    it('filters to only enemy units', () => {
      const units = [
        createMockUnit({ id: 'unit_1', team: 'player' }),
        createMockUnit({ id: 'unit_2', team: 'enemy' }),
      ];
      const result = filterSelectionByTeam(['unit_1', 'unit_2'], units, 'enemy');
      expect(result).toEqual(['unit_2']);
    });
  });

  describe('isUnitMovable', () => {
    it('returns true for regular units', () => {
      const unit = createMockUnit({ type: 'hound' });
      expect(isUnitMovable(unit)).toBe(true);
    });

    it('returns false for castles', () => {
      const unit = createMockUnit({ type: 'castle' });
      expect(isUnitMovable(unit)).toBe(false);
    });
  });

  describe('filterMovableUnits', () => {
    it('filters out non-movable units like castles', () => {
      const units = [
        createMockUnit({ id: 'unit_1', type: 'hound' }),
        createMockUnit({ id: 'unit_2', type: 'castle' }),
        createMockUnit({ id: 'unit_3', type: 'fang' }),
      ];
      const result = filterMovableUnits(['unit_1', 'unit_2', 'unit_3'], units);
      expect(result).toEqual(['unit_1', 'unit_3']);
    });

    it('handles empty input', () => {
      const units = [createMockUnit({ id: 'unit_1' })];
      const result = filterMovableUnits([], units);
      expect(result).toEqual([]);
    });
  });
});

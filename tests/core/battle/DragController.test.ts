/**
 * DragController Tests
 *
 * Tests for squad drag validation and overlap detection.
 */

import { describe, it, expect } from 'vitest';
import { Vector2 } from '../../../src/core/physics/Vector2';
import {
  validateSquadMoves,
  collectSquadGridBounds,
  isSquadMoveValid,
  getSquadGridBounds,
} from '../../../src/core/battle/DragController';
import type { ISelectable } from '../../../src/core/battle/ISelectable';
import type { GridFootprint, GridBounds } from '../../../src/core/battle/grid/GridTypes';

// Helper to create a test unit
function createUnit(
  id: string,
  squadId: string,
  position: Vector2,
  footprint: GridFootprint = { cols: 2, rows: 2 }
): ISelectable {
  return {
    id,
    type: 'test',
    position,
    size: 10,
    team: 'player',
    squadId,
    gridFootprint: footprint,
  };
}

describe('DragController', () => {
  describe('getSquadGridBounds', () => {
    it('calculates correct grid bounds from centroid and footprint', () => {
      const centroid = new Vector2(100, 100);
      const footprint: GridFootprint = { cols: 2, rows: 2 };
      const cellSize = 10;

      const bounds = getSquadGridBounds(centroid, footprint, cellSize);

      // Centroid at (100, 100) with 2x2 footprint and cellSize 10
      // Grid position: floor(100/10 - 1 + 0.5) = 9
      expect(bounds.col).toBe(9);
      expect(bounds.row).toBe(9);
      expect(bounds.cols).toBe(2);
      expect(bounds.rows).toBe(2);
    });
  });

  describe('collectSquadGridBounds', () => {
    it('collects bounds for all player squads', () => {
      const units: ISelectable[] = [
        createUnit('u1', 'squad1', new Vector2(100, 100)),
        createUnit('u2', 'squad1', new Vector2(110, 100)),
        createUnit('u3', 'squad2', new Vector2(200, 200)),
        createUnit('u4', 'squad2', new Vector2(210, 200)),
      ];

      const bounds = collectSquadGridBounds(units, 'player', 10);

      expect(bounds.size).toBe(2);
      expect(bounds.has('squad1')).toBe(true);
      expect(bounds.has('squad2')).toBe(true);
    });

    it('excludes specified squad IDs', () => {
      const units: ISelectable[] = [
        createUnit('u1', 'squad1', new Vector2(100, 100)),
        createUnit('u2', 'squad2', new Vector2(200, 200)),
      ];

      const bounds = collectSquadGridBounds(units, 'player', 10, new Set(['squad1']));

      expect(bounds.size).toBe(1);
      expect(bounds.has('squad1')).toBe(false);
      expect(bounds.has('squad2')).toBe(true);
    });

    it('filters by team', () => {
      const units: ISelectable[] = [
        createUnit('u1', 'squad1', new Vector2(100, 100)),
        { ...createUnit('u2', 'squad2', new Vector2(200, 200)), team: 'enemy' as const },
      ];

      const playerBounds = collectSquadGridBounds(units, 'player', 10);
      const enemyBounds = collectSquadGridBounds(units, 'enemy', 10);

      expect(playerBounds.size).toBe(1);
      expect(enemyBounds.size).toBe(1);
    });
  });

  describe('isSquadMoveValid', () => {
    const cellSize = 10;

    it('returns true for non-overlapping position', () => {
      const proposedCentroid = new Vector2(100, 100);
      const footprint: GridFootprint = { cols: 2, rows: 2 };
      const otherBounds: GridBounds[] = [
        { col: 15, row: 15, cols: 2, rows: 2 }, // Far away
      ];

      const isValid = isSquadMoveValid(proposedCentroid, footprint, cellSize, otherBounds);

      expect(isValid).toBe(true);
    });

    it('returns false for overlapping position', () => {
      const proposedCentroid = new Vector2(100, 100);
      const footprint: GridFootprint = { cols: 2, rows: 2 };
      const otherBounds: GridBounds[] = [
        { col: 9, row: 9, cols: 2, rows: 2 }, // Same position
      ];

      const isValid = isSquadMoveValid(proposedCentroid, footprint, cellSize, otherBounds);

      expect(isValid).toBe(false);
    });

    it('returns false for adjacent overlapping position', () => {
      // Squad A at columns 9-10, Squad B at columns 10-11 (overlap on column 10)
      const proposedCentroid = new Vector2(100, 100); // Grid position 9
      const footprint: GridFootprint = { cols: 2, rows: 2 };
      const otherBounds: GridBounds[] = [
        { col: 10, row: 9, cols: 2, rows: 2 }, // Overlaps by 1 column
      ];

      const isValid = isSquadMoveValid(proposedCentroid, footprint, cellSize, otherBounds);

      expect(isValid).toBe(false);
    });

    it('returns true for truly adjacent (non-overlapping) position', () => {
      // Squad A at columns 9-10, Squad B at columns 11-12 (no overlap)
      const proposedCentroid = new Vector2(100, 100); // Grid position 9
      const footprint: GridFootprint = { cols: 2, rows: 2 };
      const otherBounds: GridBounds[] = [
        { col: 11, row: 9, cols: 2, rows: 2 }, // Adjacent but not overlapping
      ];

      const isValid = isSquadMoveValid(proposedCentroid, footprint, cellSize, otherBounds);

      expect(isValid).toBe(true);
    });
  });

  describe('validateSquadMoves', () => {
    const cellSize = 10;
    // Player deployment zone is rows 32-61 (y pixels ~320-610)
    // and columns 6-65 (x pixels ~60-650)
    // Using y=400 puts us in row 40, well within deployment zone

    it('allows valid moves that do not overlap', () => {
      // Positions within deployment zone (y around 400-500, x around 100-300)
      const units: ISelectable[] = [
        createUnit('u1', 'squad1', new Vector2(100, 400)),
        createUnit('u2', 'squad1', new Vector2(110, 400)),
        createUnit('u3', 'squad2', new Vector2(300, 400)),
        createUnit('u4', 'squad2', new Vector2(310, 400)),
      ];

      // Move squad1 to a different position, still far from squad2
      const moves = [
        { unitId: 'u1', position: new Vector2(150, 450) },
        { unitId: 'u2', position: new Vector2(160, 450) },
      ];

      const draggedSquadIds = new Set(['squad1']);
      const initialPositions = new Map([
        ['u1', new Vector2(100, 400)],
        ['u2', new Vector2(110, 400)],
      ]);

      const result = validateSquadMoves(moves, units, cellSize, draggedSquadIds, initialPositions);

      // Move should be allowed - squad1 at ~(155, 450) is far from squad2 at ~(305, 400)
      expect(result[0].position.x).toBe(150);
      expect(result[0].position.y).toBe(450);
    });

    it('stays at current position for stability when move would overlap', () => {
      // Both squads within deployment zone
      const units: ISelectable[] = [
        createUnit('u1', 'squad1', new Vector2(100, 400)),
        createUnit('u2', 'squad1', new Vector2(110, 400)),
        createUnit('u3', 'squad2', new Vector2(200, 400)),
        createUnit('u4', 'squad2', new Vector2(210, 400)),
      ];

      // Try to move squad1 directly onto squad2
      const moves = [
        { unitId: 'u1', position: new Vector2(200, 400) },
        { unitId: 'u2', position: new Vector2(210, 400) },
      ];

      const draggedSquadIds = new Set(['squad1']);
      const initialPositions = new Map([
        ['u1', new Vector2(100, 400)],
        ['u2', new Vector2(110, 400)],
      ]);

      const result = validateSquadMoves(moves, units, cellSize, draggedSquadIds, initialPositions);

      // Stability: when proposed position is invalid but current is valid,
      // squad stays at current position instead of jumping to a new "closest" spot
      expect(result[0].position.x).toBe(100);
      expect(result[0].position.y).toBe(400);
      expect(result[1].position.x).toBe(110);
      expect(result[1].position.y).toBe(400);
    });

    it('skips validation when cellSize is 0', () => {
      const units: ISelectable[] = [
        createUnit('u1', 'squad1', new Vector2(100, 100)),
        createUnit('u2', 'squad2', new Vector2(100, 100)), // Same position - would overlap
      ];

      const moves = [{ unitId: 'u1', position: new Vector2(100, 100) }];
      const draggedSquadIds = new Set(['squad1']);

      const result = validateSquadMoves(moves, units, 0, draggedSquadIds);

      // With cellSize 0, validation is skipped, move is allowed
      expect(result[0].position.x).toBe(100);
    });
  });
});

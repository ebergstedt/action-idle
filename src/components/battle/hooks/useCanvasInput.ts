/**
 * Canvas Input Hook
 *
 * Handles mouse events for the battle canvas including:
 * - Unit selection (click, double-click)
 * - Unit dragging (single and multi-unit)
 * - Box selection (marquee select)
 */

import { useState, useRef, useCallback, useEffect, RefObject } from 'react';
import type { ISelectable } from '../../../core/battle';
import { ZONE_HEIGHT_PERCENT } from '../../../core/battle';
import { DRAG_BOUNDS_MARGIN } from '../../../core/battle/BattleConfig';
import { Vector2 } from '../../../core/physics/Vector2';
import {
  startDrag,
  calculateDragPositions,
  calculateSingleDragPosition,
  isMultiDrag,
  DragSession,
  DragBounds,
  snapSquadToGrid,
} from '../../../core/battle/DragController';
import { findUnitAtPosition } from '../../../core/battle/InputAdapter';
import {
  selectAllOfType,
  selectSquad,
  filterSelectionByTeam,
  expandSelectionToSquads,
} from '../../../core/battle/SelectionManager';
import {
  startBoxSelect,
  updateBoxSelect,
  getSelectionBox,
  getUnitsInBox,
  isBoxSelectActive,
  BoxSelectSession,
} from '../../../core/battle/BoxSelectController';

/** Zoom state for coordinate transformation */
export interface ZoomState {
  zoom: number;
  panX: number;
  panY: number;
}

/** Canvas configuration for input handling */
export interface CanvasConfig {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
  zoomState?: ZoomState;
  /** Grid cell size in pixels (0 or undefined to disable grid snapping) */
  cellSize?: number;
}

/** Current selection state - generic to support different unit types */
export interface SelectionState<T extends ISelectable = ISelectable> {
  units: T[];
  selectedUnitIds: string[];
}

/** Callbacks for canvas input events */
export interface CanvasInputCallbacks {
  onUnitMove?: (unitId: string, position: Vector2) => void;
  onUnitsMove?: (moves: Array<{ unitId: string; position: Vector2 }>) => void;
  onSelectUnit?: (unitId: string | null) => void;
  onSelectUnits?: (unitIds: string[]) => void;
}

export interface UseCanvasInputProps<T extends ISelectable = ISelectable>
  extends CanvasConfig, SelectionState<T>, CanvasInputCallbacks {}

export interface UseCanvasInputResult {
  isDragging: boolean;
  boxSelectSession: BoxSelectSession | null;
  draggedUnitIds: string[];
  handlers: {
    onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseUp: () => void;
    onDoubleClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  };
}

/**
 * Hook for handling canvas input (selection, drag, box-select).
 */
export function useCanvasInput<T extends ISelectable = ISelectable>({
  canvasRef,
  units,
  selectedUnitIds,
  width,
  height,
  zoomState,
  cellSize = 0,
  onUnitMove,
  onUnitsMove,
  onSelectUnit,
  onSelectUnits,
}: UseCanvasInputProps<T>): UseCanvasInputResult {
  // ─────────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);
  const [boxSelectSession, setBoxSelectSession] = useState<BoxSelectSession | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────────────────────

  /** Calculate bounds for allied deployment zone */
  const getDragBounds = useCallback((): DragBounds => {
    const zoneHeight = height * ZONE_HEIGHT_PERCENT;
    return {
      minX: DRAG_BOUNDS_MARGIN,
      maxX: width - DRAG_BOUNDS_MARGIN,
      minY: height - zoneHeight + DRAG_BOUNDS_MARGIN,
      maxY: height - DRAG_BOUNDS_MARGIN,
    };
  }, [width, height]);

  /** Get mouse position relative to canvas, accounting for zoom/pan */
  const getMousePos = useCallback(
    (e: MouseEvent | React.MouseEvent): Vector2 => {
      const canvas = canvasRef.current;
      if (!canvas) return new Vector2(0, 0);
      const rect = canvas.getBoundingClientRect();
      // Get screen-space position
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Transform to world-space if zoomed
      if (zoomState && zoomState.zoom !== 1) {
        const worldX = (screenX - zoomState.panX) / zoomState.zoom;
        const worldY = (screenY - zoomState.panY) / zoomState.zoom;
        return new Vector2(worldX, worldY);
      }

      return new Vector2(screenX, screenY);
    },
    [canvasRef, zoomState]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Event Processing (shared logic for canvas and document events)
  // ─────────────────────────────────────────────────────────────────────────────

  /** Apply grid snapping to moves, keeping squads together */
  const applyGridSnapToMoves = useCallback(
    (
      moves: Array<{ unitId: string; position: Vector2 }>
    ): Array<{ unitId: string; position: Vector2 }> => {
      if (cellSize <= 0) return moves;

      // Group moves by squadId
      const squadMoves = new Map<
        string,
        Array<{ unitId: string; position: Vector2; unit: (typeof units)[0] }>
      >();

      for (const move of moves) {
        const unit = units.find((u) => u.id === move.unitId);
        if (!unit) continue;

        const squadId = unit.squadId;
        if (!squadMoves.has(squadId)) {
          squadMoves.set(squadId, []);
        }
        squadMoves.get(squadId)!.push({ ...move, unit });
      }

      const snappedMoves: Array<{ unitId: string; position: Vector2 }> = [];

      // Process each squad as a unit
      for (const [, squadUnits] of squadMoves) {
        if (squadUnits.length === 0) continue;

        // Get the footprint from any unit in the squad (they all have the same)
        const footprint = squadUnits[0].unit.gridFootprint;
        if (!footprint) {
          // No footprint, just return original positions
          for (const su of squadUnits) {
            snappedMoves.push({ unitId: su.unitId, position: su.position });
          }
          continue;
        }

        // Calculate squad centroid (average position)
        let centroidX = 0;
        let centroidY = 0;
        for (const su of squadUnits) {
          centroidX += su.position.x;
          centroidY += su.position.y;
        }
        centroidX /= squadUnits.length;
        centroidY /= squadUnits.length;
        const centroid = new Vector2(centroidX, centroidY);

        // Snap the centroid to the grid based on squad footprint
        const snappedCentroid = snapSquadToGrid(centroid, footprint, cellSize);

        // Calculate the delta from original centroid to snapped centroid
        const deltaX = snappedCentroid.x - centroidX;
        const deltaY = snappedCentroid.y - centroidY;

        // Apply the same delta to all units in the squad
        for (const su of squadUnits) {
          snappedMoves.push({
            unitId: su.unitId,
            position: new Vector2(su.position.x + deltaX, su.position.y + deltaY),
          });
        }
      }

      return snappedMoves;
    },
    [cellSize, units]
  );

  /** Process mouse move for drag or box select */
  const processMoveEvent = useCallback(
    (pos: Vector2) => {
      // Handle box selection
      if (boxSelectSession) {
        setBoxSelectSession(updateBoxSelect(boxSelectSession, pos));
        return;
      }

      // Handle unit dragging
      if (!isDragging || !dragSessionRef.current) return;

      const session = dragSessionRef.current;
      const bounds = getDragBounds();

      if (isMultiDrag(session) && onUnitsMove) {
        const result = calculateDragPositions(session, pos, bounds, units);
        // Apply grid snapping - snaps entire squads together
        const snappedMoves = applyGridSnapToMoves(result.moves);
        onUnitsMove(snappedMoves);
      } else if (onUnitMove) {
        const newPos = calculateSingleDragPosition(session, pos, bounds);
        if (newPos) {
          // For single unit, use squad snapping too (in case it's a 1-unit squad)
          const snappedMoves = applyGridSnapToMoves([
            { unitId: session.anchorUnitId, position: newPos },
          ]);
          if (snappedMoves.length > 0) {
            onUnitMove(session.anchorUnitId, snappedMoves[0].position);
          }
        }
      }
    },
    [
      isDragging,
      boxSelectSession,
      getDragBounds,
      units,
      onUnitMove,
      onUnitsMove,
      applyGridSnapToMoves,
    ]
  );

  /** Process mouse up for ending drag or finalizing selection */
  const processUpEvent = useCallback(() => {
    // Finalize box selection
    if (boxSelectSession) {
      if (isBoxSelectActive(boxSelectSession)) {
        // Box was large enough - select units inside
        const box = getSelectionBox(boxSelectSession);
        const selectedIds = getUnitsInBox(box, units);
        // Expand selection to include all units from affected squads
        // (can't select individual units from a squad)
        const expandedSelection = expandSelectionToSquads(selectedIds, units);
        onSelectUnits?.(expandedSelection.selectedIds);
      } else {
        // Box was too small (just a click) - clear selection
        onSelectUnit?.(null);
      }
      setBoxSelectSession(null);
    }

    // End unit drag
    setIsDragging(false);
    dragSessionRef.current = null;
  }, [boxSelectSession, units, onSelectUnit, onSelectUnits]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Input Handlers (exposed to canvas)
  // ─────────────────────────────────────────────────────────────────────────────

  /** Mouse down - start selection, drag, or box select */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getMousePos(e);
      const clickedUnit = findUnitAtPosition(pos, units);

      if (clickedUnit) {
        const isAlreadySelected = selectedUnitIds.includes(clickedUnit.id);

        // Get squad units (all units with same squadId)
        const squadSelection = selectSquad(units, clickedUnit);

        if (!isAlreadySelected) {
          // Clicking a unit - select all units in the same squad
          onSelectUnits?.(squadSelection.selectedIds);
        }

        // Start drag for player units - drag entire squad
        if (clickedUnit.team === 'player') {
          // Filter to only player units (game logic delegated to core)
          const unitsToMove = isAlreadySelected
            ? filterSelectionByTeam(selectedUnitIds, units, 'player')
            : squadSelection.selectedIds;

          const session = startDrag(clickedUnit.id, pos, unitsToMove, units);
          dragSessionRef.current = session;
          setIsDragging(true);
        }
      } else {
        // Clicked empty space - start box selection
        setBoxSelectSession(startBoxSelect(pos));
      }
    },
    [getMousePos, units, selectedUnitIds, onSelectUnits]
  );

  /** Double click - select all of type */
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getMousePos(e);
      const clickedUnit = findUnitAtPosition(pos, units);

      if (clickedUnit && onSelectUnits) {
        const newSelection = selectAllOfType(units, clickedUnit);
        onSelectUnits(newSelection.selectedIds);
      }
    },
    [getMousePos, units, onSelectUnits]
  );

  /** Mouse move - delegates to shared logic */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      processMoveEvent(getMousePos(e));
    },
    [getMousePos, processMoveEvent]
  );

  /** Mouse up - delegates to shared logic */
  const handleMouseUp = useCallback(() => {
    processUpEvent();
  }, [processUpEvent]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Document-level Event Capture (for drag/select outside canvas bounds)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDragging && !boxSelectSession) return;

    const handleDocumentMouseMove = (e: MouseEvent) => {
      processMoveEvent(getMousePos(e));
    };

    const handleDocumentMouseUp = () => {
      processUpEvent();
    };

    // Add document-level listeners
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [isDragging, boxSelectSession, getMousePos, processMoveEvent, processUpEvent]);

  return {
    isDragging,
    boxSelectSession,
    draggedUnitIds: dragSessionRef.current?.draggedUnitIds ?? [],
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onDoubleClick: handleDoubleClick,
    },
  };
}

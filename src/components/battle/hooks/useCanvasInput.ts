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
} from '../../../core/battle/DragController';
import { findUnitAtPosition } from '../../../core/battle/InputAdapter';
import { selectAllOfType, selectSquad } from '../../../core/battle/SelectionManager';
import {
  startBoxSelect,
  updateBoxSelect,
  getSelectionBox,
  getUnitsInBox,
  isBoxSelectActive,
  BoxSelectSession,
} from '../../../core/battle/BoxSelectController';

/** Canvas configuration for input handling */
export interface CanvasConfig {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
}

/** Current selection state */
export interface SelectionState {
  units: ISelectable[];
  selectedUnitIds: string[];
}

/** Callbacks for canvas input events */
export interface CanvasInputCallbacks {
  onUnitMove?: (unitId: string, position: Vector2) => void;
  onUnitsMove?: (moves: Array<{ unitId: string; position: Vector2 }>) => void;
  onSelectUnit?: (unitId: string | null) => void;
  onSelectUnits?: (unitIds: string[]) => void;
}

export interface UseCanvasInputProps extends CanvasConfig, SelectionState, CanvasInputCallbacks {}

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
export function useCanvasInput({
  canvasRef,
  units,
  selectedUnitIds,
  width,
  height,
  onUnitMove,
  onUnitsMove,
  onSelectUnit,
  onSelectUnits,
}: UseCanvasInputProps): UseCanvasInputResult {
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

  /** Get mouse position relative to canvas */
  const getMousePos = useCallback(
    (e: MouseEvent | React.MouseEvent): Vector2 => {
      const canvas = canvasRef.current;
      if (!canvas) return new Vector2(0, 0);
      const rect = canvas.getBoundingClientRect();
      return new Vector2(e.clientX - rect.left, e.clientY - rect.top);
    },
    [canvasRef]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Event Processing (shared logic for canvas and document events)
  // ─────────────────────────────────────────────────────────────────────────────

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
        onUnitsMove(result.moves);
      } else if (onUnitMove) {
        const newPos = calculateSingleDragPosition(session, pos, bounds);
        if (newPos) {
          onUnitMove(session.anchorUnitId, newPos);
        }
      }
    },
    [isDragging, boxSelectSession, getDragBounds, units, onUnitMove, onUnitsMove]
  );

  /** Process mouse up for ending drag or finalizing selection */
  const processUpEvent = useCallback(() => {
    // Finalize box selection
    if (boxSelectSession) {
      if (isBoxSelectActive(boxSelectSession)) {
        // Box was large enough - select units inside
        const box = getSelectionBox(boxSelectSession);
        const selectedIds = getUnitsInBox(box, units);
        onSelectUnits?.(selectedIds);
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
          const unitsToMove = isAlreadySelected
            ? selectedUnitIds.filter((id) => {
                const unit = units.find((u) => u.id === id);
                return unit?.team === 'player';
              })
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

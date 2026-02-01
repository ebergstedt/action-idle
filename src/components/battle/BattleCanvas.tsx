/**
 * Battle Canvas
 *
 * Thin rendering layer for the battle arena.
 * All game logic is in /src/core/battle/ - this just renders and bridges input.
 *
 * Godot equivalent: A CanvasLayer or Node2D with _draw() override.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { BattleState, Unit, Projectile, ZONE_HEIGHT_PERCENT } from '../../core/battle';
import { Vector2 } from '../../core/physics/Vector2';
import { ARENA_COLORS } from '../../core/theme/colors';
import {
  startDrag,
  calculateDragPositions,
  calculateSingleDragPosition,
  isMultiDrag,
  DragSession,
  DragBounds,
} from '../../core/battle/DragController';
import { findUnitAtPosition } from '../../core/battle/InputAdapter';
import { selectAllOfType } from '../../core/battle/SelectionManager';
import {
  startBoxSelect,
  updateBoxSelect,
  getSelectionBox,
  getUnitsInBox,
  isBoxSelectActive,
  BoxSelectSession,
} from '../../core/battle/BoxSelectController';

interface BattleCanvasProps {
  state: BattleState;
  width: number;
  height: number;
  onUnitMove?: (unitId: string, position: Vector2) => void;
  onUnitsMove?: (moves: Array<{ unitId: string; position: Vector2 }>) => void;
  selectedUnitIds?: string[];
  onSelectUnit?: (unitId: string | null) => void;
  onSelectUnits?: (unitIds: string[]) => void;
}

export function BattleCanvas({
  state,
  width,
  height,
  onUnitMove,
  onUnitsMove,
  selectedUnitIds = [],
  onSelectUnit,
  onSelectUnits,
}: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [boxSelectSession, setBoxSelectSession] = useState<BoxSelectSession | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);

  // Calculate bounds for allied deployment zone
  const getDragBounds = useCallback((): DragBounds => {
    const zoneHeight = height * ZONE_HEIGHT_PERCENT;
    const margin = 20;
    return {
      minX: margin,
      maxX: width - margin,
      minY: height - zoneHeight + margin,
      maxY: height - margin,
    };
  }, [width, height]);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Vector2 => {
    const canvas = canvasRef.current;
    if (!canvas) return new Vector2(0, 0);
    const rect = canvas.getBoundingClientRect();
    return new Vector2(e.clientX - rect.left, e.clientY - rect.top);
  }, []);

  // Input: Mouse down - start selection, drag, or box select
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getMousePos(e);
      const clickedUnit = findUnitAtPosition(pos, state.units);

      if (clickedUnit) {
        const isAlreadySelected = selectedUnitIds.includes(clickedUnit.id);

        if (!isAlreadySelected) {
          // Clicking unselected unit - select just that unit
          onSelectUnit?.(clickedUnit.id);
        }

        // Start drag for player units
        if (clickedUnit.team === 'player') {
          const unitsToMove = isAlreadySelected
            ? selectedUnitIds.filter((id) => {
                const unit = state.units.find((u) => u.id === id);
                return unit?.team === 'player';
              })
            : [clickedUnit.id];

          const session = startDrag(clickedUnit.id, pos, unitsToMove, state.units);
          dragSessionRef.current = session;
          setIsDragging(true);
        }
      } else {
        // Clicked empty space - start box selection
        setBoxSelectSession(startBoxSelect(pos));
      }
    },
    [getMousePos, state.units, selectedUnitIds, onSelectUnit]
  );

  // Input: Double click - select all of type
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getMousePos(e);
      const clickedUnit = findUnitAtPosition(pos, state.units);

      if (clickedUnit && onSelectUnits) {
        const newSelection = selectAllOfType(state.units, clickedUnit);
        onSelectUnits(newSelection.selectedIds);
      }
    },
    [getMousePos, state.units, onSelectUnits]
  );

  // Input: Mouse move - handle dragging or box selection
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getMousePos(e);

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
        const result = calculateDragPositions(session, pos, bounds, state.units);
        onUnitsMove(result.moves);
      } else if (onUnitMove) {
        const newPos = calculateSingleDragPosition(session, pos, bounds);
        if (newPos) {
          onUnitMove(session.anchorUnitId, newPos);
        }
      }
    },
    [isDragging, boxSelectSession, getMousePos, getDragBounds, state.units, onUnitMove, onUnitsMove]
  );

  // Input: Mouse up - end drag or finalize box selection
  const handleMouseUp = useCallback(() => {
    // Finalize box selection
    if (boxSelectSession) {
      if (isBoxSelectActive(boxSelectSession)) {
        // Box was large enough - select units inside
        const box = getSelectionBox(boxSelectSession);
        const selectedIds = getUnitsInBox(box, state.units);
        onSelectUnits?.(selectedIds);
      } else {
        // Box was too small (just a click) - clear selection
        onSelectUnit?.(null);
      }

      setBoxSelectSession(null);
      return;
    }

    // End unit drag
    setIsDragging(false);
    dragSessionRef.current = null;
  }, [boxSelectSession, state.units, onSelectUnit, onSelectUnits]);

  const handleMouseLeave = useCallback(() => {
    // Cancel box selection on leave
    setBoxSelectSession(null);

    // End unit drag
    setIsDragging(false);
    dragSessionRef.current = null;
  }, []);

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background
    ctx.fillStyle = ARENA_COLORS.background;
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = ARENA_COLORS.gridLine;
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Spawn zones
    const zoneHeight = height * ZONE_HEIGHT_PERCENT;

    // Enemy zone (top)
    ctx.fillStyle = ARENA_COLORS.enemyZoneFill;
    ctx.fillRect(0, 0, width, zoneHeight);
    ctx.strokeStyle = ARENA_COLORS.enemyZoneBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, zoneHeight);
    ctx.lineTo(width, zoneHeight);
    ctx.stroke();

    // Allied zone (bottom)
    ctx.fillStyle = ARENA_COLORS.allyZoneFill;
    ctx.fillRect(0, height - zoneHeight, width, zoneHeight);
    ctx.strokeStyle = ARENA_COLORS.allyZoneBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - zoneHeight);
    ctx.lineTo(width, height - zoneHeight);
    ctx.stroke();

    // Projectiles
    for (const proj of state.projectiles) {
      drawProjectile(ctx, proj);
    }

    // Units (bodies)
    const draggedIds = dragSessionRef.current?.draggedUnitIds ?? [];
    for (const unit of state.units) {
      const isSelected = selectedUnitIds.includes(unit.id);
      const isBeingDragged = isDragging && draggedIds.includes(unit.id);
      drawUnitBody(ctx, unit, isSelected, isBeingDragged);
    }

    // Health bars (separate pass)
    for (const unit of state.units) {
      drawHealthBar(ctx, unit);
    }

    // Draw box selection rectangle
    if (boxSelectSession && isBoxSelectActive(boxSelectSession)) {
      const box = getSelectionBox(boxSelectSession);
      drawSelectionBox(ctx, box);
    }
  }, [state, width, height, selectedUnitIds, isDragging, boxSelectSession]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-700 rounded-lg cursor-pointer"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
    />
  );
}

// --- Drawing functions (could be extracted to a Renderer class) ---

function drawUnitBody(
  ctx: CanvasRenderingContext2D,
  unit: Unit,
  isSelected: boolean,
  isBeingDragged: boolean
): void {
  const { position, color, shape, size, team } = unit;

  ctx.save();
  ctx.translate(position.x, position.y);

  // Selection ring
  if (isSelected || isBeingDragged) {
    ctx.strokeStyle = ARENA_COLORS.selectionRing;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, size + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowColor = ARENA_COLORS.selectionRing;
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Move indicator for unselected player units
  if (team === 'player' && !isSelected && !isBeingDragged) {
    ctx.strokeStyle = ARENA_COLORS.moveIndicator;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Unit shape
  ctx.globalAlpha = isBeingDragged ? 0.8 : 1;
  ctx.fillStyle = color;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;

  switch (shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'square':
      ctx.fillRect(-size, -size, size * 2, size * 2);
      ctx.strokeRect(-size, -size, size * 2, size * 2);
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(-size, size);
      ctx.lineTo(size, size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
  }

  ctx.restore();
}

function drawHealthBar(ctx: CanvasRenderingContext2D, unit: Unit): void {
  const { position, size, health, stats } = unit;

  ctx.save();
  ctx.translate(position.x, position.y);

  const barWidth = size * 2.5;
  const barHeight = 6;
  const barY = -size - 20;

  // Background
  ctx.fillStyle = ARENA_COLORS.healthBarBg;
  ctx.fillRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

  // Fill
  const healthPercent = health / stats.maxHealth;
  ctx.fillStyle =
    healthPercent > 0.5
      ? ARENA_COLORS.healthHigh
      : healthPercent > 0.25
        ? ARENA_COLORS.healthMedium
        : ARENA_COLORS.healthLow;
  ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);

  ctx.restore();
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile): void {
  ctx.save();
  ctx.translate(proj.position.x, proj.position.y);

  ctx.fillStyle = proj.color;
  ctx.shadowColor = proj.color;
  ctx.shadowBlur = 8;

  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  box: { minX: number; maxX: number; minY: number; maxY: number }
): void {
  const width = box.maxX - box.minX;
  const height = box.maxY - box.minY;

  ctx.save();

  // Semi-transparent fill
  ctx.fillStyle = 'rgba(0, 200, 255, 0.15)';
  ctx.fillRect(box.minX, box.minY, width, height);

  // Border
  ctx.strokeStyle = ARENA_COLORS.selectionRing;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(box.minX, box.minY, width, height);

  ctx.restore();
}

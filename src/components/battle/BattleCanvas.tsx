/**
 * Battle Canvas
 *
 * Thin rendering layer for the battle arena.
 * All game logic is in /src/core/battle/ - this just renders and bridges input.
 *
 * Godot equivalent: A CanvasLayer or Node2D with _draw() override.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { BattleState } from '../../core/battle';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_SPEED } from '../../core/battle/BattleConfig';
import { Vector2, calculateZoom, createDefaultZoomState } from '../../core/physics';
import { calculateCellSize } from '../../core/battle/grid/GridManager';

import { useCanvasInput, ZoomState } from './hooks/useCanvasInput';
import { useCanvasPanning } from './hooks/useCanvasPanning';
import { useDustParticles } from './hooks/useDustParticles';
import { useGhostHealth } from './hooks/useGhostHealth';
import { useInkSplatter } from './hooks/useInkSplatter';
import { renderBattle } from './rendering';

interface BattleCanvasProps {
  state: BattleState;
  width: number;
  height: number;
  onUnitMove?: (unitId: string, position: Vector2) => void;
  onUnitsMove?: (moves: Array<{ unitId: string; position: Vector2 }>) => void;
  selectedUnitIds?: string[];
  onSelectUnit?: (unitId: string | null) => void;
  onSelectUnits?: (unitIds: string[]) => void;
  /** Key that changes to trigger zoom reset (e.g., on battle reset) */
  resetKey?: number;
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
  resetKey = 0,
}: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationTime, setAnimationTime] = useState(0);
  const hasSelection = selectedUnitIds.length > 0;

  // Zoom state: level, pan offset (for zooming toward mouse position)
  const [zoomState, setZoomState] = useState<ZoomState>(createDefaultZoomState);

  // Reset zoom when resetKey changes
  useEffect(() => {
    setZoomState(createDefaultZoomState());
  }, [resetKey]);

  // WASD and edge-of-screen panning (only when zoomed in)
  const isPanningEnabled = zoomState.zoom > MIN_ZOOM;
  useCanvasPanning({
    setZoomState,
    width,
    height,
    canvasRef,
    enabled: isPanningEnabled,
  });

  // Calculate cell size for grid snapping (only active during deployment)
  const cellSize = useMemo(() => {
    if (state.hasStarted) return 0; // Disable grid snapping during battle
    return calculateCellSize(width, height);
  }, [width, height, state.hasStarted]);

  // Handle mouse wheel for zoom - delegates to core Zoom utilities
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseScreenPos = new Vector2(e.clientX - rect.left, e.clientY - rect.top);

      setZoomState((prev) =>
        calculateZoom(
          prev,
          mouseScreenPos,
          e.deltaY,
          { minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM, zoomSpeed: ZOOM_SPEED },
          { width, height }
        )
      );
    },
    [width, height]
  );

  // Custom hooks for input handling and effects
  const { isDragging, boxSelectSession, draggedUnitIds, handlers } = useCanvasInput({
    canvasRef,
    units: state.units,
    selectedUnitIds,
    width,
    height,
    zoomState,
    cellSize,
    onUnitMove,
    onUnitsMove,
    onSelectUnit,
    onSelectUnits,
  });

  const { updateParticles } = useDustParticles();
  const { updateGhostHealth } = useGhostHealth();
  const { updateSplatters } = useInkSplatter();

  // Animation loop for selection pulse (runs when units are selected)
  useEffect(() => {
    if (!hasSelection) return;

    let frameId: number;
    const animate = () => {
      setAnimationTime(performance.now());
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [hasSelection]);

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update visual effect state (dust particles disabled for AC6 aesthetic)
    updateParticles(state.units, state.isRunning); // Still call to keep internal state clean
    const ghostHealthMap = updateGhostHealth(state.units);
    const inkSplatters = updateSplatters(state.units, state.hasStarted, 0.016);

    // Apply zoom transform
    ctx.save();
    ctx.translate(zoomState.panX, zoomState.panY);
    ctx.scale(zoomState.zoom, zoomState.zoom);

    // Render the battle scene
    renderBattle({
      ctx,
      width,
      height,
      state,
      selectedUnitIds,
      draggedUnitIds,
      isDragging,
      boxSelectSession,
      ghostHealthMap,
      inkSplatters,
    });

    // Restore transform
    ctx.restore();
  }, [
    state,
    width,
    height,
    selectedUnitIds,
    isDragging,
    draggedUnitIds,
    boxSelectSession,
    animationTime,
    updateParticles,
    updateGhostHealth,
    updateSplatters,
    zoomState,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      tabIndex={0}
      className="border border-gray-700 rounded-lg cursor-pointer outline-none"
      style={{ touchAction: 'none' }}
      onMouseDown={handlers.onMouseDown}
      onMouseMove={handlers.onMouseMove}
      onMouseUp={handlers.onMouseUp}
      onDoubleClick={handlers.onDoubleClick}
      onWheel={handleWheel}
      onDragStart={(e) => e.preventDefault()}
    />
  );
}

/**
 * Battle Canvas
 *
 * Thin rendering layer for the battle arena.
 * All game logic is in /src/core/battle/ - this just renders and bridges input.
 *
 * Godot equivalent: A CanvasLayer or Node2D with _draw() override.
 */

import { useEffect, useRef, useState } from 'react';
import type { BattleState } from '../../core/battle';
import { Vector2 } from '../../core/physics/Vector2';

import { useCanvasInput } from './hooks/useCanvasInput';
import { useDustParticles } from './hooks/useDustParticles';
import { useGhostHealth } from './hooks/useGhostHealth';
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
  const [animationTime, setAnimationTime] = useState(0);
  const hasSelection = selectedUnitIds.length > 0;

  // Custom hooks for input handling and effects
  const { isDragging, boxSelectSession, draggedUnitIds, handlers } = useCanvasInput({
    canvasRef,
    units: state.units,
    selectedUnitIds,
    width,
    height,
    onUnitMove,
    onUnitsMove,
    onSelectUnit,
    onSelectUnits,
  });

  const { updateParticles } = useDustParticles();
  const { updateGhostHealth } = useGhostHealth();

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

    // Update particle and ghost health state
    const dustParticles = updateParticles(state.units, state.isRunning);
    const ghostHealthMap = updateGhostHealth(state.units);

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
      dustParticles,
    });
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
      onDragStart={(e) => e.preventDefault()}
    />
  );
}

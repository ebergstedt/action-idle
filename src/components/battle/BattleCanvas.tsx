import { useEffect, useRef, useCallback, useState } from 'react';
import { BattleState, Unit, Projectile } from '../../core/battle';
import { Vector2 } from '../../core/physics/Vector2';

// Zone heights as percentage of arena height
const ZONE_HEIGHT_PERCENT = 0.25; // 25% of arena height

interface BattleCanvasProps {
  state: BattleState;
  width: number;
  height: number;
  onUnitMove?: (unitId: string, position: Vector2) => void;
  selectedUnitId?: string | null;
  onSelectUnit?: (unitId: string | null) => void;
}

export function BattleCanvas({
  state,
  width,
  height,
  onUnitMove,
  selectedUnitId,
  onSelectUnit,
}: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedUnitId, setDraggedUnitId] = useState<string | null>(null);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Vector2 => {
    const canvas = canvasRef.current;
    if (!canvas) return new Vector2(0, 0);
    const rect = canvas.getBoundingClientRect();
    return new Vector2(e.clientX - rect.left, e.clientY - rect.top);
  }, []);

  const findUnitAtPosition = useCallback(
    (pos: Vector2, playerOnly: boolean = false): Unit | null => {
      // Check units in reverse order (top-most first)
      for (let i = state.units.length - 1; i >= 0; i--) {
        const unit = state.units[i];
        if (playerOnly && unit.team !== 'player') continue;

        const dist = pos.distanceTo(unit.position);
        if (dist <= unit.size + 5) {
          return unit;
        }
      }
      return null;
    },
    [state.units]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getMousePos(e);
      const unit = findUnitAtPosition(pos, true); // Only player units

      if (unit) {
        setIsDragging(true);
        setDraggedUnitId(unit.id);
        onSelectUnit?.(unit.id);
      } else {
        onSelectUnit?.(null);
      }
    },
    [getMousePos, findUnitAtPosition, onSelectUnit]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !draggedUnitId) return;

      const pos = getMousePos(e);
      const zoneHeight = height * ZONE_HEIGHT_PERCENT;
      const allyZoneTop = height - zoneHeight;

      // Clamp to allied deployment zone only
      const clampedPos = new Vector2(
        Math.max(20, Math.min(width - 20, pos.x)),
        Math.max(allyZoneTop + 20, Math.min(height - 20, pos.y))
      );

      onUnitMove?.(draggedUnitId, clampedPos);
    },
    [isDragging, draggedUnitId, getMousePos, width, height, onUnitMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedUnitId(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setDraggedUnitId(null);
  }, []);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines for depth
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw spawn zones
    const zoneHeight = height * ZONE_HEIGHT_PERCENT;

    // Enemy zone (top) - red
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.fillRect(0, 0, width, zoneHeight);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, zoneHeight);
    ctx.lineTo(width, zoneHeight);
    ctx.stroke();

    // Allied zone (bottom) - green
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.fillRect(0, height - zoneHeight, width, zoneHeight);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - zoneHeight);
    ctx.lineTo(width, height - zoneHeight);
    ctx.stroke();

    // Draw projectiles
    for (const proj of state.projectiles) {
      drawProjectile(ctx, proj);
    }

    // Draw units
    for (const unit of state.units) {
      const isSelected = unit.id === selectedUnitId;
      const isBeingDragged = unit.id === draggedUnitId;
      drawUnit(ctx, unit, isSelected, isBeingDragged);
    }
  }, [state, width, height, selectedUnitId, draggedUnitId]);

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
    />
  );
}

function drawUnit(
  ctx: CanvasRenderingContext2D,
  unit: Unit,
  isSelected: boolean,
  isBeingDragged: boolean
): void {
  const { position, color, shape, size, health, stats, team } = unit;

  ctx.save();
  ctx.translate(position.x, position.y);

  // Draw selection ring for player units
  if (team === 'player' && (isSelected || isBeingDragged)) {
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, size + 8, 0, Math.PI * 2);
    ctx.stroke();

    // Glow effect
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Draw move indicator for player units (subtle ring)
  if (team === 'player' && !isSelected && !isBeingDragged) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw health bar background
  const healthBarWidth = size * 2;
  const healthBarHeight = 4;
  ctx.fillStyle = '#333';
  ctx.fillRect(-healthBarWidth / 2, -size - 12, healthBarWidth, healthBarHeight);

  // Draw health bar
  const healthPercent = health / stats.maxHealth;
  ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
  ctx.fillRect(-healthBarWidth / 2, -size - 12, healthBarWidth * healthPercent, healthBarHeight);

  // Draw shape with optional drag opacity
  ctx.globalAlpha = isBeingDragged ? 0.8 : 1;
  ctx.fillStyle = color;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;

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

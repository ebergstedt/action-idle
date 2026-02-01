/**
 * Battle Canvas
 *
 * Thin rendering layer for the battle arena.
 * All game logic is in /src/core/battle/ - this just renders and bridges input.
 *
 * Godot equivalent: A CanvasLayer or Node2D with _draw() override.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  BattleState,
  UnitRenderData,
  ProjectileRenderData,
  CastleRenderData,
  ShockwaveRenderData,
  DamageNumberRenderData,
  ZONE_HEIGHT_PERCENT,
} from '../../core/battle';
import {
  DRAG_BOUNDS_MARGIN,
  HIT_FLASH_DURATION,
  DEATH_FADE_DURATION,
  BASE_DAMAGE_NUMBER_FONT_SIZE,
  BASE_PROJECTILE_TRAIL_LENGTH,
  PROJECTILE_TRAIL_WIDTH,
  UNIT_SHADOW_OFFSET,
  UNIT_SHADOW_OPACITY,
  SELECTION_PULSE_SPEED,
  SELECTION_PULSE_INTENSITY,
  DUST_PARTICLE_LIFETIME,
  DUST_SPAWN_INTERVAL,
  DUST_PARTICLE_SIZE,
  scaleValue,
} from '../../core/battle/BattleConfig';
import { Vector2 } from '../../core/physics/Vector2';
import { ARENA_COLORS, UI_COLORS, CASTLE_COLORS, DEBUFF_COLORS } from '../../core/theme/colors';
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

// Ghost health state for damage visualization
interface GhostHealthState {
  ghostHealth: number;
  lastHealth: number;
}

// Dust particle for movement effects
interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifetime: number;
  maxLifetime: number;
}

// Decay rate: how much of the difference to close per frame (0-1)
const GHOST_HEALTH_DECAY_RATE = 0.08;

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
  const ghostHealthRef = useRef<Map<string, GhostHealthState>>(new Map());
  const [animationTime, setAnimationTime] = useState(0);
  const hasSelection = selectedUnitIds.length > 0;
  const dustParticlesRef = useRef<DustParticle[]>([]);
  const lastDustSpawnRef = useRef<Map<string, number>>(new Map());
  const prevPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

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

  // Calculate bounds for allied deployment zone
  const getDragBounds = useCallback((): DragBounds => {
    const zoneHeight = height * ZONE_HEIGHT_PERCENT;
    return {
      minX: DRAG_BOUNDS_MARGIN,
      maxX: width - DRAG_BOUNDS_MARGIN,
      minY: height - zoneHeight + DRAG_BOUNDS_MARGIN,
      maxY: height - DRAG_BOUNDS_MARGIN,
    };
  }, [width, height]);

  // Get mouse position relative to canvas - works with any MouseEvent
  const getMousePos = useCallback((e: MouseEvent | React.MouseEvent): Vector2 => {
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

  // Document-level event handlers for capturing mouse events outside canvas
  // This ensures drag/box-select works even when mouse leaves the canvas
  useEffect(() => {
    if (!isDragging && !boxSelectSession) return;

    const handleDocumentMouseMove = (e: MouseEvent) => {
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
    };

    const handleDocumentMouseUp = () => {
      // Finalize box selection
      if (boxSelectSession) {
        if (isBoxSelectActive(boxSelectSession)) {
          const box = getSelectionBox(boxSelectSession);
          const selectedIds = getUnitsInBox(box, state.units);
          onSelectUnits?.(selectedIds);
        } else {
          onSelectUnit?.(null);
        }
        setBoxSelectSession(null);
      }

      // End unit drag
      setIsDragging(false);
      dragSessionRef.current = null;
    };

    // Add document-level listeners
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [
    isDragging,
    boxSelectSession,
    getMousePos,
    getDragBounds,
    state.units,
    onUnitMove,
    onUnitsMove,
    onSelectUnit,
    onSelectUnits,
  ]);

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

    // Shockwaves (draw early so other elements appear on top)
    for (const shockwave of state.shockwaves) {
      drawShockwave(ctx, shockwave, width, height);
    }

    // Castles (draw before units so units appear on top)
    for (const castle of state.castles) {
      drawCastle(ctx, castle);
    }

    // Projectiles
    for (const proj of state.projectiles) {
      drawProjectile(ctx, proj, height);
    }

    // Update and spawn dust particles (only during battle)
    if (state.isRunning) {
      const now = performance.now();

      // Spawn dust for moving units
      for (const unit of state.units) {
        if (unit.deathFadeTimer >= 0) continue; // Skip dying units

        const prevPos = prevPositionsRef.current.get(unit.id);
        const isMoving =
          prevPos &&
          (Math.abs(unit.position.x - prevPos.x) > 0.5 ||
            Math.abs(unit.position.y - prevPos.y) > 0.5);

        if (isMoving) {
          const lastSpawn = lastDustSpawnRef.current.get(unit.id) ?? 0;
          if (now - lastSpawn > DUST_SPAWN_INTERVAL * 1000) {
            // Spawn dust particle at unit's feet
            dustParticlesRef.current.push({
              x: unit.position.x + (Math.random() - 0.5) * unit.size,
              y: unit.position.y + unit.size * 0.5,
              vx: (Math.random() - 0.5) * 20,
              vy: -Math.random() * 15 - 5,
              lifetime: DUST_PARTICLE_LIFETIME,
              maxLifetime: DUST_PARTICLE_LIFETIME,
            });
            lastDustSpawnRef.current.set(unit.id, now);
          }
        }
        prevPositionsRef.current.set(unit.id, { x: unit.position.x, y: unit.position.y });
      }

      // Update existing particles
      dustParticlesRef.current = dustParticlesRef.current.filter((p) => {
        p.lifetime -= 0.016; // Approximate frame time
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.vy += 30 * 0.016; // Gravity
        return p.lifetime > 0;
      });
    }

    // Draw dust particles
    for (const particle of dustParticlesRef.current) {
      const alpha = particle.lifetime / particle.maxLifetime;
      ctx.fillStyle = ARENA_COLORS.dustParticle;
      ctx.globalAlpha = alpha * 0.6;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, DUST_PARTICLE_SIZE * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Unit shadows (drawn first so they're behind all units)
    for (const unit of state.units) {
      drawUnitShadow(ctx, unit);
    }

    // Units (bodies)
    const draggedIds = dragSessionRef.current?.draggedUnitIds ?? [];
    for (const unit of state.units) {
      const isSelected = selectedUnitIds.includes(unit.id);
      const isBeingDragged = isDragging && draggedIds.includes(unit.id);
      drawUnitBody(ctx, unit, isSelected, isBeingDragged);
    }

    // Update and draw health bars with ghost effect (separate pass - units)
    const currentUnitIds = new Set(state.units.map((u) => u.id));
    // Clean up ghost health for removed units
    for (const id of ghostHealthRef.current.keys()) {
      if (!currentUnitIds.has(id)) {
        ghostHealthRef.current.delete(id);
      }
    }
    // Update ghost health and draw health bars
    for (const unit of state.units) {
      const ghostState = ghostHealthRef.current.get(unit.id);
      let ghostHealth: number;

      if (!ghostState) {
        // New unit - initialize ghost health to current health
        ghostHealth = unit.health;
        ghostHealthRef.current.set(unit.id, {
          ghostHealth: unit.health,
          lastHealth: unit.health,
        });
      } else if (unit.health < ghostState.lastHealth) {
        // Damage taken - ghost stays at previous health, will decay
        ghostHealth = ghostState.ghostHealth;
        ghostHealthRef.current.set(unit.id, {
          ghostHealth: ghostState.ghostHealth,
          lastHealth: unit.health,
        });
      } else if (unit.health > ghostState.lastHealth) {
        // Healed - snap ghost to current health
        ghostHealth = unit.health;
        ghostHealthRef.current.set(unit.id, {
          ghostHealth: unit.health,
          lastHealth: unit.health,
        });
      } else {
        // No health change - decay ghost toward current
        const diff = ghostState.ghostHealth - unit.health;
        if (diff > 0.1) {
          ghostHealth = ghostState.ghostHealth - diff * GHOST_HEALTH_DECAY_RATE;
          ghostHealthRef.current.set(unit.id, {
            ghostHealth,
            lastHealth: unit.health,
          });
        } else {
          // Close enough - snap to current
          ghostHealth = unit.health;
          ghostHealthRef.current.set(unit.id, {
            ghostHealth: unit.health,
            lastHealth: unit.health,
          });
        }
      }

      // Skip health bar for dying units
      if (unit.deathFadeTimer < 0) {
        drawHealthBar(ctx, unit, ghostHealth);
      }
    }

    // Debuff indicators (separate pass - above health bars, skip dying units)
    for (const unit of state.units) {
      if (unit.deathFadeTimer < 0) {
        drawDebuffIndicator(ctx, unit);
      }
    }

    // Health bars for castles (separate pass)
    for (const castle of state.castles) {
      drawCastleHealthBar(ctx, castle);
    }

    // Damage numbers (above everything else)
    for (const damageNumber of state.damageNumbers) {
      drawDamageNumber(ctx, damageNumber, height);
    }

    // Draw box selection rectangle
    if (boxSelectSession && isBoxSelectActive(boxSelectSession)) {
      const box = getSelectionBox(boxSelectSession);
      drawSelectionBox(ctx, box);
    }
  }, [state, width, height, selectedUnitIds, isDragging, boxSelectSession, animationTime]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      tabIndex={0}
      className="border border-gray-700 rounded-lg cursor-pointer outline-none"
      style={{ touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onDragStart={(e) => e.preventDefault()}
    />
  );
}

// --- Drawing functions (could be extracted to a Renderer class) ---

function drawUnitShadow(ctx: CanvasRenderingContext2D, unit: UnitRenderData): void {
  const { position, shape, size, visualOffset, deathFadeTimer } = unit;

  // Calculate death fade effect (shadows also fade with unit)
  const isDying = deathFadeTimer >= 0;
  const deathProgress = isDying ? 1 - deathFadeTimer / DEATH_FADE_DURATION : 0;
  const deathOpacity = isDying ? 1 - deathProgress : 1;
  const deathScale = isDying ? 1 - deathProgress * 0.3 : 1;

  // Apply visual offset to match unit position
  const renderX = position.x + (visualOffset?.x ?? 0) + UNIT_SHADOW_OFFSET;
  const renderY = position.y + (visualOffset?.y ?? 0) + UNIT_SHADOW_OFFSET;

  ctx.save();
  ctx.translate(renderX, renderY);

  if (isDying) {
    ctx.scale(deathScale, deathScale);
  }

  ctx.fillStyle = ARENA_COLORS.unitShadow;
  ctx.globalAlpha = UNIT_SHADOW_OPACITY * deathOpacity;

  switch (shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'square':
      ctx.fillRect(-size, -size, size * 2, size * 2);
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(-size, size);
      ctx.lineTo(size, size);
      ctx.closePath();
      ctx.fill();
      break;
  }

  ctx.restore();
}

function drawUnitBody(
  ctx: CanvasRenderingContext2D,
  unit: UnitRenderData,
  isSelected: boolean,
  isBeingDragged: boolean
): void {
  const { position, color, shape, size, team, visualOffset, deathFadeTimer } = unit;

  // Calculate death fade effect
  const isDying = deathFadeTimer >= 0;
  const deathProgress = isDying ? 1 - deathFadeTimer / DEATH_FADE_DURATION : 0;
  const deathOpacity = isDying ? 1 - deathProgress : 1;
  const deathScale = isDying ? 1 - deathProgress * 0.3 : 1; // Shrink to 70% at death

  // Apply visual offset (lunge/knockback) to rendered position
  const renderX = position.x + (visualOffset?.x ?? 0);
  const renderY = position.y + (visualOffset?.y ?? 0);

  ctx.save();
  ctx.translate(renderX, renderY);

  // Apply death scale
  if (isDying) {
    ctx.scale(deathScale, deathScale);
  }

  // Selection ring with pulse animation (skip for dying units)
  if ((isSelected || isBeingDragged) && !isDying) {
    // Calculate pulse based on time
    const pulseTime = performance.now() / 1000; // seconds
    const pulse = Math.sin(pulseTime * SELECTION_PULSE_SPEED * Math.PI * 2);
    const pulseScale = 1 + pulse * SELECTION_PULSE_INTENSITY;
    const ringRadius = (size + 8) * pulseScale;

    ctx.strokeStyle = ARENA_COLORS.selectionRing;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowColor = ARENA_COLORS.selectionRing;
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Move indicator for unselected player units (skip for dying units)
  if (team === 'player' && !isSelected && !isBeingDragged && !isDying) {
    ctx.strokeStyle = ARENA_COLORS.moveIndicator;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Unit shape
  const baseAlpha = isBeingDragged ? 0.8 : 1;
  ctx.globalAlpha = baseAlpha * deathOpacity;
  ctx.fillStyle = color;
  ctx.strokeStyle = UI_COLORS.black;
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

  // Hit flash overlay - white flash when unit takes damage
  const hitFlashTimer = unit.hitFlashTimer ?? 0;
  if (hitFlashTimer > 0) {
    const flashIntensity = hitFlashTimer / HIT_FLASH_DURATION;
    ctx.fillStyle = ARENA_COLORS.hitFlash;
    ctx.globalAlpha = flashIntensity * 0.7; // Max 70% opacity for the flash

    switch (shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.fillRect(-size, -size, size * 2, size * 2);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size, size);
        ctx.lineTo(size, size);
        ctx.closePath();
        ctx.fill();
        break;
    }
  }

  ctx.restore();
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  unit: UnitRenderData,
  ghostHealth: number
): void {
  const { position, size, health, stats, visualOffset } = unit;

  // Apply visual offset to match unit body position
  const renderX = position.x + (visualOffset?.x ?? 0);
  const renderY = position.y + (visualOffset?.y ?? 0);

  ctx.save();
  ctx.translate(renderX, renderY);

  const barWidth = size * 2.5;
  const barHeight = 6;
  const barY = -size - 20;

  // Background
  ctx.fillStyle = ARENA_COLORS.healthBarBg;
  ctx.fillRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

  // Ghost health bar (shows damage taken as dark red trailing effect)
  const ghostPercent = ghostHealth / stats.maxHealth;
  if (ghostPercent > health / stats.maxHealth) {
    ctx.fillStyle = ARENA_COLORS.healthGhost;
    ctx.fillRect(-barWidth / 2, barY, barWidth * ghostPercent, barHeight);
  }

  // Current health fill
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

function drawProjectile(
  ctx: CanvasRenderingContext2D,
  proj: ProjectileRenderData,
  arenaHeight: number
): void {
  const { position, target, color } = proj;

  // Calculate direction toward target
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Normalize direction (or default to up if at target)
  const dirX = dist > 0.1 ? dx / dist : 0;
  const dirY = dist > 0.1 ? dy / dist : -1;

  // Trail extends backward from projectile
  const trailLength = scaleValue(BASE_PROJECTILE_TRAIL_LENGTH, arenaHeight);
  const trailEndX = position.x - dirX * trailLength;
  const trailEndY = position.y - dirY * trailLength;

  ctx.save();

  // Draw trail as gradient line
  const gradient = ctx.createLinearGradient(trailEndX, trailEndY, position.x, position.y);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(1, color);

  ctx.strokeStyle = gradient;
  ctx.lineWidth = PROJECTILE_TRAIL_WIDTH;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(trailEndX, trailEndY);
  ctx.lineTo(position.x, position.y);
  ctx.stroke();

  // Draw projectile head
  ctx.translate(position.x, position.y);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
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
  ctx.fillStyle = ARENA_COLORS.boxSelectFill;
  ctx.fillRect(box.minX, box.minY, width, height);

  // Border
  ctx.strokeStyle = ARENA_COLORS.selectionRing;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(box.minX, box.minY, width, height);

  ctx.restore();
}

function drawCastle(ctx: CanvasRenderingContext2D, castle: CastleRenderData): void {
  const { position, color, size } = castle;

  ctx.save();
  ctx.translate(position.x, position.y);

  // Castle base - larger filled rectangle
  ctx.fillStyle = color;
  ctx.strokeStyle = UI_COLORS.black;
  ctx.lineWidth = 3;

  // Draw castle as a fortified structure (pentagon shape for tower look)
  const halfSize = size;
  ctx.beginPath();
  // Bottom left
  ctx.moveTo(-halfSize, halfSize);
  // Bottom right
  ctx.lineTo(halfSize, halfSize);
  // Right wall
  ctx.lineTo(halfSize, -halfSize * 0.3);
  // Right battlement
  ctx.lineTo(halfSize * 0.6, -halfSize);
  // Top
  ctx.lineTo(0, -halfSize * 0.6);
  // Left battlement
  ctx.lineTo(-halfSize * 0.6, -halfSize);
  // Left wall
  ctx.lineTo(-halfSize, -halfSize * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Castle door/gate
  ctx.fillStyle = CASTLE_COLORS.door;
  const doorWidth = size * 0.4;
  const doorHeight = size * 0.6;
  ctx.fillRect(-doorWidth / 2, halfSize - doorHeight, doorWidth, doorHeight);
  ctx.strokeRect(-doorWidth / 2, halfSize - doorHeight, doorWidth, doorHeight);

  ctx.restore();
}

function drawCastleHealthBar(ctx: CanvasRenderingContext2D, castle: CastleRenderData): void {
  const { position, size, health, maxHealth } = castle;

  ctx.save();
  ctx.translate(position.x, position.y);

  const barWidth = size * 3;
  const barHeight = 8;
  const barY = -size - 25;

  // Background
  ctx.fillStyle = ARENA_COLORS.healthBarBg;
  ctx.fillRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

  // Fill
  const healthPercent = health / maxHealth;
  ctx.fillStyle =
    healthPercent > 0.5
      ? ARENA_COLORS.healthHigh
      : healthPercent > 0.25
        ? ARENA_COLORS.healthMedium
        : ARENA_COLORS.healthLow;
  ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);

  ctx.restore();
}

function drawShockwave(
  ctx: CanvasRenderingContext2D,
  shockwave: ShockwaveRenderData,
  arenaWidth: number,
  arenaHeight: number
): void {
  const { position, currentRadius, color } = shockwave;

  // Don't draw if radius is too small (prevents negative radius issues)
  if (currentRadius < 10) return;

  ctx.save();

  // Clip to arena bounds so shockwave doesn't render outside
  ctx.beginPath();
  ctx.rect(0, 0, arenaWidth, arenaHeight);
  ctx.clip();

  ctx.translate(position.x, position.y);

  // Constant ring thickness
  const ringThickness = 8;

  // Outer glow
  ctx.beginPath();
  ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = ringThickness + 4;
  ctx.globalAlpha = 0.3;
  ctx.stroke();

  // Main ring
  ctx.beginPath();
  ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
  ctx.strokeStyle = DEBUFF_COLORS.shockwave;
  ctx.lineWidth = ringThickness;
  ctx.globalAlpha = 1;
  ctx.stroke();

  // Inner highlight
  ctx.beginPath();
  ctx.arc(0, 0, currentRadius - ringThickness / 2, 0, Math.PI * 2);
  ctx.strokeStyle = DEBUFF_COLORS.shockwaveGlow;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.stroke();

  ctx.restore();
}

function drawDebuffIndicator(ctx: CanvasRenderingContext2D, unit: UnitRenderData): void {
  // Only draw if unit has shockwave debuff
  const hasShockwaveDebuff = unit.activeModifiers.some(
    (m) => m.sourceId === 'castle_death_shockwave'
  );
  if (!hasShockwaveDebuff) return;

  const { position, size, visualOffset } = unit;

  // Apply visual offset to match unit body position
  const renderX = position.x + (visualOffset?.x ?? 0);
  const renderY = position.y + (visualOffset?.y ?? 0);

  ctx.save();
  ctx.translate(renderX, renderY);

  // Position above health bar
  const iconY = -size - 32;
  const iconSize = 8;

  // Draw a small skull-like icon (simplified as X in circle)
  ctx.fillStyle = DEBUFF_COLORS.shockwave;
  ctx.strokeStyle = UI_COLORS.white;
  ctx.lineWidth = 1.5;

  // Circle background
  ctx.beginPath();
  ctx.arc(0, iconY, iconSize, 0, Math.PI * 2);
  ctx.fill();

  // X mark inside
  ctx.beginPath();
  ctx.moveTo(-iconSize * 0.5, iconY - iconSize * 0.5);
  ctx.lineTo(iconSize * 0.5, iconY + iconSize * 0.5);
  ctx.moveTo(iconSize * 0.5, iconY - iconSize * 0.5);
  ctx.lineTo(-iconSize * 0.5, iconY + iconSize * 0.5);
  ctx.stroke();

  ctx.restore();
}

function drawDamageNumber(
  ctx: CanvasRenderingContext2D,
  damageNumber: DamageNumberRenderData,
  arenaHeight: number
): void {
  const { position, amount, progress } = damageNumber;

  // Fade out as progress increases (0 = just spawned, 1 = about to disappear)
  const opacity = 1 - progress;
  if (opacity <= 0) return;

  // Scale font based on arena size
  const fontSize = scaleValue(BASE_DAMAGE_NUMBER_FONT_SIZE, arenaHeight);

  ctx.save();
  ctx.translate(position.x, position.y);

  // Scale up slightly at start, then normal
  const scaleProgress = Math.min(progress * 4, 1); // Quick scale-in over first 25% of lifetime
  const scale = 1 + (1 - scaleProgress) * 0.3; // Start at 1.3x, settle to 1x
  ctx.scale(scale, scale);

  ctx.globalAlpha = opacity;
  ctx.font = `bold ${Math.round(fontSize)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw text with outline for readability
  const text = String(amount);

  // Outline
  ctx.strokeStyle = ARENA_COLORS.damageNumberOutline;
  ctx.lineWidth = 3;
  ctx.strokeText(text, 0, 0);

  // Fill - red for all damage
  ctx.fillStyle = ARENA_COLORS.damageNumber;
  ctx.fillText(text, 0, 0);

  ctx.restore();
}

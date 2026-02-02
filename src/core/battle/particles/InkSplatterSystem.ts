/**
 * Ink Splatter System
 *
 * Core logic for ink splatter spawning and physics simulation.
 * Godot-portable: Uses pure functions and simple data structures.
 */

import {
  INK_SPLATTER_COUNT,
  INK_SPLATTER_SIZE_MIN,
  INK_SPLATTER_SIZE_MAX,
  INK_SPLATTER_SPREAD,
  INK_SPLATTER_LIFETIME,
  INK_HIT_SPLATTER_COUNT,
  INK_HIT_SPLATTER_SIZE_MIN,
  INK_HIT_SPLATTER_SIZE_MAX,
  INK_HIT_SPLATTER_DISTANCE,
  INK_HIT_SPLATTER_SPREAD,
  INK_HIT_SPLATTER_SPEED,
  INK_HIT_SPLATTER_UPWARD_VELOCITY,
  INK_SPLATTER_GRAVITY,
  INK_SPEED_MULTIPLIER_MEAN,
  INK_SPEED_MULTIPLIER_STDDEV,
  INK_SPEED_MULTIPLIER_MIN,
  INK_KNOCKBACK_DIRECTION_THRESHOLD,
} from '../BattleConfig';
import { randomMultiplier } from '../../utils/Random';

/**
 * Ink splatter particle - can be in-flight or landed.
 */
export interface InkSplatter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  lifetime: number;
  maxLifetime: number;
  landed: boolean;
  targetY: number;
}

/**
 * Unit data needed for splatter spawning.
 */
export interface InkSpawnUnit {
  id: string;
  position: { x: number; y: number };
  health: number;
  deathFadeTimer: number;
  visualOffset?: { x: number; y: number };
}

/**
 * State for tracking ink splatter spawning.
 */
export interface InkSpawnState {
  deadUnits: Set<string>;
  prevHealth: Map<string, number>;
}

/**
 * Create initial ink spawn state.
 */
export function createInkSpawnState(): InkSpawnState {
  return {
    deadUnits: new Set(),
    prevHealth: new Map(),
  };
}

/**
 * Clear all ink spawn state (for reset).
 */
export function clearInkSpawnState(state: InkSpawnState): void {
  state.deadUnits.clear();
  state.prevHealth.clear();
}

/**
 * Generate a random speed multiplier with normal distribution.
 */
function randomSpeedMultiplier(): number {
  return randomMultiplier(
    INK_SPEED_MULTIPLIER_MEAN,
    INK_SPEED_MULTIPLIER_STDDEV,
    INK_SPEED_MULTIPLIER_MIN
  );
}

/**
 * Spawn hit splatters when a unit takes damage.
 */
export function spawnHitSplatters(unit: InkSpawnUnit): InkSplatter[] {
  const splatters: InkSplatter[] = [];

  // Determine splatter direction from visualOffset (knockback direction)
  const offsetX = unit.visualOffset?.x ?? 0;
  const offsetY = unit.visualOffset?.y ?? 0;
  const offsetMag = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

  let baseAngle: number;
  if (offsetMag > INK_KNOCKBACK_DIRECTION_THRESHOLD) {
    // Splatter in the direction of knockback (away from attacker)
    baseAngle = Math.atan2(offsetY, offsetX);
  } else {
    // No clear direction, use random
    baseAngle = Math.random() * Math.PI * 2;
  }

  for (let i = 0; i < INK_HIT_SPLATTER_COUNT; i++) {
    const angle = baseAngle + (Math.random() - 0.5) * INK_HIT_SPLATTER_SPREAD;
    const speedMultiplier = randomSpeedMultiplier();
    const speed = INK_HIT_SPLATTER_SPEED * speedMultiplier;
    const targetDistance = INK_HIT_SPLATTER_DISTANCE * speedMultiplier;

    splatters.push({
      x: unit.position.x,
      y: unit.position.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + INK_HIT_SPLATTER_UPWARD_VELOCITY,
      size:
        INK_HIT_SPLATTER_SIZE_MIN +
        Math.random() * (INK_HIT_SPLATTER_SIZE_MAX - INK_HIT_SPLATTER_SIZE_MIN),
      rotation: Math.random() * Math.PI * 2,
      lifetime: INK_SPLATTER_LIFETIME,
      maxLifetime: INK_SPLATTER_LIFETIME,
      landed: false,
      targetY: unit.position.y + Math.sin(angle) * targetDistance + 10,
    });
  }

  return splatters;
}

/**
 * Spawn death splatters when a unit dies.
 */
export function spawnDeathSplatters(unit: InkSpawnUnit): InkSplatter[] {
  const splatters: InkSplatter[] = [];

  for (let i = 0; i < INK_SPLATTER_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * INK_SPLATTER_SPREAD;

    splatters.push({
      x: unit.position.x + Math.cos(angle) * distance,
      y: unit.position.y + Math.sin(angle) * distance,
      vx: 0,
      vy: 0,
      size: INK_SPLATTER_SIZE_MIN + Math.random() * (INK_SPLATTER_SIZE_MAX - INK_SPLATTER_SIZE_MIN),
      rotation: Math.random() * Math.PI * 2,
      lifetime: INK_SPLATTER_LIFETIME,
      maxLifetime: INK_SPLATTER_LIFETIME,
      landed: true,
      targetY: unit.position.y,
    });
  }

  return splatters;
}

/**
 * Update ink splatter physics (apply velocity, gravity, landing).
 */
export function updateInkSplatters(splatters: InkSplatter[], delta: number): void {
  for (const splatter of splatters) {
    if (!splatter.landed) {
      // Apply velocity
      splatter.x += splatter.vx * delta;
      splatter.y += splatter.vy * delta;

      // Apply gravity
      splatter.vy += INK_SPLATTER_GRAVITY * delta;

      // Check if landed (reached target Y or falling down past it)
      if (splatter.vy > 0 && splatter.y >= splatter.targetY) {
        splatter.landed = true;
        splatter.y = splatter.targetY;
        splatter.vx = 0;
        splatter.vy = 0;
      }
    }
  }
}

/**
 * Process units and spawn/update ink splatters.
 * Main entry point for ink splatter system.
 */
export function processInkSplatters(
  units: InkSpawnUnit[],
  splatters: InkSplatter[],
  spawnState: InkSpawnState,
  delta: number
): InkSplatter[] {
  const newSplatters: InkSplatter[] = [];

  for (const unit of units) {
    const prevHealth = spawnState.prevHealth.get(unit.id);
    const isDying = unit.deathFadeTimer >= 0;
    const wasAlreadyDead = spawnState.deadUnits.has(unit.id);

    // Check for hit (health decreased) - spawn directional splatters with velocity
    if (prevHealth !== undefined && unit.health < prevHealth && !isDying) {
      newSplatters.push(...spawnHitSplatters(unit));
    }

    // Check for death - spawn large splatters (already landed)
    if (isDying && !wasAlreadyDead) {
      spawnState.deadUnits.add(unit.id);
      newSplatters.push(...spawnDeathSplatters(unit));
    }

    // Update previous health
    spawnState.prevHealth.set(unit.id, unit.health);
  }

  // Combine existing and new splatters
  const allSplatters = [...splatters, ...newSplatters];

  // Update physics for in-flight splatters
  updateInkSplatters(allSplatters, delta);

  // Clean up units that are no longer in the array
  const currentUnitIds = new Set(units.map((u) => u.id));
  for (const id of spawnState.deadUnits) {
    if (!currentUnitIds.has(id)) {
      spawnState.deadUnits.delete(id);
    }
  }
  for (const id of spawnState.prevHealth.keys()) {
    if (!currentUnitIds.has(id)) {
      spawnState.prevHealth.delete(id);
    }
  }

  return allSplatters;
}

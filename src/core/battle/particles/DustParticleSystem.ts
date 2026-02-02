/**
 * Dust Particle System
 *
 * Core logic for dust particle spawning and physics simulation.
 * Godot-portable: Uses pure functions and simple data structures.
 */

import {
  DUST_SPAWN_INTERVAL,
  DUST_PARTICLE_LIFETIME,
  DUST_PARTICLE_GRAVITY,
  DUST_MOVEMENT_THRESHOLD,
  DUST_SPAWN_Y_OFFSET,
  DUST_HORIZONTAL_VELOCITY_RANGE,
  DUST_UPWARD_VELOCITY_BASE,
  DUST_UPWARD_VELOCITY_RANDOM,
} from '../BattleConfig';

/**
 * Dust particle data structure.
 */
export interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifetime: number;
  maxLifetime: number;
}

/**
 * Unit position data needed for dust spawning.
 */
export interface DustSpawnUnit {
  id: string;
  position: { x: number; y: number };
  size: number;
  deathFadeTimer: number;
}

/**
 * State for tracking dust spawning per unit.
 */
export interface DustSpawnState {
  lastSpawnTime: Map<string, number>;
  prevPositions: Map<string, { x: number; y: number }>;
}

/**
 * Create initial dust spawn state.
 */
export function createDustSpawnState(): DustSpawnState {
  return {
    lastSpawnTime: new Map(),
    prevPositions: new Map(),
  };
}

/**
 * Check if a unit is moving based on position change.
 */
export function isUnitMoving(
  unit: DustSpawnUnit,
  prevPos: { x: number; y: number } | undefined
): boolean {
  if (!prevPos) return false;
  const dx = Math.abs(unit.position.x - prevPos.x);
  const dy = Math.abs(unit.position.y - prevPos.y);
  return dx > DUST_MOVEMENT_THRESHOLD || dy > DUST_MOVEMENT_THRESHOLD;
}

/**
 * Spawn dust particles for a moving unit.
 */
export function spawnDustParticles(unit: DustSpawnUnit): DustParticle[] {
  const particles: DustParticle[] = [];
  const particleCount = 2 + Math.floor(Math.random() * 2);

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: unit.position.x + (Math.random() - 0.5) * unit.size * 2,
      y: unit.position.y + unit.size + DUST_SPAWN_Y_OFFSET,
      vx: (Math.random() - 0.5) * DUST_HORIZONTAL_VELOCITY_RANGE,
      vy: -Math.random() * DUST_UPWARD_VELOCITY_RANDOM - DUST_UPWARD_VELOCITY_BASE,
      lifetime: DUST_PARTICLE_LIFETIME,
      maxLifetime: DUST_PARTICLE_LIFETIME,
    });
  }

  return particles;
}

/**
 * Update dust particles physics (apply velocity and gravity).
 * Returns particles that are still alive.
 */
export function updateDustParticles(particles: DustParticle[], delta: number): DustParticle[] {
  return particles.filter((p) => {
    p.lifetime -= delta;
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.vy += DUST_PARTICLE_GRAVITY * delta;
    return p.lifetime > 0;
  });
}

/**
 * Process units and spawn/update dust particles.
 * Main entry point for dust particle system.
 */
export function processDustParticles(
  units: DustSpawnUnit[],
  particles: DustParticle[],
  spawnState: DustSpawnState,
  currentTime: number,
  delta: number
): DustParticle[] {
  const newParticles: DustParticle[] = [];

  // Spawn dust for moving units
  for (const unit of units) {
    if (unit.deathFadeTimer >= 0) continue; // Skip dying units

    const prevPos = spawnState.prevPositions.get(unit.id);
    const moving = isUnitMoving(unit, prevPos);

    // Update stored position
    spawnState.prevPositions.set(unit.id, {
      x: unit.position.x,
      y: unit.position.y,
    });

    if (moving) {
      const lastSpawn = spawnState.lastSpawnTime.get(unit.id) ?? 0;
      if (currentTime - lastSpawn > DUST_SPAWN_INTERVAL * 1000) {
        newParticles.push(...spawnDustParticles(unit));
        spawnState.lastSpawnTime.set(unit.id, currentTime);
      }
    }
  }

  // Update existing particles and add new ones
  const allParticles = [...particles, ...newParticles];
  return updateDustParticles(allParticles, delta);
}

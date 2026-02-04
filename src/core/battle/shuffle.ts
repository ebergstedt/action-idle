import { Vector2 } from '../physics/Vector2';
import {
  DEFAULT_SHUFFLE_CONFIG,
  ShuffleConfig,
  SHUFFLE_RANDOM_DIRECTION_MULTIPLIER,
} from './BattleConfig';

// Re-export for backward compatibility
export { DEFAULT_SHUFFLE_CONFIG } from './BattleConfig';
export type { ShuffleConfig } from './BattleConfig';

/**
 * Interface for objects that can be shuffled.
 * This is a minimal interface that both Unit and UnitEntity can satisfy.
 */
export interface Shuffleable {
  position: Vector2;
  stats: { moveSpeed: number };
  shuffleDirection: Vector2 | null;
  shuffleTimer: number;
}

// Generate a random time within a range
const randomInRange = (min: number, max: number): number => min + Math.random() * (max - min);

// Generate a new shuffle direction biased toward horizontal movement
export const generateShuffleDirection = (horizontalBias: number): Vector2 => {
  const x = (Math.random() - 0.5) * SHUFFLE_RANDOM_DIRECTION_MULTIPLIER * horizontalBias;
  const y = (Math.random() - 0.5) * SHUFFLE_RANDOM_DIRECTION_MULTIPLIER;
  return new Vector2(x, y).normalize();
};

// Decide the next shuffle action (move or pause) and set timer
export const decideNextShuffleAction = (
  unit: Shuffleable,
  config: ShuffleConfig = DEFAULT_SHUFFLE_CONFIG
): void => {
  if (Math.random() < config.moveProbability) {
    // Move in a random direction
    unit.shuffleDirection = generateShuffleDirection(config.horizontalBias);
    unit.shuffleTimer = randomInRange(config.moveTimeMin, config.moveTimeMax);
  } else {
    // Pause
    unit.shuffleDirection = null;
    unit.shuffleTimer = randomInRange(config.pauseTimeMin, config.pauseTimeMax);
  }
};

// Calculate shuffle movement for this frame
export const calculateShuffleMovement = (
  unit: Shuffleable,
  delta: number,
  config: ShuffleConfig = DEFAULT_SHUFFLE_CONFIG
): Vector2 => {
  if (!unit.shuffleDirection) {
    return Vector2.zero();
  }
  const speed = unit.stats.moveSpeed * config.speedMultiplier;
  return unit.shuffleDirection.multiply(speed * delta);
};

// Update shuffle state and return movement to apply
export const updateShuffle = (
  unit: Shuffleable,
  delta: number,
  config: ShuffleConfig = DEFAULT_SHUFFLE_CONFIG
): Vector2 => {
  unit.shuffleTimer -= delta;

  // Timer expired - decide next action
  if (unit.shuffleTimer <= 0) {
    decideNextShuffleAction(unit, config);
  }

  return calculateShuffleMovement(unit, delta, config);
};

// Apply shuffle to unit position (convenience function)
export const applyShuffle = (
  unit: Shuffleable,
  delta: number,
  config: ShuffleConfig = DEFAULT_SHUFFLE_CONFIG
): void => {
  const movement = updateShuffle(unit, delta, config);
  unit.position = unit.position.add(movement);
};

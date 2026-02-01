import { Vector2 } from '../physics/Vector2';
import { Unit } from './types';

// Shuffle configuration
export interface ShuffleConfig {
  horizontalBias: number; // How much to favor side-to-side movement
  moveTimeMin: number; // Min seconds to move in one direction
  moveTimeMax: number; // Max seconds to move in one direction
  pauseTimeMin: number; // Min seconds to pause between shuffles
  pauseTimeMax: number; // Max seconds to pause between shuffles
  speedMultiplier: number; // Fraction of unit's moveSpeed to use
  moveProbability: number; // Chance to move vs pause (0-1)
}

export const DEFAULT_SHUFFLE_CONFIG: ShuffleConfig = {
  horizontalBias: 3,
  moveTimeMin: 0.15,
  moveTimeMax: 0.4,
  pauseTimeMin: 0.1,
  pauseTimeMax: 0.3,
  speedMultiplier: 0.25,
  moveProbability: 0.6,
};

// Generate a random time within a range
const randomInRange = (min: number, max: number): number => min + Math.random() * (max - min);

// Generate a new shuffle direction biased toward horizontal movement
export const generateShuffleDirection = (horizontalBias: number): Vector2 => {
  const x = (Math.random() - 0.5) * 2 * horizontalBias;
  const y = (Math.random() - 0.5) * 2;
  return new Vector2(x, y).normalize();
};

// Decide the next shuffle action (move or pause) and set timer
export const decideNextShuffleAction = (
  unit: Unit,
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
  unit: Unit,
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
  unit: Unit,
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
  unit: Unit,
  delta: number,
  config: ShuffleConfig = DEFAULT_SHUFFLE_CONFIG
): void => {
  const movement = updateShuffle(unit, delta, config);
  unit.position = unit.position.add(movement);
};

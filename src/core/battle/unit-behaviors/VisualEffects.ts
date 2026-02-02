/**
 * Visual Effects System
 *
 * Pure functions for visual effects: knockback, lunge, walk animation.
 * No side effects - returns new state.
 *
 * Godot equivalent: Animation/visual effects functions in a unit script.
 */

import { Vector2 } from '../../physics/Vector2';
import {
  MIN_VISUAL_OFFSET_THRESHOLD,
  MELEE_OFFSET_DECAY_RATE,
  WALK_ANIMATION_WRAP_TIME,
} from '../BattleConfig';
import { VisualState, VisualResult } from './types';

/**
 * Decay visual offset (lunge/knockback) toward zero.
 * Uses exponential decay for smooth motion.
 *
 * @param visualOffset - Current visual offset
 * @param delta - Frame delta in seconds
 * @returns New visual offset
 */
export function decayVisualOffset(visualOffset: Vector2, delta: number): Vector2 {
  const magnitude = visualOffset.magnitude();
  if (magnitude < MIN_VISUAL_OFFSET_THRESHOLD) {
    return Vector2.zero();
  }
  // Exponential decay
  const decay = Math.exp(-MELEE_OFFSET_DECAY_RATE * delta);
  return visualOffset.multiply(decay);
}

/**
 * Advance walk animation time.
 * Wraps around to prevent floating point issues over long sessions.
 *
 * @param walkAnimationTime - Current animation time
 * @param delta - Frame delta in seconds
 * @returns New animation time
 */
export function advanceWalkAnimation(walkAnimationTime: number, delta: number): number {
  let newTime = walkAnimationTime + delta;
  if (newTime > WALK_ANIMATION_WRAP_TIME) {
    newTime -= WALK_ANIMATION_WRAP_TIME;
  }
  return newTime;
}

/**
 * Reset walk animation to idle state.
 * Call when unit stops moving.
 *
 * @returns Reset animation time (0)
 */
export function resetWalkAnimation(): number {
  return 0;
}

/**
 * Apply knockback to visual offset.
 * Used when unit is hit by melee attack.
 *
 * @param currentOffset - Current visual offset
 * @param direction - Direction of knockback (will be normalized)
 * @param distance - Knockback distance
 * @returns New visual offset with knockback applied
 */
export function applyKnockback(
  currentOffset: Vector2,
  direction: Vector2,
  distance: number
): Vector2 {
  const knockback = direction.normalize().multiply(distance);
  return currentOffset.add(knockback);
}

/**
 * Apply lunge (forward movement visualization for attacks).
 * Used when unit performs melee attack.
 *
 * @param currentOffset - Current visual offset
 * @param direction - Direction of attack (toward target)
 * @param distance - Lunge distance
 * @returns New visual offset with lunge applied
 */
export function applyLunge(currentOffset: Vector2, direction: Vector2, distance: number): Vector2 {
  const lunge = direction.normalize().multiply(distance);
  return currentOffset.add(lunge);
}

/**
 * Update all visual effects for a frame.
 * Convenience function combining offset decay and animation.
 *
 * @param state - Current visual state
 * @param delta - Frame delta in seconds
 * @param isMoving - Whether the unit is currently moving
 * @returns Updated visual state
 */
export function updateVisualEffects(
  state: VisualState,
  delta: number,
  isMoving: boolean
): VisualResult {
  const visualOffset = decayVisualOffset(state.visualOffset, delta);
  const walkAnimationTime = isMoving
    ? advanceWalkAnimation(state.walkAnimationTime, delta)
    : resetWalkAnimation();

  return {
    visualOffset,
    walkAnimationTime,
  };
}

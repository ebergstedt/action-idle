/**
 * Walk Animation Registry
 *
 * Maps animation type IDs to their compute functions.
 * Unit definitions specify which animation to use by ID.
 *
 * Godot equivalent: Resource registry or Autoload
 */

import { WalkAnimationState, NULL_WALK_ANIMATION_STATE } from './IWalkAnimation';
import { BounceWalkAnimation } from './BounceWalkAnimation';

/**
 * Function signature for computing walk animation state from time.
 */
export type WalkAnimationComputer = (time: number, unitSize: number) => WalkAnimationState;

/**
 * Registry of available walk animations.
 * Add new animations here as they're created.
 */
const animations: Record<string, WalkAnimationComputer> = {
  none: () => NULL_WALK_ANIMATION_STATE,
  bounce: BounceWalkAnimation.computeStateFromTime,
};

/**
 * Default animation used when none is specified.
 */
export const DEFAULT_WALK_ANIMATION = 'bounce';

/**
 * Get a walk animation compute function by ID.
 * Returns the 'none' animation if ID is not found.
 */
export function getWalkAnimation(animationId: string): WalkAnimationComputer {
  return animations[animationId] ?? animations.none;
}

/**
 * Compute walk animation state for a given animation type.
 * Convenience function that combines lookup and computation.
 */
export function computeWalkAnimationState(
  animationId: string,
  time: number,
  unitSize: number
): WalkAnimationState {
  const compute = getWalkAnimation(animationId);
  return compute(time, unitSize);
}

/**
 * Register a new walk animation type.
 * Used for adding custom animations at runtime.
 */
export function registerWalkAnimation(id: string, compute: WalkAnimationComputer): void {
  animations[id] = compute;
}

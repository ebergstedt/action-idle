/**
 * Animation System Exports
 *
 * Modular walk/movement animations for units.
 */

export type { IWalkAnimation, WalkAnimationState } from './IWalkAnimation';
export { NULL_WALK_ANIMATION_STATE } from './IWalkAnimation';
export { BounceWalkAnimation } from './BounceWalkAnimation';
export type { WalkAnimationComputer } from './WalkAnimationRegistry';
export {
  getWalkAnimation,
  computeWalkAnimationState,
  registerWalkAnimation,
  DEFAULT_WALK_ANIMATION,
} from './WalkAnimationRegistry';

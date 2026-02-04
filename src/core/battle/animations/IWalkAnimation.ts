/**
 * Walk Animation Types
 *
 * Type definitions for walk/movement animations.
 *
 * Godot equivalent: AnimationPlayer or custom animation resource
 */

/**
 * Animation state output - describes visual transforms to apply during rendering.
 * All values are relative to the base unit state.
 */
export interface WalkAnimationState {
  /** Vertical offset (negative = up) in pixels, scaled by unit size */
  offsetY: number;
  /** Horizontal scale multiplier (1.0 = normal) */
  scaleX: number;
  /** Vertical scale multiplier (1.0 = normal) */
  scaleY: number;
}

/**
 * Null/identity animation - no visual effect.
 * Used for stationary units or as a fallback.
 */
export const NULL_WALK_ANIMATION_STATE: WalkAnimationState = {
  offsetY: 0,
  scaleX: 1,
  scaleY: 1,
};

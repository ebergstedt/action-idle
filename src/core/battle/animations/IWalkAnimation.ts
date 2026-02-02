/**
 * Walk Animation Interface
 *
 * Defines the contract for walk/movement animations.
 * Different animation styles can implement this interface.
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
 * Interface for walk animation implementations.
 * Animations track their own phase and compute visual state.
 */
export interface IWalkAnimation {
  /**
   * Advance the animation by delta time while moving.
   * @param delta - Time elapsed in seconds
   */
  advance(delta: number): void;

  /**
   * Get current animation state for rendering.
   * @param unitSize - The unit's base size (for scaling offsets)
   * @returns Animation state with offsets and scales
   */
  getState(unitSize: number): WalkAnimationState;

  /**
   * Get the current phase value (for serialization/render data).
   */
  getPhase(): number;

  /**
   * Set the phase value (for deserialization).
   */
  setPhase(phase: number): void;
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

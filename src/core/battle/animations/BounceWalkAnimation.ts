/**
 * Bounce Walk Animation
 *
 * Makes units bounce up and down while walking, with squash/stretch
 * deformation like a bouncing ball hitting the ground.
 *
 * Godot equivalent: AnimationPlayer with squash-stretch keyframes
 */

import {
  BOUNCE_FREQUENCY,
  BOUNCE_HEIGHT_MULTIPLIER,
  BOUNCE_SQUASH_STRETCH_X,
  BOUNCE_SQUASH_STRETCH_Y,
} from '../BattleConfig';
import { IWalkAnimation, WalkAnimationState, NULL_WALK_ANIMATION_STATE } from './IWalkAnimation';

/**
 * Bouncy walk animation with squash and stretch.
 */
export class BounceWalkAnimation implements IWalkAnimation {
  private phase: number = 0;

  /**
   * Advance the bounce animation by delta time.
   */
  advance(delta: number): void {
    this.phase += delta * BOUNCE_FREQUENCY * Math.PI * 2;
    // Keep phase in reasonable range to prevent floating point issues
    if (this.phase > Math.PI * 2) {
      this.phase -= Math.PI * 2;
    }
  }

  /**
   * Get the current animation state.
   */
  getState(unitSize: number): WalkAnimationState {
    return BounceWalkAnimation.computeState(this.phase, unitSize);
  }

  getPhase(): number {
    return this.phase;
  }

  setPhase(phase: number): void {
    this.phase = phase;
  }

  /**
   * Compute animation state from elapsed time.
   * This is the main entry point for external callers using generic time.
   *
   * @param time - Elapsed animation time in seconds
   * @param unitSize - The unit's base size (for scaling offsets)
   * @returns Animation state with offsets and scales
   */
  static computeStateFromTime(time: number, unitSize: number): WalkAnimationState {
    // Convert time to phase using our frequency
    const phase = time * BOUNCE_FREQUENCY * Math.PI * 2;
    return BounceWalkAnimation.computeState(phase, unitSize);
  }

  /**
   * Compute animation state from a phase value.
   *
   * Uses |sin| for bounce height (always positive, two bounces per cycle).
   * Squash/stretch is applied at the "ground" points (phase = 0, π, 2π).
   *
   * @param phase - Animation phase in radians
   * @param unitSize - The unit's base size (for scaling offsets)
   * @returns Animation state with offsets and scales
   */
  static computeState(phase: number, unitSize: number): WalkAnimationState {
    // If phase is 0 (stationary), return identity state
    if (phase === 0) {
      return NULL_WALK_ANIMATION_STATE;
    }

    // Bounce height: use absolute sine for smooth bounce
    // |sin(phase)| gives us 0 at ground, 1 at peak, twice per cycle
    const bounceProgress = Math.abs(Math.sin(phase));

    // Vertical offset (negative = up from ground)
    const bounceHeight = unitSize * BOUNCE_HEIGHT_MULTIPLIER;
    const offsetY = -bounceProgress * bounceHeight;

    // Squash/stretch: inverse of bounce progress
    // At ground (bounceProgress = 0): maximum squash
    // At peak (bounceProgress = 1): normal shape
    const squashAmount = 1 - bounceProgress;

    // Interpolate between normal (1.0) and squash values
    const scaleX = 1 + squashAmount * (BOUNCE_SQUASH_STRETCH_X - 1);
    const scaleY = 1 + squashAmount * (BOUNCE_SQUASH_STRETCH_Y - 1);

    return { offsetY, scaleX, scaleY };
  }
}

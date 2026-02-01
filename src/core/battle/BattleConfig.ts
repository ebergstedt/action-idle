/**
 * Battle Configuration
 *
 * Centralized configuration for all battle system constants.
 * All magic numbers should be defined here for easy tuning.
 *
 * Godot equivalent: Resource file or Autoload with exported variables
 */

// =============================================================================
// UNIT SPACING & SEPARATION
// =============================================================================

/**
 * Multiplier for minimum distance between units.
 * minDist = (unitA.size + unitB.size) * UNIT_SPACING
 */
export const UNIT_SPACING = 1.2;

/**
 * Force applied to separate overlapping allied units during movement.
 */
export const ALLY_AVOIDANCE_FORCE = 80;

/**
 * Force applied to separate overlapping units in BattleWorld.
 */
export const SEPARATION_FORCE = 150;

// =============================================================================
// ARENA CONFIGURATION
// =============================================================================

/**
 * Default margin from arena edges for entity bounds.
 */
export const DEFAULT_ARENA_MARGIN = 10;

/**
 * Percentage of arena height used for each deployment zone.
 * 0.25 = 25% for allied zone (bottom), 25% for enemy zone (top).
 */
export const ZONE_HEIGHT_PERCENT = 0.25;

// =============================================================================
// PROJECTILE CONFIGURATION
// =============================================================================

/**
 * Default projectile travel speed (pixels per second).
 */
export const PROJECTILE_SPEED = 300;

/**
 * Distance from target at which projectile is considered to have hit.
 */
export const PROJECTILE_HIT_RADIUS = 10;

/**
 * Radius around impact point that receives splash damage.
 */
export const PROJECTILE_SPLASH_RADIUS = 15;

// =============================================================================
// COMBAT SHUFFLE CONFIGURATION
// =============================================================================

/**
 * Configuration for melee combat shuffle behavior.
 */
export interface ShuffleConfig {
  /** How much to favor side-to-side movement (higher = more horizontal) */
  horizontalBias: number;
  /** Minimum seconds to move in one direction */
  moveTimeMin: number;
  /** Maximum seconds to move in one direction */
  moveTimeMax: number;
  /** Minimum seconds to pause between shuffles */
  pauseTimeMin: number;
  /** Maximum seconds to pause between shuffles */
  pauseTimeMax: number;
  /** Fraction of unit's moveSpeed to use for shuffle (0-1) */
  speedMultiplier: number;
  /** Chance to move vs pause (0-1) */
  moveProbability: number;
}

/**
 * Default shuffle configuration for melee combat.
 */
export const DEFAULT_SHUFFLE_CONFIG: ShuffleConfig = {
  horizontalBias: 3,
  moveTimeMin: 0.15,
  moveTimeMax: 0.4,
  pauseTimeMin: 0.1,
  pauseTimeMax: 0.3,
  speedMultiplier: 0.25,
  moveProbability: 0.6,
};

// =============================================================================
// TARGETING & COMBAT
// =============================================================================

/**
 * Bonus score for targeting enemies already being attacked (focus fire).
 */
export const FOCUS_FIRE_BONUS = 50;

/**
 * Maximum allies targeting same enemy before focus fire bonus stops.
 */
export const MAX_FOCUS_FIRE_ALLIES = 3;

/**
 * Penalty for targeting enemies behind other units (for ranged).
 */
export const BLOCKED_TARGET_PENALTY = 100;

/**
 * Extra range buffer for melee attack mode determination.
 */
export const MELEE_RANGE_BUFFER = 20;

/**
 * Attack range threshold to classify as melee (vs ranged).
 * Attacks with range <= this value are considered melee.
 */
export const MELEE_ATTACK_RANGE_THRESHOLD = 50;

// =============================================================================
// DRAG & SELECTION
// =============================================================================

/**
 * Maximum iterations for resolving unit overlaps during drag.
 */
export const DRAG_OVERLAP_ITERATIONS = 20;

/**
 * Minimum drag distance (squared) to register as a drag vs click.
 */
export const MIN_DRAG_DISTANCE_SQUARED = 25;

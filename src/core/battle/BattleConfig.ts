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
 * Base force applied to separate overlapping allied units during movement.
 * Scaled by arena size at runtime.
 */
export const BASE_ALLY_AVOIDANCE_FORCE = 80;

/**
 * Base force applied to separate overlapping units in BattleWorld.
 * Scaled by arena size at runtime.
 */
export const BASE_SEPARATION_FORCE = 150;

// =============================================================================
// ARENA CONFIGURATION
// =============================================================================

/**
 * Minimum arena width in pixels.
 */
export const MIN_ARENA_WIDTH = 600;

/**
 * Minimum arena height in pixels.
 */
export const MIN_ARENA_HEIGHT = 400;

/**
 * Arena height as a fraction of width (aspect ratio).
 * 0.65 = height is 65% of width for a wide tactical view.
 */
export const ARENA_ASPECT_RATIO = 0.65;

/**
 * Default margin from arena edges for entity bounds.
 */
export const DEFAULT_ARENA_MARGIN = 10;

/**
 * Percentage of arena height used for each deployment zone.
 * 0.375 = 37.5% for allied zone (bottom), 37.5% for enemy zone (top).
 */
export const ZONE_HEIGHT_PERCENT = 0.375;

// =============================================================================
// FRAME TIMING
// =============================================================================

/**
 * Maximum frame delta time in seconds.
 * Prevents huge simulation jumps when returning from inactive tab.
 * 0.1 = 100ms = ~6 frames at 60fps max per update.
 */
export const MAX_FRAME_DELTA = 0.1;

// =============================================================================
// VISUAL EFFECTS - PARCHMENT THEME
// =============================================================================

/**
 * Vignette intensity at the edges (0-1).
 * Higher = darker corners.
 */
export const VIGNETTE_INTENSITY = 0.35;

/**
 * Vignette radius as fraction of arena diagonal.
 * Lower = vignette starts closer to center.
 */
export const VIGNETTE_RADIUS = 0.7;

/**
 * Parchment noise density (dots per 10000 pixels).
 * Higher = more visible texture.
 */
export const PARCHMENT_NOISE_DENSITY = 15;

/**
 * Parchment noise opacity (0-1).
 * Subtle is better - this just adds texture.
 */
export const PARCHMENT_NOISE_OPACITY = 0.08;

/**
 * Parchment noise dot size range [min, max] in pixels.
 */
export const PARCHMENT_NOISE_SIZE_MIN = 1;
export const PARCHMENT_NOISE_SIZE_MAX = 2.5;

// =============================================================================
// PROJECTILE CONFIGURATION
// =============================================================================

/**
 * Base projectile travel speed (pixels per second).
 * Scaled by arena size at runtime.
 */
export const BASE_PROJECTILE_SPEED = 300;

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

// =============================================================================
// UNIT AI & TARGETING
// =============================================================================

/**
 * Base radius within which units will acquire targets while advancing.
 * Scaled by arena size at runtime.
 */
export const BASE_AGGRO_RADIUS = 150;

/**
 * How much closer a new target must be to cause target switch.
 * 0.7 = new target must be 70% the distance of current target (30% closer).
 * Lower value = more sticky targeting, higher value = more responsive.
 */
export const TARGET_SWITCH_DISTANCE_RATIO = 0.7;

/**
 * Cooldown in seconds before a unit can switch to a closer target.
 * Prevents "indecisive" behavior where units flip-flop between targets.
 */
export const TARGET_SWITCH_COOLDOWN_SECONDS = 2.0;

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
// CASTLE CONFIGURATION
// =============================================================================

/**
 * Default castle health.
 * Set to 1 so castles die in one hit.
 */
export const CASTLE_MAX_HEALTH = 1;

/**
 * Castle visual size (radius for rendering).
 */
export const CASTLE_SIZE = 14;

/**
 * Base horizontal offset from arena edge for castle placement.
 * Scaled by arena size at runtime.
 */
export const BASE_CASTLE_HORIZONTAL_MARGIN = 300;

// =============================================================================
// SEPARATION & COLLISION
// =============================================================================

/**
 * Push multiplier when allied units overlap.
 * Higher value = stronger push.
 */
export const ALLY_PUSH_MULTIPLIER = 0.5;

/**
 * Push multiplier when enemy units overlap.
 * Lower than allies so enemies can engage in melee.
 */
export const ENEMY_PUSH_MULTIPLIER = 0.3;

/**
 * Multiplier for path blocking detection radius.
 * Used in isPathBlocked() to check if allies are in the way.
 */
export const PATH_BLOCK_RADIUS_MULTIPLIER = 1.5;

// =============================================================================
// MOVEMENT AI
// =============================================================================

/**
 * Minimum distance to target before stopping movement.
 * Below this distance, unit considers itself "at" the target.
 */
export const MIN_MOVE_DISTANCE = 1;

/**
 * Multiplier for direction check distance.
 * Used when checking if a perpendicular direction is clear of allies.
 */
export const DIRECTION_CHECK_MULTIPLIER = 3;

/**
 * Dot product threshold for determining if ally is blocking path.
 * Higher value = must be more directly in front to trigger avoidance.
 */
export const PATH_DOT_THRESHOLD = 0.3;

// =============================================================================
// SCALING SYSTEM
// =============================================================================

/**
 * Reference arena height for scaling all pixel-based values.
 * All base values are tuned for this arena height.
 */
export const REFERENCE_ARENA_HEIGHT = 600;

/**
 * Minimum scale factor to prevent things from getting too small.
 */
export const MIN_SCALE = 0.8;

/**
 * Maximum scale factor to prevent things from getting too large.
 */
export const MAX_SCALE = 2.5;

/**
 * Calculate scale factor based on arena height.
 * @param arenaHeight - Current arena height in pixels
 * @returns Scale factor clamped between MIN_SCALE and MAX_SCALE
 */
export function getScaleFactor(arenaHeight: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, arenaHeight / REFERENCE_ARENA_HEIGHT));
}

/**
 * Scale a pixel-based value for the current arena size.
 * Use this for distances, speeds, forces, margins, etc.
 * @param baseValue - Value tuned for REFERENCE_ARENA_HEIGHT
 * @param arenaHeight - Current arena height in pixels
 * @returns Scaled value
 */
export function scaleValue(baseValue: number, arenaHeight: number): number {
  return baseValue * getScaleFactor(arenaHeight);
}

/**
 * Scale a pixel-based value and round to integer.
 * Use this for sizes, margins, and other values that should be whole numbers.
 */
export function scaleValueInt(baseValue: number, arenaHeight: number): number {
  return Math.round(scaleValue(baseValue, arenaHeight));
}

// Aliases for backward compatibility
export const MIN_UNIT_SCALE = MIN_SCALE;
export const MAX_UNIT_SCALE = MAX_SCALE;

// =============================================================================
// DRAG & SELECTION
// =============================================================================

/**
 * Maximum iterations for resolving unit overlaps during drag.
 */
export const DRAG_OVERLAP_ITERATIONS = 20;

/**
 * Margin from arena edges when defining drag bounds for unit placement.
 */
export const DRAG_BOUNDS_MARGIN = 20;

/**
 * Minimum drag distance (squared) to register as a drag vs click.
 */
export const MIN_DRAG_DISTANCE_SQUARED = 25;

/**
 * Minimum box select size (pixels) to be considered a real selection vs click.
 */
export const MIN_BOX_SELECT_SIZE = 10;

/**
 * Padding added to unit hitbox for click detection (pixels).
 */
export const HITBOX_PADDING = 12;

// =============================================================================
// FORMATION CONFIGURATION
// =============================================================================

/**
 * Margin from arena edges for spawn zones (pixels).
 */
export const FORMATION_SPAWN_MARGIN = 30;

/**
 * Width scale factor for formation spread (fraction of available width).
 */
export const FORMATION_WIDTH_SCALE = 0.4;

/**
 * Height scale factor for formation spread (fraction of zone height).
 */
export const FORMATION_HEIGHT_SCALE = 0.6;

/**
 * Position of formation center within ally zone (0 = top, 1 = bottom).
 * 0.3 = positioned toward the front (enemy side) of the zone.
 */
export const FORMATION_CENTER_OFFSET = 0.3;

/**
 * Maximum columns for enemy grid spawn layout.
 */
export const ENEMY_SPAWN_MAX_COLS = 4;

/**
 * Jitter factor for enemy spawn positions (fraction of cell size).
 * 0.6 = 60% random offset from grid center.
 */
export const ENEMY_SPAWN_JITTER = 0.6;

// =============================================================================
// OVERLAP RESOLUTION
// =============================================================================

/**
 * Maximum iterations for finding non-overlapping position during unit drag.
 */
export const DRAG_POSITION_MAX_ITERATIONS = 10;

/**
 * Margin from arena edge when clamping units to deployment zones.
 */
export const ZONE_CLAMP_MARGIN = 20;

/**
 * Overlap push factor - how much to push overlapping units apart.
 * 0.5 = each unit moves half the overlap distance.
 */
export const OVERLAP_PUSH_FACTOR = 0.5;

/**
 * Base push amount added to overlap resolution.
 * Ensures small overlaps still result in some separation.
 */
export const OVERLAP_BASE_PUSH = 1;

/**
 * Minimum distance threshold for calculating push direction.
 * Below this, use random direction to avoid division by near-zero.
 */
export const MIN_SEPARATION_DISTANCE = 0.1;

/**
 * Center offset for random direction generation.
 * Used as (Math.random() - CENTER) to get values in range [-0.5, 0.5].
 */
export const RANDOM_DIRECTION_CENTER = 0.5;

// =============================================================================
// ABILITY SYSTEM DEFAULTS
// =============================================================================

/**
 * Default health threshold for "health_below" trigger (25%).
 */
export const DEFAULT_HEALTH_BELOW_THRESHOLD = 0.25;

/**
 * Default health threshold for "health_above" trigger (75%).
 */
export const DEFAULT_HEALTH_ABOVE_THRESHOLD = 0.75;

/**
 * Base range for "nearby" ability targets (pixels).
 * Scaled by arena size at runtime.
 */
export const BASE_ABILITY_RANGE = 100;

// =============================================================================
// DAMAGE CALCULATION
// =============================================================================

/**
 * Minimum damage dealt after armor reduction.
 * Ensures all attacks deal at least this much damage.
 */
export const MIN_DAMAGE_AFTER_ARMOR = 1;

// =============================================================================
// MELEE COMBAT
// =============================================================================

/**
 * Multiplier for unit size when calculating melee effective range.
 * meleeRange = attackRange + unitSize * MELEE_SIZE_MULTIPLIER
 */
export const MELEE_SIZE_MULTIPLIER = 2;

/**
 * Distance the attacker lunges forward on melee hit (pixels).
 * Scaled by arena size at runtime.
 */
export const BASE_MELEE_LUNGE_DISTANCE = 8;

/**
 * Distance the target is knocked back on melee hit (pixels).
 * Scaled by arena size at runtime.
 */
export const BASE_MELEE_KNOCKBACK_DISTANCE = 6;

/**
 * How quickly the lunge/knockback offset decays back to zero.
 * Higher value = faster recovery. Value of 10 means ~0.1s to decay.
 */
export const MELEE_OFFSET_DECAY_RATE = 12;

/**
 * Duration of the hit flash effect in seconds.
 * Unit flashes white/red briefly when taking damage.
 */
export const HIT_FLASH_DURATION = 0.15;

/**
 * Duration of the death fade effect in seconds.
 * Unit fades out and shrinks when dying.
 */
export const DEATH_FADE_DURATION = 0.4;

/**
 * Duration of floating damage numbers in seconds.
 */
export const DAMAGE_NUMBER_DURATION = 0.8;

/**
 * How far damage numbers float upward (pixels).
 * Scaled by arena size at runtime.
 */
export const BASE_DAMAGE_NUMBER_FLOAT_DISTANCE = 40;

/**
 * Base font size for damage numbers (pixels).
 * Scaled by arena size at runtime.
 */
export const BASE_DAMAGE_NUMBER_FONT_SIZE = 16;

/**
 * Base length of projectile trail in pixels.
 * Scaled by arena size at runtime.
 */
export const BASE_PROJECTILE_TRAIL_LENGTH = 25;

/**
 * Width of projectile trail at its widest point (near projectile).
 */
export const PROJECTILE_TRAIL_WIDTH = 4;

/**
 * Unit shadow offset (pixels down and right from unit center).
 */
export const UNIT_SHADOW_OFFSET = 4;

/**
 * Unit shadow opacity (0-1).
 */
export const UNIT_SHADOW_OPACITY = 0.35;

/**
 * Selection ring pulse speed (cycles per second).
 * 0.333 = one full cycle every 3 seconds.
 */
export const SELECTION_PULSE_SPEED = 1 / 3;

/**
 * Selection ring pulse intensity (how much the ring grows/shrinks).
 * 0.08 = +/- 8% size variation.
 */
export const SELECTION_PULSE_INTENSITY = 0.08;

/**
 * Dust particle lifetime in seconds.
 */
export const DUST_PARTICLE_LIFETIME = 0.4;

/**
 * Dust particle spawn interval in seconds (how often moving units spawn dust).
 */
export const DUST_SPAWN_INTERVAL = 0.15;

/**
 * Base dust particle size in pixels.
 */
export const DUST_PARTICLE_SIZE = 3;

/**
 * Multiplier for ally avoidance distance check during movement.
 * Units avoid allies within (minDist * this value).
 */
export const ALLY_AVOIDANCE_DISTANCE_MULTIPLIER = 2;

// =============================================================================
// SHOCKWAVE CONFIGURATION
// =============================================================================

/**
 * Base shockwave expansion speed in pixels per second.
 * Scaled by arena size at runtime.
 */
export const BASE_SHOCKWAVE_EXPANSION_SPEED = 120;

/**
 * Fallback maximum radius if arena bounds aren't available.
 * Normally calculated dynamically based on arena diagonal.
 */
export const SHOCKWAVE_MAX_RADIUS_FALLBACK = 2000;

/**
 * Movement speed debuff applied by shockwave (-0.9 = -90% speed).
 */
export const SHOCKWAVE_DEBUFF_MOVE_SPEED = -0.9;

/**
 * Damage debuff applied by shockwave (-0.9 = -90% damage).
 */
export const SHOCKWAVE_DEBUFF_DAMAGE = -0.9;

/**
 * Duration of shockwave debuff in seconds.
 */
export const SHOCKWAVE_DEBUFF_DURATION_SECONDS = 15;

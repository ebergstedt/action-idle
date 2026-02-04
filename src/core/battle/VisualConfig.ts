/**
 * Visual Configuration
 *
 * Centralized configuration for visual/rendering constants.
 * Separated from BattleConfig to organize visual effects independently from gameplay mechanics.
 *
 * Godot equivalent: Resource file for visual settings or Theme resource
 */

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

/**
 * Spacing between horizontal ruled lines on parchment background (pixels).
 */
export const PARCHMENT_LINE_SPACING = 40;

/**
 * Vignette color RGB values (sepia/brown tone for parchment edges).
 */
export const VIGNETTE_COLOR = { r: 60, g: 40, b: 20 };

// =============================================================================
// INK SPLATTER CONFIGURATION
// =============================================================================

/**
 * Number of ink splatter particles spawned on unit death.
 */
export const INK_SPLATTER_COUNT = 8;

/**
 * Ink splatter particle size range [min, max] in pixels.
 */
export const INK_SPLATTER_SIZE_MIN = 2;
export const INK_SPLATTER_SIZE_MAX = 8;

/**
 * Ink splatter spread radius from death position.
 */
export const INK_SPLATTER_SPREAD = 15;

/**
 * Ink splatter lifetime in seconds before fading.
 */
export const INK_SPLATTER_LIFETIME = 3.0;

/**
 * Ink splatter base opacity. Reduced for AC6 aesthetic
 * to create subtle team-colored debris marks.
 * - 1 splatter: 0.25 opacity
 * - 2 overlapping: ~0.44 opacity
 * - 3 overlapping: ~0.58 opacity
 */
export const INK_SPLATTER_OPACITY = 0.25;

/**
 * Ink splatter gravity (pixels per second squared).
 */
export const INK_SPLATTER_GRAVITY = 350;

/**
 * Number of ink splatter particles spawned on hit.
 */
export const INK_HIT_SPLATTER_COUNT = 3;

/**
 * Ink hit splatter size range [min, max] in pixels.
 */
export const INK_HIT_SPLATTER_SIZE_MIN = 1;
export const INK_HIT_SPLATTER_SIZE_MAX = 3;

/**
 * Ink hit splatter spray distance from unit.
 */
export const INK_HIT_SPLATTER_DISTANCE = 10;

/**
 * Ink hit splatter spray angle spread (radians).
 */
export const INK_HIT_SPLATTER_SPREAD = 0.8;

/**
 * Ink hit splatter initial speed (pixels per second).
 */
export const INK_HIT_SPLATTER_SPEED = 80;

/**
 * Initial upward velocity component for ink hit splatters (pixels per second).
 */
export const INK_HIT_SPLATTER_UPWARD_VELOCITY = -40;

// =============================================================================
// INK SPLATTER PHYSICS
// =============================================================================

/**
 * Mean speed multiplier for ink splatter particles.
 * Center of normal distribution for particle speed variation.
 */
export const INK_SPEED_MULTIPLIER_MEAN = 0.8;

/**
 * Standard deviation for ink splatter speed multiplier.
 * Controls how much particle speeds vary from the mean.
 */
export const INK_SPEED_MULTIPLIER_STDDEV = 0.25;

/**
 * Minimum speed multiplier for ink splatter particles.
 * Prevents negative or extremely slow particles.
 */
export const INK_SPEED_MULTIPLIER_MIN = 0.3;

/**
 * Minimum knockback magnitude to determine splatter direction.
 * Below this, use random direction instead.
 */
export const INK_KNOCKBACK_DIRECTION_THRESHOLD = 0.1;

// =============================================================================
// DUST PARTICLE CONFIGURATION
// =============================================================================

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
 * Gravity applied to dust particles (pixels per second squared).
 */
export const DUST_PARTICLE_GRAVITY = 50;

/**
 * Minimum number of dust particles spawned per moving unit.
 */
export const DUST_SPAWN_PARTICLE_COUNT_MIN = 2;

/**
 * Additional random dust particles (0 to this value).
 * Total particles = MIN + random(0, RANDOM).
 */
export const DUST_SPAWN_PARTICLE_COUNT_RANDOM = 2;

/**
 * Minimum movement distance (per axis) to consider a unit as "moving".
 * Below this, no dust particles are spawned.
 */
export const DUST_MOVEMENT_THRESHOLD = 0.1;

/**
 * Y offset below unit for dust particle spawn position.
 */
export const DUST_SPAWN_Y_OFFSET = 5;

/**
 * Horizontal velocity range for dust particles (pixels per second).
 * Particles spawn with vx in range [-RANGE/2, +RANGE/2].
 */
export const DUST_HORIZONTAL_VELOCITY_RANGE = 40;

/**
 * Base upward velocity for dust particles (pixels per second).
 */
export const DUST_UPWARD_VELOCITY_BASE = 20;

/**
 * Additional random upward velocity for dust particles (pixels per second).
 */
export const DUST_UPWARD_VELOCITY_RANDOM = 40;

// =============================================================================
// BOUNCE ANIMATION
// =============================================================================

/**
 * How many bounces per second when moving.
 * Higher = faster bounce cycle.
 */
export const BOUNCE_FREQUENCY = 1.5;

/**
 * Maximum vertical offset (in pixels) at the peak of each bounce.
 * This is the base value, scaled by unit size.
 */
export const BOUNCE_HEIGHT_MULTIPLIER = 0.25;

/**
 * Amount of horizontal stretch when unit hits the ground (1.0 = no stretch).
 * 1.15 = 15% wider at the bottom of bounce.
 */
export const BOUNCE_SQUASH_STRETCH_X = 1.15;

/**
 * Amount of vertical squash when unit hits the ground (1.0 = no squash).
 * 0.85 = 15% shorter at the bottom of bounce.
 */
export const BOUNCE_SQUASH_STRETCH_Y = 0.85;

// =============================================================================
// COMBAT VISUAL EFFECTS
// =============================================================================

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
 * Unit shadow offset (pixels down and right from unit center).
 */
export const UNIT_SHADOW_OFFSET = 2;

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

// =============================================================================
// PROJECTILE VISUALS
// =============================================================================

/**
 * Base length of projectile trail in pixels.
 * Scaled by arena size at runtime.
 */
export const BASE_PROJECTILE_TRAIL_LENGTH = 15;

/**
 * Width of projectile trail at its widest point (near projectile).
 */
export const PROJECTILE_TRAIL_WIDTH = 2;

/**
 * Projectile head radius (pixels).
 */
export const PROJECTILE_HEAD_RADIUS = 3;

// =============================================================================
// SHOCKWAVE VISUALS
// =============================================================================

/**
 * Shockwave ring thickness (pixels).
 */
export const SHOCKWAVE_RING_THICKNESS = 8;

/**
 * Shockwave ring outer glow extra width (pixels).
 */
export const SHOCKWAVE_GLOW_WIDTH = 4;

/**
 * Shockwave inner highlight line width (pixels).
 */
export const SHOCKWAVE_HIGHLIGHT_WIDTH = 2;

/**
 * Minimum shockwave radius before rendering (pixels).
 */
export const SHOCKWAVE_MIN_RENDER_RADIUS = 10;

// =============================================================================
// GHOST HEALTH BAR
// =============================================================================

/**
 * Ghost health bar decay rate (how much of the difference to close per frame).
 * Higher value = faster decay. Range 0-1.
 */
export const GHOST_HEALTH_DECAY_RATE = 0.08;

/**
 * Minimum health difference before snapping ghost health to actual health.
 * Prevents endless tiny visual updates.
 */
export const GHOST_HEALTH_SNAP_THRESHOLD = 0.1;

// =============================================================================
// VISUAL THRESHOLDS
// =============================================================================

/**
 * Minimum visual offset magnitude before snapping to zero.
 * Prevents endless tiny movements from floating point imprecision.
 */
export const MIN_VISUAL_OFFSET_THRESHOLD = 0.1;

/**
 * Time in seconds at which walk animation wraps to prevent floating point issues.
 */
export const WALK_ANIMATION_WRAP_TIME = 1000;

/**
 * Fixed frame delta used for particle updates (seconds).
 */
export const PARTICLE_FRAME_DELTA = 0.016;

// =============================================================================
// WAX SEAL OVERLAY
// =============================================================================

/**
 * Size of the wax seal SVG in pixels.
 */
export const WAX_SEAL_SVG_SIZE = 120;

/**
 * Scale when wax seal is in "pre-stamp" state (before animation).
 */
export const WAX_SEAL_PRESTAMP_SCALE = 1.5;

/**
 * Rotation when wax seal is in "pre-stamp" state (degrees).
 */
export const WAX_SEAL_PRESTAMP_ROTATION = -15;

/**
 * Panel scale when in "pre-stamp" state.
 */
export const WAX_SEAL_PANEL_PRESTAMP_SCALE = 0.8;

/**
 * Stamp animation duration (seconds).
 */
export const WAX_SEAL_STAMP_DURATION = 0.4;

/**
 * Panel animation duration (seconds).
 */
export const WAX_SEAL_PANEL_DURATION = 0.3;

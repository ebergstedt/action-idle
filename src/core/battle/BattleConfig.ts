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
 * 0.375 = 37.5% for allied zone (bottom), 37.5% for enemy zone (top).
 */
export const ZONE_HEIGHT_PERCENT = 0.375;

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

// =============================================================================
// UNIT AI & TARGETING
// =============================================================================

/**
 * Radius within which units will acquire targets while advancing.
 * Outside this radius, units march forward until reaching enemy zone.
 */
export const AGGRO_RADIUS = 150;

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
 * Horizontal offset from arena edge for castle placement.
 * Castles are placed at (margin, zoneCenter) and (width - margin, zoneCenter).
 * Higher value = more toward center.
 */
export const CASTLE_HORIZONTAL_MARGIN = 300;

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
// UNIT SCALING
// =============================================================================

/**
 * Reference arena height for unit size scaling.
 * Units are scaled relative to this baseline.
 */
export const REFERENCE_ARENA_HEIGHT = 600;

/**
 * Minimum scale factor for units.
 */
export const MIN_UNIT_SCALE = 0.8;

/**
 * Maximum scale factor for units.
 */
export const MAX_UNIT_SCALE = 2;

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
 * Default range for "nearby" ability targets (pixels).
 */
export const DEFAULT_ABILITY_RANGE = 100;

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
 * Multiplier for ally avoidance distance check during movement.
 * Units avoid allies within (minDist * this value).
 */
export const ALLY_AVOIDANCE_DISTANCE_MULTIPLIER = 2;

/**
 * Battle Configuration
 *
 * Centralized configuration for battle system gameplay constants.
 * Visual/rendering constants are in VisualConfig.ts but re-exported here for backward compatibility.
 *
 * Godot equivalent: Resource file or Autoload with exported variables
 */

// Re-export all visual constants for backward compatibility
// Existing imports from BattleConfig will continue to work
export * from './VisualConfig';

// =============================================================================
// UNIT SPACING & SEPARATION
// =============================================================================

/**
 * Multiplier for minimum distance between units.
 * minDist = (unitA.size + unitB.size) * UNIT_SPACING
 */
export const UNIT_SPACING = 0.8;

/**
 * Base force applied to separate overlapping allied units during movement.
 * Scaled by arena size at runtime.
 */
export const BASE_ALLY_AVOIDANCE_FORCE = 40;

/**
 * Base force applied to separate overlapping units in BattleWorld.
 * Scaled by arena size at runtime.
 */
export const BASE_SEPARATION_FORCE = 60;

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
 * 0.861 = 62/72 for square grid cells (Mechabellum-style).
 */
export const ARENA_ASPECT_RATIO = 0.861;

/**
 * Default margin from arena edges for entity bounds.
 */
export const DEFAULT_ARENA_MARGIN = 10;

/**
 * Percentage of arena height used for each deployment zone.
 * 0.484 = 30/62 rows per deployment zone (Mechabellum-style).
 */
export const ZONE_HEIGHT_PERCENT = 0.484;

// =============================================================================
// GRID CONFIGURATION
// =============================================================================

/**
 * Total columns in the battle grid (Mechabellum: 72).
 */
export const GRID_TOTAL_COLS = 72;

/**
 * Total rows in the battle grid (Mechabellum: 62).
 */
export const GRID_TOTAL_ROWS = 62;

/**
 * Columns reserved for flanks on each side (Mechabellum: 6).
 */
export const GRID_FLANK_COLS = 6;

/**
 * Rows for no man's land in the middle (Mechabellum: 2).
 */
export const GRID_NO_MANS_LAND_ROWS = 2;

/**
 * Rows for each deployment zone (Mechabellum: 30).
 */
export const GRID_DEPLOYMENT_ROWS = 30;

/**
 * Columns available for deployment (72 - 6 - 6 = 60).
 */
export const GRID_DEPLOYMENT_COLS = 60;

/**
 * Divisor for zone midway calculation.
 * Used to determine when a unit is "deep" in the enemy zone (past midway).
 * 2 = midway point (zoneHeight / 2).
 */
export const ZONE_MIDWAY_DIVISOR = 2;

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
// IDLE SPEED-UP SYSTEM
// =============================================================================

/**
 * Time in seconds without damage before game speed increases.
 * Timer resets on each damage event (unless in unconditional mode).
 */
export const IDLE_DAMAGE_TIMEOUT = 2;

/**
 * Speed increase per timeout period (0.5 = 50% faster).
 * Stacks additively until MAX_IDLE_SPEED_BONUS is reached.
 */
export const IDLE_SPEED_INCREMENT = 0.5;

/**
 * Maximum speed bonus from idle speed-up (10.0 = 1000% bonus).
 * Resets at the start of each battle.
 */
export const MAX_IDLE_SPEED_BONUS = 10.0;

/**
 * Battle duration threshold in seconds for Phase 2 speed-up.
 * After this time, speed increases every IDLE_DAMAGE_TIMEOUT seconds
 * regardless of damage (damage no longer resets the timer).
 */
export const BATTLE_TIME_THRESHOLD = 20;

/**
 * Stalemate detection timeout in seconds.
 * If no damage is dealt for this duration after the first damage event,
 * the battle is considered a stalemate and switches to Phase 2 behavior
 * (unconditional speed-up) regardless of battle time.
 */
export const STALEMATE_TIMEOUT = 5;

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
export const PROJECTILE_HIT_RADIUS = 3;

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
export const MELEE_ATTACK_RANGE_THRESHOLD = 25;

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

/**
 * Padding around castles for formation placement (pixels).
 * Units will not be placed within this distance of a castle.
 * Scaled by arena size at runtime.
 */
export const BASE_CASTLE_FORMATION_PADDING = 25;

// =============================================================================
// SEPARATION & COLLISION
// =============================================================================

/**
 * Minimum collision size as fraction of base unit size.
 * Prevents collision size from shrinking too much due to modifiers.
 * 0.1 = collision size is at least 10% of visual size.
 */
export const MIN_COLLISION_SIZE_MULTIPLIER = 0.1;

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

/**
 * Multiplier for ally avoidance distance check during movement.
 * Units avoid allies within (minDist * this value).
 */
export const ALLY_AVOIDANCE_DISTANCE_MULTIPLIER = 1.2;

/**
 * Minimum vector magnitude for safe normalization.
 * Below this, use a default direction to avoid division by near-zero.
 */
export const MIN_NORMALIZE_THRESHOLD = 0.1;

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
 * Multiplier for unit selection radius.
 * 1.5 = selectable area is 50% larger than unit size.
 */
export const SELECTION_RADIUS_MULTIPLIER = 1.5;

/**
 * Multiplier for calculating unit half-size in box selection.
 * 0.5 = unit bounds extend to half the unit size in each direction.
 */
export const BOX_SELECT_SIZE_MULTIPLIER = 0.5;

// =============================================================================
// SQUAD CONFIGURATION
// =============================================================================

/**
 * Spacing between units in a squad formation (pixels).
 * Scaled by arena size at runtime.
 */
export const BASE_SQUAD_UNIT_SPACING = 18;

/**
 * Maximum columns in a squad grid formation.
 * Squads form rows of up to this many units.
 */
export const SQUAD_MAX_COLUMNS = 6;

/**
 * Horizontal padding around squad footprint (pixels).
 * Added to both left and right sides of the squad bounds.
 * Scaled by arena size at runtime.
 */
export const BASE_SQUAD_PADDING_H = 12;

/**
 * Vertical padding around squad footprint (pixels).
 * Added to both top and bottom of the squad bounds.
 * Scaled by arena size at runtime.
 */
export const BASE_SQUAD_PADDING_V = 10;

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
export const FORMATION_WIDTH_SCALE = 0.7;

/**
 * Height scale factor for formation spread (fraction of zone height).
 */
export const FORMATION_HEIGHT_SCALE = 0.8;

/**
 * Position of formation center within ally zone (0 = top, 1 = bottom).
 * 0.3 = positioned toward the front (enemy side) of the zone.
 */
export const FORMATION_CENTER_OFFSET = 0.3;

/**
 * Maximum columns for enemy grid spawn layout.
 */
export const ENEMY_SPAWN_MAX_COLS = 5;

/**
 * Jitter factor for enemy spawn positions (fraction of cell size).
 * 0.6 = 60% random offset from grid center.
 */
export const ENEMY_SPAWN_JITTER = 0.6;

/**
 * Jitter factor for deterministic enemy formation X positions.
 * Applied as a fraction of unit spacing.
 */
export const FORMATION_JITTER_X = 0.15;

/**
 * Jitter factor for deterministic enemy formation Y positions.
 * Applied as a fraction of row height within the zone.
 */
export const FORMATION_JITTER_Y = 0.15;

/**
 * Maximum units per row before creating additional rows.
 */
export const FORMATION_MAX_UNITS_PER_ROW = 6;

/**
 * Row spacing as fraction of available height for multi-row formations.
 */
export const FORMATION_ROW_SPACING = 0.12;

/**
 * Grid step size for formation placement collision detection (pixels).
 * Smaller values give more precision but slower performance.
 */
export const FORMATION_GRID_STEP = 15;

/**
 * Wedge spread Y modification factor.
 * Units on edges are pushed back by this fraction of available height.
 */
export const FORMATION_WEDGE_Y_FACTOR = 0.1;

// =============================================================================
// FORMATION VARIETY SYSTEM
// =============================================================================

/**
 * Chance to pick a different pattern than the normal cycle (20%).
 * Creates unpredictability while maintaining tactical coherence.
 */
export const PATTERN_VARIATION_CHANCE = 0.2;

/**
 * Chance to swap formation roles for enemy variety (35%).
 * When active, unit roles are remapped (e.g., warriors positioned where archers normally go).
 */
export const ROLE_SWAP_CHANCE = 0.35;

/**
 * Legacy enemy composition ratios (when no registry is provided).
 * Used for backward compatibility with older code paths.
 */
export const LEGACY_ENEMY_KNIGHT_RATIO = 0.2;
export const LEGACY_ENEMY_ARCHER_RATIO = 0.4;

/**
 * Role-based enemy composition distribution.
 * Base distribution: 40% front, 40% back, 20% flank.
 */
export const ENEMY_ROLE_FRONT_RATIO = 0.4;
export const ENEMY_ROLE_BACK_RATIO = 0.4;

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
 * Movement speed debuff applied by shockwave (-0.3 = -30% speed).
 */
export const SHOCKWAVE_DEBUFF_MOVE_SPEED = -0.3;

/**
 * Damage debuff applied by shockwave (-0.3 = -30% damage).
 */
export const SHOCKWAVE_DEBUFF_DAMAGE = -0.3;

/**
 * Duration of shockwave debuff in seconds.
 */
export const SHOCKWAVE_DEBUFF_DURATION_SECONDS = 15;

// =============================================================================
// WAVE & ECONOMY SYSTEM
// =============================================================================

/**
 * Base gold reward for clearing wave 1.
 */
export const BASE_GOLD_PER_WAVE = 10;

/**
 * Gold scaling per wave level.
 * Gold = BASE_GOLD_PER_WAVE × (1 + wave × WAVE_GOLD_SCALING)
 */
export const WAVE_GOLD_SCALING = 0.1;

/**
 * Calculate gold reward for clearing a wave.
 */
export function calculateWaveGold(waveNumber: number): number {
  return Math.floor(BASE_GOLD_PER_WAVE * (1 + waveNumber * WAVE_GOLD_SCALING));
}

/**
 * Base number of enemy squads at wave 1.
 */
export const BASE_ENEMY_COUNT = 10;

/**
 * Additional enemy squads per wave.
 */
export const ENEMIES_PER_WAVE = 1;

/**
 * Maximum enemy squad count cap.
 * Capped at 15 squads per team for performance and visual clarity.
 */
export const MAX_ENEMY_COUNT = 15;

/**
 * Calculate enemy count for a wave.
 */
export function calculateEnemyCount(waveNumber: number): number {
  return Math.min(MAX_ENEMY_COUNT, BASE_ENEMY_COUNT + (waveNumber - 1) * ENEMIES_PER_WAVE);
}

/**
 * Minimum wave number.
 */
export const MIN_WAVE = 1;

/**
 * Maximum wave number (soft cap for UI).
 */
export const MAX_WAVE = 999;

// =============================================================================
// UI TIMING & ANIMATIONS
// =============================================================================

/**
 * Delay before showing the victory/defeat overlay (milliseconds).
 */
export const OVERLAY_SHOW_DELAY_MS = 500;

/**
 * Delay before stamping animation on overlay (milliseconds).
 */
export const OVERLAY_STAMP_DELAY_MS = 300;

/**
 * Delay before auto-battle starts the next battle (milliseconds).
 */
export const AUTO_BATTLE_START_DELAY_MS = 100;

/**
 * Delay before considering arena size stable for spawning (milliseconds).
 */
export const ARENA_SIZE_STABLE_DELAY_MS = 100;

/**
 * Auto-battle countdown duration in seconds.
 */
export const AUTO_BATTLE_COUNTDOWN_SECONDS = 3;

// =============================================================================
// PERSISTENCE & AUTOSAVE
// =============================================================================

/**
 * Interval between autosaves in milliseconds.
 */
export const AUTOSAVE_INTERVAL_MS = 30000;

/**
 * Maximum offline time to calculate earnings for (seconds).
 * Caps offline progression to prevent abuse.
 */
export const MAX_OFFLINE_TIME_SECONDS = 3600;

// =============================================================================
// COMBAT CALCULATIONS
// =============================================================================

/**
 * Calculate DPS (damage per second) from damage and attack speed.
 * Pure function for consistent display across UI.
 */
export function calculateDPS(damage: number, attackSpeed: number): number {
  return damage * attackSpeed;
}

// =============================================================================
// BATTLE VIEW LAYOUT
// =============================================================================

/**
 * Default arena width before ResizeObserver updates it.
 */
export const DEFAULT_ARENA_WIDTH = 600;

/**
 * Default arena height before ResizeObserver updates it.
 */
export const DEFAULT_ARENA_HEIGHT = 600;

/**
 * Vertical padding subtracted from container height for arena sizing.
 */
export const ARENA_CONTAINER_PADDING_V = 10;

/**
 * Horizontal padding subtracted from container width for arena sizing.
 */
export const ARENA_CONTAINER_PADDING_H = 20;

// =============================================================================
// CAMERA ZOOM
// =============================================================================

/**
 * Minimum zoom level (1.0 = no zoom, fits entire arena).
 */
export const MIN_ZOOM = 1.0;

/**
 * Maximum zoom level (3.0 = 3x magnification).
 */
export const MAX_ZOOM = 3.0;

/**
 * Zoom speed factor per scroll wheel delta.
 * Higher = faster zoom response.
 */
export const ZOOM_SPEED = 0.001;

/**
 * Default zoom level on battle start/reset.
 */
export const DEFAULT_ZOOM = 1.0;

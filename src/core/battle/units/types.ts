/**
 * Unit System Types
 *
 * Defines the distinction between:
 * - UnitDefinition: Static template loaded from JSON
 * - UnitInstance: Runtime state with modifiers applied
 *
 * Godot-portable: No React/browser dependencies.
 */

import { Vector2 } from '../../physics/Vector2';
import { ActiveModifier } from '../modifiers/types';
import type { GridFootprint } from '../grid/GridTypes';

/**
 * Unit team affiliation.
 */
export type UnitTeam = 'player' | 'enemy';

/**
 * Unit category for grouping and upgrade targeting.
 */
export type UnitCategory = 'infantry' | 'ranged' | 'cavalry' | 'artillery' | 'scout';

/**
 * Formation role determines where a unit is positioned in enemy formations.
 * - 'front': Forward row, first to engage (tanks, bruisers)
 * - 'back': Rear row, protected (archers, mages, support)
 * - 'flank': Sides/edges, mobile (cavalry, assassins, skirmishers)
 */
export type FormationRole = 'front' | 'back' | 'flank';

/**
 * Visual shape for rendering.
 */
export type UnitShape = 'circle' | 'square' | 'triangle' | 'triangle_down' | 'diamond';

/**
 * Attack mode stats (melee or ranged).
 */
export interface AttackModeStats {
  damage: number;
  attackSpeed: number; // attacks per second
  range: number; // pixels - melee ~35, ranged ~200
  /** Projectile speed override (uses BASE_PROJECTILE_SPEED if not set) */
  projectileSpeed?: number;
  /**
   * Splash/AoE damage radius (0 or undefined = single target).
   * Note: Values are ~80% smaller than Mechabellum equivalents due to smaller arena scale.
   */
  splashRadius?: number;
}

/**
 * Base stats for a unit (before modifiers).
 */
export interface BaseStats {
  maxHealth: number;
  moveSpeed: number; // pixels per second
  armor: number; // damage reduction (flat)
  attackInterval?: number; // seconds between attacks (overrides attackSpeed if present)
  squadSize?: number; // number of units in a squad (default 1)
  melee: AttackModeStats | null; // null = no melee attack
  ranged: AttackModeStats | null; // null = no ranged attack
  /** If true, attack cooldown resets when switching to a new target (e.g., snipers) */
  resetAttackOnTargetSwitch?: boolean;
}

/**
 * Computed stats after all modifiers are applied.
 * Same structure as BaseStats but guaranteed values.
 */
export interface ComputedStats {
  maxHealth: number;
  moveSpeed: number;
  armor: number;
  melee: AttackModeStats | null;
  ranged: AttackModeStats | null;
}

/**
 * Visual definition for a unit type.
 */
export interface UnitVisuals {
  shape: UnitShape;
  /**
   * @deprecated Use unitGridSize instead. Kept for backward compatibility.
   */
  baseSize?: number;
  /**
   * Key into UNIT_TYPE_COLORS for team-based coloring.
   * e.g., 'warrior', 'archer', 'knight'
   */
  colorKey: string;
  /**
   * Walk animation type ID.
   * e.g., 'bounce', 'none'
   * Defaults to 'bounce' if not specified.
   */
  walkAnimation?: string;
  /**
   * If true, shows a targeting laser when aiming at enemies (for snipers).
   */
  aimingLaser?: boolean;
}

/**
 * Requirements that must be met to unlock a unit type.
 */
export interface UnlockRequirement {
  type: 'upgrade' | 'wave' | 'unit_killed';
  /** ID of upgrade, or wave number, or unit type killed */
  targetId: string;
  /** For 'unit_killed', how many must be killed */
  count?: number;
}

/**
 * Reference metadata for unit design origins.
 * Optional attribution for game design inspiration.
 */
export interface UnitReference {
  /** Source game or media */
  source?: string;
  /** Original unit name */
  unit?: string;
  /** Reference wiki or documentation URL */
  wiki?: string;
}

/**
 * Unit Definition - Static template loaded from JSON.
 * Defines what a unit type IS, not its runtime state.
 */
export interface UnitDefinition {
  /** Unique identifier, e.g., 'warrior', 'elite_archer' */
  id: string;

  /** Display name */
  name: string;

  /** Flavor text / tooltip description */
  description: string;

  /** Category for upgrade targeting */
  category: UnitCategory;

  /** Tier level: 1 = basic, 2+ = advanced (may require unlocking) */
  tier: number;

  /** Formation role for enemy positioning (front/back/flank) */
  formationRole: FormationRole;

  /**
   * Minimum wave number at which this unit can appear in enemy compositions.
   * Units with wavePermit > current wave won't spawn as enemies.
   * Default: 1 (available from wave 1)
   */
  wavePermit: number;

  /** Base stats before any modifiers */
  baseStats: BaseStats;

  /** Visual appearance */
  visuals: UnitVisuals;

  /** Ability IDs that this unit has innately */
  innateAbilities: string[];

  /** Requirements to unlock this unit type */
  unlockRequirements: UnlockRequirement[];

  /** Optional reference metadata for design attribution */
  reference?: UnitReference;

  /**
   * Grid footprint for deployment positioning.
   * Defines how many grid cells this unit's squad occupies.
   * If not specified, calculated from squadSize.
   */
  gridFootprint?: GridFootprint;

  /**
   * Size of an individual unit in grid cells.
   * e.g., { cols: 1, rows: 1 } for small units like Fang
   * e.g., { cols: 2, rows: 2 } for large units like Marksman
   * Defaults to { cols: 1, rows: 1 } if not specified.
   */
  unitGridSize?: GridFootprint;
}

/**
 * Combat state for a unit in battle.
 */
export interface CombatState {
  /** Current target unit ID (or null if no target) */
  targetId: string | null;

  /** Seconds until next attack */
  attackCooldown: number;

  /** Current shuffle movement direction (for melee combat) */
  shuffleDirection: Vector2 | null;

  /** Time remaining for current shuffle action */
  shuffleTimer: number;

  /** Current attack mode being used */
  currentAttackMode: 'melee' | 'ranged' | null;
}

/**
 * Unit Instance - Runtime state of a unit in battle.
 * Created from a UnitDefinition with modifiers applied.
 */
export interface UnitInstance {
  /** Unique instance ID, e.g., 'unit_42' */
  id: string;

  /** Reference to the UnitDefinition this was created from */
  definitionId: string;

  /** Team affiliation */
  team: UnitTeam;

  /** Current position in arena coordinates */
  position: Vector2;

  /** Current health (can be modified during combat) */
  currentHealth: number;

  /** Copy of base stats from definition */
  baseStats: BaseStats;

  /** Computed stats after all modifiers */
  computedStats: ComputedStats;

  /** Active modifiers affecting this unit */
  activeModifiers: ActiveModifier[];

  /** Ability IDs this unit currently has (innate + granted) */
  activeAbilities: string[];

  /** Cooldown tracking for abilities: abilityId -> seconds remaining */
  abilityCooldowns: Record<string, number>;

  /** Combat-specific state */
  combat: CombatState;

  /** Visual properties (resolved from definition) */
  color: string;
  shape: UnitShape;
  size: number;
}

/**
 * Unit render data for React rendering layer.
 * Maps the UnitInstance structure to a flat DTO for the presentation layer.
 *
 * @deprecated Use UnitInstance directly in core code
 */
export interface UnitRenderDataLegacy {
  id: string;
  type: string; // UnitDefinition.id
  team: UnitTeam;
  position: Vector2;
  health: number;
  stats: {
    maxHealth: number;
    moveSpeed: number;
    melee: AttackModeStats | null;
    ranged: AttackModeStats | null;
  };
  target: UnitRenderDataLegacy | null;
  attackCooldown: number;
  color: string;
  shape: UnitShape;
  size: number;
  shuffleDirection: Vector2 | null;
  shuffleTimer: number;
}

/**
 * Options for creating a unit instance.
 */
export interface CreateUnitOptions {
  /** Override position (otherwise uses default spawn position) */
  position?: Vector2;

  /** Additional modifiers to apply immediately */
  modifiers?: ActiveModifier[];

  /** Override health (for loading saved state) */
  health?: number;
}

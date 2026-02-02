/**
 * Formation Type Definitions
 *
 * Types used across the formation system for unit placement.
 *
 * Godot equivalent: Resource definitions for formations.
 */

import { Vector2 } from '../../physics/Vector2';
import { FormationRole } from '../units/types';

/**
 * Unit types currently supported in formations.
 * Matches the unit IDs in /src/data/units/*.json
 */
export type UnitType = 'hound' | 'fang' | 'crawler' | 'arclight' | 'marksman' | 'void_eye';

/**
 * A unit placement within a legacy FormationTemplate.
 * Uses normalized coordinates relative to formation center.
 * @deprecated New formations use role-based patterns instead.
 */
export interface UnitPlacement {
  type: UnitType;
  /** Position relative to formation center. X: -1 to 1 (left to right), Y: 0 to 1 (front to back) */
  relativePosition: Vector2;
}

/**
 * Legacy formation template with fixed unit positions.
 * @deprecated Use EnemyFormationPattern with calculateDeterministicEnemyPositions instead.
 */
export interface FormationTemplate {
  id: string;
  name: string;
  placements: UnitPlacement[];
}

/**
 * Final calculated spawn position for a unit.
 * This is the output of all formation calculations.
 */
export interface SpawnPosition {
  type: UnitType;
  /** Absolute position in arena coordinates (pixels) */
  position: Vector2;
}

/**
 * Arena dimensions needed for formation calculations.
 */
export interface ArenaBounds {
  width: number;
  height: number;
  /** Fraction of arena height for each deployment zone (0-1) */
  zoneHeightPercent: number;
}

/**
 * Dimensions of a squad's footprint for collision detection.
 * INCLUDES padding for spacing between squads.
 */
export interface SquadFootprint {
  /** Total width including padding on both sides */
  width: number;
  /** Total height including padding on top and bottom */
  height: number;
}

/**
 * Axis-aligned bounding box for a placed squad.
 * Used for collision detection during placement.
 */
export interface SquadBounds {
  x: number; // Left edge (absolute pixel coordinate)
  y: number; // Top edge (absolute pixel coordinate)
  width: number;
  height: number;
}

/**
 * Spread type for positioning units within a formation area.
 * - line: Even horizontal spread
 * - wedge: V-shape with edges pushed back
 * - scattered: Randomized positions
 * - wide: Split between left and right flanks
 * - left: Grouped on the left side
 * - right: Grouped on the right side
 */
export type SpreadType = 'line' | 'wedge' | 'scattered' | 'wide' | 'left' | 'right';

/**
 * Configuration for how each role is positioned within a pattern.
 */
export interface RoleConfig {
  /** Y position as fraction of zone (0 = top/front, 1 = bottom/back) */
  yPosition: number;
  /** Spread algorithm for X positioning */
  spread: SpreadType;
  /** Width multiplier (fraction of available width) */
  widthFraction: number;
}

/**
 * Enemy formation pattern defining where each role group is positioned.
 */
export interface EnemyFormationPattern {
  id: string;
  name: string;
  front: RoleConfig;
  back: RoleConfig;
  flank: RoleConfig;
}

/**
 * Role swap configuration for formation variety.
 */
export interface RoleSwap {
  from: FormationRole;
  to: FormationRole;
}

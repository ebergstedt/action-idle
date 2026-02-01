import { Vector2 } from '../physics/Vector2';
import { UNIT_TYPE_COLORS } from '../theme/colors';
import type { UnitTeam as UnitTeamType } from './units/types';

// Re-export new unit system types for consumers
export type {
  UnitTeam,
  UnitCategory,
  UnitShape,
  UnitInstance,
  UnitDefinition,
} from './units/types';
export type { AttackModeStats, BaseStats, ComputedStats } from './units/types';

// Local alias for use in this file
type UnitTeam = UnitTeamType;

// Legacy type aliases for backward compatibility
export type UnitType = 'warrior' | 'archer' | 'knight';

export type AttackType = 'melee' | 'ranged';

/**
 * Individual attack mode stats.
 * @deprecated Use AttackModeStats from './units/types' instead
 */
export interface AttackMode {
  damage: number;
  attackSpeed: number; // attacks per second
  range: number; // pixels - melee ~35, ranged ~200
}

/**
 * Legacy unit stats interface.
 * @deprecated Use BaseStats from './units/types' instead
 */
export interface UnitStats {
  maxHealth: number;
  moveSpeed: number; // pixels per second
  melee: AttackMode | null; // null = no melee attack
  ranged: AttackMode | null; // null = no ranged attack
}

export interface Unit {
  id: string;
  type: UnitType;
  team: UnitTeam;
  position: Vector2;
  health: number;
  stats: UnitStats;
  target: Unit | null;
  attackCooldown: number; // seconds until next attack
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  size: number; // radius for circle, half-width for square
  // Combat shuffle state
  shuffleDirection: Vector2 | null; // current shuffle movement direction
  shuffleTimer: number; // time remaining for current shuffle action (move or pause)
}

export interface Projectile {
  id: string;
  position: Vector2;
  target: Vector2;
  speed: number;
  damage: number;
  sourceTeam: UnitTeam;
  color: string;
}

export interface BattleState {
  units: Unit[];
  projectiles: Projectile[];
  isRunning: boolean;
  hasStarted: boolean; // True once battle has begun (disables unit placement)
  waveNumber: number;
}

/**
 * Legacy unit stats constant.
 * @deprecated Use UnitRegistry with unit definitions from JSON instead.
 * This is kept for backward compatibility during migration.
 */
export const UNIT_STATS: Record<UnitType, UnitStats> = {
  warrior: {
    maxHealth: 100,
    moveSpeed: 80,
    melee: { damage: 15, attackSpeed: 1.0, range: 35 },
    ranged: null, // Pure melee unit
  },
  archer: {
    maxHealth: 50,
    moveSpeed: 60,
    melee: { damage: 8, attackSpeed: 0.6, range: 35 }, // Weak melee fallback
    ranged: { damage: 25, attackSpeed: 0.8, range: 200 },
  },
  knight: {
    maxHealth: 80,
    moveSpeed: 100,
    melee: { damage: 20, attackSpeed: 1.2, range: 35 },
    ranged: null, // Pure melee unit (can be upgraded later)
  },
};

/**
 * Legacy unit visuals constant.
 * @deprecated Use UnitRegistry with unit definitions from JSON instead.
 */
export const UNIT_VISUALS: Record<UnitType, { shape: Unit['shape']; baseSize: number }> = {
  warrior: { shape: 'square', baseSize: 20 },
  archer: { shape: 'triangle', baseSize: 16 },
  knight: { shape: 'circle', baseSize: 18 },
};

// Calculate scaled unit size based on arena dimensions
export function getScaledUnitSize(baseSize: number, arenaHeight: number): number {
  // Scale relative to a reference height of 600px
  const scale = Math.max(0.8, Math.min(2, arenaHeight / 600));
  return Math.round(baseSize * scale);
}

// Re-export team colors from centralized theme
export const TEAM_COLORS: Record<UnitTeam, Record<UnitType, string>> = {
  player: {
    warrior: UNIT_TYPE_COLORS.warrior.player,
    archer: UNIT_TYPE_COLORS.archer.player,
    knight: UNIT_TYPE_COLORS.knight.player,
  },
  enemy: {
    warrior: UNIT_TYPE_COLORS.warrior.enemy,
    archer: UNIT_TYPE_COLORS.archer.enemy,
    knight: UNIT_TYPE_COLORS.knight.enemy,
  },
};

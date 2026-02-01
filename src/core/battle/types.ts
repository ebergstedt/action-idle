import { Vector2 } from '../physics/Vector2';

export type UnitTeam = 'player' | 'enemy';

export type UnitType = 'warrior' | 'archer' | 'knight';

export type AttackType = 'melee' | 'ranged';

export interface UnitStats {
  maxHealth: number;
  damage: number;
  attackSpeed: number; // attacks per second
  range: number; // pixels - melee ~30, ranged ~200
  moveSpeed: number; // pixels per second
  attackType: AttackType;
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

export const UNIT_STATS: Record<UnitType, UnitStats> = {
  warrior: {
    maxHealth: 100,
    damage: 15,
    attackSpeed: 1.0,
    range: 35,
    moveSpeed: 80,
    attackType: 'melee',
  },
  archer: {
    maxHealth: 50,
    damage: 25,
    attackSpeed: 0.8,
    range: 200,
    moveSpeed: 60,
    attackType: 'ranged',
  },
  knight: {
    maxHealth: 80,
    damage: 20,
    attackSpeed: 1.2,
    range: 35,
    moveSpeed: 100,
    attackType: 'melee',
  },
};

// Base sizes - will be scaled based on arena size
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

export const TEAM_COLORS: Record<UnitTeam, Record<UnitType, string>> = {
  player: {
    warrior: '#4A90D9', // blue
    archer: '#50C878', // green
    knight: '#9B59B6', // purple
  },
  enemy: {
    warrior: '#E74C3C', // red
    archer: '#C0392B', // dark red
    knight: '#922B21', // darker red
  },
};

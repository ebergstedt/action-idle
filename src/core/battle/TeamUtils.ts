/**
 * Team Utilities
 *
 * Centralized helpers for team-based operations.
 * Replaces scattered team === 'player' conditionals throughout the codebase.
 *
 * Godot equivalent: Static utility functions or autoload.
 */

import { UnitTeam } from './units/types';

/**
 * Get the opposing team.
 *
 * @example
 * getEnemyTeam('player') // 'enemy'
 * getEnemyTeam('enemy') // 'player'
 */
export function getEnemyTeam(team: UnitTeam): UnitTeam {
  return team === 'player' ? 'enemy' : 'player';
}

/**
 * Get the forward Y direction for a team.
 * Player advances upward (negative Y), enemy advances downward (positive Y).
 *
 * @returns -1 for player, 1 for enemy
 */
export function getForwardY(team: UnitTeam): number {
  return team === 'player' ? -1 : 1;
}

/**
 * Check if a team is the player team.
 */
export function isPlayerTeam(team: UnitTeam): boolean {
  return team === 'player';
}

/**
 * Check if a team is the enemy team.
 */
export function isEnemyTeam(team: UnitTeam): boolean {
  return team === 'enemy';
}

/**
 * Type-safe map for team-indexed data.
 * Ensures both teams are handled.
 *
 * @example
 * const scores: TeamDataMap<number> = { player: 10, enemy: 5 };
 * const getScore = (team: UnitTeam) => scores[team];
 */
export type TeamDataMap<T> = {
  readonly player: T;
  readonly enemy: T;
};

/**
 * Get value from a team data map.
 * Provides type-safe access to team-indexed data.
 */
export function getTeamValue<T>(map: TeamDataMap<T>, team: UnitTeam): T {
  return map[team];
}

/**
 * Map a function over both teams, returning a TeamDataMap.
 */
export function mapTeams<T>(fn: (team: UnitTeam) => T): TeamDataMap<T> {
  return {
    player: fn('player'),
    enemy: fn('enemy'),
  };
}

/**
 * All team values as an array for iteration.
 */
export const TEAMS: readonly UnitTeam[] = ['player', 'enemy'] as const;

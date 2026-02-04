/**
 * Castle Queries Interface
 *
 * Query interface for castle-related operations.
 * Castles are stationary units that serve as objectives.
 *
 * Godot equivalent: Methods on battle scene for castle lookups.
 */

import { UnitTeam } from '../units/types';
import { UnitEntity } from './UnitEntity';

/**
 * Interface for querying castles in the battle world.
 */
export interface ICastleQueries {
  /** Get all castles (stationary units) */
  getCastles(): readonly UnitEntity[];

  /** Get castles belonging to a specific team */
  getCastlesByTeam(team: UnitTeam): UnitEntity[];

  /** Get enemy castles relative to a given unit */
  getEnemyCastlesOf(unit: UnitEntity): UnitEntity[];

  /** Get the initial castle count for a team (for tracking destruction) */
  getInitialCastleCount(team: UnitTeam): number;
}

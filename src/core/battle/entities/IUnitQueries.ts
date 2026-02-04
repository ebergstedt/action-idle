/**
 * Unit Queries Interface
 *
 * Query interface for unit-related operations.
 * Provides access to units by ID, team, and relationships.
 *
 * Godot equivalent: Methods on battle scene for unit lookups.
 */

import { UnitTeam } from '../units/types';
import { UnitEntity } from './UnitEntity';

/**
 * Interface for querying units in the battle world.
 */
export interface IUnitQueries {
  /** Get all units (including castles) */
  getUnits(): readonly UnitEntity[];

  /** Get a unit by its ID */
  getUnitById(id: string): UnitEntity | undefined;

  /** Get all units belonging to a team */
  getUnitsByTeam(team: UnitTeam): UnitEntity[];

  /** Get all enemy units of a given unit (excludes stationary) */
  getEnemiesOf(unit: UnitEntity): UnitEntity[];

  /** Get all allied units of a given unit (excludes self, excludes stationary) */
  getAlliesOf(unit: UnitEntity): UnitEntity[];
}

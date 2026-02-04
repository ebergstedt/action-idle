/**
 * Unit Registry Interface
 *
 * Defines the contract for unit definition lookup.
 * Implementations can be swapped for Godot (Resource-based).
 *
 * Godot-portable: Interface only, no dependencies.
 */

import { UnitDefinition } from './types';

/**
 * Interface for unit definition registry.
 * Provides lookup and filtering capabilities.
 */
export interface IUnitRegistry {
  /**
   * Gets a unit definition by ID.
   * @throws Error if not found
   */
  get(id: string): UnitDefinition;

  /**
   * Gets a unit definition by ID, or undefined if not found.
   */
  tryGet(id: string): UnitDefinition | undefined;

  /**
   * Checks if a unit definition exists.
   */
  has(id: string): boolean;

  /**
   * Gets all unit definitions.
   */
  getAll(): UnitDefinition[];

  /**
   * Gets all unlocked unit definitions based on unlock state.
   */
  getUnlocked(unlockedIds: Set<string>): UnitDefinition[];
}

/**
 * Ability Registry Interface
 *
 * Defines the contract for ability definition lookup.
 * Implementations can be swapped for Godot (Resource-based).
 *
 * Godot-portable: Interface only, no dependencies.
 */

import { AbilityDefinition, TriggerType } from './types';

/**
 * Interface for ability definition registry.
 * Provides lookup and filtering capabilities.
 */
export interface IAbilityRegistry {
  /**
   * Gets an ability definition by ID.
   * @throws Error if not found
   */
  get(id: string): AbilityDefinition;

  /**
   * Gets an ability definition by ID, or undefined if not found.
   */
  tryGet(id: string): AbilityDefinition | undefined;

  /**
   * Checks if an ability definition exists.
   */
  has(id: string): boolean;

  /**
   * Gets all ability definitions.
   */
  getAll(): AbilityDefinition[];

  /**
   * Gets ability definitions by trigger type.
   */
  getByTrigger(triggerType: TriggerType): AbilityDefinition[];

  /**
   * Gets multiple abilities by their IDs.
   * Skips any that don't exist.
   */
  getMany(ids: string[]): AbilityDefinition[];
}

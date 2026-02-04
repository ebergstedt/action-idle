/**
 * Ability Registry
 *
 * Loads and provides access to ability definitions.
 * Definitions are loaded from JSON data files.
 *
 * Godot-portable: No React/browser dependencies.
 */

import { IAbilityRegistry } from './IAbilityRegistry';
import { AbilityDefinition } from './types';

/**
 * Registry for ability definitions.
 * Provides lookup and filtering capabilities.
 */
export class AbilityRegistry implements IAbilityRegistry {
  private definitions: Map<string, AbilityDefinition> = new Map();

  /**
   * Registers an ability definition.
   */
  register(definition: AbilityDefinition): void {
    this.definitions.set(definition.id, definition);
  }

  /**
   * Registers multiple definitions at once.
   */
  registerAll(definitions: AbilityDefinition[]): void {
    for (const def of definitions) {
      this.register(def);
    }
  }

  /**
   * Gets an ability definition by ID.
   * @throws Error if not found
   */
  get(id: string): AbilityDefinition {
    const def = this.definitions.get(id);
    if (!def) {
      throw new Error(`Ability definition not found: ${id}`);
    }
    return def;
  }

  /**
   * Gets an ability definition by ID, or undefined if not found.
   */
  tryGet(id: string): AbilityDefinition | undefined {
    return this.definitions.get(id);
  }

  /**
   * Checks if an ability definition exists.
   */
  has(id: string): boolean {
    return this.definitions.has(id);
  }

  /**
   * Gets all ability definitions.
   */
  getAll(): AbilityDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Gets multiple abilities by their IDs.
   * Skips any that don't exist.
   */
  getMany(ids: string[]): AbilityDefinition[] {
    return ids
      .map((id) => this.tryGet(id))
      .filter((def): def is AbilityDefinition => def !== undefined);
  }
}

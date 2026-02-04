/**
 * Unit Registry
 *
 * Loads and provides access to unit definitions.
 * Definitions are loaded from JSON data files.
 *
 * Godot-portable: No React/browser dependencies.
 */

import { IUnitRegistry } from './IUnitRegistry';
import { UnitDefinition } from './types';

/**
 * Registry for unit definitions.
 * Provides lookup and filtering capabilities.
 */
export class UnitRegistry implements IUnitRegistry {
  private definitions: Map<string, UnitDefinition> = new Map();

  /**
   * Registers a unit definition.
   */
  register(definition: UnitDefinition): void {
    this.definitions.set(definition.id, definition);
  }

  /**
   * Registers multiple definitions at once.
   */
  registerAll(definitions: UnitDefinition[]): void {
    for (const def of definitions) {
      this.register(def);
    }
  }

  /**
   * Gets a unit definition by ID.
   * @throws Error if not found
   */
  get(id: string): UnitDefinition {
    const def = this.definitions.get(id);
    if (!def) {
      throw new Error(`Unit definition not found: ${id}`);
    }
    return def;
  }

  /**
   * Gets a unit definition by ID, or undefined if not found.
   */
  tryGet(id: string): UnitDefinition | undefined {
    return this.definitions.get(id);
  }

  /**
   * Checks if a unit definition exists.
   */
  has(id: string): boolean {
    return this.definitions.has(id);
  }

  /**
   * Gets all unit definitions.
   */
  getAll(): UnitDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Gets all unlocked unit definitions based on unlock state.
   */
  getUnlocked(unlockedIds: Set<string>): UnitDefinition[] {
    return this.getAll().filter((def) => {
      // Tier 1 units are always unlocked
      if (def.tier === 1) return true;
      // Check if explicitly unlocked
      return unlockedIds.has(def.id);
    });
  }

  /**
   * Gets all unit IDs.
   */
  getAllIds(): string[] {
    return Array.from(this.definitions.keys());
  }

  /**
   * Clears all definitions (for testing).
   */
  clear(): void {
    this.definitions.clear();
  }
}

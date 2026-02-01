/**
 * Upgrade Registry
 *
 * Loads and provides access to upgrade definitions from JSON.
 * Matches the registry pattern used in the battle system (UnitRegistry, AbilityRegistry).
 *
 * Godot equivalent: Autoload singleton that loads upgrade Resources.
 */

import { UpgradeDefinition } from '../types/Upgrade';

/**
 * Registry for upgrade definitions.
 * Load once at startup, query as needed.
 */
export class UpgradeRegistry {
  private upgrades: Map<string, UpgradeDefinition> = new Map();
  private upgradeList: UpgradeDefinition[] = [];

  /**
   * Register upgrade definitions.
   * Call once at startup with data from JSON.
   *
   * @param definitions - Array of upgrade definitions from JSON
   */
  register(definitions: UpgradeDefinition[]): void {
    for (const def of definitions) {
      if (this.upgrades.has(def.id)) {
        console.warn(`Duplicate upgrade ID: ${def.id}`);
      }
      this.upgrades.set(def.id, def);
    }
    this.upgradeList = [...this.upgrades.values()];
  }

  /**
   * Get an upgrade definition by ID.
   * @returns The upgrade definition, or undefined if not found
   */
  get(id: string): UpgradeDefinition | undefined {
    return this.upgrades.get(id);
  }

  /**
   * Get all registered upgrade definitions.
   */
  getAll(): readonly UpgradeDefinition[] {
    return this.upgradeList;
  }

  /**
   * Check if an upgrade exists.
   */
  has(id: string): boolean {
    return this.upgrades.has(id);
  }

  /**
   * Get the number of registered upgrades.
   */
  get count(): number {
    return this.upgrades.size;
  }

  /**
   * Clear all registered upgrades.
   * Useful for testing or hot-reloading.
   */
  clear(): void {
    this.upgrades.clear();
    this.upgradeList = [];
  }
}

/**
 * Create and initialize an upgrade registry from JSON data.
 * Convenience function for common use case.
 */
export function createUpgradeRegistry(definitions: UpgradeDefinition[]): UpgradeRegistry {
  const registry = new UpgradeRegistry();
  registry.register(definitions);
  return registry;
}

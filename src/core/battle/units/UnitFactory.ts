/**
 * Unit Factory
 *
 * Creates UnitInstance objects from UnitDefinition templates.
 * Handles modifier application and stat computation.
 *
 * Godot-portable: No React/browser dependencies.
 */

import { Vector2 } from '../../physics/Vector2';
import { UNIT_TYPE_COLORS, UnitType as ColorUnitType } from '../../theme/colors';
import { ActiveModifier } from '../modifiers/types';
import { getScaledUnitSize } from '../types';
import { computeAllStats, cloneBaseStats } from './StatCalculator';
import { CreateUnitOptions, UnitDefinition, UnitInstance, UnitTeam } from './types';
import { UnitRegistry } from './UnitRegistry';

/**
 * Counter for generating unique unit IDs.
 */
let unitIdCounter = 0;

/**
 * Resets the unit ID counter (for testing).
 */
export function resetUnitIdCounter(): void {
  unitIdCounter = 0;
}

/**
 * Generates a unique unit ID.
 */
export function generateUnitId(): string {
  return `unit_${++unitIdCounter}`;
}

/**
 * Gets the color for a unit based on team and type.
 * Falls back to warrior color if the color key doesn't match.
 */
function getUnitColor(team: UnitTeam, colorKey: string): string {
  // Try to use the color key directly
  const unitTypeColors = UNIT_TYPE_COLORS[colorKey as ColorUnitType];
  if (unitTypeColors) {
    return unitTypeColors[team];
  }
  // Fallback to warrior colors
  return UNIT_TYPE_COLORS.warrior[team];
}

/**
 * Factory for creating unit instances.
 */
export class UnitFactory {
  constructor(private registry: UnitRegistry) {}

  /**
   * Creates a UnitInstance from a definition ID.
   *
   * @param definitionId - The unit definition ID
   * @param team - The team the unit belongs to
   * @param options - Optional creation options
   * @param arenaHeight - Arena height for scaling (defaults to 600)
   * @returns A new UnitInstance
   */
  createUnit(
    definitionId: string,
    team: UnitTeam,
    options: CreateUnitOptions = {},
    arenaHeight: number = 600
  ): UnitInstance {
    const definition = this.registry.get(definitionId);
    return this.createUnitFromDefinition(definition, team, options, arenaHeight);
  }

  /**
   * Creates a UnitInstance directly from a definition object.
   *
   * @param definition - The unit definition
   * @param team - The team the unit belongs to
   * @param options - Optional creation options
   * @param arenaHeight - Arena height for scaling (defaults to 600)
   * @returns A new UnitInstance
   */
  createUnitFromDefinition(
    definition: UnitDefinition,
    team: UnitTeam,
    options: CreateUnitOptions = {},
    arenaHeight: number = 600
  ): UnitInstance {
    const id = generateUnitId();

    // Clone base stats so modifications don't affect the definition
    const baseStats = cloneBaseStats(definition.baseStats);

    // Combine provided modifiers with any default modifiers
    const modifiers = options.modifiers ?? [];

    // Compute stats with modifiers applied
    const computedStats = computeAllStats(baseStats, modifiers);

    // Get visual properties
    const color = getUnitColor(team, definition.visuals.colorKey);
    const size = getScaledUnitSize(definition.visuals.baseSize, arenaHeight);

    // Default position if not provided
    const position = options.position ?? new Vector2(0, 0);

    // Health defaults to max health if not provided (for loading saved state)
    const currentHealth = options.health ?? computedStats.maxHealth;

    return {
      id,
      definitionId: definition.id,
      team,
      position,
      currentHealth,
      baseStats,
      computedStats,
      activeModifiers: [...modifiers],
      activeAbilities: [...definition.innateAbilities],
      abilityCooldowns: {},
      combat: {
        targetId: null,
        attackCooldown: 0,
        shuffleDirection: null,
        shuffleTimer: 0,
        currentAttackMode: null,
      },
      color,
      shape: definition.visuals.shape,
      size,
    };
  }

  /**
   * Applies modifiers to an existing unit and recomputes stats.
   *
   * @param unit - The unit to update
   * @param newModifiers - Modifiers to add
   * @returns Updated unit instance (does not mutate original)
   */
  applyModifiers(unit: UnitInstance, newModifiers: ActiveModifier[]): UnitInstance {
    const combinedModifiers = [...unit.activeModifiers, ...newModifiers];
    const computedStats = computeAllStats(unit.baseStats, combinedModifiers);

    // Adjust current health if max health changed
    const healthRatio = unit.currentHealth / unit.computedStats.maxHealth;
    const newHealth = Math.min(
      computedStats.maxHealth,
      Math.round(healthRatio * computedStats.maxHealth)
    );

    return {
      ...unit,
      activeModifiers: combinedModifiers,
      computedStats,
      currentHealth: newHealth,
    };
  }

  /**
   * Recomputes stats for a unit (e.g., after modifier removal).
   *
   * @param unit - The unit to update
   * @returns Updated unit instance with recomputed stats
   */
  recomputeStats(unit: UnitInstance): UnitInstance {
    const computedStats = computeAllStats(unit.baseStats, unit.activeModifiers);

    // Clamp health to new max
    const newHealth = Math.min(unit.currentHealth, computedStats.maxHealth);

    return {
      ...unit,
      computedStats,
      currentHealth: newHealth,
    };
  }
}

/**
 * Creates a UnitFactory with the provided registry.
 */
export function createUnitFactory(registry: UnitRegistry): UnitFactory {
  return new UnitFactory(registry);
}

/**
 * Battle Upgrade Registry
 *
 * Loads and provides access to battle upgrade definitions.
 * Definitions are loaded from JSON data files.
 *
 * Godot-portable: No React/browser dependencies.
 */

import { IBattleUpgradeRegistry } from './IBattleUpgradeRegistry';
import {
  BattleUpgradeDefinition,
  BattleUpgradeStates,
  UpgradeCostResult,
  UpgradePrerequisite,
  UpgradePrerequisiteContext,
  UpgradeScope,
} from './types';

/**
 * Result of a prerequisite check.
 */
interface PrerequisiteCheckResult {
  met: boolean;
  failureResult?: UpgradeCostResult;
}

/**
 * Handler function signature for checking prerequisites.
 * OCP-compliant: Add new handlers without modifying existing code.
 */
type PrerequisiteHandler = (
  prereq: UpgradePrerequisite,
  context: UpgradePrerequisiteContext
) => PrerequisiteCheckResult;

/**
 * Handler map for prerequisite types (OCP pattern).
 * To add new prerequisite types, add entries here - no switch modification needed.
 */
const PREREQUISITE_HANDLERS: Record<UpgradePrerequisite['type'], PrerequisiteHandler> = {
  upgrade: (prereq, context) => {
    const requiredLevel = prereq.level ?? 1;
    const currentPrereqLevel = context.upgradeLevels[prereq.targetId] ?? 0;
    if (currentPrereqLevel < requiredLevel) {
      return {
        met: false,
        failureResult: {
          cost: 0,
          canPurchase: false,
          reason: 'prerequisite_not_met',
          missingPrerequisite: {
            type: 'upgrade',
            targetId: prereq.targetId,
            required: requiredLevel,
            current: currentPrereqLevel,
          },
        },
      };
    }
    return { met: true };
  },

  wave: (prereq, context) => {
    const requiredWave = parseInt(prereq.targetId, 10);
    if (context.waveNumber < requiredWave) {
      return {
        met: false,
        failureResult: {
          cost: 0,
          canPurchase: false,
          reason: 'prerequisite_not_met',
          missingPrerequisite: {
            type: 'wave',
            targetId: prereq.targetId,
            required: requiredWave,
            current: context.waveNumber,
          },
        },
      };
    }
    return { met: true };
  },

  unit_count: (prereq, context) => {
    const requiredCount = prereq.count ?? 1;
    const currentCount = context.unitCounts[prereq.targetId] ?? 0;
    if (currentCount < requiredCount) {
      return {
        met: false,
        failureResult: {
          cost: 0,
          canPurchase: false,
          reason: 'prerequisite_not_met',
          missingPrerequisite: {
            type: 'unit_count',
            targetId: prereq.targetId,
            required: requiredCount,
            current: currentCount,
          },
        },
      };
    }
    return { met: true };
  },
};

/**
 * Registry for battle upgrade definitions.
 * Provides lookup, filtering, and cost calculation.
 */
export class BattleUpgradeRegistry implements IBattleUpgradeRegistry {
  private definitions: Map<string, BattleUpgradeDefinition> = new Map();
  private byScope: Map<UpgradeScope, BattleUpgradeDefinition[]> = new Map();
  private byTarget: Map<string, BattleUpgradeDefinition[]> = new Map();

  /**
   * Registers an upgrade definition.
   */
  register(definition: BattleUpgradeDefinition): void {
    this.definitions.set(definition.id, definition);

    // Index by scope
    const scopeList = this.byScope.get(definition.scope) ?? [];
    scopeList.push(definition);
    this.byScope.set(definition.scope, scopeList);

    // Index by target (for non-global)
    if (definition.targetId) {
      const targetList = this.byTarget.get(definition.targetId) ?? [];
      targetList.push(definition);
      this.byTarget.set(definition.targetId, targetList);
    }
  }

  /**
   * Registers multiple definitions at once.
   */
  registerAll(definitions: BattleUpgradeDefinition[]): void {
    for (const def of definitions) {
      this.register(def);
    }
  }

  /**
   * Gets an upgrade definition by ID.
   * @throws Error if not found
   */
  get(id: string): BattleUpgradeDefinition {
    const def = this.definitions.get(id);
    if (!def) {
      throw new Error(`Battle upgrade definition not found: ${id}`);
    }
    return def;
  }

  /**
   * Gets an upgrade definition by ID, or undefined if not found.
   */
  tryGet(id: string): BattleUpgradeDefinition | undefined {
    return this.definitions.get(id);
  }

  /**
   * Checks if an upgrade definition exists.
   */
  has(id: string): boolean {
    return this.definitions.has(id);
  }

  /**
   * Gets all upgrade definitions.
   */
  getAll(): BattleUpgradeDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Gets upgrade definitions by scope.
   */
  getByScope(scope: UpgradeScope): BattleUpgradeDefinition[] {
    return this.byScope.get(scope) ?? [];
  }

  /**
   * Gets upgrade definitions that target a specific unit type or category.
   */
  getByTarget(targetId: string): BattleUpgradeDefinition[] {
    return this.byTarget.get(targetId) ?? [];
  }

  /**
   * Gets all upgrades that affect a given unit type.
   * Includes global, unit_type (exact match), and unit_category (category match).
   */
  getUpgradesForUnit(unitType: string, unitCategory: string): BattleUpgradeDefinition[] {
    const result: BattleUpgradeDefinition[] = [];

    // Global upgrades affect all units
    result.push(...this.getByScope('global'));

    // Unit type specific
    result.push(...(this.byTarget.get(unitType) ?? []));

    // Category specific
    result.push(...(this.byTarget.get(unitCategory) ?? []));

    return result;
  }

  /**
   * Calculates the cost of the next level of an upgrade.
   */
  calculateCost(
    upgradeId: string,
    currentLevel: number,
    context: UpgradePrerequisiteContext,
    currency: number
  ): UpgradeCostResult {
    const def = this.get(upgradeId);

    // Check max level
    if (def.maxLevel > 0 && currentLevel >= def.maxLevel) {
      return { cost: 0, canPurchase: false, reason: 'max_level' };
    }

    // Check prerequisites using handler map (OCP pattern)
    for (const prereq of def.prerequisites) {
      const handler = PREREQUISITE_HANDLERS[prereq.type];
      if (handler) {
        const result = handler(prereq, context);
        if (!result.met && result.failureResult) {
          return result.failureResult;
        }
      }
    }

    // Calculate cost: baseCost * costMultiplier^level
    const cost = Math.floor(def.baseCost * Math.pow(def.costMultiplier, currentLevel));

    return {
      cost,
      canPurchase: currency >= cost,
      reason: currency >= cost ? undefined : 'insufficient_funds',
    };
  }

  /**
   * Creates initial upgrade states for all upgrades.
   */
  createInitialStates(): BattleUpgradeStates {
    const states: BattleUpgradeStates = {};
    for (const def of this.definitions.values()) {
      states[def.id] = {
        upgradeId: def.id,
        level: 0,
        totalSpent: 0,
      };
    }
    return states;
  }

  /**
   * Applies a level-up to an upgrade state.
   */
  applyUpgrade(states: BattleUpgradeStates, upgradeId: string, cost: number): BattleUpgradeStates {
    const current = states[upgradeId] ?? { upgradeId, level: 0, totalSpent: 0 };
    return {
      ...states,
      [upgradeId]: {
        ...current,
        level: current.level + 1,
        totalSpent: current.totalSpent + cost,
      },
    };
  }

  /**
   * Gets the current level of an upgrade from states.
   */
  getLevel(states: BattleUpgradeStates, upgradeId: string): number {
    return states[upgradeId]?.level ?? 0;
  }
}

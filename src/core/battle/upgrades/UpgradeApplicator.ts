/**
 * Upgrade Applicator
 *
 * Computes modifiers and abilities granted by purchased upgrades.
 * Bridge between the upgrade system and the unit/modifier systems.
 *
 * Godot-portable: No React/browser dependencies.
 */

import { ActiveModifier, Modifier, ModifierSource } from '../modifiers/types';
import { createActiveModifier } from '../modifiers/ModifierCalculator';
import { UnitDefinition } from '../units/types';
import {
  BattleUpgradeDefinition,
  BattleUpgradeStates,
  ComputedUpgradeModifiers,
  UpgradeType,
} from './types';
import { IBattleUpgradeRegistry } from './IBattleUpgradeRegistry';

/**
 * Context passed to upgrade type handlers.
 */
interface UpgradeHandlerContext {
  upgrade: BattleUpgradeDefinition;
  level: number;
  modifiers: Modifier[];
  grantedAbilities: string[];
}

/**
 * Handler function signature for processing upgrade types.
 * OCP-compliant: Add new handlers without modifying existing code.
 */
type UpgradeTypeHandler = (ctx: UpgradeHandlerContext) => void;

/**
 * Handler map for upgrade types (OCP pattern).
 * To add new upgrade types, add entries here - no switch modification needed.
 */
const UPGRADE_TYPE_HANDLERS: Record<UpgradeType, UpgradeTypeHandler> = {
  stat_modifier: (ctx) => {
    // Apply modifiers scaled by level
    if (ctx.upgrade.modifiers) {
      for (const mod of ctx.upgrade.modifiers) {
        ctx.modifiers.push({
          ...mod,
          value: mod.value * ctx.level,
          id: `${mod.id}_lv${ctx.level}`,
        });
      }
    }
  },

  ability_grant: (ctx) => {
    // Grant ability if upgrade is purchased
    if (ctx.upgrade.abilityId) {
      ctx.grantedAbilities.push(ctx.upgrade.abilityId);
    }
  },

  unlock_unit: () => {
    // Unit unlocks are handled elsewhere (getUnlockedUnits method)
  },
};

/**
 * Applies upgrade effects to units.
 */
export class UpgradeApplicator {
  constructor(private registry: IBattleUpgradeRegistry) {}

  /**
   * Computes all modifiers and abilities for a specific unit type
   * based on current upgrade levels.
   *
   * @param unitDef - The unit definition
   * @param upgradeStates - Current upgrade levels
   * @returns Computed modifiers and granted abilities
   */
  computeForUnit(
    unitDef: UnitDefinition,
    upgradeStates: BattleUpgradeStates
  ): ComputedUpgradeModifiers {
    const modifiers: Modifier[] = [];
    const grantedAbilities: string[] = [];

    // Get all upgrades that affect this unit
    const upgrades = this.registry.getUpgradesForUnit(unitDef.id, unitDef.category);

    for (const upgrade of upgrades) {
      const state = upgradeStates[upgrade.id];
      const level = state?.level ?? 0;

      if (level === 0) continue;

      // Use handler map (OCP pattern) instead of switch
      const handler = UPGRADE_TYPE_HANDLERS[upgrade.upgradeType];
      if (handler) {
        handler({ upgrade, level, modifiers, grantedAbilities });
      }
    }

    return {
      unitType: unitDef.id,
      modifiers,
      grantedAbilities,
    };
  }

  /**
   * Converts computed upgrade modifiers to active modifiers for a unit.
   *
   * @param computed - The computed upgrade modifiers
   * @returns Array of active modifiers ready to apply to a unit
   */
  toActiveModifiers(computed: ComputedUpgradeModifiers): ActiveModifier[] {
    return computed.modifiers.map((mod) =>
      createActiveModifier(
        mod,
        'upgrade' as ModifierSource,
        `upgrade_${mod.id}`,
        undefined, // Permanent
        1
      )
    );
  }

  /**
   * Gets all abilities a unit should have based on upgrades.
   * Combines innate abilities with upgrade-granted abilities.
   *
   * @param unitDef - The unit definition
   * @param upgradeStates - Current upgrade levels
   * @returns Array of all ability IDs the unit should have
   */
  getUnitAbilities(unitDef: UnitDefinition, upgradeStates: BattleUpgradeStates): string[] {
    const computed = this.computeForUnit(unitDef, upgradeStates);
    return [...unitDef.innateAbilities, ...computed.grantedAbilities];
  }

  /**
   * Gets all unlocked unit IDs based on upgrades.
   *
   * @param upgradeStates - Current upgrade levels
   * @returns Set of unlocked unit definition IDs
   */
  getUnlockedUnits(upgradeStates: BattleUpgradeStates): Set<string> {
    const unlocked = new Set<string>();

    for (const upgrade of this.registry.getAll()) {
      if (upgrade.upgradeType !== 'unlock_unit') continue;
      if (!upgrade.unlockUnitId) continue;

      const state = upgradeStates[upgrade.id];
      if (state && state.level > 0) {
        unlocked.add(upgrade.unlockUnitId);
      }
    }

    return unlocked;
  }

  /**
   * Checks if purchasing an upgrade would grant a new ability.
   */
  wouldGrantAbility(upgradeId: string): string | null {
    const upgrade = this.registry.tryGet(upgradeId);
    if (!upgrade) return null;
    if (upgrade.upgradeType !== 'ability_grant') return null;
    return upgrade.abilityId ?? null;
  }

  /**
   * Checks if purchasing an upgrade would unlock a new unit.
   */
  wouldUnlockUnit(upgradeId: string): string | null {
    const upgrade = this.registry.tryGet(upgradeId);
    if (!upgrade) return null;
    if (upgrade.upgradeType !== 'unlock_unit') return null;
    return upgrade.unlockUnitId ?? null;
  }

  /**
   * Gets a summary of what modifiers an upgrade provides.
   * Useful for UI tooltips.
   */
  getUpgradeModifierSummary(
    upgradeId: string,
    currentLevel: number
  ): { current: Modifier[]; next: Modifier[] } | null {
    const upgrade = this.registry.tryGet(upgradeId);
    if (!upgrade || upgrade.upgradeType !== 'stat_modifier' || !upgrade.modifiers) {
      return null;
    }

    const current =
      currentLevel > 0
        ? upgrade.modifiers.map((mod) => ({
            ...mod,
            value: mod.value * currentLevel,
          }))
        : [];

    const next = upgrade.modifiers.map((mod) => ({
      ...mod,
      value: mod.value * (currentLevel + 1),
    }));

    return { current, next };
  }
}

/**
 * Creates an UpgradeApplicator with the provided registry.
 */
export function createUpgradeApplicator(registry: IBattleUpgradeRegistry): UpgradeApplicator {
  return new UpgradeApplicator(registry);
}

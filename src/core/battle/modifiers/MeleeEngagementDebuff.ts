/**
 * Melee Engagement Debuff
 *
 * Debuff applied when units engage in melee combat.
 * Slows both the attacker (immediately) and defender (after delay).
 * Attacker's debuff is cleansed when defender dies.
 *
 * Godot-portable: No React/browser dependencies.
 */

import { UnitTeam } from '../units/types';
import { TemporaryModifier } from './TemporaryModifier';

/**
 * Melee engagement debuff configuration.
 */
export const MELEE_ENGAGEMENT_DEBUFF = {
  /** Source ID for identifying this debuff type */
  sourceId: 'melee_engagement',

  /** Movement speed modifier (-0.5 = 50% slower) */
  moveSpeedMod: -0.5,

  /** Damage modifier (0 = no change) */
  damageMod: 0,

  /** Collision size modifier (1 = 100% larger collision box when engaged in melee) */
  collisionSizeMod: 1,

  /** Duration in seconds */
  duration: 1.0,

  /** Delay before defender receives the debuff (seconds) */
  defenderDelay: 0.2,
} as const;

/**
 * Create a melee engagement debuff for the attacker.
 * Linked to the defender so it's cleansed when defender dies.
 *
 * @param attackerId - ID of the attacking unit
 * @param defenderId - ID of the defending unit (linked for death cleanup)
 * @param defenderTeam - Team of the defender (source of the debuff)
 */
export function createAttackerDebuff(
  attackerId: string,
  defenderId: string,
  defenderTeam: UnitTeam
): TemporaryModifier {
  return {
    id: `${MELEE_ENGAGEMENT_DEBUFF.sourceId}_${attackerId}_${Date.now()}`,
    sourceId: MELEE_ENGAGEMENT_DEBUFF.sourceId,
    sourceTeam: defenderTeam,
    moveSpeedMod: MELEE_ENGAGEMENT_DEBUFF.moveSpeedMod,
    damageMod: MELEE_ENGAGEMENT_DEBUFF.damageMod,
    collisionSizeMod: MELEE_ENGAGEMENT_DEBUFF.collisionSizeMod,
    remainingDuration: MELEE_ENGAGEMENT_DEBUFF.duration,
    linkedUnitId: defenderId,
  };
}

/**
 * Create a melee engagement debuff for the defender.
 * No linked unit - expires naturally.
 *
 * @param defenderId - ID of the defending unit
 * @param attackerTeam - Team of the attacker (source of the debuff)
 */
export function createDefenderDebuff(
  defenderId: string,
  attackerTeam: UnitTeam
): TemporaryModifier {
  return {
    id: `${MELEE_ENGAGEMENT_DEBUFF.sourceId}_${defenderId}_${Date.now()}`,
    sourceId: MELEE_ENGAGEMENT_DEBUFF.sourceId,
    sourceTeam: attackerTeam,
    moveSpeedMod: MELEE_ENGAGEMENT_DEBUFF.moveSpeedMod,
    damageMod: MELEE_ENGAGEMENT_DEBUFF.damageMod,
    collisionSizeMod: MELEE_ENGAGEMENT_DEBUFF.collisionSizeMod,
    remainingDuration: MELEE_ENGAGEMENT_DEBUFF.duration,
  };
}

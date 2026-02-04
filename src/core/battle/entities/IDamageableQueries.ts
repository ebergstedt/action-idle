/**
 * Damageable Queries Interface
 *
 * Query interface for damageable entity operations.
 * Damageables include both mobile units and stationary castles.
 *
 * Godot equivalent: Methods on battle scene for target lookups.
 */

import { IDamageable } from '../IEntity';

/**
 * Interface for querying damageables in the battle world.
 */
export interface IDamageableQueries {
  /** Get all damageable entities (units and castles) */
  getDamageables(): readonly IDamageable[];

  /** Get all enemy damageables relative to a given entity */
  getEnemyDamageablesOf(entity: IDamageable): IDamageable[];
}

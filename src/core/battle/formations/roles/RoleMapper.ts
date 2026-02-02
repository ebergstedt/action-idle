/**
 * Role Mapper for Formation Variety
 *
 * Creates role mapping functions for formation variety through role swapping.
 */

import { FormationRole } from '../../units/types';
import { RoleSwap } from '../types';

/**
 * Available role swap configurations.
 *
 * Design rationale:
 * - Empty swap (no change) is included for 25% "normal" chance when swap triggers
 * - front↔back: Most impactful - melee/ranged positions swap
 * - front↔flank: Warriors go to sides, crawlers go center
 * - back↔flank: Archers spread to flanks, crawlers group behind
 *
 * Not included: All three roles swapping (too chaotic, loses formation identity)
 */
export const ROLE_SWAPS: RoleSwap[][] = [
  [], // No swap (identity mapping)
  [{ from: 'front', to: 'back' }], // Swap front and back
  [{ from: 'front', to: 'flank' }], // Swap front and flank
  [{ from: 'back', to: 'flank' }], // Swap back and flank
];

/**
 * Creates a role mapping function from a swap configuration.
 *
 * How it works:
 * 1. Start with identity mapping (front→front, back→back, flank→flank)
 * 2. For each swap in the config, exchange the mappings
 * 3. Return a function that applies the final mapping
 *
 * @param swaps - Array of role exchanges to apply
 * @returns Function that maps original role to (possibly swapped) role
 */
export function createRoleMapper(
  swaps: RoleSwap[]
): (originalRole: FormationRole) => FormationRole {
  if (swaps.length === 0) {
    return (role) => role;
  }

  const mapping: Record<FormationRole, FormationRole> = {
    front: 'front',
    back: 'back',
    flank: 'flank',
  };

  for (const swap of swaps) {
    const temp = mapping[swap.from];
    mapping[swap.from] = mapping[swap.to];
    mapping[swap.to] = temp;
  }

  return (role) => mapping[role];
}

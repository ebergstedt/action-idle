/**
 * Allied Formation Patterns
 *
 * Default patterns for allied unit placement.
 *
 * Y positions are inverted from enemy patterns:
 * - yPosition 0 = front (toward enemy, top of ally zone)
 * - yPosition 1 = back (away from enemy, bottom of ally zone)
 */

import { EnemyFormationPattern } from '../types';

/**
 * Allied formation patterns.
 */
export const DEFAULT_ALLIED_PATTERNS: EnemyFormationPattern[] = [
  {
    id: 'classic_line',
    name: 'Classic Battle Line',
    // Warriors front, Archers back, Knights on flanks
    front: { yPosition: 0.15, spread: 'line', widthFraction: 0.85 },
    back: { yPosition: 0.6, spread: 'line', widthFraction: 0.9 },
    flank: { yPosition: 0.35, spread: 'wide', widthFraction: 0.95 },
  },
  {
    id: 'defensive',
    name: 'Defensive Formation',
    // Archers front (will kite), Warriors middle as wall, Knights back as reserve
    front: { yPosition: 0.5, spread: 'line', widthFraction: 0.8 },
    back: { yPosition: 0.15, spread: 'line', widthFraction: 0.9 },
    flank: { yPosition: 0.7, spread: 'wide', widthFraction: 0.9 },
  },
  {
    id: 'cavalry_charge',
    name: 'Cavalry Charge',
    // Knights front (aggressive), Warriors middle support, Archers back
    front: { yPosition: 0.35, spread: 'line', widthFraction: 0.85 },
    back: { yPosition: 0.65, spread: 'line', widthFraction: 0.9 },
    flank: { yPosition: 0.1, spread: 'line', widthFraction: 0.7 },
  },
  {
    id: 'left_heavy',
    name: 'Left Heavy',
    // Concentrate forces on left flank
    front: { yPosition: 0.2, spread: 'left', widthFraction: 0.6 },
    back: { yPosition: 0.55, spread: 'line', widthFraction: 0.85 },
    flank: { yPosition: 0.1, spread: 'left', widthFraction: 0.4 },
  },
  {
    id: 'right_heavy',
    name: 'Right Heavy',
    // Concentrate forces on right flank
    front: { yPosition: 0.2, spread: 'right', widthFraction: 0.6 },
    back: { yPosition: 0.55, spread: 'line', widthFraction: 0.85 },
    flank: { yPosition: 0.1, spread: 'right', widthFraction: 0.4 },
  },
];

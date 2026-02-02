/**
 * Enemy Formation Patterns
 *
 * Default patterns for enemy unit placement.
 *
 * Pattern design notes:
 * - yPosition: 0 = very front (aggressive), 1 = very back (defensive)
 * - Front role: melee units, should be toward enemy
 * - Back role: ranged units, should be protected behind front
 * - Flank role: mobile units on the sides
 */

import { EnemyFormationPattern } from '../types';

/**
 * Default enemy formation patterns.
 * Selected based on wave number with occasional random variation.
 */
export const DEFAULT_ENEMY_PATTERNS: EnemyFormationPattern[] = [
  {
    id: 'battle_line',
    name: 'Battle Line',
    // Classic wide formation using full arena width
    front: { yPosition: 0.15, spread: 'line', widthFraction: 0.9 },
    back: { yPosition: 0.5, spread: 'line', widthFraction: 0.95 },
    flank: { yPosition: 0.32, spread: 'wide', widthFraction: 0.98 },
  },
  {
    id: 'left_hammer',
    name: 'Left Hammer',
    // Heavy left flank - all crawlers on left, fangs spread wide
    front: { yPosition: 0.2, spread: 'line', widthFraction: 0.95 },
    back: { yPosition: 0.55, spread: 'wide', widthFraction: 0.9 },
    flank: { yPosition: 0.12, spread: 'left', widthFraction: 0.45 },
  },
  {
    id: 'right_hammer',
    name: 'Right Hammer',
    // Heavy right flank - all crawlers on right, fangs spread wide
    front: { yPosition: 0.2, spread: 'line', widthFraction: 0.95 },
    back: { yPosition: 0.55, spread: 'wide', widthFraction: 0.9 },
    flank: { yPosition: 0.12, spread: 'right', widthFraction: 0.45 },
  },
  {
    id: 'refused_flank',
    name: 'Refused Flank',
    // Strong left, weak right - diagonal formation
    front: { yPosition: 0.1, spread: 'left', widthFraction: 0.6 },
    back: { yPosition: 0.4, spread: 'line', widthFraction: 0.9 },
    flank: { yPosition: 0.25, spread: 'right', widthFraction: 0.35 },
  },
  {
    id: 'wide_envelopment',
    name: 'Wide Envelopment',
    // Spread across entire width, flanks pushed forward
    front: { yPosition: 0.25, spread: 'line', widthFraction: 0.7 },
    back: { yPosition: 0.55, spread: 'line', widthFraction: 0.95 },
    flank: { yPosition: 0.08, spread: 'wide', widthFraction: 0.98 },
  },
];

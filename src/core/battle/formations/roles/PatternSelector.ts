/**
 * Pattern Selector
 *
 * Functions for selecting formation patterns based on wave number.
 */

import { PATTERN_VARIATION_CHANCE } from '../../BattleConfig';
import { EnemyFormationPattern } from '../types';
import { DEFAULT_ENEMY_PATTERNS } from '../patterns/EnemyPatterns';
import { DEFAULT_ALLIED_PATTERNS } from '../patterns/AlliedPatterns';

/**
 * Selects an enemy formation pattern for a given wave number.
 *
 * Algorithm:
 * 1. Base selection: cycle through patterns (wave 1 → pattern 0, etc.)
 * 2. 20% chance to pick a different pattern for variety
 *
 * @param waveNumber - Current wave number
 * @param random - Random number generator function (0-1)
 * @returns Selected pattern
 */
export function selectPatternForWave(
  waveNumber: number,
  random: () => number
): EnemyFormationPattern {
  const patternCount = DEFAULT_ENEMY_PATTERNS.length;

  // Base selection: cycle through patterns
  let patternIndex = (waveNumber - 1) % patternCount;

  // 20% chance to pick a different pattern for variety
  if (random() < PATTERN_VARIATION_CHANCE) {
    patternIndex = Math.floor(random() * patternCount);
  }

  return DEFAULT_ENEMY_PATTERNS[patternIndex];
}

/**
 * Selects an allied formation pattern for a given wave number.
 *
 * @param waveNumber - Current wave number
 * @param random - Random number generator function (0-1)
 * @returns Selected pattern
 */
export function selectAlliedPatternForWave(
  waveNumber: number,
  random: () => number
): EnemyFormationPattern {
  const patternCount = DEFAULT_ALLIED_PATTERNS.length;

  // Base selection: cycle through patterns
  let patternIndex = (waveNumber - 1) % patternCount;

  // 20% chance to pick a different pattern for variety
  if (random() < PATTERN_VARIATION_CHANCE) {
    patternIndex = Math.floor(random() * patternCount);
  }

  return DEFAULT_ALLIED_PATTERNS[patternIndex];
}

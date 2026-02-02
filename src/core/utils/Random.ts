/**
 * Random Number Utilities
 *
 * Pure math functions for random number generation.
 * Godot-portable: Uses standard Math.random().
 *
 * Godot equivalent: randf(), RandomNumberGenerator class
 */

/**
 * Generate a random number with approximately normal (Gaussian) distribution.
 * Uses Box-Muller transform.
 *
 * @param random - Random function to use (default: Math.random)
 * @returns Value with mean 0 and standard deviation 1
 *
 * Godot equivalent: RandomNumberGenerator.randfn() returns normal distribution
 */
export function randomNormal(random: () => number = Math.random): number {
  const u1 = random();
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Generate a random number with normal distribution around a mean.
 *
 * @param mean - Center of the distribution
 * @param stdDev - Standard deviation (spread)
 * @param random - Random function to use (default: Math.random)
 * @returns Random value with the specified distribution
 */
export function randomNormalWithParams(
  mean: number,
  stdDev: number,
  random: () => number = Math.random
): number {
  return mean + randomNormal(random) * stdDev;
}

/**
 * Generate a random multiplier with normal distribution.
 * Useful for variance in speeds, sizes, or other scaling factors.
 *
 * ~68% of values within 1 stdDev of mean, ~95% within 2 stdDev.
 * Rare outliers create occasional "dramatic" results.
 *
 * @param mean - Center of the distribution
 * @param stdDev - Standard deviation (spread)
 * @param min - Minimum value (clamp)
 * @param random - Random function to use (default: Math.random)
 * @returns Clamped random multiplier
 */
export function randomMultiplier(
  mean: number,
  stdDev: number,
  min: number,
  random: () => number = Math.random
): number {
  const multiplier = mean + randomNormal(random) * stdDev;
  return Math.max(min, multiplier);
}

/**
 * Generate a random value between min and max (inclusive).
 *
 * @param min - Minimum value
 * @param max - Maximum value
 * @param random - Random function to use (default: Math.random)
 * @returns Random value in range [min, max]
 *
 * Godot equivalent: randf_range(min, max)
 */
export function randomRange(min: number, max: number, random: () => number = Math.random): number {
  return min + random() * (max - min);
}

/**
 * Generate a random integer between min and max (inclusive).
 *
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param random - Random function to use (default: Math.random)
 * @returns Random integer in range [min, max]
 *
 * Godot equivalent: randi_range(min, max)
 */
export function randomInt(min: number, max: number, random: () => number = Math.random): number {
  return Math.floor(min + random() * (max - min + 1));
}

/**
 * Pick a random element from an array.
 *
 * @param array - Array to pick from
 * @param random - Random function to use (default: Math.random)
 * @returns Random element, or undefined if array is empty
 */
export function randomPick<T>(
  array: readonly T[],
  random: () => number = Math.random
): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(random() * array.length)];
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm.
 *
 * @param array - Array to shuffle (modified in place)
 * @param random - Random function to use (default: Math.random)
 * @returns The shuffled array (same reference)
 *
 * Godot equivalent: Array.shuffle()
 */
export function shuffle<T>(array: T[], random: () => number = Math.random): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

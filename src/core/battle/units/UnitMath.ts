/**
 * Unit Math Utilities
 *
 * Pure functions for common unit calculations.
 * Extracted from UI components for portability and testability.
 *
 * Godot equivalent: Static utility functions or autoload.
 */

/**
 * Calculate health as a percentage (0-100).
 * Used for health bars and status displays.
 *
 * @param health - Current health value
 * @param maxHealth - Maximum health value
 * @returns Percentage rounded to nearest integer
 */
export function calculateHealthPercent(health: number, maxHealth: number): number {
  if (maxHealth <= 0) return 0;
  return Math.round((health / maxHealth) * 100);
}

/**
 * Calculate health as a fraction (0-1).
 * Useful for shader parameters and smooth interpolation.
 *
 * @param health - Current health value
 * @param maxHealth - Maximum health value
 * @returns Fraction clamped to [0, 1]
 */
export function calculateHealthFraction(health: number, maxHealth: number): number {
  if (maxHealth <= 0) return 0;
  return Math.max(0, Math.min(1, health / maxHealth));
}

/**
 * Determine health status category based on percentage.
 * Useful for color coding and status effects.
 *
 * @param healthPercent - Health percentage (0-100)
 * @returns Status category
 */
export function getHealthStatus(healthPercent: number): 'critical' | 'low' | 'medium' | 'high' {
  if (healthPercent <= 10) return 'critical';
  if (healthPercent <= 25) return 'low';
  if (healthPercent <= 50) return 'medium';
  return 'high';
}

/**
 * Check if unit health is critical (at or below threshold).
 *
 * @param health - Current health value
 * @param maxHealth - Maximum health value
 * @param threshold - Critical threshold as fraction (default 0.25 = 25%)
 */
export function isHealthCritical(
  health: number,
  maxHealth: number,
  threshold: number = 0.25
): boolean {
  return health <= maxHealth * threshold;
}

/**
 * Outcome Presentation
 *
 * Pure functions for battle outcome text and display data.
 * Keeps presentation logic in core for Godot portability.
 *
 * Godot equivalent: Static helper class or autoload.
 */

import type { BattleOutcome } from './types';

/**
 * Text content for displaying battle outcomes.
 */
export interface OutcomeText {
  /** Main title (e.g., "Victory", "Defeat") */
  title: string;
  /** Flavor text describing the outcome */
  subtitle: string;
  /** Wave transition info (e.g., "Advancing to Wave 5") */
  waveInfo: string;
}

/**
 * Map of outcome to presentation text.
 * Using a lookup table avoids repeated ternary chains.
 */
const OUTCOME_TEXT_MAP: Record<Exclude<BattleOutcome, 'pending'>, Omit<OutcomeText, 'waveInfo'>> = {
  player_victory: {
    title: 'Victory',
    subtitle: '',
  },
  enemy_victory: {
    title: 'Defeat',
    subtitle: '',
  },
  draw: {
    title: 'Draw',
    subtitle: 'Both armies have been destroyed.',
  },
};

/**
 * Get wave transition info text based on outcome.
 * @param outcome - Battle outcome
 * @param waveNumber - Current wave number
 * @returns Wave info string
 */
function getWaveInfo(outcome: BattleOutcome, waveNumber: number): string {
  if (outcome === 'player_victory') {
    return `Advancing to Wave ${waveNumber + 1}`;
  }
  if (outcome === 'enemy_victory') {
    return waveNumber > 1 ? `Retreating to Wave ${waveNumber - 1}` : 'Defending Wave 1';
  }
  return '';
}

/**
 * Get all outcome presentation text.
 *
 * @param outcome - Battle outcome (must not be 'pending')
 * @param waveNumber - Current wave number
 * @returns Complete outcome text data
 */
export function getOutcomeText(outcome: BattleOutcome, waveNumber: number): OutcomeText | null {
  if (outcome === 'pending') {
    return null;
  }

  const baseText = OUTCOME_TEXT_MAP[outcome];
  return {
    ...baseText,
    waveInfo: getWaveInfo(outcome, waveNumber),
  };
}

/**
 * Type for outcome visual styles.
 */
export type OutcomeStyle = 'victory' | 'defeat' | 'draw';

/**
 * Get the visual style for an outcome.
 * Maps to color scheme keys in theme/colors.ts
 */
export function getOutcomeStyle(outcome: BattleOutcome): OutcomeStyle | null {
  switch (outcome) {
    case 'player_victory':
      return 'victory';
    case 'enemy_victory':
      return 'defeat';
    case 'draw':
      return 'draw';
    default:
      return null;
  }
}

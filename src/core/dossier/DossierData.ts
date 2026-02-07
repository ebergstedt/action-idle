/**
 * Dossier Data
 *
 * Tracks fastest clear times per wave.
 * Pure data types and functions - Godot-portable.
 *
 * Godot equivalent: Resource or ConfigFile data
 */

import type { IPersistenceAdapter } from '../persistence/IPersistenceAdapter';
import { calculateWaveGold } from '../battle/BattleConfig';

const DOSSIER_SAVE_KEY = 'battle_dossier';
const DOSSIER_VERSION = 1;

/**
 * Dossier data structure.
 * Stores fastest clear times per wave (simulation time in seconds).
 */
export interface DossierData {
  version: number;
  fastestTimes: Record<number, number>;
}

/**
 * Default empty dossier.
 */
export const DEFAULT_DOSSIER: DossierData = {
  version: DOSSIER_VERSION,
  fastestTimes: {},
};

/**
 * Update fastest time for a wave if the new time is better.
 * Returns a new DossierData (immutable).
 */
export function updateFastestTime(dossier: DossierData, wave: number, time: number): DossierData {
  const existing = dossier.fastestTimes[wave];
  if (existing !== undefined && existing <= time) {
    return dossier;
  }
  return {
    ...dossier,
    fastestTimes: {
      ...dossier.fastestTimes,
      [wave]: time,
    },
  };
}

/**
 * Get the fastest time for a wave, or null if no record exists.
 */
export function getFastestTime(dossier: DossierData, wave: number): number | null {
  const time = dossier.fastestTimes[wave];
  return time !== undefined ? time : null;
}

/**
 * Format a time in seconds to "M:SS.T" display format.
 * Examples: 0 -> "0:00.0", 83.456 -> "1:23.4", 5.1 -> "0:05.1"
 */
export function formatBattleTime(seconds: number): string {
  const totalSeconds = Math.max(0, seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds * 10) % 10);
  return `${minutes}:${secs.toString().padStart(2, '0')}.${tenths}`;
}

/**
 * Calculate VEST per second for a single wave based on its gold reward and clear time.
 * Returns 0 if clearTime is zero or negative.
 */
export function calculateVestPerSecond(wave: number, clearTime: number): number {
  if (clearTime <= 0) return 0;
  const gold = calculateWaveGold(wave);
  return gold / clearTime;
}

/**
 * Calculate total VEST per second across all recorded waves.
 * Each wave with a fastest time contributes its waveGold / fastestTime.
 */
export function calculateTotalVestPerSecond(dossier: DossierData): number {
  let total = 0;
  for (const [waveStr, time] of Object.entries(dossier.fastestTimes)) {
    const wave = Number(waveStr);
    if (!isNaN(wave) && time > 0) {
      total += calculateWaveGold(wave) / time;
    }
  }
  return total;
}

/**
 * Format a VEST/s rate for display.
 * Examples: 0 -> "0.0", 1.5 -> "1.5", 12.34 -> "12.3"
 */
export function formatVestPerSecond(rate: number): string {
  return rate.toFixed(1);
}

/**
 * Serialize dossier to JSON string.
 */
export function serializeDossier(data: DossierData): string {
  return JSON.stringify(data);
}

/**
 * Deserialize dossier from JSON string.
 * Returns default dossier if parsing fails.
 */
export function deserializeDossier(json: string | null): DossierData {
  if (!json) return { ...DEFAULT_DOSSIER, fastestTimes: {} };

  try {
    const parsed = JSON.parse(json) as Partial<DossierData>;

    const fastestTimes: Record<number, number> = {};
    if (parsed.fastestTimes && typeof parsed.fastestTimes === 'object') {
      for (const [key, value] of Object.entries(parsed.fastestTimes)) {
        const wave = Number(key);
        if (!isNaN(wave) && typeof value === 'number' && value > 0) {
          fastestTimes[wave] = value;
        }
      }
    }

    return {
      version: DOSSIER_VERSION,
      fastestTimes,
    };
  } catch {
    return { ...DEFAULT_DOSSIER, fastestTimes: {} };
  }
}

/**
 * Save dossier using a persistence adapter.
 */
export async function saveDossier(adapter: IPersistenceAdapter, data: DossierData): Promise<void> {
  const json = serializeDossier(data);
  await adapter.save(DOSSIER_SAVE_KEY, json);
}

/**
 * Load dossier using a persistence adapter.
 */
export async function loadDossier(adapter: IPersistenceAdapter): Promise<DossierData> {
  const json = await adapter.load(DOSSIER_SAVE_KEY);
  return deserializeDossier(json);
}

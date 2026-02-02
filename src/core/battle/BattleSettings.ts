/**
 * Battle Settings
 *
 * Persistent settings for the battle system.
 * Pure data types - Godot-portable.
 *
 * Godot equivalent: Resource or ConfigFile data
 */

import type { IPersistenceAdapter } from '../persistence/IPersistenceAdapter';

const SETTINGS_KEY = 'battle_settings';
const SETTINGS_VERSION = 1;

/**
 * Battle settings data structure.
 */
export interface BattleSettingsData {
  version: number;
  autoBattle: boolean;
  battleSpeed: number;
  waveNumber: number;
  highestWave: number;
  gold: number;
}

/**
 * Default settings values.
 */
export const DEFAULT_BATTLE_SETTINGS: BattleSettingsData = {
  version: SETTINGS_VERSION,
  autoBattle: false,
  battleSpeed: 1,
  waveNumber: 1,
  highestWave: 1,
  gold: 0,
};

/**
 * Serialize settings to JSON string.
 */
export function serializeBattleSettings(settings: BattleSettingsData): string {
  return JSON.stringify(settings);
}

/**
 * Deserialize settings from JSON string.
 * Returns default settings if parsing fails or version mismatch.
 */
export function deserializeBattleSettings(data: string | null): BattleSettingsData {
  if (!data) return { ...DEFAULT_BATTLE_SETTINGS };

  try {
    const parsed = JSON.parse(data) as Partial<BattleSettingsData>;

    // Validate and merge with defaults
    return {
      version: SETTINGS_VERSION,
      autoBattle:
        typeof parsed.autoBattle === 'boolean'
          ? parsed.autoBattle
          : DEFAULT_BATTLE_SETTINGS.autoBattle,
      battleSpeed:
        typeof parsed.battleSpeed === 'number'
          ? parsed.battleSpeed
          : DEFAULT_BATTLE_SETTINGS.battleSpeed,
      waveNumber:
        typeof parsed.waveNumber === 'number'
          ? parsed.waveNumber
          : DEFAULT_BATTLE_SETTINGS.waveNumber,
      highestWave:
        typeof parsed.highestWave === 'number'
          ? parsed.highestWave
          : DEFAULT_BATTLE_SETTINGS.highestWave,
      gold: typeof parsed.gold === 'number' ? parsed.gold : DEFAULT_BATTLE_SETTINGS.gold,
    };
  } catch {
    console.warn('Failed to parse battle settings, using defaults');
    return { ...DEFAULT_BATTLE_SETTINGS };
  }
}

/**
 * Save battle settings using a persistence adapter.
 */
export async function saveBattleSettings(
  adapter: IPersistenceAdapter,
  settings: BattleSettingsData
): Promise<void> {
  const data = serializeBattleSettings(settings);
  await adapter.save(SETTINGS_KEY, data);
}

/**
 * Load battle settings using a persistence adapter.
 */
export async function loadBattleSettings(
  adapter: IPersistenceAdapter
): Promise<BattleSettingsData> {
  const data = await adapter.load(SETTINGS_KEY);
  return deserializeBattleSettings(data);
}

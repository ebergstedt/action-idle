import { IPersistenceAdapter } from './IPersistenceAdapter';
import { GameState, SerializedGameState, SAVE_VERSION } from '../types/GameState';
import { deserializeDecimal, serializeDecimal } from '../utils/BigNumber';
import { ILogger, nullLogger } from '../logging';

const SAVE_KEY = 'action_idle_save';

/**
 * Manages game state serialization and persistence.
 * Platform-agnostic through the IPersistenceAdapter interface.
 */
export class SaveManager {
  private adapter: IPersistenceAdapter;
  private logger: ILogger;

  /**
   * Create a SaveManager.
   * @param adapter - Persistence adapter for save/load operations
   * @param logger - Optional logger for diagnostics (defaults to silent)
   */
  constructor(adapter: IPersistenceAdapter, logger: ILogger = nullLogger) {
    this.adapter = adapter;
    this.logger = logger;
  }

  /**
   * Serializes and saves the current game state.
   */
  async saveGame(state: GameState): Promise<void> {
    const serialized: SerializedGameState = {
      currency: serializeDecimal(state.currency),
      totalEarned: serializeDecimal(state.totalEarned),
      upgrades: state.upgrades,
      lastTick: state.lastTick,
      version: SAVE_VERSION,
    };

    await this.adapter.save(SAVE_KEY, JSON.stringify(serialized));
  }

  /**
   * Loads and deserializes the saved game state.
   * Returns null if no save exists.
   */
  async loadGame(): Promise<GameState | null> {
    const data = await this.adapter.load(SAVE_KEY);
    if (!data) {
      return null;
    }

    try {
      const parsed: SerializedGameState = JSON.parse(data);

      // Handle save version migrations here if needed
      if (parsed.version !== SAVE_VERSION) {
        this.logger.warn(`Save version mismatch: expected ${SAVE_VERSION}, got ${parsed.version}`);
        // Future: add migration logic
      }

      return {
        currency: deserializeDecimal(parsed.currency),
        totalEarned: deserializeDecimal(parsed.totalEarned),
        upgrades: parsed.upgrades,
        lastTick: parsed.lastTick,
      };
    } catch (error) {
      this.logger.error('Failed to parse save data:', error);
      return null;
    }
  }

  /**
   * Deletes the saved game.
   */
  async deleteSave(): Promise<void> {
    await this.adapter.delete(SAVE_KEY);
  }

  /**
   * Checks if a save exists.
   */
  async hasSave(): Promise<boolean> {
    return this.adapter.exists(SAVE_KEY);
  }
}

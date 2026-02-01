/**
 * Interface for persistence adapters.
 * This abstraction allows the game to be ported to different platforms
 * (browser localStorage, Godot FileAccess, etc.) with minimal changes.
 */
export interface IPersistenceAdapter {
  /**
   * Saves data to persistent storage.
   * @param key - Unique identifier for the data
   * @param data - Serialized data as a string
   */
  save(key: string, data: string): Promise<void>;

  /**
   * Loads data from persistent storage.
   * @param key - Unique identifier for the data
   * @returns The stored data, or null if not found
   */
  load(key: string): Promise<string | null>;

  /**
   * Deletes data from persistent storage.
   * @param key - Unique identifier for the data
   */
  delete(key: string): Promise<void>;

  /**
   * Checks if data exists in persistent storage.
   * @param key - Unique identifier for the data
   */
  exists(key: string): Promise<boolean>;
}

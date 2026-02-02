import { IPersistenceAdapter } from '../core/persistence/IPersistenceAdapter';

/**
 * Browser-based persistence adapter using localStorage.
 * For Godot migration, replace with a FileAccess-based adapter.
 */
export class LocalStorageAdapter implements IPersistenceAdapter {
  async save(key: string, data: string): Promise<void> {
    try {
      localStorage.setItem(key, data);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw error;
    }
  }

  async load(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to delete from localStorage:', error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error('Failed to check localStorage:', error);
      throw error;
    }
  }
}

export * from './IPersistenceAdapter';
export * from './SaveManager';
// LocalStorageAdapter has been moved to /src/adapters/ (platform-specific).
// Import from '../adapters/LocalStorageAdapter' for browser usage.
// Godot will implement IPersistenceAdapter using FileAccess instead.

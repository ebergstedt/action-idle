export * from './IPersistenceAdapter';
export * from './SaveManager';
// Note: LocalStorageAdapter is a browser-specific implementation.
// Import directly from './LocalStorageAdapter' if needed, not from this index.
// Godot will implement IPersistenceAdapter using FileAccess instead.

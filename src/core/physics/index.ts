export * from './Vector2';
export * from './types';
export * from './IPhysicsEngine';
// MatterPhysicsEngine has been moved to /src/adapters/ (platform-specific).
// Import from '../adapters/MatterPhysicsEngine' for browser usage.
// Godot will implement IPhysicsEngine using PhysicsServer2D instead.

export * from './Vector2';
export * from './types';
export * from './IPhysicsEngine';
// Note: MatterPhysicsEngine is a platform-specific implementation (uses matter-js).
// Import directly from './MatterPhysicsEngine' if needed, not from this index.
// Godot will implement IPhysicsEngine using PhysicsServer2D instead.

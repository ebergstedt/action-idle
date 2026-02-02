// Configuration (centralized constants)
export * from './BattleConfig';

// Render data types (for React rendering layer)
export * from './types';
export * from './shuffle';
export { BattleEngine } from './BattleEngine';
export * from './BoundsEnforcer';

// Settings persistence (Godot-portable)
export * from './BattleSettings';

// New modular unit system
export * from './units';
export * from './modifiers';
export * from './abilities';
export * from './upgrades';

// Entity system (Godot-portable lifecycle)
export * from './IEntity';
export * from './entities';
export * from './BattleStats';

// Input and interaction (Godot-portable)
export * from './SelectionManager';
export * from './DragController';
export * from './BoxSelectController';
export {
  CLASSIC_FORMATION,
  calculateAlliedSpawnPositions,
  calculateEnemySpawnPositions,
  getDefaultEnemyComposition,
  getEnemyCompositionForWave,
  type FormationTemplate,
  type UnitPlacement,
  type SpawnPosition,
  type ArenaBounds,
} from './FormationManager';
export * from './InputAdapter';

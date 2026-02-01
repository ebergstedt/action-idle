// Legacy types and constants (maintained for backward compatibility)
export * from './types';
export * from './shuffle';
export { BattleEngine } from './BattleEngine';

// New modular unit system
export * from './units';
export * from './modifiers';
export * from './abilities';
export * from './upgrades';

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

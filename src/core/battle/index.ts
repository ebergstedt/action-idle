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

// Presentation helpers (Godot-portable)
export * from './OutcomePresentation';

// Input and interaction (Godot-portable)
export * from './ISelectable';
export * from './SelectionManager';
export * from './DragController';
export * from './BoxSelectController';
export {
  CLASSIC_FORMATION,
  calculateAlliedSpawnPositions,
  calculateEnemySpawnPositions,
  calculateDeterministicEnemyPositions,
  getDefaultEnemyComposition,
  getEnemyCompositionForWave,
  getAvailableUnitsForWave,
  getUnitRole,
  selectPatternForWave,
  DEFAULT_ENEMY_PATTERNS,
  type FormationTemplate,
  type UnitPlacement,
  type SpawnPosition,
  type ArenaBounds,
  type EnemyFormationPattern,
  type RoleConfig,
  type SpreadType,
} from './FormationManager';
export * from './InputAdapter';

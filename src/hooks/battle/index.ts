/**
 * Battle Hooks Module
 *
 * Exports focused sub-hooks for battle functionality.
 * These can be composed by useBattle or used independently.
 */

export { useBattleEngine, EMPTY_STATS, type UseBattleEngineReturn } from './useBattleEngine';
export { useBattleSelection, type UseBattleSelectionReturn } from './useBattleSelection';
export {
  useBattleControls,
  type UseBattleControlsOptions,
  type UseBattleControlsReturn,
} from './useBattleControls';
export {
  useBattleDeployment,
  type UseBattleDeploymentOptions,
  type UseBattleDeploymentReturn,
} from './useBattleDeployment';
export {
  useBattleOutcome,
  type UseBattleOutcomeOptions,
  type UseBattleOutcomeReturn,
} from './useBattleOutcome';

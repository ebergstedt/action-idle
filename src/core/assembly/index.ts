/**
 * Assembly Module Exports
 *
 * Godot-portable: No React/browser dependencies.
 */

export type { AssemblyState, SerializedAssemblyState } from './AssemblyState';

export { ASSEMBLY_STATE_VERSION } from './AssemblyState';

export {
  createInitialState,
  canAfford,
  addGold,
  subtractGold,
  updateHighestWave,
  selectUnitType,
  purchaseUpgrade,
  buildPrerequisiteContext,
  serializeState,
  deserializeState,
  isValidSerializedState,
} from './AssemblyManager';

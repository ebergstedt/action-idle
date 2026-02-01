import { Decimal } from '../utils/BigNumber';

/**
 * The state of a single upgrade instance.
 */
export interface UpgradeState {
  level: number;
  unlocked: boolean;
}

/**
 * The complete game state.
 * All numeric values use Decimal for big number support.
 */
export interface GameState {
  currency: Decimal;
  totalEarned: Decimal;
  upgrades: Record<string, UpgradeState>;
  lastTick: number;
}

/**
 * Serializable version of GameState for persistence.
 * Decimals are stored as strings.
 */
export interface SerializedGameState {
  currency: string;
  totalEarned: string;
  upgrades: Record<string, UpgradeState>;
  lastTick: number;
  version: number;
}

/**
 * Current save format version for migration support.
 */
export const SAVE_VERSION = 1;

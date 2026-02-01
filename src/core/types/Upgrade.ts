/**
 * Definition of an upgrade as stored in upgrades.json.
 * This is data-driven - all upgrade stats come from JSON files.
 */
export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  baseProduction: number;
}

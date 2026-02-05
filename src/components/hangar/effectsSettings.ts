/**
 * Effects Settings Types & Defaults
 *
 * Extracted from EffectsSettingsModal for fast refresh compatibility.
 * Component files should only export components.
 */

export interface EffectsSettings {
  glow: boolean;
  scanLines: boolean;
  noise: boolean;
  scanBeam: boolean;
  vignette: boolean;
  cornerBrackets: boolean;
  particles: boolean;
  hexGrid: boolean;
  chromatic: boolean;
  flicker: boolean;
  heatDistortion: boolean;
}

export const DEFAULT_EFFECTS: EffectsSettings = {
  glow: true,
  scanLines: false,
  noise: false,
  scanBeam: false,
  vignette: true,
  cornerBrackets: true,
  particles: true,
  hexGrid: false,
  chromatic: true,
  flicker: false,
  heatDistortion: false,
};

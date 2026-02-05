/**
 * Effects Settings Modal
 *
 * AC6-style modal for toggling visual effects.
 */

import { UI_COLORS, hexToRgba } from '../../core/theme/colors';
import { Panel3D } from '../ui/Panel3D';
import { Button3D } from '../ui/Button3D';
import { DEFAULT_EFFECTS } from './effectsSettings';
import type { EffectsSettings } from './effectsSettings';

interface EffectToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function EffectToggle({ label, description, enabled, onChange }: EffectToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="w-full text-left p-3 transition-colors"
      style={{
        backgroundColor: enabled ? hexToRgba(UI_COLORS.accentPrimary, 0.1) : 'transparent',
        borderLeft: enabled ? `2px solid ${UI_COLORS.accentPrimary}` : '2px solid transparent',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="font-medium tracking-wider text-sm"
          style={{ color: enabled ? UI_COLORS.accentPrimary : UI_COLORS.textPrimary }}
        >
          {label}
        </span>
        <div
          className="w-8 h-4 rounded-full relative transition-colors"
          style={{
            backgroundColor: enabled ? UI_COLORS.accentPrimary : UI_COLORS.metalDark,
          }}
        >
          <div
            className="w-3 h-3 rounded-full absolute top-0.5 transition-all"
            style={{
              backgroundColor: enabled ? UI_COLORS.textPrimary : UI_COLORS.textSecondary,
              left: enabled ? '17px' : '2px',
            }}
          />
        </div>
      </div>
      <div className="text-sm mt-1" style={{ color: UI_COLORS.textSecondary }}>
        {description}
      </div>
    </button>
  );
}

interface EffectsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EffectsSettings;
  onSettingsChange: (settings: EffectsSettings) => void;
}

export function EffectsSettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: EffectsSettingsModalProps) {
  if (!isOpen) return null;

  const updateSetting = (key: keyof EffectsSettings, value: boolean) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const effects: { key: keyof EffectsSettings; label: string; description: string }[] = [
    { key: 'glow', label: 'AMBIENT GLOW', description: 'Slow pulsing orange glow' },
    { key: 'scanLines', label: 'SCAN LINES', description: 'Horizontal CRT-style lines' },
    { key: 'noise', label: 'NOISE/GRAIN', description: 'Subtle static texture' },
    { key: 'scanBeam', label: 'SCAN BEAM', description: 'Sweeping horizontal line' },
    { key: 'vignette', label: 'VIGNETTE', description: 'Darkened screen edges' },
    { key: 'cornerBrackets', label: 'CORNER BRACKETS', description: 'HUD targeting frame' },
    { key: 'particles', label: 'PARTICLES', description: 'Floating dust/debris' },
    { key: 'hexGrid', label: 'HEX GRID', description: 'Hexagonal pattern overlay' },
    { key: 'chromatic', label: 'CHROMATIC', description: 'RGB color separation at edges' },
    { key: 'flicker', label: 'FLICKER', description: 'Random screen interference' },
    { key: 'heatDistortion', label: 'HEAT DISTORTION', description: 'Warping near bottom' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: hexToRgba(UI_COLORS.black, 0.8) }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Panel3D className="w-96 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div
            className="flex items-center justify-between pb-4 mb-4"
            style={{ borderBottom: `1px solid ${UI_COLORS.metalDark}` }}
          >
            <span
              className="text-lg font-bold tracking-widest"
              style={{ color: UI_COLORS.accentPrimary }}
            >
              VISUAL EFFECTS
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-lg"
              style={{ color: UI_COLORS.textSecondary }}
            >
              ✕
            </button>
          </div>

          {/* Effects list */}
          <div
            className="flex-1 overflow-y-auto space-y-1 -mx-4 px-4"
            style={{ maxHeight: '400px' }}
          >
            {effects.map((effect) => (
              <EffectToggle
                key={effect.key}
                label={effect.label}
                description={effect.description}
                enabled={settings[effect.key]}
                onChange={(value) => updateSetting(effect.key, value)}
              />
            ))}
          </div>

          {/* Footer */}
          <div
            className="flex justify-between pt-4 mt-4"
            style={{ borderTop: `1px solid ${UI_COLORS.metalDark}` }}
          >
            <Button3D
              size="sm"
              color={UI_COLORS.metalDark}
              onClick={() => onSettingsChange(DEFAULT_EFFECTS)}
            >
              RESET
            </Button3D>
            <Button3D size="sm" onClick={onClose}>
              CLOSE
            </Button3D>
          </div>
        </Panel3D>
      </div>
    </div>
  );
}

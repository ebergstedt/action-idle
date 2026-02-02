/**
 * Modifier Display Component
 *
 * Displays active buff/debuff modifiers on a unit.
 * Shows icon, name, effects, and remaining duration.
 */

import { UI_COLORS, DEBUFF_COLORS, hexToRgba } from '../../core/theme/colors';
import {
  SHOCKWAVE_DEBUFF_MOVE_SPEED,
  SHOCKWAVE_DEBUFF_DAMAGE,
} from '../../core/battle/BattleConfig';

interface ModifierDisplayProps {
  sourceId: string;
  remainingDuration: number;
}

interface ModifierInfo {
  name: string;
  icon: string;
  effects: string[];
  bgColor: string;
  iconBgColor: string;
  textColor: string;
}

/**
 * Get display info for a modifier based on its source ID.
 * Maps modifier source IDs to human-readable display data.
 */
function getModifierDisplayInfo(sourceId: string): ModifierInfo {
  switch (sourceId) {
    case 'castle_death_shockwave':
      return {
        name: 'Castle Collapse',
        icon: 'X',
        effects: [
          `${Math.abs(SHOCKWAVE_DEBUFF_MOVE_SPEED * 100)}% Move Speed`,
          `${Math.abs(SHOCKWAVE_DEBUFF_DAMAGE * 100)}% Damage`,
        ],
        bgColor: hexToRgba(DEBUFF_COLORS.shockwave, 0.2),
        iconBgColor: DEBUFF_COLORS.shockwave,
        textColor: UI_COLORS.black,
      };
    default:
      return {
        name: sourceId,
        icon: '?',
        effects: ['Unknown effect'],
        bgColor: 'rgba(128, 128, 128, 0.2)',
        iconBgColor: '#808080',
        textColor: UI_COLORS.black,
      };
  }
}

export function ModifierDisplay({ sourceId, remainingDuration }: ModifierDisplayProps) {
  const modifierInfo = getModifierDisplayInfo(sourceId);

  return (
    <div
      className="flex items-start gap-2 p-2 rounded text-sm"
      style={{ backgroundColor: modifierInfo.bgColor }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: modifierInfo.iconBgColor }}
      >
        <span style={{ color: UI_COLORS.white, fontSize: '12px' }}>{modifierInfo.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold" style={{ color: modifierInfo.textColor }}>
          {modifierInfo.name}
        </div>
        <div className="text-sm" style={{ color: modifierInfo.textColor, opacity: 0.8 }}>
          {modifierInfo.effects.map((effect, i) => (
            <div key={i}>{effect}</div>
          ))}
        </div>
        <div className="text-sm mt-1" style={{ color: modifierInfo.textColor, opacity: 0.6 }}>
          {remainingDuration.toFixed(1)}s remaining
        </div>
      </div>
    </div>
  );
}

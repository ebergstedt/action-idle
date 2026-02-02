/**
 * Wax Seal SVG Component
 *
 * A decorative wax seal stamp with customizable colors and symbol.
 * Used in victory/defeat overlays.
 */

import { WAX_SEAL_SVG_SIZE } from '../../core/battle/BattleConfig';

export interface WaxSealColors {
  primary: string;
  secondary: string;
  highlight: string;
  text: string;
}

export interface WaxSealProps {
  colors: WaxSealColors;
  symbol: 'crown' | 'skull';
}

export function WaxSeal({ colors, symbol }: WaxSealProps) {
  return (
    <svg width={WAX_SEAL_SVG_SIZE} height={WAX_SEAL_SVG_SIZE} viewBox="0 0 100 100">
      {/* Outer drip effect */}
      <defs>
        <filter id="waxShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
        </filter>
        <radialGradient id="waxGradient" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor={colors.highlight} />
          <stop offset="50%" stopColor={colors.primary} />
          <stop offset="100%" stopColor={colors.secondary} />
        </radialGradient>
      </defs>

      {/* Irregular wax blob shape */}
      <path
        d="M50 5
           C65 5, 80 15, 88 25
           C95 35, 98 50, 95 60
           C92 72, 85 82, 75 88
           C65 95, 50 98, 40 95
           C28 92, 15 85, 10 72
           C5 60, 5 45, 10 32
           C18 18, 35 5, 50 5Z"
        fill="url(#waxGradient)"
        filter="url(#waxShadow)"
      />

      {/* Inner circle with emboss effect */}
      <circle cx="50" cy="50" r="32" fill={colors.secondary} opacity="0.4" />
      <circle
        cx="50"
        cy="50"
        r="30"
        fill="none"
        stroke={colors.highlight}
        strokeWidth="2"
        opacity="0.6"
      />

      {/* Symbol */}
      <g fill={colors.text} opacity="0.9">
        {symbol === 'crown' ? (
          // Crown symbol for victory
          <path
            d="M30 60 L35 42 L42 52 L50 38 L58 52 L65 42 L70 60 Z
               M28 62 L72 62 L72 68 L28 68 Z"
            transform="translate(0, 2)"
          />
        ) : (
          // Skull symbol for defeat/draw
          <g transform="translate(50, 52)">
            <ellipse cx="0" cy="-8" rx="16" ry="14" />
            <rect x="-12" y="2" width="24" height="8" rx="2" />
            <circle cx="-6" cy="-10" r="4" fill={colors.secondary} />
            <circle cx="6" cy="-10" r="4" fill={colors.secondary} />
            <path d="M-4 0 L0 4 L4 0" fill={colors.secondary} />
          </g>
        )}
      </g>

      {/* Wax texture highlights */}
      <circle cx="35" cy="35" r="8" fill={colors.highlight} opacity="0.15" />
      <circle cx="62" cy="70" r="5" fill={colors.secondary} opacity="0.3" />
    </svg>
  );
}

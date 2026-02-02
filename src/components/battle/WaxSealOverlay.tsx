/**
 * Wax Seal Victory/Defeat Overlay
 *
 * Displays a stamped wax seal when the battle ends.
 * Victory shows a green seal, defeat shows a red seal.
 *
 * Uses extracted hooks for SRP:
 * - useAutoBattleCountdown: Timer logic
 * - getOutcomeText: Text mapping from core
 */

import { useEffect, useState, useCallback } from 'react';
import type { BattleOutcome } from '../../core/battle';
import { getOutcomeText, getOutcomeStyle } from '../../core/battle/OutcomePresentation';
import {
  OVERLAY_SHOW_DELAY_MS,
  OVERLAY_STAMP_DELAY_MS,
  WAX_SEAL_SVG_SIZE,
  WAX_SEAL_PRESTAMP_SCALE,
  WAX_SEAL_PRESTAMP_ROTATION,
  WAX_SEAL_PANEL_PRESTAMP_SCALE,
  WAX_SEAL_STAMP_DURATION,
  WAX_SEAL_PANEL_DURATION,
} from '../../core/battle/BattleConfig';
import { WAX_SEAL_COLORS, UI_COLORS, hexToRgba } from '../../core/theme/colors';
import { useAutoBattleCountdown } from '../../hooks/useAutoBattleCountdown';

interface WaxSealOverlayProps {
  outcome: BattleOutcome;
  goldEarned?: number;
  waveNumber?: number;
  autoBattle?: boolean;
  onDismiss?: () => void;
}

export function WaxSealOverlay({
  outcome,
  goldEarned,
  waveNumber,
  autoBattle,
  onDismiss,
}: WaxSealOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isStamped, setIsStamped] = useState(false);

  // Stable callback for countdown hook
  const handleCountdownComplete = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  // Use extracted countdown hook (SRP: timer logic in one place)
  const { countdown } = useAutoBattleCountdown({
    autoBattle: autoBattle ?? false,
    outcome,
    isReady: isStamped,
    onComplete: handleCountdownComplete,
  });

  // Animate in when outcome changes to non-pending
  useEffect(() => {
    if (outcome !== 'pending') {
      // Small delay before showing overlay
      const showTimer = setTimeout(() => {
        setIsVisible(true);
        // Stamp animation after overlay fades in
        const stampTimer = setTimeout(() => {
          setIsStamped(true);
        }, OVERLAY_STAMP_DELAY_MS);
        return () => clearTimeout(stampTimer);
      }, OVERLAY_SHOW_DELAY_MS);
      return () => clearTimeout(showTimer);
    } else {
      setIsVisible(false);
      setIsStamped(false);
    }
  }, [outcome]);

  if (outcome === 'pending' || !isVisible) {
    return null;
  }

  // Get outcome text from core (Godot-portable)
  const outcomeText = getOutcomeText(outcome, waveNumber ?? 0);
  const outcomeStyle = getOutcomeStyle(outcome);

  // Map style to colors
  const sealColors = outcomeStyle ? WAX_SEAL_COLORS[outcomeStyle] : WAX_SEAL_COLORS.draw;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{
        backgroundColor: hexToRgba(UI_COLORS.black, 0.6),
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-out',
      }}
      onClick={onDismiss}
    >
      <div
        className="flex flex-col items-center gap-6 p-8 rounded-lg"
        style={{
          backgroundColor: UI_COLORS.parchmentBase,
          border: `4px solid ${UI_COLORS.inkBrown}`,
          boxShadow: `0 10px 40px ${hexToRgba(UI_COLORS.black, 0.5)}`,
          transform: isStamped ? 'scale(1)' : `scale(${WAX_SEAL_PANEL_PRESTAMP_SCALE})`,
          opacity: isStamped ? 1 : 0,
          transition: `transform ${WAX_SEAL_PANEL_DURATION}s cubic-bezier(0.34, 1.56, 0.64, 1), opacity ${WAX_SEAL_PANEL_DURATION}s ease-out`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Wax Seal */}
        <div
          className="relative"
          style={{
            transform: isStamped
              ? 'scale(1) rotate(0deg)'
              : `scale(${WAX_SEAL_PRESTAMP_SCALE}) rotate(${WAX_SEAL_PRESTAMP_ROTATION}deg)`,
            transition: `transform ${WAX_SEAL_STAMP_DURATION}s cubic-bezier(0.34, 1.56, 0.64, 1)`,
          }}
        >
          <WaxSeal colors={sealColors} symbol={outcome === 'player_victory' ? 'crown' : 'skull'} />
        </div>

        {/* Title */}
        <h2
          className="text-3xl font-bold tracking-wide"
          style={{
            color: UI_COLORS.inkBlack,
            fontFamily: 'serif',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}
        >
          {outcomeText?.title}
        </h2>

        {/* Subtitle */}
        <p
          className="text-lg text-center max-w-xs"
          style={{
            color: UI_COLORS.inkBrown,
            fontFamily: 'serif',
            fontStyle: 'italic',
          }}
        >
          {outcomeText?.subtitle}
        </p>

        {/* Gold earned (victory only) */}
        {outcome === 'player_victory' && goldEarned !== undefined && goldEarned > 0 && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded"
            style={{
              backgroundColor: hexToRgba(UI_COLORS.goldPrimary, 0.2),
            }}
          >
            <span className="text-xl font-bold" style={{ color: UI_COLORS.inkBlack }}>
              +{goldEarned.toLocaleString()} Gold
            </span>
          </div>
        )}

        {/* Wave transition info */}
        {outcomeText?.waveInfo && (
          <p
            className="text-sm"
            style={{
              color: UI_COLORS.inkBrown,
              fontWeight: 'bold',
            }}
          >
            {outcomeText.waveInfo}
          </p>
        )}

        {/* Click to continue hint or auto-battle countdown */}
        <p
          className="text-sm mt-4"
          style={{
            color: UI_COLORS.inkFaded,
          }}
        >
          {autoBattle ? `Next battle in ${countdown}s...` : 'Click anywhere to continue'}
        </p>
      </div>
    </div>
  );
}

interface WaxSealProps {
  colors: {
    primary: string;
    secondary: string;
    highlight: string;
    text: string;
  };
  symbol: 'crown' | 'skull';
}

function WaxSeal({ colors, symbol }: WaxSealProps) {
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

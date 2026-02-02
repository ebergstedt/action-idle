/**
 * Wax Seal Victory/Defeat Overlay
 *
 * Displays a stamped wax seal when the battle ends.
 * Victory shows a green seal, defeat shows a red seal.
 */

import { useEffect, useState } from 'react';
import type { BattleOutcome } from '../../core/battle';
import { WAX_SEAL_COLORS, UI_COLORS } from '../../core/theme/colors';

interface WaxSealOverlayProps {
  outcome: BattleOutcome;
  goldEarned?: number;
  waveNumber?: number;
  autoBattle?: boolean;
  onDismiss?: () => void;
}

const AUTO_BATTLE_COUNTDOWN_SECONDS = 3;

export function WaxSealOverlay({
  outcome,
  goldEarned,
  waveNumber,
  autoBattle,
  onDismiss,
}: WaxSealOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isStamped, setIsStamped] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_BATTLE_COUNTDOWN_SECONDS);

  // Animate in when outcome changes to non-pending
  useEffect(() => {
    if (outcome !== 'pending') {
      // Small delay before showing overlay
      const showTimer = setTimeout(() => {
        setIsVisible(true);
        // Stamp animation after overlay fades in
        const stampTimer = setTimeout(() => {
          setIsStamped(true);
        }, 300);
        return () => clearTimeout(stampTimer);
      }, 500);
      return () => clearTimeout(showTimer);
    } else {
      setIsVisible(false);
      setIsStamped(false);
      setCountdown(AUTO_BATTLE_COUNTDOWN_SECONDS);
    }
  }, [outcome]);

  // Auto-battle countdown timer
  useEffect(() => {
    if (!autoBattle || outcome === 'pending' || !isStamped) return;

    // Start countdown after stamp animation completes
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          onDismiss?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [autoBattle, outcome, isStamped, onDismiss]);

  if (outcome === 'pending' || !isVisible) {
    return null;
  }

  const sealColors =
    outcome === 'player_victory'
      ? WAX_SEAL_COLORS.victory
      : outcome === 'enemy_victory'
        ? WAX_SEAL_COLORS.defeat
        : WAX_SEAL_COLORS.draw;

  const title =
    outcome === 'player_victory' ? 'Victory' : outcome === 'enemy_victory' ? 'Defeat' : 'Draw';

  const subtitle =
    outcome === 'player_victory'
      ? 'The enemy has been vanquished!'
      : outcome === 'enemy_victory'
        ? 'Your forces have fallen...'
        : 'Both armies have been destroyed.';

  const waveInfo =
    outcome === 'player_victory'
      ? `Advancing to Wave ${(waveNumber ?? 0) + 1}`
      : outcome === 'enemy_victory'
        ? waveNumber && waveNumber > 1
          ? `Retreating to Wave ${waveNumber - 1}`
          : 'Defending Wave 1'
        : '';

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          transform: isStamped ? 'scale(1)' : 'scale(0.8)',
          opacity: isStamped ? 1 : 0,
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Wax Seal */}
        <div
          className="relative"
          style={{
            transform: isStamped ? 'scale(1) rotate(0deg)' : 'scale(1.5) rotate(-15deg)',
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
          {title}
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
          {subtitle}
        </p>

        {/* Gold earned (victory only) */}
        {outcome === 'player_victory' && goldEarned !== undefined && goldEarned > 0 && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded"
            style={{
              backgroundColor: 'rgba(218, 165, 32, 0.2)',
            }}
          >
            <span className="text-xl font-bold" style={{ color: UI_COLORS.inkBlack }}>
              +{goldEarned.toLocaleString()} Gold
            </span>
          </div>
        )}

        {/* Wave transition info */}
        {waveInfo && (
          <p
            className="text-sm"
            style={{
              color: UI_COLORS.inkBrown,
              fontWeight: 'bold',
            }}
          >
            {waveInfo}
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
  const size = 120;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
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

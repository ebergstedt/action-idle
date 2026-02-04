/**
 * Battle Result Overlay
 *
 * Displays mission complete/failed status when battle ends.
 * Industrial mech aesthetic with clean result presentation.
 *
 * Uses extracted hooks for SRP:
 * - useAutoBattleCountdown: Timer logic
 * - getOutcomeText: Text mapping from core
 */

import { useEffect, useState, useCallback } from 'react';
import type { BattleOutcome } from '../../core/battle';
import { getOutcomeText } from '../../core/battle/OutcomePresentation';
import {
  OVERLAY_SHOW_DELAY_MS,
  OVERLAY_STAMP_DELAY_MS,
  WAX_SEAL_PANEL_PRESTAMP_SCALE,
  WAX_SEAL_PANEL_DURATION,
} from '../../core/battle/BattleConfig';
import { UI_COLORS, hexToRgba } from '../../core/theme/colors';
import { useAutoBattleCountdown } from '../../hooks/useAutoBattleCountdown';

interface WaxSealOverlayProps {
  outcome: BattleOutcome;
  vestEarned?: number;
  waveNumber?: number;
  autoBattle?: boolean;
  onDismiss?: () => void;
}

export function WaxSealOverlay({
  outcome,
  vestEarned,
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
        // Animation after overlay fades in
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

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{
        backgroundColor: hexToRgba(UI_COLORS.black, 0.8),
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-out',
      }}
      onClick={onDismiss}
    >
      <div
        className="flex flex-col items-center gap-6 p-8 rounded-lg"
        style={{
          backgroundColor: UI_COLORS.panelBase,
          border: `2px solid ${UI_COLORS.metalDark}`,
          boxShadow: `0 10px 40px ${hexToRgba(UI_COLORS.black, 0.5)}`,
          transform: isStamped ? 'scale(1)' : `scale(${WAX_SEAL_PANEL_PRESTAMP_SCALE})`,
          opacity: isStamped ? 1 : 0,
          transition: `transform ${WAX_SEAL_PANEL_DURATION}s cubic-bezier(0.34, 1.56, 0.64, 1), opacity ${WAX_SEAL_PANEL_DURATION}s ease-out`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2
          className="text-3xl font-bold tracking-wide"
          style={{
            color: UI_COLORS.textPrimary,
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
            color: UI_COLORS.textSecondary,
            fontStyle: 'italic',
          }}
        >
          {outcomeText?.subtitle}
        </p>

        {/* VEST earned (victory only) */}
        {outcome === 'player_victory' && vestEarned !== undefined && vestEarned > 0 && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded"
            style={{
              backgroundColor: hexToRgba(UI_COLORS.accentPrimary, 0.2),
            }}
          >
            <span className="text-xl font-bold" style={{ color: UI_COLORS.accentPrimary }}>
              +{vestEarned.toLocaleString()} VEST
            </span>
          </div>
        )}

        {/* Wave transition info */}
        {outcomeText?.waveInfo && (
          <p
            className="text-sm"
            style={{
              color: UI_COLORS.textSecondary,
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
            color: UI_COLORS.textMuted,
          }}
        >
          {autoBattle ? `Next sortie in ${countdown}s...` : 'Click anywhere to continue'}
        </p>
      </div>
    </div>
  );
}

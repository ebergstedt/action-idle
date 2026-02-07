/**
 * Battle Timer Component
 *
 * Displays simulation time during battle.
 * Only visible when battle has started.
 */

import { UI_COLORS } from '../../core/theme/colors';
import { formatBattleTime } from '../../core/dossier';

interface BattleTimerProps {
  simulationTime: number;
  hasStarted: boolean;
}

export function BattleTimer({ simulationTime, hasStarted }: BattleTimerProps) {
  if (!hasStarted) return null;

  return (
    <div
      className="text-sm font-mono tracking-wider text-center"
      style={{
        color: UI_COLORS.textSecondary,
      }}
    >
      {formatBattleTime(simulationTime)}
    </div>
  );
}

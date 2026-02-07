/**
 * Dossier Content Component
 *
 * Displays fastest clear times per wave in the hangar.
 * Shows a table of waves with VEST reward, recorded times, and VEST/s rates.
 */

import { Panel3D, PanelHeader } from '../ui/Panel3D';
import { UI_COLORS, hexToRgba } from '../../core/theme/colors';
import { calculateWaveGold } from '../../core/battle/BattleConfig';
import {
  DossierData,
  getFastestTime,
  formatBattleTime,
  calculateVestPerSecond,
  formatVestPerSecond,
} from '../../core/dossier';

interface DossierContentProps {
  dossierData: DossierData;
  highestWave: number;
  totalVestPerSecond: number;
}

export function DossierContent({
  dossierData,
  highestWave,
  totalVestPerSecond,
}: DossierContentProps) {
  const waves = Array.from({ length: highestWave }, (_, i) => i + 1);

  return (
    <div className="flex h-full gap-4">
      <Panel3D className="w-80 flex-shrink-0 h-full" innerClassName="flex flex-col overflow-hidden">
        <PanelHeader>DOSSIER</PanelHeader>

        {/* Total VEST/s summary */}
        <div
          className="flex justify-between items-center mb-3 pb-3"
          style={{ borderBottom: `1px solid ${UI_COLORS.metalDark}` }}
        >
          <span className="text-sm tracking-wide" style={{ color: UI_COLORS.textSecondary }}>
            TOTAL
          </span>
          <span className="font-mono font-bold" style={{ color: UI_COLORS.accentPrimary }}>
            {formatVestPerSecond(totalVestPerSecond)} VEST/s
          </span>
        </div>

        {highestWave === 0 ? (
          <div className="text-sm text-center py-8" style={{ color: UI_COLORS.textSecondary }}>
            No battles recorded yet. Complete a sortie to begin tracking.
          </div>
        ) : (
          <div className="flex-1 scrollable min-h-0">
            <table className="w-full">
              <thead>
                <tr className="text-sm tracking-wider" style={{ color: UI_COLORS.textSecondary }}>
                  <th className="text-left py-1 px-2 font-medium">WAVE</th>
                  <th className="text-right py-1 px-2 font-medium">VEST</th>
                  <th className="text-right py-1 px-2 font-medium">TIME</th>
                  <th className="text-right py-1 px-2 font-medium">VEST/s</th>
                </tr>
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      height: '1px',
                      background: UI_COLORS.metalDark,
                    }}
                  />
                </tr>
              </thead>
              <tbody>
                {waves.map((wave) => {
                  const time = getFastestTime(dossierData, wave);
                  const gold = calculateWaveGold(wave);
                  const vestRate = time !== null ? calculateVestPerSecond(wave, time) : null;
                  return (
                    <tr
                      key={wave}
                      style={{
                        backgroundColor:
                          wave % 2 === 0 ? hexToRgba(UI_COLORS.white, 0.03) : 'transparent',
                      }}
                    >
                      <td
                        className="py-1.5 px-2 font-mono"
                        style={{ color: UI_COLORS.textPrimary }}
                      >
                        {wave}
                      </td>
                      <td
                        className="py-1.5 px-2 text-right font-mono"
                        style={{ color: UI_COLORS.textPrimary }}
                      >
                        {gold}
                      </td>
                      <td
                        className="py-1.5 px-2 text-right font-mono"
                        style={{
                          color: time !== null ? UI_COLORS.textPrimary : UI_COLORS.textMuted,
                        }}
                      >
                        {time !== null ? formatBattleTime(time) : '--'}
                      </td>
                      <td
                        className="py-1.5 px-2 text-right font-mono"
                        style={{
                          color: vestRate !== null ? UI_COLORS.accentPrimary : UI_COLORS.textMuted,
                        }}
                      >
                        {vestRate !== null ? formatVestPerSecond(vestRate) : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel3D>
    </div>
  );
}

import { Decimal, formatNumber } from '../../core/utils/BigNumber';
import { DARK_THEME } from '../../core/theme/colors';

interface StatsDisplayProps {
  currency: Decimal;
  productionPerSecond: Decimal;
  onManualClick: () => void;
}

export function StatsDisplay({ currency, productionPerSecond, onManualClick }: StatsDisplayProps) {
  return (
    <div className="rounded-lg p-6 text-center" style={{ backgroundColor: DARK_THEME.bgSecondary }}>
      <div className="mb-4">
        <div className="text-4xl font-bold" style={{ color: DARK_THEME.accentGold }}>
          {formatNumber(currency)}
        </div>
        <div className="text-sm mt-1" style={{ color: DARK_THEME.textSecondary }}>
          Currency
        </div>
      </div>

      <div className="text-lg mb-6" style={{ color: DARK_THEME.textSecondary }}>
        <span style={{ color: DARK_THEME.success }}>{formatNumber(productionPerSecond)}</span>
        <span style={{ color: DARK_THEME.textTertiary }}> /sec</span>
      </div>

      <button
        onClick={onManualClick}
        className="font-bold py-4 px-8 rounded-lg transition-colors duration-150 text-xl active:scale-95 transform"
        style={{
          backgroundColor: DARK_THEME.accentGold,
          color: DARK_THEME.bgPrimary,
        }}
      >
        Click!
      </button>
    </div>
  );
}

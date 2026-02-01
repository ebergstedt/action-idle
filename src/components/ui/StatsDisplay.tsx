import { Decimal, formatNumber } from '../../core/utils/BigNumber';
import { DARK_THEME } from '../../core/theme/colors';

interface StatsDisplayProps {
  currency: Decimal;
  productionPerSecond: Decimal;
  onManualClick: () => void;
}

export function StatsDisplay({ currency, productionPerSecond, onManualClick }: StatsDisplayProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 text-center">
      <div className="mb-4">
        <div className="text-4xl font-bold" style={{ color: DARK_THEME.accentGold }}>
          {formatNumber(currency)}
        </div>
        <div className="text-sm text-gray-400 mt-1">Currency</div>
      </div>

      <div className="text-lg text-gray-300 mb-6">
        <span style={{ color: DARK_THEME.success }}>{formatNumber(productionPerSecond)}</span>
        <span className="text-gray-500"> /sec</span>
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

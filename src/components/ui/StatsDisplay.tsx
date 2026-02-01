import { Decimal, formatNumber } from '../../core/utils/BigNumber';

interface StatsDisplayProps {
  currency: Decimal;
  productionPerSecond: Decimal;
  onManualClick: () => void;
}

export function StatsDisplay({ currency, productionPerSecond, onManualClick }: StatsDisplayProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 text-center">
      <div className="mb-4">
        <div className="text-4xl font-bold text-yellow-400">{formatNumber(currency)}</div>
        <div className="text-sm text-gray-400 mt-1">Currency</div>
      </div>

      <div className="text-lg text-gray-300 mb-6">
        <span className="text-green-400">{formatNumber(productionPerSecond)}</span>
        <span className="text-gray-500"> /sec</span>
      </div>

      <button
        onClick={onManualClick}
        className="bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600
                   text-gray-900 font-bold py-4 px-8 rounded-lg
                   transition-colors duration-150 text-xl
                   active:scale-95 transform"
      >
        Click!
      </button>
    </div>
  );
}

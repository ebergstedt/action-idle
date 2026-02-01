import Decimal from 'break_infinity.js';

export { Decimal };

/**
 * Formats a Decimal number for display.
 * Uses scientific notation for very large numbers.
 */
export function formatNumber(value: Decimal): string {
  if (value.lt(1000)) {
    return value.toFixed(2);
  }
  if (value.lt(1e6)) {
    return value.toFixed(0);
  }
  if (value.lt(1e9)) {
    return value.div(1e6).toNumber().toFixed(2) + 'M';
  }
  if (value.lt(1e12)) {
    return value.div(1e9).toNumber().toFixed(2) + 'B';
  }
  if (value.lt(1e15)) {
    return value.div(1e12).toNumber().toFixed(2) + 'T';
  }
  // Scientific notation for very large numbers
  return value.toExponential(2);
}

/**
 * Creates a new Decimal from various input types.
 */
export function toDecimal(value: number | string | Decimal): Decimal {
  return new Decimal(value);
}

/**
 * Serializes a Decimal to a string for JSON storage.
 */
export function serializeDecimal(value: Decimal): string {
  return value.toString();
}

/**
 * Deserializes a string back to a Decimal.
 */
export function deserializeDecimal(value: string): Decimal {
  return new Decimal(value);
}

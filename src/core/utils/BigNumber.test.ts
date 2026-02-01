import { describe, it, expect } from 'vitest';
import {
  Decimal,
  formatNumber,
  toDecimal,
  serializeDecimal,
  deserializeDecimal,
} from './BigNumber';

describe('BigNumber utilities', () => {
  describe('formatNumber', () => {
    it('formats small numbers with 2 decimal places', () => {
      expect(formatNumber(new Decimal(1.5))).toBe('1.50');
      expect(formatNumber(new Decimal(999.99))).toBe('999.99');
    });

    it('formats thousands without decimals', () => {
      expect(formatNumber(new Decimal(1000))).toBe('1000');
      expect(formatNumber(new Decimal(999999))).toBe('999999');
    });

    it('formats millions with M suffix', () => {
      expect(formatNumber(new Decimal(1e6))).toBe('1.00M');
      expect(formatNumber(new Decimal(1.5e6))).toBe('1.50M');
      expect(formatNumber(new Decimal(999e6))).toBe('999.00M');
    });

    it('formats billions with B suffix', () => {
      expect(formatNumber(new Decimal(1e9))).toBe('1.00B');
      expect(formatNumber(new Decimal(2.5e9))).toBe('2.50B');
    });

    it('formats trillions with T suffix', () => {
      expect(formatNumber(new Decimal(1e12))).toBe('1.00T');
      expect(formatNumber(new Decimal(3.14e12))).toBe('3.14T');
    });

    it('uses scientific notation for very large numbers', () => {
      const result = formatNumber(new Decimal(1e15));
      expect(result).toMatch(/e\+15/);
    });
  });

  describe('toDecimal', () => {
    it('converts numbers', () => {
      const d = toDecimal(42);
      expect(d.eq(42)).toBe(true);
    });

    it('converts strings', () => {
      const d = toDecimal('123.456');
      expect(d.toNumber()).toBeCloseTo(123.456, 3);
    });

    it('passes through Decimal instances', () => {
      const original = new Decimal(100);
      const d = toDecimal(original);
      expect(d.eq(original)).toBe(true);
    });
  });

  describe('serializeDecimal / deserializeDecimal', () => {
    it('round-trips small numbers', () => {
      const original = new Decimal(42.5);
      const serialized = serializeDecimal(original);
      const deserialized = deserializeDecimal(serialized);
      expect(deserialized.eq(original)).toBe(true);
    });

    it('round-trips very large numbers', () => {
      const original = new Decimal('1e308');
      const serialized = serializeDecimal(original);
      const deserialized = deserializeDecimal(serialized);
      expect(deserialized.eq(original)).toBe(true);
    });

    it('round-trips zero', () => {
      const original = new Decimal(0);
      const serialized = serializeDecimal(original);
      const deserialized = deserializeDecimal(serialized);
      expect(deserialized.eq(0)).toBe(true);
    });
  });
});

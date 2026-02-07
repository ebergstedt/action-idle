import { describe, it, expect } from 'vitest';
import {
  updateFastestTime,
  getFastestTime,
  formatBattleTime,
  calculateVestPerSecond,
  calculateTotalVestPerSecond,
  formatVestPerSecond,
  serializeDossier,
  deserializeDossier,
  DEFAULT_DOSSIER,
  DossierData,
} from '../../../src/core/dossier';

describe('DossierData', () => {
  describe('updateFastestTime', () => {
    it('records time for a new wave', () => {
      const dossier: DossierData = { ...DEFAULT_DOSSIER, fastestTimes: {} };
      const result = updateFastestTime(dossier, 1, 30.5);
      expect(result.fastestTimes[1]).toBe(30.5);
    });

    it('updates time when new time is faster', () => {
      const dossier: DossierData = { ...DEFAULT_DOSSIER, fastestTimes: { 1: 30.0 } };
      const result = updateFastestTime(dossier, 1, 25.0);
      expect(result.fastestTimes[1]).toBe(25.0);
    });

    it('does not update when new time is slower', () => {
      const dossier: DossierData = { ...DEFAULT_DOSSIER, fastestTimes: { 1: 25.0 } };
      const result = updateFastestTime(dossier, 1, 30.0);
      expect(result.fastestTimes[1]).toBe(25.0);
      expect(result).toBe(dossier); // Same reference - no mutation
    });

    it('does not update when new time is equal', () => {
      const dossier: DossierData = { ...DEFAULT_DOSSIER, fastestTimes: { 1: 25.0 } };
      const result = updateFastestTime(dossier, 1, 25.0);
      expect(result).toBe(dossier);
    });

    it('preserves other wave times', () => {
      const dossier: DossierData = { ...DEFAULT_DOSSIER, fastestTimes: { 1: 25.0, 2: 40.0 } };
      const result = updateFastestTime(dossier, 3, 55.0);
      expect(result.fastestTimes[1]).toBe(25.0);
      expect(result.fastestTimes[2]).toBe(40.0);
      expect(result.fastestTimes[3]).toBe(55.0);
    });

    it('returns a new object when updating (immutable)', () => {
      const dossier: DossierData = { ...DEFAULT_DOSSIER, fastestTimes: { 1: 30.0 } };
      const result = updateFastestTime(dossier, 1, 20.0);
      expect(result).not.toBe(dossier);
      expect(dossier.fastestTimes[1]).toBe(30.0); // Original unchanged
    });
  });

  describe('getFastestTime', () => {
    it('returns time for recorded wave', () => {
      const dossier: DossierData = { ...DEFAULT_DOSSIER, fastestTimes: { 5: 42.3 } };
      expect(getFastestTime(dossier, 5)).toBe(42.3);
    });

    it('returns null for unrecorded wave', () => {
      const dossier: DossierData = { ...DEFAULT_DOSSIER, fastestTimes: {} };
      expect(getFastestTime(dossier, 1)).toBeNull();
    });
  });

  describe('formatBattleTime', () => {
    it('formats zero seconds', () => {
      expect(formatBattleTime(0)).toBe('0:00.0');
    });

    it('formats seconds under a minute', () => {
      expect(formatBattleTime(5.1)).toBe('0:05.1');
    });

    it('formats with minutes', () => {
      expect(formatBattleTime(83.456)).toBe('1:23.4');
    });

    it('formats exact minutes', () => {
      expect(formatBattleTime(120)).toBe('2:00.0');
    });

    it('pads seconds to two digits', () => {
      expect(formatBattleTime(3.7)).toBe('0:03.7');
    });

    it('handles negative values as zero', () => {
      expect(formatBattleTime(-5)).toBe('0:00.0');
    });

    it('handles large times', () => {
      expect(formatBattleTime(600)).toBe('10:00.0');
    });

    it('truncates tenths (not rounds)', () => {
      expect(formatBattleTime(1.99)).toBe('0:01.9');
    });
  });

  describe('calculateVestPerSecond', () => {
    it('calculates rate for wave 1 cleared in 11 seconds', () => {
      // Wave 1 gold = floor(10 * (1 + 1 * 0.1)) = 11
      const rate = calculateVestPerSecond(1, 11);
      expect(rate).toBe(1); // 11 gold / 11 seconds
    });

    it('calculates rate for wave 10 cleared in 10 seconds', () => {
      // Wave 10 gold = floor(10 * (1 + 10 * 0.1)) = 20
      const rate = calculateVestPerSecond(10, 10);
      expect(rate).toBe(2); // 20 gold / 10 seconds
    });

    it('returns 0 for zero clear time', () => {
      expect(calculateVestPerSecond(1, 0)).toBe(0);
    });

    it('returns 0 for negative clear time', () => {
      expect(calculateVestPerSecond(1, -5)).toBe(0);
    });
  });

  describe('calculateTotalVestPerSecond', () => {
    it('returns 0 for empty dossier', () => {
      const dossier: DossierData = { ...DEFAULT_DOSSIER, fastestTimes: {} };
      expect(calculateTotalVestPerSecond(dossier)).toBe(0);
    });

    it('sums rates across all recorded waves', () => {
      // Wave 1: 11 gold / 11s = 1.0/s
      // Wave 10: 20 gold / 10s = 2.0/s
      // Total = 3.0/s
      const dossier: DossierData = {
        ...DEFAULT_DOSSIER,
        fastestTimes: { 1: 11, 10: 10 },
      };
      expect(calculateTotalVestPerSecond(dossier)).toBe(3);
    });

    it('handles single wave', () => {
      const dossier: DossierData = {
        ...DEFAULT_DOSSIER,
        fastestTimes: { 5: 15 },
      };
      // Wave 5 gold = floor(10 * (1 + 5 * 0.1)) = 15
      expect(calculateTotalVestPerSecond(dossier)).toBe(1); // 15/15
    });
  });

  describe('formatVestPerSecond', () => {
    it('formats zero', () => {
      expect(formatVestPerSecond(0)).toBe('0.0');
    });

    it('formats with one decimal', () => {
      expect(formatVestPerSecond(1.5)).toBe('1.5');
    });

    it('rounds to one decimal', () => {
      expect(formatVestPerSecond(1.234)).toBe('1.2');
    });

    it('formats large values', () => {
      expect(formatVestPerSecond(12.34)).toBe('12.3');
    });
  });

  describe('serialize/deserialize', () => {
    it('round-trips valid dossier data', () => {
      const dossier: DossierData = {
        version: 1,
        fastestTimes: { 1: 25.3, 5: 60.0, 10: 120.5 },
      };
      const json = serializeDossier(dossier);
      const result = deserializeDossier(json);
      expect(result.version).toBe(1);
      expect(result.fastestTimes[1]).toBe(25.3);
      expect(result.fastestTimes[5]).toBe(60.0);
      expect(result.fastestTimes[10]).toBe(120.5);
    });

    it('returns default for null input', () => {
      const result = deserializeDossier(null);
      expect(result.version).toBe(1);
      expect(Object.keys(result.fastestTimes)).toHaveLength(0);
    });

    it('returns default for invalid JSON', () => {
      const result = deserializeDossier('not json');
      expect(result.version).toBe(1);
      expect(Object.keys(result.fastestTimes)).toHaveLength(0);
    });

    it('ignores invalid time values', () => {
      const json = JSON.stringify({
        version: 1,
        fastestTimes: { 1: 25.0, 2: 'bad', 3: -5, 4: 0 },
      });
      const result = deserializeDossier(json);
      expect(result.fastestTimes[1]).toBe(25.0);
      expect(result.fastestTimes[2]).toBeUndefined();
      expect(result.fastestTimes[3]).toBeUndefined();
      expect(result.fastestTimes[4]).toBeUndefined(); // 0 is not > 0
    });

    it('handles missing fastestTimes', () => {
      const json = JSON.stringify({ version: 1 });
      const result = deserializeDossier(json);
      expect(Object.keys(result.fastestTimes)).toHaveLength(0);
    });
  });
});

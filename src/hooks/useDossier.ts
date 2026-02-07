/**
 * Dossier Hook
 *
 * Manages dossier persistence (fastest wave clear times).
 * Follows same pattern as useBattleSettings.
 *
 * SRP: Only responsible for dossier state and persistence.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { IPersistenceAdapter } from '../core/persistence/IPersistenceAdapter';
import {
  DossierData,
  DEFAULT_DOSSIER,
  loadDossier,
  saveDossier,
  updateFastestTime,
  getFastestTime,
  calculateTotalVestPerSecond,
} from '../core/dossier';

export interface UseDossierOptions {
  persistenceAdapter: IPersistenceAdapter;
}

export interface UseDossierReturn {
  /** Current dossier data */
  dossierData: DossierData;
  /** Whether dossier has loaded from persistence */
  loaded: boolean;
  /**
   * Record a clear time for a wave.
   * Returns whether this was a new record.
   */
  recordTime: (wave: number, simTime: number) => boolean;
  /** Check if a time would be a new record for a wave */
  isNewRecord: (wave: number, simTime: number) => boolean;
  /** Total VEST/s across all recorded waves */
  totalVestPerSecond: number;
  /** Save dossier to persistence */
  save: () => Promise<void>;
}

export function useDossier({ persistenceAdapter }: UseDossierOptions): UseDossierReturn {
  const [dossierData, setDossierData] = useState<DossierData>({
    ...DEFAULT_DOSSIER,
    fastestTimes: {},
  });
  const [loaded, setLoaded] = useState(false);

  // Load dossier on mount
  useEffect(() => {
    loadDossier(persistenceAdapter)
      .then((data) => {
        setDossierData(data);
        setLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load dossier:', err);
        setLoaded(true);
      });
  }, [persistenceAdapter]);

  const isNewRecord = useCallback(
    (wave: number, simTime: number): boolean => {
      const existing = getFastestTime(dossierData, wave);
      return existing === null || simTime < existing;
    },
    [dossierData]
  );

  const recordTime = useCallback(
    (wave: number, simTime: number): boolean => {
      const wasRecord = isNewRecord(wave, simTime);
      if (wasRecord) {
        const updated = updateFastestTime(dossierData, wave, simTime);
        setDossierData(updated);
        // Auto-save on new record
        saveDossier(persistenceAdapter, updated).catch((err) => {
          console.error('Failed to save dossier:', err);
        });
      }
      return wasRecord;
    },
    [dossierData, isNewRecord, persistenceAdapter]
  );

  const totalVestPerSecond = useMemo(() => calculateTotalVestPerSecond(dossierData), [dossierData]);

  const save = useCallback(async () => {
    await saveDossier(persistenceAdapter, dossierData);
  }, [persistenceAdapter, dossierData]);

  return {
    dossierData,
    loaded,
    recordTime,
    isNewRecord,
    totalVestPerSecond,
    save,
  };
}

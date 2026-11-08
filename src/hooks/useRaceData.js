import { useState, useEffect, useCallback } from 'react';
import * as pako from 'pako';
import { Buffer } from 'buffer';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

export const useRaceData = (initialDate = new Date()) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchRaces = useCallback(
    async (targetDate = selectedDate, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const MS = 15 * 60 * 1000;
      const delayToken = Math.floor(Date.now() / MS);
      const cacheBuster = `?v=${delayToken}`;

      try {
        const dateStr = formatDateToDDMMYYYY(targetDate);
        const gcsUrl = `https://pluckier-cdn.tonykennah.workers.dev/${dateStr}-races.json.gz${cacheBuster}`;
        const jsonUrl = `https://pluckier.co.uk/${dateStr}-races.json`;

        let data;

        // 1. Attempt to fetch the gzipped file first
        let response = await fetch(gcsUrl);

        if (response.ok) {
          data = await response.json();
        } else {
          // 2. Fallback: If .gz is missing, try fetching the uncompressed JSON file
          response = await fetch(jsonUrl);

          if (!response.ok) {
            throw new Error(`Failed to load races (Gzip missing and JSON returned status ${response.status})`);
          }

          data = await response.json();
        }

        const raceList = Array.isArray(data) ? data : [];
        setRaces(raceList);
      } catch (err) {
        console.error('Error fetching race cards:', err);
        setError(err.message || 'Unable to load races for this date');
        setRaces([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDate]
  );

  useEffect(() => {
    fetchRaces(selectedDate);
  }, [fetchRaces, selectedDate]);

  return {
    races,
    loading,
    refreshing,
    error,
    selectedDate,
    setSelectedDate,
    fetchRaces,
  };
};

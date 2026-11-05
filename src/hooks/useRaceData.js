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

      try {
        const dateStr = formatDateToDDMMYYYY(targetDate);
        const gzipUrl = `https://pluckier.co.uk/${dateStr}-races.json.gz`;
        const jsonUrl = `https://pluckier.co.uk/${dateStr}-races.json`;

        let data;

        // 1. Attempt to fetch the gzipped file first
        let response = await fetch(gzipUrl);

        if (response.ok) {
          // Process gzipped data
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const decompressedString = pako.ungzip(uint8Array, { toText: true });
          data = JSON.parse(decompressedString);
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

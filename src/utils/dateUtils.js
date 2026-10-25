import { useState, useEffect, useCallback } from 'react';
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
        const url = `https://www.pluckier.co.uk/${dateStr}-races.json`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to load races (${response.status})`);
        }

        const data = await response.json();
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


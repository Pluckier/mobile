import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';

import RaceHeader from './src/components/RaceHeader';
import RaceNavigation from './src/components/RaceNavigation';
import HorseRow from './src/components/HorseRow';
import { useRaceData } from './src/hooks/useRaceData';
import { sortHorses } from './src/utils/horseUtils';
import { getTheme, createStyles } from './styles';
import { ZOOM_CONFIGS } from './src/constants/zoomConfig';
import { useZoomStore } from './src/store';

export default function App() {
  const { width } = useWindowDimensions();
  const isCompact = width < 650;
  const systemColorScheme = useColorScheme();

  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const zoomIndex = useZoomStore((state) => state.zoomIndex);
  const toggleZoom = useZoomStore((state) => state.toggleZoom);
  const [selectedRaceIndex, setSelectedRaceIndex] = useState(0);
  const [expandedHorses, setExpandedHorses] = useState(() => new Set());

  const { races, loading, refreshing, error, selectedDate, setSelectedDate, fetchRaces } =
    useRaceData(new Date());

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const scale = ZOOM_CONFIGS[zoomIndex].scale;
  const styles = useMemo(() => createStyles(theme, isCompact, scale), [theme, isCompact, scale]);

  const selectedRace = races[selectedRaceIndex] || null;
  const horses = useMemo(() => sortHorses(selectedRace?.horses || []), [selectedRace]);
  const currentZoom = ZOOM_CONFIGS[zoomIndex];

  const handleToggleZoom = () => {
    toggleZoom();
  };

  const handlePrevRace = () => {
    if (selectedRaceIndex > 0) {
      setSelectedRaceIndex((prev) => prev - 1);
      setExpandedHorses(new Set());
    }
  };

  const handleNextRace = () => {
    if (selectedRaceIndex < races.length - 1) {
      setSelectedRaceIndex((prev) => prev + 1);
      setExpandedHorses(new Set());
    }
  };

  const handleDateSelect = (nextDate) => {
    if (nextDate instanceof Date && !isNaN(nextDate.getTime())) {
      setSelectedDate(nextDate);
      setSelectedRaceIndex(0);
      setExpandedHorses(new Set());
    }
  };

  const toggleExpand = (horseKey) => {
    setExpandedHorses((prev) => {
      const next = new Set(prev);
      if (next.has(horseKey)) {
        next.delete(horseKey);
      } else {
        next.add(horseKey);
      }
      return next;
    });
  };

  const handleRefresh = () => {
    fetchRaces(selectedDate, true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.statusBg} />

      <RaceHeader
        styles={styles}
        selectedDate={selectedDate}
        onDateChange={handleDateSelect}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onToggleZoom={handleToggleZoom}
        zoomLabel={currentZoom.label}
      />

      {races.length > 0 && (
        <RaceNavigation
          styles={styles}
          races={races}
          selectedRaceIndex={selectedRaceIndex}
          selectedRace={selectedRace}
          onPrevRace={handlePrevRace}
          onNextRace={handleNextRace}
        />
      )}

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.navBtnBg} />
          <Text style={styles.loadingText}>Fetching race cards...</Text>
        </View>
      ) : error && races.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Could not load race cards</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Text style={[styles.retryBtn, styles.retryBtnText]} onPress={() => fetchRaces(selectedDate)}>
              Retry
            </Text>
            <Text
              style={[
                styles.retryBtn,
                { backgroundColor: theme.isDark ? '#27272a' : '#5f6368' },
                styles.retryBtnText,
              ]}
              onPress={() => setSelectedDate(new Date())}
            >
              Today
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.tableScroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.navBtnBg]} />
          }
        >
          {horses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No horses listed for this race card.</Text>
            </View>
          ) : isCompact ? (
            <View style={styles.compactWrapper}>
              {horses.map((item, index) => (
                <HorseRow
                  key={`${item.name}-${item.number || index}`}
                  item={item}
                  index={index}
                  styles={styles}
                  theme={theme}
                  isCompact
                  isExpanded={expandedHorses.has(item.name)}
                  onToggleExpand={toggleExpand}
                />
              ))}
            </View>
          ) : (
            <View style={styles.wideWrapper}>
              {horses.map((item, index) => (
                <HorseRow
                  key={`${item.name}-${item.number || index}`}
                  item={item}
                  index={index}
                  styles={styles}
                  theme={theme}
                  isCompact={false}
                  isExpanded={expandedHorses.has(item.name)}
                  onToggleExpand={toggleExpand}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

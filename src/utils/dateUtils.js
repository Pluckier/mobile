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

const ZOOM_CONFIGS = [
  { scale: 1.0, label: '100%' },
  { scale: 1.5, label: '150%' },
  { scale: 2.0, label: '200%' },
];

export default function App() {
  const { width } = useWindowDimensions();
  const isCompact = width < 650;
  const systemColorScheme = useColorScheme();

  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [zoomIndex, setZoomIndex] = useState(0);
  const [selectedRaceIndex, setSelectedRaceIndex] = useState(0);
  const [expandedHorse, setExpandedHorse] = useState(null);

  const { races, loading, refreshing, error, selectedDate, setSelectedDate, fetchRaces } = useRaceData(new Date());

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const scale = ZOOM_CONFIGS[zoomIndex].scale;
  const styles = useMemo(() => createStyles(theme, isCompact, scale), [theme, isCompact, scale]);

  const selectedRace = races[selectedRaceIndex] || null;
  const horses = useMemo(() => sortHorses(selectedRace?.horses || []), [selectedRace]);
  const currentZoom = ZOOM_CONFIGS[zoomIndex];

  const handleToggleZoom = () => {
    setZoomIndex((prev) => (prev + 1) % ZOOM_CONFIGS.length);
  };

  const handlePrevRace = () => {
    if (selectedRaceIndex > 0) {
      setSelectedRaceIndex((prev) => prev - 1);
      setExpandedHorse(null);
    }
  };

  const handleNextRace = () => {
    if (selectedRaceIndex < races.length - 1) {
      setSelectedRaceIndex((prev) => prev + 1);
      setExpandedHorse(null);
    }
  };

  const handleDateSelect = (nextDate) => {
    if (nextDate instanceof Date && !isNaN(nextDate.getTime())) {
      setSelectedDate(nextDate);
      setSelectedRaceIndex(0);
      setExpandedHorse(null);
    }
  };

  const toggleExpand = (horseKey) => {
    setExpandedHorse((prev) => (prev === horseKey ? null : horseKey));
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
            <Text
              style={[styles.retryBtn, styles.retryBtnText]}
              onPress={() => fetchRaces(selectedDate)}
            >
              Retry
            </Text>
            <Text
              style={[styles.retryBtn, { backgroundColor: theme.isDark ? '#27272a' : '#5f6368' }, styles.retryBtnText]}
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
          {isCompact ? (
            <View style={styles.compactWrapper}>
              {horses.map((item, index) => (
                <HorseRow
                  key={`${item.name}-${item.number || index}`}
                  item={item}
                  index={index}
                  styles={styles}
                  theme={theme}
                  isCompact={true}
                  isExpanded={expandedHorse === item.name}
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
                  isExpanded={expandedHorse === item.name}
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


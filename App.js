import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Image,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';

const getFormattedToday = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Calculate average rating from the last 3 runs (using property run.name)
const getAverageRating = (horse) => {
  const runs = (horse?.past || []).slice(0, 3);
  if (runs.length === 0) return 0;
  const validRatings = runs
    .map((r) => parseFloat(r?.name))
    .filter((val) => !isNaN(val) && val > 0);
  if (validRatings.length === 0) return 0;
  const sum = validRatings.reduce((acc, curr) => acc + curr, 0);
  return sum / validRatings.length;
};

const getTheme = (isDark) => ({
  isDark,
  bg: isDark ? '#121212' : '#f1f3f4',
  cardBg: isDark ? '#1e1e1e' : '#ffffff',
  rowAltBg: isDark ? '#181b22' : '#f8f9fa',
  headerBg: isDark ? '#1a2332' : '#1a73e8',
  headerText: '#ffffff',
  headerDateBg: 'rgba(255, 255, 255, 0.2)',
  headerDateText: '#ffffff',
  headerSubtitle: isDark ? '#cbd5e1' : '#e8eaed',
  headerDetail: isDark ? '#93c5fd' : '#d2e3fc',
  tableHeaderBg: isDark ? '#161e2e' : '#e9ecef',
  tableHeaderBorder: isDark ? '#2e3846' : '#dadce0',
  tableHeaderText: isDark ? '#93c5fd' : '#495057',
  navBg: isDark ? '#1e1e1e' : '#ffffff',
  navBorder: isDark ? '#2e3846' : '#dadce0',
  navBtnBg: isDark ? '#2563eb' : '#1a73e8',
  navBtnText: '#ffffff',
  navBtnDisabledBg: isDark ? '#262626' : '#f1f3f4',
  navBtnDisabledText: isDark ? '#525252' : '#9aa0a6',
  navCounter: isDark ? '#60a5fa' : '#1a73e8',
  navSummary: isDark ? '#f1f5f9' : '#202124',
  textPrimary: isDark ? '#f8fafc' : '#202124',
  textSecondary: isDark ? '#94a3b8' : '#5f6368',
  textTertiary: isDark ? '#64748b' : '#70757a',
  rowBorder: isDark ? '#262d3a' : '#eeeeee',
  ratingPillBg: isDark ? '#2d2206' : '#fef7e0',
  ratingPillBorder: isDark ? '#b45309' : '#f9ab00',
  ratingPillText: isDark ? '#fbbf24' : '#b06000',
  ratingPillInactiveBg: isDark ? '#262626' : '#f1f3f4',
  ratingPillInactiveText: isDark ? '#525252' : '#9aa0a6',
  oddsBadgeBg: isDark ? '#3b1219' : '#fce8e6',
  oddsText: isDark ? '#f87171' : '#c5221f',
  oddsNrBg: isDark ? '#262626' : '#f1f3f4',
  oddsNrText: isDark ? '#94a3b8' : '#5f6368',
  pastBtnBg: isDark ? '#172554' : '#e8f0fe',
  pastBtnBorder: isDark ? '#1e40af' : '#c2e7ff',
  pastBtnText: isDark ? '#93c5fd' : '#1967d2',
  pastBtnActiveBg: isDark ? '#2563eb' : '#1a73e8',
  pastBtnActiveText: '#ffffff',
  pastBg: isDark ? '#141416' : '#fafafa',
  pastBorder: isDark ? '#27272a' : '#eeeeee',
  pastSectionBorder: isDark ? '#2e3846' : '#dadce0',
  pastDateText: isDark ? '#e2e8f0' : '#3c4043',
  pastCourseText: isDark ? '#cbd5e1' : '#3c4043',
  pastDistText: isDark ? '#94a3b8' : '#70757a',
  pastRtgText: isDark ? '#f59e0b' : '#e37400',
  pastPosText: isDark ? '#94a3b8' : '#5f6368',
  pastPosWinText: isDark ? '#4ade80' : '#137333',
  silksPlaceholderBg: isDark ? '#2a3342' : '#f1f3f4',
  toggleBtnBg: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.25)',
  toggleBtnText: '#ffffff',
  statusBar: 'light-content',
  statusBg: isDark ? '#1a2332' : '#1a73e8',
  pillBg: isDark ? '#262626' : '#f1f3f4',
});

export default function App() {
  const { width } = useWindowDimensions();
  const isCompact = width < 650;

  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [races, setRaces] = useState([]);
  const [selectedRaceIndex, setSelectedRaceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedHorse, setExpandedHorse] = useState(null);

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme, isCompact), [theme, isCompact]);

  const fetchRaces = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const todayStr = getFormattedToday();
      const url = `https://www.pluckier.co.uk/${todayStr}-races.json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to load races (${response.status})`);
      }

      const data = await response.json();
      const raceList = Array.isArray(data) ? data : [];
      setRaces(raceList);
      if (raceList.length > 0) {
        setSelectedRaceIndex((prev) => (prev < raceList.length ? prev : 0));
      }
    } catch (err) {
      console.error('Error fetching race cards:', err);
      setError(err.message || 'Unable to load races for today');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRaces();
  }, [fetchRaces]);

  const onRefresh = () => {
    fetchRaces(true);
  };

  const selectedRace = races[selectedRaceIndex] || null;

  // Order horses descending by average rating of their last 3 runs (run.name)
  const horses = useMemo(() => {
    const rawHorses = selectedRace?.horses || [];
    return [...rawHorses].sort((a, b) => {
      const ratingA = getAverageRating(a);
      const ratingB = getAverageRating(b);
      if (ratingB !== ratingA) {
        return ratingB - ratingA; // Highest 3-run average rating first
      }
      // Fallback: order by card number
      const numA = parseInt(a.number, 10) || 999;
      const numB = parseInt(b.number, 10) || 999;
      return numA - numB;
    });
  }, [selectedRace]);

  const toggleExpand = (horseKey) => {
    setExpandedHorse((prev) => (prev === horseKey ? null : horseKey));
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

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.navBtnBg} />
        <Text style={styles.loadingText}>Fetching today's race cards...</Text>
      </View>
    );
  }

  if (error && races.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Could not load race cards</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchRaces()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderHorseRows = () => {
    if (horses.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No horses listed for this race card.</Text>
        </View>
      );
    }

    return horses.map((item, index) => {
      const horseNum = item.number || index + 1;
      const pastRuns = item.past || [];
      const isExpanded = expandedHorse === item.name;
      const avgRating = getAverageRating(item);
      const latestOdd =
        Array.isArray(item.odds) && item.odds.length > 0
          ? item.odds[item.odds.length - 1]
          : null;
      const isNR = latestOdd === 'NR' || latestOdd === 'null';
      const isOddRow = index % 2 === 1;

      if (isCompact) {
        // Phone layout (< 650px): Line 1 (Horse identity) + Line 2 (Connections, Rating, Odds & Past)
        return (
          <View key={`${item.name}-${item.number || index}`} style={styles.rowContainer}>
            <TouchableOpacity
              style={[styles.compactRow, isOddRow && styles.rowAlt]}
              onPress={() => toggleExpand(item.name)}
              activeOpacity={0.7}
            >
              {/* LINE 1: silks, number, form, name, lastRun, age, weight */}
              <View style={styles.compactLine1}>
                {/* 1. Silks */}
                <View style={styles.compactSilksCol}>
                  {item.silks ? (
                    <Image
                      source={{ uri: item.silks }}
                      style={styles.silksImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.silksPlaceholder}>
                      <Text style={styles.silksPlaceholderText}>🏇</Text>
                    </View>
                  )}
                </View>

                {/* 2. Number */}
                <Text style={styles.compactNumberText}>
                  {horseNum}
                  {item.draw ? <Text style={styles.drawText}>({item.draw})</Text> : null}
                </Text>

                {/* 3. Form */}
                <View style={styles.compactFormBadge}>
                  <Text style={styles.formText} numberOfLines={1}>
                    {item.form || '-'}
                  </Text>
                </View>

                {/* 4. Name */}
                <Text style={styles.compactNameText} numberOfLines={1}>
                  {item.name}
                </Text>

                {/* 5. Last Run */}
                <Text style={styles.compactMetaPill}>
                  {item.lastRun ? `${item.lastRun}d` : '-'}
                </Text>

                {/* 6. Age */}
                <Text style={styles.compactMetaPill}>
                  {item.age ? `${item.age}y` : '-'}
                </Text>

                {/* 7. Weight */}
                <Text style={styles.compactWeightText}>
                  {item.weight || '-'}
                </Text>
              </View>

              {/* LINE 2: jockey and trainer together above and below each other, average rating, latest odd, past runs */}
              <View style={styles.compactLine2}>
                {/* 8. Jockey and Trainer stacked */}
                <View style={styles.compactConnectionsCol}>
                  <Text style={styles.jockeyText} numberOfLines={1}>
                    {item.jockey ? `J: ${item.jockey}` : '-'}
                  </Text>
                  <Text style={styles.trainerText} numberOfLines={1}>
                    {item.trainer ? `T: ${item.trainer}` : '-'}
                  </Text>
                </View>

                {/* 9, 10, 11: Rating, Odds, Past runs */}
                <View style={styles.compactRightActions}>
                  {/* 9. Average Rating */}
                  <View style={[styles.ratingPill, avgRating > 0 && styles.ratingPillActive]}>
                    <Text
                      style={[
                        styles.ratingPillText,
                        avgRating > 0 && styles.ratingPillTextActive,
                      ]}
                    >
                      {avgRating > 0 ? `${Math.round(avgRating)}` : '-'}
                    </Text>
                  </View>

                  {/* 10. Latest Odd */}
                  {latestOdd ? (
                    <View style={[styles.oddsPill, isNR && styles.oddsPillNR]}>
                      <Text style={[styles.oddsPillText, isNR && styles.oddsPillTextNR]}>
                        {isNR ? 'NR' : latestOdd}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.oddsDash}>-</Text>
                  )}

                  {/* 11. Past runs summary / details toggle */}
                  {pastRuns.length > 0 ? (
                    <View style={[styles.pastBtn, isExpanded && styles.pastBtnActive]}>
                      <Text
                        style={[
                          styles.pastBtnText,
                          isExpanded && styles.pastBtnTextActive,
                        ]}
                      >
                        {isExpanded ? '▲ hide' : `${pastRuns.length} runs ▼`}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.pastNoneText}>none</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Collapsible Past Runs History Table */}
            {isExpanded && pastRuns.length > 0 && (
              <View style={styles.pastSection}>
                <View style={styles.pastHeaderRow}>
                  <Text style={styles.pastHeader}>
                    Past Performance History ({item.name})
                  </Text>
                  <Text style={styles.pastHeaderNote}>run.name = rating</Text>
                </View>
                {pastRuns.slice(0, 6).map((run, rIdx) => {
                  const isWin = String(run.position || '').trim().split('/')[0] === '1';
                  return (
                    <View key={`${run.date}-${run.time || rIdx}`} style={styles.pastRow}>
                      <Text style={styles.pastDate}>{run.date}</Text>
                      <Text style={styles.pastCourse}>{run.course || '-'}</Text>
                      <Text style={styles.pastDist}>{run.distance || ''}</Text>
                      <Text style={styles.pastRtg}>
                        {run.name ? `Rtg: ${run.name}` : '-'}
                      </Text>
                      <Text style={[styles.pastPos, isWin && styles.pastPosWin]}>
                        {run.position || '-'}
                      </Text>
                    </View>
                  );
                })}
                {pastRuns.length > 6 && (
                  <Text style={styles.morePastText}>
                    + {pastRuns.length - 6} earlier runs
                  </Text>
                )}
              </View>
            )}
          </View>
        );
      }

      // Desktop / Tablet layout (>= 650px): All 11 items spread out across the entire line
      return (
        <View key={`${item.name}-${item.number || index}`} style={styles.rowContainer}>
          <TouchableOpacity
            style={[styles.singleLineRow, isOddRow && styles.rowAlt]}
            onPress={() => toggleExpand(item.name)}
            activeOpacity={0.7}
          >
            {/* 1. Silks */}
            <View style={styles.colSilks}>
              {item.silks ? (
                <Image
                  source={{ uri: item.silks }}
                  style={styles.silksImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.silksPlaceholder}>
                  <Text style={styles.silksPlaceholderText}>🏇</Text>
                </View>
              )}
            </View>

            {/* 2. Number */}
            <View style={styles.colNumber}>
              <Text style={styles.numberText}>
                {horseNum}
                {item.draw ? <Text style={styles.drawText}>({item.draw})</Text> : null}
              </Text>
            </View>

            {/* 3. Form */}
            <View style={styles.colForm}>
              <Text style={styles.formText} numberOfLines={1}>
                {item.form || '-'}
              </Text>
            </View>

            {/* 4. Name */}
            <View style={styles.colName}>
              <Text style={styles.nameText} numberOfLines={1}>
                {item.name}
              </Text>
            </View>

            {/* 5. Last Run */}
            <View style={styles.colLastRun}>
              <Text style={styles.lastRunText}>
                {item.lastRun ? `${item.lastRun}d` : '-'}
              </Text>
            </View>

            {/* 6. Age */}
            <View style={styles.colAge}>
              <Text style={styles.ageText}>
                {item.age ? `${item.age}y` : '-'}
              </Text>
            </View>

            {/* 7. Weight */}
            <View style={styles.colWeight}>
              <Text style={styles.weightText}>
                {item.weight || '-'}
              </Text>
            </View>

            {/* 8. Jockey and Trainer together above and below each other */}
            <View style={styles.colConnections}>
              <Text style={styles.jockeyText} numberOfLines={1}>
                {item.jockey ? `J: ${item.jockey}` : '-'}
              </Text>
              <Text style={styles.trainerText} numberOfLines={1}>
                {item.trainer ? `T: ${item.trainer}` : '-'}
              </Text>
            </View>

            {/* 9. Average Rating */}
            <View style={styles.colRating}>
              <View style={[styles.ratingPill, avgRating > 0 && styles.ratingPillActive]}>
                <Text
                  style={[
                    styles.ratingPillText,
                    avgRating > 0 && styles.ratingPillTextActive,
                  ]}
                >
                  {avgRating > 0 ? Math.round(avgRating) : '-'}
                </Text>
              </View>
            </View>

            {/* 10. Latest Odd */}
            <View style={styles.colOdds}>
              {latestOdd ? (
                <View style={[styles.oddsPill, isNR && styles.oddsPillNR]}>
                  <Text style={[styles.oddsPillText, isNR && styles.oddsPillTextNR]}>
                    {isNR ? 'NR' : latestOdd}
                  </Text>
                </View>
              ) : (
                <Text style={styles.oddsDash}>-</Text>
              )}
            </View>

            {/* 11. Past runs summary / details toggle */}
            <View style={styles.colPast}>
              {pastRuns.length > 0 ? (
                <View style={[styles.pastBtn, isExpanded && styles.pastBtnActive]}>
                  <Text
                    style={[
                      styles.pastBtnText,
                      isExpanded && styles.pastBtnTextActive,
                    ]}
                  >
                    {isExpanded ? '▲ hide' : `${pastRuns.length} ▼`}
                  </Text>
                </View>
              ) : (
                <Text style={styles.pastNoneText}>none</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Collapsible Past Runs History Table */}
          {isExpanded && pastRuns.length > 0 && (
            <View style={styles.pastSection}>
              <View style={styles.pastHeaderRow}>
                <Text style={styles.pastHeader}>
                  Past Performance History ({item.name})
                </Text>
                <Text style={styles.pastHeaderNote}>run.name = rating</Text>
              </View>
              {pastRuns.slice(0, 6).map((run, rIdx) => {
                const isWin = String(run.position || '').trim().split('/')[0] === '1';
                return (
                  <View key={`${run.date}-${run.time || rIdx}`} style={styles.pastRow}>
                    <Text style={styles.pastDate}>{run.date}</Text>
                    <Text style={styles.pastCourse}>{run.course || '-'}</Text>
                    <Text style={styles.pastDist}>{run.distance || ''}</Text>
                    <Text style={styles.pastRtg}>
                      {run.name ? `Rtg: ${run.name}` : '-'}
                    </Text>
                    <Text style={[styles.pastPos, isWin && styles.pastPosWin]}>
                      {run.position || '-'}
                    </Text>
                  </View>
                );
              })}
              {pastRuns.length > 6 && (
                <Text style={styles.morePastText}>
                  + {pastRuns.length - 6} earlier runs
                </Text>
              )}
            </View>
          )}
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.statusBg} />

      {/* Race Overview Card */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{selectedRace?.place || 'No Races'}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.themeToggleBtn}
              onPress={() => setIsDark((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.themeToggleText}>{isDark ? '☀️ Light' : '🌙 Dark'}</Text>
            </TouchableOpacity>
            <Text style={styles.dateBadge}>{getFormattedToday()}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          {selectedRace?.time ? `${selectedRace.time} Race Card` : 'No race selected'}
          {selectedRace?.distance ? ` • ${selectedRace.distance}` : ''}
          {selectedRace?.going ? ` • Going: ${selectedRace.going}` : ''}
        </Text>

        {selectedRace?.detail ? (
          <Text style={styles.raceDetail} numberOfLines={2}>
            {selectedRace.detail}
          </Text>
        ) : null}
      </View>

      {/* Prev / Next Sequential Race Navigation */}
      {races.length > 0 && (
        <View style={styles.navBar}>
          <TouchableOpacity
            style={[styles.navBtn, selectedRaceIndex === 0 && styles.navBtnDisabled]}
            onPress={handlePrevRace}
            disabled={selectedRaceIndex === 0}
            activeOpacity={0.7}
          >
            <Text style={[styles.navBtnText, selectedRaceIndex === 0 && styles.navBtnTextDisabled]}>
              ◀ Prev
            </Text>
          </TouchableOpacity>

          <View style={styles.navCenter}>
            <Text style={styles.navRaceCounter}>
              Race {selectedRaceIndex + 1} of {races.length}
            </Text>
            <Text style={styles.navRaceSummary} numberOfLines={1}>
              {selectedRace?.time} {selectedRace?.place}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.navBtn, selectedRaceIndex === races.length - 1 && styles.navBtnDisabled]}
            onPress={handleNextRace}
            disabled={selectedRaceIndex === races.length - 1}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navBtnText,
                selectedRaceIndex === races.length - 1 && styles.navBtnTextDisabled,
              ]}
            >
              Next ▶
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content Area */}
      <ScrollView
        style={styles.tableScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.navBtnBg]} />
        }
      >
        {isCompact ? (
          // Compact (< 650px): Full-width vertical card list without horizontal scroll
          <View style={styles.compactWrapper}>
            {renderHorseRows()}
          </View>
        ) : (
          // Wide (>= 650px): Full width table spanning 100% of the screen
          <View style={styles.wideWrapper}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thText, styles.colSilks]}>Silks</Text>
              <Text style={[styles.thText, styles.colNumber]}>#</Text>
              <Text style={[styles.thText, styles.colForm]}>Form</Text>
              <Text style={[styles.thText, styles.colName]}>Horse</Text>
              <Text style={[styles.thText, styles.colLastRun]}>LR</Text>
              <Text style={[styles.thText, styles.colAge]}>Age</Text>
              <Text style={[styles.thText, styles.colWeight]}>Wgt</Text>
              <Text style={[styles.thText, styles.colConnections]}>Jockey / Trainer</Text>
              <Text style={[styles.thText, styles.colRating]}>Rtg</Text>
              <Text style={[styles.thText, styles.colOdds]}>Odds</Text>
              <Text style={[styles.thText, styles.colPast]}>Past</Text>
            </View>
            {renderHorseRows()}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme, isCompact) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.bg,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 15,
      color: theme.textSecondary,
    },
    errorIcon: {
      fontSize: 42,
      marginBottom: 8,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    errorMessage: {
      fontSize: 14,
      color: '#d93025',
      textAlign: 'center',
      marginBottom: 16,
    },
    retryBtn: {
      backgroundColor: theme.navBtnBg,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 6,
    },
    retryBtnText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 15,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 12,
      backgroundColor: theme.headerBg,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    themeToggleBtn: {
      backgroundColor: theme.toggleBtnBg,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 12,
    },
    themeToggleText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.toggleBtnText,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.headerText,
    },
    dateBadge: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.headerDateText,
      backgroundColor: theme.headerDateBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    subtitle: {
      fontSize: 14,
      color: theme.headerSubtitle,
      marginTop: 4,
    },
    raceDetail: {
      fontSize: 12,
      color: theme.headerDetail,
      marginTop: 4,
    },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.navBg,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.navBorder,
    },
    navBtn: {
      backgroundColor: theme.navBtnBg,
      paddingVertical: 7,
      paddingHorizontal: 16,
      borderRadius: 6,
    },
    navBtnDisabled: {
      backgroundColor: theme.navBtnDisabledBg,
    },
    navBtnText: {
      color: theme.navBtnText,
      fontWeight: '700',
      fontSize: 13,
    },
    navBtnTextDisabled: {
      color: theme.navBtnDisabledText,
    },
    navCenter: {
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 10,
    },
    navRaceCounter: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.navCounter,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    navRaceSummary: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.navSummary,
      marginTop: 2,
    },
    tableScroll: {
      flex: 1,
    },
    wideWrapper: {
      width: '100%',
      backgroundColor: theme.cardBg,
      paddingBottom: 24,
    },
    compactWrapper: {
      backgroundColor: theme.bg,
      paddingVertical: 4,
      paddingBottom: 20,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      backgroundColor: theme.tableHeaderBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.tableHeaderBorder,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    thText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.tableHeaderText,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    rowContainer: {
      width: '100%',
      borderBottomWidth: 1,
      borderBottomColor: theme.rowBorder,
      backgroundColor: theme.cardBg,
    },
    singleLineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      paddingVertical: 8,
      paddingHorizontal: 12,
      minHeight: 48,
      backgroundColor: theme.cardBg,
    },
    compactRow: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: theme.cardBg,
      marginVertical: 2,
      marginHorizontal: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.rowBorder,
    },
    compactLine1: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    compactSilksCol: {
      width: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 4,
    },
    compactNumberText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
      marginRight: 6,
    },
    compactFormBadge: {
      backgroundColor: theme.isDark ? '#172554' : '#e8f0fe',
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
      marginRight: 6,
    },
    compactNameText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textPrimary,
      flex: 1,
      marginRight: 6,
    },
    compactMetaPill: {
      fontSize: 10.5,
      fontWeight: '600',
      color: theme.textSecondary,
      backgroundColor: theme.pillBg,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
      marginRight: 4,
    },
    compactWeightText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    compactLine2: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
      paddingTop: 5,
      borderTopWidth: 0.5,
      borderTopColor: theme.pastBorder,
    },
    compactConnectionsCol: {
      flex: 1,
      marginRight: 8,
    },
    compactRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    rowAlt: {
      backgroundColor: theme.rowAltBg,
    },
    colSilks: {
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colNumber: {
      width: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colForm: {
      width: 80,
      paddingHorizontal: 4,
      justifyContent: 'center',
    },
    colName: {
      flex: 3,
      minWidth: 130,
      paddingHorizontal: 8,
      justifyContent: 'center',
    },
    colLastRun: {
      width: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colAge: {
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colWeight: {
      width: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colConnections: {
      flex: 3,
      minWidth: 150,
      paddingHorizontal: 8,
      justifyContent: 'center',
    },
    colRating: {
      width: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colOdds: {
      width: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colPast: {
      width: 86,
      alignItems: 'center',
      justifyContent: 'center',
    },
    silksImage: {
      width: 28,
      height: 28,
    },
    silksPlaceholder: {
      width: 28,
      height: 28,
      borderRadius: 4,
      backgroundColor: theme.silksPlaceholderBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    silksPlaceholderText: {
      fontSize: 15,
    },
    numberText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    drawText: {
      fontSize: 10,
      fontWeight: 'normal',
      color: theme.textTertiary,
    },
    formText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.isDark ? '#93c5fd' : '#174ea6',
      letterSpacing: 0.3,
    },
    nameText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    lastRunText: {
      fontSize: 11.5,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    ageText: {
      fontSize: 11.5,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    weightText: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    jockeyText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    trainerText: {
      fontSize: 10,
      color: theme.textSecondary,
      marginTop: 1,
    },
    ratingPill: {
      backgroundColor: theme.ratingPillInactiveBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      minWidth: 34,
      alignItems: 'center',
    },
    ratingPillActive: {
      backgroundColor: theme.ratingPillBg,
      borderWidth: 1,
      borderColor: theme.ratingPillBorder,
    },
    ratingPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.ratingPillInactiveText,
    },
    ratingPillTextActive: {
      fontSize: 11.5,
      fontWeight: '800',
      color: theme.ratingPillText,
    },
    oddsPill: {
      backgroundColor: theme.oddsBadgeBg,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 4,
      minWidth: 38,
      alignItems: 'center',
    },
    oddsPillNR: {
      backgroundColor: theme.oddsNrBg,
    },
    oddsPillText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: theme.oddsText,
    },
    oddsPillTextNR: {
      color: theme.oddsNrText,
    },
    oddsDash: {
      fontSize: 12,
      color: theme.textTertiary,
    },
    pastBtn: {
      backgroundColor: theme.pastBtnBg,
      borderWidth: 1,
      borderColor: theme.pastBtnBorder,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 4,
    },
    pastBtnActive: {
      backgroundColor: theme.pastBtnActiveBg,
      borderColor: theme.pastBtnActiveBg,
    },
    pastBtnText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: theme.pastBtnText,
    },
    pastBtnTextActive: {
      color: theme.pastBtnActiveText,
    },
    pastNoneText: {
      fontSize: 11,
      color: theme.textTertiary,
      fontStyle: 'italic',
    },
    pastSection: {
      width: '100%',
      borderTopWidth: 1,
      borderTopColor: theme.pastSectionBorder,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.pastBg,
    },
    pastHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    pastHeader: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textSecondary,
      textTransform: 'uppercase',
    },
    pastHeaderNote: {
      fontSize: 10,
      color: theme.textTertiary,
      fontStyle: 'italic',
    },
    pastRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 5,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.pastBorder,
    },
    pastDate: {
      fontSize: 12,
      color: theme.pastDateText,
      width: 85,
    },
    pastCourse: {
      fontSize: 12,
      color: theme.pastCourseText,
      width: 60,
    },
    pastDist: {
      fontSize: 12,
      color: theme.pastDistText,
      width: 50,
    },
    pastRtg: {
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.pastRtgText,
      width: 80,
    },
    pastPos: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.pastPosText,
      flex: 1,
      textAlign: 'right',
    },
    pastPosWin: {
      color: theme.pastPosWinText,
      fontWeight: '700',
    },
    morePastText: {
      fontSize: 11,
      color: theme.textTertiary,
      fontStyle: 'italic',
      marginTop: 8,
      textAlign: 'center',
    },
    emptyContainer: {
      padding: 30,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.textTertiary,
      fontSize: 15,
    },
  });

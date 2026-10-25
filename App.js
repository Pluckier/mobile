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
  Platform,
} from 'react-native';

const getFormattedToday = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Check if a horse is a non-runner
const isHorseNR = (horse) => {
  if (!horse) return false;
  if (horse.number === 'NR' || horse.status === 'NR') return true;
  const odds = horse.odds || [];
  if (odds.length > 0) {
    const last = odds[odds.length - 1];
    return last === 'NR' || last === 'null' || last === 'Non-Runner';
  }
  return false;
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

const ZOOM_CONFIGS = [
  { scale: 1.0, label: '100%' },
  { scale: 1.5, label: '150%' },
  { scale: 2.0, label: '200%' },
];

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
  oddsBadgeBgBlue: isDark ? '#11223f' : '#e8f0fe',
  oddsText: isDark ? '#f87171' : '#c5221f',
  oddsTextBlue: isDark ? '#60a5fa' : '#1a73e8',
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
  const [zoomIndex, setZoomIndex] = useState(0);
  const currentZoom = ZOOM_CONFIGS[zoomIndex];
  const scale = currentZoom.scale;

  const [races, setRaces] = useState([]);
  const [selectedRaceIndex, setSelectedRaceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedHorse, setExpandedHorse] = useState(null);

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme, isCompact, scale), [theme, isCompact, scale]);

  const handleToggleZoom = () => {
    setZoomIndex((prev) => (prev + 1) % ZOOM_CONFIGS.length);
  };

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

  // Order horses: Active runners first (by 3-run avg rating descending), Non-Runners (NR) at the bottom
  const horses = useMemo(() => {
    const rawHorses = selectedRace?.horses || [];
    return [...rawHorses].sort((a, b) => {
      const isNRA = isHorseNR(a);
      const isNRB = isHorseNR(b);

      // Always push non-runners to the bottom
      if (isNRA !== isNRB) {
        return isNRA ? 1 : -1;
      }

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
      const isNR = isHorseNR(item);
      const avgRating = getAverageRating(item);
      const latestOdd =
        Array.isArray(item.odds) && item.odds.length > 0
          ? item.odds[item.odds.length - 1]
          : null;
      const isOddRow = index % 2 === 1;

      if (isCompact) {
        // Condensed view (< 650px): Line 1 (Horse identity) + Line 2 (Connections, Rating, Odds & Past)
        return (
          <View key={`${item.name}-${item.number || index}`} style={styles.rowContainer}>
            <TouchableOpacity
              style={[
                styles.compactRow,
                isOddRow && styles.rowAlt,
                isNR && styles.nonRunnerRow,
              ]}
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
                  {`${horseNum}.`}
                  {item.draw ? <Text style={styles.drawText}>({item.draw})</Text> : null}
                </Text>

                {/* 3. Form */}
                <View style={styles.compactFormBadge}>
                  <Text style={styles.formText} numberOfLines={1}>
                    {item.form || '-'}
                  </Text>
                </View>

                {/* 4. Name */}
                <Text
                  style={[styles.compactNameText, isNR && styles.nameTextNR]}
                  numberOfLines={1}
                >
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
                  {isNR ? (
                    <View style={[styles.oddsPill, styles.oddsPillNR]}>
                      <Text style={[styles.oddsPillText, styles.oddsPillTextNR]}>
                        NR
                      </Text>
                    </View>
                  ) : latestOdd ? (
                    <View style={styles.oddsPill}>
                      <Text style={styles.oddsPillText}>
                        {latestOdd}
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
                        {isExpanded ? '▲ hide' : `${pastRuns.length} ▼`}
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

      // Wide Desktop / Large Tablet layout (>= 650px): All 11 items spread cleanly across the entire line
      return (
        <View key={`${item.name}-${item.number || index}`} style={styles.rowContainer}>
          <TouchableOpacity
            style={[
              styles.singleLineRow,
              isOddRow && styles.rowAlt,
              isNR && styles.nonRunnerRow,
            ]}
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
                {`${horseNum}.`}
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
              <Text
                style={[styles.nameText, isNR && styles.nameTextNR]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </View>

            {/* 5. Last Run */}
            <View style={styles.colLastRun}>
              <Text style={styles.lastRunText}>
                {item.lastRun ? `${item.lastRun}` : '-'}
              </Text>
            </View>

            {/* 6. Age */}
            <View style={styles.colAge}>
              <Text style={styles.ageText}>
                {item.age ? `${item.age}yo` : '-'}
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

            {/* 10. Latest Odd with Trend Color Logic */}
            {isNR ? (
              <View style={[styles.oddsPill, styles.oddsPillNR]}>
                <Text style={[styles.oddsPillText, styles.oddsPillTextNR]}>NR</Text>
              </View>
            ) : latestOdd ? (
              (() => {
                const oddsArr = Array.isArray(item.odds) ? item.odds : [];
                const prevOdd = oddsArr.length >= 2 ? parseFloat(oddsArr[oddsArr.length - 2]) : null;
                const currentOddNum = parseFloat(latestOdd);

                let badgeStyle = styles.oddsPill;
                let textStyle = styles.oddsPillText;

                if (!isNaN(prevOdd) && !isNaN(currentOddNum)) {
                  if (prevOdd > currentOddNum) {
                    // Previous was bigger -> Red trend (price dropped/shortened)
                    badgeStyle = styles.oddsPill;
                    textStyle = styles.oddsPillText;
                  } else if (prevOdd < currentOddNum) {
                    // Previous was smaller -> Blue trend (price drifted/went up)
                    badgeStyle = [styles.oddsPill, { backgroundColor: theme.oddsBadgeBgBlue }];
                    textStyle = [styles.oddsPillText, { color: theme.oddsTextBlue }];
                  } else {
                    // Previous is exactly equal to current -> White text, dark slate / standard neutral background
                    badgeStyle = [styles.oddsPill, { backgroundColor: theme.isDark ? '#27272a' : '#5f6368' }];
                    textStyle = [styles.oddsPillText, { color: '#ffffff' }];
                  }
                } else {
                  // Missing history fallback -> White text, neutral background
                  badgeStyle = [styles.oddsPill, { backgroundColor: theme.isDark ? '#27272a' : '#5f6368' }];
                  textStyle = [styles.oddsPillText, { color: '#ffffff' }];
                }

                return (
                  <View style={badgeStyle}>
                    <Text style={textStyle}>{latestOdd}</Text>
                  </View>
                );
              })()
            ) : (
              <Text style={styles.oddsDash}>-</Text>
            )}

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
                    {isExpanded ? '▲' : `${pastRuns.length} ▼`}
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

      {/* App Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{getFormattedToday()}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.zoomToggleBtn}
              onPress={handleToggleZoom}
              activeOpacity={0.7}
            >
              <Text style={styles.zoomToggleText}>🔍 {currentZoom.label}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.themeToggleBtn}
              onPress={() => setIsDark((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.themeToggleText}>{isDark ? '☀️ Light' : '🌙 Dark'}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
            {(selectedRace?.distance || selectedRace?.going) ? (
              <Text style={styles.navRaceSubtitle} numberOfLines={1}>
                {selectedRace.detail}
                {selectedRace?.going ? ` ${selectedRace.going}` : ''}
              </Text>
            ) : null}
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
          // Condensed view (< 650px): Full-width vertical card list
          <View style={styles.compactWrapper}>
            {renderHorseRows()}
          </View>
        ) : (
          // Wide view (>= 650px): Full width table spanning 100% of the screen
          <View style={styles.wideWrapper}>
            {renderHorseRows()}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme, isCompact, scale = 1.0) => {
  const s = (val) => Math.round(val * scale);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: s(20),
      backgroundColor: theme.bg,
    },
    loadingText: {
      marginTop: s(12),
      fontSize: s(15),
      color: theme.textSecondary,
    },
    errorIcon: {
      fontSize: s(42),
      marginBottom: s(8),
    },
    errorTitle: {
      fontSize: s(18),
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: s(4),
    },
    errorMessage: {
      fontSize: s(14),
      color: '#d93025',
      textAlign: 'center',
      marginBottom: s(16),
    },
    retryBtn: {
      backgroundColor: theme.navBtnBg,
      paddingHorizontal: s(20),
      paddingVertical: s(10),
      borderRadius: 6,
    },
    retryBtnText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: s(15),
    },
    header: {
      paddingHorizontal: 12,
      paddingVertical: 8,
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
      gap: 6,
    },
    zoomToggleBtn: {
      backgroundColor: theme.toggleBtnBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    zoomToggleText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: theme.toggleBtnText,
    },
    themeToggleBtn: {
      backgroundColor: theme.toggleBtnBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    themeToggleText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: theme.toggleBtnText,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.headerText,
      letterSpacing: 0.3,
    },
    dateBadge: {
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.headerDateText,
      backgroundColor: theme.headerDateBg,
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 12,
    },
    navBar: {
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'space-between',
      backgroundColor: theme.navBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.navBorder,
    },
    navBtn: {
      backgroundColor: theme.navBtnBg,
      paddingHorizontal: 16,
      alignSelf: 'stretch',
      justifyContent: 'center',
      alignItems: 'center',
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
      justifyContent: 'center',
      flex: 1,
      marginHorizontal: 8,
      paddingVertical: 8,
    },
    navRaceCounter: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.navCounter,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    navRaceSummary: {
      fontSize: 14.5,
      fontWeight: '700',
      color: theme.navSummary,
      marginTop: 2,
      textAlign: 'center',
    },
    navRaceSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },
    navRaceDetail: {
      fontSize: 11,
      color: theme.textTertiary,
      marginTop: 2,
      textAlign: 'center',
    },
    tableScroll: {
      flex: 1,
      ...(Platform.OS === 'web'
        ? {
          scrollbarGutter: 'stable',
        }
        : {}),
    },
    wideWrapper: {
      width: '100%',
      backgroundColor: theme.cardBg,
      paddingBottom: s(16),
      ...(Platform.OS === 'web'
        ? {
          marginRight: '-25px',
          paddingRight: '-25px',
        }
        : {}),
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
      paddingVertical: s(7),
      paddingHorizontal: s(8),
    },
    thText: {
      fontSize: s(10.5),
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
      paddingVertical: s(3),
      paddingHorizontal: s(8),
      backgroundColor: theme.cardBg,
    },
    compactRow: {
      paddingVertical: s(7),
      paddingHorizontal: s(10),
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
      width: s(26),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 4,
    },
    compactNumberText: {
      fontSize: s(12),
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
      fontSize: s(13),
      fontWeight: '700',
      color: theme.textPrimary,
      flex: 1,
      marginRight: 6,
    },
    compactMetaPill: {
      fontSize: s(10.5),
      fontWeight: '600',
      color: theme.textSecondary,
      backgroundColor: theme.pillBg,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
      marginRight: 4,
    },
    compactWeightText: {
      fontSize: s(10.5),
      fontWeight: '600',
      color: theme.textSecondary,
    },
    compactLine2: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 5,
      paddingTop: 4,
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
    nonRunnerRow: {
      opacity: 0.42,
      backgroundColor: theme.isDark ? '#141416' : '#f1f3f4',
    },
    nameTextNR: {
      textDecorationLine: 'line-through',
      color: theme.textTertiary,
    },
    colSilks: {
      width: s(34),
      alignItems: 'center',
      justifyContent: 'center',
    },
    colNumber: {
      width: s(28),
      alignItems: 'center',
      justifyContent: 'center',
    },
    colForm: {
      width: s(62),
      paddingHorizontal: 2,
      justifyContent: 'center',
    },
    colName: {
      flex: 2,
      minWidth: s(110),
      paddingHorizontal: 5,
      justifyContent: 'center',
    },
    colLastRun: {
      width: s(38),
      alignItems: 'center',
      justifyContent: 'center',
    },
    colAge: {
      width: s(32),
      alignItems: 'center',
      justifyContent: 'center',
    },
    colWeight: {
      width: s(48),
      alignItems: 'center',
      justifyContent: 'center',
    },
    colConnections: {
      flex: 2,
      minWidth: s(125),
      paddingHorizontal: 5,
      justifyContent: 'center',
    },
    colRating: {
      width: s(48),
      alignItems: 'center',
      justifyContent: 'center',
    },
    colOdds: {
      width: s(48),
      alignItems: 'center',
      justifyContent: 'center',
    },
    colPast: {
      width: s(48),
      alignItems: 'center',
      justifyContent: 'center',
    },
    silksImage: {
      width: s(26),
      height: s(26),
    },
    silksPlaceholder: {
      width: s(26),
      height: s(26),
      borderRadius: 4,
      backgroundColor: theme.silksPlaceholderBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    silksPlaceholderText: {
      fontSize: s(14),
    },
    numberText: {
      fontSize: s(12),
      fontWeight: '700',
      color: theme.textSecondary,
    },
    drawText: {
      fontSize: s(9.5),
      fontWeight: 'normal',
      color: theme.textTertiary,
    },
    formText: {
      fontSize: s(10.5),
      fontWeight: '700',
      color: theme.isDark ? '#93c5fd' : '#174ea6',
      letterSpacing: 0.3,
    },
    nameText: {
      fontSize: s(13),
      fontWeight: '700',
      color: theme.textPrimary,
    },
    lastRunText: {
      fontSize: s(11),
      color: theme.textSecondary,
      fontWeight: '500',
    },
    ageText: {
      fontSize: s(11),
      color: theme.textSecondary,
      fontWeight: '500',
    },
    weightText: {
      fontSize: s(10.5),
      color: theme.textSecondary,
      fontWeight: '600',
    },
    jockeyText: {
      fontSize: s(10),
      fontWeight: '600',
      color: theme.textPrimary,
    },
    trainerText: {
      fontSize: s(10),
      fontWeight: '600',
      color: theme.textPrimary,
      marginTop: 1,
    },
    ratingPill: {
      backgroundColor: theme.ratingPillInactiveBg,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
      minWidth: s(32),
      alignItems: 'center',
    },
    ratingPillActive: {
      backgroundColor: theme.ratingPillBg,
      borderWidth: 1,
      borderColor: theme.ratingPillBorder,
    },
    ratingPillText: {
      fontSize: s(10.5),
      fontWeight: '600',
      color: theme.ratingPillInactiveText,
    },
    ratingPillTextActive: {
      fontSize: s(11),
      fontWeight: '800',
      color: theme.ratingPillText,
    },
    oddsPill: {
      backgroundColor: theme.oddsBadgeBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      minWidth: s(36),
      alignItems: 'center',
    },
    oddsPillNR: {
      backgroundColor: theme.oddsNrBg,
    },
    oddsPillText: {
      fontSize: s(11),
      fontWeight: '700',
      color: theme.oddsText,
    },
    oddsPillTextNR: {
      color: theme.oddsNrText,
    },
    oddsDash: {
      fontSize: s(12),
      color: theme.textTertiary,
    },
    pastBtn: {
      backgroundColor: theme.pastBtnBg,
      borderWidth: 1,
      borderColor: theme.pastBtnBorder,
      paddingHorizontal: 6,
      paddingVertical: 2.5,
      borderRadius: 4,
    },
    pastBtnActive: {
      backgroundColor: theme.pastBtnActiveBg,
      borderColor: theme.pastBtnActiveBg,
    },
    pastBtnText: {
      fontSize: s(10),
      fontWeight: '700',
      color: theme.pastBtnText,
    },
    pastBtnTextActive: {
      color: theme.pastBtnActiveText,
    },
    pastNoneText: {
      fontSize: s(10.5),
      color: theme.textTertiary,
      fontStyle: 'italic',
    },
    pastSection: {
      width: '100%',
      borderTopWidth: 1,
      borderTopColor: theme.pastSectionBorder,
      paddingHorizontal: s(12),
      paddingVertical: s(8),
      backgroundColor: theme.pastBg,
    },
    pastHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: s(6),
    },
    pastHeader: {
      fontSize: s(10.5),
      fontWeight: '700',
      color: theme.textSecondary,
      textTransform: 'uppercase',
    },
    pastHeaderNote: {
      fontSize: s(9.5),
      color: theme.textTertiary,
      fontStyle: 'italic',
    },
    pastRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: s(4),
      borderBottomWidth: 0.5,
      borderBottomColor: theme.pastBorder,
    },
    pastDate: {
      fontSize: s(11.5),
      color: theme.pastDateText,
      width: s(80),
    },
    pastCourse: {
      fontSize: s(11.5),
      color: theme.pastCourseText,
      width: s(55),
    },
    pastDist: {
      fontSize: s(11.5),
      color: theme.pastDistText,
      width: s(45),
    },
    pastRtg: {
      fontSize: s(11),
      fontWeight: '600',
      color: theme.pastRtgText,
      width: s(75),
    },
    pastPos: {
      fontSize: s(11.5),
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
      fontSize: s(10.5),
      color: theme.textTertiary,
      fontStyle: 'italic',
      marginTop: s(6),
      textAlign: 'center',
    },
    emptyContainer: {
      padding: s(24),
      alignItems: 'center',
    },
    emptyText: {
      color: theme.textTertiary,
      fontSize: s(14),
    },
  });
};

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Image,
  useColorScheme,
} from 'react-native';

const getFormattedToday = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const calculateWins = (past) => {
  if (!Array.isArray(past)) return 0;
  return past.filter((run) => {
    const posStr = String(run?.position || '').trim();
    const posNum = parseInt(posStr.split('/')[0], 10);
    return posNum === 1;
  }).length;
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
  headerBg: isDark ? '#1a2332' : '#1a73e8',
  headerText: '#ffffff',
  headerDateBg: 'rgba(255, 255, 255, 0.2)',
  headerDateText: '#ffffff',
  headerSubtitle: isDark ? '#cbd5e1' : '#e8eaed',
  headerDetail: isDark ? '#93c5fd' : '#d2e3fc',
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
  tagBg: isDark ? '#2a3342' : '#f1f3f4',
  tagText: isDark ? '#cbd5e1' : '#5f6368',
  attrBg: isDark ? '#262626' : '#f8f9fa',
  attrText: isDark ? '#94a3b8' : '#5f6368',
  formBadgeBg: isDark ? '#172554' : '#e8f0fe',
  formLabel: isDark ? '#93c5fd' : '#1967d2',
  formValue: isDark ? '#bfdbfe' : '#174ea6',
  ratingBadgeBg: isDark ? '#2d2206' : '#fef7e0',
  ratingBadgeBorder: isDark ? '#b45309' : '#f9ab00',
  ratingLabel: isDark ? '#fbbf24' : '#b06000',
  ratingValue: isDark ? '#f59e0b' : '#e37400',
  oddsBadgeBg: isDark ? '#3b1219' : '#fce8e6',
  oddsText: isDark ? '#f87171' : '#c5221f',
  oddsNrBg: isDark ? '#262626' : '#f1f3f4',
  oddsNrText: isDark ? '#94a3b8' : '#5f6368',
  winsBadgeBg: isDark ? '#052e16' : '#e6f4ea',
  winsText: isDark ? '#4ade80' : '#137333',
  winsZeroBg: isDark ? '#262626' : '#f1f3f4',
  winsZeroText: isDark ? '#94a3b8' : '#5f6368',
  expandHint: isDark ? '#60a5fa' : '#1a73e8',
  pastBg: isDark ? '#18181b' : '#fafafa',
  pastBorder: isDark ? '#27272a' : '#eeeeee',
  pastSectionBorder: isDark ? '#2e3846' : '#f1f3f4',
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
});

export default function App() {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [races, setRaces] = useState([]);
  const [selectedRaceIndex, setSelectedRaceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedHorse, setExpandedHorse] = useState(null);

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);

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

      {/* Horses FlatList (Sorted by 3-run avg rating) */}
      <FlatList
        data={horses}
        keyExtractor={(item, index) => `${item.name}-${item.number || index}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.navBtnBg]} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No horses listed for this race card.</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const horseNum = item.number || index + 1;
          const wins = calculateWins(item.past);
          const pastRuns = item.past || [];
          const isExpanded = expandedHorse === item.name;
          const avgRating = getAverageRating(item);
          const latestOdd =
            Array.isArray(item.odds) && item.odds.length > 0
              ? item.odds[item.odds.length - 1]
              : null;
          const isNR = latestOdd === 'NR' || latestOdd === 'null';

          return (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => toggleExpand(item.name)}
                activeOpacity={0.7}
              >
                {/* Number & Jockey Silks */}
                <View style={styles.leftCol}>
                  <Text style={styles.number}>
                    {horseNum}
                    {item.draw ? <Text style={styles.draw}> ({item.draw})</Text> : null}
                  </Text>
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

                {/* Horse Core Info & Meta */}
                <View style={styles.infoCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.age ? <Text style={styles.ageTag}>{item.age}yo</Text> : null}
                  </View>

                  {/* Rating, Form, Weight & Last Run Chips */}
                  <View style={styles.metaRow}>
                    {avgRating > 0 ? (
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingLabel}></Text>
                        <Text style={styles.ratingValue}>{Math.round(avgRating)}</Text>
                      </View>
                    ) : null}

                    {item.form ? (
                      <View style={styles.formBadge}>
                        <Text style={styles.formLabel}> </Text>
                        <Text style={styles.formValue}>{item.form}</Text>
                      </View>
                    ) : null}

                    {item.weight ? (
                      <Text style={styles.attributeText}>{item.weight}</Text>
                    ) : null}

                    {item.lastRun ? (
                      <Text style={styles.attributeText}>{item.lastRun} days</Text>
                    ) : null}
                  </View>

                  {/* Connections: Jockey & Trainer */}
                  {(item.jockey || item.trainer) && (
                    <Text style={styles.connectionsText} numberOfLines={1}>
                      {item.jockey ? `J: ${item.jockey}` : ''}
                      {item.jockey && item.trainer ? ' • ' : ''}
                      {item.trainer ? `T: ${item.trainer}` : ''}
                    </Text>
                  )}
                </View>

                {/* Right: Odds, Wins & Expansion Indicator */}
                <View style={styles.rightCol}>
                  {latestOdd && (
                    <View style={[styles.oddsBadge, isNR && styles.oddsBadgeNR]}>
                      <Text style={[styles.oddsText, isNR && styles.oddsTextNR]}>
                        {isNR ? 'NR' : latestOdd}
                      </Text>
                    </View>
                  )}

                  <View style={[styles.winsBadge, wins === 0 && styles.winsBadgeZero]}>
                    <Text style={[styles.wins, wins === 0 && styles.winsZero]}>
                      {wins} {wins === 1 ? 'Win' : 'Wins'}
                    </Text>
                  </View>

                  {pastRuns.length > 0 && (
                    <Text style={styles.expandHint}>
                      {isExpanded ? '▲ hide' : `▼ ${pastRuns.length} runs`}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Collapsible Past Runs History */}
              {isExpanded && pastRuns.length > 0 && (
                <View style={styles.pastSection}>
                  <View style={styles.pastHeaderRow}>
                    <Text style={styles.pastHeader}>Past Performance History</Text>
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
                    <Text style={styles.morePastText}>+ {pastRuns.length - 6} earlier runs</Text>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
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
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.navBorder,
    },
    navBtn: {
      backgroundColor: theme.navBtnBg,
      paddingVertical: 7,
      paddingHorizontal: 14,
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
    listContainer: {
      paddingVertical: 8,
      paddingBottom: 24,
    },
    card: {
      backgroundColor: theme.cardBg,
      marginVertical: 4,
      marginHorizontal: 10,
      borderRadius: 8,
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: theme.isDark ? 0.25 : 0.04,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      padding: 12,
      alignItems: 'center',
    },
    leftCol: {
      alignItems: 'center',
      width: 44,
      marginRight: 6,
    },
    number: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textSecondary,
      marginBottom: 4,
    },
    draw: {
      fontSize: 11,
      color: theme.textTertiary,
      fontWeight: 'normal',
    },
    silksImage: {
      width: 38,
      height: 38,
    },
    silksPlaceholder: {
      width: 38,
      height: 38,
      borderRadius: 6,
      backgroundColor: theme.silksPlaceholderBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    silksPlaceholderText: {
      fontSize: 18,
    },
    infoCol: {
      flex: 1,
      paddingHorizontal: 6,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    name: {
      fontSize: 15,
      color: theme.textPrimary,
      fontWeight: '700',
      marginRight: 6,
    },
    ageTag: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.tagText,
      backgroundColor: theme.tagBg,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: 4,
      gap: 6,
    },
    ratingBadge: {
      flexDirection: 'row',
      backgroundColor: theme.ratingBadgeBg,
      borderWidth: 1,
      borderColor: theme.ratingBadgeBorder,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    ratingLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.ratingLabel,
    },
    ratingValue: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.ratingValue,
    },
    formBadge: {
      flexDirection: 'row',
      backgroundColor: theme.formBadgeBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    formLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.formLabel,
    },
    formValue: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.formValue,
      letterSpacing: 0.5,
    },
    attributeText: {
      fontSize: 11,
      color: theme.attrText,
      backgroundColor: theme.attrBg,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    },
    connectionsText: {
      fontSize: 11,
      color: theme.textTertiary,
      marginTop: 4,
    },
    rightCol: {
      alignItems: 'flex-end',
      minWidth: 70,
    },
    oddsBadge: {
      backgroundColor: theme.oddsBadgeBg,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 4,
      marginBottom: 4,
    },
    oddsBadgeNR: {
      backgroundColor: theme.oddsNrBg,
    },
    oddsText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.oddsText,
    },
    oddsTextNR: {
      color: theme.oddsNrText,
    },
    winsBadge: {
      backgroundColor: theme.winsBadgeBg,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 4,
    },
    winsBadgeZero: {
      backgroundColor: theme.winsZeroBg,
    },
    wins: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.winsText,
    },
    winsZero: {
      color: theme.winsZeroText,
      fontWeight: '500',
    },
    expandHint: {
      fontSize: 10,
      color: theme.expandHint,
      marginTop: 4,
    },
    pastSection: {
      borderTopWidth: 1,
      borderTopColor: theme.pastSectionBorder,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: theme.pastBg,
    },
    pastHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
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
      paddingVertical: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.pastBorder,
    },
    pastDate: {
      fontSize: 12,
      color: theme.pastDateText,
      width: 72,
    },
    pastCourse: {
      fontSize: 12,
      color: theme.pastCourseText,
      width: 48,
    },
    pastDist: {
      fontSize: 12,
      color: theme.pastDistText,
      width: 38,
    },
    pastRtg: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.pastRtgText,
      width: 65,
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
      marginTop: 6,
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

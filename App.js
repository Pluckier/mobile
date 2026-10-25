import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
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

import { createStyles, getTheme } from './styles';

const formatDateToDDMMYYYY = (d) => {
  if (!d) return '';
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateToYYYYMMDD = (d) => {
  if (!d) return '';
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${year}-${month}-${day}`;
};

const getFormattedToday = () => formatDateToDDMMYYYY(new Date());

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
  { scale: 0.75, label: '75%' },
  { scale: 1.0, label: '100%' },
  { scale: 1.5, label: '150%' },
  { scale: 2.0, label: '200%' },
];

export default function App() {
  const { width } = useWindowDimensions();
  const isCompact = width < 650;

  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [zoomIndex, setZoomIndex] = useState(1);
  const currentZoom = ZOOM_CONFIGS[zoomIndex];
  const scale = currentZoom.scale;

  const [races, setRaces] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
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

  const dateInputRef = useRef(null);

  const handleOpenDatePicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker();
          return;
        } catch (e) {
          // Fallback if showPicker throws
        }
      }
      try {
        dateInputRef.current.focus();
        dateInputRef.current.click();
      } catch (e) { }
    }
  };

  const handleDateSelect = (newDate) => {
    if (newDate instanceof Date && !isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
    }
  };

  const fetchRaces = useCallback(async (targetDate = selectedDate, isRefresh = false) => {
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
      setSelectedRaceIndex(0);
      setExpandedHorse(null);
    } catch (err) {
      console.error('Error fetching race cards:', err);
      setError(err.message || 'Unable to load races for this date');
      setRaces([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchRaces(selectedDate);
  }, [selectedDate]);

  const onRefresh = () => {
    fetchRaces(selectedDate, true);
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
                        {`${pastRuns.length}`}
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
                    Past Performance History
                  </Text>
                </View>
                {pastRuns.slice(0, 12).map((run, rIdx) => {
                  const isWin = String(run.position || '').trim().split('/')[0] === '1';
                  return (
                    <View key={`${run.date}-${run.time || rIdx}`} style={styles.pastRow}>
                      <Text style={styles.pastDate}>{run.date}</Text>
                      <Text style={styles.pastCourse}>{run.course || '-'}</Text>
                      <Text style={styles.pastDist}>{run.distance || ''}</Text>
                      <Text style={styles.pastDist}>{run.raceClass || ''}</Text>
                      <Text style={styles.pastDist}>{run.going || ''}</Text>
                      <Text style={styles.pastDist}>{run.weight || ''}</Text>
                      <Text style={styles.pastDist}>{run.distBeaten || ''} l</Text>
                      <Text style={[styles.pastPos, isWin && styles.pastPosWin]}>
                        {run.position || '-'}
                      </Text>
                      <Text style={styles.pastRtg}>
                        {run.name ? `Rtg: ${run.name}` : '-'}
                      </Text>
                    </View>
                  );
                })}
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
                    {`${pastRuns.length}`}
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
              </View>
              {pastRuns.slice(0, 12).map((run, rIdx) => {
                const isWin = String(run.position || '').trim().split('/')[0] === '1';
                return (
                  <View key={`${run.date}-${run.time || rIdx}`} style={styles.pastRow}>
                    <Text style={styles.pastDate}>{run.date}</Text>
                    <Text style={styles.pastCourse}>{run.course || '-'}</Text>
                    <Text style={styles.pastDist}>{run.distance || ''}</Text>
                    <Text style={styles.pastDist}>C{run.raceClass || ''}</Text>
                    <Text style={styles.pastDist}>{run.going || ''}</Text>
                    <Text style={styles.pastDist}>{run.weight || ''}</Text>
                    <Text style={styles.pastDist}>{run.distBeaten || ''} l</Text>
                    <Text style={[styles.pastPos, isWin && styles.pastPosWin]}>
                      {run.position || '-'}
                    </Text>
                    <Text style={styles.pastRtg}>
                      {run.name ? `Rtg: ${run.name}` : '-'}
                    </Text>
                  </View>
                );
              })}
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
          <TouchableOpacity
            style={styles.datePickerWrapper}
            onPress={handleOpenDatePicker}
            activeOpacity={0.7}
          >
            <Text style={styles.title}>
              📅 {formatDateToDDMMYYYY(selectedDate)}
            </Text>
            {Platform.OS === 'web' && (
              <input
                ref={dateInputRef}
                type="date"
                value={formatDateToYYYYMMDD(selectedDate)}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch (err) { }
                }}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    handleDateSelect(new Date(y, m - 1, d));
                  }
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
                tabIndex={-1}
                aria-label="Select Race Date"
              />
            )}
          </TouchableOpacity>
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
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchRaces(selectedDate)}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.isDark ? '#27272a' : '#5f6368' }]}
              onPress={() => setSelectedDate(new Date())}
            >
              <Text style={styles.retryBtnText}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
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
      )}
    </SafeAreaView>
  );
}




import React, { useState, useEffect, useCallback } from 'react';
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

export default function App() {
  const [races, setRaces] = useState([]);
  const [selectedRaceIndex, setSelectedRaceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedHorse, setExpandedHorse] = useState(null);

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
  const horses = selectedRace?.horses || [];

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
        <ActivityIndicator size="large" color="#1a73e8" />
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
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />

      {/* Race Overview Card */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{selectedRace?.place || 'No Races'}</Text>
          <Text style={styles.dateBadge}>{getFormattedToday()}</Text>
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

      {/* Horses FlatList */}
      <FlatList
        data={horses}
        keyExtractor={(item, index) => `${item.name}-${item.number || index}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} />
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

                  {/* Form, Weight & Last Run Chips */}
                  <View style={styles.metaRow}>
                    {item.form ? (
                      <View style={styles.formBadge}>
                        <Text style={styles.formLabel}>Form: </Text>
                        <Text style={styles.formValue}>{item.form}</Text>
                      </View>
                    ) : null}

                    {item.weight ? (
                      <Text style={styles.attributeText}>{item.weight}</Text>
                    ) : null}

                    {item.lastRun ? (
                      <Text style={styles.attributeText}>{item.lastRun}d ago</Text>
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
                  <Text style={styles.pastHeader}>Past Performance History</Text>
                  {pastRuns.slice(0, 6).map((run, rIdx) => {
                    const isWin = String(run.position || '').trim().split('/')[0] === '1';
                    return (
                      <View key={`${run.date}-${run.time || rIdx}`} style={styles.pastRow}>
                        <Text style={styles.pastDate}>{run.date}</Text>
                        <Text style={styles.pastCourse}>{run.course || '-'}</Text>
                        <Text style={styles.pastDist}>{run.distance || ''}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f4',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#5f6368',
  },
  errorIcon: {
    fontSize: 42,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#d93025',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#1a73e8',
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
    backgroundColor: '#1a73e8',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  dateBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#e8eaed',
    marginTop: 4,
  },
  raceDetail: {
    fontSize: 12,
    color: '#d2e3fc',
    marginTop: 4,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dadce0',
  },
  navBtn: {
    backgroundColor: '#1a73e8',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  navBtnDisabled: {
    backgroundColor: '#f1f3f4',
  },
  navBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  navBtnTextDisabled: {
    color: '#9aa0a6',
  },
  navCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  navRaceCounter: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a73e8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  navRaceSummary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202124',
    marginTop: 2,
  },
  listContainer: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    marginVertical: 4,
    marginHorizontal: 10,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
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
    color: '#5f6368',
    marginBottom: 4,
  },
  draw: {
    fontSize: 11,
    color: '#80868b',
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
    backgroundColor: '#f1f3f4',
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
    color: '#202124',
    fontWeight: '700',
    marginRight: 6,
  },
  ageTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5f6368',
    backgroundColor: '#f1f3f4',
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
  formBadge: {
    flexDirection: 'row',
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1967d2',
  },
  formValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#174ea6',
    letterSpacing: 0.5,
  },
  attributeText: {
    fontSize: 11,
    color: '#5f6368',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  connectionsText: {
    fontSize: 11,
    color: '#70757a',
    marginTop: 4,
  },
  rightCol: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  oddsBadge: {
    backgroundColor: '#fce8e6',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 4,
  },
  oddsBadgeNR: {
    backgroundColor: '#f1f3f4',
  },
  oddsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c5221f',
  },
  oddsTextNR: {
    color: '#5f6368',
  },
  winsBadge: {
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  winsBadgeZero: {
    backgroundColor: '#f1f3f4',
  },
  wins: {
    fontSize: 12,
    fontWeight: '700',
    color: '#137333',
  },
  winsZero: {
    color: '#5f6368',
    fontWeight: '500',
  },
  expandHint: {
    fontSize: 10,
    color: '#1a73e8',
    marginTop: 4,
  },
  pastSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fafafa',
  },
  pastHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5f6368',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  pastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
  },
  pastDate: {
    fontSize: 12,
    color: '#3c4043',
    width: 75,
  },
  pastCourse: {
    fontSize: 12,
    color: '#3c4043',
    width: 60,
  },
  pastDist: {
    fontSize: 12,
    color: '#70757a',
    width: 45,
  },
  pastPos: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5f6368',
    textAlign: 'right',
  },
  pastPosWin: {
    color: '#137333',
    fontWeight: '700',
  },
  morePastText: {
    fontSize: 11,
    color: '#70757a',
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#70757a',
    fontSize: 15,
  },
});

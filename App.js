import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';

export default function App() {
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated BigQuery schema response payload
    const raceCardData = [
      { horse_number: 1, horse_name: "Fast Dancer", past_wins_count: 3 },
      { horse_number: 2, horse_name: "Stormy Sky", past_wins_count: 1 },
      { horse_number: 3, horse_name: "Gold Cup Winner", past_wins_count: 5 },
      { horse_number: 4, horse_name: "Haydock Pride", past_wins_count: 0 },
    ];
    setHorses(raceCardData);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Race Overview Card */}
      <View style={styles.header}>
        <Text style={styles.title}>Haydock</Text>
        <Text style={styles.subtitle}>14:00 Race Card</Text>
      </View>

      {/* Optimized Performance Array List */}
      <FlatList
        data={horses}
        keyExtractor={(item) => item.horse_number.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.number}>{item.horse_number}</Text>
            <Text style={styles.name}>{item.horse_name}</Text>
            <Text style={styles.wins}>{item.past_wins_count} Wins</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#1a73e8',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#e8eaed',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  number: {
    fontSize: 16,
    fontWeight: '700',
    width: 35,
    color: '#5f6368',
  },
  name: {
    fontSize: 16,
    flex: 1,
    color: '#202124',
    fontWeight: '500',
  },
  wins: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34a853',
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});

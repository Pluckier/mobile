import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function RaceNavigation({
  styles,
  races,
  selectedRaceIndex,
  selectedRace,
  onPrevRace,
  onNextRace,
}) {
  return (
    <View style={styles.navBar}>
      <TouchableOpacity
        style={[styles.navBtn, selectedRaceIndex === 0 && styles.navBtnDisabled]}
        onPress={onPrevRace}
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
        onPress={onNextRace}
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
  );
}

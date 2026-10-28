import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

export default function RaceNavigation({
  styles,
  races,
  selectedRaceIndex,
  selectedRace,
  onPrevRace,
  onNextRace,
  onJumpToRace,
}) {
  const [draftValue, setDraftValue] = useState(String(selectedRaceIndex + 1));

  useEffect(() => {
    setDraftValue(String(selectedRaceIndex + 1));
  }, [selectedRaceIndex]);

  const submitDraft = () => {
    if (!onJumpToRace) return;

    const trimmed = draftValue.trim();
    if (!trimmed) {
      setDraftValue(String(selectedRaceIndex + 1));
      return;
    }

    onJumpToRace(trimmed);
    setDraftValue(String(selectedRaceIndex + 1));
  };

  return (
    <View style={styles.navContainer}>
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
          <View style={styles.navRaceCounterRow}>
            <TextInput
              style={styles.navRaceInput}
              value={draftValue}
              onChangeText={(text) => {
                if (/^\d*$/.test(text)) {
                  setDraftValue(text);
                }
              }}
              onSubmitEditing={submitDraft}
              onBlur={submitDraft}
              keyboardType="number-pad"
              maxLength={String(races.length).length || 2}
              selectTextOnFocus
              returnKeyType="go"
              blurOnSubmit
              underlineColorAndroid="transparent"
            />
            <Text style={styles.navRaceCounterText}> /  {races.length}</Text>
          </View>
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

      {selectedRace && (
        <View style={styles.raceDetailsRow}>
          <Text style={styles.navRaceSummary}>
            {selectedRace?.time} {selectedRace?.place}
          </Text>
          {(selectedRace?.detail || selectedRace?.distance || selectedRace?.going) ? (
            <Text style={styles.navRaceSubtitle} numberOfLines={1} ellipsizeMode="tail">
              {selectedRace?.going ? ` ${selectedRace.going}` : ''}
              {selectedRace?.distance ? ` ${selectedRace.distance} ` : ''}
              {selectedRace?.runners ? `(${selectedRace.runners} Run)` : ''}
              {selectedRace?.detail ? (() => {
                const isHandicap = selectedRace.detail.toUpperCase().includes('HANDICAP');
                const runnerCount = parseInt(selectedRace?.runners, 10) || 0;

                if (isHandicap) {
                  return runnerCount > 7
                    ? ` ⚖️🏆 ${selectedRace.detail}`
                    : ` ⚖️ ${selectedRace.detail}`;
                }
                return ` ${selectedRace.detail}`;
              })() : ''}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

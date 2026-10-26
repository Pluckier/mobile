import React from 'react';
import { View, Text, Linking, Platform } from 'react-native';

export default function PastRunsPanel({ rows, styles, horse = {}, itemName = null }) {
  if (!rows || rows.length === 0) return null;

  const handleOpenUrl = (url) => {
    if (!url) return;
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
    }
  };

  return (
    <View style={styles.pastSection}>
      <View style={styles.pastHeaderRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.pastHeader}>
            {itemName ? `Past Performance History (${itemName})` : 'Past Performance History'}
          </Text>

          <View style={styles.metaBadgeRow}>
            {horse?.owner && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>Owner: {horse.owner}</Text>
              </View>
            )}
            {horse?.breeding && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>{horse.breeding}</Text>
              </View>
            )}
            {horse?.foaled && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>Born: {horse.foaled}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {rows.slice(0, 12).map((run, rIdx) => {
        const isWin = String(run.position || '').trim().split('/')[0] === '1';

        return (
          <View key={`${run.date}-${run.time || rIdx}`} style={styles.pastRow}>
            {run.url ? (
              <Text
                style={[styles.pastDate, styles.pastDateLink]}
                accessibilityRole="link"
                href={run.url}
                hrefAttrs={{ target: '_blank', rel: 'noopener noreferrer' }}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    handleOpenUrl(run.url);
                  }
                }}
              >
                {run.date}
              </Text>
            ) : (
              <Text style={styles.pastDate}>{run.date}</Text>
            )}
            <Text style={styles.pastCourse}>{run.course || '-'}</Text>
            <Text style={styles.pastDist}>{run.distance || ''}</Text>
            <Text style={styles.pastDist}>C{run.raceClass || ''}</Text>
            <Text style={styles.pastDist}>{run.going || ''}</Text>
            <Text style={styles.pastDist}>{run.weight || ''}</Text>
            <Text style={styles.pastDist}>{run.distBeaten || ''} l</Text>
            <Text style={[styles.pastPos, isWin && styles.pastPosWin]}>
              {run.position || '-'}
            </Text>
            <Text style={styles.pastRtg}>{run.name ? `Rtg: ${run.name}` : '-'}</Text>
          </View>
        );
      })}
    </View>
  );
}

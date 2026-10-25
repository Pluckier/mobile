import React from 'react';
import { View, Text } from 'react-native';

export default function PastRunsPanel({ rows, styles, itemName = null }) {
  if (!rows || rows.length === 0) return null;

  return (
    <View style={styles.pastSection}>
      <View style={styles.pastHeaderRow}>
        <Text style={styles.pastHeader}>
          {itemName ? `Past Performance History (${itemName})` : 'Past Performance History'}
        </Text>
      </View>

      {rows.slice(0, 12).map((run, rIdx) => {
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
            <Text style={styles.pastRtg}>{run.name ? `Rtg: ${run.name}` : '-'}</Text>
          </View>
        );
      })}
    </View>
  );
}


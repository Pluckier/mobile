import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';

import PastRunsPanel from './PastRunsPanel';
import { isHorseNR, getAverageRating } from '../utils/horseUtils';

export default function HorseRow({
  item,
  index,
  styles,
  theme,
  isCompact,
  isExpanded,
  onToggleExpand,
}) {
  const horseNum = item.number || index + 1;
  const pastRuns = item.past || [];
  const isNR = isHorseNR(item);
  const avgRating = getAverageRating(item);
  const latestOdd = Array.isArray(item.odds) && item.odds.length > 0 ? item.odds[item.odds.length - 1] : null;
  const isOddRow = index % 2 === 1;

  if (isCompact) {
    return (
      <View style={styles.rowContainer}>
        <TouchableOpacity
          style={[
            styles.compactRow,
            isOddRow && styles.rowAlt,
            isNR && styles.nonRunnerRow,
          ]}
          onPress={() => onToggleExpand(item.name)}
          activeOpacity={0.7}
        >
          <View style={styles.compactLine1}>
            <View style={styles.compactSilksCol}>
              {item.silks ? (
                <Image source={{ uri: item.silks }} style={styles.silksImage} resizeMode="contain" />
              ) : (
                <View style={styles.silksPlaceholder}>
                  <Text style={styles.silksPlaceholderText}>🏇</Text>
                </View>
              )}
            </View>

            <Text style={styles.compactNumberText}>
              {`${horseNum}.`}
              {item.draw ? <Text style={styles.drawText}>({item.draw})</Text> : null}
            </Text>

            <View style={styles.compactFormBadge}>
              <Text style={styles.formText} numberOfLines={1}>
                {item.form || '-'}
              </Text>
            </View>

            <Text style={[styles.compactNameText, isNR && styles.nameTextNR]} numberOfLines={1}>
              {item.name}
            </Text>

            <Text style={styles.compactMetaPill}>{item.lastRun ? `${item.lastRun}d` : '-'}</Text>
            <Text style={styles.compactMetaPill}>{item.age ? `${item.age}y` : '-'}</Text>
            <Text style={styles.compactWeightText}>{item.weight || '-'}</Text>
          </View>

          <View style={styles.compactLine2}>
            <View style={styles.compactConnectionsCol}>
              <Text style={styles.jockeyText} numberOfLines={1}>
                {item.jockey ? `J: ${item.jockey}` : '-'}
              </Text>
              <Text style={styles.trainerText} numberOfLines={1}>
                {item.trainer ? `T: ${item.trainer}` : '-'}
              </Text>
            </View>

            <View style={styles.compactRightActions}>
              <View style={[styles.ratingPill, avgRating > 0 && styles.ratingPillActive]}>
                <Text style={[styles.ratingPillText, avgRating > 0 && styles.ratingPillTextActive]}>
                  {avgRating > 0 ? `${Math.round(avgRating)}` : '-'}
                </Text>
              </View>

              {isNR ? (
                <View style={[styles.oddsPill, styles.oddsPillNR]}>
                  <Text style={[styles.oddsPillText, styles.oddsPillTextNR]}>NR</Text>
                </View>
              ) : latestOdd ? (
                <View style={styles.oddsPill}>
                  <Text style={styles.oddsPillText}>{latestOdd}</Text>
                </View>
              ) : (
                <Text style={styles.oddsDash}>-</Text>
              )}

              {pastRuns.length > 0 ? (
                <View style={[styles.pastBtn, isExpanded && styles.pastBtnActive]}>
                  <Text style={[styles.pastBtnText, isExpanded && styles.pastBtnTextActive]}>
                    {`${pastRuns.length}`}
                  </Text>
                </View>
              ) : (
                <Text style={styles.pastNoneText}>none</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && pastRuns.length > 0 && (
          <PastRunsPanel rows={pastRuns} styles={styles} itemName={item.name} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.rowContainer}>
      <TouchableOpacity
        style={[
          styles.singleLineRow,
          isOddRow && styles.rowAlt,
          isNR && styles.nonRunnerRow,
        ]}
        onPress={() => onToggleExpand(item.name)}
        activeOpacity={0.7}
      >
        <View style={styles.colSilks}>
          {item.silks ? (
            <Image source={{ uri: item.silks }} style={styles.silksImage} resizeMode="contain" />
          ) : (
            <View style={styles.silksPlaceholder}>
              <Text style={styles.silksPlaceholderText}>🏇</Text>
            </View>
          )}
        </View>

        <View style={styles.colNumber}>
          <Text style={styles.numberText}>
            {`${horseNum}.`}
            {item.draw ? <Text style={styles.drawText}>({item.draw})</Text> : null}
          </Text>
        </View>

        <View style={styles.colForm}>
          <Text style={styles.formText} numberOfLines={1}>
            {item.form || '-'}
          </Text>
        </View>

        <View style={styles.colName}>
          <Text style={[styles.nameText, isNR && styles.nameTextNR]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>

        <View style={styles.colLastRun}>
          <Text style={styles.lastRunText}>{item.lastRun ? `${item.lastRun}` : '-'}</Text>
        </View>

        <View style={styles.colAge}>
          <Text style={styles.ageText}>{item.age ? `${item.age}yo` : '-'}</Text>
        </View>

        <View style={styles.colWeight}>
          <Text style={styles.weightText}>{item.weight || '-'}</Text>
        </View>

        <View style={styles.colConnections}>
          <Text style={styles.jockeyText} numberOfLines={1}>
            {item.jockey ? `J: ${item.jockey}` : '-'}
          </Text>
          <Text style={styles.trainerText} numberOfLines={1}>
            {item.trainer ? `T: ${item.trainer}` : '-'}
          </Text>
        </View>

        <View style={styles.colRating}>
          <View style={[styles.ratingPill, avgRating > 0 && styles.ratingPillActive]}>
            <Text style={[styles.ratingPillText, avgRating > 0 && styles.ratingPillTextActive]}>
              {avgRating > 0 ? Math.round(avgRating) : '-'}
            </Text>
          </View>
        </View>

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
                badgeStyle = styles.oddsPill;
                textStyle = styles.oddsPillText;
              } else if (prevOdd < currentOddNum) {
                badgeStyle = [styles.oddsPill, { backgroundColor: theme.oddsBadgeBgBlue }];
                textStyle = [styles.oddsPillText, { color: theme.oddsTextBlue }];
              } else {
                badgeStyle = [styles.oddsPill, { backgroundColor: theme.isDark ? '#27272a' : '#5f6368' }];
                textStyle = [styles.oddsPillText, { color: '#ffffff' }];
              }
            } else {
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

        <View style={styles.colPast}>
          {pastRuns.length > 0 ? (
            <View style={[styles.pastBtn, isExpanded && styles.pastBtnActive]}>
              <Text style={[styles.pastBtnText, isExpanded && styles.pastBtnTextActive]}>
                {`${pastRuns.length}`}
              </Text>
            </View>
          ) : (
            <Text style={styles.pastNoneText}>none</Text>
          )}
        </View>
      </TouchableOpacity>

      {isExpanded && pastRuns.length > 0 && (
        <PastRunsPanel rows={pastRuns} styles={styles} itemName={item.name} />
      )}
    </View>
  );
}

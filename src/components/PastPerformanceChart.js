// PastPerformanceChart.js
// Custom SVG line chart with a true date-scaled x-axis.
// Each horse gets its own line; points are placed at their actual race date.

import React, { useState, useMemo } from 'react';
import { View, Text, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Polyline, Circle, Text as SvgText, Line, G } from 'react-native-svg';

const COLORS = [
  '#ff6f61', '#a78bfa', '#4ade80', '#f472b6',
  '#60a5fa', '#fb923c', '#34d399', '#f87171', '#e879f9', '#facc15',
  '#38bdf8', '#a3e635',
];

const PAD = { top: 24, bottom: 36, left: 36, right: 16 };

// Parse "DD/MM/YYYY" → timestamp (ms)
const parseDate = (str) => {
  if (!str) return 0;
  const parts = str.split('/');
  if (parts.length !== 3) return 0;
  const [d, m, y] = parts;
  const ts = new Date(`${y}-${m}-${d}`).getTime();
  return isNaN(ts) ? 0 : ts;
};

// Format "DD/MM/YYYY" → "DD/MM"
const shortDate = (str) => {
  if (!str) return '';
  const parts = str.split('/');
  return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : str;
};

const PastPerformanceChart = ({ horses = [], theme = {}, scale = 1 }) => {
  const chartBg = theme.pastBg || '#0f172a';
  const gridColor = theme.pastBorder || '#1e293b';
  const axisText = theme.textTertiary || '#6b7280';
  const legendText = theme.textPrimary || '#d1d5db';
  const tooltipBg = theme.cardBg || '#1e293b';
  const tooltipTxt = theme.textPrimary || '#f1f5f9';

  const dotRadius = Math.round(2 * scale) || 2;
  const strokeW = Math.max(1, 1.1 * scale) || 1;
  const axisFontSize = Math.round(8 * scale) || 8;
  const labelFontSize = Math.round(9 * scale) || 9;
  const chartH = 220;

  const [tooltip, setTooltip] = useState(null);

  const validHorses = useMemo(() => horses.filter((h) => h.past && h.past.length > 0), [horses]);

  // --- Build all data points with real timestamps ---
  const allPoints = useMemo(() => {
    const pts = [];
    validHorses.forEach((horse) => {
      horse.past.forEach((p) => {
        const val = parseFloat(p.name);
        if (!isNaN(val) && p.date) {
          const ts = parseDate(p.date);
          if (ts > 0) {
            pts.push({ ts, val, horseName: horse.name, date: p.date });
          }
        }
      });
    });
    return pts;
  }, [validHorses]);

  if (validHorses.length === 0 || allPoints.length === 0) {
    return (
      <View style={{ padding: 12, alignItems: 'center' }}>
        <Text style={{ color: '#888', fontSize: 12 }}>No past performance data available.</Text>
      </View>
    );
  }

  // --- Axis extents ---
  const minTs = Math.min(...allPoints.map((p) => p.ts)) || 0;
  const maxTs = Math.max(...allPoints.map((p) => p.ts)) || 1;
  const minVal = Math.min(...allPoints.map((p) => p.val)) || 0;
  const maxVal = Math.max(...allPoints.map((p) => p.val)) || 1;
  const tsRange = maxTs - minTs || 1;
  const valRange = maxVal - minVal || 1;

  // --- Chart dimensions ---
  const screenW = Dimensions.get('window').width;
  const chartW = screenW - 32;
  const innerW = chartW - PAD.left - PAD.right;
  const innerH = chartH - PAD.top - PAD.bottom;

  // --- Coordinate helpers ---
  const xOf = (ts) => {
    const calculatedX = PAD.left + ((ts - minTs) / tsRange) * innerW;
    return isNaN(calculatedX) ? PAD.left : calculatedX;
  };

  const yOf = (val) => {
    const calculatedY = PAD.top + innerH - ((val - minVal) / valRange) * innerH;
    return isNaN(calculatedY) ? PAD.top : calculatedY;
  };

  // --- X-axis tick dates ---
  const tickDates = useMemo(() => {
    const allDates = [...new Set(allPoints.map((p) => p.date))].sort(
      (a, b) => parseDate(a) - parseDate(b)
    );
    const maxTicks = 8;
    const step = Math.max(1, Math.ceil(allDates.length / maxTicks));
    return allDates.filter((_, i) => i % step === 0);
  }, [allPoints]);

  // --- Y-axis ticks ---
  const yTicks = useMemo(() => {
    const yTickCount = 5;
    return Array.from({ length: yTickCount + 1 }, (_, i) => {
      const val = minVal + (valRange * i) / yTickCount;
      return { val, y: yOf(val) };
    });
  }, [minVal, valRange, innerH]);

  // --- Build lines per horse ---
  const horseLines = useMemo(() => {
    return validHorses.map((horse, idx) => {
      const pts = horse.past
        .filter((p) => !isNaN(parseFloat(p.name)) && p.date)
        .sort((a, b) => parseDate(a.date) - parseDate(b.date))
        .map((p) => ({
          x: xOf(parseDate(p.date)),
          y: yOf(parseFloat(p.name)),
          val: parseFloat(p.name),
          date: p.date,
          horse: horse.name,
          position: p.position,
          weight: p.weight,
          course: p.course,
          distance: p.distance,
          going: p.going,
          raceClass: p.raceClass,
          distBeaten: p.distBeaten,
          latestOdd: Array.isArray(horse.odds) && horse.odds.length > 0
            ? horse.odds[horse.odds.length - 1]
            : null,
        }))
        .filter(p => !isNaN(p.x) && !isNaN(p.y));

      const latestOdd = Array.isArray(horse.odds) && horse.odds.length > 0
        ? horse.odds[horse.odds.length - 1]
        : null;

      return { name: horse.name, color: COLORS[idx % COLORS.length] || '#fff', pts, latestOdd, horseIndex: idx };
    });
  }, [validHorses, minTs, tsRange, minVal, valRange, innerW, innerH]);

  return (
    <View style={{ backgroundColor: chartBg, paddingVertical: 8 }}>
      {/* Legend */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6, paddingHorizontal: 8 }}>
        {validHorses.map((horse, idx) => (
          <View key={`legend-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
            <View style={{
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: COLORS[idx % COLORS.length] || '#fff', marginRight: 4,
            }} />
            <Text style={{ color: legendText, fontSize: 10 }}>{horse.name}</Text>
          </View>
        ))}
      </ScrollView>
      {/* Chart Canvas */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={chartW} height={chartH}>
          {/* Y-axis lines */}
          {yTicks.map(({ val, y }, i) => (
            <G key={`ytick-${i}`}>
              <Line
                x1={PAD.left} y1={y || 0} x2={chartW - PAD.right} y2={y || 0}
                stroke={gridColor} strokeWidth={1}
              />
              <SvgText
                x={PAD.left - 4} y={(y || 0) + 4}
                fontSize={axisFontSize} fill={axisText} textAnchor="end"
              >
                {Math.round(val)}
              </SvgText>
            </G>
          ))}

          {/* X-axis lines */}
          {tickDates.map((date, idx) => {
            const x = xOf(parseDate(date));
            return (
              <G key={`xtick-${idx}`}>
                <Line
                  x1={x} y1={PAD.top} x2={x} y2={chartH - PAD.bottom}
                  stroke={gridColor} strokeWidth={1}
                />
                <SvgText
                  x={x} y={chartH - PAD.bottom + 14}
                  fontSize={axisFontSize} fill={axisText} textAnchor="middle"
                >
                  {shortDate(date)}
                </SvgText>
              </G>
            );
          })}

          {/* Polylines & Single-Point Lines */}
          {horseLines.map(({ name, color, pts }) => {
            if (pts.length === 0) return null;
            if (pts.length === 1) {
              const singlePt = pts[0];
              return (
                <Line
                  key={`line-single-${name}`}
                  x1={(singlePt.x || 0) - 6} y1={singlePt.y || 0}
                  x2={(singlePt.x || 0) + 6} y2={singlePt.y || 0}
                  stroke={color} strokeWidth={2}
                />
              );
            }
            const pointsStr = pts.map((p) => `${p.x || 0},${p.y || 0}`).join(' ');
            return (
              <Polyline
                key={`polyline-${name}`}
                points={pointsStr}
                fill="none"
                stroke={color}
                strokeWidth={strokeW}
                strokeLinejoin="round"
              />
            );
          })}

          {/* Interactivity Dots - FIXED STRUCTURE */}
          {horseLines.map(({ name, color, pts, horseIndex }) =>
            pts.map((p, pointIdx) => {
              if (isNaN(p.x) || isNaN(p.y)) return null;
              return (
                <G
                  key={`dot-group-${horseIndex}-${pointIdx}`}
                  onClick={() => setTooltip(p)}
                >
                  <Circle
                    cx={p.x}
                    cy={p.y}
                    r={dotRadius}
                    fill={color}
                  />
                </G>
              );
            })
          )}

          {/* Text Labels at Peak */}
          {horseLines.map(({ name, color, pts, latestOdd, horseIndex }) => {
            if (pts.length === 0) return null;
            const peak = pts.reduce((best, p) => (p.y < best.y ? p : best), pts[0]);
            if (!peak || isNaN(peak.x) || isNaN(peak.y)) return null;

            const xOffset = (horseIndex % 3) * 4;
            const oddStr = latestOdd != null ? ` ${latestOdd}` : '';
            return (
              <SvgText
                key={`label-${horseIndex}`}
                x={peak.x + xOffset}
                y={peak.y - 8}
                fontSize={labelFontSize}
                fill={color}
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="System"
              >
                {`${name}${oddStr}`}
              </SvgText>
            );
          })}
        </Svg>
      </ScrollView>

      {/* Tooltip Overlay */}
      {tooltip && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setTooltip(null)}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            justifyContent: 'center', alignItems: 'center',
          }}
        >
          <View style={{
            backgroundColor: tooltipBg,
            borderRadius: 10,
            padding: 12,
            minWidth: 200,
            borderWidth: 1,
            borderColor: gridColor,
            shadowColor: '#000',
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <Text style={{ color: legendText, fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>
              {tooltip.horse}{tooltip.latestOdd != null ? `  ${tooltip.latestOdd}` : ''}
            </Text>
            {[
              { label: 'Date', value: tooltip.date },
              { label: 'Rating', value: tooltip.val },
              { label: 'Position', value: tooltip.position },
              { label: 'Weight', value: tooltip.weight },
              { label: 'Course', value: tooltip.course },
              { label: 'Distance', value: tooltip.distance },
              { label: 'Going', value: tooltip.going },
              { label: 'Class', value: tooltip.raceClass },
              { label: 'Dist Beaten', value: tooltip.distBeaten },
            ].map(({ label, value }) =>
              value != null ? (
                <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={{ color: axisText, fontSize: 11, marginRight: 12 }}>{label}</Text>
                  <Text style={{ color: legendText, fontSize: 11, fontWeight: '600' }}>{value}</Text>
                </View>
              ) : null
            )}
            <Text style={{ color: axisText, fontSize: 10, marginTop: 8, textAlign: 'center' }}>Tap anywhere to dismiss</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PastPerformanceChart;

// PastPerformanceChart.js
// Custom SVG line chart with a true date-scaled x-axis.
// Each horse gets its own line; points are placed at their actual race date.

import React, { useState } from 'react';
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
  const [d, m, y] = str.split('/');
  return new Date(`${y}-${m}-${d}`).getTime();
};

// Format "DD/MM/YYYY" → "DD/MM"
const shortDate = (str) => {
  if (!str) return '';
  const parts = str.split('/');
  return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : str;
};

/**
 * Props:
 *  - horses: array of horse objects for the selected race.
 *    Each horse has:
 *      name: string
 *      past: Array<{ name: string (numeric rating), date: "DD/MM/YYYY", ... }>
 */
const PastPerformanceChart = ({ horses = [], theme = {}, scale = 1 }) => {
  // Theme-aware colors with sensible dark-mode fallbacks
  const chartBg = theme.pastBg || '#0f172a';
  const gridColor = theme.pastBorder || '#1e293b';
  const axisText = theme.textTertiary || '#6b7280';
  const legendText = theme.textPrimary || '#d1d5db';
  const tooltipBg = theme.cardBg || '#1e293b';
  const tooltipTxt = theme.textPrimary || '#f1f5f9';

  // Zoom-aware sizes — height stays fixed, text/dots scale subtly
  const dotRadius = Math.round(1.5 * scale);
  const strokeW = Math.max(1, 1.1 * scale);
  const axisFontSize = Math.round(8 * scale);
  const labelFontSize = Math.round(9 * scale);
  const chartH = 220; // fixed height regardless of zoom

  const [tooltip, setTooltip] = useState(null);

  const validHorses = horses.filter((h) => h.past && h.past.length > 0);
  if (validHorses.length === 0) {
    return (
      <View style={{ padding: 12, alignItems: 'center' }}>
        <Text style={{ color: '#888', fontSize: 12 }}>No past performance data.</Text>
      </View>
    );
  }

  // --- Build all data points with real timestamps ---
  const allPoints = []; // { ts, val, horseName, date }
  validHorses.forEach((horse) => {
    horse.past.forEach((p) => {
      const val = parseFloat(p.name);
      if (!isNaN(val) && p.date) {
        allPoints.push({ ts: parseDate(p.date), val, horseName: horse.name, date: p.date });
      }
    });
  });

  if (allPoints.length === 0) {
    return (
      <View style={{ padding: 12, alignItems: 'center' }}>
        <Text style={{ color: '#888', fontSize: 12 }}>No numeric ratings in past data.</Text>
      </View>
    );
  }

  // --- Axis extents ---
  const minTs = Math.min(...allPoints.map((p) => p.ts));
  const maxTs = Math.max(...allPoints.map((p) => p.ts));
  const minVal = Math.min(...allPoints.map((p) => p.val));
  const maxVal = Math.max(...allPoints.map((p) => p.val));
  const tsRange = maxTs - minTs || 1;
  const valRange = maxVal - minVal || 1;

  // --- Chart dimensions ---
  const screenW = Dimensions.get('window').width;
  const chartW = screenW - 32;
  const innerW = chartW - PAD.left - PAD.right;
  const innerH = chartH - PAD.top - PAD.bottom;

  // --- Coordinate helpers ---
  const xOf = (ts) => PAD.left + ((ts - minTs) / tsRange) * innerW;
  const yOf = (val) => PAD.top + innerH - ((val - minVal) / valRange) * innerH;

  // --- X-axis tick dates (evenly spaced unique dates, max ~8 ticks) ---
  const allDates = [...new Set(allPoints.map((p) => p.date))].sort(
    (a, b) => parseDate(a) - parseDate(b)
  );
  const maxTicks = 8;
  const step = Math.max(1, Math.ceil(allDates.length / maxTicks));
  const tickDates = allDates.filter((_, i) => i % step === 0);

  // --- Y-axis ticks ---
  const yTickCount = 5;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => {
    const val = minVal + (valRange * i) / yTickCount;
    return { val, y: yOf(val) };
  });

  // --- Build polyline points per horse ---
  const horseLines = validHorses.map((horse, idx) => {
    const pts = horse.past
      .filter((p) => !isNaN(parseFloat(p.name)) && p.date)
      .sort((a, b) => parseDate(a.date) - parseDate(b.date))
      .map((p) => ({
        x: xOf(parseDate(p.date)),
        y: yOf(parseFloat(p.name)),
        val: parseFloat(p.name),
        // Store all fields for the tooltip
        date: p.date,
        horse: horse.name,
        position: p.position,
        weight: p.weight,
        course: p.course,
        distance: p.distance,
        going: p.going,
        raceClass: p.raceClass,
        distBeaten: p.distBeaten,
      }));
    return { name: horse.name, color: COLORS[idx % COLORS.length], pts };
  });

  return (
    <View style={{ backgroundColor: chartBg, paddingVertical: 8 }}>
      {/* Legend */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6, paddingHorizontal: 8 }}>
        {validHorses.map((horse, idx) => (
          <View key={horse.name} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
            <View style={{
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: COLORS[idx % COLORS.length], marginRight: 4,
            }} />
            <Text style={{ color: legendText, fontSize: 10 }}>{horse.name}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Chart */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={chartW} height={chartH}>
          {/* Y-axis gridlines & labels */}
          {yTicks.map(({ val, y }, i) => (
            <G key={i}>
              <Line
                x1={PAD.left} y1={y} x2={chartW - PAD.right} y2={y}
                stroke={gridColor} strokeWidth={1}
              />
              <SvgText
                x={PAD.left - 4} y={y + 4}
                fontSize={axisFontSize} fill={axisText} textAnchor="end"
              >
                {Math.round(val)}
              </SvgText>
            </G>
          ))}

          {/* X-axis tick labels */}
          {tickDates.map((date) => {
            const x = xOf(parseDate(date));
            return (
              <G key={date}>
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


          {/* Horse lines — draw for all horses, even single-point (shown as dash) */}
          {horseLines.map(({ name, color, pts }) => {
            if (pts.length === 0) return null;
            if (pts.length === 1) {
              // Single point: draw a short horizontal tick so it's visible
              return (
                <Line
                  key={name}
                  x1={pts[0].x - 6} y1={pts[0].y}
                  x2={pts[0].x + 6} y2={pts[0].y}
                  stroke={color} strokeWidth={2}
                />
              );
            }
            const pointsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');
            return (
              <Polyline
                key={name}
                points={pointsStr}
                fill="none"
                stroke={color}
                strokeWidth={strokeW}
                strokeLinejoin="round"
              />
            );
          })}

          {/* Data point dots */}
          {horseLines.map(({ name, color, pts }) =>
            pts.map((p, i) => (
              <Circle
                key={`${name}-${i}`}
                cx={p.x} cy={p.y} r={dotRadius}
                fill={color}
                onPress={() => setTooltip(p)}
              />
            ))
          )}

          {/* Horse name label at the peak (highest rating) of each line */}
          {horseLines.map(({ name, color, pts }, lineIdx) => {
            if (pts.length === 0) return null;
            // Find the point with the smallest y value = highest on the chart
            const peak = pts.reduce((best, p) => (p.y < best.y ? p : best), pts[0]);
            // Stagger slightly to reduce overlap when peaks coincide
            const xOffset = (lineIdx % 3) * 4;
            return (
              <SvgText
                key={`label-${name}`}
                x={peak.x + xOffset}
                y={peak.y - 8}
                fontSize={labelFontSize}
                fill={color}
                fontWeight="bold"
                textAnchor="middle"
              >
                {name}
              </SvgText>
            );
          })}




        </Svg>
      </ScrollView>

      {/* Rich tooltip overlay card */}
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
            {/* Horse name header */}
            <Text style={{ color: legendText, fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>
              {tooltip.horse}
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

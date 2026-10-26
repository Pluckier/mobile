// PastPerformanceChart.js
// Custom SVG line chart with a true date-scaled x-axis.
// Each horse gets its own line; points are placed at their actual race date.

import React, { useState } from 'react';
import { View, Text, Dimensions, ScrollView } from 'react-native';
import Svg, { Polyline, Circle, Text as SvgText, Line, G, Rect } from 'react-native-svg';

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
const PastPerformanceChart = ({ horses = [], theme = {} }) => {
  // Theme-aware colors with sensible dark-mode fallbacks
  const chartBg    = theme.pastBg        || '#0f172a';
  const gridColor  = theme.pastBorder    || '#1e293b';
  const axisText   = theme.textTertiary  || '#6b7280';
  const legendText = theme.textPrimary   || '#d1d5db';
  const tooltipBg  = theme.cardBg        || '#1e293b';
  const tooltipTxt = theme.textPrimary   || '#f1f5f9';

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
  const chartW = screenW - 62;
  const chartH = 220;
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
        date: p.date,
        horse: horse.name,
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
                fontSize={9} fill={axisText} textAnchor="end"
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
                  fontSize={9} fill={axisText} textAnchor="middle"
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
                strokeWidth={2}
                strokeLinejoin="round"
              />
            );
          })}

          {/* Data point dots */}
          {horseLines.map(({ name, color, pts }) =>
            pts.map((p, i) => (
              <Circle
                key={`${name}-${i}`}
                cx={p.x} cy={p.y} r={4}
                fill={color}
                onPress={() => setTooltip({ x: p.x, y: p.y, val: p.val, date: p.date, horse: p.horse })}
              />
            ))
          )}

          {/* Horse name label at the end of each line */}
          {horseLines.map(({ name, color, pts }, lineIdx) => {
            if (pts.length === 0) return null;
            const last = pts[pts.length - 1];
            // Stagger labels vertically to reduce overlap
            const yOffset = (lineIdx % 3) * -10;
            return (
              <SvgText
                key={`label-${name}`}
                x={last.x + 6}
                y={last.y + yOffset}
                fontSize={8}
                fill={color}
                fontWeight="bold"
              >
                {name.split(' ')[0]}
              </SvgText>
            );
          })}


          {/* Tooltip */}
          {tooltip && (
            <G>
              <Rect
                x={Math.min(tooltip.x + 4, chartW - 80)}
                y={Math.max(tooltip.y - 28, PAD.top)}
                width={76} height={22} rx={4}
                fill={tooltipBg} opacity={0.95}
              />
              <SvgText
                x={Math.min(tooltip.x + 8, chartW - 76)}
                y={Math.max(tooltip.y - 12, PAD.top + 14)}
                fontSize={9} fill={tooltipTxt}
              >
                {`${tooltip.horse}: ${tooltip.val} (${shortDate(tooltip.date)})`}
              </SvgText>
            </G>
          )}
        </Svg>
      </ScrollView>
    </View>
  );
};

export default PastPerformanceChart;

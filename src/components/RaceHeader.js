import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';

import { formatDateToDDMMYYYY, formatDateToYYYYMMDD } from '../utils/dateUtils';

export default function RaceHeader({
  styles,
  selectedDate,
  onDateChange,
  isDark,
  onToggleTheme,
  onToggleZoom,
  zoomLabel,
}) {
  const dateInputRef = useRef(null);

  const handleOpenDatePicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker();
          return;
        } catch (e) {
          // ignore and fall back as needed
        }
      }

      try {
        dateInputRef.current.focus();
        dateInputRef.current.click();
      } catch (e) {
        // ignore click fallback errors
      }
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.datePickerWrapper}
          onPress={handleOpenDatePicker}
          activeOpacity={0.7}
        >
          <Text style={styles.title}>📅 {formatDateToDDMMYYYY(selectedDate)}</Text>

          {Platform.OS === 'web' && (
            <input
              ref={dateInputRef}
              type="date"
              value={formatDateToYYYYMMDD(selectedDate)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch (err) {}
              }}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  onDateChange(new Date(y, m - 1, d));
                }
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
              }}
              tabIndex={-1}
              aria-label="Select Race Date"
            />
          )}
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.zoomToggleBtn}
            onPress={onToggleZoom}
            activeOpacity={0.7}
          >
            <Text style={styles.zoomToggleText}>🔍 {zoomLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.themeToggleBtn}
            onPress={onToggleTheme}
            activeOpacity={0.7}
          >
            <Text style={styles.themeToggleText}>{isDark ? '☀️ Light' : '🌙 Dark'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

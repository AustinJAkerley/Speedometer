import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { theme } from '../theme';

interface GaugeProps {
  /** Current value in display units. */
  value: number;
  /** Maximum value of the dial in display units. */
  max: number;
  /** Unit label shown under the number (e.g. "mph"). */
  unit: string;
  /** When true the arc turns red to signal the speed limit was exceeded. */
  warn?: boolean;
  size?: number;
}

const STROKE = 22;
const SWEEP = 0.75; // 270 degrees of a full circle

export function Gauge({ value, max, unit, warn = false, size = 280 }: GaugeProps) {
  const radius = (size - STROKE) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  const fraction = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const trackLen = circumference * SWEEP;
  const valueLen = trackLen * fraction;

  const arcColor = warn ? theme.colors.warn : theme.colors.accent;
  const display = Number.isFinite(value) ? Math.round(value) : 0;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Rotate so the 270° arc opens at the bottom, centered. */}
        <G rotation={135} origin={`${cx}, ${cy}`}>
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={theme.colors.track}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${trackLen} ${circumference}`}
          />
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={arcColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${valueLen} ${circumference}`}
          />
        </G>
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.value, warn && { color: theme.colors.warn }]}>{display}</Text>
        <Text style={styles.unit}>{unit}</Text>
        <Text style={styles.max}>0 – {Math.round(max)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: theme.colors.text,
    fontSize: 96,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    lineHeight: 100,
  },
  unit: {
    color: theme.colors.textMuted,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: -4,
  },
  max: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 6,
    opacity: 0.7,
  },
});

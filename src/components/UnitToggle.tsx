import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import type { Unit } from '../utils/units';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

const OPTIONS: { value: Unit; label: string }[] = [
  { value: 'mph', label: 'mph' },
  { value: 'kmh', label: 'km/h' },
];

export function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <View style={styles.wrap}>
      {OPTIONS.map((opt) => {
        const active = opt.value === unit;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.option, active && styles.optionActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 3,
  },
  option: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
  },
  optionActive: {
    backgroundColor: theme.colors.accent,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  labelActive: {
    color: theme.colors.background,
  },
});

import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import {
  mphFromDisplay,
  speedFromMph,
  speedLabel,
  type Unit,
} from '../utils/units';

interface SetLimitModalProps {
  visible: boolean;
  unit: Unit;
  /** Current limit in mph (0 = no limit). */
  limitMph: number;
  onClose: () => void;
  /** Called with the new limit in mph (0 = no limit). */
  onSave: (limitMph: number) => void;
}

// Quick-pick presets, stored in mph.
const PRESETS_MPH = [15, 19, 20, 25, 28];

export function SetLimitModal({
  visible,
  unit,
  limitMph,
  onClose,
  onSave,
}: SetLimitModalProps) {
  // Draft value is held in the current display unit for intuitive stepping.
  const [draft, setDraft] = useState(0);

  useEffect(() => {
    if (visible) {
      setDraft(Math.round(speedFromMph(limitMph, unit)));
    }
  }, [visible, limitMph, unit]);

  const step = (delta: number) => setDraft((d) => Math.max(0, Math.min(99, d + delta)));

  const save = () => {
    onSave(mphFromDisplay(draft, unit));
    onClose();
  };

  const label = speedLabel(unit);
  const isOff = draft <= 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Set speed limit</Text>
          <Text style={styles.subtitle}>
            The gauge turns red and buzzes when you go over this.
          </Text>

          <View style={styles.stepper}>
            <StepButton label="−" onPress={() => step(-1)} disabled={draft <= 0} />
            <View style={styles.readout}>
              <Text style={styles.value}>{isOff ? 'Off' : draft}</Text>
              {!isOff ? <Text style={styles.unit}>{label}</Text> : null}
            </View>
            <StepButton label="+" onPress={() => step(1)} disabled={draft >= 99} />
          </View>

          <View style={styles.presets}>
            {PRESETS_MPH.map((mph) => {
              const shown = Math.round(speedFromMph(mph, unit));
              const active = shown === draft;
              return (
                <Pressable
                  key={mph}
                  onPress={() => setDraft(shown)}
                  accessibilityRole="button"
                  style={[styles.preset, active && styles.presetActive]}
                >
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>
                    {shown}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setDraft(0)}
              accessibilityRole="button"
              style={[styles.preset, isOff && styles.presetActive]}
            >
              <Text style={[styles.presetText, isOff && styles.presetTextActive]}>Off</Text>
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
            >
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={save}
              accessibilityRole="button"
              style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
            >
              <Text style={styles.btnPrimaryText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function StepButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.stepBtn,
        pressed && styles.pressed,
        disabled && styles.stepDisabled,
      ]}
    >
      <Text style={styles.stepText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 24,
    paddingBottom: 36,
    gap: 18,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: -10,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDisabled: {
    opacity: 0.4,
  },
  stepText: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  readout: {
    alignItems: 'center',
    minWidth: 120,
  },
  value: {
    color: theme.colors.text,
    fontSize: 56,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: -4,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preset: {
    minWidth: 52,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  presetActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentDim,
  },
  presetText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  presetTextActive: {
    color: theme.colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
  },
  btnGhost: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnGhostText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  btnPrimary: {
    backgroundColor: theme.colors.accent,
  },
  btnPrimaryText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});

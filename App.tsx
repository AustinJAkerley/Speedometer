import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';

import { theme } from './src/theme';
import { useSpeed } from './src/hooks/useSpeed';
import type { SignalLevel } from './src/hooks/useSpeed';
import { Gauge } from './src/components/Gauge';
import { StatCard } from './src/components/StatCard';
import { SetLimitModal } from './src/components/SetLimitModal';
import { UnitToggle } from './src/components/UnitToggle';
import {
  distanceFromMeters,
  distanceLabel,
  speedFromMph,
  speedFromMps,
  speedLabel,
  type Unit,
} from './src/utils/units';
import {
  DEFAULT_LIMIT_MPH,
  loadPreferences,
  saveLimit,
  saveUnit,
} from './src/storage';

export default function App() {
  return (
    <SafeAreaProvider>
      <Speedometer />
    </SafeAreaProvider>
  );
}

function Speedometer() {
  useKeepAwake();

  const [unit, setUnit] = useState<Unit>('mph');
  const [limitMph, setLimitMph] = useState<number>(DEFAULT_LIMIT_MPH);
  const [ready, setReady] = useState(false);
  const [wasOverLimit, setWasOverLimit] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);

  const { speedMps, maxMps, avgMps, distanceM, accuracyM, signal, permission, hasFix, error, reset, retry } =
    useSpeed();

  useEffect(() => {
    let active = true;
    loadPreferences().then((prefs) => {
      if (!active) return;
      if (prefs.unit) setUnit(prefs.unit);
      if (typeof prefs.limitMph === 'number') setLimitMph(prefs.limitMph);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const speed = speedFromMps(speedMps, unit);
  // Scale the dial a little above the limit so the needle has headroom.
  const gaugeMaxMph = limitMph > 0 ? Math.max(30, Math.ceil((limitMph + 10) / 10) * 10) : 40;
  const gaugeMax = speedFromMph(gaugeMaxMph, unit);
  const limit = limitMph > 0 ? speedFromMph(limitMph, unit) : 0;
  const overLimit = limit > 0 && speed > limit + 0.5;

  // Buzz once each time the rider crosses the speed limit.
  useEffect(() => {
    if (overLimit && !wasOverLimit) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    setWasOverLimit(overLimit);
  }, [overLimit, wasOverLimit]);

  const stats = useMemo(
    () => ({
      max: speedFromMps(maxMps, unit),
      avg: speedFromMps(avgMps, unit),
      distance: distanceFromMeters(distanceM, unit),
    }),
    [maxMps, avgMps, distanceM, unit]
  );

  const onSelectUnit = (u: Unit) => {
    setUnit(u);
    saveUnit(u);
  };

  const onSaveLimit = (mph: number) => {
    setLimitMph(mph);
    saveLimit(mph);
    Haptics.selectionAsync().catch(() => {});
  };

  const limitButtonLabel =
    limitMph > 0
      ? `Speed limit: ${Math.round(limit)} ${speedLabel(unit)}`
      : 'Set speed limit';

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Speedometer</Text>
          <Text style={styles.subtitle}>No ads · GPS speedometer</Text>
        </View>
        <UnitToggle unit={unit} onChange={onSelectUnit} />
      </View>

      {permission === 'denied' ? (
        <PermissionNotice onRetry={retry} />
      ) : (
        <View style={styles.body}>
          <View style={styles.gaugeWrap}>
            <Gauge value={speed} max={gaugeMax} unit={speedLabel(unit)} warn={overLimit} />
            <View style={styles.statusRow}>
              <StatusPill hasFix={hasFix} overLimit={overLimit} limit={limit} unit={unit} />
              <SignalBars signal={signal} />
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatCard label="Max" value={stats.max.toFixed(0)} unit={speedLabel(unit)} />
            <StatCard label="Avg" value={stats.avg.toFixed(0)} unit={speedLabel(unit)} />
            <StatCard
              label="Distance"
              value={stats.distance.toFixed(2)}
              unit={distanceLabel(unit)}
            />
          </View>

          <Text style={styles.accuracy}>
            {hasFix && accuracyM != null
              ? `GPS accuracy ±${Math.round(accuracyM)} m · speed usually within 1–2 mph`
              : 'GPS speed is typically accurate to within about 1–2 mph in the open.'}
          </Text>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setLimitModalVisible(true)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.limitBtn, pressed && styles.resetPressed]}
            >
              <Text style={styles.limitText}>{limitButtonLabel}</Text>
            </Pressable>

            <Pressable
              onPress={reset}
              accessibilityRole="button"
              style={({ pressed }) => [styles.resetBtn, pressed && styles.resetPressed]}
            >
              <Text style={styles.resetText}>Reset trip</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      )}

      <SetLimitModal
        visible={limitModalVisible}
        unit={unit}
        limitMph={limitMph}
        onClose={() => setLimitModalVisible(false)}
        onSave={onSaveLimit}
      />
    </SafeAreaView>
  );
}

function StatusPill({
  hasFix,
  overLimit,
  limit,
  unit,
}: {
  hasFix: boolean;
  overLimit: boolean;
  limit: number;
  unit: Unit;
}) {
  let text = 'Acquiring GPS…';
  let color: string = theme.colors.textMuted;

  if (hasFix) {
    if (overLimit) {
      text = `Over limit • ${Math.round(limit)} ${speedLabel(unit)}`;
      color = theme.colors.warn;
    } else if (limit > 0) {
      text = `Limit ${Math.round(limit)} ${speedLabel(unit)}`;
      color = theme.colors.accent;
    } else {
      text = 'Tracking';
      color = theme.colors.accent;
    }
  }

  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>{text}</Text>
    </View>
  );
}

const SIGNAL_META: Record<SignalLevel, { bars: number; label: string; color: string }> = {
  strong: { bars: 4, label: 'Strong', color: theme.colors.accent },
  good: { bars: 3, label: 'Good', color: theme.colors.accent },
  fair: { bars: 2, label: 'Fair', color: '#E6C34A' },
  weak: { bars: 1, label: 'Weak', color: theme.colors.warn },
};

function SignalBars({ signal }: { signal: SignalLevel }) {
  const meta = SIGNAL_META[signal];
  return (
    <View
      style={styles.signal}
      accessibilityRole="image"
      accessibilityLabel={`GPS signal: ${meta.label}`}
    >
      <View style={styles.signalBars}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.signalBar,
              { height: 6 + i * 4 },
              { backgroundColor: i < meta.bars ? meta.color : theme.colors.track },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.signalLabel, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

function PermissionNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>Location access needed</Text>
      <Text style={styles.noticeBody}>
        Speedometer No Ads reads your device GPS to measure speed. Nothing is recorded or sent anywhere —
        everything stays on your phone. Enable location access to start.
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.resetPressed]}
      >
        <Text style={styles.primaryBtnText}>Grant access</Text>
      </Pressable>
      <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button">
        <Text style={styles.link}>Open Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
  },
  loading: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  gaugeWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  signal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 18,
  },
  signalBar: {
    width: 4,
    borderRadius: 1,
  },
  signalLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  accuracy: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  limitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
  },
  limitText: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  resetBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  resetPressed: {
    opacity: 0.7,
  },
  resetText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  error: {
    color: theme.colors.warn,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  notice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 12,
  },
  noticeTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  noticeBody: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: theme.radius.pill,
    marginTop: 4,
  },
  primaryBtnText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '800',
  },
  link: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});

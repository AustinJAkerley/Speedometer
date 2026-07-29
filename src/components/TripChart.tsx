import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { theme } from '../theme';
import type { TripPoint } from '../hooks/useSpeed';
import { speedFromMps, speedLabel, type Unit } from '../utils/units';

interface TripChartProps {
  /** Downsampled speed-over-time series (values in m/s). */
  history: TripPoint[];
  unit: Unit;
}

const HEIGHT = 150;
const PAD_L = 30; // room for y-axis labels
const PAD_R = 10;
const PAD_T = 12;
const PAD_B = 22; // room for x-axis labels

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function TripChart({ history, unit }: TripChartProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const label = speedLabel(unit);

  const chart = useMemo(() => {
    if (history.length < 2 || width <= 0) return null;

    const plotW = width - PAD_L - PAD_R;
    const plotH = HEIGHT - PAD_T - PAD_B;

    const t0 = history[0].t;
    const tEnd = history[history.length - 1].t;
    const tSpan = Math.max(1, tEnd - t0);

    // Y scale in display units, with a little headroom above the peak.
    let peakDisplay = 0;
    let peakPoint = history[0];
    for (const p of history) {
      const v = speedFromMps(p.max, unit);
      if (v > peakDisplay) {
        peakDisplay = v;
        peakPoint = p;
      }
    }
    const yMax = Math.max(5, Math.ceil((peakDisplay + 1) / 5) * 5);

    const x = (t: number) => PAD_L + ((t - t0) / tSpan) * plotW;
    const y = (mps: number) => {
      const v = speedFromMps(mps, unit);
      return PAD_T + plotH - (Math.min(v, yMax) / yMax) * plotH;
    };

    // Area between the per-bucket min and max (shows the highs and lows).
    const topPath = history.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t)},${y(p.max)}`).join(' ');
    const bottomPath = [...history]
      .reverse()
      .map((p) => `L${x(p.t)},${y(p.min)}`)
      .join(' ');
    const bandPath = `${topPath} ${bottomPath} Z`;

    // Average speed line.
    const linePath = history
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t)},${y(p.avg)}`)
      .join(' ');

    const gridValues = [yMax, yMax / 2, 0];

    return {
      plotW,
      plotH,
      yMax,
      bandPath,
      linePath,
      gridValues,
      peak: { cx: x(peakPoint.t), cy: y(peakPoint.max), value: Math.round(peakDisplay) },
      duration: tEnd,
    };
  }, [history, width, unit]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Speed over trip</Text>
        {chart ? (
          <Text style={styles.duration}>{formatDuration(chart.duration)}</Text>
        ) : null}
      </View>

      <View style={styles.plot} onLayout={onLayout}>
        {chart ? (
          <Svg width={width} height={HEIGHT}>
            {chart.gridValues.map((gv, i) => {
              const yy = PAD_T + chart.plotH - (gv / chart.yMax) * chart.plotH;
              return (
                <React.Fragment key={i}>
                  <Line
                    x1={PAD_L}
                    y1={yy}
                    x2={width - PAD_R}
                    y2={yy}
                    stroke={theme.colors.border}
                    strokeWidth={1}
                  />
                  <SvgText
                    x={PAD_L - 6}
                    y={yy + 4}
                    fill={theme.colors.textMuted}
                    fontSize={10}
                    textAnchor="end"
                  >
                    {Math.round(gv)}
                  </SvgText>
                </React.Fragment>
              );
            })}

            <Path d={chart.bandPath} fill={theme.colors.accent} opacity={0.16} />
            <Path
              d={chart.linePath}
              stroke={theme.colors.accent}
              strokeWidth={2}
              fill="none"
            />

            <Circle cx={chart.peak.cx} cy={chart.peak.cy} r={4} fill={theme.colors.accent} />
            <SvgText
              x={chart.peak.cx}
              y={chart.peak.cy - 8}
              fill={theme.colors.text}
              fontSize={11}
              fontWeight="700"
              textAnchor="middle"
            >
              {`${chart.peak.value}`}
            </SvgText>

            <SvgText
              x={PAD_L}
              y={HEIGHT - 6}
              fill={theme.colors.textMuted}
              fontSize={10}
              textAnchor="start"
            >
              start
            </SvgText>
            <SvgText
              x={width - PAD_R}
              y={HEIGHT - 6}
              fill={theme.colors.textMuted}
              fontSize={10}
              textAnchor="end"
            >
              now
            </SvgText>
          </Svg>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Start moving to chart your speed ({label}).</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  duration: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  plot: {
    height: HEIGHT,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
});

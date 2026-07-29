import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { haversineMeters } from '../utils/units';

export type PermissionState = 'pending' | 'granted' | 'denied';

/** GPS signal quality, derived from the horizontal accuracy of each fix. */
export type SignalLevel = 'weak' | 'fair' | 'good' | 'strong';

/** One point of the trip speed graph (time bucket vs speed, in m/s). */
export interface TripPoint {
  /** Elapsed seconds since the trip started. */
  t: number;
  /** Average speed in this bucket (m/s). */
  avg: number;
  /** Lowest speed in this bucket (m/s). */
  min: number;
  /** Highest speed in this bucket (m/s). */
  max: number;
}

export interface SpeedState {
  /** Current (smoothed) speed in meters/second. */
  speedMps: number;
  /** Peak speed observed this session, in meters/second. */
  maxMps: number;
  /** Average moving speed in meters/second. */
  avgMps: number;
  /** Total distance travelled this session, in meters. */
  distanceM: number;
  /** Horizontal accuracy of the latest fix, in meters (null if unknown). */
  accuracyM: number | null;
  /** GPS signal quality bucket derived from accuracy. */
  signal: SignalLevel;
  permission: PermissionState;
  /** True once at least one GPS fix has arrived. */
  hasFix: boolean;
  /** Downsampled speed-over-time series for the current trip (max 4 hours). */
  history: TripPoint[];
  error: string | null;
}

const INITIAL: SpeedState = {
  speedMps: 0,
  maxMps: 0,
  avgMps: 0,
  distanceM: 0,
  accuracyM: null,
  signal: 'weak',
  permission: 'pending',
  hasFix: false,
  history: [],
  error: null,
};

// Ignore tiny jitter while stationary (meters between consecutive fixes).
const MIN_MOVE_METERS = 0.75;
// Reject fixes worse than this accuracy for distance accumulation (meters).
const MAX_USABLE_ACCURACY = 25;
// Speeds below this (m/s ≈ 0.7 mph) are treated as stopped.
const STOP_THRESHOLD_MPS = 0.3;
// Plausible max acceleration for a cart/scooter/bike (m/s²) — used to reject
// GPS speed spikes that would imply impossible acceleration.
const MAX_ACCEL_MPS2 = 6;
// Longest trip window kept in the graph (seconds). Older samples roll off.
const FOUR_HOURS_SEC = 4 * 60 * 60;
// Number of points the graph is downsampled to for smooth, cheap rendering.
const GRAPH_BUCKETS = 180;

interface RawSample {
  t: number; // elapsed seconds since trip start
  mps: number;
}

/** Downsample raw per-fix samples into evenly spaced buckets for the graph. */
function buildSeries(raw: RawSample[]): TripPoint[] {
  if (raw.length === 0) return [];
  const start = raw[0].t;
  const end = raw[raw.length - 1].t;
  const span = Math.max(1, end - start);
  const width = span / GRAPH_BUCKETS;

  const buckets: (TripPoint & { sum: number; n: number })[] = [];
  for (const s of raw) {
    let idx = Math.floor((s.t - start) / width);
    if (idx >= GRAPH_BUCKETS) idx = GRAPH_BUCKETS - 1;
    let b = buckets[idx];
    if (!b) {
      b = { t: start + idx * width, avg: 0, min: s.mps, max: s.mps, sum: 0, n: 0 };
      buckets[idx] = b;
    }
    b.sum += s.mps;
    b.n += 1;
    if (s.mps < b.min) b.min = s.mps;
    if (s.mps > b.max) b.max = s.mps;
  }

  const out: TripPoint[] = [];
  for (const b of buckets) {
    if (b) out.push({ t: b.t, avg: b.sum / b.n, min: b.min, max: b.max });
  }
  return out;
}

function signalFromAccuracy(accuracy: number | null): SignalLevel {
  if (accuracy == null) return 'weak';
  if (accuracy <= 5) return 'strong';
  if (accuracy <= 12) return 'good';
  if (accuracy <= 25) return 'fair';
  return 'weak';
}

interface LastFix {
  lat: number;
  lon: number;
  t: number;
}

export function useSpeed() {
  const [state, setState] = useState<SpeedState>(INITIAL);

  const subRef = useRef<Location.LocationSubscription | null>(null);
  const lastFix = useRef<LastFix | null>(null);
  const totalDistance = useRef(0);
  const movingTime = useRef(0); // seconds spent actually moving
  const smoothed = useRef(0); // exponential moving average of speed (m/s)
  const tripStart = useRef<number | null>(null); // ms timestamp of first fix
  const samples = useRef<RawSample[]>([]); // raw speed samples this trip

  const handleLocation = useCallback((loc: Location.LocationObject) => {
    const { latitude, longitude, speed, accuracy } = loc.coords;
    const now = loc.timestamp ?? Date.now();

    let instantaneous = typeof speed === 'number' && speed >= 0 ? speed : null;

    const prev = lastFix.current;
    const dt = prev ? Math.max(0.2, (now - prev.t) / 1000) : 1;

    if (prev) {
      const moved = haversineMeters(prev.lat, prev.lon, latitude, longitude);
      const goodAccuracy = accuracy == null || accuracy <= MAX_USABLE_ACCURACY;

      if (moved >= MIN_MOVE_METERS && goodAccuracy) {
        totalDistance.current += moved;
        movingTime.current += dt;
        if (instantaneous == null) {
          instantaneous = moved / dt;
        }
      } else if (moved < MIN_MOVE_METERS) {
        // Treat as stationary regardless of a noisy OS speed value.
        instantaneous = instantaneous != null && instantaneous < 0.5 ? 0 : instantaneous ?? 0;
      }
    }

    lastFix.current = { lat: latitude, lon: longitude, t: now };

    // Spike rejection: don't let a single fix imply impossible acceleration.
    let raw = instantaneous ?? 0;
    const prevSmoothed = smoothed.current;
    const maxDelta = MAX_ACCEL_MPS2 * dt;
    if (Math.abs(raw - prevSmoothed) > maxDelta) {
      raw = prevSmoothed + Math.sign(raw - prevSmoothed) * maxDelta;
    }
    if (raw < STOP_THRESHOLD_MPS) raw = 0;

    // Exponential smoothing; react faster when slowing down for responsiveness.
    const alpha = raw < prevSmoothed ? 0.5 : 0.35;
    const speedMps = raw === 0 ? 0 : prevSmoothed + alpha * (raw - prevSmoothed);
    smoothed.current = speedMps;

    const distanceM = totalDistance.current;
    const avgMps = movingTime.current > 0 ? distanceM / movingTime.current : 0;

    // Record this sample for the trip graph, keeping only the last 4 hours.
    if (tripStart.current == null) tripStart.current = now;
    const elapsed = (now - tripStart.current) / 1000;
    samples.current.push({ t: elapsed, mps: speedMps });
    while (
      samples.current.length > 1 &&
      elapsed - samples.current[0].t > FOUR_HOURS_SEC
    ) {
      samples.current.shift();
    }
    const history = buildSeries(samples.current);

    setState((s) => ({
      ...s,
      speedMps,
      maxMps: Math.max(s.maxMps, speedMps),
      avgMps,
      distanceM,
      accuracyM: accuracy ?? null,
      signal: signalFromAccuracy(accuracy ?? null),
      hasFix: true,
      history,
    }));
  }, []);

  const start = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState((s) => ({ ...s, permission: 'denied' }));
        return;
      }
      setState((s) => ({ ...s, permission: 'granted', error: null }));

      subRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 0,
        },
        handleLocation
      );
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Unable to start GPS tracking.',
      }));
    }
  }, [handleLocation]);

  const reset = useCallback(() => {
    totalDistance.current = 0;
    movingTime.current = 0;
    lastFix.current = null;
    smoothed.current = 0;
    tripStart.current = null;
    samples.current = [];
    setState((s) => ({
      ...s,
      speedMps: 0,
      maxMps: 0,
      avgMps: 0,
      distanceM: 0,
      history: [],
    }));
  }, []);

  useEffect(() => {
    start();
    return () => {
      subRef.current?.remove();
      subRef.current = null;
    };
  }, [start]);

  return { ...state, reset, retry: start };
}

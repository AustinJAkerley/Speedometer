import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { haversineMeters } from '../utils/units';

export type PermissionState = 'pending' | 'granted' | 'denied';

/** GPS signal quality, derived from the horizontal accuracy of each fix. */
export type SignalLevel = 'weak' | 'fair' | 'good' | 'strong';

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

    setState((s) => ({
      ...s,
      speedMps,
      maxMps: Math.max(s.maxMps, speedMps),
      avgMps,
      distanceM,
      accuracyM: accuracy ?? null,
      signal: signalFromAccuracy(accuracy ?? null),
      hasFix: true,
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
    setState((s) => ({
      ...s,
      speedMps: 0,
      maxMps: 0,
      avgMps: 0,
      distanceM: 0,
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

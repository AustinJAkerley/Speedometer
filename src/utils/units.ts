export type Unit = 'mph' | 'kmh';

const MPS_TO_MPH = 2.2369362920544;
const MPS_TO_KMH = 3.6;
const METERS_PER_MILE = 1609.344;
const METERS_PER_KM = 1000;

/** Convert a speed in meters/second to the chosen display unit. */
export function speedFromMps(mps: number, unit: Unit): number {
  const v = mps * (unit === 'mph' ? MPS_TO_MPH : MPS_TO_KMH);
  return v < 0 ? 0 : v;
}

/** Convert a speed in mph to the chosen display unit. */
export function speedFromMph(mph: number, unit: Unit): number {
  return unit === 'mph' ? mph : mph * (MPS_TO_KMH / MPS_TO_MPH);
}

/** Convert a speed expressed in the display unit back to mph. */
export function mphFromDisplay(value: number, unit: Unit): number {
  return unit === 'mph' ? value : value * (MPS_TO_MPH / MPS_TO_KMH);
}

/** Convert a distance in meters to the chosen display unit. */
export function distanceFromMeters(meters: number, unit: Unit): number {
  return meters / (unit === 'mph' ? METERS_PER_MILE : METERS_PER_KM);
}

export function speedLabel(unit: Unit): string {
  return unit === 'mph' ? 'mph' : 'km/h';
}

export function distanceLabel(unit: Unit): string {
  return unit === 'mph' ? 'mi' : 'km';
}

/**
 * Great-circle distance in meters between two lat/lng points (Haversine).
 * Used as a fallback when the OS does not report an instantaneous speed.
 */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Unit } from './utils/units';

const KEYS = {
  unit: '@speedometer/unit',
  limit: '@speedometer/limitMph',
} as const;

/** Default speed limit in mph. 0 means "no limit". */
export const DEFAULT_LIMIT_MPH = 20;

export interface Preferences {
  unit: Unit;
  /** User-set speed limit in mph (0 = no limit). */
  limitMph: number;
}

export async function loadPreferences(): Promise<Partial<Preferences>> {
  try {
    const [unit, limit] = await Promise.all([
      AsyncStorage.getItem(KEYS.unit),
      AsyncStorage.getItem(KEYS.limit),
    ]);
    const parsedLimit = limit != null ? Number(limit) : undefined;
    return {
      unit: unit === 'mph' || unit === 'kmh' ? unit : undefined,
      limitMph:
        parsedLimit != null && Number.isFinite(parsedLimit) && parsedLimit >= 0
          ? parsedLimit
          : undefined,
    };
  } catch {
    return {};
  }
}

export async function saveUnit(unit: Unit): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.unit, unit);
  } catch {
    // Ignore persistence failures; preference stays for the session.
  }
}

export async function saveLimit(limitMph: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.limit, String(limitMph));
  } catch {
    // Ignore persistence failures; preference stays for the session.
  }
}

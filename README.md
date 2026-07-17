# Speedometer No Ads — GPS Speedometer

A simple, offline speedometer for **golf carts, e-scooters, and e-bikes**, built with
[Expo](https://expo.dev) (React Native). It reads your device GPS to show your current
speed on a large dial, tracks trip stats, and warns you when you exceed a vehicle's
recommended speed limit.

**No backend. No accounts. No tracking.** Everything runs on-device and nothing is ever
uploaded.

---

## Features

- Large, glanceable circular speedometer (mph or km/h)
- Vehicle presets with speed-limit warnings: Golf Cart, E-Scooter, E-Bike, Free Ride
- Live trip stats: max speed, average speed, and distance
- Haptic buzz when you cross the recommended limit
- Screen stays awake while riding
- Remembers your unit and vehicle choice between sessions (local storage)

## Tech stack

- Expo SDK 54 / React Native 0.81 / React 19 (runs in the current Expo Go app)
- `expo-location` — GPS speed and position
- `react-native-svg` — the gauge dial
- `expo-keep-awake`, `expo-haptics`, `@react-native-async-storage/async-storage`

---

## Run it locally

```bash
npm install
npx expo start
```

Then:

- **Expo Go (fastest):** install the Expo Go app on your phone and scan the QR code.
  Location works in Expo Go, so you can test the speedometer immediately.
- **iOS Simulator / Android Emulator:** press `i` or `a` in the terminal. Simulators
  report a fixed location, so you won't see real speed — test on a physical device.

> Tip: for real speed readings, open the app on a phone and take it for a ride.

Useful scripts:

```bash
npm run typecheck   # TypeScript check
npm run doctor      # Expo project health check
```

---

## Project structure

```
App.tsx                     App shell, layout, and state wiring
src/
  hooks/useSpeed.ts         GPS tracking + speed/distance math
  components/
    Gauge.tsx               SVG speedometer dial
    StatCard.tsx            Max / Avg / Distance cards
    VehiclePicker.tsx       Vehicle preset selector
    UnitToggle.tsx          mph / km/h switch
  constants/vehicles.ts     Vehicle presets and speed limits
  utils/units.ts            Unit conversions + haversine distance
  storage.ts                Local preference persistence
  theme.ts                  Colors, spacing, radii
```

---

## Publishing to the App Store & Google Play

This project is configured for **[EAS Build & Submit](https://docs.expo.dev/eas/)**,
the standard way to build and ship Expo apps to both stores. You do **not** need a Mac to
build for iOS — EAS builds in the cloud.

See [PUBLISHING.md](./PUBLISHING.md) for the full step-by-step guide, and
[PRIVACY.md](./PRIVACY.md) for the privacy policy you'll link in both store listings.

### Quick start

```bash
# 1. Install the EAS CLI and sign in (create a free Expo account first)
npm install -g eas-cli
eas login

# 2. Link this project to your Expo account (fills in extra.eas.projectId in app.json)
eas init

# 3. Production builds
eas build --platform android --profile production   # -> .aab for Google Play
eas build --platform ios --profile production       # -> signed build for App Store

# 4. Submit to the stores
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

### Before you build — change the app identity

The bundle identifiers in [app.json](./app.json) use a placeholder owner
(`com.austinakerley.speedometer`). Update these to match your own developer accounts:

- `expo.ios.bundleIdentifier`
- `expo.android.package`
- `expo.name` / `expo.slug` if you want a different name

You will also need paid developer accounts:

- **Apple Developer Program** — $99/year — https://developer.apple.com/programs/
- **Google Play Console** — $25 one-time — https://play.google.com/console/signup

# App Review Information — Speedometer No Ads

Paste the section below into the **Notes** field of the **App Review Information**
section in App Store Connect. Reuse it for future submissions.

- **App:** Speedometer No Ads
- **Bundle ID:** com.speedometer.no.ads.app

---

## 1. Screen recording

A screen recording captured on a physical iPhone running the latest iOS is
attached. It starts by launching the app and shows the typical user flow:

- Launching the app and the location permission prompt appearing
- Granting **While Using the App** location access
- The live speedometer gauge updating with current speed while moving
- The Max / Avg / Distance stats updating during a trip
- The trip graph (speed over time) filling in with highs and lows
- Setting a speed limit (tapping the number to type it, or using +/-)
- Switching units (mph / km/h) and resetting the trip

Flows that require additional demonstration and whether they apply:

- **Sensitive-data / capability prompt:** YES — the app requests **location
  (When In Use)**. This prompt is shown at the start of the recording.
- Account registration/login/deletion: none.
- Paid content, purchases, or subscriptions: none.
- User-generated content, reporting, or blocking: none.
- App Tracking Transparency: none (the app does no tracking).

## 2. Devices and operating systems tested

- iPhone 15 Pro — iOS 18 (physical device) *(replace with the exact model/OS you record on)*
- iPhone SE (2nd gen) — iOS 18 (physical device)
- iOS Simulator (iPhone 15, iPhone SE) for layout checks

## 3. Purpose and target audience

Speedometer No Ads is a clean, ad-free GPS speedometer for golf carts,
e-scooters, and e-bikes. It solves the problem of knowing your real speed on
small vehicles that often have no built-in speedometer, and lets riders track a
trip's max speed, average speed, distance, and a speed-over-time graph. Users can
set a speed limit that turns the gauge red and buzzes when exceeded. The target
audience is riders of low-speed personal vehicles who want an accurate,
distraction-free, privacy-respecting speedometer with no ads or accounts. Its
value is simplicity, accuracy, and privacy — everything runs on-device.

## 4. Setup and access instructions

No login, credentials, or sample files are required — all features are available
immediately on launch.

- Launch the app and allow location access when prompted (**While Using the
  App**). Location is required to calculate speed.
- The main gauge shows your current speed. Move the device (walk, ride, or drive)
  to see it update; a clear outdoor GPS signal gives the best accuracy.
- Tap the **speed limit** button to set a limit — tap the number to type it
  directly, or use the +/- steppers and presets.
- Use the unit toggle to switch between mph and km/h.
- Tap **Reset trip** to clear the max, average, distance, and graph.

Note for indoor review: GPS speed requires real movement outdoors, so the gauge
may read 0 when stationary or indoors. The screen recording demonstrates live
speed captured outdoors.

## 5. External services, tools, or platforms

None. The app does not use any data providers, authentication services, payment
processors, analytics, ads, or AI services, and it makes no network requests.
Speed and distance are derived entirely on-device from the operating system's
Core Location (GPS) data. App preferences (units and selected vehicle) are stored
locally using on-device storage (AsyncStorage). The app is built with React
Native / Expo.

## 6. Regional differences

There are none. The app functions identically in all regions. Users can choose
mph or km/h manually, but there is no region-locked content, no server-side
features, and no localized behavior. It works fully offline everywhere.

## 7. Regulated industry / protected third-party material

Not applicable. The app operates in no regulated industry and includes no
protected third-party material. All data is user/device generated; there is no
licensed or third-party protected content.

---

## Purpose string (Guideline 5.1.1)

The app requests location with this string, which explains the reason and how the
data is used:

> "Speedometer No Ads uses your location to calculate your speed and trip
> distance. Your location never leaves your device."

Location is used **only while the app is in the foreground**; it is never stored
to a file, sent over the internet, or shared with any third party.

## Reviewer-issue checklist (for your reference)

- **5.1.1 Purpose strings:** Location purpose string is set (see above) and
  describes both the reason and the on-device usage.
- **2.3.3 Screenshots:** Use App Store screenshots showing the actual gauge,
  stats, and trip graph in use — not a splash/title screen.
- **2.1 Accessing the app:** No login is required; this is stated explicitly above.
- **3.1.2 Subscription information:** Not applicable — the app has no
  subscriptions or in-app purchases.

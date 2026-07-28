# Publishing Speedometer No Ads to the App Store & Google Play

This guide walks through shipping Speedometer No Ads to both stores using **EAS (Expo Application
Services)**. EAS builds your native binaries in the cloud, so you can build for iOS
**without a Mac**.

---

## 0. One-time prerequisites

| What | Cost | Where |
| --- | --- | --- |
| Expo account | Free | https://expo.dev/signup |
| Apple Developer Program | $99 / year | https://developer.apple.com/programs/ |
| Google Play Console | $25 one-time | https://play.google.com/console/signup |

Install the CLI and sign in:

```bash
npm install -g eas-cli
eas login
```

---

## 1. Set your app identity

Edit [app.json](./app.json) and replace the placeholder identifiers with your own:

```jsonc
"ios":     { "bundleIdentifier": "com.YOURNAME.speedometer" },
"android": { "package":          "com.YOURNAME.speedometer" }
```

- Use reverse-domain style (e.g. `com.yourcompany.speedometer`).
- These must be **globally unique** and cannot be changed after the first store release.
- Optionally change `expo.name` (display name) and `expo.slug`.

Then link the project to your Expo account (this writes `extra.eas.projectId`):

```bash
eas init
```

---

## 2. App icon & splash

The template ships with placeholder icons in [assets/](./assets). Before release, replace:

- `assets/icon.png` — 1024×1024, no transparency (App Store requirement)
- `assets/android-icon-foreground.png` / `-background.png` / `-monochrome.png`
- `assets/splash-icon.png`

You can generate a full icon set from a single image at https://icon.kitchen or with
`npx @expo/configure-splash-screen`.

---

## 3. Build

```bash
# Android App Bundle (.aab) for Google Play
eas build --platform android --profile production

# iOS build for the App Store (EAS will help create signing certificates)
eas build --platform ios --profile production
```

The first iOS build prompts you to log in with your Apple ID and generates the required
distribution certificate and provisioning profile automatically.

To test on your own device first, use the preview profile:

```bash
eas build --platform android --profile preview   # installable .apk
```

---

## 4. Submit to the stores

```bash
eas submit --platform android --profile production
eas submit --platform ios --profile production --latest
```

### Google Play (first submission)

1. In the [Play Console](https://play.google.com/console), create the app.
2. Create a Google Cloud **service account** key and give it access, so `eas submit` can
   upload automatically. Guide: https://docs.expo.dev/submit/android/
3. Alternatively, download the `.aab` from your EAS build page and upload it manually
   under **Production → Create new release**.

#### The 12-tester rule (new personal accounts)

This is the requirement that catches most first-time publishers. If your Google Play
**developer account is a personal account created after 13 Nov 2023**, you cannot ship
straight to production — Google requires a **closed test** first:

- Recruit **at least 12 testers** who **opt in and stay opted in for 14 consecutive days**.
- Only after those 14 days does Google unlock **Apply for production access**, which is
  then granted after a short review.

How to satisfy it:

1. **Testing → Closed testing → Create a new track** (or use the default "Closed testing –
   Alpha").
2. Add testers by **email list**, or create a **Google Group** and add its address —
   anyone in the group counts, which makes recruiting easier.
3. Share the **opt-in URL** and have each tester install through the **Play Store link**
   (a raw APK/web install does **not** count — they must accept the invite and install via
   Google Play).
4. Keep the test running untouched for the full 14 days. If active testers drop below 12
   during the window, the clock effectively resets.
5. When eligible: **Production → Apply for production access**, answer Google's questions
   about your testing, and submit. Approval usually takes a few days.

> Internal testing does **not** count toward the 12-tester / 14-day requirement — only a
> **closed** (or open) test does. Internal testing is still handy for your own device checks
> in parallel.

**Finding 12 testers — common approaches:**

- **Friends, family & coworkers** — the simplest source. Send them the opt-in link and make
  sure each one installs *through the Play Store* and keeps the app for the full 14 days.
- **Secondary accounts you own** — a couple of your own extra Google accounts can count, but
  you still need real people to comfortably reach 12.
- **Tester-exchange communities** — many solo devs are stuck on the same rule and test each
  other's apps. Common spots: the subreddits **r/androiddev** and **r/betatesting**, and
  dedicated "Google Play closed testing exchange" groups on **Reddit, Discord, and
  Telegram**. You add each other as testers and return the favor.
- **A Google Group as the tester list** — create a public Google Group, add its address to
  the closed track's tester list, then share the group's join link. Anyone who joins counts,
  so you can point a whole community at one link instead of collecting 12 individual emails.
- **Your own network** — share the opt-in link anywhere you have a following (social,
  Discord servers for the app's niche, etc.).

Google wants **genuine** testing: testers must install via Google Play and stay opted in for
14 continuous days. If the active count dips below 12 the timer can reset, so **over-recruit
(aim for ~15)** to cover drop-off. Avoid bought/bot testers — that risks account termination.

### App Store (first submission)

1. In [App Store Connect](https://appstoreconnect.apple.com), create the app record with
   the same bundle identifier.
2. Run `eas submit` (or upload via Transporter). The build appears under **TestFlight**.
3. Fill in the store listing, then submit for review.

#### What Apple requires before it will go public

Getting the build into TestFlight is only step one — the app stays private until you
complete the listing and pass review. Have these ready:

- **Screenshots** for a **6.7" iPhone** (required). Speedometer No Ads is iPhone-only
  (`supportsTablet: false`), so **no iPad screenshots** are needed. Capture from a
  simulator if you don't own the device.
- **Listing text** — app name, subtitle, promotional text, description, keywords. A
  **support URL** is required; a marketing URL is optional. (Draft copy is in §5.)
- **App Privacy ("nutrition label")** — complete the *App Privacy* questionnaire. The app
  collects nothing, so declare **Data Not Collected**; it must match your privacy policy.
- **Privacy policy URL** — required even for a no-data app. Host [PRIVACY.md](./PRIVACY.md)
  publicly and paste the link.
- **Age rating** — answer the content questionnaire to generate a rating.
- **Export compliance** — handled: `ITSAppUsesNonExemptEncryption` is `false` in
  [app.json](./app.json), so you won't be prompted on every upload.
- **Pricing & availability** — set the price (free) and the territories to release in.
- **App Review information** — reviewer contact details and notes. The app has no login, so
  no demo account is required.
- **Reviewer notes (required)** — a written description covering the 7 points Apple asks for
  (purpose, testing devices, external services, etc.). See **App Review prerequisites** below
  and paste it into the Notes field.
- **Demo screen recording (required)** — a capture on a physical device showing the app
  launching and the core user flow (including the location prompt). See **Recording the demo
  with Expo Go** below.

When the listing is complete and a build is attached, hit **Add for Review → Submit**.
Unlike Google Play, Apple has **no minimum tester count or waiting period** — TestFlight is
optional and only for your own beta feedback.

#### App Review prerequisites

Apple treats reviewer context as a **prerequisite**, right alongside your screenshots — a
submission without it commonly gets rejected. Two deliverables are required for every
submission:

- a **written reviewer note** (the 7 points below), pasted into **App Review Information →
  Notes** in App Store Connect, and
- a **demo screen recording** of the app on a physical device (see **Recording the demo with
  Expo Go**).

Draft note answers for Speedometer No Ads are below — update the device list before each
submission.

1. **Screen recording** — record on a physical device running the latest iOS. Start by
   launching the app, then walk the core flow: **pick a vehicle → grant the location
   prompt → view the live GPS speed → trigger the over-limit buzz → view top/average speed
   and trip distance**. Speedometer requests **location** to compute speed, so **the
   location permission prompt must appear in the recording**. The app has **no** account /
   login / deletion flow, **no** paid content or subscriptions, and **no** user-generated
   content, so none of those need to be shown.
2. **Devices & OS tested** — e.g. *"iPhone 15 (iOS 18.5), iPhone SE 3rd gen (iOS 18.4)."*
   Fill in the actual models/versions you tested before submitting.
3. **Purpose & audience** — Speedometer No Ads is a clean GPS speedometer for golf carts,
   e-scooters, and e-bikes — vehicles that usually lack a built-in speedometer. Users pick
   their vehicle, glance at their current speed, and get a gentle buzz if they exceed the
   recommended limit, plus top speed, average speed, and trip distance. It works fully
   offline with no ads or accounts. Audience: riders of small electric/utility vehicles.
4. **Setup & access** — no login, credentials, or sample files required. On first launch,
   grant the location permission, pick a vehicle, and start moving to see live speed.
5. **External services** — **none**. Speed is computed on-device from the phone's GPS. No
   data providers, authentication services, payment processors, or AI services are used.
   (Expo/EAS is used only to build the binary, not at runtime.)
6. **Regional differences** — none. The app behaves identically in all regions; there is no
   region-locked content or feature gating. Speed **units (mph/km/h)** are user-selectable
   in-app and are not tied to region.
7. **Regulated industry / protected material** — not applicable. The app is not in a
   regulated industry and includes no protected third-party material.

#### Recording the demo with Expo Go

You don't need a production build to capture the required demo video — you can record the
app running in **Expo Go** on your phone:

1. Install **Expo Go** from the App Store on a physical iPhone running the latest iOS.
2. In the project, start the dev server:
   ```bash
   npx expo start
   ```
   Scan the QR code with the iPhone Camera app to open Speedometer inside Expo Go.
3. Enable iOS screen recording: **Settings → Control Center**, add **Screen Recording**,
   then open Control Center and tap the record button.
4. Record the full core flow, **starting from opening the app**: pick a vehicle → grant the
   location prompt → view the live GPS speed → trigger the over-limit buzz → view the stats.
   Record outdoors or while actually moving so real GPS speed shows.
5. Stop the recording (tap the red status bar → Stop). The video saves to **Photos** — trim
   it if needed, then attach/reference it in App Store Connect.

Notes:
- In Expo Go the location prompt appears as **Expo Go** asking for location (not your app's
  own purpose string). That's fine to demonstrate the flow, but for a capture that shows
  your app's real permission dialog and shipping UI, install a **preview or TestFlight
  build** and record it the same way.
- Make sure location permission is granted, otherwise the speed readout stays at zero.

#### Preventing common review rejections

- **2.1 Bugs & crashes** — Apple reviews on physical devices. Test on each supported device
  before submitting; use TestFlight to shake out real-device issues (especially GPS/location
  behavior) first.
- **2.1 Accessing the app** — the app has no accounts, so no demo credentials are needed. If
  a login is ever added, provide up-to-date demo credentials (one set per account type) in
  the Notes field.
- **2.3.3 Screenshots** — show the app **in use** (the live speed readout with a vehicle
  selected), not the splash screen, title art, or a permission prompt.
- **3.1.2 Subscription information** — not applicable; there are no auto-renewable
  subscriptions. If one is added, display each subscription's title, length, and price plus
  links to the Terms of Use and privacy policy.
- **5.1.1 Purpose strings** — Speedometer requests **location**, so the purpose string must
  clearly explain *why* and give an example, e.g. *"Speedometer No Ads uses your location to
  calculate your current speed and trip distance; it is never stored or shared."* The strings
  are already set in [app.json](./app.json) — keep them accurate if the usage changes.

---

## 5. Store listing checklist

Both stores require the following. Draft text is provided to get you started.

- **App name:** Speedometer No Ads
- **Subtitle / short description:** Speedometer for golf carts, e-scooters & e-bikes
- **Description:**
  > Speedometer No Ads turns your phone into a clean, easy-to-read GPS speedometer for golf carts,
  > e-scooters, and e-bikes. Pick your vehicle, glance at your speed, and get a gentle
  > buzz if you go over its recommended limit. Track your top speed, average speed, and
  > trip distance. Works fully offline — no account, no ads, no data collection.
- **Keywords:** speedometer, gps speed, golf cart, e-scooter, e-bike, speed tracker
- **Category:** Navigation (or Utilities)
- **Screenshots:** required for each device size. Capture from a device/simulator.
  - A **6.7" iPhone** set is required by Apple (iPad not needed — the app is iPhone-only).
  - Google Play needs at least 2 phone screenshots.
- **Privacy policy URL:** host [PRIVACY.md](./PRIVACY.md) somewhere public (e.g. GitHub
  Pages) and link it in both listings.

### Privacy / data safety disclosures

Speedometer No Ads collects **no data**. Declare accordingly:

- **Apple "App Privacy":** Data Not Collected.
- **Google Play "Data safety":** No data collected, no data shared.
- **Location permission:** used only in the foreground to compute speed; never stored or
  transmitted. The permission strings are already set in [app.json](./app.json).

---

## 6. Shipping updates

- **JS-only changes** (UI, logic): push instantly with EAS Update — no store review:
  ```bash
  eas update --branch production --message "Describe your change"
  ```
- **Native changes** (new permissions, SDK bumps, icons): bump the version and rebuild.
  `production` builds auto-increment the iOS build number / Android version code
  (see [eas.json](./eas.json)). Update `expo.version` in [app.json](./app.json) for the
  user-facing version string.

Full EAS docs: https://docs.expo.dev/eas/

---

## 7. Automated build + one-click publish (GitHub Actions)

The workflow at [.github/workflows/publish.yml](./.github/workflows/publish.yml) does this
on every push to `main`:

1. **Build job (automatic):** typechecks, then runs `eas build` for iOS + Android.
2. **Publish job (manual gate):** waits for your approval, then `eas submit`s the finished
   builds to both stores.

So a push builds everything and gets it ready; publishing is a single **Approve** click.

### One-time setup

1. **Create an Expo access token:** https://expo.dev/settings/access-tokens
   → add it to the repo as a secret named `EXPO_TOKEN`
   (**GitHub → Settings → Secrets and variables → Actions → New repository secret**).

2. **Create the approval gate:** GitHub → **Settings → Environments → New environment**
   → name it `production` → enable **Required reviewers** and add yourself.
   This is what makes the publish job pause with a **Review deployments → Approve** button.

3. **Link the project & credentials once, locally** (so CI can run non-interactively):
   ```bash
   eas init                 # writes extra.eas.projectId into app.json (commit this)
   eas build --profile production --platform all   # first run sets up signing credentials
   ```
   - iOS: log in with your Apple ID when prompted; EAS stores the certificates.
   - Android: EAS generates a keystore. For `eas submit` to upload automatically, add a
     Google Play **service account** key (see §4) via `eas credentials` or the EAS website.

### How it feels day to day

```
git push origin main
  → GitHub Actions builds iOS + Android (~20–40 min)
  → the "Submit to the stores" job shows "Waiting for review"
  → you click Approve
  → it uploads to App Store Connect (TestFlight) and Google Play
```

> Tip: to build automatically but **only publish some pushes**, just don't approve the ones
> you want to skip — the build is still there to approve later, or download from EAS.


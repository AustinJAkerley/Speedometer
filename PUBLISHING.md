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
eas submit --platform ios --profile production
```

### Google Play (first submission)

1. In the [Play Console](https://play.google.com/console), create the app.
2. Create a Google Cloud **service account** key and give it access, so `eas submit` can
   upload automatically. Guide: https://docs.expo.dev/submit/android/
3. Alternatively, download the `.aab` from your EAS build page and upload it manually
   under **Production → Create new release**.

### App Store (first submission)

1. In [App Store Connect](https://appstoreconnect.apple.com), create the app record with
   the same bundle identifier.
2. Run `eas submit` (or upload via Transporter). The build appears under **TestFlight**.
3. Fill in the store listing, then submit for review.

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
  - iPhone 6.7" and 6.5" are required by Apple.
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


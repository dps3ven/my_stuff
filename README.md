# 🎸 My Stuff

Keep track of your musical instrument collection — from that beat-up acoustic in the corner to your prized vintage Les Paul. My Stuff lets you catalog, photograph, and manage everything you own, all stored privately on your device.

---

## What it does

- **Profiles** — pick or create a profile; no account or password required
- **Add instruments** with type, make, model, nickname, year, serial number, condition, and estimated value
- **Attach photos** from your library, or take a new one with the camera (mobile)
- **Browse your collection** grouped by instrument type with inline image previews
- **Tap any item** for a full detail view with a scrollable image gallery
- **All Photos gallery** — see every photo across your collection, with total storage used
- **Dashboard stats** — item count, total value, and photo storage at a glance
- **Edit or delete** instruments at any time
- Works on **iOS, Android, and web**

---

## Security & privacy

Your data never leaves your device. Everything is stored locally using AsyncStorage on mobile and localStorage on web — there is no backend, account, or server.

- **Biometric unlock** (Face ID / Touch ID / fingerprint) gates profile access on mobile
- **Permission-gated media** — the app requests photo library / camera access before use and only reads photos you explicitly choose
- **Served over HTTPS** — the web app is delivered over HTTPS by AWS Amplify. Hardened response headers (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) via an Amplify `customHttp.yml` are planned but **not yet configured**
- **Dependency & code scanning** in CI (npm audit, CodeQL)

### Known limitations (beta)

- **No at-rest encryption yet.** Data is stored locally in plain `AsyncStorage` (mobile) / `localStorage` (web). It isn't uploaded anywhere, but it isn't encrypted on disk either. Planned post-beta: passphrase-derived key (PBKDF2) with AES encryption of stored data.
- On web there is no biometric/hardware keystore, so the native-only protections (Face ID / Touch ID) don't apply to the browser version.

---

## Getting started

### Prerequisites
- Node.js 20+
- npm
- Expo Go app, or a dev build, on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Install and run

```bash
# Install dependencies
npm install

# Start the dev server
npx expo start
```

Then scan the QR code with your phone's camera (iOS) or the Expo Go app (Android).

### Run on web

```bash
npx expo start --web
```

---

## Project layout

```
├── App.js                        # Navigation + web layout/scroll setup
├── screens/
│   ├── LoginScreen.js            # Profile select / create, biometric unlock
│   ├── DashboardScreen.js        # Home with stats, quick guide, privacy info
│   ├── AddInstrumentScreen.js    # Add or edit an instrument (step wizard)
│   ├── InventoryScreen.js        # Full collection view, grouped by type
│   ├── InstrumentDetailScreen.js # Detail view with image gallery
│   └── PhotoGalleryScreen.js     # All photos across the collection
├── utils/
│   ├── storage.js                # localStorage on web, AsyncStorage on mobile
│   └── instrumentSchema.js       # Zod schema + helpers for the Add/Edit form
├── components/
│   └── Skeleton.js               # Loading placeholders
├── docs/
│   └── auto-versioning.md        # Proposed (not yet built) auto-version setup
├── babel.config.js               # Babel preset (babel-preset-expo)
├── jest.setup.js                 # Jest mocks for native modules
├── amplify.yml                   # AWS Amplify build config
└── app.json                      # Expo config (version shown on login screen)
```

---

## Versioning

The app version (shown at the bottom of the login screen) lives in both `package.json` and `app.json` (`expo.version`). Bump `package.json` with:

```bash
npm version patch   # bug fixes       (0.1.0 → 0.1.1)
npm version minor   # new features    (0.1.0 → 0.2.0)
npm version major   # breaking change (0.1.0 → 1.0.0)
```

`npm version` updates `package.json` only, so update `app.json` (and the native build numbers) to match by hand. An optional setup to automate this on merges to `main` — a `sync-version.js` helper plus an "Auto Version" workflow driven by [conventional commits](https://www.conventionalcommits.org/) — is documented in [`docs/auto-versioning.md`](docs/auto-versioning.md) but is **not yet implemented**.

---

## Deployment (AWS Amplify)

The web app is built and hosted on AWS Amplify. The build runs `npx expo export --platform web` and serves the `dist/` output (see `amplify.yml`). Hardened security response headers (via an Amplify `customHttp.yml`) are planned but not yet added.

---

## Build for the App Store

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Build
eas build --platform ios      # iOS
eas build --platform android  # Android

# Submit
eas submit --platform ios
eas submit --platform android
```

---

## Testing

Unit and component tests run on [Jest](https://jestjs.io/) with the `jest-expo` preset and [React Native Testing Library](https://callstack.github.io/react-native-testing-library/).

```bash
npm test           # run once
npm run test:watch # watch mode
npm run test:ci    # CI mode (used by GitHub Actions)
```

- Tests live in `__tests__/` folders next to the code they cover (e.g. `utils/__tests__/`, `components/__tests__/`).
- Native modules (AsyncStorage, image picker, biometrics, gesture handler, linear gradient, screen orientation) are mocked in `jest.setup.js`.
- `react`, `react-dom`, and `react-test-renderer` are pinned to the exact version React Native 0.81.5 bundles (19.1.0); they must match or the renderer throws a version-mismatch error.

---

## CI / GitHub Actions

| Workflow | Trigger | What it does |
|---|---|---|
| **CI** | Push / PR to main, develop | Syntax check + Jest unit tests + web build |
| **CodeQL** | Push / PR to main, develop | Static security analysis |
| **Security** | PR to main, develop + weekly | `npm audit` — fails on high/critical |

Dependabot (`.github/dependabot.yml`) opens weekly PRs for security updates.

---

## Tech stack

| | |
|---|---|
| Framework | React Native + Expo SDK 55 |
| Navigation | React Navigation (Stack) |
| Camera / Photos | expo-image-picker |
| Biometrics | expo-local-authentication |
| Forms & validation | React Hook Form + Zod |
| Storage | AsyncStorage (mobile) / localStorage (web) |
| Testing | Jest + jest-expo + React Native Testing Library |
| Hosting | AWS Amplify (web) |

---

## Beta & launch checklist

Notes for moving from the Amplify web build toward native beta testing (TestFlight / Google Play) and, later, a public store launch.

### Distributing the beta

| Platform | Fastest beta path | Requires |
|---|---|---|
| iOS | **TestFlight** — testers install the TestFlight app and tap an invite link | Apple Developer Program ($99/yr). Internal testers (up to 100) are instant; external testers (up to 10,000, public link) need a one-time Beta App Review per version. Builds expire after 90 days |
| Android | **EAS internal distribution** — share an APK via URL/QR, no store needed | Expo account (EAS free tier). No Play account required for direct-install APKs |
| Android (store-like) | **Google Play internal testing** track | Play Console ($25 one-time). Near-instant for up to 100 testers |
| Web | **Amplify URL** — zero install, instant | Already live; doesn't exercise native-only features (biometrics, camera, mobile image paths) |

Build/submit with EAS (an `eas.json` with `preview` + `production` profiles is still needed — not yet in the repo):

```bash
eas build --platform ios --profile preview       # iOS ad-hoc / TestFlight
eas build --platform android --profile preview   # direct-install APK
```

> **Tell testers up front:** the app currently has **no backup** and stores data locally with ephemeral image paths on mobile, so a reinstall or device change loses their catalog. See the data-loss note below.

### Apple Developer account type

- **Individual / Sole Proprietor** — enrolls under your **legal personal name**, which is shown publicly as the seller on the App Store. No D-U-N-S number, faster approval, cheapest. Best for getting the beta running.
- **Organization** — shows a **company name** as the seller and supports team roles, but requires a registered legal entity **and** a D-U-N-S number (DBAs/trade names are rejected).
- You **cannot cleanly convert** Individual → Organization later (separate enrollment + app transfer). If an LLC is the endgame, decide before public launch, not before the beta.

### Keeping personal info private

- Info collected by Apple at signup is **private to Apple**. Only the **App Store product page** is public — and that only exists at public launch, **not during TestFlight beta**.
- **Seller name** (shown globally): pseudonyms aren't allowed for Individual accounts. Showing a company name instead of your legal name requires enrolling as an **Organization (LLC + D-U-N-S)**.
- **EU DSA trader info** (address / phone / email, shown publicly on EU listings): for a sole proprietor this can default to your home address. Options: use a **business/registered-agent address** (not a PO box), a **VoIP number**, and a dedicated email; or **exclude the EU** from territory availability. Info must be truthful and verified — Apple removes listings with false trader data.

### Data & storage caveats (pre-launch)

- **No user-facing backup/restore yet.** Recommended path: local export/import to a shareable file (`expo-file-system` + `expo-sharing`, import via `expo-document-picker`).
- **Mobile images are stored as ImagePicker cache URIs**, which the OS can purge and which don't survive reinstall. Fix before relying on native storage: copy picked/captured images into `FileSystem.documentDirectory` and store persistent relative paths.
- **No at-rest encryption yet** (see Known limitations). The backup archive is the natural first place to apply the planned PBKDF2 + AES.
- If going native-only long term, consider moving metadata to `expo-sqlite` and blobs to the filesystem so both the app and backups scale.

---

## License

MIT

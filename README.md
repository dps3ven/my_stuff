# 🎸 My Stuff

Keep track of your musical instrument collection — from that beat-up acoustic in the corner to your prized vintage Les Paul. My Stuff lets you catalog, photograph, and manage everything you own, all stored privately on your device.

---

## What it does

- **Add instruments** with type, make, model, serial number, condition, and estimated value
- **Attach photos** from your camera roll or take a new one right in the app
- **Browse your collection** organized by instrument type with inline image previews
- **Tap any item** for a full detail view with a scrollable image gallery
- **Edit or delete** instruments at any time
- **Reset your password** if you forget it
- Works on **iOS, Android, and web** — install it as a PWA on any browser

---

## Security

Your data never leaves your device. Everything is stored locally using AsyncStorage on mobile and localStorage on web.

- Passwords are hashed with SHA-256 — never stored in plain text
- Biometric MFA (Face ID / Touch ID / fingerprint) required on mobile login
- Minimum 12-character password on signup
- Input sanitization to prevent XSS
- Session cleared on logout

---

## Getting started

### Prerequisites
- Node.js 18+
- npm
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

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
├── App.js                        # Navigation setup
├── screens/
│   ├── LoginScreen.js            # Sign up, login, password reset
│   ├── DashboardScreen.js        # Home with stats and quick actions
│   ├── AddInstrumentScreen.js    # Add or edit an instrument
│   ├── InventoryScreen.js        # Full collection view
│   └── InstrumentDetailScreen.js # Detail view with image gallery
├── utils/
│   └── storage.js                # localStorage on web, AsyncStorage on mobile
├── web/
│   ├── index.html                # PWA shell
│   ├── manifest.json             # PWA manifest
│   └── service-worker.js         # Offline caching
└── app.json                      # Expo config
```

---

## Install as a web app (PWA)

No app store needed — install directly from your browser:

- **Chrome / Edge**: Click the install icon in the address bar
- **iOS Safari**: Tap Share → Add to Home Screen
- **Android Chrome**: Tap Menu → Add to Home Screen

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

## CI / GitHub Actions

| Workflow | Trigger | What it does |
|---|---|---|
| **CI** | Push / PR to main | Syntax check + web build |
| **CodeQL** | Push / PR to main | Static security analysis |
| **Security** | PR to main | `npm audit` for high severity vulnerabilities |

---

## Tech stack

| | |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navigation | React Navigation (Stack) |
| Camera / Photos | expo-image-picker |
| Biometrics | expo-local-authentication |
| Password hashing | crypto-js (SHA-256) |
| Storage | AsyncStorage (mobile) / localStorage (web) |

---

## License

MIT

This might need some help
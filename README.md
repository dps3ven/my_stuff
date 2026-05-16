# My Stuff - Musical Instrument Inventory

A cross-platform mobile and web app for managing your musical instrument collection. Built with React Native and Expo.

## Features

- User authentication with password hashing (SHA-256)
- Biometric MFA on iOS (Face ID/Touch ID) and Android (fingerprint)
- Add instruments with type, make, model, serial number, condition, and value
- Attach multiple images from photo library or device camera
- View inventory organized by instrument type
- Detailed instrument view with full-size image gallery
- Edit and delete instruments
- Forgot password / reset flow
- Progressive Web App (PWA) installable on desktop and mobile browsers
- All data stored locally (localStorage on web, AsyncStorage on mobile)

## Screens

- **Login** - Sign up, login, and password reset with MFA
- **Dashboard** - Overview with instrument count, total value, and quick actions
- **Add Instrument** - Form with image capture and selection
- **Inventory** - Grouped list by instrument type with inline images
- **Instrument Detail** - Full detail view with scrollable image gallery

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
npm install
```

### Running

```bash
# Web
npx expo start --web

# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Physical device (scan QR with Expo Go app)
npx expo start
```

## Tech Stack

- React Native 0.81
- Expo SDK 54
- React Navigation (Stack)
- expo-image-picker (photo library + camera)
- expo-local-authentication (biometric MFA)
- crypto-js (SHA-256 password hashing)
- AsyncStorage (mobile) / localStorage (web)

## Project Structure

```
├── App.js                  # Navigation setup
├── screens/
│   ├── LoginScreen.js      # Auth with MFA
│   ├── DashboardScreen.js  # Home with stats
│   ├── AddInstrumentScreen.js  # Add/edit form
│   ├── InventoryScreen.js  # Grouped list view
│   └── InstrumentDetailScreen.js  # Detail view
├── utils/
│   └── storage.js          # Platform-aware storage wrapper
├── web/
│   ├── index.html          # PWA shell
│   ├── manifest.json       # PWA manifest
│   └── service-worker.js   # Offline caching
└── app.json                # Expo config
```

## Security

- Passwords hashed with SHA-256 (never stored in plain text)
- Password hash excluded from session storage
- Biometric MFA required on mobile devices
- Minimum 12-character password on signup
- Input sanitization to prevent XSS
- Auth guards redirect unauthenticated users to login
- Session cleared on logout

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## PWA Installation

The web version can be installed as a standalone app:

- **Chrome/Edge**: Click the install icon in the address bar
- **iOS Safari**: Share → Add to Home Screen
- **Android Chrome**: Menu → Add to Home Screen

## License

MIT

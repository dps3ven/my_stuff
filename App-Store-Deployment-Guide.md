# My Inventory — App Store Deployment Guide

## 1. Developer Accounts

### Apple App Store
- Enroll in the Apple Developer Program at https://developer.apple.com/programs/
- Cost: $99/year
- Approval takes up to 48 hours

### Google Play Store
- Register at https://play.google.com/console
- Cost: $25 one-time fee
- Approval is typically faster than Apple

---

## 2. App Configuration (app.json)

Update `app.json` with the following platform-specific fields:

### iOS
- `ios.bundleIdentifier` (e.g., `com.yourname.myinventory`)
- `ios.buildNumber` and `version`
- App icon: 1024x1024 PNG, no transparency
- Splash screen image
- `ios.infoPlist.NSPhotoLibraryUsageDescription` — required permission string for photo library access

### Android
- `android.package` (e.g., `com.yourname.myinventory`)
- `android.versionCode` — integer, must increment with each release
- Adaptive icon: foreground and background layers
- `android.permissions` for photo access

---

## 3. Code Preparation

- Test thoroughly on physical iOS and Android devices
- Verify photo library permissions work correctly on both platforms
- Consider replacing AsyncStorage with a more robust solution (SQLite or cloud backend) if scaling beyond personal use
- Client-side password hashing (CryptoJS) is not secure for production multi-user apps — consider a real backend with server-side authentication
- Ensure all error handling uses platform-appropriate alerts (already handled in current codebase)

---

## 4. Build with EAS (Expo Application Services)

### Install and configure
```
npm install -g eas-cli
eas login
eas build:configure
```

### Build for both platforms
```
eas build --platform all
```

Or individually:
```
eas build --platform ios
eas build --platform android
```

EAS handles provisioning profiles, certificates, and signing automatically through its managed flow.

---

## 5. App Store Connect Setup (Apple)

URL: https://appstoreconnect.apple.com

### Required assets
- Screenshots for 6.7" and 5.5" displays (minimum)
- App description and keywords
- Category: Utilities or Music
- Privacy policy URL
- Support URL

### Review notes
- Provide a demo account (username and password) for the review team since login is required
- Ensure the photo library permission description clearly explains why the app needs access

---

## 6. Google Play Console Setup

URL: https://play.google.com/console

### Required assets
- Screenshots for phone, 7" tablet, and 10" tablet (recommended)
- Feature graphic: 1024x500
- App description and keywords
- Category: Tools or Music & Audio

### Required forms
- Content rating questionnaire (~5 minutes)
- Data safety form — declare what data is collected/stored locally
- Privacy policy URL (same one used for Apple)
- Target audience and content settings

### Review notes
- Provide a demo account if login is gated
- Google's review is typically faster (hours to a couple of days)

---

## 7. Submit

### Upload builds
```
eas submit --platform all
```

Or individually:
```
eas submit --platform ios
eas submit --platform android
```

### After upload
- **Apple**: In App Store Connect, attach the build to your app listing, fill in all metadata, and submit for review
- **Google**: In Google Play Console, promote the build to production track, complete all store listing details, and submit for review

---

## 8. Review Timelines

| Platform     | Typical Review Time | Notes                                      |
|--------------|--------------------|--------------------------------------------|
| Apple        | 1–3 days           | First submissions may take longer           |
| Google Play  | Hours to 2 days    | Less strict, but enforces data safety forms |

---

## 9. Common Rejection Reasons to Avoid

- Missing privacy policy URL
- Missing or vague photo library permission description
- No demo account provided for reviewers
- App considered "trivial" (unlikely for this app given inventory management + image features)
- Inaccurate data safety declarations (Google)

---

## 10. Release Checklist

- [ ] Apple Developer account enrolled and approved
- [ ] Google Play Developer account registered
- [ ] app.json updated with iOS and Android configuration
- [ ] App icon and splash screen created
- [ ] Privacy policy hosted at a public URL
- [ ] Tested on physical iOS device
- [ ] Tested on physical Android device
- [ ] EAS CLI installed and configured
- [ ] Production builds created for both platforms
- [ ] App Store Connect listing complete with screenshots and metadata
- [ ] Google Play Console listing complete with screenshots and metadata
- [ ] Demo account credentials documented for reviewers
- [ ] Builds submitted for review on both platforms

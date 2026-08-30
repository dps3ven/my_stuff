# My Stuff — Backlog

Deferred, higher-effort items we've identified but haven't tackled yet.
Ordered roughly by user impact. (Smaller refactors are handled ad hoc.)

## 1. Data backup / export
No way for a user to back up their collection. Recommended: local export/import
to a shareable file (JSON, images embedded as base64 for portability), via
`expo-file-system` + `expo-sharing`, import via `expo-document-picker`. Optional
passphrase encryption. Biggest real gap for a beta.

## 2. Ephemeral mobile image paths
On mobile, photos are stored as ImagePicker **cache** URIs (`file://…`), which
the OS can purge and which don't survive reinstall or device transfer. Fix: copy
picked/captured images into `FileSystem.documentDirectory` and store persistent
relative paths. Prerequisite for reliable backups.

## 3. Real Reverb valuation proxy
The value estimate currently uses a **mock** (`utils/valuation.js`). To go live:
- Deploy `functions/reverb-valuation/` (Lambda/Amplify function) with a
  `REVERB_TOKEN` env var (Reverb personal token, `public` scope).
- Set `EXPO_PUBLIC_VALUATION_URL` to the deployed endpoint and rebuild.
- `estimateValue()` already falls back to the mock when the URL is unset.
- Caution: don't present mock numbers as real Reverb data in production.

### Getting a Reverb personal access token
Source: https://www.reverb-api.com/docs/authentication
1. Sign in at reverb.com (create an account if needed).
2. User menu -> **My Profile**.
3. **API & Integrations** tab -> **Generate New Token**.
4. Name it and select scopes. For this proxy, **`public`** is all we need
   (read publicly available data, i.e. active listings). No listings/orders
   scopes required.
5. Token is created. Reverb personal tokens **do not expire**.

Then: put the token in the function's `REVERB_TOKEN` env var (server-side only,
never in the app bundle). Requests use `Authorization: Bearer <token>` and
`Accept-Version: 3.0` (already handled in `functions/reverb-valuation/index.js`).
Before relying on it, confirm the intended use fits Reverb's API Terms of
Service (rate limits / usage).

## 4. Dependency vulnerabilities (Dependabot)
`npm audit` reports ~19 findings (16 high / 3 moderate), all **transitive
dev/build tooling** (metro, postcss, nanoid, js-yaml, etc.), not shipped app
code. They fail the `security.yml` gate on PRs. Fix via `overrides` for safe
transitive versions and/or an Expo SDK bump. Not an app-store blocker.

## 5. Design-system rollout
Shared pattern extracted into `styles/theme.js` + `components/Button.js`
(`PrimaryButton` / `GhostButton`), modeled on the profile setup screen.
Applied so far: **Dashboard**. Remaining: **Instrument Detail** (yellow/blue
buttons), **Inventory**, **Add Stuff** (footer nav). One screen per commit.

---

## Notes / gotchas
- **Working-tree revert:** the review environment reverts agent edits to
  `screens/*` files after the turn (via `git restore`), and only **commits**
  survive. Recipe that works: edit → `git commit` → `git checkout HEAD -- <file>`
  to resync, all in the same turn. Non-`screens/` files land normally.
- App-store readiness (separate from the above): Apple Developer account type
  (Individual vs Org), EU DSA trader info, `eas.json` build profiles, favicon
  reference in `app.json`. See README "Beta & launch checklist".

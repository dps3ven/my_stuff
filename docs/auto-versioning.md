# Auto Versioning (proposed, not yet implemented)

> **Status:** This document describes an *optional* setup that does **not exist in the
> repo yet**. The README's CI table references an "Auto Version" workflow and a
> `scripts/sync-version.js` helper, but neither file is currently present. This doc
> captures how to implement them if/when we decide to.

## Goal

Automatically bump the app version on merges to `main`, deriving the bump size from
[Conventional Commit](https://www.conventionalcommits.org/) prefixes, and keep
`app.json` in sync with `package.json` (including native build numbers) so releases
don't depend on someone remembering to run `npm version`.

## How versioning works today (manual)

The version shown on the login screen comes from `app.json` (`expo.version`). Today it
is bumped by hand:

```bash
npm version patch   # bug fixes       (0.1.0 -> 0.1.1)
npm version minor   # new features    (0.1.0 -> 0.2.0)
npm version major   # breaking change (0.1.0 -> 1.0.0)
```

`npm version` updates `package.json` (and `package-lock.json`) and creates a git tag,
but it does **not** touch `app.json` or the native build numbers. That gap is what the
proposed `sync-version.js` script and workflow would close.

## Conventional commit → bump mapping

| Commit prefix on merged commits | Version bump |
|---|---|
| `fix:` | patch |
| `feat:` | minor |
| `feat!:`, `fix!:`, or a `BREAKING CHANGE:` footer | major |
| anything else (`chore:`, `docs:`, `refactor:`, `test:`, …) | no release |

If a range of commits contains a mix, the highest applicable bump wins.

## Piece 1 — `scripts/sync-version.js`

Keeps `app.json` aligned with `package.json` and increments the native build counters
(`ios.buildNumber`, `android.versionCode`) so every published build is unique.

```js
// scripts/sync-version.js
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const appPath = path.join(__dirname, '..', 'app.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));

const version = pkg.version;
app.expo.version = version;

// Bump native build identifiers so each store build is unique.
app.expo.ios = app.expo.ios || {};
const nextBuild = String((parseInt(app.expo.ios.buildNumber, 10) || 0) + 1);
app.expo.ios.buildNumber = nextBuild;

app.expo.android = app.expo.android || {};
app.expo.android.versionCode = (parseInt(app.expo.android.versionCode, 10) || 0) + 1;

fs.writeFileSync(appPath, JSON.stringify(app, null, 2) + '\n');
console.log(`Synced app.json to version ${version} (iOS build ${nextBuild}, Android versionCode ${app.expo.android.versionCode}).`);
```

Wire it to run automatically after every `npm version` by adding to `package.json`:

```json
{
  "scripts": {
    "version": "node scripts/sync-version.js && git add app.json"
  }
}
```

With that `version` lifecycle script, a plain `npm version minor` also updates
`app.json` and stages it into the version commit.

## Piece 2 — `.github/workflows/auto-version.yml`

Runs on pushes to `main`, inspects the new commits, computes the bump, and, if a
release is warranted, runs `npm version` (which triggers the sync script above) and
pushes the result back.

```yaml
name: Auto Version

on:
  push:
    branches: [main]

# Needed to push the version commit/tag back to the repo.
permissions:
  contents: write

jobs:
  version:
    runs-on: ubuntu-latest
    # Never react to the bot's own version commit (prevents an infinite loop).
    if: "!startsWith(github.event.head_commit.message, 'chore(release):')"
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Determine bump from conventional commits
        id: bump
        run: |
          RANGE="${{ github.event.before }}..${{ github.sha }}"
          MSGS=$(git log --format=%s%n%b "$RANGE")
          BUMP=""
          if echo "$MSGS" | grep -qE '(^|\n)(feat|fix)!:|BREAKING CHANGE'; then
            BUMP=major
          elif echo "$MSGS" | grep -qE '^feat(\(|:)'; then
            BUMP=minor
          elif echo "$MSGS" | grep -qE '^fix(\(|:)'; then
            BUMP=patch
          fi
          echo "bump=$BUMP" >> "$GITHUB_OUTPUT"

      - name: Apply version bump
        if: steps.bump.outputs.bump != ''
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          npm version ${{ steps.bump.outputs.bump }} -m "chore(release): %s [skip ci]"
          git push --follow-tags
```

Notes:
- The `if:` guard on the job and the `chore(release):` commit message prevent the
  workflow from re-triggering itself.
- `[skip ci]` keeps other workflows from re-running on the bot's release commit.
- `permissions: contents: write` (plus allowing Actions to push in repo settings) is
  required for the push. For protected branches you may need a PAT or a GitHub App
  token instead of the default `GITHUB_TOKEN`.

## Enabling checklist

1. Add `scripts/sync-version.js` and the `version` lifecycle script to `package.json`.
2. Add `.github/workflows/auto-version.yml`.
3. In repo settings → Actions → General, allow workflows to **read and write**.
4. Adopt conventional commit messages (`feat:`, `fix:`, `feat!:`/`BREAKING CHANGE:`).
5. Update the README versioning section to reflect that bumps are now automatic.

## Alternatives

- **[release-please](https://github.com/googleapis/release-please)** — Google's action
  that opens a release PR and maintains a changelog; heavier but batteries-included.
- **[semantic-release](https://semantic-release.gitbook.io/)** — fully automated
  npm-oriented releases; powerful but more configuration and opinionated.

The script + workflow above is intentionally minimal and dependency-free, which suits a
small Expo app; switch to one of the above if you later want changelogs or richer
release automation.

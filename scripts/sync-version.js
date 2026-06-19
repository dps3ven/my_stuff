#!/usr/bin/env node
/*
 * Syncs app.json's expo.version (and native build numbers) with the version
 * in package.json. Run automatically by npm's "version" lifecycle hook, so
 * `npm version patch|minor|major` updates everything in one step.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const appJsonPath = path.join(root, 'app.json');
const app = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

const version = pkg.version;
app.expo = app.expo || {};
app.expo.version = version;

// Bump native build identifiers so store builds stay monotonic.
if (app.expo.ios) {
  const current = parseInt(app.expo.ios.buildNumber || '0', 10) || 0;
  app.expo.ios.buildNumber = String(current + 1);
}
if (app.expo.android) {
  app.expo.android.versionCode = (app.expo.android.versionCode || 0) + 1;
}

fs.writeFileSync(appJsonPath, JSON.stringify(app, null, 2) + '\n');
console.log(`Synced app.json to version ${version}`);

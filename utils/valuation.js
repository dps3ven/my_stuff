// Value estimation for instruments.
//
// STATUS: this is a MOCK that returns a deterministic, realistic-looking value
// range so the Add/Edit UX can be built and reviewed before the backend exists.
// The response shape matches exactly what the real Reverb-backed proxy will
// return, so switching to live data is a one-function change (see notes below).
//
// ── How the real version will work ───────────────────────────────────────────
// Reverb's official API (https://api.reverb.com/api) exposes ACTIVE listings
// (current asking prices), not the sold-price Price Guide. So we estimate value
// from real active listings for the make/model/year and report a range.
//
// The Reverb personal access token MUST NOT ship in the client, so calls go
// through a thin serverless proxy (e.g., an AWS Lambda / Amplify function) that
// holds the token and does:
//
//   GET https://api.reverb.com/api/listings?query=<make model year>&per_page=50
//   Headers:
//     Accept-Version: 3.0
//     Authorization: Bearer <REVERB_PERSONAL_TOKEN>   // 'public' scope is enough
//
// then extracts listings[].price.amount, computes low / median / high, and
// returns the JSON below. The client would call estimateValue(), which would
// simply `fetch(PROXY_URL + query)` instead of the mock. Nothing else changes.
//
// PRIVACY: a lookup sends the make/model/year off the device (no photos, no
// personal data, nothing stored server-side). It should stay opt-in.

const CONDITION_FACTOR = {
  New: 1.15,
  Excellent: 1.0,
  Good: 0.85,
  Fair: 0.65,
  Poor: 0.45,
  '': 0.9,
};

// Small stable hash so the same instrument always returns the same mock range.
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function mockEstimate({ type, brand, model, year, condition }) {
  const key = `${type}|${brand}|${model}`.toLowerCase();
  const h = hashString(key);
  // Base "typical asking price" between ~$180 and ~$2600, stable per model.
  const base = 180 + (h % 2400);
  const condFactor = CONDITION_FACTOR[condition] ?? CONDITION_FACTOR[''];

  // Older gear drifts up a touch (vintage), very rough.
  const yr = parseInt(year, 10);
  const yearFactor = Number.isFinite(yr) && yr > 1900
    ? 1 + Math.max(0, (2005 - yr)) * 0.004
    : 1;

  const median = Math.round((base * condFactor * yearFactor) / 5) * 5;
  const low = Math.round((median * 0.78) / 5) * 5;
  const high = Math.round((median * 1.28) / 5) * 5;
  const count = 6 + (h % 40); // pretend we sampled this many active listings

  return {
    currency: 'USD',
    low,
    median,
    high,
    count,
    source: 'Reverb (active listings)',
    asOf: new Date().toISOString(),
    query: `${brand} ${model}${year ? ' ' + year : ''}`.trim(),
    estimated: true,
  };
}

/**
 * Estimate an instrument's market value.
 * @returns {Promise<{currency,low,median,high,count,source,asOf,query,estimated}>}
 */
export function estimateValue({ type, brand, model, year, condition } = {}) {
  if (!type || !brand || !model) {
    return Promise.reject(new Error('Add a type, make, and model first.'));
  }
  // Simulate network latency so the loading state is exercised.
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockEstimate({ type, brand, model, year, condition })), 650);
  });
}
